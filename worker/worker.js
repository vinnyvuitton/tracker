const DATA_KEY = "mytracker_v2";
const LEGACY_KEY = "mytracker";
const MAX_DATA_BYTES = 24 * 1024 * 1024;
const MAX_PHOTO_BYTES = 1024 * 1024;
const BACKUP_LIMIT = 30;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://vinnyvuitton.github.io";
    const cors = corsHeaders(origin, allowedOrigin, env);

    if (request.method === "OPTIONS") {
      if (origin && origin !== allowedOrigin && !isLocalOrigin(origin, env)) {
        return json({ error: "Origin not allowed" }, 403, cors);
      }
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "workout-2" }, 200, cors);
    }

    if (origin && origin !== allowedOrigin && !isLocalOrigin(origin, env)) {
      return json({ error: "Origin not allowed" }, 403, cors);
    }

    if (!env.TRACKER_TOKEN || !authorized(request, env.TRACKER_TOKEN)) {
      return json({ error: "Unauthorized" }, 401, cors);
    }

    try {
      if (url.pathname === "/data" && request.method === "GET") {
        return await loadData(env, cors);
      }
      if (url.pathname === "/data" && request.method === "PUT") {
        return await saveData(request, env, ctx, cors);
      }
      if (url.pathname.startsWith("/photos/")) {
        return await handlePhoto(request, env, url.pathname.slice(8), cors);
      }
      return json({ error: "Not found" }, 404, cors);
    } catch (error) {
      console.error("Tracker request failed", error);
      return json({ error: "Request failed" }, 500, cors);
    }
  }
};

function authorized(request, expectedToken) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  return constantTimeEqual(header.slice(7), expectedToken);
}

function constantTimeEqual(a, b) {
  const aa = new TextEncoder().encode(String(a));
  const bb = new TextEncoder().encode(String(b));
  let mismatch = aa.length ^ bb.length;
  const length = Math.max(aa.length, bb.length);
  for (let i = 0; i < length; i++) mismatch |= (aa[i] || 0) ^ (bb[i] || 0);
  return mismatch === 0;
}

function corsHeaders(origin, allowedOrigin, env) {
  const headers = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  };
  if (origin === allowedOrigin || isLocalOrigin(origin, env)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function isLocalOrigin(origin, env) {
  return env.ALLOW_LOCAL_DEV === "true" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

async function loadData(env, cors) {
  const saved = await env.TRACKER_KV.get(DATA_KEY, "json");
  if (saved && saved.payload) {
    return json({ payload: saved.payload, version: saved.version || 0, savedAt: saved.savedAt || null }, 200, cors);
  }

  const legacy = await env.TRACKER_KV.get(LEGACY_KEY);
  let legacyPayload = null;
  if (legacy) {
    try {
      const decoded = JSON.parse(legacy);
      legacyPayload = decoded && typeof decoded === "object" && "payload" in decoded ? JSON.parse(decoded.payload) : decoded;
    } catch (_) {
      legacyPayload = null;
    }
  }
  return json({ payload: legacyPayload, version: 0, legacy: Boolean(legacyPayload) }, 200, cors);
}

async function saveData(request, env, ctx, cors) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_DATA_BYTES) return json({ error: "Tracker data is too large" }, 413, cors);

  const body = await request.json();
  if (!body || typeof body.payload !== "object" || Array.isArray(body.payload)) {
    return json({ error: "Invalid tracker data" }, 400, cors);
  }
  const encoded = JSON.stringify(body.payload);
  if (new TextEncoder().encode(encoded).byteLength > MAX_DATA_BYTES) {
    return json({ error: "Tracker data is too large" }, 413, cors);
  }

  const current = await env.TRACKER_KV.get(DATA_KEY, "json");
  const currentVersion = current && Number.isFinite(current.version) ? current.version : 0;
  if (Number(body.expectedVersion) !== currentVersion) {
    return json({ error: "Version conflict", currentVersion }, 409, cors);
  }

  const next = { version: currentVersion + 1, savedAt: new Date().toISOString(), payload: body.payload };
  if (current) {
    const backupKey = "backup:" + String(current.version).padStart(8, "0") + ":" + Date.now();
    await env.TRACKER_KV.put(backupKey, JSON.stringify(current));
  }
  await env.TRACKER_KV.put(DATA_KEY, JSON.stringify(next));
  ctx.waitUntil(trimBackups(env.TRACKER_KV));
  return json({ ok: true, version: next.version, savedAt: next.savedAt }, 200, cors);
}

async function trimBackups(kv) {
  const listed = await kv.list({ prefix: "backup:" });
  const keys = listed.keys.map((item) => item.name).sort();
  const excess = keys.slice(0, Math.max(0, keys.length - BACKUP_LIMIT));
  await Promise.all(excess.map((key) => kv.delete(key)));
}

async function handlePhoto(request, env, rawId, cors) {
  const id = decodeURIComponent(rawId);
  if (!/^[a-zA-Z0-9._-]{1,180}$/.test(id)) return json({ error: "Invalid photo id" }, 400, cors);
  const photoKey = "photo:" + id;

  if (request.method === "PUT") {
    if (request.headers.get("Content-Type") !== "image/jpeg") return json({ error: "Only JPEG photos are accepted" }, 415, cors);
    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_PHOTO_BYTES) return json({ error: "Photo is too large" }, 413, cors);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_PHOTO_BYTES) return json({ error: "Photo is too large" }, 413, cors);
    if (env.TRACKER_PHOTOS) await env.TRACKER_PHOTOS.put(id, bytes, { httpMetadata: { contentType: "image/jpeg" } });
    else await env.TRACKER_KV.put(photoKey, bytes, { metadata: { contentType: "image/jpeg" } });
    return json({ ok: true, id }, 200, cors);
  }

  if (request.method === "GET") {
    const headers = new Headers(cors);
    let body;
    if (env.TRACKER_PHOTOS) {
      const object = await env.TRACKER_PHOTOS.get(id);
      if (!object) return json({ error: "Photo not found" }, 404, cors);
      object.writeHttpMetadata(headers);
      body = object.body;
    } else {
      body = await env.TRACKER_KV.get(photoKey, "arrayBuffer");
      if (!body) return json({ error: "Photo not found" }, 404, cors);
      headers.set("Content-Type", "image/jpeg");
    }
    headers.set("Cache-Control", "private, max-age=300");
    headers.set("Content-Disposition", "inline");
    return new Response(body, { status: 200, headers });
  }

  if (request.method === "DELETE") {
    if (env.TRACKER_PHOTOS) await env.TRACKER_PHOTOS.delete(id);
    else await env.TRACKER_KV.delete(photoKey);
    return json({ ok: true }, 200, cors);
  }

  return json({ error: "Method not allowed" }, 405, cors);
}

function json(body, status, extraHeaders) {
  const headers = new Headers(extraHeaders || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}
