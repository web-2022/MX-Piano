// Prueba de la verificación de acordes con pianos sintéticos.
// Ejecutar en la carpeta del proyecto:   node pruebas/prueba-acordes.mjs
import { verificarNotas, textoAcorde } from '../js/acordes.js';
import { notaAMidi, nombreConOctava } from '../js/notas.js';
import { SR, nuevaSenal, piano, ruido, voz, filtrar } from './sintetizador.mjs';

const N = 8192; // ~170 ms: lo que mira la app 220 ms después del golpe

function tocar(notas, { vol = 0.2, voces = null, cents = 0, ruidoNivel = 0.002, volumenes = null, conVoz = false } = {}) {
  const s = nuevaSenal(1.2);
  ruido(s, ruidoNivel);
  if (conVoz) voz(s, 0, 1.2, 0.04);
  notas.forEach((n, i) => piano(s, n, 0.3 + (voces?.[i] ?? 0), { vol: volumenes?.[i] ?? vol, dur: 0.8, cents }));
  const f = filtrar(s);
  const fin = Math.floor((0.3 + 0.22) * SR);
  return f.subarray(fin - N, fin);
}

let fallos = 0;
function caso(nombre, tocadas, esperadas, debeSer, opciones = {}) {
  const buf = tocar(tocadas, opciones);
  const r = verificarNotas(buf, SR, esperadas.map(notaAMidi), { desvio: opciones.desvio || 0 });
  const bien = r.ok === debeSer;
  if (!bien) fallos++;
  console.log(`${bien ? '✅' : '❌'} ${nombre}: ${r.ok ? 'correcto' : textoAcorde(r)}`);
  if (!bien) console.log('   ', JSON.stringify(Object.fromEntries(Object.entries(r.detalle).map(([m, d]) => [nombreConOctava(+m), d]))));
}

