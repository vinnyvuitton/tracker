const CACHE = "shopping-preview-1";
const SHELL = ["./", "shopping.js", "shopping.css", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !SHELL.some(file => new URL(file, self.location).href === url.href)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
self.addEventListener("push", event => {
  let payload; try { payload = event.data.json(); } catch { payload = {}; }
  event.waitUntil(self.registration.showNotification(payload.title || "Shopping update", { body: payload.body || "There is an update to your shared shopping.", tag: payload.tag || "shopping-update", icon: "icons/icon-192.png", data: { url: "./#updates" } }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL("./#updates", self.location).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
    const client = clients.find(c => c.url.startsWith(new URL("./", self.location).href));
    return client ? client.navigate(url).then(() => client.focus()) : self.clients.openWindow(url);
  }));
});
