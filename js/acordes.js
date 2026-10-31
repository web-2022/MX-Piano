// Verificación de acordes por micrófono.
//
// La app no intenta adivinar todo lo que suena (eso es muy difícil con un micrófono):
// como sabe qué notas pidió, solo comprueba si esas notas están sonando y si hay alguna
// tecla vecina de más. Para cada nota mide la energía en sus armónicos (algoritmo de
// Goertzel, que mide una sola frecuencia de forma muy barata) y la compara con las
// notas que están a medio tono, que es el error típico: tocar la tecla de al lado.
import { midiAFrecuencia, nombreNota } from './notas.js';

const ventanas = new Map();
function hann(n) {
  if (!ventanas.has(n)) {
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    ventanas.set(n, w);
  }
  return ventanas.get(n);
}

// Potencia de la señal en una frecuencia (Goertzel con ventana de Hann).
function potencia(buf, w, sampleRate, f) {
  const k = (2 * Math.PI * f) / sampleRate;
  const c = 2 * Math.cos(k);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const s0 = buf[i] * w[i] + c * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return (s1 * s1 + s2 * s2 - c * s1 * s2) / (buf.length * buf.length);
}

// Energía de una nota: suma de sus armónicos que quedan bien separados de las notas vecinas.
// (En los graves los armónicos 2 a 4 se distinguen mejor que el fundamental.)
// excluir: frecuencias que ya ocupan las notas pedidas (sus armónicos); se saltan.
// agudos: usa los armónicos 2 a 6 con igual peso (se apagan rápido, así que delatan un golpe nuevo).
function energiaNota(buf, w, sampleRate, midi, desvio, excluir = null, agudos = false) {
  const f0 = midiAFrecuencia(midi + desvio);
  const separacionMin = (2.6 * sampleRate) / buf.length; // ancho del lóbulo de la ventana
  let total = 0;
  let pesos = 0;
  for (let h = agudos ? 2 : 1; h <= (agudos ? 6 : 4); h++) {
    const fh = f0 * h * Math.sqrt(1 + 0.0003 * h * h);  // inarmonicidad del piano
    if (fh > 2300) break;
    if (fh * 0.0595 < separacionMin) continue;          // vecinas demasiado cerca: no sirve
    if (excluir?.some((fx) => Math.abs(1200 * Math.log2(fh / fx)) < 45)) continue;
    const peso = agudos ? 1 : 1 / h;
    total += peso * potencia(buf, w, sampleRate, fh);
    pesos += peso;
  }
  return pesos ? total / pesos : 0;
}

// Lo NUEVO de una nota: se suma armónico por armónico lo que creció desde antes del golpe.
// (Restar los totales fallaba: si un armónico coincide con una nota que sigue sonando fuerte y se
// apaga, esa caída anulaba el crecimiento de los demás armónicos.)
function incrementoNota(buf, antes, w, sampleRate, midi, desvio, excluir = null) {
  const f0 = midiAFrecuencia(midi + desvio);
  const separacionMin = (2.6 * sampleRate) / buf.length;
  let total = 0;
  let pesos = 0;
  let crecen = 0;
  let creceFundamental = false;
  for (let h = 1; h <= 6; h++) {
    const fh = f0 * h * Math.sqrt(1 + 0.0003 * h * h);
    if (fh > 2300) break;
    if (fh * 0.0595 < separacionMin) continue;
    if (excluir?.some((fx) => Math.abs(1200 * Math.log2(fh / fx)) < 45)) continue;
    const ahora = potencia(buf, w, sampleRate, fh);
    const previa = potencia(antes, w, sampleRate, fh);
    total += Math.max(0, ahora - previa);
    if (ahora > previa * 1.15) crecen++;
    if (h === 1 && ahora > previa * 1.3) creceFundamental = true;
    pesos++;
  }
  // Al golpear de verdad una nota crecen casi todos sus armónicos; si crece uno solo, es por otra nota.
  // (o, si el armónico principal creció con claridad, eso basta: los demás pueden "latir" con otras notas)
  if (!pesos || (crecen < Math.min(pesos, Math.max(2, pesos / 3)) && !creceFundamental)) return 0;
  return total / pesos;
}

