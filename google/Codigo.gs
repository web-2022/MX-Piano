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
  'Vence el', 'Avisó pago', 'Recordatorio',
  // Programa "Invita y gana":
  'Código propio', 'Invitado por', 'Premio', 'Yape', 'Referido procesado',
];
const AGREGADAS = ['Vence el', 'Avisó pago', 'Recordatorio', 'Código propio', 'Invitado por', 'Premio', 'Yape', 'Referido procesado'];

// ---- Invita y gana (deben coincidir con "referidos" en js/config-nube.js) ----
const MESES_AMIGO = 2;          // meses extra para quien compra con un código
const MESES_INVITA = 2;         // meses gratis para quien invitó (premio "meses")
const COMISION = 10;            // soles para quien invitó (premio "dinero")
const MINIMO_PAGO = 30;         // se paga por Yape cuando junta al menos esto
const TOPE_MESES_ANIO = 12;     // máximo de meses gratis ganados en 12 meses
const DURACION_PASE_MESES = 12;
const C = Object.fromEntries(COLUMNAS.map((n, i) => [n, i]));
const VUELTAS = 300;            // vueltas del cifrado de la contraseña
const MAX_DISPOSITIVOS = 2;     // una cuenta se puede usar a la vez en 2 dispositivos como máximo
const MAX_DISPOSITIVOS_ADMIN = 6; // los administradores, en más (iPad, celular, compu, panel…)
const LINK_PAGO = 'https://express.culqi.com/pago/B8E48C18BA'; // para los correos de renovación
const LINK_APP = 'https://web-2022.github.io/MX-Piano/';
const DIAS_AVISO = 15;          // el correo de "tu pase vence pronto" sale 15 días antes
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
    tareaDiaria();
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
    ...datosReferidos(f),
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
  // Si ya hay 2 dispositivos, el más antiguo se desconecta (la próxima vez que abra la app le pedirá entrar).
  const max = siONo(f.v[C['Administrador']]) ? MAX_DISPOSITIVOS_ADMIN : MAX_DISPOSITIVOS;
  f.v[C.tokens] = tokens.slice(-max).join(',');
  f.v[C.intentos] = 0;
  f.v[C.bloqueo_hasta] = '';
  f.v[C['Último ingreso']] = new Date();
  asegurarCodigo(f);
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
      // Llegó con el código de alguien (enlace ?ref= o escrito a mano)
      const ref = normalCodigo(d.ref);
      if (ref && buscarPorCodigo(ref)) v[C['Invitado por']] = ref;
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
    if (!f.v[C['Código propio']]) conCandado(() => { asegurarCodigo(f); escribir(f); }); // cuentas antiguas
    return { cuenta: perfil(f, d.token) };
  },

  // Invita y gana: elegir premio (meses gratis o S/ por Yape)
  premioReferido(d) {
    return conCandado(() => {
      const f = buscarPorToken(d.token);
      if (!f) throw new Error('Vuelve a entrar a tu cuenta.');
      if (d.premio === 'dinero') {
        const yape = String(d.yape || '').replace(/\D/g, '');
        if (!/^9\d{8}$/.test(yape)) throw new Error('Escribe tu número de Yape (9 dígitos, empieza con 9).');
        f.v[C['Premio']] = 'dinero';
        f.v[C['Yape']] = "'" + yape; // como texto, para que la hoja no lo cambie
      } else {
        f.v[C['Premio']] = 'meses';
      }
      escribir(f);
      return { cuenta: perfil(f, d.token) };
    });
  },

  // Escribir el código de un amigo antes del primer pago
  aplicarCodigo(d) {
    return conCandado(() => {
      const f = buscarPorToken(d.token);
      if (!f) throw new Error('Vuelve a entrar a tu cuenta.');
      const codigo = normalCodigo(d.codigo);
      if (f.v[C['Invitado por']]) throw new Error('Ya tienes un código de invitación aplicado.');
      if (f.v[C['Pagado el']] || f.v[C['Referido procesado']]) throw new Error('El código solo se puede usar antes del primer pago.');
      const inv = buscarPorCodigo(codigo);
      if (!inv) throw new Error('Ese código no existe. Revisa que esté bien escrito.');
      if (inv.fila === f.fila) throw new Error('No puedes usar tu propio código.');
      f.v[C['Invitado por']] = codigo;
      escribir(f);
      return { cuenta: perfil(f, d.token) };
    });
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

  // Libro de Reclamaciones virtual: se guarda en la hoja "Reclamaciones" y se envía copia por correo.
  reclamo(d) {
    const t = (x, max) => textoCelda(x, max || 200);
    const obligatorios = ['tipo', 'nombres', 'apellidos', 'tipoDoc', 'numDoc', 'domicilio', 'telefono', 'correo', 'bien', 'detalle', 'pedido'];
    for (const k of obligatorios) if (!String(d[k] || '').trim()) throw new Error('Falta completar: ' + k);
    validarCorreo(normal(d.correo));
    if (!d.acepto) throw new Error('Debes marcar la declaración de veracidad.');
    return conCandado(() => {
      const h = hojaReclamos();
      const n = h.getLastRow(); // la fila 1 son los títulos
      const hoy = new Date();
      const codigo = 'LR-' + hoy.getFullYear() + '-' + String(n).padStart(4, '0');
      const limite = sumarDiasHabiles(hoy, 15);
      h.appendRow([codigo, hoy, d.tipo === 'queja' ? 'Queja' : 'Reclamo', t(d.nombres, 60), t(d.apellidos, 60),
        t(d.tipoDoc, 20) + ' ' + t(d.numDoc, 20), t(d.domicilio, 150), t(d.telefono, 20), normal(d.correo),
        t(d.bien, 150), t(d.monto, 20), t(d.detalle, 2000), t(d.pedido, 1000), t(d.apoderado, 120), 'Pendiente', limite, '', '']);
      const resumen = 'Código: ' + codigo + '\nFecha: ' + hoy.toLocaleString('es-PE') + '\nTipo: ' + (d.tipo === 'queja' ? 'Queja' : 'Reclamo') +
        '\nNombre: ' + t(d.nombres, 60) + ' ' + t(d.apellidos, 60) + '\nDocumento: ' + t(d.tipoDoc, 20) + ' ' + t(d.numDoc, 20) +
        '\nCorreo: ' + normal(d.correo) + '\nTeléfono: ' + t(d.telefono, 20) + '\nDomicilio: ' + t(d.domicilio, 150) +
        (d.apoderado ? '\nPadre, madre o apoderado: ' + t(d.apoderado, 120) : '') +
        '\n\nBien contratado: ' + t(d.bien, 150) + '\nMonto: ' + (t(d.monto, 20) || '-') +
        '\n\nDetalle:\n' + t(d.detalle, 2000) + '\n\nPedido del consumidor:\n' + t(d.pedido, 1000);
      try {
        MailApp.sendEmail({
          to: normal(d.correo),
          subject: 'Pianito: copia de tu ' + (d.tipo === 'queja' ? 'queja' : 'reclamo') + ' ' + codigo,
          body: 'Recibimos tu hoja de reclamación. Esta es tu copia.\n\n' + resumen +
            '\n\nTe responderemos a este correo a más tardar el ' + limite.toLocaleDateString('es-PE') + ' (15 días hábiles).\n\n🐸 Pianito',
        });
        const admins = correosAdmins();
        if (admins.length) MailApp.sendEmail({
          to: admins.join(','),
          subject: '📕 Pianito: nuevo ' + (d.tipo === 'queja' ? 'queja' : 'reclamo') + ' ' + codigo + ' (responder antes del ' + limite.toLocaleDateString('es-PE') + ')',
          body: resumen + '\n\nResponde al consumidor por correo antes del ' + limite.toLocaleDateString('es-PE') +
            ' y anota la respuesta en la hoja "Reclamaciones".\n' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
        });
      } catch (e) { /* sin cupo de correos: el reclamo queda guardado igual */ }
      return { codigo, fecha: hoy.toISOString(), limite: limite.toISOString() };
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
        codigo: f.v[C['Código propio']] || '',
        invitadoPor: f.v[C['Invitado por']] || '',
      })).reverse(),
      comisiones: comisionesPendientes(),
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
          procesarReferido(f, true);  // primer pago con código: premios para los dos
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

  // Comisiones: marcar como pagado lo que se le debía a alguien (después de hacerle el Yape)
  adminMarcarPagado(d) {
    exigirAdmin(d.token);
    return conCandado(() => {
      const h = hojaReferidos();
      const n = h.getLastRow() - 1;
      if (n < 1) return { pagado: 0 };
      const datos = h.getRange(2, 1, n, COL_REFERIDOS.length).getValues();
      let total = 0;
      datos.forEach((r, i) => {
        if (normal(r[2]) === normal(d.correo) && r[4] === 'dinero' && r[6] === 'Pendiente') {
          total += Number(r[5]) || 0;
          h.getRange(i + 2, 7, 1, 2).setValues([['Pagado', new Date()]]);
        }
      });
      return { pagado: total };
    });
  },
};

