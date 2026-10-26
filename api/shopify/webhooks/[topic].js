import crypto from "node:crypto";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { readRawBody } from "../../_lib/rawBody.js";
import { withMonitoring } from "../../_lib/monitoring.js";

// The signature covers the exact bytes Shopify sent, so read the body raw.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Shopify signs each webhook with the app's secret: a base64 HMAC-SHA256 of
// the raw body in the X-Shopify-Hmac-Sha256 header.
function isSignedByShopify(rawBody, signature, secret) {
  if (!signature) return false;
  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("base64"), "utf8");
  const received = Buffer.from(String(signature), "utf8");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

// Shopify's mandatory privacy webhooks, served by one function to stay within
// Vercel's function limit:
//   /api/shopify/webhooks/customers-data-request
//   /api/shopify/webhooks/customers-redact
//   /api/shopify/webhooks/shop-redact
//
// Askio never stores data about a store's customers, so the customer requests
// only need acknowledging. shop-redact (sent 48 hours after uninstall) deletes
// the store's connection record.
async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error("Shopify webhook received but SHOPIFY_API_SECRET is not configured.");
    return res.status(500).json({ error: "Webhook secret is not configured." });
  }

  const rawBody = await readRawBody(req);
  if (!isSignedByShopify(rawBody, req.headers["x-shopify-hmac-sha256"], secret)) {
    return res.status(401).json({ error: "Invalid webhook signature." });
  }

  let body;
  try {
    body = JSON.parse(rawBody.toString("utf8") || "{}");
  } catch {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  const { topic } = req.query;

  if (topic === "customers-data-request" || topic === "customers-redact") {
    console.log(`Shopify ${topic} received for shop:`, body?.shop_domain);
    return res.status(200).json({ message: "Acknowledged. Askio does not store data about store customers." });
  }

  if (topic === "shop-redact") {
    const shopDomain = body?.shop_domain;
    if (typeof shopDomain === "string" && shopDomain) {
      try {
        await adminDb.collection("shopify_connections").doc(shopDomain.replace(/\./g, "_")).delete();
      } catch (error) {
        console.error("Shop redact cleanup failed:", error);
      }
    }
    return res.status(200).json({ message: "Shop data removed." });
  }

  return res.status(404).json({ error: "Unknown webhook topic." });
}

export default withMonitoring("shopify/webhooks", handler);
