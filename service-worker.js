const CACHE_NAME = "tamafit-staff-calendar-v16";
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
  "./styles/sync.css",
  "./src/local-first-app.js",
  "./src/calendar-view-toggle.js",
  "./src/calendar-swipe.js",
  "./src/action-feedback.js",
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

function cacheResponse(request, response, event) {
  if (!response?.ok) return response;
  const copy = response.clone();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
  return response;
}

function networkFirst(request, event, fallbackRequest = request) {
  return fetch(request)
    .then((response) => cacheResponse(fallbackRequest, response, event))
    .catch(() => caches.match(fallbackRequest));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, event, "./index.html"));
    return;
  }

  // Code and styles update from the network when available, but remain usable offline.
  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(networkFirst(request, event));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(request, response, event)))
  );
});
