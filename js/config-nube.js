// Configuración de cuentas y pagos de Pianito.
// Mientras supabaseUrl esté vacío, la app funciona como antes: sin registro y todo abierto.
// Pasos para llenarlo: README.md → "Cuentas, pagos y panel de administrador".
export const NUBE = {
  // Supabase → Project Settings → API
  supabaseUrl: 'https://rhskytadammthiuigrcc.supabase.co',
  supabaseClave: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc2t5dGFkYW1tdGhpdWlncmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NDIwMjksImV4cCI6MjEwOTAxODAyOX0.u2OAX3ZmkaPLf9TkugG-UbpJJzTqlJRuXEQKH8uAQis', // anon public (es pública)

  // Culqi → Links de pago: crea un link con el precio y pégalo aquí
  culqiLink: '',            // ej. 'https://express.culqi.com/pago/XXXXXX'
  precio: 'S/ 49.90',       // texto que ve el papá en la ventana de pago
  whatsapp: '',             // tu número con código de país, sin + (ej. '51987654321'), para avisar el pago

  // Niveles gratis: del 0 hasta este número (0, 1, 2 y 3 = los 4 primeros)
  gratisHastaNivel: 3,
};
