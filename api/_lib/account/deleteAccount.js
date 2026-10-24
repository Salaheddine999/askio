import { FieldPath } from "firebase-admin/firestore";
import { requireUser } from "../auth.js";
import { adminAuth, adminDb } from "../firebaseAdmin.js";
import { lemonRequest } from "../lemonsqueezy.js";
import { sendError } from "../response.js";

const BATCH_SIZE = 400;
// Firestore "in" filters accept at most 30 values.
const IN_LIMIT = 30;
const BILLABLE_STATUSES = new Set(["active", "on_trial", "past_due", "paused", "unpaid"]);

async function deleteMatching(query) {
  let deleted = 0;
  for (;;) {
    const snap = await query.limit(BATCH_SIZE).get();
    if (snap.empty) return deleted;
    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    if (snap.size < BATCH_SIZE) return deleted;
  }
}

async function deleteByChatbots(collectionName, chatbotIds) {
  let deleted = 0;
  for (let i = 0; i < chatbotIds.length; i += IN_LIMIT) {
    const ids = chatbotIds.slice(i, i + IN_LIMIT);
    deleted += await deleteMatching(adminDb.collection(collectionName).where("chatbotId", "in", ids));
  }
  return deleted;
}

/**
 * Permanently deletes an account and everything stored for it: chatbots, the
 * visitor data they collected, usage counters, integrations, the profile and
 * the login. An active subscription is cancelled first, and nothing is deleted
 * if that fails, so nobody keeps being billed.
 */
export async function deleteAccountData(uid) {
  const userRef = adminDb.collection("users").doc(uid);
  const userData = (await userRef.get()).data() || {};

  const subscriptionId = userData.lemonSqueezySubscriptionId;
  const status = String(userData.subscriptionStatus || "").toLowerCase();
  if (subscriptionId && BILLABLE_STATUSES.has(status)) {
    try {
      await lemonRequest(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to cancel subscription before account deletion:", error);
      const failure = new Error(
        "We couldn't cancel the subscription, so the account was not deleted. Please try again or contact support."
      );
      failure.statusCode = 502;
      throw failure;
    }
  }

  const chatbotSnap = await adminDb.collection("chatbot_configs").where("user_id", "==", uid).get();
  const chatbotIds = chatbotSnap.docs.map((d) => d.id);

  // Visitor data: matched by owner, and by chatbot for older entries saved without one.
  for (const name of ["leads", "unanswered_queries", "analytics_events", "feedback"]) {
    await deleteMatching(adminDb.collection(name).where("ownerId", "==", uid));
    await deleteByChatbots(name, chatbotIds);
  }

  // Monthly AI usage counters are keyed "<uid>_<YYYY-MM>".
  await deleteMatching(
    adminDb
      .collection("ai_usage")
      .where(FieldPath.documentId(), ">=", `${uid}_`)
      .where(FieldPath.documentId(), "<=", `${uid}_`)
  );
  await deleteMatching(adminDb.collection("shopify_connections").where("userId", "==", uid));
  await deleteMatching(adminDb.collection("chatbot_configs").where("user_id", "==", uid));
  await userRef.delete();

  try {
    await adminAuth.deleteUser(uid);
  } catch (error) {
    // Already gone is fine; the data above is what mattered.
    if (error?.code !== "auth/user-not-found") throw error;
  }

  return { chatbots: chatbotIds.length };
}

/** POST /api/account/delete: the signed-in user deletes their own account. */
export default async function deleteOwnAccount(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { uid } = await requireUser(req);
    const { chatbots } = await deleteAccountData(uid);
    return res.status(200).json({ deleted: true, chatbots });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return sendError(res, error);
  }
}
