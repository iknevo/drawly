const CACHE_NAME = "drawly-v1";
const ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.method === "GET") {
      if (url.pathname.startsWith("/_next/static") || ASSETS.includes(url.pathname)) {
        event.respondWith(
          caches.match(request).then((cached) => cached || fetch(request)),
        );
        return;
      }
    }
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  );
});
