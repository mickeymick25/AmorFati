const CACHE_NAME = 'amor-fati-cache-v2';
const PRECACHE_ASSETS = [
  'index.html',
  'manifest.json',
  'offline.html',
  'icons/icon-192.svg',
  'icons/icon-512.svg'
];

// Durations or limits could be added for runtime caches

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Helper: send message to all clients
function broadcastMessage(msg) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}

// Fetch strategy:
// - Navigation requests (HTML): network-first, fallback to cache then offline.html
// - Other requests: cache-first, then network and cache response
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(response => {
        // Put a copy in cache
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      }).catch(() => {
  return caches.match(req).then(cached => cached || caches.match('offline.html'));
      })
    );
    return;
  }

  // For other requests, try cache first
    event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return response;
      }).catch(() => {
        // As a final fallback for images/scripts, try offline.html for navigations only
        return caches.match('offline.html');
      });
    })
  );
});

// Notify clients when a new service worker is waiting to activate
self.addEventListener('updatefound', () => {
  broadcastMessage({ type: 'SW_UPDATE_FOUND' });
});

self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
