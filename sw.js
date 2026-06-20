var CACHE = 'gelamour-v1';
var ASSETS = [
  '/gelamour/',
  '/gelamour/index.html',
  '/gelamour/manifest.json',
  '/gelamour/icon-192.png',
  '/gelamour/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Supabase: sempre busca da rede
  if (e.request.url.indexOf('supabase.co') !== -1) return;

  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});

// Push notifications
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Gelamour', {
      body: data.body || 'Novo pedido recebido!',
      icon: '/gelamour/icon-192.png',
      badge: '/gelamour/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});
