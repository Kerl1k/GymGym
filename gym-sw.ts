const CACHE_NAME = "gym-shell-v3";
/** Injected at build time by compile-ts-service-worker (hashed /assets/*). */
const SELF_PRECACHE_ASSETS: string[] = ["__SELF_PRECACHE_ASSETS__"];
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/app-icon.svg",
  ...SELF_PRECACHE_ASSETS,
];

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("activate", ((event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("gym-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await sw.clients.claim();
    })(),
  );
}) as EventListener);

sw.addEventListener("install", ((event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined),
  );
}) as EventListener);

function isApiRequest(url: URL): boolean {
  return url.pathname.startsWith("/api/") || url.hostname.includes("gym-back");
}

/** Production Vite hashed bundles: /assets/index-XXXX.js */
function isHashedAsset(url: URL): boolean {
  return (
    url.pathname.startsWith("/assets/") &&
    /-[A-Za-z0-9_-]{6,}\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico)$/.test(
      url.pathname,
    )
  );
}

function isShellStatic(url: URL): boolean {
  return (
    url.pathname === "/manifest.json" ||
    url.pathname === "/app-icon.svg" ||
    url.pathname === "/favicon.ico"
  );
}

/** Never cache Vite/dev modules or arbitrary scripts. */
function shouldHandle(url: URL): boolean {
  if (isApiRequest(url)) return false;
  if (url.pathname.startsWith("/src/")) return false;
  if (url.pathname.startsWith("/@") || url.pathname.startsWith("/node_modules")) {
    return false;
  }
  if (url.searchParams.has("t")) return false;
  return true;
}

async function networkFirstNavigate(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    void cache.put("/index.html", networkResponse.clone());
    return networkResponse;
  } catch {
    const cached =
      (await caches.match("/index.html")) ||
      (await caches.match("/")) ||
      (await caches.match(request));
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function networkFirstCacheable(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      void cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

sw.addEventListener("fetch", ((event: FetchEvent) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== sw.location.origin) return;
  if (!shouldHandle(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // Only cache hashed build assets + known shell static files.
  if (isHashedAsset(url) || isShellStatic(url)) {
    event.respondWith(networkFirstCacheable(request));
  }
  // Everything else (including unhashed JS): let the browser hit the network.
}) as EventListener);
