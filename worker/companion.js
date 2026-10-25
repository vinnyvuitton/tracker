import { sendWebPush } from "./worker.js";
// Shopping records are deliberately separate from the fitness data namespace.
const ROLES = ["vinny", "mama"];
const ITEM_STATES = ["needed", "have", "bought", "unavailable", "omitted"];
const PROVIDERS = {
  jewel: { name: "Jewel-Osco", url: "https://www.jewelosco.com/loyalty/coupons-deals", domains: ["jewelosco.com"] },
  ibotta: { name: "Ibotta", url: "https://ibotta.com/", domains: ["ibotta.com"] },
  traderjoes: { name: "Trader Joe’s", url: "https://www.traderjoes.com/home/products", domains: ["traderjoes.com"] }
};
const reply = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const text = (value, max = 800) => String(value ?? "").trim().slice(0, max);
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const equal = (a, b) => { let n = String(a).length ^ String(b).length; for (let i = 0; i < Math.max(String(a).length, String(b).length); i++) n |= (String(a).charCodeAt(i) || 0) ^ (String(b).charCodeAt(i) || 0); return n === 0; };
const token = request => (request.headers.get("Authorization") || "").replace(/^Bearer /, "");
const isOwner = (request, env) => Boolean(env.TRACKER_TOKEN && equal(token(request), env.TRACKER_TOKEN));
const digest = async value => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))].map(v => v.toString(16).padStart(2, "0")).join("");
function weekDate(value) {
  const date = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + "T12:00:00Z")) || new Date(date + "T12:00:00Z").toISOString().slice(0,10) !== date || new Date(date + "T12:00:00Z").getUTCDay() !== 0) fail("Choose a Sunday for the list week.");
  return date;
}
function cents(value) { if (!Number.isSafeInteger(value) || value < 0 || value > 100000000) fail("Enter a valid amount in cents."); return value; }
function currentDate() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function transactionDate(value) {
  if (!value) return currentDate();
  const date = text(value, 10), parsed = Date.parse(date + "T12:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0,10) !== date) fail("Choose a valid purchase or repayment date.");
  return date;
}
function newState() { return { version: 0, weeks: {}, ideas: [], messages: [], substitutions: [], expenses: [], payments: [], feedback: [], assets: [], devices: [], access: {}, updatedAt: null }; }
function publicState(state, role) {
  const { access, devices, ...visible } = state;
  const received = state.payments.filter(p => p.status === "received").reduce((n, p) => n + p.cents, 0);
  return { ...visible, role, balanceCents: state.expenses.reduce((n, e) => n + e.cents, 0) - received, providers: PROVIDERS };
}
function findItem(state, week, id) { const item = state.weeks[week]?.items.find(item => item.id === id); if (!item) fail("That item is no longer available.", 404); return item; }
function checkRevision(item, body) { if (body.itemRevision !== item.revision) fail("This item changed. Refresh and review the latest version.", 409); }
function normalizedItem(body, actor, week) {
  const owner = ROLES.includes(body.owner) ? body.owner : actor;
  const name = text(body.name, 160); if (!name) fail("Add an item name.");
  return { id: crypto.randomUUID(), week, owner, name, quantity: text(body.quantity || "1", 60), brand: text(body.brand, 100), exact: Boolean(body.exact), store: text(body.store || "Either store", 60), department: text(body.department || "Other", 60), notes: text(body.notes), status: "needed", approval: actor === "mama" && owner === "vinny" ? "pending" : "approved", revision: 1, addedBy: actor, updatedAt: new Date().toISOString(), addedAt: new Date().toISOString(), offers: [] };
}
function requireAsset(state, id) { if (id && !state.assets.some(a => a.id === id)) fail("Attach a saved shopping photo or recording."); }
function mutate(state, body, actor) {
  const now = new Date().toISOString(), week = weekDate(body.week);
  state.weeks[week] ||= { items: [], input: [], trips: [] };
  const list = state.weeks[week];
  let result = {}, event = "", target = actor === "vinny" ? "mama" : "vinny";
  switch (body.type) {
    case "add-item": {
      const item = normalizedItem(body, actor, week);
      const duplicate = list.items.find(i => i.owner === item.owner && i.name.toLowerCase() === item.name.toLowerCase() && i.brand.toLowerCase() === item.brand.toLowerCase() && i.status !== "omitted");
      if (duplicate) fail("This item is already on that person’s list. Review its quantity instead.", 409);
      list.items.push(item); result.itemId = item.id; event = "An item was added to the shopping list."; break;
    }
    case "add-draft-items": {
      if(body.confirmed !== true || !Array.isArray(body.items) || !body.items.length || body.items.length>25) fail("Review and select the draft items and quantities first.");
      const additions = body.items.map(item=>normalizedItem(item,actor,week));
      const signatures = new Set(list.items.filter(item=>item.status!=="omitted").map(item=>[item.owner,item.name.toLowerCase(),item.brand.toLowerCase()].join("|")));
      for(const item of additions){const signature=[item.owner,item.name.toLowerCase(),item.brand.toLowerCase()].join("|");if(signatures.has(signature))fail("A draft item is already listed. Unselect it and review its existing quantity.",409);signatures.add(signature);}
      list.items.push(...additions);event="A reviewed grocery draft was added to the shopping list.";break;
    }
    case "update-item": {
      const item = findItem(state, week, body.id); checkRevision(item, body);
      if (body.status !== undefined) { if (!ITEM_STATES.includes(body.status)) fail("Choose a valid shopping status."); item.status = body.status; }
      if (body.approval !== undefined) { if (actor !== "vinny" || !["approved", "declined"].includes(body.approval)) fail("Vinny needs to review this request.", 403); item.approval = body.approval; }
      const editable = ["quantity", "notes", "name", "brand", "store", "department"];
      if (editable.some(field => body[field] !== undefined) || body.exact !== undefined) {
        if (actor !== item.owner) fail("Suggest changes to the other person’s item through a substitution request.", 403);
        for (const field of editable) if (body[field] !== undefined) { const value = text(body[field], field === "notes" ? 800 : 160); if (!value && !["notes", "brand"].includes(field)) fail("Item details cannot be empty."); item[field] = value; }
        if (body.exact !== undefined) item.exact = Boolean(body.exact);
      }
      if (item.approval !== "approved" && item.status === "bought") fail("Approve this addition before marking it bought.");
      item.revision++; item.updatedAt = now; break;
    }
    case "copy-items": {
      const sourceWeek = weekDate(body.sourceWeek); if (sourceWeek === week) fail("Choose a different source week.");
      const source = state.weeks[sourceWeek]; if (!source) fail("No saved list for that week.");
      const ids = Array.isArray(body.ids) ? body.ids.slice(0, 100) : [];
      if (!ids.length) fail("Select items to copy.");
      if (new Set(ids).size !== ids.length) fail("Select each source item once.");
      const candidates = ids.map(id => { const item = source.items.find(i => i.id === id); if (!item) fail("A selected item is missing."); return item; });
      for (const item of candidates) if (list.items.some(i => i.owner === item.owner && i.name.toLowerCase() === item.name.toLowerCase() && i.brand.toLowerCase() === item.brand.toLowerCase() && i.status !== "omitted")) fail("A selected item already exists this week. Review quantities first.", 409);
      for (const item of candidates) list.items.push(normalizedItem(item, actor, week));
      event = "Past items were added to this week for review."; break;
    }
    case "message": {
      const message = text(body.message, 2000); if (!message) fail("Write a message.");
      if (body.itemId) findItem(state, week, body.itemId);
      requireAsset(state, body.assetId);
      state.messages.push({ id: crypto.randomUUID(), week, itemId: text(body.itemId, 80), from: actor, to: target, message, assetId: text(body.assetId, 80), createdAt: now });
      event = "You have a new shopping message."; break;
    }
    case "substitution": {
      const item = findItem(state, week, body.id); checkRevision(item, body);
      const replacement = text(body.replacement, 160); if (!replacement) fail("Describe the proposed replacement.");
      requireAsset(state, body.assetId);
      state.substitutions.push({ id: crypto.randomUUID(), week, itemId: item.id, itemRevision: item.revision, original: item.name, replacement, quantity: text(body.quantity, 60), price: text(body.price, 60), store: text(body.store, 80), assetId: text(body.assetId, 80), from: actor, to: item.owner, status: "pending", createdAt: now });
      target = item.owner; event = "A shopping substitution needs your review."; break;
    }
    case "decide-substitution": {
      const request = state.substitutions.find(r => r.id === body.id && r.week === week); if (!request) fail("Request not found.", 404);
      if (request.to !== actor) fail("Only the item’s owner can decide.", 403);
      if (request.status !== "pending") fail("This request was already decided.", 409);
      if (!["approved", "declined"].includes(body.decision)) fail("Choose approve or decline.");
      const item = findItem(state, week, request.itemId);
      if (item.revision !== request.itemRevision) fail("The original item changed. Send a fresh request.", 409);
      request.status = body.decision; request.decidedBy = actor; request.decidedAt = now;
      if (body.decision === "approved") { item.name = request.replacement; if (request.quantity) item.quantity = request.quantity; if (request.store) item.store = request.store; item.revision++; item.updatedAt = now; item.offers = []; }
      target = request.from; event = "Your substitution request has a reply."; break;
    }
    case "weekly-input": {
      requireAsset(state, body.assetId); const message = text(body.message, 2000);
      if (!message && !body.assetId) fail("Add a note or recording.");
      list.input.push({ id: crypto.randomUUID(), actor, message, assetId: text(body.assetId, 80), createdAt: now }); event = "There is new input for this week’s list."; break;
    }
    case "save-idea": {
      requireAsset(state, body.assetId);
      const name = text(body.name, 160); if (!name) fail("Name the product or meal idea first.");
      state.ideas ||= []; state.ideas.push({ id: crypto.randomUUID(), week, name, notes: text(body.notes, 1500), assetId: text(body.assetId, 80), from: actor, createdAt: now });
      event = "A product or meal idea was saved for future shopping."; break;
    }
    case "publish-list": {
      if (actor !== "vinny") fail("Vinny reviews his weekly list before marking it ready.", 403);
      if (!list.items.some(i => i.approval === "approved")) fail("Add and review items before marking the list ready.");
      const fingerprint = JSON.stringify(list.items.map(({ id, name, quantity, owner, brand, notes, approval }) => ({ id, name, quantity, owner, brand, notes, approval })));
      if (list.publishedFingerprint === fingerprint) fail("This version is already marked ready. Mama can see it in her app.", 409);
      list.publishedFingerprint = fingerprint; list.publishedAt = now; event = "A reviewed weekly shopping list is ready."; break;
    }
    case "start-trip": {
      if (list.activeTrip) fail("A shopping trip is already in progress.", 409);
      list.activeTrip = { id: crypto.randomUUID(), actor, startedAt: now }; event = "Shopping has started. New additions will be marked."; break;
    }
    case "expense": {
      if (actor !== "mama") fail("Mama confirms the purchases she paid for.", 403);
      const amount = cents(body.cents); if (!amount) fail("Enter Vinny’s actual share.");
      requireAsset(state, body.assetId);
      if (body.confirmedActual !== true) fail("Confirm the actual checkout share first.");
      state.expenses.push({ id: crypto.randomUUID(), week, cents: amount, date: transactionDate(body.date), store: text(body.store, 100), note: text(body.note), assetId: text(body.assetId, 80), payer: "mama", createdAt: now }); event = "Mama recorded an actual shopping expense."; break;
    }
    case "expense-adjustment": {
      if (actor !== "mama") fail("Mama confirms expense corrections.", 403);
      const original = state.expenses.find(e => e.id === body.id && !e.adjusts); if (!original) fail("Choose the original expense.");
      const amount = cents(body.cents), remaining = original.cents + state.expenses.filter(e => e.adjusts === original.id).reduce((n, e) => n + e.cents, 0);
      if (!amount || amount > remaining || !text(body.note)) fail("Enter a refund/correction within the original remaining share and explain it.");
      state.expenses.push({ id: crypto.randomUUID(), week, cents: -amount, adjusts: original.id, note: text(body.note), payer: "mama", createdAt: now }); event = "A shopping expense was corrected."; break;
    }
    case "payment": {
      const amount = cents(body.cents); if (!amount) fail("Enter the payment amount.");
      const balance = publicState(state, actor).balanceCents;
      if (amount > balance) fail("This exceeds the unpaid balance. Review the amount.");
      state.payments.push({ id: crypto.randomUUID(), week, cents: amount, date: transactionDate(body.date), note: text(body.note), reportedBy: actor, status: actor === "mama" ? "received" : "pending", receivedAt: actor === "mama" ? now : null, createdAt: now }); event = actor === "mama" ? "Mama confirmed a repayment." : "A repayment needs Mama’s confirmation."; break;
    }
    case "confirm-payment": {
      if (actor !== "mama") fail("Mama confirms money received.", 403);
      const payment = state.payments.find(p => p.id === body.id); if (!payment) fail("Payment not found.");
      if (payment.status !== "pending") fail("This payment was already reviewed.", 409);
      if (!['received', 'declined'].includes(body.decision)) fail("Choose received or decline.");
      if (body.decision === "received" && payment.cents > publicState(state, actor).balanceCents) fail("The balance changed. Review the payment.", 409);
      payment.status = body.decision; payment.receivedAt = body.decision === "received" ? now : null; event = "Mama reviewed a repayment."; break;
    }
    case "feedback": {
      requireAsset(state, body.assetId); if (!text(body.message) && !body.assetId) fail("Add feedback or a voice recording.");
      state.feedback.push({ id: crypto.randomUUID(), week, from: actor, message: text(body.message, 3000), assetId: text(body.assetId, 80), screen: text(body.screen, 80), appVersion: text(body.appVersion, 40), status: "new", createdAt: now, replies: [] }); event = "New app feedback was submitted."; break;
    }
    case "feedback-status": {
      if (actor !== "vinny") fail("Only Vinny can update the build feedback status.", 403);
      const entry = state.feedback.find(f => f.id === body.id); if (!entry) fail("Feedback not found.");
      if (!["new", "reviewing", "planned", "fixed"].includes(body.status)) fail("Choose a feedback status.");
      if (body.status === "fixed" && !text(body.release)) fail("Add the actual release that fixes it.");
      entry.status = body.status; entry.release = text(body.release, 60); if (text(body.message)) entry.replies.push({ actor, message: text(body.message), createdAt: now }); target = entry.from; event = "There is an update on your app feedback."; break;
    }
    case "offer": {
      const item = findItem(state, week, body.id); checkRevision(item, body);
      const provider = PROVIDERS[body.provider]; if (!provider) fail("Choose an offer provider.");
      let url; try { url = new URL(body.url); } catch { fail("Use an official offer link."); }
      if (url.protocol !== "https:" || !provider.domains.some(d => url.hostname === d || url.hostname.endsWith('.' + d))) fail("Use an official provider link.");
      if (!text(body.description) || !text(body.conditions)) fail("Include the offer and exact product/quantity requirements.");
      const expires = text(body.expiresAt, 50); if (expires && !Number.isFinite(Date.parse(expires))) fail("Use a valid expiration date and time.");
      item.offers.push({ id: crypto.randomUUID(), provider: body.provider, url: url.href, description: text(body.description), conditions: text(body.conditions), expiresAt: expires || null, checkedAt: now, source: "User reviewed official offer", activation: "unknown" }); item.revision++; break;
    }
    case "clip-confirmation": {
      if(actor!=="mama")fail("Mama confirms the offers she activated in her account.",403);
      const item = findItem(state, week, body.id), offer = item.offers.find(o => o.id === body.offerId); if (!offer) fail("Offer not found.");
      offer.activation = body.activated === true ? "marked-by-user" : "unknown"; offer.markedBy = actor; offer.markedAt = now; break;
    }
    case "finish-trip": {
      const unresolved = list.items.filter(i => i.status === "needed" && i.approval === "approved");
      const decisions = body.decisions || {};
      for (const item of unresolved) if (!["keep", "omitted", "unavailable"].includes(decisions[item.id])) fail("Choose keep, omit or unavailable for each unbought item.");
      for (const item of unresolved) if (decisions[item.id] !== "keep") { item.status = decisions[item.id]; item.revision++; item.updatedAt = now; }
      list.trips.push({ id: crypto.randomUUID(), actor, startedAt: list.activeTrip?.startedAt || null, createdAt: now, note: text(body.note) }); list.activeTrip = null; event = "The shopping trip summary is ready."; break;
    }
    default: fail("Unknown shopping action.");
  }
  return { result, event, target };
}

export class ShoppingRoom {
  constructor(state, env) { this.state = state; this.env = env; this.serial = Promise.resolve(); }
  fetch(request) { const work = this.serial.then(() => this.handle(request)); this.serial = work.catch(() => {}); return work; }
  async read() {
    const count = await this.state.storage.get("chunks") || 0;
    const parts = []; for (let i = 0; i < count; i++) parts.push(await this.state.storage.get("chunk:" + i));
    const data = count ? JSON.parse(parts.join("")) : newState();
    const options = await this.env.TRACKER_KV.get("approved-shopping-options:v1", "json");
    data.mealOptions = options?.meals || [];
    data.shoppingPreferences = options?.preferences || {};
    data.mealOptionsVersion = options?.version || null;
    return data;
  }
  async write(data, opId) {
    const serialized = JSON.stringify(data), chunks = serialized.match(/[\s\S]{1,30000}/g) || [""];
    await this.state.storage.transaction(async storage => {
      const previous = await storage.get("chunks") || 0;
      for (let i = 0; i < chunks.length; i++) await storage.put("chunk:" + i, chunks[i]);
      for (let i = chunks.length; i < previous; i++) await storage.delete("chunk:" + i);
      await storage.put("chunks", chunks.length);
      if (opId) await storage.put("op:" + opId, { version: data.version });
    });
  }
  async handle(request) {
    try {
      const url = new URL(request.url), data = await this.read();
      const actor = isOwner(request, this.env) ? "vinny" : this.env.COACH_REVIEW_TOKEN && equal(token(request), this.env.COACH_REVIEW_TOKEN) ? "review" : data.access.mamaHash && token(request) && equal(await digest(token(request)), data.access.mamaHash) ? "mama" : null;
      if (!actor) return reply({ error: "Unlock your shopping access first." }, 401);
      if (actor === "review" && request.method !== "GET") return reply({ error: "This review connection is read-only." }, 403);
      if (url.pathname === "/shopping/ai-history") {
        const week = weekDate(url.searchParams.get("week")), key = "ai-history:" + actor + ":" + week;
        const history = await this.state.storage.get(key) || [];
        if (request.method === "GET") return reply({ turns: history, draft: await this.state.storage.get("ai-draft:"+actor+":"+week) || null });
        if (request.method === "POST") {
          const body = await request.json();
          const updated = [...history, { role: "user", content: text(body.question, 2000), createdAt: new Date().toISOString() }, { role: "assistant", content: text(body.answer, 8000), createdAt: new Date().toISOString() }].slice(-12);
          await this.state.storage.put(key, updated);
          if(body.draft)await this.state.storage.put("ai-draft:"+actor+":"+week,{draft:body.draft,sources:body.sources||[],checkedAt:body.checkedAt||null});
          return reply({ saved: true });
        }
      }
      if (url.pathname === "/shopping/ai-reserve" && request.method === "POST") {
        const key = "ai-count:" + actor + ":" + new Date().toISOString().slice(0,13);
        const count = await this.state.storage.get(key) || 0;
        if (count >= 30) return reply({ error: "Please pause a moment. The hourly AI request limit has been reached." }, 429);
        await this.state.storage.put(key, count + 1); return reply({ ok: true });
      }
      if (["/shopping/state", "/shopping/review"].includes(url.pathname) && request.method === "GET") return reply(publicState(data, actor));
      if (url.pathname === "/shopping/notification-status" && request.method === "GET") return reply({ configured: Boolean(this.env.VAPID_PUBLIC_KEY && this.env.VAPID_PRIVATE_JWK), publicKey: this.env.VAPID_PUBLIC_KEY || "" });
      if (url.pathname === "/shopping/invite" && request.method === "POST") {
        if (actor !== "vinny") fail("Only Vinny can create shopping access.", 403);
        const accessToken = crypto.randomUUID() + crypto.randomUUID(); data.access.mamaHash = await digest(accessToken); data.devices = data.devices.filter(d => d.role !== "mama");
        data.version++; await this.write(data); return reply({ accessToken, role: "mama" });
      }
      if (url.pathname === "/shopping/subscribe" && request.method === "POST") {
        const subscription = await request.json();
        if (!validSubscription(subscription)) fail("Push subscription is not valid.");
        const key = await digest(subscription.endpoint); data.devices = data.devices.filter(d => d.key !== key); data.devices.push({ key, role: actor, subscription }); await this.write(data); return reply({ ok: true });
      }
      if (url.pathname === "/shopping/subscribe" && request.method === "DELETE") {
        const body = await request.json();
        data.devices = data.devices.filter(device => device.role !== actor || device.subscription.endpoint !== body.endpoint);
        await this.write(data); return reply({ ok: true });
      }
      if (url.pathname === "/shopping/assets" && request.method === "POST") {
        const mime = (request.headers.get("Content-Type") || "").split(";")[0];
        if (!/^(image\/(jpeg|png|webp)|audio\/(mp4|webm|ogg|mpeg))$/.test(mime)) fail("Use a JPEG, PNG, WebP photo or supported voice recording.");
        const buffer = await request.arrayBuffer(); if (!buffer.byteLength || buffer.byteLength > 4 * 1024 * 1024) fail("Use a file smaller than 4 MB.", 413);
        const id = crypto.randomUUID(); let binary = ""; const bytes = new Uint8Array(buffer); for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        await this.env.TRACKER_KV.put("shopping-asset:" + id, JSON.stringify({ mime, base64: btoa(binary) }));
        data.assets.push({ id, mime, actor, createdAt: new Date().toISOString() }); await this.write(data); return reply({ id, mime });
      }
      if (url.pathname.startsWith("/shopping/assets/") && request.method === "GET") {
        const id = url.pathname.split("/").at(-1); requireAsset(data, id);
        const saved = await this.env.TRACKER_KV.get("shopping-asset:" + id, "json"); if (!saved) fail("File unavailable.", 404);
        return new Response(Uint8Array.from(atob(saved.base64), c => c.charCodeAt(0)), { headers: { "Content-Type": saved.mime, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
      }
      if (url.pathname === "/shopping/action" && request.method === "POST") {
        const raw = await request.text(); if (raw.length > 20000) fail("This edit is too large.", 413);
        const body = JSON.parse(raw); if (!/^[a-zA-Z0-9_-]{16,100}$/.test(body.opId || "")) fail("A unique operation ID is required.");
        if (body.actor !== undefined && body.actor !== actor) fail("This pending edit belongs to a different shopping account. Review it in the original account.", 403);
        if (await this.state.storage.get("op:" + body.opId)) return reply({ state: publicState(data, actor), repeated: true });
        const { result, event, target } = mutate(data, body, actor);
        data.version++; data.updatedAt = new Date().toISOString(); await this.write(data, body.opId);
        if(body.type==="add-draft-items")await this.state.storage.delete("ai-draft:"+actor+":"+body.week);
        if (event && target !== actor) {
          const notification = this.notify(data, target, event);
          if (this.state.waitUntil) this.state.waitUntil(notification); else await notification;
        }
        return reply({ ...result, state: publicState(data, actor) });
      }
      return reply({ error: "Shopping route not found." }, 404);
    } catch (error) { return reply({ error: error.status ? error.message : "Shopping request could not be saved." }, error.status || 500); }
  }
  async notify(data, role, message) {
    if (!this.env.VAPID_PUBLIC_KEY || !this.env.VAPID_PRIVATE_JWK) return;
    await Promise.allSettled(data.devices.filter(d => d.role === role).map(device => sendWebPush(device.subscription, { title: "Shopping update", body: message, tag: "shopping-update", url: "/tracker/shopping/#updates" }, this.env)));
  }
}

function validSubscription(subscription) {
  try { const url = new URL(subscription.endpoint); return url.protocol === "https:" && ["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].some(h => url.hostname === h || url.hostname.endsWith('.' + h)) && /^[A-Za-z0-9_-]{20,200}$/.test(subscription.keys?.p256dh || "") && /^[A-Za-z0-9_-]{10,100}$/.test(subscription.keys?.auth || ""); } catch { return false; }
}

export async function shoppingFetch(request, env, cors) {
  if (!env.SHOPPING_ROOM) return new Response(JSON.stringify({ error: "Shopping is not configured." }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
  const room = env.SHOPPING_ROOM.get(env.SHOPPING_ROOM.idFromName("family-shopping-v1"));
  const response = await room.fetch(request);
  const headers = new Headers(response.headers); for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}

export { mutate, publicState, validSubscription, currentDate };
