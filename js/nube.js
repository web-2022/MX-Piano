// Cuentas de Pianito guardadas en Google Sheets (a través de Google Apps Script: google/Codigo.gs).
// La cuenta se guarda también en el dispositivo, así la app funciona sin internet.
import { NUBE } from './config-nube.js';

const CLAVE_LOCAL = 'pianito-cuenta';

export const configurada = () => !!NUBE.scriptUrl;

// ---- Copia local de la cuenta (incluye el token de la sesión) ----
export function cuentaLocal() {
  try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL)) || null; } catch { return null; }
}
function guardarLocal(c) {
  try {
    if (c) localStorage.setItem(CLAVE_LOCAL, JSON.stringify(c));
    else localStorage.removeItem(CLAVE_LOCAL);
  } catch { /* modo privado */ }
}

// ¿Puede usar esta clase? indice = posición de la clase en el viaje (0 = la primera).
// Sin configurar la nube, todo abierto.
export function leccionAbierta(indice) {
  if (!configurada()) return true;
  if (indice < NUBE.clasesGratis) return true;
  return !!cuentaLocal()?.premium;
}
export const esPremium = () => !configurada() || !!cuentaLocal()?.premium;

// Llama al programa de Google. Se envía como texto (sin cabeceras especiales) para que el
// navegador no haga una consulta previa, que Google no acepta.
export async function llamar(accion, datos = {}) {
  let resp;
  try {
    resp = await fetch(NUBE.scriptUrl, { method: 'POST', body: JSON.stringify({ accion, ...datos }) });
  } catch {
    throw new Error('No hay conexión a internet. Inténtalo de nuevo.');
  }
  let r;
  try { r = await resp.json(); } catch { throw new Error('El servidor no respondió bien. Inténtalo de nuevo.'); }
  if (!r.ok) throw new Error(r.error || 'Algo salió mal.');
  return r;
}

// Lee la cuenta del servidor (el pase completo puede haberse activado desde la hoja o el panel).
export async function actualizarPerfil() {
  const local = cuentaLocal();
  if (!configurada() || !local?.token) return local;
  let r;
  try { r = await llamar('perfil', { token: local.token }); } catch { return local; } // sin internet
  if (!r.cuenta) { guardarLocal(null); return null; } // sesión cerrada en otro lado
  guardarLocal(r.cuenta);
  return r.cuenta;
}

export async function registrar(correo, clave, nombre) {
  const r = await llamar('registrar', { correo, clave, nombre });
  guardarLocal(r.cuenta);
  return { cuenta: r.cuenta };
}

export async function entrar(correo, clave) {
  const r = await llamar('entrar', { correo, clave });
  guardarLocal(r.cuenta);
  return r.cuenta;
}

// Envía un código de 6 números al correo.
export async function olvideClave(correo) {
  await llamar('olvide', { correo });
}

// Cambia la contraseña con el código del correo y deja la sesión abierta.
export async function restablecerClave(correo, codigo, clave) {
  const r = await llamar('restablecer', { correo, codigo, clave });
  guardarLocal(r.cuenta);
  return r.cuenta;
}

export async function salir() {
  const local = cuentaLocal();
  guardarLocal(null);
  if (local?.token) { try { await llamar('salir', { token: local.token }); } catch { /* sin internet */ } }
}

export { NUBE };