// ---------- Invita y gana ----------
const COL_REFERIDOS = ['Fecha', 'Código', 'Quién invitó', 'Amigo que pagó', 'Premio', 'Cantidad', 'Estado', 'Pagado el'];
function hojaReferidos() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName('Referidos');
  if (!h) {
    h = libro.insertSheet('Referidos');
    h.getRange(1, 1, 1, COL_REFERIDOS.length).setValues([COL_REFERIDOS]).setFontWeight('bold').setBackground('#dcfce7');
    h.setFrozenRows(1);
  }
  return h;
}
function filasReferidos() {
  const h = hojaReferidos();
  const n = h.getLastRow() - 1;
  return n < 1 ? [] : h.getRange(2, 1, n, COL_REFERIDOS.length).getValues();
}
const normalCodigo = (c) => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
function buscarPorCodigo(codigo) {
  const c = normalCodigo(codigo);
  if (!c) return null;
  return filas().find((f) => String(f.v[C['Código propio']]) === c) || null;
}
// Código propio: hasta 5 letras del nombre (o del correo) + 3 caracteres al azar. Ej.: SOFIA-7K2
function asegurarCodigo(f) {
  if (f.v[C['Código propio']]) return;
  const base = (String(f.v[C['Nombre del niño']] || '') || String(f.v[C['Correo']]).split('@')[0])
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'PIANO';
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const usados = new Set(filas().map((x) => String(x.v[C['Código propio']])));
  let codigo;
  do {
    let azar = '';
    for (let i = 0; i < 3; i++) azar += letras[Math.floor(Math.random() * letras.length)];
    codigo = base + '-' + azar;
  } while (usados.has(codigo));
  f.v[C['Código propio']] = codigo;
}
function sumarMeses(fecha, meses) {
  const d = new Date(fecha);
  d.setMonth(d.getMonth() + meses);
  return d;
}
// Lo que ve cada familia en su tarjeta "Invita y gana"
function datosReferidos(f) {
  const correo = normal(f.v[C['Correo']]);
  const mios = filasReferidos().filter((r) => normal(r[2]) === correo);
  const suma = (fn) => mios.filter(fn).reduce((t, r) => t + (Number(r[5]) || 0), 0);
  const yape = String(f.v[C['Yape']] || '').replace(/\D/g, '');
  return {
    codigo: f.v[C['Código propio']] || '',
    invitadoPor: f.v[C['Invitado por']] || '',
    premioReferido: f.v[C['Premio']] === 'dinero' ? 'dinero' : 'meses',
    yape: yape ? yape.slice(0, 3) + '•••' + yape.slice(-2) : '',
    referidos: {
      amigos: mios.length,
      meses: suma((r) => r[4] === 'meses'),
      porCobrar: suma((r) => r[4] === 'dinero' && r[6] === 'Pendiente'),
      cobrado: suma((r) => r[4] === 'dinero' && r[6] === 'Pagado'),
    },
  };
}
// Al activar el PRIMER pago de una cuenta que llegó con código: +2 meses al amigo y premio para quien invitó.
function procesarReferido(f, conCorreo) {
  if (f.v[C['Referido procesado']] || !f.v[C['Invitado por']]) return;
  f.v[C['Referido procesado']] = new Date();
  const inv = buscarPorCodigo(f.v[C['Invitado por']]);
  if (!inv || inv.fila === f.fila) return;
  // 1. El amigo: meses extra sobre su pase
  f.v[C['Vence el']] = sumarMeses(venceDe(f) || new Date(), MESES_AMIGO);
  // 2. Quien invitó
  const log = hojaReferidos();
  const ahora = new Date();
  let premio, cantidad, estado, mensaje;
  if (inv.v[C['Premio']] === 'dinero') {
    premio = 'dinero'; cantidad = COMISION; estado = 'Pendiente';
    const yaTiene = datosReferidos(inv).referidos.porCobrar + COMISION;
    mensaje = 'Ganaste S/ ' + COMISION + '. Llevas S/ ' + yaTiene + ' por cobrar' +
      (yaTiene >= MINIMO_PAGO ? '; te lo enviaremos por Yape a fin de mes.' : ' (pagamos por Yape desde S/ ' + MINIMO_PAGO + ').');
  } else {
    premio = 'meses';
    const hace1anio = sumarMeses(ahora, -12);
    const ganados = filasReferidos().filter((r) => normal(r[2]) === normal(inv.v[C['Correo']]) && r[4] === 'meses' && new Date(r[0]) > hace1anio)
      .reduce((t, r) => t + (Number(r[5]) || 0), 0);
    if (ganados + MESES_INVITA <= TOPE_MESES_ANIO) {
      cantidad = MESES_INVITA; estado = 'Aplicado';
      const base = paseVigente(inv) ? (venceDe(inv) || ahora) : ahora;
      inv.v[C['Vence el']] = sumarMeses(base, MESES_INVITA);
      inv.v[C['Pase completo']] = true;
      escribir(inv);
      mensaje = 'Ganaste ' + MESES_INVITA + ' meses gratis de pase completo. Ahora tu pase vence el ' +
        Utilities.formatDate(venceDe(inv), 'America/Lima', 'dd/MM/yyyy') + '.';
    } else {
      cantidad = 0; estado = 'Tope anual';
      mensaje = 'Ya alcanzaste el máximo de ' + TOPE_MESES_ANIO + ' meses gratis este año. ¡Gracias por recomendarnos!';
    }
  }
  log.appendRow([ahora, f.v[C['Invitado por']], inv.v[C['Correo']], f.v[C['Correo']], premio, cantidad, estado, '']);
  if (!conCorreo) return;
  try {
    MailApp.sendEmail({
      to: inv.v[C['Correo']],
      subject: '🎉 Pianito: tu amigo se unió con tu código',
      body: 'Hola,\n\nUna familia compró el pase completo de Pianito con tu código ' + f.v[C['Invitado por']] + '.\n' + mensaje +
        '\n\nSigue compartiendo tu código desde la app (Ajustes ⚙️ → Invita y gana): ' + LINK_APP + '\n\n🐸 Pianito',
    });
  } catch (e) { /* sin cupo de correos */ }
}
// Lo que se debe por Yape (para el Panel)
function comisionesPendientes() {
  const porCorreo = {};
  for (const r of filasReferidos()) {
    if (r[4] !== 'dinero' || r[6] !== 'Pendiente') continue;
    const c = normal(r[2]);
    porCorreo[c] = (porCorreo[c] || 0) + (Number(r[5]) || 0);
  }
  return Object.keys(porCorreo).map((correo) => {
    const f = buscarPorCorreo(correo);
    return { correo, monto: porCorreo[correo], yape: f ? String(f.v[C['Yape']] || '').replace(/\D/g, '') : '', listo: porCorreo[correo] >= MINIMO_PAGO };
  }).sort((a, b) => b.monto - a.monto);
}

