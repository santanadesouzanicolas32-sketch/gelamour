const CACHE_VERSION = 'v6';
const STATIC_CACHE = `gelamour-static-${CACHE_VERSION}`;
const IMAGE_CACHE  = `gelamour-images-${CACHE_VERSION}`;
const API_CACHE    = `gelamour-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/gelamour/',
  '/gelamour/index.html',
  '/gelamour/manifest.json',
  '/gelamour/css/styles.css',
  '/gelamour/js/app.js',
  '/gelamour/icon-192.png',
  '/gelamour/icon-512.png',
  '/gelamour/images/logo.webp',
];

// Install: precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('gelamour-') && ![STATIC_CACHE, IMAGE_CACHE, API_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Supabase / APIs externas: network only
  if (url.hostname.includes('supabase.co') || url.hostname.includes('asaas.com')) return;

  // 2. Navegacao HTML: network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/gelamour/index.html'))
    );
    return;
  }

  // 3. Imagens: stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async cache => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then(resp => {
          if (resp.ok) cache.put(request, resp.clone());
          return resp;
        });
        return cached ?? fetchPromise;
      })
    );
    return;
  }

  // 4. CSS/JS: cache first, update em background
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async cache => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then(resp => {
          if (resp.ok) cache.put(request, resp.clone());
          return resp;
        });
        return cached ?? fetchPromise;
      })
    );
    return;
  }

  // 5. Demais: network first
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});
