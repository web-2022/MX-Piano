// Acompañamiento musical: armoniza la melodía con los tres acordes básicos de Do mayor
// (Do, Fa y Sol) y la toca con un "bajo y acorde" suave, como una pequeña orquesta.
import { claseNota, notaAMidi } from './notas.js';
import { programarNota } from './sonido.js';

const ACORDES = {
  I: [0, 4, 7],        // Do mayor: Do Mi Sol
  IV: [5, 9, 0],       // Fa mayor: Fa La Do
  V: [7, 11, 2, 5],    // Sol 7: Sol Si Re Fa
};

// Elige un acorde para cada nota: mantiene el anterior si la nota cabe en él,
// deja pasar las notas cortas de tiempo débil (notas de paso) sin cambiar de acorde,
// y empieza y termina en Do (la "casa" de la canción).
// eventos: [{ midi, tiempos }]
export function armonizar(eventos) {
  let anterior = null;
  let pulso = 0;
  return eventos.map((e, i) => {
    const inicio = pulso;
    pulso += e.tiempos;
    if (e.midi == null) return anterior;
    const c = claseNota(e.midi);
    const cabe = (nombre) => ACORDES[nombre].includes(c);
    const debil = inicio % 2 !== 0 && e.tiempos <= 1;
    let elegido;
    if ((i === 0 || i === eventos.length - 1) && cabe('I')) elegido = 'I';
    else if (anterior && (cabe(anterior) || debil)) elegido = anterior;
    else elegido = ['I', 'IV', 'V'].find(cabe) || anterior || 'I';
    anterior = elegido;
    return elegido;
  });
}

// Convierte cualquier lección con melodía en una lista de { midi, tiempos, volumen }.
export function melodiaDe(leccion) {
  if (leccion.figuras) {
    return leccion.figuras.map(([n, t]) => ({ midi: n ? notaAMidi(n) : null, tiempos: t, volumen: 0.3 }));
  }
  if (leccion.secuencia) {
    return leccion.secuencia.map(([n, marca]) => ({
      midi: notaAMidi(n),
      tiempos: marca === 'larga' ? 2 : 1,
      volumen: marca === 'p' ? 0.1 : marca === 'f' ? 0.42 : 0.3,
      corta: marca === 'corta',
    }));
  }
  if (!leccion.notas) return [];
  const notas = leccion.notas.map(notaAMidi);
  return notas.map((midi, i) => ({
    midi,
    tiempos: leccion.tiempos?.[i] ?? (i === notas.length - 1 ? 2 : 1),
    volumen: 0.3,
  }));
}

// ¿La lección tiene una melodía que se pueda escuchar con orquesta?
export function tieneMelodia(leccion) {
  return leccion.tipo === 'cancion' || leccion.tipo === 'ritmo' || !!leccion.secuencia;
}

// Programa la canción completa. Devuelve los milisegundos que dura y, en "marcas",
// el momento (ms desde ahora) en que empieza cada nota, para iluminarla.
export function programarCancion(ctx, leccion, nodos, { acompanar = true, tempo } = {}) {
  const eventos = melodiaDe(leccion);
  const bpm = tempo || leccion.tempo || 96;
  const beat = 60 / bpm;
  const inicio = ctx.currentTime + 0.15;
  const acordes = armonizar(eventos);
  const midis = eventos.filter((e) => e.midi != null).map((e) => e.midi);
  const grave = Math.min(...midis) < 60;
  const baseBajo = 36;                 // Do2
  const baseAcorde = grave ? 60 : 48;  // el acorde no pisa la melodía

  const marcas = [];
  let t = 0;
  eventos.forEach((e, i) => {
    marcas.push({ indice: i, ms: (0.15 + t * beat) * 1000 });
    if (e.midi != null) {
      const dur = e.corta ? beat * 0.35 : e.tiempos * beat * 0.92;
      programarNota(ctx, e.midi, inicio + t * beat, dur, nodos, e.volumen);
    }
    t += e.tiempos;
  });
  const total = t;

  if (acompanar) {
    // Acorde vigente en cada pulso
    const acordeEn = (pulso) => {
      let acum = 0;
      for (let i = 0; i < eventos.length; i++) {
        if (pulso < acum + eventos[i].tiempos) return acordes[i];
        acum += eventos[i].tiempos;
      }
      return acordes[acordes.length - 1];
    };
    for (let p = 0; p < Math.ceil(total); p++) {
      const nombre = acordeEn(p);
      if (!nombre) continue;
      const notas = ACORDES[nombre];
      const cuando = inicio + p * beat;
      if (p % 2 === 0) {
        // Bajo: la raíz del acorde
        programarNota(ctx, baseBajo + notas[0], cuando, beat * 0.9, nodos, 0.16);
      } else {
        // Acorde cortito
        for (const c of notas.slice(0, 3)) programarNota(ctx, baseAcorde + c, cuando, beat * 0.5, nodos, 0.06);
      }
    }
    // Acorde final de Do, largo
    const fin = inicio + total * beat;
    programarNota(ctx, baseBajo, fin, beat * 2, nodos, 0.16);
    for (const c of ACORDES.I) programarNota(ctx, baseAcorde + c, fin, beat * 2, nodos, 0.07);
  }
  const ms = (0.15 + (total + (acompanar ? 2 : 0)) * beat) * 1000;
  return { ms, marcas };
}

// Acorde suave para acompañar una nota en vivo (mientras el niño toca la canción).
export function acordeEnVivo(ctx, leccion, indice, nodos) {
  const eventos = melodiaDe(leccion);
  const acordes = armonizar(eventos);
  const nombre = acordes[indice];
  if (!nombre) return;
  const grave = eventos.some((e) => e.midi != null && e.midi < 60);
  const cuando = ctx.currentTime + 0.02;
  programarNota(ctx, 36 + ACORDES[nombre][0], cuando, 0.9, nodos, 0.14);
  for (const c of ACORDES[nombre].slice(0, 3)) programarNota(ctx, (grave ? 60 : 48) + c, cuando, 0.7, nodos, 0.05);
}
