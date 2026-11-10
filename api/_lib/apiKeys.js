import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "./auth.js";
import { adminDb } from "./firebaseAdmin.js";
import { assertNotSuspended, getUserAccessProfile } from "./plan.js";
import { sendError } from "./response.js";

// API keys let an owner's AI assistant (Claude, Cursor, ...) manage their
// chatbots through /api/mcp. A key is shown once, when it's made; only its
// SHA-256 hash is stored, as the document id in `api_keys`, so a leaked
// database never gives working keys. The browser can't read or write that
// collection (Firestore rules deny it); everything goes through here.

export const KEY_PREFIX = "askio_";
export const MAX_KEYS = 5;
const MAX_NAME_CHARS = 60;
/** `lastUsedAt` is refreshed at most this often, to save a write per call. */
const LAST_USED_EVERY_MS = 60 * 60_000;
const KEY_SHAPE = /^askio_[A-Za-z0-9_-]{32}$/;
const KEY_ID = /^[0-9a-f]{64}$/;

export const hashApiKey = (key) => crypto.createHash("sha256").update(key).digest("hex");

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const keys = () => adminDb.collection("api_keys");

const millis = (value) => (typeof value?.toMillis === "function" ? value.toMillis() : null);

function publicKey(id, data) {
  return {
    id,
    name: data.name,
    hint: data.hint,
    createdAt: millis(data.createdAt),
    lastUsedAt: millis(data.lastUsedAt),
  };
}

async function listKeys(uid) {
  const snap = await keys().where("userId", "==", uid).get();
  return snap.docs
    .map((doc) => publicKey(doc.id, doc.data()))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

async function createKey(uid, rawName) {
  const profile = await getUserAccessProfile(uid);
  assertNotSuspended(profile.userData);

  const name = String(rawName ?? "").trim().slice(0, MAX_NAME_CHARS);
  if (!name) throw httpError(400, "Give the key a name, such as the AI you'll use it with.");

  const existing = await keys().where("userId", "==", uid).get();
  if (existing.size >= MAX_KEYS) {
    throw httpError(400, `You can have up to ${MAX_KEYS} API keys. Revoke one you no longer use first.`);
  }

  const key = KEY_PREFIX + crypto.randomBytes(24).toString("base64url");
  const id = hashApiKey(key);
  const hint = `${KEY_PREFIX}…${key.slice(-4)}`;
  await keys().doc(id).set({ userId: uid, name, hint, createdAt: FieldValue.serverTimestamp(), lastUsedAt: null });

  // The only time the key itself leaves the server.
  return { key, id, name, hint };
}

async function revokeKey(uid, id) {
  if (typeof id !== "string" || !KEY_ID.test(id)) throw httpError(400, "Unknown API key.");
  const ref = keys().doc(id);
  const snap = await ref.get();
  // Someone else's key looks the same as one that doesn't exist.
  if (!snap.exists || snap.data().userId !== uid) throw httpError(404, "API key not found.");
  await ref.delete();
}

const ACTIONS = {
  list: async (uid) => ({ keys: await listKeys(uid) }),
  create: async (uid, body) => createKey(uid, body.name),
  revoke: async (uid, body) => {
    await revokeKey(uid, body.id);
    return { revoked: true };
  },
};

/** POST /api/account/api-keys-{list,create,revoke}, for the signed-in owner. */
export default async function apiKeys(req, res, action) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { uid } = await requireUser(req);
    return res.status(200).json(await ACTIONS[action](uid, req.body || {}));
  } catch (error) {
    console.error(`API key ${action} failed:`, error);
    return sendError(res, error);
  }
}

/**
 * The account an `Authorization: Bearer askio_…` header belongs to. Throws a
 * 401 for a missing, malformed or revoked key.
 */
export async function requireApiKey(req) {
  const [, key] = String(req.headers.authorization || "").match(/^Bearer (\S+)$/i) || [];
  if (!key || !KEY_SHAPE.test(key)) {
    throw httpError(401, "Sign in to Askio to connect, or send an API key as: Authorization: Bearer askio_…");
  }

  const ref = keys().doc(hashApiKey(key));
  const snap = await ref.get();
  if (!snap.exists) throw httpError(401, "This API key was revoked or never existed.");

  const data = snap.data();
  const lastUsed = millis(data.lastUsedAt) || 0;
  if (Date.now() - lastUsed > LAST_USED_EVERY_MS) {
    // Only for the owner's key list; a failed write mustn't fail the call.
    await ref.update({ lastUsedAt: FieldValue.serverTimestamp() }).catch(() => undefined);
  }

  return { uid: data.userId, keyId: snap.id };
}
