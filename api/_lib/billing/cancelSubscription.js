import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "../auth.js";
import { adminDb } from "../firebaseAdmin.js";
import { lemonRequest, ownedSubscription } from "../lemonsqueezy.js";
import { ENDED_NOW } from "../plan.js";
import { sendError } from "../response.js";

// Only paying subscriptions: a cancelled one keeps Pro until the period ends.
const CANCELLABLE = new Set(["active", "on_trial"]);
// Ending Pro now also covers subscriptions that stopped paying.
const ENDABLE = new Set([...CANCELLABLE, "past_due", "unpaid", "paused"]);

const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });

// Lemon Squeezy doesn't know the subscription, usually because it was made in
// test mode and the site now uses the live key, or the other way round.
const NOT_FOUND =
  "We couldn't find this subscription in Lemon Squeezy. It may have been created in test mode. Contact us and we'll sort it out.";

/**
 * Cancels an account's own subscription in Lemon Squeezy, the same as
 * cancelling in its portal, and saves the change so the app updates straight
 * away (the webhook sends it too). By default Pro stays until the paid period
 * ends; `now` (admins only, e.g. after a refund) ends it straight away, and
 * also works on a subscription that's already cancelled.
 */
export async function cancelAccountSubscription(ref, userData, { now = false } = {}) {
  const subscription = await ownedSubscription(userData).catch((error) => {
    if (error.lemonStatus === 404) throw fail(404, NOT_FOUND);
    throw error;
  });
  if (!subscription) throw fail(404, NOT_FOUND);
  const status = String(subscription.attributes?.status || "").toLowerCase();

  let attributes = subscription.attributes || {};
  if ((now ? ENDABLE : CANCELLABLE).has(status)) {
    const response = await lemonRequest(`/subscriptions/${subscription.id}`, { method: "DELETE" });
    attributes = response?.data?.attributes || {};
  } else if (!(now && status === "cancelled")) {
    throw fail(409, now ? "This subscription has already ended." : "This subscription is already cancelled.");
  }
  const endsAt = attributes.ends_at || attributes.renews_at || null;

  await ref.set(
    {
      ...(now ? { ...ENDED_NOW, endedPeriodEnd: endsAt } : { subscriptionStatus: "cancelled" }),
      currentPeriodEnd: endsAt,
      lemonSqueezyUpdatedAt: attributes.updated_at ?? null,
      lastBillingSyncAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { status: now ? ENDED_NOW.subscriptionStatus : "cancelled", endsAt };
}

/** POST /api/billing/cancel-subscription: the signed-in user cancels at the end of the period. */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decodedToken = await requireUser(req);
    const ref = adminDb.collection("users").doc(decodedToken.uid);
    const userData = (await ref.get()).data() || {};
    return res.status(200).json(await cancelAccountSubscription(ref, userData));
  } catch (error) {
    console.error("Failed to cancel the Lemon Squeezy subscription:", error);
    return sendError(res, error);
  }
}
