const CACHE_NAME = "cipresa-shell-v1";
const APP_SHELL = ["/", "/index.html", "/favicon.svg"];

self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("/index.html"))));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { payload = { body: event.data?.text() || "Nouvelle notification CIPRESA" }; }
  const title = payload.title || payload.titre || "CIPRESA";
  const options = {
    body: payload.body || payload.message || "Une nouvelle opération vous concerne.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.tag || "cipresa-notification",
    data: { url: payload.url || "/dashboard" },
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => "focus" in client);
    if (existing) { existing.navigate(targetUrl); return existing.focus(); }
    return self.clients.openWindow(targetUrl);
  }));
});
