declare const self: ServiceWorkerGlobalScope;

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as
    | {
        type?: string;
        title?: string;
        options?: NotificationOptions;
        delayMs?: number;
      }
    | undefined;
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
  if (event.request.url.includes("/api")) {
    event.respondWith(addHeader(event));
  }
});
