// Voz grabada de Ranita: un adulto graba las frases con el micrófono del iPad y la app las usa
// en lugar de la voz del sistema. Lo que no está grabado lo sigue diciendo la voz del sistema.
// Las grabaciones se guardan en el propio iPad (IndexedDB), no se envían a ningún lado.
import { NOMBRES } from './notas.js';

// ───────── Frases que dice Ranita, agrupadas para grabarlas ─────────
export const GRUPOS = [
  {
    titulo: '👋 Saludos y avisos',
    frases: [
      '¡Hola! Vamos a tocar piano.',
      'Primero termina la lección anterior',
      'Este juego se abre más adelante en tu viaje',
      '¡Vamos a tocar una canción! Sigue los colores.',
      '¡Vamos a leer una canción!',
      'Toca esta nota',
    ],
  },
  {
    titulo: '🎉 Ánimo y premios',
    frases: [
      '¡Casi! Otra vez',
      'Mira la tecla que brilla.',
      '¡Bien la nota! Pero más abajo, con la izquierda',
      '¡Bien la nota! Pero más arriba, con la derecha',
      '¡Perfecto! Tres estrellas',
      '¡Muy bien! Ganaste 2 estrellas',
      '¡Muy bien! Ganaste 1 estrella',
      '¡Probemos otra vez! Toca junto con los clics',
    ],
  },
  {
    titulo: '🎹 "Toca…" (una por nota)',
    frases: NOMBRES.map((n) => `Toca ${n}`),
  },
  {
    titulo: '🔍 "Busca…" (una por nota)',
    frases: NOMBRES.map((n) => `Busca ${n}.`),
  },
  {
    titulo: '🎵 Nombres de las notas (juego de las moscas)',
    frases: [...NOMBRES],
  },
  {
    titulo: '🥁 Ritmo',
    frases: ['Primero escucha. Después te toca a ti.', '¡Ahora tú! Cuenta conmigo.', '¡Ahora tú!'],
  },
  {
    titulo: '🎪 Juegos',
    frases: [
      '¡Toca la nota de cada mosca y la atrapo!',
      'Yo toco y tú repites. ¡Escucha bien!',
      '¡Casi! Escucha otra vez',
      'Cada nota correcta es un salto. ¡Gánale al caracol!',
      '¡Ganaste la carrera!',
      '¡Casi le ganas al caracol! Otra vez, tú puedes',
    ],
  },
  {
    titulo: '🦁 Fuerte y suave',
    frases: [
      'Primero conozco tu piano. Toca Do muy fuerte, como un león.',
      'Ahora muy suave, como un ratoncito.',
      'Casi no se nota la diferencia. Probemos otra vez, con más fuerza el león y más suave el ratón.',
      '¡Listo! Ahora mira la letra: f es fuerte y p es suave.',
      '¡Bien la nota! Pero más fuerte, como un león',
      '¡Bien la nota! Pero más suave, como un ratón',
    ],
  },
  {
    titulo: '🗼 Acordes y dos manos',
    frases: ['Toca las notas juntas, todas al mismo tiempo.', '¡Vamos!'],
  },
  {
    titulo: '🏀 Picado, largo y ligado',
    frases: [
      'Mira las marcas de cada nota.',
      '¡Corta! Toca y suelta',
      '¡Larga! Mantén hasta llenar el círculo',
      'Pegadito a la siguiente',
      '¡Más cortita! Suéltala rápido, como si quemara',
      '¡Mantenla un poquito más, hasta llenar el círculo!',
      '¡Sin levantar la mano! Pegadito como un gusanito',
    ],
  },
];

export const TOTAL_FRASES = GRUPOS.reduce((n, g) => n + g.frases.length, 0);

// Clave para comparar frases: sin espacios de más ni punto final.
const clave = (texto) => texto.trim().replace(/\s+/g, ' ').replace(/\.+$/, '').toLowerCase();

// ───────── Almacenamiento (IndexedDB) ─────────
let bd = null;
function abrir() {
  if (bd) return bd;
  bd = new Promise((resolver, rechazar) => {
    try {
      const pedido = indexedDB.open('pianito-voz', 1);
      pedido.onupgradeneeded = () => pedido.result.createObjectStore('frases');
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => rechazar(pedido.error);
    } catch (e) {
      rechazar(e);
    }
  });
  return bd;
}

async function operacion(modo, fn) {
  const base = await abrir();
  return new Promise((resolver, rechazar) => {
    const tx = base.transaction('frases', modo);
    const pedido = fn(tx.objectStore('frases'));
    tx.oncomplete = () => resolver(pedido?.result);
    tx.onerror = () => rechazar(tx.error);
  });
}

