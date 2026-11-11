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
    dibujarComisiones(r.comisiones || []);
    cargarCodigos();
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
      <td class="correo">${escapar(p.correo)}${p.invitadoPor ? `<br><span class="ref">🎁 llegó con ${escapar(p.invitadoPor)}</span>` : ''}${p.avisoPago ? `<br><span class="aviso-pago">🔔 Dice que pagó · ${fechaHora(p.avisoPago)}</span>` : ''}</td>
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

// ---- Códigos de activación ----
let lotes = [];
async function cargarCodigos() {
  try {
    lotes = (await llamar('adminCodigos', { token })).lotes || [];
    dibujarCodigos();
  } catch (e) { $('#cod-lotes').textContent = 'No se pudieron cargar los códigos: ' + e.message; }
}
function dibujarCodigos() {
  const q = $('#cod-buscar').value.trim().toUpperCase();
  $('#cod-lotes').innerHTML = lotes.length ? lotes.map((l, i) => {
    const lista = l.codigos.filter((c) => !q || c.codigo.includes(q) || String(c.usadoPor).toUpperCase().includes(q));
    if (q && !lista.length) return '';
    return `<div class="lote" data-i="${i}">
      <div class="lote-cab"><b>${escapar(l.lote)}</b><span>${l.meses} meses · ${fecha(l.creado)}</span>
        <span>${l.usados}/${l.total} usados${l.anulados ? ` · ${l.anulados} anulados` : ''}</span>
        <button class="suave ver-lote">${q ? 'Ocultar' : 'Ver códigos'}</button><button class="suave csv-lote">CSV</button></div>
      <div class="lote-lista ${q ? '' : 'oculto'}">${lista.map((c) => `<div class="cod"><span>${escapar(c.codigo)}</span>
        <span class="est ${escapar(c.estado)}">${escapar(c.estado)}</span>
        ${c.usadoPor ? `<small>${escapar(c.usadoPor)} · ${fecha(c.usadoEl)}</small>` : ''}
        ${c.estado === 'Disponible' ? `<button class="suave anular" data-codigo="${escapar(c.codigo)}">Anular</button>` : ''}</div>`).join('')}</div>
    </div>`;
  }).join('') : '<p class="nota-comisiones">Todavía no generaste códigos.</p>';
}
function descargarCsv(nombre, filas) {
  const csv = filas.map((f) => f.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  a.download = nombre.replace(/[^\w-]+/g, '_') + '.csv';
  a.click();
}
let ultimoLote = null;
$('#form-codigos').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const boton = ev.target.querySelector('button[type="submit"]');
  boton.disabled = true;
  try {
    const r = await llamar('adminGenerarCodigos', { token, lote: $('#cod-lote').value.trim(), cantidad: $('#cod-cantidad').value, meses: $('#cod-meses').value });
    ultimoLote = r;
    $('#cod-nuevos').classList.remove('oculto');
    $('#cod-msg').textContent = `✔ ${r.codigos.length} códigos de ${r.meses} meses · lote "${r.lote}". Cópialos o descárgalos.`;
    const base = location.href.replace(/admin\.html.*$/, '');
    $('#cod-texto').value = r.codigos.map((c) => `${c}   ${base}?canje=${c}`).join('\n');
    await cargarCodigos();
  } catch (e) { aviso($('#msg-panel'), 'No se pudieron generar: ' + e.message); }
  finally { boton.disabled = false; }
});
$('#cod-copiar').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#cod-texto').value); $('#cod-copiar').textContent = '✔ Copiados'; } catch { $('#cod-texto').select(); }
  setTimeout(() => { $('#cod-copiar').textContent = 'Copiar todos'; }, 1500);
});
$('#cod-csv').addEventListener('click', () => {
  if (!ultimoLote) return;
  const base = location.href.replace(/admin\.html.*$/, '');
  descargarCsv('codigos-' + ultimoLote.lote, [['Código', 'Enlace para canjear', 'Meses', 'Lote'], ...ultimoLote.codigos.map((c) => [c, `${base}?canje=${c}`, ultimoLote.meses, ultimoLote.lote])]);
});
$('#cod-buscar').addEventListener('input', dibujarCodigos);
$('#cod-lotes').addEventListener('click', async (ev) => {
  const lote = ev.target.closest('.lote');
  if (ev.target.matches('.ver-lote')) {
    const lista = lote.querySelector('.lote-lista');
    lista.classList.toggle('oculto');
    ev.target.textContent = lista.classList.contains('oculto') ? 'Ver códigos' : 'Ocultar';
  }
  if (ev.target.matches('.csv-lote')) {
    const l = lotes[lote.dataset.i];
    descargarCsv('codigos-' + l.lote, [['Código', 'Estado', 'Usado por', 'Usado el', 'Meses', 'Lote'],
      ...l.codigos.map((c) => [c.codigo, c.estado, c.usadoPor, c.usadoEl ? fecha(c.usadoEl) : '', l.meses, l.lote])]);
  }
  if (ev.target.matches('.anular')) {
    const codigo = ev.target.dataset.codigo;
    if (!confirm(`¿Anular ${codigo}? Ya no se podrá canjear.`)) return;
    try { await llamar('adminAnularCodigo', { token, codigo }); await cargarCodigos(); aviso($('#msg-panel'), `Anulado ✔ ${codigo}`, true); }
    catch (e) { aviso($('#msg-panel'), e.message); cargarCodigos(); }
  }
});

function dibujarComisiones(lista) {
  $('#comisiones').classList.toggle('oculto', !lista.length);
  $('#lista-comisiones').innerHTML = lista.map((c) => `
    <div class="fila-comision" data-correo="${escapar(c.correo)}">
      <span>${c.listo ? '✅' : '⏳'}</span><b>${escapar(c.correo)}</b>
      <span class="monto">S/ ${c.monto}</span>
      <span class="yape">Yape: ${escapar(c.yape || 'sin número')}</span>
      <button class="suave pagar-comision">Marcar pagado</button>
    </div>`).join('');
}
$('#lista-comisiones').addEventListener('click', async (ev) => {
  if (!ev.target.matches('.pagar-comision')) return;
  const fila = ev.target.closest('.fila-comision');
  const correo = fila.dataset.correo;
  if (!confirm(`¿Ya le pagaste por Yape a ${correo}? Se marcará como pagado.`)) return;
  ev.target.disabled = true;
  try {
    const r = await llamar('adminMarcarPagado', { token, correo });
    await cargar();
    aviso($('#msg-panel'), `Pagado ✔ S/ ${r.pagado} a ${correo}`, true);
  } catch (e) {
    aviso($('#msg-panel'), 'No se pudo marcar: ' + e.message);
    ev.target.disabled = false;
  }
});

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
