const CACHE = "giessen-bus-cache-v1";
const PRECACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/main.js",
  "/manifest.json",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", ev => {
  ev.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", ev => {
  ev.respondWith(
    caches.match(ev.request).then(resp => resp || fetch(ev.request))
  );
});
