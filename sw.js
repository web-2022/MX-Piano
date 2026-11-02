// Service worker: guarda la app para que funcione sin internet.
// Cambia VERSION cada vez que publiques cambios, para que el iPad descargue lo nuevo.
const VERSION = 'pianito-v21';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/estilos.css',
  './js/app.js',
  './js/almacen.js',
  './js/detector.js',
  './js/juegos.js',
  './js/expresion.js',
  './js/acompanamiento.js',
  './js/voz.js',
  './js/acordes.js',
  './js/leccion-acordes.js',
  './js/partituras.js',
  './js/lecciones.js',
  './js/notas.js',
  './js/pentagrama.js',
  './js/sonido.js',
  './js/tono.js',
  './js/nube.js',
  './js/config-nube.js',
  './img/rana.png',
  './icons/icono-192.png',
  './icons/icono-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Primero la red (para ver cambios mientras desarrollas); si no hay internet, la copia guardada.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Cuentas (Google) y el panel de administrador: siempre directo a internet, nunca guardados.
  const url = new URL(e.request.url);
  const deLaApp = url.origin === self.location.origin || url.hostname === 'cdn.jsdelivr.net';
  if (!deLaApp || url.pathname.endsWith('/admin.html') || url.pathname.endsWith('/js/admin.js')) return;
  e.respondWith(
    // no-cache: pregunta siempre al servidor si hay versión nueva (sin esto el navegador
    // usa su copia por 10 minutos y una publicación nueva tarda en llegar).
    fetch(e.request, { cache: 'no-cache' })
      .then((resp) => {
        const copia = resp.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