console.log('— Acordes correctos (deben aceptarse) —');
caso('Do mayor (Do Mi Sol)', ['Do4', 'Mi4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], true);
caso('Fa mayor (Fa La Do)', ['Fa4', 'La4', 'Do5'], ['Fa4', 'La4', 'Do5'], true);
caso('Sol mayor (Sol Si Re)', ['Sol3', 'Si3', 'Re4'], ['Sol3', 'Si3', 'Re4'], true);
caso('Tercera Do-Mi', ['Do4', 'Mi4'], ['Do4', 'Mi4'], true);
caso('Quinta Do-Sol', ['Do4', 'Sol4'], ['Do4', 'Sol4'], true);
caso('Dos manos: Do3 + Mi4', ['Do3', 'Mi4'], ['Do3', 'Mi4'], true);
caso('Dos manos: Do3 + Sol4', ['Do3', 'Sol4'], ['Do3', 'Sol4'], true);
caso('Dos manos: Sol2 + Si4', ['Sol2', 'Si4'], ['Sol2', 'Si4'], true);
caso('Do mayor, notas desparejas', ['Do4', 'Mi4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], true, { volumenes: [0.3, 0.1, 0.18] });
caso('Do mayor, apenas desfasado (40 ms)', ['Do4', 'Mi4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], true, { voces: [0, 0.02, 0.04] });
caso('Do mayor en piano desafinado +30 cents', ['Do4', 'Mi4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], true, { cents: 30, desvio: 0.3 });
caso('Do mayor con voz de fondo', ['Do4', 'Mi4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], true, { conVoz: true });
caso('Do mayor suave con ruido', ['Do4', 'Mi4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], true, { vol: 0.05, ruidoNivel: 0.004 });
caso('Nota sola Do4', ['Do4'], ['Do4'], true);

console.log('— Errores (deben rechazarse) —');
caso('Solo Do (faltan Mi y Sol)', ['Do4'], ['Do4', 'Mi4', 'Sol4'], false);
caso('Do y Sol, falta Mi', ['Do4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], false);
caso('Tecla vecina: Do Fa Sol', ['Do4', 'Fa4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], false);
caso('Tecla vecina: Do Mi La', ['Do4', 'Mi4', 'La4'], ['Do4', 'Mi4', 'Sol4'], false);
caso('Tecla vecina: Re Mi Sol', ['Re4', 'Mi4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], false);
caso('Tecla de más: Do Mi Fa Sol', ['Do4', 'Mi4', 'Fa4', 'Sol4'], ['Do4', 'Mi4', 'Sol4'], false);
caso('Otro acorde: Fa La Do', ['Fa4', 'La4', 'Do5'], ['Do4', 'Mi4', 'Sol4'], false);
caso('Dos manos: Re3 en vez de Do3', ['Re3', 'Mi4'], ['Do3', 'Mi4'], false);
caso('Dos manos: falta la izquierda', ['Mi4'], ['Do3', 'Mi4'], false);
caso('Dos manos: falta la derecha', ['Do3'], ['Do3', 'Mi4'], false);
caso('Tecla de más a un tono: Do Sol La', ['Do4', 'Sol4', 'La4'], ['Do4', 'Sol4'], false);
caso('Tecla de más a un tono: Re Do Mi', ['Re4', 'Do4', 'Mi4'], ['Do4', 'Mi4'], false);
caso('Sin tocar nada', [], ['Do4', 'Mi4', 'Sol4'], false);
caso('Solo voz de TV', [], ['Do4', 'Mi4', 'Sol4'], false, { conVoz: true });


// ───── Con pedal: las notas anteriores siguen sonando ─────
console.log('— Con pedal —');
function conPedal(nombre, tocadas, pedidas, debeSer) {
  // Cada nota dura 3 s (pedal puesto); se verifica la última nota tocada.
  const s = nuevaSenal(1.6 + tocadas.length * 0.45);
  ruido(s, 0.002);
  // Con pedal cada nota sigue sonando, salvo que se vuelva a tocar la misma tecla:
  // entonces el martillo vuelve a golpear la misma cuerda (la vibración anterior se reemplaza).
  tocadas.forEach((n, i) => [].concat(n).forEach((x) => {
    const otraVez = tocadas.findIndex((m, k) => k > i && [].concat(m).includes(x));
    const dur = otraVez > 0 ? (otraVez - i) * 0.45 - 0.01 : 3;
    piano(s, x, 0.3 + i * 0.45, { vol: 0.2, dur, corte: otraVez > 0 });
  }));
  const f = filtrar(s);
  const t0 = 0.3 + (tocadas.length - 1) * 0.45;
  const golpe = Math.floor(t0 * SR);
  const antes = f.subarray(golpe - N, golpe);
  const fin = Math.floor((t0 + 0.22) * SR);
  const despues = f.subarray(fin - N, fin);
  const r = verificarNotas(despues, SR, [].concat(pedidas).map(notaAMidi), { pedal: true, antes });
  const sinPedal = verificarNotas(despues, SR, [].concat(pedidas).map(notaAMidi));
  const bien = r.ok === debeSer;
  if (!bien) fallos++;
  console.log(`${bien ? '✅' : '❌'} ${nombre}: ${r.ok ? 'correcto' : textoAcorde(r)}   (sin modo pedal: ${sinPedal.ok ? 'correcto' : textoAcorde(sinPedal)})`);
  if (!bien) console.log('   ', JSON.stringify(r.detalle));
}
conPedal('Escala con pedal: Do Re Mi Fa → Fa', ['Do4', 'Re4', 'Mi4', 'Fa4'], 'Fa4', true);
conPedal('Mi y luego Fa (vecinas) → Fa', ['Mi4', 'Fa4'], 'Fa4', true);
conPedal('Sol Fa Mi Re Do → Do', ['Sol4', 'Fa4', 'Mi4', 'Re4', 'Do4'], 'Do4', true);
conPedal('Arpegio Do Mi Sol Do5 → Do5', ['Do4', 'Mi4', 'Sol4', 'Do5'], 'Do5', true);
conPedal('Repite Mi con pedal → Mi', ['Mi4', 'Re4', 'Mi4'], 'Mi4', true);
conPedal('Bajo + melodía con pedal', [['Do3', 'Mi4'], 'Re4', ['Sol3', 'Re4']], ['Sol3', 'Re4'], true);
conPedal('Error con pedal: pide Mi, toca Fa', ['Do4', 'Re4', 'Fa4'], 'Mi4', false);
conPedal('Error con pedal: pide Re, no vuelve a tocar (sigue sonando)', ['Re4', 'Sol4'], 'Re4', false);
conPedal('Error con pedal: acorde incompleto', ['Do3', ['Do4', 'Sol4']], ['Do4', 'Mi4', 'Sol4'], false);

console.log(fallos ? `\n${fallos} caso(s) con fallas` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
