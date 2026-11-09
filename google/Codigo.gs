/**
 * Pianito — cuentas en Google Sheets.
 * Este programa vive pegado a la hoja de cálculo "Pianito · Cuentas" y es lo único que la app puede usar:
 * nadie ve la hoja directamente. Las contraseñas se guardan cifradas (nunca en texto).
 *
 * Para activar a una familia que pagó: marca la casilla "Pase completo" de su fila (o usa el Panel).
 * El pase dura UN AÑO: al marcarlo se anota "Vence el" (hoy + 1 año). Si "Vence el" está vacío, no vence.
 * Instalación: README.md → "Cuentas con Google Sheets".
 */

// Ejecuta esta función una vez desde el editor para crear la hoja y dar los permisos.
function preparar() {
  hoja();
  Logger.log('Hoja lista: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
}

const HOJA = 'Cuentas';
const COLUMNAS = [
  'Correo', 'Nombre del niño', 'Pase completo', 'Administrador', 'Nota (código Culqi)', 'Pagado el',
  'Registrado el', 'Último ingreso',
  // Columnas técnicas (no las edites):
  'hash', 'sal', 'tokens', 'intentos', 'bloqueo_hasta', 'codigo', 'codigo_vence',
  // Agregadas después (van al final para no mover los datos que ya existen):
  'Vence el', 'Avisó pago',
];
const AGREGADAS = ['Vence el', 'Avisó pago'];
const DURACION_PASE_MESES = 12;
const C = Object.fromEntries(COLUMNAS.map((n, i) => [n, i]));
const VUELTAS = 300;            // vueltas del cifrado de la contraseña
const MAX_TOKENS = 6;           // sesiones abiertas a la vez por cuenta (iPad, celular, compu…)
const MAX_INTENTOS = 8;         // intentos fallidos antes de bloquear 15 minutos

// ---------- Entrada ----------
function doPost(e) {
  let r;
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const accion = ACCIONES[d.accion];
    if (!accion) throw new Error('Acción desconocida');
    r = accion(d);
    r.ok = true;
  } catch (err) {
    r = { ok: false, error: String(err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, app: 'pianito' })).setMimeType(ContentService.MimeType.JSON);
}

// ---------- Hoja ----------
function hoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName(HOJA);
  if (!h) {
    h = libro.insertSheet(HOJA);
    h.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold').setBackground('#ede9fe');
    h.setFrozenRows(1);
    h.hideColumns(C.hash + 1, COLUMNAS.length - C.hash);
    h.setColumnWidth(1, 240);
    h.setColumnWidth(5, 180);
  }
  // Hojas creadas antes de que existieran estas columnas: se agrega su título.
  for (const nombre of AGREGADAS) {
    const titulo = h.getRange(1, C[nombre] + 1);
    if (titulo.getValue() !== nombre) titulo.setValue(nombre).setFontWeight('bold').setBackground('#ede9fe');
  }
  return h;
}

function filas() {
  const h = hoja();
  const n = h.getLastRow() - 1;
  if (n < 1) return [];
  return h.getRange(2, 1, n, COLUMNAS.length).getValues().map((v, i) => ({ fila: i + 2, v }));
}

const normal = (correo) => String(correo || '').trim().toLowerCase();
function buscarPorCorreo(correo) {
  const c = normal(correo);
  return filas().find((f) => normal(f.v[C['Correo']]) === c) || null;
}
function buscarPorToken(token) {
  if (!token) return null;
  return filas().find((f) => String(f.v[C.tokens]).split(',').includes(token)) || null;
}
function escribir(f) {
  hoja().getRange(f.fila, 1, 1, COLUMNAS.length).setValues([f.v]);
}

// ---------- Utilidades ----------
function cifrar(clave, sal) {
  let x = sal + '|' + clave;
  for (let i = 0; i < VUELTAS; i++) {
    x = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, x + sal, Utilities.Charset.UTF_8));
  }
  return 'h:' + x; // el prefijo evita que la hoja lo lea como fórmula (base64 puede empezar con + o =)
}
// Texto seguro para una celda: sin = + - @ al inicio (la hoja lo tomaría como fórmula).
const textoCelda = (t, max) => String(t || '').replace(/^[=+\-@\s]+/, '').slice(0, max);
const nuevoToken = () => Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
const siONo = (x) => x === true || String(x).toUpperCase() === 'TRUE';

// Fecha de vencimiento del pase (null = no vence) y si el pase está vigente hoy.
function venceDe(f) {
  const v = f.v[C['Vence el']];
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
}
function paseVigente(f) {
  if (!siONo(f.v[C['Pase completo']])) return false;
  const v = venceDe(f);
  return !v || v > new Date();
}
// Un año más: desde hoy, o desde el vencimiento actual si todavía no venció (renovación anticipada).
function sumarUnAnio(f) {
  const v = venceDe(f);
  const base = v && v > new Date() ? new Date(v) : new Date();
  base.setMonth(base.getMonth() + DURACION_PASE_MESES);
  return base;
}

