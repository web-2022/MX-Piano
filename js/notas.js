// Utilidades de notas musicales: nombres, colores, frecuencias.
// MIDI: Do central (Do4) = 60, La4 = 69 = 440 Hz.

export const NOMBRES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
export const NOMBRES_BEMOL = ['Do', 'Re♭', 'Re', 'Mi♭', 'Mi', 'Fa', 'Sol♭', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];

// Las teclas negras se llaman con sostenido (Fa♯) o con bemol (Si♭) según la tonalidad
// de la lección. La app lo cambia al empezar cada lección (opción "bemoles: true").
let conBemoles = false;
export function usarBemoles(si) { conBemoles = !!si; }
export function hayBemoles() { return conBemoles; }

// Un color por nota natural (como las pegatinas en las teclas).
export const COLORES = {
  0: '#ef4444',  // Do  - rojo
  2: '#f97316',  // Re  - naranja
  4: '#eab308',  // Mi  - amarillo
  5: '#22c55e',  // Fa  - verde
  7: '#06b6d4',  // Sol - celeste
  9: '#3b82f6',  // La  - azul
  11: '#a855f7', // Si  - morado
};

// Dedo en la posición de Do (clase de nota -> número de dedo).
export const DEDO_POSICION_DO = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5 };          // mano derecha
export const DEDO_IZQUIERDA_POSICION_DO = { 0: 5, 2: 4, 4: 3, 5: 2, 7: 1 }; // mano izquierda

const BASE = { Do: 0, Re: 2, Mi: 4, Fa: 5, Sol: 7, La: 9, Si: 11 };

export function claseNota(midi) {
  return ((midi % 12) + 12) % 12;
}

export function nombreNota(midi) {
  return (conBemoles ? NOMBRES_BEMOL : NOMBRES)[claseNota(midi)];
}

export function nombreConOctava(midi) {
  return nombreNota(midi) + (Math.floor(midi / 12) - 1);
}

// Las teclas negras toman el color de su vecina: Fa♯ el de Fa, Si♭ el de Si.
export function colorNota(midi) {
  const c = claseNota(midi);
  if (COLORES[c]) return COLORES[c];
  return COLORES[conBemoles ? (c + 1) % 12 : c - 1] || '#334155';
}

export function esTeclaNegra(midi) {
  return [1, 3, 6, 8, 10].includes(claseNota(midi));
}

export function midiAFrecuencia(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function frecuenciaAMidi(frecuencia) {
  return 69 + 12 * Math.log2(frecuencia / 440);
}

// Convierte "Do4", "Fa#4", "Sib3" en número MIDI.
export function notaAMidi(texto) {
  const m = texto.match(/^(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?(-?\d)$/);
  if (!m) throw new Error('Nota no válida: ' + texto);
  const alteracion = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + BASE[m[1]] + alteracion;
}

// Paso diatónico absoluto (Do4 = 28, Re4 = 29...), respetando si la lección usa bemoles.
const PASOS = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const PASOS_B = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
export function pasoDiatonico(midi) {
  return (Math.floor(midi / 12) - 1) * 7 + (conBemoles ? PASOS_B : PASOS)[claseNota(midi)];
}
