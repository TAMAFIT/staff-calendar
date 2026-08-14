const CACHE_NAME = "tamafit-staff-calendar-v26";
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
  "./styles/quick-booking.css",
  "./styles/ui-stage1.css",
  "./src/calendar-fetch-status.js",
  "./src/legacy-recurring-history-cleanup.js",
  "./src/local-first-app.js",
  "./src/calendar-view-toggle.js",
  "./src/calendar-swipe.js",
  "./src/quick-booking.js",
  "./src/action-feedback.js",
  "./src/history-data.js",
  "./src/history-ui.js",
  "./src/services/history-v2-calendar-repository.js",
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

function cachedFirstAndRefresh(request, event) {
  return caches.match(request).then((cached) => {
    const network = fetch(request)
      .then((response) => cacheResponse(request, response, event))
      .catch(() => null);

    if (cached) {
      // The installed app shell should become interactive from local storage first.
      // Refresh the cached copy in the background for the next launch.
      event.waitUntil(network.then(() => undefined));
      return cached;
    }

    return network.then((response) => response || Response.error());
  });
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

  // App code is an app-shell dependency: use the cached copy immediately so
  // gesture/navigation behavior never waits on a slow mobile network. The
  // network still refreshes the same cache in the background.
  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(cachedFirstAndRefresh(request, event));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(request, response, event)))
  );
});