function perfil(f, token) {
  return {
    correo: f.v[C['Correo']],
    nombre: f.v[C['Nombre del niño']] || '',
    premium: paseVigente(f),
    venceEl: venceDe(f) ? venceDe(f).toISOString() : null,
    vencido: siONo(f.v[C['Pase completo']]) && !paseVigente(f),
    esAdmin: siONo(f.v[C['Administrador']]),
    token: token || undefined,
  };
}

function abrirSesion(f) {
  const token = nuevoToken();
  const tokens = String(f.v[C.tokens] || '').split(',').filter(Boolean);
  tokens.push(token);
  f.v[C.tokens] = tokens.slice(-MAX_TOKENS).join(',');
  f.v[C.intentos] = 0;
  f.v[C.bloqueo_hasta] = '';
  f.v[C['Último ingreso']] = new Date();
  escribir(f);
  return token;
}

function conCandado(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function validarCorreo(correo) {
  if (!/^[^\s@=+\-][^\s@]*@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('Escribe un correo válido.');
}
function validarClave(clave) {
  if (String(clave || '').length < 6) throw new Error('La contraseña debe tener al menos 6 letras o números.');
}

// ---------- Acciones ----------
const ACCIONES = {
  registrar(d) {
    const correo = normal(d.correo);
    validarCorreo(correo);
    validarClave(d.clave);
    return conCandado(() => {
      if (buscarPorCorreo(correo)) throw new Error('Ese correo ya tiene cuenta. Usa "Ya tengo cuenta".');
      const sal = Utilities.getUuid();
      const v = COLUMNAS.map(() => '');
      v[C['Correo']] = correo;
      v[C['Nombre del niño']] = textoCelda(d.nombre, 40);
      v[C['Pase completo']] = false;
      v[C['Administrador']] = false;
      v[C['Registrado el']] = new Date();
      v[C.sal] = sal;
      v[C.hash] = cifrar(d.clave, sal);
      v[C.intentos] = 0;
      const h = hoja();
      h.appendRow(v);
      const fila = h.getLastRow();
      h.getRange(fila, C['Pase completo'] + 1, 1, 2).insertCheckboxes();
      const f = { fila, v };
      return { cuenta: perfil(f, abrirSesion(f)) };
    });
  },

  entrar(d) {
    return conCandado(() => {
      const f = buscarPorCorreo(d.correo);
      if (!f) throw new Error('Correo o contraseña incorrectos.');
      const bloqueo = f.v[C.bloqueo_hasta];
      if (bloqueo && new Date(bloqueo) > new Date()) throw new Error('Demasiados intentos. Espera unos minutos.');
      if (cifrar(d.clave, f.v[C.sal]) !== f.v[C.hash]) {
        f.v[C.intentos] = Number(f.v[C.intentos] || 0) + 1;
        if (f.v[C.intentos] >= MAX_INTENTOS) {
          f.v[C.bloqueo_hasta] = new Date(Date.now() + 15 * 60000);
          f.v[C.intentos] = 0;
        }
        escribir(f);
        throw new Error('Correo o contraseña incorrectos.');
      }
      return { cuenta: perfil(f, abrirSesion(f)) };
    });
  },

  perfil(d) {
    const f = buscarPorToken(d.token);
    if (!f) return { cuenta: null };
    return { cuenta: perfil(f, d.token) };
  },

  salir(d) {
    return conCandado(() => {
      const f = buscarPorToken(d.token);
      if (f) {
        f.v[C.tokens] = String(f.v[C.tokens]).split(',').filter((t) => t && t !== d.token).join(',');
        escribir(f);
      }
      return {};
    });
  },

  // Olvidé mi contraseña: envía un código de 6 números al correo (desde tu Gmail).
  olvide(d) {
    return conCandado(() => {
      const f = buscarPorCorreo(d.correo);
      if (f) {
        const codigo = String(Math.floor(100000 + Math.random() * 900000));
        f.v[C.codigo] = codigo;
        f.v[C.codigo_vence] = new Date(Date.now() + 30 * 60000);
        escribir(f);
        MailApp.sendEmail({
          to: f.v[C['Correo']],
          subject: 'Pianito: tu código para cambiar la contraseña',
          body: 'Hola,\n\nTu código para crear una nueva contraseña en Pianito es: ' + codigo +
            '\n\nVence en 30 minutos. Si no lo pediste, ignora este correo.\n\n🐸 Pianito',
        });
      }
      return {}; // misma respuesta exista o no el correo
    });
  },

  restablecer(d) {
    validarClave(d.clave);
    return conCandado(() => {
      const f = buscarPorCorreo(d.correo);
      const vence = f && f.v[C.codigo_vence];
      if (!f || !f.v[C.codigo] || String(d.codigo).trim() !== String(f.v[C.codigo]) || !vence || new Date(vence) < new Date()) {
        throw new Error('El código no es correcto o ya venció. Pide uno nuevo.');
      }
      const sal = Utilities.getUuid();
      f.v[C.sal] = sal;
      f.v[C.hash] = cifrar(d.clave, sal);
      f.v[C.codigo] = '';
      f.v[C.codigo_vence] = '';
      f.v[C.tokens] = ''; // cierra las sesiones anteriores
      return { cuenta: perfil(f, abrirSesion(f)) };
    });
  },

  // "Ya pagué": la familia avisa que pagó. Queda la fecha en la hoja y se avisa por correo a los administradores.
  avisoPago(d) {
    return conCandado(() => {
      const f = buscarPorToken(d.token);
      if (!f) return { cuenta: null };
      if (paseVigente(f) && diasRestantes(f) > 30) return { cuenta: perfil(f, d.token) }; // ya está activa
      const antes = f.v[C['Avisó pago']] ? new Date(f.v[C['Avisó pago']]) : null;
      f.v[C['Avisó pago']] = new Date();
      escribir(f);
      // Un solo correo cada 6 horas por cuenta (aunque toque "Ya pagué" muchas veces).
      if (!antes || isNaN(antes) || Date.now() - antes.getTime() > 6 * 3600000) avisarAdmins(f);
      return { cuenta: perfil(f, d.token), avisado: true };
    });
  },

  // ---- Panel de administrador ----
  adminListar(d) {
    exigirAdmin(d.token);
    return {
      cuentas: filas().map((f) => ({
        correo: f.v[C['Correo']],
        nombre: f.v[C['Nombre del niño']] || '',
        premium: paseVigente(f),
        vencido: siONo(f.v[C['Pase completo']]) && !paseVigente(f),
        venceEl: venceDe(f) ? venceDe(f).toISOString() : null,
        nota: f.v[C['Nota (código Culqi)']] || '',
        pagadoEn: f.v[C['Pagado el']] || null,
        avisoPago: f.v[C['Avisó pago']] || null,
        creado: f.v[C['Registrado el']] || null,
      })).reverse(),
    };
  },

  adminCambiar(d) {
    exigirAdmin(d.token);
    return conCandado(() => {
      const f = buscarPorCorreo(d.correo);
      if (!f) throw new Error('No existe esa cuenta.');
      if ('nota' in d) f.v[C['Nota (código Culqi)']] = textoCelda(d.nota, 120);
      if ('premium' in d) {
        if (d.premium) {
          // Activar o renovar: un año más (si todavía estaba vigente, se suma al vencimiento actual).
          f.v[C['Vence el']] = sumarUnAnio(f);
          f.v[C['Pase completo']] = true;
          f.v[C['Pagado el']] = new Date();
          f.v[C['Avisó pago']] = ''; // ya se atendió el aviso
        } else {
          f.v[C['Pase completo']] = false;
          f.v[C['Pagado el']] = '';
          f.v[C['Vence el']] = '';
        }
      }
      escribir(f);
      return { venceEl: venceDe(f) ? venceDe(f).toISOString() : null };
    });
  },
};

function diasRestantes(f) {
  const v = venceDe(f);
  return v ? (v - new Date()) / 86400000 : Infinity;
}

// Correo a todas las cuentas marcadas como Administrador.
function avisarAdmins(f) {
  const admins = filas().filter((x) => siONo(x.v[C['Administrador']])).map((x) => x.v[C['Correo']]).filter(Boolean);
  if (!admins.length) return;
  const correo = f.v[C['Correo']];
  const nombre = f.v[C['Nombre del niño']];
  try {
    MailApp.sendEmail({
      to: admins.join(','),
      subject: '🔔 Pianito: ' + correo + ' dice que ya pagó',
      body: 'La cuenta ' + correo + (nombre ? ' (' + nombre + ')' : '') + ' tocó "Ya pagué" en la app.\n\n' +
        '1. Revisa en Culqi (Ventas) que el pago de ese correo haya llegado.\n' +
        '2. En el Panel de Pianito, busca el correo y pulsa "Activar 1 año".\n\n' +
        'Hoja de cuentas: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '\n\n🐸 Pianito',
    });
  } catch (e) { /* sin cupo de correos hoy: el aviso queda igual en la hoja */ }
}

function exigirAdmin(token) {
  const f = buscarPorToken(token);
  if (!f || !siONo(f.v[C['Administrador']])) throw new Error('Esta cuenta no es de administrador.');
}

// Si marcas "Pase completo" a mano en la hoja, se anotan solas la fecha de pago y el vencimiento (+1 año).
function onEdit(e) {
  const h = e.range.getSheet();
  if (h.getName() !== HOJA || e.range.getColumn() !== C['Pase completo'] + 1 || e.range.getRow() < 2) return;
  const fila = e.range.getRow();
  const pagado = h.getRange(fila, C['Pagado el'] + 1);
  const vence = h.getRange(fila, C['Vence el'] + 1);
  if (siONo(e.range.getValue())) {
    const v = new Date();
    v.setMonth(v.getMonth() + DURACION_PASE_MESES);
    pagado.setValue(new Date());
    vence.setValue(v);
    h.getRange(fila, C['Avisó pago'] + 1).setValue('');
  } else {
    pagado.setValue('');
    vence.setValue('');
  }
}
