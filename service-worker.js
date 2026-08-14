const CACHE_NAME = "tamafit-staff-calendar-v28";
const APP_ENTRY_URL = new URL("./index.html", self.location.href).href;
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

function cacheResponse(request, response, event) {
  if (!response?.ok) return response;
  const copy = response.clone();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
  return response;
}

function cachedFirstAndRefresh(request, event) {
  return caches.match(request).then((cached) => {
    const network = fetch(request)
      .then((response) => cacheResponse(request, response, event))
      .catch(() => null);

    if (cached) {
      event.waitUntil(network.then(() => undefined));
      return cached;
    }

    return network.then((response) => response || Response.error());
  });
}

function cachedNavigation(request, event) {
  return caches.match(APP_ENTRY_URL).then((cached) => {
    const network = fetch(request)
      .then((response) => cacheResponse(APP_ENTRY_URL, response, event))
      .catch(() => null);

    if (cached) {
      // Installed launches become interactive from the local app shell immediately.
      // Refresh index.html in the background for the next launch.
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
    event.respondWith(cachedNavigation(request, event));
    return;
  }

  // App code and styles are app-shell dependencies: serve the installed copy
  // immediately and refresh it in the background for the next launch.
  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(cachedFirstAndRefresh(request, event));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(request, response, event)))
  );
});
