const CACHE_NAME = 'idream-finance-cache-v1';
const urlsToCache = [
  '.',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (e) => {
  // Strategy: cache-first for app shell, network fallback otherwise
  e.respondWith(
    caches.match(e.request).then(resp => {
      if(resp) return resp;
      return fetch(e.request).then(rsp => {
        // cache new GET requests (only same-origin)
        if(e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)){
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, rsp.clone()));
        }
        return rsp;
      }).catch(()=> {
        // offline fallback (could serve an offline page)
        return new Response('Offline', {status:503, statusText:'Offline'});
      });
    })
  );
});
