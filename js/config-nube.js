// Configuración de cuentas y pagos de Pianito.
// Las cuentas se guardan en una hoja de Google Sheets (programa: google/Codigo.gs).
// Mientras scriptUrl esté vacío, la app funciona sin registro y todo abierto.
// Pasos: README.md → "Cuentas con Google Sheets".
export const NUBE = {
  // Dirección del programa de Google (Implementar → Aplicación web → URL que termina en /exec)
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxiUSqzguyB4eHk6Vx6t6Na_di4pwbfxAqMJaW0oAJv93oiFYFDN-FiOGqhYkgDzMny_Q/exec',

  // Culqi → Links de pago: crea un link con el precio y pégalo aquí
  culqiLink: 'https://express.culqi.com/pago/B8E48C18BA',
  precio: 'S/ 49.90',       // texto que ve el papá en la ventana de pago
  whatsapp: '',             // tu número con código de país, sin + (ej. '51987654321'), para avisar el pago

  // Clases gratis: las primeras de este número en el viaje (los juegos siempre son gratis)
  clasesGratis: 3,
};
