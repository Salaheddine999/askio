import crypto from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { requireUser } from "../auth.js";
import { adminDb } from "../firebaseAdmin.js";
import { assertNotSuspended, getOwnedChatbot } from "../plan.js";
import { sendError } from "../response.js";

// Installing the chatbot on a Shopify store, bound to the Askio owner who
// started it:
//   1. POST /api/account/shopify-start (signed in): checks the owner owns the
//      chatbot and returns Shopify's authorize URL with a signed, expiring state.
//   2. GET /api/shopify/callback: Shopify sends the merchant back. The callback
//      verifies Shopify's HMAC and our state, exchanges the code, and parks the
//      store's token for a few minutes. Nothing is installed yet.
//   3. POST /api/account/shopify-connect (signed in): the same owner finishes
//      the install. Someone else's link can't put their chatbot on a store.

export const SHOP_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
const CHATBOT_ID = /^[A-Za-z0-9_-]{1,64}$/;
const STATE_TTL_MS = 10 * 60_000;
const PENDING_TTL_MS = 10 * 60_000;
const SCOPES = "write_script_tags,read_script_tags";
const REDIRECT_URI = "https://askio.vercel.app/api/shopify/callback";
const API_VERSION = "2025-01";

const b64url = (text) => Buffer.from(text).toString("base64url");

function stateSignature(body, secret) {
  return crypto.createHmac("sha256", `askio-shopify-state:${secret}`).update(body).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function signState({ uid, chatbotId, chatbotTitle }, secret, now = Date.now()) {
  const body = b64url(
    JSON.stringify({ uid, chatbotId, chatbotTitle, exp: now + STATE_TTL_MS, nonce: crypto.randomBytes(12).toString("hex") })
  );
  return `${body}.${stateSignature(body, secret)}`;
}

/** The state's contents if our signature checks out and it hasn't expired, else null. */
export function readState(state, secret, now = Date.now()) {
  const [body, signature] = String(state || "").split(".");
  if (!body || !signature || !safeEqual(signature, stateSignature(body, secret))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < now) return null;
    if (typeof data.uid !== "string" || !CHATBOT_ID.test(String(data.chatbotId))) return null;
    return data;
  } catch {
    return null;
  }
}

/** Shopify's query HMAC, compared in constant time. */
export function isSignedByShopify(query, secret) {
  const params = { ...query };
  const hmac = params.hmac;
  delete params.hmac;
  if (typeof hmac !== "string") return false;
  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return safeEqual(crypto.createHmac("sha256", secret).update(message).digest("hex"), hmac);
}

function shopifyCredentials() {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !apiSecret) {
    const error = new Error("Shopify isn't set up yet.");
    error.statusCode = 503;
    throw error;
  }
  return { apiKey, apiSecret };
}

function badRequest(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

/** Step 1: the authorize URL for a chatbot the signed-in owner owns. */
export async function startShopifyInstall(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const { uid } = await requireUser(req);
    const { shop, chatbotId } = req.body || {};
    if (typeof shop !== "string" || !SHOP_PATTERN.test(shop)) throw badRequest("Use your store's address, like yourstore.myshopify.com.");
    if (typeof chatbotId !== "string" || !CHATBOT_ID.test(chatbotId)) throw badRequest("Choose a chatbot first.");
    assertNotSuspended((await adminDb.collection("users").doc(uid).get()).data());
    const { chatbotData } = await getOwnedChatbot(uid, chatbotId);
    const { apiKey, apiSecret } = shopifyCredentials();

    const state = signState({ uid, chatbotId, chatbotTitle: String(chatbotData.title || "Chatbot").slice(0, 80) }, apiSecret);
    const url =
      `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(apiKey)}` +
      `&scope=${SCOPES}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(state)}`;
    return res.status(200).json({ url });
  } catch (error) {
    return sendError(res, error);
  }
}

/** Step 2, from the callback: keep the store's token briefly for the owner who started. */
export async function parkInstall({ uid, chatbotId, chatbotTitle, shop, accessToken }) {
  const id = crypto.randomBytes(18).toString("base64url");
  await adminDb
    .collection("ops")
    .doc(`shopify_pending_${id}`)
    .set({
      uid,
      chatbotId,
      chatbotTitle,
      shop,
      accessToken,
      // The nightly cleanup deletes it if it's never used.
      expiresAt: Timestamp.fromMillis(Date.now() + PENDING_TTL_MS),
    });
  return id;
}

async function shopifyApi(shop, accessToken, path, init = {}) {
  return fetch(`https://${shop}/admin/api/${API_VERSION}/${path}`, {
    ...init,
    headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

/** Replaces any Askio script on the store with this chatbot's. */
async function installScript(shop, accessToken, chatbotId) {
  const existing = await shopifyApi(shop, accessToken, "script_tags.json");
  if (existing.ok) {
    const { script_tags: tags = [] } = await existing.json();
    for (const tag of tags) {
      if (String(tag.src || "").includes("askio.vercel.app")) {
        await shopifyApi(shop, accessToken, `script_tags/${encodeURIComponent(tag.id)}.json`, { method: "DELETE" });
      }
    }
  }
  const created = await shopifyApi(shop, accessToken, "script_tags.json", {
    method: "POST",
    body: JSON.stringify({
      script_tag: { event: "onload", src: `https://askio.vercel.app/api/shopify/script.js?id=${encodeURIComponent(chatbotId)}` },
    }),
  });
  if (!created.ok) {
    console.error("Shopify ScriptTag creation failed:", (await created.text()).slice(0, 300));
    throw badRequest("Shopify didn't accept the chatbot script. Please try again.", 502);
  }
}

/** Step 3: the owner who started the install finishes it. */
export async function connectShopifyInstall(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const { uid } = await requireUser(req);
    const pendingId = String(req.body?.pending || "");
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(pendingId)) throw badRequest("This install link isn't valid. Start again from Integrations.");
    const ref = adminDb.collection("ops").doc(`shopify_pending_${pendingId}`);
    const pending = (await ref.get()).data();
    if (!pending || pending.expiresAt?.toMillis?.() < Date.now()) {
      throw badRequest("This install link has expired. Start again from Integrations.", 410);
    }
    // Only the owner who started the install may finish it.
    if (pending.uid !== uid) throw badRequest("This install was started from another Askio account.", 403);
    await ref.delete();

    assertNotSuspended((await adminDb.collection("users").doc(uid).get()).data());
    await getOwnedChatbot(uid, pending.chatbotId);
    await installScript(pending.shop, pending.accessToken, pending.chatbotId);

    const connection = {
      shop: pending.shop,
      chatbotId: pending.chatbotId,
      chatbotTitle: pending.chatbotTitle,
      userId: uid,
      connectedAt: new Date().toISOString(),
    };
    await adminDb.collection("shopify_connections").doc(pending.shop.replace(/\./g, "_")).set(connection);
    return res.status(200).json(connection);
  } catch (error) {
    return sendError(res, error);
  }
}
