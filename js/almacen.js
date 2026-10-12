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
  voz: true,
  notaReferencia: true,
  tecladoPantalla: false,
  mostrarDetector: false,
  desbloquearTodo: false,
  sensibilidad: 5,
};

export const cargarAjustes = () => leer('pianito-ajustes', AJUSTES_DEFECTO);
export const guardarAjustes = (a) => escribir('pianito-ajustes', a);

export const cargarProgreso = () => leer('pianito-progreso', { estrellas: {} });
export const guardarProgreso = (p) => escribir('pianito-progreso', p);
