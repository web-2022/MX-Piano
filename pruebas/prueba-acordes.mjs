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

console.log(fallos ? `\n${fallos} caso(s) con fallas` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
