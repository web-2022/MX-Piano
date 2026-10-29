// Lector de partituras MusicXML: convierte una partitura en lecciones de Pianito.
//
// MusicXML es el formato que exportan MuseScore (gratis), Finale, Sibelius, Dorico, etc.
// y en el que se encuentran miles de obras de dominio público. Se aceptan:
//   .musicxml / .xml  (texto)        .mxl  (comprimido)
//
// La partitura se divide en "partes" de pocos compases, y cada parte es una lección:
//   - Una mano, melodía de una sola nota  -> canción (a su ritmo) o ritmo (con metrónomo)
//   - Acordes o las dos manos             -> lección de acordes y dos manos
// Todo se guarda en el propio iPad (no se sube a ningún lado).

const PASO = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOMBRE_ASCII = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const NOMBRE_ASCII_B = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];

// MIDI -> texto que entiende notaAMidi ("Fa#4", "Sib4")
export function midiATexto(midi, bemoles = false) {
  return (bemoles ? NOMBRE_ASCII_B : NOMBRE_ASCII)[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

// ───────── Lectura del archivo (.mxl es un zip) ─────────
export async function leerArchivo(archivo) {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return descomprimirMxl(bytes);
  return new TextDecoder('utf-8').decode(bytes);
}

async function descomprimirMxl(bytes) {
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // Fin del directorio central del zip
  let fin = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (vista.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new Error('El archivo .mxl está dañado.');
  const total = vista.getUint16(fin + 10, true);
  let pos = vista.getUint32(fin + 16, true);
  const entradas = {};
  for (let k = 0; k < total; k++) {
    const metodo = vista.getUint16(pos + 10, true);
    const tamComp = vista.getUint32(pos + 20, true);
    const largoNombre = vista.getUint16(pos + 28, true);
    const largoExtra = vista.getUint16(pos + 30, true);
    const largoComent = vista.getUint16(pos + 32, true);
    const local = vista.getUint32(pos + 42, true);
    const nombre = new TextDecoder().decode(bytes.subarray(pos + 46, pos + 46 + largoNombre));
    entradas[nombre] = { metodo, tamComp, local };
    pos += 46 + largoNombre + largoExtra + largoComent;
  }
  const leer = async (nombre) => {
    const e = entradas[nombre];
    if (!e) return null;
    const inicio = e.local + 30 + vista.getUint16(e.local + 26, true) + vista.getUint16(e.local + 28, true);
    const datos = bytes.subarray(inicio, inicio + e.tamComp);
    if (e.metodo === 0) return new TextDecoder().decode(datos);
    if (!('DecompressionStream' in window)) throw new Error('Este navegador no abre .mxl. Exporta la partitura como .musicxml.');
    const flujo = new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(flujo).text();
  };
  const contenedor = await leer('META-INF/container.xml');
  let principal = contenedor?.match(/full-path="([^"]+)"/)?.[1];
  if (!principal) principal = Object.keys(entradas).find((n) => /\.(xml|musicxml)$/i.test(n) && !n.startsWith('META-INF'));
  const texto = principal && (await leer(principal));
  if (!texto) throw new Error('No encontré la partitura dentro del .mxl.');
  return texto;
}

// ───────── Análisis del MusicXML ─────────
// Devuelve { titulo, compositor, quintas, tempo, compas: {pulsos, unidad}, compases: [inicio], notas: [{t, dur, midi, pentagrama}] }
// t y dur en negras.
export function analizar(xmlTexto) {
  const doc = new DOMParser().parseFromString(xmlTexto, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('El archivo no es un MusicXML válido.');
  if (doc.querySelector('score-timewise')) throw new Error('Formato "timewise" no soportado. Expórtalo desde MuseScore como MusicXML normal.');
  const texto = (sel) => doc.querySelector(sel)?.textContent?.trim() || '';
  const titulo = texto('work > work-title') || texto('movement-title') || texto('credit-words') || 'Mi partitura';
  const compositor = texto('identification > creator[type="composer"]');

  const parte = doc.querySelector('part');
  if (!parte) throw new Error('La partitura no tiene notas.');

  let divisiones = 1;
  let quintas = 0;
  let pulsos = 4;
  let unidad = 4;
  let tempo = 0;
  let inicioCompas = 0;
  const compases = [];
  const notas = [];
  const ligadas = new Map(); // midi+pentagrama -> nota que sigue con ligadura

  for (const compas of parte.querySelectorAll(':scope > measure')) {
    compases.push(inicioCompas);
    let cursor = 0;
    let largo = 0;
    let ultimoInicio = 0;
    for (const el of compas.children) {
      const tag = el.tagName;
      if (tag === 'attributes') {
        const d = el.querySelector('divisions');
        if (d) divisiones = Number(d.textContent) || 1;
        const q = el.querySelector('key > fifths');
        if (q) quintas = Number(q.textContent) || 0;
        const b = el.querySelector('time > beats');
        const u = el.querySelector('time > beat-type');
        if (b && u) { pulsos = Number(b.textContent) || 4; unidad = Number(u.textContent) || 4; }
      } else if (tag === 'direction' || tag === 'sound') {
        const s = tag === 'sound' ? el : el.querySelector('sound');
        if (s?.getAttribute('tempo') && !tempo) tempo = Number(s.getAttribute('tempo'));
        const pm = el.querySelector('metronome > per-minute');
        if (pm && !tempo) tempo = Number(pm.textContent);
      } else if (tag === 'backup') {
        cursor -= Number(el.querySelector('duration')?.textContent || 0);
      } else if (tag === 'forward') {
        cursor += Number(el.querySelector('duration')?.textContent || 0);
        largo = Math.max(largo, cursor);
      } else if (tag === 'note') {
        if (el.querySelector('grace') || el.querySelector('cue')) continue; // adornos: se saltan
        const dur = Number(el.querySelector(':scope > duration')?.textContent || 0);
        const acorde = !!el.querySelector(':scope > chord');
        const inicio = acorde ? ultimoInicio : cursor;
        if (!acorde) { ultimoInicio = cursor; cursor += dur; largo = Math.max(largo, cursor); }
        const altura = el.querySelector(':scope > pitch');
        if (!altura || el.querySelector(':scope > rest')) continue;
        const paso = altura.querySelector('step')?.textContent;
        const alter = Number(altura.querySelector('alter')?.textContent || 0);
        const octava = Number(altura.querySelector('octave')?.textContent);
        const midi = (octava + 1) * 12 + PASO[paso] + Math.round(alter);
        const pentagrama = Number(el.querySelector(':scope > staff')?.textContent || 1);
        const t = inicioCompas + inicio / divisiones;
        const d = dur / divisiones;
        const clave = `${midi}-${pentagrama}`;
        const ties = [...el.querySelectorAll(':scope > tie')].map((x) => x.getAttribute('type'));
        // Ligadura de prolongación: la nota se alarga, no se vuelve a tocar.
        if (ties.includes('stop') && ligadas.has(clave)) {
          const previa = ligadas.get(clave);
          previa.dur += d;
          if (!ties.includes('start')) ligadas.delete(clave);
          continue;
        }
        const nota = { t, dur: d, midi, pentagrama };
        notas.push(nota);
        if (ties.includes('start')) ligadas.set(clave, nota);
      }
    }
    // Compás incompleto (anacrusa): se usa su largo real.
    const nominal = (pulsos * 4) / unidad;
    const real = largo / divisiones;
    inicioCompas += compases.length === 1 && real > 0 && real < nominal ? real : nominal;
  }
  notas.sort((a, b) => a.t - b.t || a.midi - b.midi);
  return { titulo, compositor, quintas, tempo: tempo || 90, compas: { pulsos, unidad }, compases, fin: inicioCompas, notas };
}

// ¿Qué manos tiene? (pentagrama 1 = derecha, 2 = izquierda)
export function manosDisponibles(analisis) {
  const p = new Set(analisis.notas.map((n) => n.pentagrama));
  return { derecha: p.has(1), izquierda: p.has(2) };
}

// ───────── Conversión a lecciones ─────────
// opciones: { mano: 'derecha' | 'izquierda' | 'ambas', modo: 'cancion' | 'ritmo', compasesPorParte, titulo }
export function crearLecciones(analisis, opciones) {
  const { mano = 'derecha', modo = 'cancion', titulo = analisis.titulo } = opciones;
  const bemoles = analisis.quintas < 0;
  const armadura = { 1: 'sol', 2: 're', [-1]: 'fa' }[analisis.quintas] || null;
  const tonalidad = { 1: 'sol', [-1]: 'fa', 2: 're' }[analisis.quintas];
  const id = `p${Date.now().toString(36)}`;

  let notas = analisis.notas.filter((n) => mano === 'ambas' || (mano === 'derecha' ? n.pentagrama === 1 : n.pentagrama === 2));
  if (!notas.length) throw new Error('No hay notas para esa mano.');

  // Agrupar por momento de inicio
  const grupos = [];
  for (const n of notas) {
    const g = grupos[grupos.length - 1];
    if (g && Math.abs(g.t - n.t) < 1e-4) { g.notas.push(n); g.dur = Math.max(g.dur, n.dur); }
    else grupos.push({ t: n.t, dur: n.dur, notas: [n] });
  }
  // Una mano: si hay varias notas juntas pero se pidió una melodía, se queda la más aguda (derecha)
  // o la más grave (izquierda), salvo que haya acordes de verdad en buena parte de la pieza.
  const conAcordes = grupos.filter((g) => g.notas.length > 1).length > grupos.length * 0.25;
  const usarAcordes = mano === 'ambas' || conAcordes;
  if (!usarAcordes) {
    for (const g of grupos) {
      const elegida = mano === 'izquierda' ? g.notas[0] : g.notas[g.notas.length - 1];
      g.notas = [elegida];
      g.dur = elegida.dur;
    }
  }

  const midis = notas.map((n) => n.midi);
  const min = Math.min(...midis);
  const max = Math.max(...midis);
  // Teclado: de un Do (o Sol) por debajo a uno por encima, como máximo tres octavas.
  const desde = Math.max(36, Math.min(60, Math.floor(min / 12) * 12));
  const hasta = Math.min(96, Math.max(72, Math.ceil((max + 1) / 12) * 12));
  const teclado = [desde, Math.min(hasta, desde + 36)];

  // Partes de N compases
  const porParte = opciones.compasesPorParte || (modo === 'ritmo' ? 4 : usarAcordes ? 4 : 8);
  const limites = analisis.compases.filter((_, i) => i % porParte === 0).concat(analisis.fin);
  const unidadCompas = (analisis.compas.pulsos * 4) / analisis.compas.unidad; // en negras
  const compuesto = analisis.compas.unidad === 8 && analisis.compas.pulsos % 3 === 0;

  const lecciones = [];
  for (let p = 0; p < limites.length - 1; p++) {
    const g = grupos.filter((x) => x.t >= limites[p] - 1e-4 && x.t < limites[p + 1] - 1e-4);
    if (!g.length) continue;
    const base = {
      id: `${id}-${p + 1}`,
      titulo: limites.length > 2 ? `${titulo} · parte ${p + 1}` : titulo,
      emoji: ['🎼', '🎵', '🎶', '🎹'][p % 4],
      teclado,
      ayudaVisual: true,
      bemoles,
      tonalidad,
      tempo: Math.round(analisis.tempo),
    };
    const nombres = (gr) => gr.notas.map((n) => midiATexto(n.midi, bemoles));
    if (usarAcordes) {
      lecciones.push({ ...base, tipo: 'acordes', mano: mano === 'ambas' ? 'ambas' : undefined, acordes: g.map(nombres) });
    } else if (modo === 'ritmo') {
      // Figuras con silencios entre notas; se redondea a semicorcheas.
      const figuras = [];
      let t = limites[p];
      g.forEach((x, i) => {
        if (x.t - t > 0.1) figuras.push([null, redondear(x.t - t)]);
        const siguiente = g[i + 1]?.t ?? limites[p + 1];
        const dur = redondear(Math.min(x.dur, siguiente - x.t));
        figuras.push([nombres(x)[0], dur]);
        t = x.t + dur;
      });
      if (limites[p + 1] - t > 0.1) figuras.push([null, redondear(limites[p + 1] - t)]);
      lecciones.push({
        ...base, tipo: 'ritmo', figuras, compas: unidadCompas,
        pulso: compuesto ? 1.5 : 1,
        tempo: Math.round(compuesto ? analisis.tempo / 1.5 : analisis.tempo) || 60,
        subdividir: figuras.some((f) => f[1] < 1),
      });
    } else {
      lecciones.push({
        ...base, tipo: 'cancion',
        notas: g.map((x) => nombres(x)[0]),
        tiempos: g.map((x, i) => redondear((g[i + 1]?.t ?? x.t + x.dur) - x.t) || x.dur),
        mano: mano === 'izquierda' ? 'izquierda' : undefined,
      });
    }
  }
  return {
    id,
    titulo,
    compositor: analisis.compositor,
    detalle: `${mano === 'ambas' ? 'Dos manos' : mano === 'izquierda' ? 'Mano izquierda' : 'Mano derecha'} · ${
      usarAcordes ? 'acordes' : modo === 'ritmo' ? 'con ritmo' : 'a su ritmo'}`,
    lecciones,
  };
}

function redondear(negras) {
  // A la semicorchea más cercana, o al tresillo si encaja mejor.
  const a = Math.round(negras * 4) / 4;
  const b = Math.round(negras * 3) / 3;
  return Math.abs(b - negras) < Math.abs(a - negras) - 1e-6 ? b : a;
}

// ───────── Guardar en el iPad ─────────
const CLAVE = 'pianito-partituras';
export function cargarPartituras() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { return []; }
}
export function guardarPartituras(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
}
