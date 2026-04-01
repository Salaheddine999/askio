import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../_lib/firebaseAdmin.js";
import {
  getLemonSqueezyConfig,
  verifyWebhookSignature,
} from "../_lib/lemonsqueezy.js";
import { readRawBody } from "../_lib/rawBody.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

function mapPlanStatus(lsStatus = "") {
  const normalized = String(lsStatus || "").toLowerCase();

  if (["active", "on_trial"].includes(normalized)) {
    return {
      plan: "pro",
      subscriptionStatus: normalized,
      aiChatbotLimit: 10,
      isPro: true,
    };
  }

  if (["paused", "past_due", "unpaid", "cancelled", "expired"].includes(normalized)) {
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

async function findUserRef(payload) {
  const uid =
    payload?.meta?.custom_data?.uid ||
    payload?.meta?.custom_data?.user_id ||
    null;

  if (uid) {
    return adminDb.collection("users").doc(uid);
  }

  const email = payload?.data?.attributes?.user_email || payload?.data?.attributes?.customer_email;
  if (!email) {
    return null;
  }

  const querySnap = await adminDb
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (querySnap.empty) {
    return null;
  }

  return querySnap.docs[0].ref;
}

async function handleSubscriptionEvent(payload) {
  const userRef = await findUserRef(payload);
  if (!userRef) {
    return;
  }

  const attributes = payload?.data?.attributes || {};
  const mapped = mapPlanStatus(attributes.status);

  await userRef.set(
    {
      ...mapped,
      lemonSqueezyCustomerId: attributes.customer_id ?? null,
      lemonSqueezyOrderId: attributes.order_id ?? null,
      lemonSqueezyProductId: attributes.product_id ?? null,
      lemonSqueezyVariantId: attributes.variant_id ?? null,
      lemonSqueezySubscriptionId: payload?.data?.id ?? null,
      lemonSqueezyCustomerPortalUrl: attributes.urls?.customer_portal ?? null,
      currentPeriodEnd: attributes.renews_at || attributes.ends_at || null,
      lastBillingSyncAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export default async function handler(req, res) {
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
    const eventName =
      req.headers["x-event-name"] || payload?.meta?.event_name || "";

    if (String(eventName).startsWith("subscription_")) {
      await handleSubscriptionEvent(payload);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook error:", error);
    return res.status(500).json({ error: "Webhook handling failed." });
  }
}
