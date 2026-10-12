// Utilidades de notas musicales: nombres, colores, frecuencias.
// MIDI: Do central (Do4) = 60, La4 = 69 = 440 Hz.

export const NOMBRES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];

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
  return NOMBRES[claseNota(midi)];
}

export function nombreConOctava(midi) {
  return nombreNota(midi) + (Math.floor(midi / 12) - 1);
}

export function colorNota(midi) {
  return COLORES[claseNota(midi)] || '#334155';
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
