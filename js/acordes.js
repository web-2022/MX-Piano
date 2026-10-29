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
function energiaNota(buf, w, sampleRate, midi, desvio, excluir = null) {
  const f0 = midiAFrecuencia(midi + desvio);
  const separacionMin = (2.6 * sampleRate) / buf.length; // ancho del lóbulo de la ventana
  let total = 0;
  let pesos = 0;
  for (let h = 1; h <= 4; h++) {
    const fh = f0 * h * Math.sqrt(1 + 0.0003 * h * h);  // inarmonicidad del piano
    if (fh > 2300) break;
    if (fh * 0.0595 < separacionMin) continue;          // vecinas demasiado cerca: no sirve
    if (excluir?.some((fx) => Math.abs(1200 * Math.log2(fh / fx)) < 45)) continue;
    const peso = 1 / h;
    total += peso * potencia(buf, w, sampleRate, fh);
    pesos += peso;
  }
  return pesos ? total / pesos : 0;
}

// ¿Están sonando estas notas?
//   buf: muestras recientes (ideal ~170 ms, por ejemplo 8192 a 48 kHz), sin el golpe del martillo.
//   esperadas: números MIDI.  desvio: desafinación del piano en semitonos (del detector).
// Devuelve { ok, faltan: [midi], sobran: [midi], detalle }.
export function verificarNotas(buf, sampleRate, esperadas, { desvio = 0 } = {}) {
  const w = hann(buf.length);
  const cache = new Map();
  const E = (m) => {
    if (!cache.has(m)) cache.set(m, energiaNota(buf, w, sampleRate, m, desvio));
    return cache.get(m);
  };

  const conjunto = new Set(esperadas);
  const maximo = Math.max(...esperadas.map(E));
  const detalle = {};
  const faltan = [];
  for (const m of esperadas) {
    const e = E(m);
    // Vecinas que no son parte del acorde
    const vecinas = [m - 1, m + 1].filter((v) => !conjunto.has(v)).map(E);
    const contraste = e / Math.max(1e-12, ...vecinas);
    const relativa = e / Math.max(1e-12, maximo);
    detalle[m] = { contraste: +contraste.toFixed(1), relativa: +relativa.toFixed(3) };
    if (contraste < 2.5 || relativa < 0.04) faltan.push(m);
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
      const e = energiaNota(buf, w, sampleRate, m, desvio, parciales);
      if (!e) continue; // todos sus armónicos coinciden con los pedidos: no se puede saber
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
