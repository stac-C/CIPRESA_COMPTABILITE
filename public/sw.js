const CACHE_NAME = "cipresa-shell-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

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
