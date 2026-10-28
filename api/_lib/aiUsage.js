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

/**
 * Takes one reply from this month's allowance, in a transaction, so replies
 * requested at the same moment can't go past `limit`. False when it's used up.
 */
export async function reserveAiReply(uid, limit) {
  const month = currentUsageMonth();
  const ref = usageRef(uid, month);
  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const used = snap.exists ? Number(snap.data().replies) || 0 : 0;
    if (used >= limit) return false;
    transaction.set(
      ref,
      { uid, month, replies: used + 1, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return true;
  });
}

/** Gives a reserved reply back when none reached the visitor. Never throws. */
export async function releaseAiReply(uid) {
  await usageRef(uid, currentUsageMonth())
    .set({ replies: FieldValue.increment(-1) }, { merge: true })
    .catch(() => undefined);
}

export async function recordAiReply(uid) {
  const month = currentUsageMonth();
  await usageRef(uid, month).set(
    { uid, month, replies: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
