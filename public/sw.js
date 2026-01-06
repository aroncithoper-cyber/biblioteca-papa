// public/sw.js
self.addEventListener('install', (e) => {
  console.log('Service Worker: Instalado');
});

self.addEventListener('fetch', (e) => {
  // Esto engaña al navegador para que crea que funciona offline
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});