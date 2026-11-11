// Páginas legales: completa los datos del proveedor y envía la hoja de reclamación al programa de Google.
import { NUBE, EMPRESA } from './config-nube.js';

const $ = (s) => document.querySelector(s);

// Datos del proveedor y del pase en el texto (elementos con data-dato="...")
const DATOS = {
  ...EMPRESA,
  precio: NUBE.precio,
  dispositivos: NUBE.dispositivos,
  clasesGratis: NUBE.clasesGratis,
  devolucionDias: EMPRESA.devolucionDias,
};
document.querySelectorAll('[data-dato]').forEach((el) => {
  const v = DATOS[el.dataset.dato];
  if (v === '' || v === undefined || v === null) {
    // Dato todavía no configurado: se oculta su línea (o, dentro de un texto, se usa un genérico).
    const fila = el.closest('.fila-dato');
    if (fila) fila.remove();
    else el.textContent = el.dataset.dato === 'correo' ? 'el correo de atención indicado en la app' : '';
  } else {
    el.textContent = v;
  }
});
document.querySelectorAll('[data-correo]').forEach((a) => {
  if (EMPRESA.correo) a.href = 'mailto:' + EMPRESA.correo;
});

// ---- Libro de Reclamaciones ----
const form = $('#form-reclamo');
if (form) {
  $('#fecha-hoy').textContent = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  $('#precio-bien').placeholder = `Ej. Pase completo de Pianito por un año (${NUBE.precio})`;
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = $('#msg-reclamo');
    const datos = Object.fromEntries(new FormData(form).entries());
    datos.acepto = !!form.acepto.checked;
    if (!NUBE.scriptUrl) { msg.textContent = 'El libro todavía no está conectado. Escríbenos por correo.'; return; }
    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    msg.textContent = '';
    try {
      const resp = await fetch(NUBE.scriptUrl, { method: 'POST', body: JSON.stringify({ accion: 'reclamo', ...datos }) });
      const r = await resp.json();
      if (!r.ok) throw new Error(r.error || 'No se pudo registrar.');
      form.classList.add('oculto');
      const listo = $('#listo');
      listo.classList.remove('oculto');
      $('#listo-codigo').textContent = r.codigo;
      $('#listo-fecha').textContent = new Date(r.fecha).toLocaleString('es-PE');
      $('#listo-limite').textContent = new Date(r.limite).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
      $('#listo-correo').textContent = datos.correo;
      listo.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      msg.textContent = /fetch|network|Failed/i.test(e.message) ? 'No hay conexión a internet. Inténtalo de nuevo.' : e.message;
    } finally {
      boton.disabled = false;
    }
  });
}

// Si no quedó ningún dato del proveedor, se quita el recuadro.
document.querySelectorAll('.proveedor').forEach((p) => { if (!p.querySelector('.fila-dato')) p.remove(); });