function diasRestantes(f) {
  const v = venceDe(f);
  return v ? (v - new Date()) / 86400000 : Infinity;
}

const correosAdmins = () => filas().filter((x) => siONo(x.v[C['Administrador']])).map((x) => x.v[C['Correo']]).filter(Boolean);

// Correo a todas las cuentas marcadas como Administrador.
function avisarAdmins(f) {
  const admins = correosAdmins();
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

// ---------- Libro de Reclamaciones ----------
const COL_RECLAMOS = ['Código', 'Fecha', 'Tipo', 'Nombres', 'Apellidos', 'Documento', 'Domicilio', 'Teléfono', 'Correo',
  'Bien contratado', 'Monto', 'Detalle', 'Pedido', 'Apoderado (si es menor)', 'Estado', 'Responder antes del', 'Respuesta', 'Respondido el'];
function hojaReclamos() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName('Reclamaciones');
  if (!h) {
    h = libro.insertSheet('Reclamaciones');
    h.getRange(1, 1, 1, COL_RECLAMOS.length).setValues([COL_RECLAMOS]).setFontWeight('bold').setBackground('#fee2e2');
    h.setFrozenRows(1);
  }
  return h;
}
// Días hábiles: de lunes a viernes (no descuenta feriados; si cae uno en medio, responde un día antes).
function sumarDiasHabiles(desde, dias) {
  const d = new Date(desde);
  while (dias > 0) {
    d.setDate(d.getDate() + 1);
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) dias--;
  }
  return d;
}

