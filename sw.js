const CACHE = "workout-2-shell-v28";
const SHELL = ["./", "./index.html", "./styles.css?v=2.10.0", "./migration.js?v=2.10.0", "./app.js?v=2.10.0", "./manifest.webmanifest?v=2.10.0", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

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
  const receivedAt = Date.now();
  let data = { title: "Workout 2.0", body: "You have a new reminder.", url: "./" };
  try { data = Object.assign(data, event.data.json()); } catch (_) {}
  event.waitUntil(Promise.all([self.registration.showNotification(data.title, {
    body: data.body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: data.tag || "workout-reminder",
    renotify: true,
    data: { url: data.url || "./" }
  }).then(async () => {
    if (!data.timing) return;
    const receipt = { ...data.timing, id: crypto.randomUUID(), receivedAt, shownAt: Date.now() };
    // Save locally even when there is no dashboard window to sync the receipt.
    await receiptStore("put", receipt).catch(() => {});
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    windows.forEach((client) => client.postMessage({ type: "cardio-timing-ready" }));
  }), data.cardioComplete ? clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => Promise.all(windows.map((client) => client.postMessage({ type: "cardio-complete", sessionId: data.sessionId, date: data.date, durationMinutes: data.durationMinutes })))) : Promise.resolve()]));
});

async function receiptStore(action, value) {
  const db = await new Promise((resolve, reject) => {
    const open = indexedDB.open("workout-cardio-receipts", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("receipts", { keyPath: "id" });
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("receipts", action === "get" ? "readonly" : "readwrite");
      const store = tx.objectStore("receipts");
      let records = [];
      if (action === "put") {
        store.put(value);
        const all = store.getAll();
        all.onsuccess = () => {
          const sorted = all.result.sort((a, b) => b.receivedAt - a.receivedAt);
          sorted.forEach((receipt, index) => { if (index >= 256 || receipt.receivedAt < Date.now() - 30 * 86400000) store.delete(receipt.id); });
        };
      } else if (action === "delete") value.forEach((id) => store.delete(id));
      else {
        const all = store.getAll();
        all.onsuccess = () => { records = all.result; };
      }
      tx.oncomplete = () => resolve(records);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

self.addEventListener("message", (event) => {
  if (!event.ports[0]) return;
  const data = event.data || {};
  if (data.type !== "cardio-receipts-get" && data.type !== "cardio-receipts-delete") return;
  event.waitUntil(receiptStore(data.type === "cardio-receipts-get" ? "get" : "delete", data.ids || []).then((records) => event.ports[0].postMessage({ receipts: records }), () => event.ports[0].postMessage({ receipts: [] })));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url || "./";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    for (const client of windows) { if ("focus" in client) { client.navigate(target); return client.focus(); } }
    return clients.openWindow(target);
  }));
});
