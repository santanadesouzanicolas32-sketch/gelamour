var CACHE = 'gelamour-v3';
var ASSETS = [
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
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Supabase e APIs externas: sempre rede, sem cache
  if (url.indexOf('supabase.co') !== -1) return;

  // Navegação HTML: rede primeiro, fallback para cache (offline)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match('/gelamour/index.html');
      })
    );
    return;
  }

  // Assets estáticos: rede primeiro, atualiza cache, fallback offline
  e.respondWith(
    fetch(e.request).then(function(resp) {
      if (resp && resp.status === 200 && e.request.method === 'GET') {
        var clone = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      }
      return resp;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(_) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Gelamour', {
      body: data.body || 'Novo pedido recebido!',
      icon: '/gelamour/icon-192.png',
      badge: '/gelamour/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});