// ---------- Avisos de vencimiento (una vez al día, con la primera visita del día) ----------
function tareaDiaria() {
  try {
    const props = PropertiesService.getScriptProperties();
    const hoy = Utilities.formatDate(new Date(), 'America/Lima', 'yyyy-MM-dd');
    if (props.getProperty('ultimaTarea') === hoy) return;
    props.setProperty('ultimaTarea', hoy);
    enviarRecordatorios();
  } catch (e) { /* nunca debe romper la respuesta a la app */ }
}

function enviarRecordatorios() {
  conCandado(() => {
    for (const f of filas()) {
      if (!siONo(f.v[C['Pase completo']])) continue;
      const vence = venceDe(f);
      if (!vence) continue;
      const dias = Math.ceil((vence - new Date()) / 86400000);
      const fechaTxt = Utilities.formatDate(vence, 'America/Lima', 'dd/MM/yyyy');
      const marca = String(f.v[C['Recordatorio']] || '');
      let tipo = null;
      if (dias > 0 && dias <= DIAS_AVISO && marca !== 'pronto:' + fechaTxt) tipo = 'pronto';
      else if (dias <= 0 && dias > -7 && marca !== 'vencio:' + fechaTxt) tipo = 'vencio';
      if (!tipo) continue;
      const nombre = f.v[C['Nombre del niño']];
      try {
        MailApp.sendEmail({
          to: f.v[C['Correo']],
          subject: tipo === 'pronto' ? '⏰ Pianito: tu pase completo vence el ' + fechaTxt : 'Pianito: tu pase completo venció',
          body: (tipo === 'pronto'
            ? 'Hola,\n\nEl pase completo de Pianito' + (nombre ? ' de ' + nombre : '') + ' vence el ' + fechaTxt + ' (en ' + dias + ' días).\n' +
              'Si renuevas antes, el nuevo año se suma desde esa fecha: no pierdes ningún día.'
            : 'Hola,\n\nEl pase completo de Pianito' + (nombre ? ' de ' + nombre : '') + ' venció el ' + fechaTxt + '.\n' +
              'El progreso y las estrellas se conservan: al renovar, sigue justo donde se quedó.') +
            '\n\n1. Renueva aquí (S/ 49.90 por un año): ' + LINK_PAGO + '\n   Usa el mismo correo de tu cuenta: ' + f.v[C['Correo']] +
            '\n2. Abre Pianito y toca "Ya pagué": ' + LINK_APP + '\n\n¡Gracias por aprender con nosotros! 🐸 Pianito',
        });
        f.v[C['Recordatorio']] = tipo + ':' + fechaTxt;
        escribir(f);
      } catch (e) { return; } // sin cupo de correos hoy: se intenta mañana
    }
  });
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
    // Si llegó con código y es su primer pago, se aplican los premios (sin correo: la hoja no puede enviarlos).
    try {
      const f = filas().find((x) => x.fila === fila);
      if (f && f.v[C['Invitado por']] && !f.v[C['Referido procesado']]) { procesarReferido(f, false); escribir(f); }
    } catch (err) { /* nada */ }
  } else {
    pagado.setValue('');
    vence.setValue('');
  }
}
