// public/sw.js
self.addEventListener('install', (e) => {
  // Fuerza a que el Service Worker se active de inmediato sin esperar
  self.skipWaiting();
  console.log('Service Worker: Instalado y Activado');
});

self.addEventListener('fetch', (e) => {
  // Mantiene la App funcionando mientras haya internet
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});