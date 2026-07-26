// Network-first, not cache-first. The previous version served the cached
// app shell forever once cached, and only ever checked the network on a
// total cache miss — meaning testers could be stuck on an old deployed
// version indefinitely even while online and a new version was live,
// with no visible symptom pointing to why. This was very likely the
// actual cause behind repeated "why isn't my fix showing up" reports.
//
// Now: always try the network first (so you get the latest deploy while
// online), and only fall back to the cache when the network genuinely
// fails (offline). The cache is refreshed with every successful response.
const CACHE = "geenie-v2";
const ASSETS = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(e.request).then((cached) => cached || caches.match("/")))
  );
});
