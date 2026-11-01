const CACHE_NAME = 'teinespotter-v2';

self.addEventListener('install', (event) => {
  // Tvinger den nye service workeren til å bli aktiv med en gang
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Sletter gamle cacher og tar kontroll over åpne sider umiddelbart
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first for koden vår, så nyeste GitHub Pages-endring alltid hentes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Kart-tiles (WMS) håndteres direkte av nettleseren for jevn flyt
  if (url.origin.includes('geonorge.no') || url.origin.includes('ngu.no') || url.origin.includes('fiskeridir.no')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