// ¿Están sonando estas notas?
//   buf: muestras recientes (ideal ~170 ms, por ejemplo 8192 a 48 kHz), sin el golpe del martillo.
//   esperadas: números MIDI.  desvio: desafinación del piano en semitonos (del detector).
// Devuelve { ok, faltan: [midi], sobran: [midi], detalle }.
//   pedal + antes: modo pedal. "antes" es el sonido justo antes del golpe. Con pedal siguen
//   sonando las notas anteriores, así que no se buscan teclas de más: se comprueba que cada
//   nota pedida "acaba de sonar" (su energía subió con el golpe) o que destaca sobre sus vecinas.
//   minimo: energía mínima de cada nota (piso de ruido). Sin esto, el puro ruido podría "parecer" una nota.
export function verificarNotas(buf, sampleRate, esperadas, { desvio = 0, pedal = false, antes = null, minimo = 0 } = {}) {
  const w = hann(buf.length);
  const cache = new Map();
  const E = (m) => {
    if (!cache.has(m)) cache.set(m, energiaNota(buf, w, sampleRate, m, desvio));
    return cache.get(m);
  };

  // Lo que sonaba justo antes del golpe (la nota anterior que todavía no se apaga).
  // Si se conoce, las teclas vecinas y las "de más" se juzgan por lo NUEVO, no por lo que sigue sonando.
  const cacheAntes = new Map();
  const previa = (m) => {
    if (!antes) return 0;
    if (!cacheAntes.has(m)) cacheAntes.set(m, energiaNota(antes, w, sampleRate, m, desvio));
    return cacheAntes.get(m);
  };
  const nuevaE = (m) => Math.max(0, E(m) - previa(m));

  const conjunto = new Set(esperadas);
  const maximo = Math.max(...esperadas.map(E));
  // Armónicos de las notas pedidas: al medir una tecla VECINA se saltan, porque si coinciden con
  // otra nota pedida (por ejemplo, el 3.er armónico de Do3 = Sol4) la vecina "parece" sonar.
  const parcialesPedidas = [];
  for (const p of esperadas) {
    for (let k = 1; k <= 10; k++) parcialesPedidas.push(midiAFrecuencia(p + desvio) * k * Math.sqrt(1 + 0.0003 * k * k));
  }
  const cacheV = new Map();
  const EV = (v) => {
    if (!cacheV.has(v)) cacheV.set(v, energiaNota(buf, w, sampleRate, v, desvio, parcialesPedidas));
    return cacheV.get(v);
  };
  const cacheVA = new Map();
  const nuevaEV = (v) => {
    if (!antes) return EV(v);
    if (!cacheVA.has(v)) cacheVA.set(v, Math.max(0, EV(v) - energiaNota(antes, w, sampleRate, v, desvio, parcialesPedidas)));
    return cacheVA.get(v);
  };
  const detalle = {};
  const faltan = [];
  const noNuevas = [];
  for (const m of esperadas) {
    const e = E(m);
    // Vecinas que no son parte del acorde
    const vecinasIdx = [m - 1, m + 1].filter((v) => !conjunto.has(v));
    const vecinas = vecinasIdx.map(EV);
    let contraste = e / Math.max(1e-12, ...vecinas);
    // La vecina suena solo porque la tocó antes (ya sonaba igual antes del golpe): se compara con lo nuevo.
    if (antes && !pedal && contraste < 2.5) {
      // Solo vale si la nota pedida también es nueva (apareció con este golpe).
      const nm = nuevaE(m);
      // (en los graves, parte de la energía de la nota viene de otra que sigue sonando: basta 15 % nueva)
      if (nm > 0.15 * e) contraste = Math.max(contraste, nm / Math.max(1e-12, ...vecinasIdx.map(nuevaEV)));
    }
    const relativa = e / Math.max(1e-12, maximo);
    detalle[m] = { contraste: +contraste.toFixed(1), relativa: +relativa.toFixed(3) };
    // Bajo el piso de ruido: no suena. Excepción: con pedal el sonido sostenido sube el "ruido"
    // medido, y un bajo suave junto a una nota fuerte queda por debajo aunque se oiga clarísimo
    // (se acepta si destaca mucho frente a sus teclas vecinas, cosa que el ruido nunca hace).
    const claro = e > minimo * 0.1 && relativa >= 0.05 && contraste >= 8;
    if (e < minimo && !claro) { faltan.push(m); detalle[m].debil = true; continue; }
    if (pedal && antes) {
      // Energía nueva (lo que apareció con el golpe) de la nota y de sus vecinas.
      // Solo armónicos propios: los que comparte con otra nota pedida (una quinta, una octava)
      // se mezclan con ella y no sirven para saber si esta nota se volvió a tocar.
      const otras = [];
      for (const o of esperadas) {
        if (o === m) continue;
        for (let k = 1; k <= 10; k++) otras.push(midiAFrecuencia(o + desvio) * k * Math.sqrt(1 + 0.0003 * k * k));
      }
      const propios = energiaNota(buf, w, sampleRate, m, desvio, otras, true) > 0 ? otras : null;
      const ahoraA = (x) => energiaNota(buf, w, sampleRate, x, desvio, x === m ? propios : null, true);
      const inc = incrementoNota(buf, antes, w, sampleRate, m, desvio, propios);
      const eA = ahoraA(m);
      // Vecinas: sin los armónicos de las notas pedidas (si no, una vecina "crece" por culpa de otra nota pedida).
      const incVecinas = Math.max(1e-12, ...[m - 1, m + 1].filter((v) => !conjunto.has(v))
        .map((v) => incrementoNota(buf, antes, w, sampleRate, v, desvio, parcialesPedidas)));
      detalle[m].nueva = +(inc / Math.max(1e-12, eA)).toFixed(2);
      detalle[m].frenteVecinas = +(inc / incVecinas).toFixed(1);
      // Al menos 30 % de su energía es nueva (volver a tocar una nota que aún suena la sube
      // ~1,5 veces; una nota que solo sigue sonando no sube) y lo nuevo no viene de una vecina.
      if (relativa < 0.04) faltan.push(m);                       // no suena
      else if (inc < 0.12 * eA || inc < 2 * incVecinas) noNuevas.push(m); // suena, pero no se ve "nueva"
      continue;
    }
    if (contraste < 2.5 || relativa < 0.04) faltan.push(m);
  }
  if (pedal) {
    // Con pedal una nota puede quedar tapada por las que siguen sonando (comparten armónicos) y no
    // "verse" nueva aunque se tocó. En un acorde basta con que la mayoría se vea nueva y todas suenen;
    // una nota sola sí tiene que verse nueva.
    const permitidas = esperadas.length > 1 ? Math.floor(esperadas.length / 2) : 0;
    if (noNuevas.length > permitidas) faltan.push(...noNuevas);
    return { ok: !faltan.length, faltan, sobran: [], detalle };
  }

  // Teclas de más: el error típico es apoyar también la tecla de al lado.
  // Se miran las teclas a uno y dos semitonos de cada nota pedida, usando solo los
  // armónicos que no coinciden con los de las notas pedidas (si no, se confundirían).
  const sobran = [];
  if (!faltan.length) {
    const parciales = [];
    for (const e of esperadas) {
      for (let k = 1; k <= 10; k++) parciales.push(midiAFrecuencia(e + desvio) * k * Math.sqrt(1 + 0.0003 * k * k));
    }
    const minimo = Math.min(...esperadas.map(E));
    const candidatas = new Set();
    for (const e of esperadas) for (const d of [-2, -1, 1, 2]) if (!conjunto.has(e + d)) candidatas.add(e + d);
    for (const m of candidatas) {
      let e = energiaNota(buf, w, sampleRate, m, desvio, parciales);
      if (!e) continue; // todos sus armónicos coinciden con los pedidos: no se puede saber
      // Si ya sonaba antes del golpe, es la nota anterior apagándose: solo cuenta lo que aumentó.
      if (antes) {
        // Debe haber crecido de verdad: una nota que se está apagando nunca es "de más".
        const previa = energiaNota(antes, w, sampleRate, m, desvio, parciales);
        e = e > previa * 1.5 ? e - previa : 0;
      }
      if (e > Math.max(minimo * 0.3, maximo * 0.05)) sobran.push(m);
    }
  }
  return { ok: !faltan.length && !sobran.length, faltan, sobran, detalle };
}

