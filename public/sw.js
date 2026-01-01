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

// Кэш для API запросов
const API_CACHE_NAME = "gym-note-api-v1";
const API_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 минут

// Очередь для офлайн-мутаций
const MUTATION_QUEUE = "gym-note-mutations";
const SYNC_TAG = "gym-note-sync";

// Функция для добавления мутации в очередь
async function addMutationToQueue(request, method, body) {
  const queue = await caches.open(MUTATION_QUEUE);
  const mutationData = {
    request: request,
    method: method,
    body: body,
    timestamp: Date.now(),
  };

  await queue.put(
    new Request(`${request.url}-mutation-${Date.now()}`),
    new Response(JSON.stringify(mutationData)),
  );
}

// Функция для обработки очереди мутаций
async function processMutationQueue() {
  const queue = await caches.open(MUTATION_QUEUE);
  const keys = await queue.keys();

  if (keys.length === 0) {
    return;
  }

  for (const key of keys) {
    const response = await queue.match(key);
    if (response) {
      const mutationData = await response.json();

      try {
        // Выполняем мутацию на сервере
        const fetchResponse = await fetch(mutationData.request, {
          method: mutationData.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: mutationData.body,
        });

        if (fetchResponse.ok) {
          // Успешная мутация - инвалидируем кэш
          await caches.delete(API_CACHE_NAME);
          await caches.open(API_CACHE_NAME);

          // Обновляем кэш для связанных данных
          const relatedUrl = mutationData.request.url.replace(/\/[^/]+$/, "");
          const apiCache = await caches.open(API_CACHE_NAME);
          const apiKeys = await apiCache.keys();

          // Удаляем все связанные записи
          for (const apiKey of apiKeys) {
            if (apiKey.url.startsWith(relatedUrl)) {
              await apiCache.delete(apiKey);
            }
          }

          // Удаляем обработанную мутацию из очереди
          await queue.delete(key);
        }
      } catch (error) {
        console.error("Ошибка при обработке мутации:", error);
        // Мутация останется в очереди для повторной попытки
      }
    }
  }
}

// Функция для регистрации синхронизации
async function registerSync() {
  if ("sync" in self.registration) {
    try {
      await self.registration.sync.register(SYNC_TAG);
    } catch (error) {
      console.error("Ошибка регистрации синхронизации:", error);
    }
  }
}

// Функция для очистки старого API кэша
function cleanupApiCache() {
  caches.open(API_CACHE_NAME).then((cache) => {
    cache.keys().then((requests) => {
      const now = Date.now();
      requests.forEach((request) => {
        cache.match(request).then((response) => {
          if (response) {
            const dateHeader = response.headers.get("date");
            if (dateHeader) {
              const cachedTime = new Date(dateHeader).getTime();
              if (now - cachedTime > API_CACHE_EXPIRATION) {
                cache.delete(request);
              }
            }
          }
        });
      });
    });
  });
}

// Функция для инвалидации кэша при мутациях
function invalidateCacheOnMutation(request, method) {
  if (method === "POST" || method === "PUT" || method === "DELETE") {
    // При мутациях очищаем весь API кэш
    caches.delete(API_CACHE_NAME).then(() => {
      // Создаем новый кэш
      caches.open(API_CACHE_NAME);
    });
    return true;
  }
  return false;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Исключаем JS модули и динамические импорты из кэширования
  if (
    url.pathname.endsWith(".tsx") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.endsWith(".jsx") ||
    url.pathname.endsWith(".js")
  ) {
    return; // Не кэшируем JS файлы
  }

  // Обработка API запросов
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    if (invalidateCacheOnMutation(request, request.method)) {
      // Для мутаций (POST, PUT, DELETE) обрабатываем офлайн-режим
      if (
        request.method === "POST" ||
        request.method === "PUT" ||
        request.method === "DELETE"
      ) {
        event.respondWith(
          fetch(request)
            .then(async (fetchResponse) => {
              if (!fetchResponse.ok) {
                throw new Error("Network error");
              }
              return fetchResponse;
            })
            .catch(async () => {
              // Если сеть недоступна, добавляем мутацию в очередь
              try {
                const body = await request.clone().text();
                await addMutationToQueue(request.url, request.method, body);
                await registerSync();

                // Возвращаем оптимистичный ответ для офлайн-режима
                return new Response(
                  JSON.stringify({
                    success: true,
                    message: "Mutation queued for offline sync",
                    offline: true,
                  }),
                  {
                    headers: { "Content-Type": "application/json" },
                    status: 202,
                  },
                );
              } catch (error) {
                return new Response(
                  JSON.stringify({
                    success: false,
                    message: "Failed to queue mutation",
                    error: error.message,
                  }),
                  {
                    headers: { "Content-Type": "application/json" },
                    status: 500,
                  },
                );
              }
            }),
        );
        return;
      }
    }

    // Для GET запросов используем стратегию "Network First" с падением на кэш
    event.respondWith(
      fetch(request)
        .then((fetchResponse) => {
          // Кэшируем успешные GET ответы
          if (
            fetchResponse &&
            fetchResponse.status === 200 &&
            request.method === "GET"
          ) {
            const responseToCache = fetchResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return fetchResponse;
        })
        .catch(() => {
          // Если сеть недоступна, возвращаем кэшированный ответ
          return caches.match(request);
        }),
    );
  } else {
    // Обработка статических ресурсов
    event.respondWith(
      caches.match(request).then((response) => {
        // Возвращаем кэшированный ответ, если он есть
        if (response) {
          return response;
        }

        // Иначе делаем сетевой запрос
        return fetch(request).then((fetchResponse) => {
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
            cache.put(request, responseToCache);
          });

          return fetchResponse;
        });
      }),
    );
  }
});

// Периодическая очистка API кэша
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
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

  // Настраиваем периодическую очистку API кэша
  setInterval(cleanupApiCache, API_CACHE_EXPIRATION);
});

// Обработка сообщений для ручной инвалидации кэша
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_INVALIDATE") {
    if (event.data.scope === "ALL") {
      caches.delete(API_CACHE_NAME).then(() => {
        caches.open(API_CACHE_NAME);
      });
    } else if (event.data.url) {
      caches.open(API_CACHE_NAME).then((cache) => {
        cache.delete(event.data.url);
      });
    }
  }
});

// Обработка события синхронизации
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(processMutationQueue());
  }
});

// Обработка возврата в онлайн
self.addEventListener("online", () => {
  registerSync();
});
