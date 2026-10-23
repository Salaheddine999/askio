import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { sendError } from "../_lib/response.js";

const BATCH_SIZE = 400;
// Keeps one run well inside the serverless time limit and the free daily delete quota.
const MAX_PER_RUN = 8000;

/**
 * Daily Vercel Cron job: deletes rate-limit records (hashed IP and chatbot
 * counters) whose `expiresAt` has passed. Does the job of a Firestore TTL
 * policy without needing a Google Cloud billing account.
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
    const now = Timestamp.now();
    let deleted = 0;
    while (deleted < MAX_PER_RUN) {
      const snap = await adminDb
        .collection("ai_rate_limits")
        .where("expiresAt", "<", now)
        .limit(BATCH_SIZE)
        .get();
      if (snap.empty) break;
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deleted += snap.size;
      if (snap.size < BATCH_SIZE) break;
    }
    return res.status(200).json({ deleted });
  } catch (error) {
    console.error("Rate-limit cleanup failed:", error);
    return sendError(res, error);
  }
}
