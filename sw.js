const CACHE_NAME = 'saha-harita-v1';
const ASSETS = [
    './',
    './index.html',
    './src/css/style.css',
    './src/js/app.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