// Texto para el niño: "Falta Mi" / "Falta Mi y Sol" / "Sobra Fa".
export function textoAcorde({ faltan, sobran }) {
  const lista = (ms) => {
    const n = [...new Set(ms.map(nombreNota))];
    return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : n[0];
  };
  if (faltan.length) return `Falta ${lista(faltan)}`;
  if (sobran.length) return `Sobra ${lista(sobran)}`;
  return '';
}

// ¿Qué nota acaba de aparecer? Se usa cuando se toca una nota mientras la anterior todavía suena:
// la mezcla de dos notas confunde al detector de tono (puede "oír" una nota más grave que nadie tocó).
// Compara el sonido de ahora con el de justo antes del golpe y busca la nota cuya energía creció más.
//   ahora, antes: ~170 ms de sonido (por ejemplo 8192 muestras a 48 kHz).
// Devuelve { midi, seguridad } o null si no hay una nota nueva clara.
export function notaNueva(ahora, antes, sampleRate, { desvio = 0, minimo = 0, desde = 36, hasta = 96 } = {}) {
  const w = hann(ahora.length);
  const cache = new Map();
  // Energía NUEVA en una frecuencia (ahora menos antes del golpe).
  const nuevaEn = (f) => {
    const k = Math.round(f * 4);
    if (!cache.has(k)) {
      const e = potencia(ahora, w, sampleRate, f);
      cache.set(k, [e, Math.max(0, e - (antes ? potencia(antes, w, sampleRate, f) : 0))]);
    }
    return cache.get(k);
  };
  // Puntaje: lo nuevo en el armónico 1 por lo nuevo en el mejor de los armónicos 2 y 3 (media
  // geométrica). Una nota "fantasma" más grave no tiene su propio armónico 1: puntaje ~0. Se usa el
  // mejor de 2 y 3 porque uno puede coincidir con un armónico de la nota anterior (que no "crece").
  const puntaje = (m) => {
    const f0 = midiAFrecuencia(m + desvio);
    const arm = [1, 2, 3].map((h) => nuevaEn(f0 * h * Math.sqrt(1 + 0.0003 * h * h)));
    const n1 = arm[0][1];
    return { p: Math.sqrt(Math.max(1e-30, n1 * Math.max(arm[1][1], arm[2][1]))), e: (arm[0][0] + arm[1][0] + arm[2][0]) / 3, n1, e1: arm[0][0] };
  };
  const lista = [];
  for (let m = desde; m <= hasta; m++) lista.push({ m, ...puntaje(m) });
  let mejor = lista.reduce((a, b) => (b.p > a.p ? b : a));
  // ¿Una octava más abajo? Si esa nota también tiene su propio armónico 1 nuevo, la tocada era la grave
  // (el armónico 2 de una nota grave puede parecer otra nota una octava arriba).
  const baja = lista[mejor.m - 12 - desde];
  if (baja && baja.n1 > 0.15 * mejor.n1 && baja.p > 0.2 * mejor.p) mejor = baja;
  // Misma tecla otra vez, justo después de soltarla: los agudos de la anterior ya se apagaron y
  // "parecen nuevos" (sale la octava de arriba). Si la fundamental de abajo suena fuerte y creció, es esa.
  else if (baja && baja.n1 > 0 && baja.e1 > 0.25 * mejor.e1 && baja.n1 > 0.05 * mejor.n1) mejor = baja;
  if (!mejor || mejor.p <= 1e-15 || mejor.e < minimo) return null;
  const vecina = (d) => lista[mejor.m + d - desde]?.p || 0;
  const contraste = mejor.p / Math.max(1e-20, vecina(-1), vecina(1));
  if (contraste < 3) return null;
  return { midi: mejor.m, seguridad: contraste };
}

// ¿Cuánto creció la fundamental de una nota desde antes del golpe? (ahora / antes; >1,3 = se volvió a tocar)
export function crecimientoFundamental(ahora, antes, sampleRate, midi, desvio = 0) {
  const w = hann(ahora.length);
  const f0 = midiAFrecuencia(midi + desvio);
  return potencia(ahora, w, sampleRate, f0) / Math.max(1e-20, potencia(antes, w, sampleRate, f0));
}
