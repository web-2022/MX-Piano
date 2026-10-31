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
  const detalle = {};
  const faltan = [];
  for (const m of esperadas) {
    const e = E(m);
    // Vecinas que no son parte del acorde
    const vecinasIdx = [m - 1, m + 1].filter((v) => !conjunto.has(v));
    const vecinas = vecinasIdx.map(E);
    let contraste = e / Math.max(1e-12, ...vecinas);
    // La vecina suena solo porque la tocó antes (ya sonaba igual antes del golpe): se compara con lo nuevo.
    if (antes && !pedal && contraste < 2.5) {
      // Solo vale si la nota pedida también es nueva (apareció con este golpe).
      const nm = nuevaE(m);
      if (nm > 0.3 * e) contraste = Math.max(contraste, nm / Math.max(1e-12, ...vecinasIdx.map(nuevaE)));
    }
    const relativa = e / Math.max(1e-12, maximo);
    detalle[m] = { contraste: +contraste.toFixed(1), relativa: +relativa.toFixed(3) };
    if (e < minimo) { faltan.push(m); detalle[m].debil = true; continue; }
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
      const nueva = (x) => Math.max(0, ahoraA(x) - energiaNota(antes, w, sampleRate, x, desvio, x === m ? propios : null, true));
      const inc = nueva(m);
      const eA = ahoraA(m);
      const incVecinas = Math.max(1e-12, ...[m - 1, m + 1].filter((v) => !conjunto.has(v)).map(nueva));
      detalle[m].nueva = +(inc / Math.max(1e-12, eA)).toFixed(2);
      detalle[m].frenteVecinas = +(inc / incVecinas).toFixed(1);
      // Al menos 30 % de su energía es nueva (volver a tocar una nota que aún suena la sube
      // ~1,5 veces; una nota que solo sigue sonando no sube) y lo nuevo no viene de una vecina.
      if (relativa < 0.04 || inc < 0.3 * eA || inc < 2 * incVecinas) faltan.push(m);
      continue;
    }
    if (contraste < 2.5 || relativa < 0.04) faltan.push(m);
  }
  if (pedal) return { ok: !faltan.length, faltan, sobran: [], detalle };

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
      if (antes) e = Math.max(0, e - energiaNota(antes, w, sampleRate, m, desvio, parciales));
      if (e > minimo * 0.3) sobran.push(m);
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
