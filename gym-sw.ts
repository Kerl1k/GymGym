declare const self: ServiceWorkerGlobalScope;

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as
    | {
        type?: string;
        title?: string;
        options?: NotificationOptions;
        delayMs?: number;
        scope?: string;
        url?: string;
      }
    | undefined;

  if (data?.type === "CACHE_INVALIDATE") {
    event.ports?.[0]?.postMessage({ success: true });
    return;
  }

  if (data?.type === "SHOW_REST_NOTIFICATION") {
    const title = typeof data.title === "string" ? data.title : "Отдых окончен";
    const options = (data.options as NotificationOptions | undefined) ?? {};
    void self.registration.showNotification(title, options);
    return;
  }

  if (data?.type === "SCHEDULE_REST_NOTIFICATION") {
    const delayMs =
      typeof data.delayMs === "number" && Number.isFinite(data.delayMs)
        ? Math.max(0, data.delayMs)
        : 60 * 1000;
    setTimeout(
      () =>
        self.registration.showNotification(
          data.title ?? "Отдых окончен",
          data.options ?? {},
        ),
      delayMs,
    );
  }
});

const addHeader = async (event: FetchEvent) => {
  const response = await fetch(event.request);
  const headers = new Headers();
  response.headers.forEach((value, key) => headers.append(key, value));
  headers.append("From", "Service Worker");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
};

self.addEventListener("fetch", (event) => {
  try {
    const url = new URL(event.request.url);
    const path = url.pathname;
    // Только REST API, не ассеты Vite (/src/..., /@vite/..., /@fs/...) и не «/api» в середине пути
    if (path === "/api" || path.startsWith("/api/")) {
      event.respondWith(addHeader(event));
    }
  } catch {
    /* ignore */
  }
});
