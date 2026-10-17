const CACHE_NAME = 'exlead-pwa-v3';

// 1. Install Event: Skip waiting immediately agar SW baru langsung aktif
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Activate Event: Bersihkan cache versi lama (v1) dan klaim clients
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

// 3. Fetch Event
self.addEventListener('fetch', (event) => {
  // Hanya tangani GET request & http/https
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // Jangan sentuh request ke domain eksternal (Clerk auth, Google Fonts, CDN eksternal, dll.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Lewatkan request API, autentikasi, SSO, dan Next.js RSC dynamic payloads langsung ke server
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/sign-in') ||
    url.pathname.startsWith('/sign-up') ||
    url.pathname.startsWith('/sso-callback') ||
    url.searchParams.has('_rsc')
  ) {
    return;
  }

  // Untuk navigasi halaman (HTML document): Network-First agar status login & role selalu akurat
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Hanya cache jika respons valid status 200 dan basic
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {});
            }).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika offline, cari fallback di cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // Untuk asset statis Next.js & file media: Stale-While-Revalidate yang aman dan tidak mengunci body
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|css|js)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              // PENTING: Lakukan clone() secara sinkron SEBELUM networkResponse dipakai oleh browser!
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache).catch(() => {});
              }).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => {
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Permintaan lainnya: teruskan langsung ke network
});
