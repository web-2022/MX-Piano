// Sonidos que produce la app: nota de referencia, éxito y ánimo.
// Devuelven cuántos milisegundos duran, para silenciar el micrófono mientras suenan.
import { midiAFrecuencia } from './notas.js';

function tono(ctx, frecuencia, inicio, duracion, volumen = 0.3, nodos = null) {
  const salida = ctx.createGain();
  salida.gain.setValueAtTime(0.0001, inicio);
  salida.gain.exponentialRampToValueAtTime(volumen, inicio + 0.01);
  salida.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  salida.connect(ctx.destination);

  // Timbre sencillo parecido a un piano: fundamental + armónicos que bajan.
  [[1, 1], [2, 0.45], [3, 0.2], [4, 0.1]].forEach(([armonico, amplitud]) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frecuencia * armonico;
    const g = ctx.createGain();
    g.gain.value = amplitud;
    osc.connect(g).connect(salida);
    osc.start(inicio);
    osc.stop(inicio + duracion + 0.05);
    nodos?.push(osc);
  });
}

export function tocarNota(ctx, midi, duracion = 1.2, volumen = 0.3) {
  tono(ctx, midiAFrecuencia(midi), ctx.currentTime, duracion, volumen);
  return duracion * 1000;
}

export function sonidoExito(ctx) {
  const t = ctx.currentTime;
  [72, 76, 79].forEach((m, i) => tono(ctx, midiAFrecuencia(m), t + i * 0.08, 0.35, 0.18));
  return 600;
}

export function sonidoFinal(ctx) {
  const t = ctx.currentTime;
  [72, 76, 79, 84].forEach((m, i) => tono(ctx, midiAFrecuencia(m), t + i * 0.13, 0.6, 0.2));
  return 1200;
}

// ---- Programación precisa para el modo ritmo ----
// "cuando" es un tiempo del AudioContext (segundos). "nodos" guarda lo programado para poder detenerlo.

export function programarNota(ctx, midi, cuando, duracion, nodos, volumen = 0.3) {
  tono(ctx, midiAFrecuencia(midi), cuando, Math.max(0.2, duracion), volumen, nodos);
}

let ruido = null;
export function programarClic(ctx, cuando, acento, nodos, volumen = 1) {
  // Clic corto y agudo (ruido filtrado): el detector de notas no lo confunde con una nota.
  if (!ruido || ruido.sampleRate !== ctx.sampleRate) {
    ruido = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  }
  const fuente = ctx.createBufferSource();
  fuente.buffer = ruido;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'highpass';
  filtro.frequency.value = acento ? 2500 : 3500;
  const g = ctx.createGain();
  g.gain.value = (acento ? 0.9 : 0.5) * volumen;
  fuente.connect(filtro).connect(g).connect(ctx.destination);
  fuente.start(cuando);
  nodos?.push(fuente);
}

export function detenerTodo(nodos) {
  for (const n of nodos || []) {
    try { n.stop(); } catch { /* ya terminó */ }
  }
  if (nodos) nodos.length = 0;
}
