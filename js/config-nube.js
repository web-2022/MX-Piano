// Configuración de cuentas y pagos de Pianito.
// Las cuentas se guardan en una hoja de Google Sheets (programa: google/Codigo.gs).
// Mientras scriptUrl esté vacío, la app funciona sin registro y todo abierto.
// Pasos: README.md → "Cuentas con Google Sheets".
export const NUBE = {
  // Dirección del programa de Google (Implementar → Aplicación web → URL que termina en /exec)
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxiUSqzguyB4eHk6Vx6t6Na_di4pwbfxAqMJaW0oAJv93oiFYFDN-FiOGqhYkgDzMny_Q/exec',

  // Culqi → Links de pago: crea un link con el precio y pégalo aquí
  culqiLink: '',            // ej. 'https://express.culqi.com/pago/XXXXXX'
  precio: 'S/ 49.90',       // texto que ve el papá en la ventana de pago
  whatsapp: '',             // tu número con código de país, sin + (ej. '51987654321'), para avisar el pago

  // Niveles gratis: del 0 hasta este número (0, 1, 2 y 3 = los 4 primeros)
  gratisHastaNivel: 3,
};
