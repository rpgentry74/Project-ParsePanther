// service-worker.js

const CACHE_NAME = 'parsepanther-v3-1';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './checkboxes.js',
  './colorCodeCells.js',
  './dialogHandler.js',
  './formHandler.js',
  './generateHTMLTable.js',
  './generateSpreadsheetFile.js',
  './indirectPrerequisiteDataHandler.js',
  './inputValidation.js',
  './messageSystem.js',
  './parseClassData.js',
  './parseIndirectClassData.js',
  './parseRosterData.js',
  './prerequisiteDataHandler.js',
  './registerServiceWorker.js',
  './resetHandler.js',
  './rosterDataHandler.js',
  './state.js',
  './statusIndicator.js',
  './manifest.json',
  './js/FileSaver.js',
  './js/xlsx/xlsx.full.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheResponse(request, response) {
  if (!response || !response.ok || response.type !== 'basic') {
    return;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn('[ServiceWorker] Unable to cache response:', request.url, error);
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(request, response);
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.mode === 'navigate') {
      const fallbackUrl = new URL('./index.html', self.registration.scope).href;
      const fallbackResponse = await caches.match(fallbackUrl);

      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);

  if (requestUrl.origin !== scopeUrl.origin) {
    return;
  }

  event.respondWith(networkFirst(request));
});
