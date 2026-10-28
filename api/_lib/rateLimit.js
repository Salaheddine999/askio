import crypto from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin.js";

const WINDOW_MS = 60_000;

/**
 * Fixed windows (one minute unless `windowMs` says otherwise) stored in
 * Firestore, so the limit holds across serverless instances. Returns false
 * once `limit` requests used the window. Old windows carry `expiresAt`; the
 * nightly cleanup deletes them.
 */
export async function takeRateLimit(key, limit, windowMs = WINDOW_MS) {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const ref = adminDb.collection("ai_rate_limits").doc(`${key}_${windowStart}`);

  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const count = snap.exists ? Number(snap.data().count) || 0 : 0;
    if (count >= limit) return false;
    transaction.set(
      ref,
      { count: count + 1, expiresAt: Timestamp.fromMillis(windowStart + 2 * windowMs) },
      { merge: true }
    );
    return true;
  });
}

/**
 * Takes several limits in order, stopping at the first that refuses. Narrow
 * limits go first (the visitor's own, then the chatbot's shared one), so a
 * request one visitor's limit turns away never uses up the shared window
 * every other visitor relies on.
 */
export async function takeRateLimits(limits) {
  for (const [key, limit, windowMs] of limits) {
    if (!(await takeRateLimit(key, limit, windowMs))) return false;
  }
  return true;
}

/** The client address Vercel saw, not a hop the client wrote itself. */
function clientIp(req) {
  const first = (value) => String(value || "").split(",")[0].trim();
  return (
    first(req.headers["x-vercel-forwarded-for"]) ||
    first(req.headers["x-real-ip"]) ||
    first(req.headers["x-forwarded-for"]) ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * A hashed visitor key, so raw IP addresses are never stored. IPv6 addresses
 * count per /64, the block one connection usually gets, so rotating through
 * addresses in it doesn't make new visitors.
 */
export function visitorKey(req) {
  let ip = clientIp(req).toLowerCase();
  if (ip.includes(":") && !ip.startsWith("::ffff:")) {
    const [head, tail = ""] = ip.split("%")[0].split("::");
    const headGroups = head ? head.split(":") : [];
    const tailGroups = tail ? tail.split(":") : [];
    const groups = ip.includes("::")
      ? [...headGroups, ...Array(Math.max(0, 8 - headGroups.length - tailGroups.length)).fill("0"), ...tailGroups]
      : headGroups;
    ip = `${groups.slice(0, 4).map((g) => parseInt(g, 16) || 0).join(":")}::/64`;
  }
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
