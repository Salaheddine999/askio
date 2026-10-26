import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { sendError } from "../_lib/response.js";

const BATCH_SIZE = 400;
// Keeps one run well inside the serverless time limit and the free daily delete quota.
const MAX_PER_RUN = 8000;

/** Saved conversations are kept this long after their last message (Privacy Policy). */
const CONVERSATION_DAYS = 90;

async function deleteWhere(query, budget) {
  let deleted = 0;
  while (deleted < budget) {
    const snap = await query.limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return deleted;
}

/**
 * Daily Vercel Cron job, doing the job of Firestore TTL policies without
 * needing a Google Cloud billing account. It deletes:
 * - rate-limit records (hashed IP and chatbot counters) whose `expiresAt` has passed;
 * - saved conversations with no message for 90 days.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when that environment
 * variable is set, so only the scheduler can trigger it.
 */
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const rateLimits = await deleteWhere(
      adminDb.collection("ai_rate_limits").where("expiresAt", "<", Timestamp.now()),
      MAX_PER_RUN
    );
    const cutoff = Timestamp.fromMillis(Date.now() - CONVERSATION_DAYS * 86_400_000);
    const conversations = await deleteWhere(
      adminDb.collection("conversations").where("lastMessageAt", "<", cutoff),
      MAX_PER_RUN - rateLimits
    );
    return res.status(200).json({ deleted: rateLimits + conversations, rateLimits, conversations });
  } catch (error) {
    console.error("Cleanup failed:", error);
    return sendError(res, error);
  }
}
