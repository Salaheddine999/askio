import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../_lib/firebaseAdmin.js";
import {
  getLemonSqueezyConfig,
  isSignedCheckoutUid,
  verifyWebhookSignature,
} from "../_lib/lemonsqueezy.js";
import { GIFTED_PRO } from "../_lib/plan.js";
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

const sameTime = (a, b) => Boolean(a && b) && Date.parse(a) === Date.parse(b);

/**
 * A refunded period doesn't give Pro (see the Refund Policy), and neither does
 * one an admin ended early. Later events for that period, like the owner
 * cancelling the subscription in Lemon Squeezy, keep the account on the free
 * plan. A new payment moves the period end, which gives Pro again.
 */
export function keepsRefund(stored = {}, { subscriptionId, periodEnd, mapped }) {
  return (
    mapped.isPro &&
    String(stored.lemonSqueezySubscriptionId ?? "") === subscriptionId &&
    (sameTime(stored.refundedPeriodEnd, periodEnd) || sameTime(stored.endedPeriodEnd, periodEnd))
  );
}

/**
 * What a refund changes on the account: a full refund of a subscription
 * payment (subscription_payment_refunded) or of the order that started it
 * (order_refunded) ends Pro straight away. Partial refunds change nothing.
 */
export function refundUpdate(stored = {}, payload) {
  const type = payload?.data?.type;
  const attributes = payload?.data?.attributes || {};
  if (String(attributes.status || "").toLowerCase() !== "refunded") return null;
  const matches =
    type === "subscription-invoices"
      ? String(stored.lemonSqueezySubscriptionId ?? "") === String(attributes.subscription_id ?? "")
      : type === "orders"
        ? String(stored.lemonSqueezyOrderId ?? "") === String(payload.data.id ?? "")
        : false;
  if (!matches || stored.lemonSqueezySubscriptionId == null) return null;
  return {
    ...mapPlanStatus("refunded"),
    refundedPeriodEnd: stored.currentPeriodEnd ?? null,
    refundedAt: attributes.refunded_at ?? new Date().toISOString(),
  };
}

// A refund is only ever applied to the account whose stored subscription or
// order it's for, never matched by email.
async function handleRefundEvent(payload) {
  const type = payload?.data?.type;
  const attributes = payload?.data?.attributes || {};
  const users = adminDb.collection("users");
  const query =
    type === "subscription-invoices" && attributes.subscription_id != null
      ? users.where("lemonSqueezySubscriptionId", "==", String(attributes.subscription_id))
      : type === "orders" && payload.data.id != null
        ? users.where("lemonSqueezyOrderId", "in", [Number(payload.data.id), String(payload.data.id)])
        : null;
  if (!query) return;
  const snap = await query.limit(1).get();
  if (snap.empty) return;
  const ref = snap.docs[0].ref;

  await adminDb.runTransaction(async (transaction) => {
    const update = refundUpdate((await transaction.get(ref)).data() || {}, payload);
    if (update) transaction.set(ref, { ...update, lastBillingSyncAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

/** "monthly" or "yearly", from the variant's name in Lemon Squeezy ("Monthly", "Yearly"). */
export function billingIntervalOf(variantName) {
  const name = String(variantName || "").toLowerCase();
  if (/year|annual/.test(name)) return "yearly";
  if (/month/.test(name)) return "monthly";
  return null;
}

/**
 * A gift of Pro from an admin outlasts a paid subscription: if the
 * subscription ends while the gift hasn't, the account stays on the gift.
 */
export function keepsGift(stored = {}, mapped) {
  const end = Date.parse(stored.giftedUntil || "");
  return !mapped.isPro && Number.isFinite(end) && end > Date.now();
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
  const periodEnd = attributes.renews_at || attributes.ends_at || null;

  await adminDb.runTransaction(async (transaction) => {
    const stored = (await transaction.get(target.ref)).data() || {};
    if (!shouldApplyEvent(stored, { subscriptionId, updatedAt: attributes.updated_at, signed: target.signed })) {
      console.warn(`Ignored Lemon Squeezy event for subscription ${subscriptionId}: it doesn't match the account's billing.`);
      return;
    }
    let mapped = mapPlanStatus(attributes.status);
    if (keepsRefund(stored, { subscriptionId, periodEnd, mapped })) {
      mapped = mapPlanStatus(stored.subscriptionStatus === "ended" ? "ended" : "refunded");
    }
    if (keepsGift(stored, mapped)) mapped = GIFTED_PRO;
    transaction.set(
      target.ref,
      {
        ...mapped,
        lemonSqueezyCustomerId: attributes.customer_id ?? null,
        lemonSqueezyOrderId: attributes.order_id ?? null,
        lemonSqueezyProductId: attributes.product_id ?? null,
        lemonSqueezyVariantId: attributes.variant_id ?? null,
        ...(billingIntervalOf(attributes.variant_name) && { billingInterval: billingIntervalOf(attributes.variant_name) }),
        lemonSqueezySubscriptionId: subscriptionId,
        lemonSqueezyCustomerPortalUrl: attributes.urls?.customer_portal ?? null,
        lemonSqueezyUpdatedAt: attributes.updated_at ?? null,
        currentPeriodEnd: periodEnd,
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

    if (eventName === "subscription_payment_refunded" || eventName === "order_refunded") {
      await handleRefundEvent(payload);
    } else if (String(eventName).startsWith("subscription_")) {
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
