/** Injected at build time by compile-ts-service-worker. */
const BUILD_ID: string = "__SW_BUILD_ID__";
const CACHE_NAME = `gym-shell-${BUILD_ID}`;
/** Injected at build time by compile-ts-service-worker (hashed /assets/*). */
const SELF_PRECACHE_ASSETS: string[] = ["__SELF_PRECACHE_ASSETS__"];
/** Install fails without these, so a broken build never replaces a working one. */
const REQUIRED_PRECACHE_URLS = ["/", "/index.html"];
const OPTIONAL_PRECACHE_URLS = [
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
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(REQUIRED_PRECACHE_URLS);
      await Promise.allSettled(
        OPTIONAL_PRECACHE_URLS.map((url) => cache.add(url)),
      );
    })(),
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
    const contentType = networkResponse.headers.get("Content-Type") ?? "";
    // Only a real app shell may replace the cached one; error pages must not.
    if (networkResponse.ok && contentType.includes("text/html")) {
      const cache = await caches.open(CACHE_NAME);
      void cache.put("/index.html", networkResponse.clone());
    }
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
