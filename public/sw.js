// MegaCard Service Worker for PWA
const CACHE_NAME = 'megacard-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/cover-fallback.avif',
  '/profile-fallback.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first strategy with cache fallback
  if (event.request.method !== 'GET') return;
  
  // Ignore unsupported schemes like chrome-extension, data, blob, etc.
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and put into cache if valid (only basic or cors type)
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          }).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
