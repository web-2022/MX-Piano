// Sintetizador de "pianos de prueba" para comprobar la detección sin micrófono.
import { notaAMidi, midiAFrecuencia } from '../js/notas.js';

export const SR = 48000;

// Ruido reproducible
let semilla = 12345;
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;

export function nuevaSenal(segundos) { return new Float32Array(Math.ceil(segundos * SR)); }

// Nota de piano: armónicos ligeramente desafinados (inarmonicidad), caída exponencial,
// y el "clic" del martillo al inicio.
// corte: la nota se corta en seco al terminar "dur" (la cuerda vuelve a ser golpeada).
export function piano(s, nota, t0, { vol = 0.25, dur = 1.5, cents = 0, corte = false } = {}) {
  const midi = typeof nota === 'number' ? nota : notaAMidi(nota);
  const f = midiAFrecuencia(midi) * Math.pow(2, cents / 1200);
  const i0 = Math.floor(t0 * SR);
  const largo = Math.floor((dur + 0.4) * SR);
  const B = 0.0003;
  for (let k = 1; k <= 10; k++) {
    const fk = f * k * Math.sqrt(1 + B * k * k);
    if (fk > SR / 2.2) break;
    const a = vol / Math.pow(k, 1.1) * (midi < 55 && k === 1 ? 0.5 : 1); // graves: fundamental débil
    const tau = 1.4 / Math.sqrt(k);
    const fase = Math.random() * 6.28;
    for (let i = 0; i < largo && i0 + i < s.length; i++) {
      const t = i / SR;
      let env = Math.min(1, t / 0.003) * Math.exp(-t / tau);
      if (t > dur) env *= corte ? 0 : Math.exp(-(t - dur) / 0.08); // soltar la tecla (apagador)
      s[i0 + i] += a * env * Math.sin(2 * Math.PI * fk * t + fase);
    }
  }
  // Martillo: ráfaga aguda de 6 ms
  let prev = 0;
  for (let i = 0; i < 0.006 * SR; i++) {
    const r = azar();
    s[i0 + i] += vol * 0.5 * (r - prev) * (1 - i / (0.006 * SR));
    prev = r;
  }
}

export function ruido(s, nivel) { for (let i = 0; i < s.length; i++) s[i] += nivel * azar(); }

// Voz que habla (como una TV): tono que sube y baja, sílabas que se prenden y apagan.
export function voz(s, t0, t1, vol = 0.08) {
  for (let i = Math.floor(t0 * SR); i < Math.min(s.length, t1 * SR); i++) {
    const t = i / SR;
    const f0 = 190 + 50 * Math.sin(2 * Math.PI * 0.9 * t) + 25 * Math.sin(2 * Math.PI * 3.1 * t);
    const silaba = Math.max(0, Math.sin(2 * Math.PI * 4 * t));
    let v = 0;
    for (let k = 1; k <= 6; k++) v += Math.sin(2 * Math.PI * f0 * k * t + k) / k;
    s[i] += vol * silaba * v;
  }
}

// Filtros de un polo, como aproximación a los BiquadFilter del navegador.
export function filtrar(s) {
  const out = new Float32Array(s.length);
  const aHP = Math.exp(-2 * Math.PI * 50 / SR);
  const aLP = Math.exp(-2 * Math.PI * 2400 / SR);
  let hp = 0, xPrev = 0, lp = 0;
  for (let i = 0; i < s.length; i++) {
    hp = aHP * (hp + s[i] - xPrev);
    xPrev = s[i];
    lp = (1 - aLP) * hp + aLP * lp;
    out[i] = lp;
  }
  return out;
}

