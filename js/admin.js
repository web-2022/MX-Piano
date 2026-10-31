// Panel de administrador de Pianito: ver cuentas y activar el pase completo a quien pagó.
// La seguridad la pone Supabase (supabase/esquema.sql): solo una cuenta con es_admin puede ver y cambiar.
import { configurada, obtenerCliente } from './nube.js';

const $ = (s) => document.querySelector(s);
let sb = null;
let perfiles = [];

function aviso(el, texto, bien = false) {
  el.textContent = texto;
  el.classList.toggle('bien', bien);
}

async function iniciar() {
  if (!configurada()) { $('#sin-config').classList.remove('oculto'); return; }
  sb = await obtenerCliente();
  const { data: { session } } = await sb.auth.getSession();
  if (session) await entrarAlPanel(session);
  else $('#form-login').classList.remove('oculto');
}

async function entrarAlPanel(session) {
  const { data, error } = await sb.from('perfiles').select('es_admin').eq('id', session.user.id).maybeSingle();
  if (error || !data?.es_admin) {
    await sb.auth.signOut();
    $('#form-login').classList.remove('oculto');
    aviso($('#msg-login'), 'Esta cuenta no es de administrador.');
    return;
  }
  $('#form-login').classList.add('oculto');
  $('#panel').classList.remove('oculto');
  $('#sesion').classList.remove('oculto');
  $('#sesion-correo').textContent = session.user.email + ' ';
  await cargar();
}

async function cargar() {
  aviso($('#msg-panel'), 'Cargando…', true);
  const { data, error } = await sb.from('perfiles')
    .select('id, correo, nombre, premium, pagado_en, nota, creado')
    .order('creado', { ascending: false });
  if (error) { aviso($('#msg-panel'), 'No se pudo cargar: ' + error.message); return; }
  perfiles = data;
  aviso($('#msg-panel'), '');
  dibujar();
}

const fecha = (t) => (t ? new Date(t).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function dibujar() {
  $('#n-total').textContent = perfiles.length;
  $('#n-pago').textContent = perfiles.filter((p) => p.premium).length;
  $('#n-gratis').textContent = perfiles.filter((p) => !p.premium).length;
  const q = $('#buscar').value.trim().toLowerCase();
  const filtro = $('#filtro').value;
  const lista = perfiles.filter((p) =>
    (!q || (p.correo || '').toLowerCase().includes(q) || (p.nombre || '').toLowerCase().includes(q)) &&
    (filtro === 'todos' || (filtro === 'pago') === !!p.premium));
  $('#vacio').classList.toggle('oculto', lista.length > 0);
  $('#filas').innerHTML = lista.map((p) => `
    <tr data-id="${p.id}">
      <td class="correo">${escapar(p.correo)}</td>
      <td>${escapar(p.nombre) || '<small>—</small>'}</td>
      <td><small>${fecha(p.creado)}</small></td>
      <td><span class="estado ${p.premium ? 'pago' : ''}">${p.premium ? '⭐ Pase completo' : 'Gratis'}</span>
        ${p.premium && p.pagado_en ? `<br><small>desde ${fecha(p.pagado_en)}</small>` : ''}</td>
      <td><input class="nota" value="${escapar(p.nota)}" placeholder="Código de operación" aria-label="Nota"></td>
      <td class="acciones">
        ${p.premium
          ? '<button class="suave quitar">Quitar</button>'
          : '<button class="activar">✅ Activar</button>'}
      </td>
    </tr>`).join('');
}

async function cambiar(id, cambios, boton, redibujar = true) {
  boton.disabled = true;
  const { error } = await sb.from('perfiles').update(cambios).eq('id', id);
  boton.disabled = false;
  if (error) { aviso($('#msg-panel'), 'No se pudo guardar: ' + error.message); return; }
  Object.assign(perfiles.find((p) => p.id === id), cambios);
  aviso($('#msg-panel'), 'Guardado ✔', true);
  if (redibujar) dibujar();
}

$('#filas').addEventListener('click', (ev) => {
  const fila = ev.target.closest('tr');
  if (!fila) return;
  const id = fila.dataset.id;
  const nota = fila.querySelector('.nota').value.trim() || null;
  if (ev.target.matches('.activar')) cambiar(id, { premium: true, pagado_en: new Date().toISOString(), nota }, ev.target);
  if (ev.target.matches('.quitar')) {
    const p = perfiles.find((x) => x.id === id);
    if (confirm(`¿Quitar el pase completo a ${p.correo}?`)) cambiar(id, { premium: false, pagado_en: null, nota }, ev.target);
  }
});
// La nota se guarda al salir del campo
$('#filas').addEventListener('change', (ev) => {
  if (!ev.target.matches('.nota')) return;
  const id = ev.target.closest('tr').dataset.id;
  cambiar(id, { nota: ev.target.value.trim() || null }, ev.target, false); // sin redibujar: no se pierde el clic en Activar
});

$('#form-login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  aviso($('#msg-login'), 'Entrando…', true);
  const { data, error } = await sb.auth.signInWithPassword({ email: $('#correo').value.trim(), password: $('#clave').value });
  if (error) { aviso($('#msg-login'), 'Correo o contraseña incorrectos.'); return; }
  aviso($('#msg-login'), '');
  await entrarAlPanel(data.session);
});
$('#btn-salir').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });
$('#btn-recargar').addEventListener('click', cargar);
$('#buscar').addEventListener('input', dibujar);
$('#filtro').addEventListener('change', dibujar);

iniciar();
