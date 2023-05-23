// cache name with version number
const cacheName = 'lyrics-player-v1.10';

// Files to cache
// Add other files you want to cache
const filesToCache = [
        // '/',
        // '/manifest.json',
        'index.html',
        // '/assets/icon192.png',
        // '/assets/icon512.png',
        // '/favicon.ico',
];

// Installing Service Worker
self.addEventListener('install', (e) => {
  console.log('Service Worker Install...')
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(filesToCache);
    console.log('Service Worker Installed')
  })());
});

// Check offline for cached resources when fetching
self.addEventListener('fetch', function(event) {
  console.log('Service Worker Fetch for', event.request.url);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      } else {
        return fetch(event.request);
      }
    })
  );
});

// Clean up old caches (ie where the version name is different)
self.addEventListener("activate", (e) => {
  console.log('Service Worker Activate');
});