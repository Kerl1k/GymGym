declare const self: ServiceWorkerGlobalScope;

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as
    | { type?: string; title?: string; options?: NotificationOptions }
    | undefined;
  // if (data?.type !== "SHOW_REST_NOTIFICATION") return;
  // const fallback: NotificationOptions = {
  //   body: "Можно приступать к следующему подходу.",
  //   tag: "gym-rest-timer",
  //   requireInteraction: true,
  // };
  // event.waitUntil(
  //   self.registration.showNotification(
  //     data.title ?? "Отдых окончен",
  //     data.options ?? fallback,
  //   ),
  // );
  if (data?.type === "SCHEDULE_REST_NOTIFICATION") {
    setTimeout(
      () =>
        self.registration.showNotification(
          data.title ?? "Отдых окончен",
          data.options ?? {},
        ),
      60 * 1000,
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
