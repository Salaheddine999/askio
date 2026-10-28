import crypto from "node:crypto";

const API_BASE_URL = "https://api.lemonsqueezy.com/v1";

export function getLemonSqueezyConfig() {
  return {
    apiKey: process.env.LEMONSQUEEZY_API_KEY || "",
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",
    proCheckoutUrl:
      process.env.LEMONSQUEEZY_PRO_CHECKOUT_URL ||
      process.env.VITE_LEMONSQUEEZY_PRO_CHECKOUT_URL ||
      "",
    proYearlyCheckoutUrl:
      process.env.LEMONSQUEEZY_PRO_YEARLY_CHECKOUT_URL ||
      process.env.VITE_LEMONSQUEEZY_PRO_YEARLY_CHECKOUT_URL ||
      "",
    billingUrl:
      process.env.LEMONSQUEEZY_BILLING_URL ||
      process.env.VITE_LEMONSQUEEZY_BILLING_URL ||
      "",
  };
}

// The checkout link carries the buyer's uid, which Lemon Squeezy echoes back
// in the webhook. A buyer can edit the link, so the uid is signed: only a uid
// with a valid signature is trusted to pick the account.
function checkoutSigningKey() {
  const { webhookSecret } = getLemonSqueezyConfig();
  return webhookSecret ? `askio-checkout-uid:${webhookSecret}` : "";
}

export function signCheckoutUid(uid) {
  const key = checkoutSigningKey();
  return key ? crypto.createHmac("sha256", key).update(String(uid)).digest("hex") : "";
}

export function isSignedCheckoutUid(uid, signature) {
  const expected = signCheckoutUid(uid);
  if (!expected || typeof signature !== "string" || signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function buildCheckoutUrl({ checkoutUrl, email, name, uid }) {
  if (!checkoutUrl) {
    throw new Error("LEMONSQUEEZY_PRO_CHECKOUT_URL is not configured.");
  }

  const url = new URL(checkoutUrl);

  if (email) {
    url.searchParams.set("checkout[email]", email);
  }

  if (name) {
    url.searchParams.set("checkout[name]", name);
  }

  if (uid) {
    url.searchParams.set("checkout[custom][uid]", uid);
    const signature = signCheckoutUid(uid);
    if (signature) url.searchParams.set("checkout[custom][uid_sig]", signature);
  }

  return url.toString();
}

export function verifyWebhookSignature(rawBody, signature, secret) {
  const digest = Buffer.from(
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
    "utf8"
  );
  const receivedSignature = Buffer.from(signature || "", "utf8");

  if (digest.length !== receivedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, receivedSignature);
}

export async function lemonRequest(path, options = {}) {
  const { apiKey } = getLemonSqueezyConfig();

  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is not configured.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.errors?.[0]?.detail ||
      payload?.errors?.[0]?.title ||
      "Lemon Squeezy API request failed.";
    throw new Error(message);
  }

  return payload;
}

/** Lemon Squeezy ids are numeric; anything else is refused before it reaches a URL path. */
export function lemonId(value) {
  const id = String(value ?? "");
  return /^[0-9]{1,20}$/.test(id) ? id : null;
}

/**
 * The account's subscription, fetched with the store key, only if it belongs
 * to the customer the webhook recorded for this account. Returns null for a
 * missing, malformed or mismatched id.
 */
export async function ownedSubscription(userData) {
  const subscriptionId = lemonId(userData.lemonSqueezySubscriptionId);
  if (!subscriptionId) return null;
  const response = await lemonRequest(`/subscriptions/${subscriptionId}`);
  const subscription = response?.data;
  const customerId = lemonId(userData.lemonSqueezyCustomerId);
  if (!subscription || (customerId && String(subscription.attributes?.customer_id) !== customerId)) return null;
  return subscription;
}
