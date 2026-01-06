self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Necesario para que Chrome lo considere PWA instalable (sin romper Next)
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
