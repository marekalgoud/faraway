const CACHE_NAME = 'faraway-v1.0.4';
const STATIC_CACHE = 'faraway-static-v1.0.4';
const DYNAMIC_CACHE = 'faraway-dynamic-v1.0.4';
const MODELS_CACHE = 'faraway-models-v1.0.4';

// Assets à mettre en cache au premier chargement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/images/demo.jpg'
];

// Modèles TensorFlow à mettre en cache (critiques pour l'application)
const MODEL_ASSETS = [
  // Modèle CARD
  '/model/card/model.json',
  '/model/card/group1-shard1of10.bin',
  '/model/card/group1-shard2of10.bin',
  '/model/card/group1-shard3of10.bin',
  '/model/card/group1-shard4of10.bin',
  '/model/card/group1-shard5of10.bin',
  '/model/card/group1-shard6of10.bin',
  '/model/card/group1-shard7of10.bin',
  '/model/card/group1-shard8of10.bin',
  '/model/card/group1-shard9of10.bin',
  '/model/card/group1-shard10of10.bin',
  // Modèle SET
  '/model/set/model.json',
  '/model/set/group1-shard1of3.bin',
  '/model/set/group1-shard2of3.bin',
  '/model/set/group1-shard3of3.bin',
  // Modèle TEMPLE
  '/model/temple/model.json',
  '/model/temple/group1-shard1of3.bin',
  '/model/temple/group1-shard2of3.bin',
  '/model/temple/group1-shard3of3.bin'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  event.waitUntil(
    Promise.all([
      // Cache des assets statiques
      caches.open(STATIC_CACHE)
        .then(async (cache) => {
          console.log('[SW] Mise en cache des assets statiques');
          // D'abord mettre en cache les assets de base
          await cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
          
          // Ensuite, charger index.html et extraire tous les fichiers JS/CSS
          try {
            const indexResponse = await fetch('/index.html', { cache: 'reload' });
            const indexText = await indexResponse.text();
            
            // Extraire tous les fichiers .js et .css depuis l'HTML
            const jsFiles = [...indexText.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
            const cssFiles = [...indexText.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
            const allFiles = [...jsFiles, ...cssFiles].filter(f => !f.startsWith('http'));
            
            // Éliminer les doublons
            const uniqueFiles = [...new Set(allFiles)];
            
            console.log('[SW] Fichiers Angular détectés:', uniqueFiles);
            
            // Mettre en cache tous les fichiers Angular
            if (uniqueFiles.length > 0) {
              await cache.addAll(uniqueFiles.map(url => new Request(url, { cache: 'reload' })));
            }
          } catch (err) {
            console.error('[SW] Erreur lors de l\'extraction des fichiers Angular:', err);
          }
        })
        .catch((err) => {
          console.error('[SW] Erreur lors de la mise en cache des assets statiques:', err);
        }),
      // Cache des modèles TensorFlow
      caches.open(MODELS_CACHE)
        .then((cache) => {
          console.log('[SW] Mise en cache des modèles TensorFlow (peut prendre du temps...)');
          return cache.addAll(MODEL_ASSETS.map(url => new Request(url, { cache: 'reload' })));
        })
        .catch((err) => {
          console.error('[SW] Erreur lors de la mise en cache des modèles:', err);
        })
    ])
  );
  // Force le service worker à devenir actif immédiatement
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
            return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== MODELS_CACHE;
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

  // Stratégie Cache First pour les modèles TensorFlow (critiques pour l'app)
  if (url.pathname.startsWith('/model/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log('[SW] Modèle servi depuis le cache:', url.pathname);
          return response;
        }
        console.log('[SW] Modèle récupéré depuis le réseau:', url.pathname);
        return fetch(request).then((response) => {
          // Mettre en cache le modèle pour la prochaine fois
          if (response && response.status === 200) {
            return caches.open(MODELS_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        });
      })
    );
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

  // Stratégie Cache First pour les fichiers JS/CSS de l'application Angular
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log('[SW] Fichier JS/CSS servi depuis le cache:', url.pathname);
          return response;
        }
        console.log('[SW] Fichier JS/CSS récupéré depuis le réseau:', url.pathname);
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            return caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        }).catch(() => {
          console.error('[SW] Impossible de récupérer le fichier:', url.pathname);
          return new Response('Fichier non disponible hors ligne', {
            status: 503,
            statusText: 'Service Unavailable'
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
