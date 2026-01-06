const CACHE_NAME = 'consejero-legacy-v2';

// Archivos esenciales para que la App abra sin señal
const ASSETS_TO_CACHE = [
  '/',
  '/biblioteca',
  '/manifest.json',
  '/icon-512.png',
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs'
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Limpiamos versiones viejas si las hubiera
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si ya lo tenemos en caché (libro o icono), lo entregamos de inmediato
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Si es un PDF de Firebase, lo guardamos para lectura offline futura
        if (event.request.url.includes('firebasestorage')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si no hay red y no está en caché, no rompemos la app
        return new Response("Sin conexión a la red.");
      });
    })
  );
});