const CACHE_NAME = 'lonnskalkulator-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
  'https://sigurd-seland.no/uploads/lge5O4Vz/354x0_458x0/35f30681-5749-426a-bc82-3ec4dc053599.png'
];

// Installer Service Worker og tving umiddelbar overtagelse
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA] Bufret oppdaterte statiske filer');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Slett gammel cache automatisk ved aktivering
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA] Sletter gammel cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// NETWORK FIRST STRATEGI FOR INDEX.HTML (Henter alltid nyeste versjon fra nett)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // For HTML-sider: Hent fra nettverk først for å unngå gammel cache, fallback til cache om offline
  if (event.request.mode === 'navigate' || requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/') {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // For andre statiske ressurser (bilder/fonter): Cache first, fallback til nettverk
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});