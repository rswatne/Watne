const CACHE_NAME = 'lonnskalkulator-v3';

// Installer Service Worker og tving umiddelbar overtagelse utan ventetid
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Slett absolutt all gammel cache ved aktivering slik at nyaste versjon visast
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          console.log('[PWA] Sletter gammel cache:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// NETWORK-FIRST / ALWAYS-NETWORK STRATEGI
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});