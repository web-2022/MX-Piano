// Prueba del detector con sonidos de piano sintéticos (sin micrófono).
// Ejecutar en la carpeta del proyecto:   node pruebas/prueba-detector.mjs
import { NucleoDetector, CorrectorSolape } from '../js/detector.js';
import { notaAMidi, midiAFrecuencia, nombreConOctava, claseNota } from '../js/notas.js';

import { SR, nuevaSenal, piano, ruido, voz, filtrar } from './sintetizador.mjs';

const HOP = 800; // 60 cuadros por segundo

// El mismo camino que en el iPad: detector de tono + corrector de notas encimadas.
function correr(s, { sensibilidad = 5 } = {}) {
  const det = new NucleoDetector();
  det.umbralRms = 0.05 * Math.pow(0.7, sensibilidad - 1);
  const cor = new CorrectorSolape();
  const tono = filtrar(s);
  const largo = (k) => tono.subarray(Math.max(0, k - 8192), k);
  const notas = [];
  for (let fin = 2048; fin <= s.length; fin += HOP) {
    const ahora = (fin / SR) * 1000;
    const sonabaAntes = !!det.activa || det.rmsAnterior > det.umbralEfectivo();
    const notaSonando = !!det.activa;
    const midiSonando = det.activa?.midi ?? null;
    const info = det.procesar(tono.subarray(fin - 2048, fin), s.subarray(fin - 1024, fin), SR, ahora);
    const salida = cor.cuadro({
      ahora, info, sonabaAntes, notaSonando, midiSonando,
      antes: info.ataque != null && fin >= 8192 ? Float32Array.from(largo(fin)) : null,
      antesDe: (t) => { const k = Math.floor((t / 1000) * SR); return k >= 8192 ? Float32Array.from(tono.subarray(k - 8192, k)) : null; },
      largo: () => largo(fin), sampleRate: SR, desvio: det.desvio, minimo: (det.umbralRms * det.umbralRms) / 32,
    });
    for (const n of salida) {
      det.ultimaClase = claseNota(n.midi); det.ultimoMidi = n.midi;
      if (det.activa) det.activa.midi = n.midi;
      notas.push({ nota: nombreConOctava(n.midi), t: +(n.instante / 1000).toFixed(2), latencia: Math.round(ahora - n.instante) });
    }
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


// ───── Fuerza y duración ─────
function eventos(s) {
  const det = new NucleoDetector();
  det.umbralRms = 0.05 * Math.pow(0.7, 4);
  const tono = filtrar(s);
  const notas = [];
  const fines = [];
  for (let fin = 2048; fin <= s.length; fin += HOP) {
    const info = det.procesar(tono.subarray(fin - 2048, fin), s.subarray(fin - 1024, fin), SR, (fin / SR) * 1000);
    if (info.fin) fines.push({ nota: nombreConOctava(info.fin.midi), duracion: Math.round(info.fin.duracion), ligada: !!info.fin.ligada });
    if (info.nota) notas.push({ nota: nombreConOctava(info.nota.midi), fuerza: info.nota.fuerza });
  }
  return { notas, fines };
}
function comprobar(nombre, ok, detalle) {
  if (!ok) fallos++;
  console.log(`${ok ? '✅' : '❌'} ${nombre}\n   ${detalle}`);
}
// 11. Fuerte y suave
{
  const s = nuevaSenal(3); ruido(s, 0.002);
  piano(s, 'Do4', 0.3, { vol: 0.3, dur: 0.5 });
  piano(s, 'Do4', 1.1, { vol: 0.06, dur: 0.5 });
  piano(s, 'Re4', 1.9, { vol: 0.25, dur: 0.5 });
  const { notas } = eventos(s);
  const f = notas.map((n) => n.fuerza);
  comprobar('Fuerte, suave, fuerte', notas.length === 3 && f[0] > f[1] * 2.5 && f[2] > f[1] * 2.5,
    `fuerzas ${f.map((x) => x.toFixed(3)).join(' / ')}`);
}
// 12. Corta (picado) y larga
{
  const s = nuevaSenal(3.5); ruido(s, 0.002);
  piano(s, 'Mi4', 0.3, { dur: 0.18 });
  piano(s, 'Mi4', 0.9, { dur: 0.2 });
  piano(s, 'Sol4', 1.5, { dur: 1.3 });
  const { fines } = eventos(s);
  const d = fines.map((x) => x.duracion);
  comprobar('Duraciones: corta, corta, larga', fines.length === 3 && d[0] < 320 && d[1] < 320 && d[2] > 1000 && d[2] < 1550,
    `duraciones ${d.join(' / ')} ms (tocadas: 180 / 200 / 1300)`);
}
// 13. Ligado: cada nota empieza antes de soltar la anterior
{
  const s = nuevaSenal(2.5); ruido(s, 0.002);
  ['Do4', 'Re4', 'Mi4'].forEach((n, i) => piano(s, n, 0.3 + i * 0.5, { dur: 0.56 }));
  const { fines } = eventos(s);
  comprobar('Ligado Do-Re-Mi', fines.length === 3 && fines[0].ligada && fines[1].ligada && !fines[2].ligada,
    fines.map((f) => `${f.nota} ${f.duracion} ms${f.ligada ? ' (ligada)' : ''}`).join(' · '));
}
// 14. Picado: suelta antes de la siguiente
{
  const s = nuevaSenal(2.5); ruido(s, 0.002);
  ['Do4', 'Re4', 'Mi4'].forEach((n, i) => piano(s, n, 0.3 + i * 0.5, { dur: 0.2 }));
  const { fines } = eventos(s);
  comprobar('Picado Do-Re-Mi', fines.length === 3 && fines.every((f) => !f.ligada && f.duracion < 320),
    fines.map((f) => `${f.nota} ${f.duracion} ms${f.ligada ? ' (ligada)' : ''}`).join(' · '));
}


// ───── Notas encimadas: la anterior sigue sonando al tocar la siguiente ─────
// Igual que en el iPad: detector de tono + corrector de solape (ventana larga de 8192 muestras).
function detectorCompleto(s, conCorrector) {
  const det = new NucleoDetector();
  det.umbralRms = 0.012;
  const cor = new CorrectorSolape();
  const f = filtrar(s);
  const notas = [];
  const largoEn = (fin) => f.subarray(Math.max(0, fin - 8192), fin);
  for (let fin = 8192; fin <= s.length; fin += HOP) {
    const ahora = (fin / SR) * 1000;
    const sonabaAntes = !!det.activa || det.rmsAnterior > det.umbralEfectivo();
    const notaSonando = !!det.activa;
    const midiSonando = det.activa?.midi ?? null;
    const info = det.procesar(f.subarray(fin - 2048, fin), s.subarray(fin - 1024, fin), SR, ahora);
    if (!conCorrector) { if (info.nota) notas.push(info.nota.midi); continue; }
    const salida = cor.cuadro({
      ahora, info, sonabaAntes, notaSonando, midiSonando, antes: info.ataque != null ? Float32Array.from(largoEn(fin)) : null,
      antesDe: (t) => { const k = Math.floor((t / 1000) * SR); return k >= 8192 ? Float32Array.from(f.subarray(k - 8192, k)) : null; },
      largo: () => largoEn(fin), sampleRate: SR, desvio: det.desvio, minimo: (0.012 * 0.012) / 32,
    });
    for (const n of salida) {
      det.ultimaClase = claseNota(n.midi); det.ultimoMidi = n.midi;
      if (det.activa) det.activa.midi = n.midi;
      notas.push(n.midi);
    }
  }
  return notas;
}
{
  console.log('— Arpegio Do-Mi-Sol, cada nota suelta tarde (la mezcla "suena" como Do2) —');
  const arp = ['Do4', 'Mi4', 'Sol4', 'Do5', 'Sol4', 'Mi4', 'Do4', 'Mi4', 'Sol4', 'Do5'];
  let bien = 0;
  for (let k = 0; k < 10; k++) {
    const s = nuevaSenal(5); ruido(s, 0.003);
    arp.forEach((n, i) => piano(s, n, 0.4 + i * 0.38, { vol: 0.2, dur: 0.75 }));
    const oidas = detectorCompleto(s, true).map((m) => nombreConOctava(m));
    if (oidas.join() === arp.map((x) => nombreConOctava(notaAMidi(x))).join()) bien++;
    else if (k < 2) console.log('    oyó:', oidas.join(' '));
  }
  const ok = bien >= 9;
  if (!ok) fallos++;
  console.log(`${ok ? '✅' : '❌'} Arpegio: ${bien} de 10 sin errores`);
}
{
  console.log('— Escala que baja, cada nota suelta tarde —');
  const esc = ['Do5', 'Si4', 'La4', 'Sol4', 'Fa4', 'Mi4', 'Re4', 'Do4'];
  let bien = 0;
  for (let k = 0; k < 10; k++) {
    const s = nuevaSenal(4); ruido(s, 0.003);
    esc.forEach((n, i) => piano(s, n, 0.4 + i * 0.32, { vol: 0.2, dur: 0.75 }));
    const oidas = detectorCompleto(s, true).map((m) => nombreConOctava(m));
    if (oidas.map((x) => x.replace(/\d$/, '')).join() === esc.map((x) => nombreConOctava(notaAMidi(x)).replace(/\d$/, '')).join()) bien++;
    else if (k < 2) console.log('    oyó:', oidas.join(' '));
  }
  const ok = bien >= 9;
  if (!ok) fallos++;
  console.log(`${ok ? '✅' : '❌'} Escala que baja: ${bien} de 10 sin errores`);
}
{
  console.log('— Notas encimadas (300 pares al azar) —');
  const NOTAS = ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4', 'La4', 'Si4', 'Do5', 'Do3', 'Mi3', 'Sol3', 'Fa#4', 'Re5'];
  const cuenta = { sin: { bien: 0 }, con: { bien: 0 } };
  for (let k = 0; k < 300; k++) {
    const a = NOTAS[k % NOTAS.length];
    const b = NOTAS[(k * 7 + 3) % NOTAS.length] === a ? NOTAS[(k + 1) % NOTAS.length] : NOTAS[(k * 7 + 3) % NOTAS.length];
    const sep = 0.25 + ((k * 37) % 60) / 100;
    const mant = sep + 0.05 + ((k * 53) % 50) / 100;
    const s = nuevaSenal(2.6); ruido(s, 0.003);
    piano(s, a, 0.4, { vol: 0.2, dur: mant });
    piano(s, b, 0.4 + sep, { vol: 0.12 + ((k * 11) % 15) / 100, dur: 0.7 });
    for (const modo of ['sin', 'con']) {
      const n = detectorCompleto(s, modo === 'con');
      // Bien: exactamente dos notas, y la segunda es la tocada (en cualquier octava).
      if (n.length === 2 && claseNota(n[1]) === claseNota(notaAMidi(b)) && claseNota(n[0]) === claseNota(notaAMidi(a))) cuenta[modo].bien++;
    }
  }
  console.log(`   detector de tono solo: ${cuenta.sin.bien} de 300 bien`);
  console.log(`   con el corrector:      ${cuenta.con.bien} de 300 bien`);
  const ok = cuenta.con.bien >= 270;
  if (!ok) fallos++;
  console.log(`${ok ? '✅' : '❌'} Notas encimadas: al menos 90 % bien con el corrector`);
}

console.log(fallos ? `\n${fallos} caso(s) con fallas` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
