// cache name with version number
const cacheName = 'lyrics-player-v1.4';

// Files to cache
const filesToCache = [
        // '/',
        'index.html',
        'assets/icon192.png',
        'assets/icon512.png',
        // 'styles.css',
        // Add other files you want to cache
];

// Installing Service Worker
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Caching');
    await cache.addAll(filesToCache);
  })());
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

// Clean up old caches (ie where the version name is different)
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          return caches.delete(key);
        })
      );
    })
  );
});