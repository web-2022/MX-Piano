// Panel de administrador de Pianito: ver cuentas y activar el pase completo a quien pagó.
// La seguridad la pone el programa de Google (google/Codigo.gs): solo una cuenta marcada como
// "Administrador" en la hoja puede ver y cambiar las cuentas.
import { configurada, llamar } from './nube.js';

const $ = (s) => document.querySelector(s);
const CLAVE_ADMIN = 'pianito-admin'; // sesión del panel (aparte de la cuenta de la app)
let token = null;
let perfiles = [];

function aviso(el, texto, bien = false) {
  el.textContent = texto;
  el.classList.toggle('bien', bien);
}
const leerSesion = () => { try { return JSON.parse(localStorage.getItem(CLAVE_ADMIN)); } catch { return null; } };
const guardarSesion = (x) => {
  try { if (x) localStorage.setItem(CLAVE_ADMIN, JSON.stringify(x)); else localStorage.removeItem(CLAVE_ADMIN); } catch { /* */ }
};

// Dentro de la app (pestaña 🛠️ Panel) se usa la sesión de la cuenta abierta en la app.
const EMBEBIDO = new URLSearchParams(location.search).has('embebido');
if (EMBEBIDO) document.body.classList.add('embebido');
const cuentaApp = () => { try { return JSON.parse(localStorage.getItem('pianito-cuenta')); } catch { return null; } };

async function iniciar() {
  if (!configurada()) { $('#sin-config').classList.remove('oculto'); return; }
  const app = cuentaApp();
  if (app?.esAdmin && app.token) {
    token = app.token;
    mostrarPanel(app.correo);
    if (await cargar()) return;
    token = null;
    $('#panel').classList.add('oculto');
    $('#sesion').classList.add('oculto');
  }
  const s = leerSesion();
  if (s?.token) {
    token = s.token;
    mostrarPanel(s.correo);
    if (await cargar()) return;
    token = null; // la sesión ya no vale
    guardarSesion(null);
    $('#panel').classList.add('oculto');
    $('#sesion').classList.add('oculto');
  }
  $('#form-login').classList.remove('oculto');
}

function mostrarPanel(correo) {
  $('#form-login').classList.add('oculto');
  $('#panel').classList.remove('oculto');
  $('#sesion').classList.remove('oculto');
  $('#sesion-correo').textContent = correo + ' ';
}

async function cargar() {
  aviso($('#msg-panel'), 'Cargando…', true);
  try {
    const r = await llamar('adminListar', { token });
    perfiles = r.cuentas;
    aviso($('#msg-panel'), '');
    dibujar();
    return true;
  } catch (e) {
    aviso($('#msg-panel'), 'No se pudo cargar: ' + e.message);
    return false;
  }
}

