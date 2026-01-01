// Service Worker для Gym Note PWA
const CACHE_NAME = "gym-note-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/vite.svg",
  "/manifest.json",
  "/src/app/main.tsx",
  // Добавьте другие важные ресурсы здесь
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Возвращаем кэшированный ответ, если он есть
      if (response) {
        return response;
      }

      // Иначе делаем сетевой запрос
      return fetch(event.request).then((fetchResponse) => {
        // Кэшируем новый ресурс
        if (
          !fetchResponse ||
          fetchResponse.status !== 200 ||
          fetchResponse.type !== "basic"
        ) {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      });
    }),
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
