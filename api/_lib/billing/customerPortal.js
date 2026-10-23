import { requireUser } from "../auth.js";
import { adminDb } from "../firebaseAdmin.js";
import { getLemonSqueezyConfig, lemonRequest } from "../lemonsqueezy.js";
import { sendError } from "../response.js";

// Lemon Squeezy's own page where customers sign in by email to see their orders
// and subscriptions. Used when we can't get a signed portal link.
const MY_ORDERS_URL = "https://app.lemonsqueezy.com/my-orders";

async function portalUrlFrom(path) {
  try {
    const response = await lemonRequest(path);
    return response?.data?.attributes?.urls?.customer_portal || null;
  } catch (error) {
    console.warn(`Lemon Squeezy lookup ${path} failed:`, error.message);
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
      (userData.lemonSqueezySubscriptionId &&
        (await portalUrlFrom(`/subscriptions/${userData.lemonSqueezySubscriptionId}`))) ||
      (userData.lemonSqueezyCustomerId &&
        (await portalUrlFrom(`/customers/${userData.lemonSqueezyCustomerId}`))) ||
      userData.lemonSqueezyCustomerPortalUrl ||
      billingUrl ||
      MY_ORDERS_URL;

    return res.status(200).json({ url });
  } catch (error) {
    console.error("Failed to create Lemon Squeezy customer portal URL:", error);
    return sendError(res, error);
  }
}
