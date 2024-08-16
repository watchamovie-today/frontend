// service-worker.js, chatgpt'ed the whole thing lmao

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('app-cache-v1')
      .then(cache => cache.addAll([
        './',
        './index.html',
        './css/styles.css',
        './js/script.js',
      ]))
  );
});

// Activate service worker
self.addEventListener('activate', event => {
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
