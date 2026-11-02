import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "../auth.js";
import { adminDb } from "../firebaseAdmin.js";
import { lemonRequest, ownedSubscription } from "../lemonsqueezy.js";
import { sendError } from "../response.js";

// Only paying subscriptions: a cancelled one keeps Pro until the period ends.
const CANCELLABLE = new Set(["active", "on_trial"]);

const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });

// Lemon Squeezy doesn't know the subscription, usually because it was made in
// test mode and the site now uses the live key, or the other way round.
const NOT_FOUND =
  "We couldn't find this subscription in Lemon Squeezy. It may have been created in test mode. Contact us and we'll sort it out.";

// Cancels the account's own subscription at the end of the paid period, the
// same as cancelling in the Lemon Squeezy portal. The webhook sends the same
// change; saving it here as well updates Settings straight away.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decodedToken = await requireUser(req);
    const ref = adminDb.collection("users").doc(decodedToken.uid);
    const userData = (await ref.get()).data() || {};

    const subscription = await ownedSubscription(userData).catch((error) => {
      if (error.lemonStatus === 404) throw fail(404, NOT_FOUND);
      throw error;
    });
    if (!subscription) throw fail(404, NOT_FOUND);
    const status = String(subscription.attributes?.status || "").toLowerCase();
    if (!CANCELLABLE.has(status)) throw fail(409, "This subscription is already cancelled.");

    const response = await lemonRequest(`/subscriptions/${subscription.id}`, { method: "DELETE" });
    const attributes = response?.data?.attributes || {};
    const endsAt = attributes.ends_at || attributes.renews_at || null;

    await ref.set(
      {
        subscriptionStatus: "cancelled",
        currentPeriodEnd: endsAt,
        lemonSqueezyUpdatedAt: attributes.updated_at ?? null,
        lastBillingSyncAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ status: "cancelled", endsAt });
  } catch (error) {
    console.error("Failed to cancel the Lemon Squeezy subscription:", error);
    return sendError(res, error);
  }
}
