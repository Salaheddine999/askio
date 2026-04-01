import { requireUser } from "../_lib/auth.js";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { getLemonSqueezyConfig, lemonRequest } from "../_lib/lemonsqueezy.js";
import { sendError } from "../_lib/response.js";

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
    const subscriptionId = userData.lemonSqueezySubscriptionId;

    if (!subscriptionId) {
      return res.status(200).json({
        url: billingUrl || null,
      });
    }

    const subscriptionResponse = await lemonRequest(`/subscriptions/${subscriptionId}`);
    const portalUrl =
      subscriptionResponse?.data?.attributes?.urls?.customer_portal || billingUrl || null;

    return res.status(200).json({ url: portalUrl });
  } catch (error) {
    console.error("Failed to create Lemon Squeezy customer portal URL:", error);
    return sendError(res, error);
  }
}
