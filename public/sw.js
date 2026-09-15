const CACHE_NAME = 'exlead-pwa-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache only the offline page if we had one.
      // We'll leave it empty to just rely on network for now.
      return cache.addAll(['/']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through for API requests, auth, and next.js dynamic routes
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') || 
    event.request.url.includes('/sign-in') ||
    event.request.url.includes('/sign-up')
  ) {
    return;
  }
  
  // Basic stale-while-revalidate strategy for GET requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // network failure, let the cache return if we have it
      });
      return cachedResponse || fetchPromise;
    })
  );
});
