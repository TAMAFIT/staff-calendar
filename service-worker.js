const CACHE_NAME = "tamafit-staff-calendar-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/calendar.css",
  "./styles/forms.css",
  "./styles/history.css",
  "./app.bundle.js",
  "./service-worker.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html")
        .then((cached) => cached || fetch(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
