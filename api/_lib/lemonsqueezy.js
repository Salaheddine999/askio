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
    billingUrl:
      process.env.LEMONSQUEEZY_BILLING_URL ||
      process.env.VITE_LEMONSQUEEZY_BILLING_URL ||
      "",
  };
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
