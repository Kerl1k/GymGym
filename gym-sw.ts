declare const self: ServiceWorkerGlobalScope;

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
