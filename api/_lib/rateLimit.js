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

/** A hashed visitor key, so raw IP addresses are never stored. */
export function visitorKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
