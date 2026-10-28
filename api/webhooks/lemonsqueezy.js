import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../_lib/firebaseAdmin.js";
import {
  getLemonSqueezyConfig,
  isSignedCheckoutUid,
  verifyWebhookSignature,
} from "../_lib/lemonsqueezy.js";
import { readRawBody } from "../_lib/rawBody.js";
import { reportError, withMonitoring } from "../_lib/monitoring.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export function mapPlanStatus(lsStatus = "") {
  const normalized = String(lsStatus || "").toLowerCase();

  if (["active", "on_trial", "cancelled"].includes(normalized)) {
    return {
      plan: "pro",
      subscriptionStatus: normalized,
      aiChatbotLimit: 10,
      isPro: true,
    };
  }

  if (["paused", "past_due", "unpaid", "expired"].includes(normalized)) {
    return {
      plan: "free",
      subscriptionStatus: normalized,
      aiChatbotLimit: 0,
      isPro: false,
    };
  }

  return {
    plan: "free",
    subscriptionStatus: normalized || "inactive",
    aiChatbotLimit: 0,
    isPro: false,
  };
}

const UID_PATTERN = /^[A-Za-z0-9]{1,128}$/;
const BILLABLE = new Set(["active", "on_trial", "past_due", "paused", "unpaid", "cancelled"]);

/**
 * The account an event is for, and whether that's certain. A uid signed at
 * checkout (create-checkout) is certain. An unsigned uid (an old or edited
 * checkout link) or a match on the buyer's email is only a guess, because the
 * buyer typed it.
 */
async function findUserRef(payload) {
  const custom = payload?.meta?.custom_data || {};
  const uid = String(custom.uid || custom.user_id || "");

  if (UID_PATTERN.test(uid)) {
    return { ref: adminDb.collection("users").doc(uid), signed: isSignedCheckoutUid(uid, custom.uid_sig) };
  }
  const ref = await findUserRefByEmail(payload);
  return ref ? { ref, signed: false } : null;
}

async function findUserRefByEmail(payload) {

  const email = payload?.data?.attributes?.user_email || payload?.data?.attributes?.customer_email;
  if (!email) {
    return null;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const querySnap = await adminDb
    .collection("users")
    .where("email", "==", normalizedEmail)
    .limit(1)
    .get();

  if (!querySnap.empty) {
    return querySnap.docs[0].ref;
  }

  const caseInsensitiveScan = await adminDb.collection("users").limit(50).get();
  const matchingDoc = caseInsensitiveScan.docs.find((doc) => {
    const docEmail = String(doc.data()?.email || "").trim().toLowerCase();
    return docEmail === normalizedEmail;
  });

  if (matchingDoc) {
    return matchingDoc.ref;
  }

  try {
    const authUser = await adminAuth.getUserByEmail(normalizedEmail);
    return adminDb.collection("users").doc(authUser.uid);
  } catch {
    return null;
  }
}

/**
 * Decides whether an event may update the account. Events for the
 * subscription already on the account always may (if they aren't older than
 * the last one applied). A different subscription may replace it only when
 * the checkout uid was signed, or when the account has no billable
 * subscription left, so a buyer can't take over someone else's billing.
 */
export function shouldApplyEvent(stored = {}, { subscriptionId, updatedAt, signed }) {
  const storedId = stored.lemonSqueezySubscriptionId != null ? String(stored.lemonSqueezySubscriptionId) : null;
  if (storedId === subscriptionId) {
    const last = Date.parse(stored.lemonSqueezyUpdatedAt || "");
    const current = Date.parse(updatedAt || "");
    return !(last && current && current < last);
  }
  if (signed) return true;
  return !storedId || !BILLABLE.has(String(stored.subscriptionStatus || "").toLowerCase());
}

async function handleSubscriptionEvent(payload) {
  // Only subscription objects carry a subscription's status; the
  // subscription_payment_* events carry invoices.
  if (payload?.data?.type !== "subscriptions" || payload?.data?.id == null) return;
  const target = await findUserRef(payload);
  if (!target) {
    return;
  }

  const attributes = payload.data.attributes || {};
  const subscriptionId = String(payload.data.id);
  const mapped = mapPlanStatus(attributes.status);

  await adminDb.runTransaction(async (transaction) => {
    const stored = (await transaction.get(target.ref)).data() || {};
    if (!shouldApplyEvent(stored, { subscriptionId, updatedAt: attributes.updated_at, signed: target.signed })) {
      console.warn(`Ignored Lemon Squeezy event for subscription ${subscriptionId}: it doesn't match the account's billing.`);
      return;
    }
    transaction.set(
      target.ref,
      {
        ...mapped,
        lemonSqueezyCustomerId: attributes.customer_id ?? null,
        lemonSqueezyOrderId: attributes.order_id ?? null,
        lemonSqueezyProductId: attributes.product_id ?? null,
        lemonSqueezyVariantId: attributes.variant_id ?? null,
        lemonSqueezySubscriptionId: subscriptionId,
        lemonSqueezyCustomerPortalUrl: attributes.urls?.customer_portal ?? null,
        lemonSqueezyUpdatedAt: attributes.updated_at ?? null,
        currentPeriodEnd: attributes.renews_at || attributes.ends_at || null,
        lastBillingSyncAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["x-signature"];
    const { webhookSecret } = getLemonSqueezyConfig();

    if (!webhookSecret) {
      return res.status(500).json({ error: "LEMONSQUEEZY_WEBHOOK_SECRET is not configured." });
    }

    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid webhook signature." });
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    // The event name inside the signed body, not the unsigned header.
    const eventName = payload?.meta?.event_name || "";

    if (String(eventName).startsWith("subscription_")) {
      await handleSubscriptionEvent(payload);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook error:", error);
    reportError(error, { route: "webhooks/lemonsqueezy" });
    return res.status(500).json({ error: "Webhook handling failed." });
  }
}

export default withMonitoring("webhooks/lemonsqueezy", handler);
