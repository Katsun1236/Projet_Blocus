/**
 * Service Worker - Projet Blocus
 * Gère le cache offline et les performances
 */

const CACHE_VERSION = 'blocus-v1.0.0';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours

// Fichiers à mettre en cache immédiatement (shell de l'app)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/css/input.css',
    '/assets/js/config.js',
    '/assets/js/utils.js',
    '/assets/js/error-handler.js',
    '/assets/js/layout.js',
    '/assets/js/lazy-images.js',
    '/assets/images/owl-logo.png',
    '/assets/images/locus_logo.png',
    '/manifest.json'
];

// Routes de l'app à mettre en cache
const APP_ROUTES = [
    '/pages/app/dashboard.html',
    '/pages/app/courses.html',
    '/pages/app/quiz.html',
    '/pages/app/synthesize.html',
    '/pages/app/community.html',
    '/pages/app/planning.html',
    '/pages/app/profile.html'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Installation...');

    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(cache => {
                console.log('[SW] Mise en cache des assets statiques');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Erreur installation:', err))
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Activation...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('blocus-') && name !== CACHE_STATIC && name !== CACHE_DYNAMIC)
                        .map(name => {
                            console.log('[SW] Suppression ancien cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Stratégie de cache: Network First avec fallback sur cache
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-HTTP
    if (!request.url.startsWith('http')) return;

    // Ignorer Firebase, Google Fonts, CDNs
    if (
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic') ||
        url.hostname.includes('cloudflare')
    ) {
        return event.respondWith(fetch(request));
    }

    // Stratégie Cache First pour les assets statiques
    if (request.destination === 'image' || request.destination === 'font' || request.url.includes('/assets/')) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // Stratégie Network First pour les pages HTML
    event.respondWith(networkFirstStrategy(request));
});

// Stratégie Cache First (pour images, fonts, assets)
async function cacheFirstStrategy(request) {
    const cached = await caches.match(request);

    if (cached) {
        // Servir du cache, mettre à jour en arrière-plan
        fetchAndCache(request).catch(() => {});
        return cached;
    }

    try {
        const response = await fetch(request);
        await cacheResponse(request, response.clone());
        return response;
    } catch (error) {
        console.log('[SW] Réseau échoué, pas de cache:', request.url);
        return offlineFallback();
    }
}

// Stratégie Network First (pour HTML, API)
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);

        // Mettre en cache seulement les réponses OK
        if (response.ok) {
            await cacheResponse(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Réseau échoué, tentative cache:', request.url);

        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        // Fallback offline
        return offlineFallback();
    }
}

// Mettre une réponse en cache
async function cacheResponse(request, response) {
    const cache = await caches.open(CACHE_DYNAMIC);
    return cache.put(request, response);
}

// Récupérer et mettre en cache
async function fetchAndCache(request) {
    const response = await fetch(request);
    if (response.ok) {
        await cacheResponse(request, response.clone());
    }
    return response;
}

// Page de fallback quand offline
function offlineFallback() {
    return new Response(
        `<!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hors ligne - Projet Blocus</title>
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    background: #050505;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .container {
                    max-width: 500px;
                    padding: 2rem;
                }
                h1 {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                p {
                    color: #9ca3af;
                    margin-bottom: 2rem;
                }
                .btn {
                    display: inline-block;
                    padding: 0.75rem 2rem;
                    background: #6366f1;
                    color: white;
                    text-decoration: none;
                    border-radius: 0.5rem;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🦉</h1>
                <h2>Vous êtes hors ligne</h2>
                <p>Impossible de charger cette page sans connexion internet. Les fonctionnalités hors ligne sont en cours de développement.</p>
                <a href="/" class="btn">Retour à l'accueil</a>
            </div>
        </body>
        </html>`,
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/html; charset=utf-8'
            })
        }
    );
}

// Messages du Service Worker
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }

    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys()
                .then(names => Promise.all(names.map(name => caches.delete(name))))
                .then(() => {
                    event.ports[0].postMessage({ status: 'Cache cleared' });
                })
        );
    }
});

console.log('[SW] Service Worker chargé ✅');
