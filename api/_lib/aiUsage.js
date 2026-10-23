import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin.js";

/** AI replies a Pro account gets each calendar month (UTC). Keep in sync with src/utils/pricing.ts. */
export const PRO_AI_REPLY_LIMIT = 3000;

/** The usage period, e.g. "2026-10". Counts reset when the UTC month changes. */
export function currentUsageMonth(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function usageRef(uid, month) {
  return adminDb.collection("ai_usage").doc(`${uid}_${month}`);
}

export async function getMonthlyAiReplies(uid) {
  const snap = await usageRef(uid, currentUsageMonth()).get();
  return snap.exists ? Number(snap.data().replies) || 0 : 0;
}

export async function recordAiReply(uid) {
  const month = currentUsageMonth();
  await usageRef(uid, month).set(
    { uid, month, replies: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
