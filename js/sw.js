// service-worker.js

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('app-cache-v1')
      .then(cache => cache.addAll([
        './',
        './index.html',
        './css/styles.css',
        './js/script.js',
        // Add paths to other critical assets
      ]))
  );
});

// Activate service worker
self.addEventListener('activate', event => {
  // Optional: Clean up old caches or perform other tasks
});

// Fetch event: intercept network requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