const grabadas = new Set();       // claves con grabación
const buffers = new Map();        // clave -> { buffer, inicio, duracion } (ya decodificado)

export async function cargarIndice() {
  try {
    const claves = await operacion('readonly', (s) => s.getAllKeys());
    claves.forEach((k) => grabadas.add(k));
  } catch {
    /* sin IndexedDB (modo privado): se usa la voz del sistema */
  }
  return grabadas.size;
}

export const estaGrabada = (texto) => grabadas.has(clave(texto));
export const cuantasGrabadas = () => grabadas.size;

export async function guardar(texto, blob) {
  const k = clave(texto);
  await operacion('readwrite', (s) => s.put(blob, k));
  grabadas.add(k);
  buffers.delete(k);
}

export async function borrar(texto) {
  const k = clave(texto);
  await operacion('readwrite', (s) => s.delete(k));
  grabadas.delete(k);
  buffers.delete(k);
}

export async function borrarTodo() {
  await operacion('readwrite', (s) => s.clear());
  grabadas.clear();
  buffers.clear();
}

// ───────── Reproducción ─────────
// Parte el texto en oraciones y busca grabaciones que lo cubran por completo
// (por ejemplo "Busca Re. Mira la tecla que brilla." = dos grabaciones).
export function plan(texto) {
  if (!grabadas.size) return null;
  if (estaGrabada(texto)) return [texto];
  const partes = texto.split(/(?<=[.!?])\s+/).filter(Boolean);
  const resultado = [];
  let i = 0;
  while (i < partes.length) {
    let encontrado = false;
    for (let j = partes.length; j > i; j--) {
      const trozo = partes.slice(i, j).join(' ');
      if (estaGrabada(trozo)) {
        resultado.push(trozo);
        i = j;
        encontrado = true;
        break;
      }
    }
    if (!encontrado) return null;
  }
  return resultado;
}

async function bufferDe(ctx, texto) {
  const k = clave(texto);
  if (buffers.has(k)) return buffers.get(k);
  const blob = await operacion('readonly', (s) => s.get(k));
  if (!blob) return null;
  const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
  // Se recorta el silencio del principio y del final para que suene ágil.
  const datos = buffer.getChannelData(0);
  let a = 0;
  let b = datos.length - 1;
  while (a < b && Math.abs(datos[a]) < 0.02) a++;
  while (b > a && Math.abs(datos[b]) < 0.02) b--;
  const margen = Math.floor(buffer.sampleRate * 0.05);
  const inicio = Math.max(0, a - margen) / buffer.sampleRate;
  const fin = Math.min(datos.length, b + margen) / buffer.sampleRate;
  const item = { buffer, inicio, duracion: Math.max(0.1, fin - inicio) };
  buffers.set(k, item);
  return item;
}

// Reproduce las frases una tras otra. Devuelve una promesa que termina al acabar.
// aguda: un poquito más aguda y rápida, "voz de rana".
export async function reproducir(ctx, frases, { aguda = false } = {}) {
  const velocidad = aguda ? 1.12 : 1;
  for (const f of frases) {
    const item = await bufferDe(ctx, f);
    if (!item) continue;
    await new Promise((resolver) => {
      const fuente = ctx.createBufferSource();
      fuente.buffer = item.buffer;
      fuente.playbackRate.value = velocidad;
      fuente.connect(ctx.destination);
      fuente.onended = resolver;
      fuente.start(0, item.inicio, item.duracion);
      setTimeout(resolver, (item.duracion / velocidad) * 1000 + 500); // por si onended no llega
    });
  }
}

// ───────── Grabación ─────────
// Graba hasta que se llame a detener() o pasen 6 segundos. Devuelve el Blob.
export function grabar(stream) {
  const tipos = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
  const tipo = tipos.find((t) => window.MediaRecorder?.isTypeSupported?.(t));
  const grabadora = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
  const trozos = [];
  grabadora.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data); };
  const listo = new Promise((resolver) => {
    grabadora.onstop = () => resolver(new Blob(trozos, { type: grabadora.mimeType || tipo || 'audio/mp4' }));
  });
  grabadora.start();
  const limite = setTimeout(() => grabadora.state === 'recording' && grabadora.stop(), 6000);
  return {
    listo,
    detener() {
      clearTimeout(limite);
      if (grabadora.state === 'recording') grabadora.stop();
    },
  };
}
