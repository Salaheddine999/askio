import { adminDb } from "../../_lib/firebaseAdmin.js";

// Shopify's mandatory privacy webhooks, served by one function to stay within
// Vercel's function limit:
//   /api/shopify/webhooks/customers-data-request
//   /api/shopify/webhooks/customers-redact
//   /api/shopify/webhooks/shop-redact
//
// Askio never stores data about a store's customers, so the customer requests
// only need acknowledging. shop-redact (sent 48 hours after uninstall) deletes
// the store's connection record.
export default async function handler(req, res) {
  const { topic } = req.query;

  if (topic === "customers-data-request" || topic === "customers-redact") {
    console.log(`Shopify ${topic} received for shop:`, req.body?.shop_domain);
    return res.status(200).json({ message: "Acknowledged. Askio does not store data about store customers." });
  }

  if (topic === "shop-redact") {
    const shopDomain = req.body?.shop_domain;
    if (shopDomain) {
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
