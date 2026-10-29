// Guarda progreso y ajustes en el propio dispositivo (sin servidor).

function leer(clave, porDefecto) {
  try {
    const texto = localStorage.getItem(clave);
    return texto ? { ...porDefecto, ...JSON.parse(texto) } : { ...porDefecto };
  } catch {
    return { ...porDefecto };
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* modo privado o almacenamiento lleno: la app sigue funcionando */
  }
}

const AJUSTES_DEFECTO = {
  modo: null,          // 'peques' (4 a 7 años) | 'grandes' (8 o más). null = todavía no eligió
  voz: true,
  notaReferencia: true,
  acompanarVivo: false,
  pedal: false,           // modo pedal: se juzga lo que acaba de sonar, no lo que sigue sonando
  velocidadRitmo: 1,      // 0.5 / 0.75 / 1 en las lecciones con metrónomo
  vozAguda: true,
  tecladoPantalla: false,
  mostrarDetector: false,
  desbloquearTodo: false,
  sensibilidad: 5,
};

export const cargarAjustes = () => leer('pianito-ajustes', AJUSTES_DEFECTO);
export const guardarAjustes = (a) => escribir('pianito-ajustes', a);

export const cargarProgreso = () => leer('pianito-progreso', { estrellas: {} });
export const guardarProgreso = (p) => escribir('pianito-progreso', p);
