const STATIC_CACHE = 'gaited-static-v1';
const PURCHASED_CACHE = 'gaited-purchased-notes-v1';

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  // Add other critical static assets here in a production build
];

// Install Phase: Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate Phase: Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== PURCHASED_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Phase: Intercept Requests
self.addEventListener('fetch', (event) => {
  // We only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      // 1. Priority: Check PURCHASED_CACHE (for offline notes)
      // Open specifically to prioritize these high-value assets
      const purchasedCache = await caches.open(PURCHASED_CACHE);
      const purchasedResponse = await purchasedCache.match(event.request);
      if (purchasedResponse) {
        return purchasedResponse;
      }

      // 2. Check STATIC_CACHE
      const staticCache = await caches.open(STATIC_CACHE);
      const staticResponse = await staticCache.match(event.request);
      if (staticResponse) {
        return staticResponse;
      }

      // 3. Network Fallback
      try {
        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        // 4. Offline Fallback for Navigation
        if (event.request.mode === 'navigate') {
          // Try retrieving index.html from static cache
          const home = await staticCache.match('/index.html');
          if (home) return home;
          // Fallback just in case
          return caches.match('/index.html'); 
        }
        throw error;
      }
    })()
  );
});