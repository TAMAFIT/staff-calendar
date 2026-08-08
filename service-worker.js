const CACHE_NAME = "tamafit-staff-calendar-v2";
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
  "./src/app.js",
  "./src/config.js",
  "./src/router.js",
  "./src/state.js",
  "./src/data/mock-calendar.js",
  "./src/services/calendar-repository.js",
  "./src/services/local-calendar-repository.js",
  "./src/services/google-calendar-repository.js",
  "./src/services/repository-factory.js",
  "./src/utils/date.js",
  "./src/utils/html.js",
  "./src/views/app-shell.js",
  "./src/views/month-view.js",
  "./src/views/week-view.js",
  "./src/views/day-view.js",
  "./src/views/booking-form-view.js"
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
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
