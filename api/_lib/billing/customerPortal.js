import { requireUser } from "../auth.js";
import { adminDb } from "../firebaseAdmin.js";
import { getLemonSqueezyConfig, lemonId, lemonRequest, ownedSubscription } from "../lemonsqueezy.js";
import { sendError } from "../response.js";

// Lemon Squeezy's own page where customers sign in by email to see their orders
// and subscriptions. Used when we can't get a signed portal link.
const MY_ORDERS_URL = "https://app.lemonsqueezy.com/my-orders";

// A signed portal link only for this account's own subscription or customer.
async function ownPortalUrl(userData) {
  try {
    const subscription = await ownedSubscription(userData);
    if (subscription) return subscription.attributes?.urls?.customer_portal || null;
    const customerId = lemonId(userData.lemonSqueezyCustomerId);
    if (!customerId) return null;
    const response = await lemonRequest(`/customers/${customerId}`);
    return response?.data?.attributes?.urls?.customer_portal || null;
  } catch (error) {
    console.warn("Lemon Squeezy portal lookup failed:", error.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decodedToken = await requireUser(req);
    const userSnap = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userSnap.data() || {};
    const { billingUrl } = getLemonSqueezyConfig();

    // Signed portal links expire, so ask Lemon Squeezy for a fresh one first.
    const url =
      (await ownPortalUrl(userData)) ||
      userData.lemonSqueezyCustomerPortalUrl ||
      billingUrl ||
      MY_ORDERS_URL;

    return res.status(200).json({ url });
  } catch (error) {
    console.error("Failed to create Lemon Squeezy customer portal URL:", error);
    return sendError(res, error);
  }
}
