const CACHE_NAME = 'faraway-v1';
const STATIC_CACHE = 'faraway-static-v1';
const DYNAMIC_CACHE = 'faraway-dynamic-v1';

// Assets à mettre en cache au premier chargement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Mise en cache des assets statiques');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((err) => {
        console.error('[SW] Erreur lors de la mise en cache:', err);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Suppression du cache obsolète:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

// Stratégie de cache: Network First avec fallback sur Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les requêtes vers des domaines externes (sauf Google Fonts)
  if (url.origin !== location.origin && !url.origin.includes('fonts.googleapis.com') && !url.origin.includes('fonts.gstatic.com')) {
    return;
  }

  // Stratégie Cache First pour les fonts Google
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Stratégie Network First pour les autres ressources
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Ne mettre en cache que les réponses OK
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Cloner la réponse
        const responseToCache = response.clone();

        // Mettre en cache les assets dynamiques
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Si le réseau échoue, essayer de récupérer depuis le cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          
          // Fallback pour les pages HTML
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Gestion des messages (pour les mises à jour forcées)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
