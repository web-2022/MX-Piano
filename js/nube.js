// Cuentas de Pianito (Supabase): registro, ingreso y si la cuenta ya pagó (premium).
// La cuenta se guarda también en el dispositivo, así la app funciona sin internet.
import { NUBE } from './config-nube.js';

export const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const CLAVE_LOCAL = 'pianito-cuenta';

export const configurada = () => !!(NUBE.supabaseUrl && NUBE.supabaseClave);

let cliente = null;
export async function obtenerCliente() {
  if (!configurada()) return null;
  if (!cliente) {
    const { createClient } = await import(SUPABASE_JS);
    cliente = createClient(NUBE.supabaseUrl, NUBE.supabaseClave, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return cliente;
}

// ---- Copia local de la cuenta ----
export function cuentaLocal() {
  try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL)) || null; } catch { return null; }
}
function guardarLocal(c) {
  try {
    if (c) localStorage.setItem(CLAVE_LOCAL, JSON.stringify(c));
    else localStorage.removeItem(CLAVE_LOCAL);
  } catch { /* modo privado */ }
}

// ¿Puede usar este nivel? (sin configurar la nube, todo abierto)
export function nivelPermitido(nivel) {
  if (!configurada()) return true;
  if (nivel <= NUBE.gratisHastaNivel) return true;
  return !!cuentaLocal()?.premium;
}
export const esPremium = () => !configurada() || !!cuentaLocal()?.premium;

// Lee el perfil del servidor (premium puede haber cambiado desde el panel).
export async function actualizarPerfil() {
  const sb = await obtenerCliente();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    return cuentaLocal(); // sin sesión válida (o sin internet): se queda la copia local
  }
  const { data, error } = await sb.from('perfiles').select('correo, nombre, premium, es_admin').eq('id', session.user.id).maybeSingle();
  if (error) return cuentaLocal();
  const c = {
    id: session.user.id,
    correo: data?.correo || session.user.email,
    nombre: data?.nombre || session.user.user_metadata?.nombre || '',
    premium: !!data?.premium,
    esAdmin: !!data?.es_admin,
  };
  guardarLocal(c);
  return c;
}

const MENSAJES = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'User already registered': 'Ese correo ya tiene cuenta. Usa "Ya tengo cuenta".',
  'Email not confirmed': 'Primero confirma tu correo (revisa tu bandeja de entrada).',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 letras o números.',
};
const traducir = (e) => {
  const m = e?.message || String(e);
  for (const [k, v] of Object.entries(MENSAJES)) if (m.includes(k)) return v;
  if (/fetch|network|Failed/i.test(m)) return 'No hay conexión a internet. Inténtalo de nuevo.';
  if (/rate limit/i.test(m)) return 'Demasiados intentos. Espera unos minutos.';
  return m;
};

export async function registrar(correo, clave, nombre) {
  const sb = await obtenerCliente();
  const { data, error } = await sb.auth.signUp({
    email: correo, password: clave,
    options: { data: { nombre }, emailRedirectTo: location.origin + location.pathname },
  });
  if (error) throw new Error(traducir(error));
  if (!data.session) return { confirmar: true }; // el proyecto pide confirmar el correo
  return { cuenta: await actualizarPerfil() };
}

export async function entrar(correo, clave) {
  const sb = await obtenerCliente();
  const { error } = await sb.auth.signInWithPassword({ email: correo, password: clave });
  if (error) throw new Error(traducir(error));
  return actualizarPerfil();
}

export async function olvideClave(correo) {
  const sb = await obtenerCliente();
  const { error } = await sb.auth.resetPasswordForEmail(correo, { redirectTo: location.origin + location.pathname });
  if (error) throw new Error(traducir(error));
}

export async function cambiarClave(clave) {
  const sb = await obtenerCliente();
  const { error } = await sb.auth.updateUser({ password: clave });
  if (error) throw new Error(traducir(error));
}

export async function salir() {
  try { await (await obtenerCliente())?.auth.signOut(); } catch { /* sin internet */ }
  guardarLocal(null);
}

// Avisa cuando el papá abrió el enlace de "olvidé mi contraseña".
export async function alRecuperarClave(fn) {
  const sb = await obtenerCliente();
  sb?.auth.onAuthStateChange((evento) => { if (evento === 'PASSWORD_RECOVERY') fn(); });
}

export { NUBE };