const fecha = (t) => (t ? new Date(t).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const fechaHora = (t) => new Date(t).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function dibujar() {
  $('#n-total').textContent = perfiles.length;
  $('#n-pago').textContent = perfiles.filter((p) => p.premium).length;
  $('#n-gratis').textContent = perfiles.filter((p) => !p.premium).length;
  const q = $('#buscar').value.trim().toLowerCase();
  const filtro = $('#filtro').value;
  const lista = perfiles.filter((p) =>
    (!q || (p.correo || '').toLowerCase().includes(q) || (p.nombre || '').toLowerCase().includes(q)) &&
    (filtro === 'todos' || (filtro === 'avisos' ? !!p.avisoPago : (filtro === 'pago') === !!p.premium)));
  // Primero los que avisaron "Ya pagué" (los más recientes arriba); después el resto en el orden de siempre.
  lista.sort((a, b) => (b.avisoPago ? new Date(b.avisoPago).getTime() : 0) - (a.avisoPago ? new Date(a.avisoPago).getTime() : 0));
  const avisos = perfiles.filter((p) => p.avisoPago).length;
  $('#aviso-pagos').textContent = avisos ? `🔔 ${avisos} ${avisos === 1 ? 'familia dice' : 'familias dicen'} que ya pagó: revisa Culqi y actívalas.` : '';
  $('#vacio').classList.toggle('oculto', lista.length > 0);
  $('#filas').innerHTML = lista.map((p) => `
    <tr data-correo="${escapar(p.correo)}">
      <td class="correo">${escapar(p.correo)}${p.avisoPago ? `<br><span class="aviso-pago">🔔 Dice que pagó · ${fechaHora(p.avisoPago)}</span>` : ''}</td>
      <td>${escapar(p.nombre) || '<small>—</small>'}</td>
      <td><small>${fecha(p.creado)}</small></td>
      <td><span class="estado ${p.premium ? 'pago' : p.vencido ? 'vencido' : ''}">${p.premium ? '⭐ Pase completo' : p.vencido ? 'Vencido' : 'Gratis'}</span>
        ${p.venceEl ? `<br><small>${p.premium ? 'hasta' : 'venció el'} ${fecha(p.venceEl)}</small>` : p.premium ? '<br><small>sin vencimiento</small>' : ''}</td>
      <td><input class="nota" value="${escapar(p.nota)}" placeholder="Código de operación" aria-label="Nota"></td>
      <td class="acciones">
        ${p.premium
          ? '<button class="activar suave">+1 año</button><button class="suave quitar">Quitar</button>'
          : `<button class="activar">✅ ${p.vencido ? 'Renovar' : 'Activar'} 1 año</button>`}
      </td>
    </tr>`).join('');
}

async function cambiar(correo, cambios, boton, redibujar = true) {
  boton.disabled = true;
  let r;
  try {
    r = await llamar('adminCambiar', { token, correo, ...cambios });
  } catch (e) {
    aviso($('#msg-panel'), 'No se pudo guardar: ' + e.message);
    return;
  } finally {
    boton.disabled = false;
  }
  const p = perfiles.find((x) => x.correo === correo);
  Object.assign(p, cambios);
  if ('premium' in cambios) {
    p.pagadoEn = cambios.premium ? new Date().toISOString() : null;
    p.venceEl = r?.venceEl || null;
    p.vencido = false;
    if (cambios.premium) p.avisoPago = null;
  }
  aviso($('#msg-panel'), 'Guardado ✔', true);
  if (redibujar) dibujar();
}

$('#filas').addEventListener('click', (ev) => {
  const fila = ev.target.closest('tr');
  if (!fila) return;
  const correo = fila.dataset.correo;
  const nota = fila.querySelector('.nota').value.trim();
  if (ev.target.matches('.activar')) cambiar(correo, { premium: true, nota }, ev.target); // activa o suma un año
  if (ev.target.matches('.quitar') && confirm(`¿Quitar el pase completo a ${correo}?`)) {
    cambiar(correo, { premium: false, nota }, ev.target);
  }
});
// La nota se guarda al salir del campo (sin redibujar: así no se pierde el clic en Activar)
$('#filas').addEventListener('change', (ev) => {
  if (!ev.target.matches('.nota')) return;
  cambiar(ev.target.closest('tr').dataset.correo, { nota: ev.target.value.trim() }, ev.target, false);
});

$('#form-login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  aviso($('#msg-login'), 'Entrando…', true);
  try {
    const r = await llamar('entrar', { correo: $('#correo').value.trim().toLowerCase(), clave: $('#clave').value });
    if (!r.cuenta.esAdmin) {
      llamar('salir', { token: r.cuenta.token }).catch(() => {});
      aviso($('#msg-login'), 'Esta cuenta no es de administrador.');
      return;
    }
    token = r.cuenta.token;
    guardarSesion({ token, correo: r.cuenta.correo });
    aviso($('#msg-login'), '');
    mostrarPanel(r.cuenta.correo);
    await cargar();
  } catch (e) {
    aviso($('#msg-login'), e.message);
  }
});
$('#btn-salir').addEventListener('click', async () => {
  const t = token;
  guardarSesion(null);
  try { await llamar('salir', { token: t }); } catch { /* sin internet */ }
  location.reload();
});
$('#btn-recargar').addEventListener('click', cargar);
$('#buscar').addEventListener('input', dibujar);
$('#filtro').addEventListener('change', dibujar);

iniciar();
