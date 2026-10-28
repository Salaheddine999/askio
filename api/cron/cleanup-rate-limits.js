import crypto from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { sendError } from "../_lib/response.js";
import { withMonitoring } from "../_lib/monitoring.js";
import { sendSetupReminders } from "../_lib/email/alerts.js";

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
 * - hourly AI failure counters, the same way;
 * - anything left by the removed homepage demo;
 * - saved conversations with no message for 90 days.
 * It also emails owners whose new chatbot isn't on a website yet.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when that environment
 * variable is set, so only the scheduler can trigger it.
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret || ""}`);
  const received = Buffer.from(String(req.headers.authorization || ""));
  if (!secret || expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const rateLimits = await deleteWhere(
      adminDb.collection("ai_rate_limits").where("expiresAt", "<", Timestamp.now()),
      MAX_PER_RUN
    );
    // Hourly AI failure counters (see aiHealth.js).
    const aiCounters = await deleteWhere(
      adminDb.collection("ops").where("expiresAt", "<", Timestamp.now()),
      MAX_PER_RUN - rateLimits
    );
    // Results saved by the homepage demo, which was removed: cleared out so
    // nothing is left behind. Safe to delete this after a few runs.
    const demos = await deleteWhere(adminDb.collection("demo_cache"), MAX_PER_RUN - rateLimits - aiCounters);
    const cutoff = Timestamp.fromMillis(Date.now() - CONVERSATION_DAYS * 86_400_000);
    const conversations = await deleteWhere(
      adminDb.collection("conversations").where("lastMessageAt", "<", cutoff),
      MAX_PER_RUN - rateLimits - aiCounters - demos
    );
    const setupReminders = await sendSetupReminders();
    return res.status(200).json({ deleted: rateLimits + aiCounters + demos + conversations, rateLimits, aiCounters, demos, conversations, setupReminders });
  } catch (error) {
    console.error("Cleanup failed:", error);
    return sendError(res, error);
  }
}

export default withMonitoring("cron/cleanup", handler);
