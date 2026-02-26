// EduPresença – Service Worker (Cache-First for static assets, Network-First for navigation)
const CACHE_NAME = 'edu-presenca-v2.0';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/animations.css',
    './js/app.js',
    './js/router.js',
    './js/store.js',
    './js/utils.js',
    './js/components/sidebar.js',
    './js/components/header.js',
    './js/components/modal.js',
    './js/components/data-table.js',
    './js/components/toast.js',
    './js/components/search.js',
    './js/components/shortcuts.js',
    './js/pages/dashboard.js',
    './js/pages/alunos.js',
    './js/pages/turmas.js',
    './js/pages/cursos.js',
    './js/pages/disciplinas.js',
    './js/pages/unidades.js',
    './js/pages/turnos.js',
    './js/pages/presenca.js',
    './js/pages/notas.js',
    './js/pages/relatorios.js',
    './js/pages/configuracoes.js',
    './js/pages/login.js',
    './js/pages/informacoes.js',
    './js/pages/boletim.js',
    './js/pages/crud.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching static assets');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Some assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => {
                    console.log('[SW] Deleting old cache:', key);
                    return caches.delete(key);
                })
            )
        )
    );
    self.clients.claim();
});

// Fetch: Cache-First for static, Network-First for navigation
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and chrome-extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

    // Cache-First for static assets
    if (
        url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/) ||
        url.pathname.startsWith('/icons/')
    ) {
        event.respondWith(
            caches.match(request).then((cached) => cached || fetchAndCache(request))
        );
        return;
    }

    // Network-First for navigation (HTML)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Stale-While-Revalidate for everything else
    event.respondWith(
        caches.match(request).then((cached) => {
            const networkFetch = fetch(request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
            return cached || networkFetch;
        })
    );
});

async function fetchAndCache(request) {
    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
    }
    return response;
}
