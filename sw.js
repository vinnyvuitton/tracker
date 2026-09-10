const CACHE = "workout-2-shell-v15";
const SHELL = ["./", "./index.html", "./styles.css?v=2.5.0", "./migration.js?v=2.5.0", "./app.js?v=2.5.0", "./manifest.webmanifest?v=2.5.0", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});

self.addEventListener("push", (event) => {
  let data = { title: "Workout 2.0", body: "You have a new reminder.", url: "./" };
  try { data = Object.assign(data, event.data.json()); } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: data.tag || "workout-reminder",
    renotify: true,
    data: { url: data.url || "./" }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url || "./";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    for (const client of windows) { if ("focus" in client) { client.navigate(target); return client.focus(); } }
    return clients.openWindow(target);
  }));
});
