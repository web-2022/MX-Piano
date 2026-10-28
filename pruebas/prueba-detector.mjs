// Prueba del detector con sonidos de piano sintéticos (sin micrófono).
// Ejecutar en la carpeta del proyecto:   node pruebas/prueba-detector.mjs
import { NucleoDetector } from '../js/detector.js';
import { notaAMidi, midiAFrecuencia, nombreConOctava } from '../js/notas.js';

const SR = 48000;
const HOP = 800; // 60 cuadros por segundo

// Ruido reproducible
let semilla = 12345;
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;

function nuevaSenal(segundos) { return new Float32Array(Math.ceil(segundos * SR)); }

// Nota de piano: armónicos ligeramente desafinados (inarmonicidad), caída exponencial,
// y el "clic" del martillo al inicio.
function piano(s, nota, t0, { vol = 0.25, dur = 1.5, cents = 0 } = {}) {
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
      if (t > dur) env *= Math.exp(-(t - dur) / 0.08); // soltar la tecla (apagador)
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

function ruido(s, nivel) { for (let i = 0; i < s.length; i++) s[i] += nivel * azar(); }

// Voz que habla (como una TV): tono que sube y baja, sílabas que se prenden y apagan.
function voz(s, t0, t1, vol = 0.08) {
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
function filtrar(s) {
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

function correr(s, { sensibilidad = 5 } = {}) {
  const det = new NucleoDetector();
  det.umbralRms = 0.05 * Math.pow(0.7, sensibilidad - 1);
  const tono = filtrar(s);
  const notas = [];
  for (let fin = 2048; fin <= s.length; fin += HOP) {
    const info = det.procesar(tono.subarray(fin - 2048, fin), s.subarray(fin - 1024, fin), SR, (fin / SR) * 1000);
    if (info.nota) notas.push({ nota: nombreConOctava(info.nota.midi), t: +(info.nota.instante / 1000).toFixed(2), latencia: Math.round(fin / SR * 1000 - info.nota.instante) });
  }
  return { notas, det };
}

let fallos = 0;
// extra: casos muy difíciles (pedal puesto, tecla sin soltar). Se informan, pero no fallan la prueba.
function caso(nombre, s, esperadas, opciones = {}) {
  const { notas, det } = correr(s, opciones);
  const obtenidas = notas.map((n) => n.nota);
  const ok = JSON.stringify(obtenidas) === JSON.stringify(esperadas);
  if (!ok && !opciones.extra) fallos++;
  console.log(`${ok ? '✅' : opciones.extra ? '⚠️ ' : '❌'} ${nombre}${opciones.extra ? ' (caso extremo)' : ''}`);
  if (!ok) console.log('   esperaba:', esperadas.join(' '), '\n   obtuvo:  ', obtenidas.join(' '));
  const lat = notas.map((n) => n.latencia);
  if (lat.length) console.log(`   ${obtenidas.length} notas · tiempos ${notas.map((n) => n.t).join(', ')} · espera ${Math.min(...lat)}-${Math.max(...lat)} ms · desafinación medida ${Math.round(det.desvio * 100)} cents`);
}

// 1. Notas sueltas
{
  const s = nuevaSenal(2.5); ruido(s, 0.002);
  ['Do4', 'Mi4', 'Sol4'].forEach((n, i) => piano(s, n, 0.3 + i * 0.6, { dur: 0.45 }));
  caso('Notas sueltas Do Mi Sol', s, ['Do4', 'Mi4', 'Sol4']);
}
// 2. La misma nota repetida (Mi Mi Mi de "Mary"): el niño suelta y vuelve a tocar
{
  const s = nuevaSenal(2); ruido(s, 0.002);
  [0.3, 0.65, 1.0].forEach((t) => piano(s, 'Mi4', t, { dur: 0.3 }));
  caso('Mi Mi Mi (suelta y vuelve a tocar)', s, ['Mi4', 'Mi4', 'Mi4']);
}
// 2b. La misma nota repetida rápido, soltando apenas
{
  const s = nuevaSenal(2); ruido(s, 0.002);
  [0.3, 0.55, 0.8, 1.05].forEach((t) => piano(s, 'Mi4', t, { dur: 0.22 }));
  caso('Mi repetido rápido', s, ['Mi4', 'Mi4', 'Mi4', 'Mi4']);
}
// 2c. Extremo: la misma tecla otra vez sin dejar de sonar (con pedal)
{
  const s = nuevaSenal(2); ruido(s, 0.002);
  [0.3, 0.65, 1.0].forEach((t) => piano(s, 'Mi4', t, { dur: 2 }));
  caso('Mi repetido con pedal', s, ['Mi4', 'Mi4', 'Mi4'], { extra: true });
}
// 3. Una nota larga no se cuenta dos veces mientras se apaga
{
  const s = nuevaSenal(4); ruido(s, 0.002);
  piano(s, 'Do4', 0.3, { dur: 3.5 });
  caso('Do largo (no se repite solo)', s, ['Do4']);
}
// 4. Legato: cinco notas seguidas, la anterior se suelta un poquito después
{
  const s = nuevaSenal(2.5); ruido(s, 0.002);
  ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4'].forEach((n, i) => piano(s, n, 0.3 + i * 0.3, { dur: 0.36 }));
  caso('Legato Do Re Mi Fa Sol', s, ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4']);
}
// 4b. Rápido: una nota cada 0,2 s
{
  const s = nuevaSenal(2); ruido(s, 0.002);
  ['Sol4', 'Fa4', 'Mi4', 'Re4', 'Do4'].forEach((n, i) => piano(s, n, 0.3 + i * 0.2, { dur: 0.22 }));
  caso('Rápido Sol Fa Mi Re Do', s, ['Sol4', 'Fa4', 'Mi4', 'Re4', 'Do4']);
}
// 4c. Extremo: con pedal (todas las notas siguen sonando juntas)
{
  const s = nuevaSenal(2.5); ruido(s, 0.002);
  ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4'].forEach((n, i) => piano(s, n, 0.3 + i * 0.3, { dur: 1.2 }));
  caso('Legato con pedal', s, ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4'], { extra: true });
}
// 5. Piano desafinado (+38 cents)
{
  const s = nuevaSenal(3.5); ruido(s, 0.002);
  ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4', 'La4', 'Si4', 'Do5'].forEach((n, i) => piano(s, n, 0.3 + i * 0.4, { dur: 0.35, cents: 38 }));
  caso('Piano desafinado +38 cents', s, ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4', 'La4', 'Si4', 'Do5']);
}
// 6. Voz de TV, sin piano
{
  const s = nuevaSenal(4); ruido(s, 0.002);
  voz(s, 0.2, 3.8);
  caso('Solo voz de TV (no debe reconocer nada)', s, []);
}
// 7. Notas graves (mano izquierda): la octava debe ser correcta
{
  const s = nuevaSenal(2.5); ruido(s, 0.002);
  ['Do3', 'Mi3', 'Sol3'].forEach((n, i) => piano(s, n, 0.3 + i * 0.6, { dur: 0.45 }));
  caso('Graves Do3 Mi3 Sol3', s, ['Do3', 'Mi3', 'Sol3']);
}
// 8. Piano suave en casa con ruido
{
  const s = nuevaSenal(2.5); ruido(s, 0.005);
  ['Re4', 'Fa4', 'La4'].forEach((n, i) => piano(s, n, 0.4 + i * 0.6, { vol: 0.05, dur: 0.45 }));
  caso('Piano suave con ruido', s, ['Re4', 'Fa4', 'La4']);
}
// 9. Piano mientras hay voz de fondo
{
  const s = nuevaSenal(3); ruido(s, 0.002);
  voz(s, 0, 3, 0.03);
  ['Do4', 'Mi4', 'Sol4', 'Do5'].forEach((n, i) => piano(s, n, 0.3 + i * 0.6, { dur: 0.45 }));
  caso('Piano con voz de fondo', s, ['Do4', 'Mi4', 'Sol4', 'Do5']);
}
// 10. Teclas negras
{
  const s = nuevaSenal(2.5); ruido(s, 0.002);
  ['Do#4', 'Fa#4', 'La#4'].forEach((n, i) => piano(s, n, 0.3 + i * 0.6, { dur: 0.45 }));
  caso('Teclas negras', s, ['Do♯4', 'Fa♯4', 'La♯4']);
}

console.log(fallos ? `\n${fallos} caso(s) con fallas` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
