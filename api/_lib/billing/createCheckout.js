import { requireUser } from "../auth.js";
import { adminDb } from "../firebaseAdmin.js";
import { assertNotSuspended } from "../plan.js";
import { buildCheckoutUrl, getLemonSqueezyConfig } from "../lemonsqueezy.js";
import { sendError } from "../response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decodedToken = await requireUser(req);
    assertNotSuspended((await adminDb.collection("users").doc(decodedToken.uid).get()).data());
    const { proCheckoutUrl, proYearlyCheckoutUrl } = getLemonSqueezyConfig();
    const { email = decodedToken.email || "", name = "", interval = "monthly" } = req.body || {};
    const yearly = interval === "yearly";

    if (yearly && !proYearlyCheckoutUrl) {
      throw new Error("LEMONSQUEEZY_PRO_YEARLY_CHECKOUT_URL is not configured.");
    }

    const url = buildCheckoutUrl({
      checkoutUrl: yearly ? proYearlyCheckoutUrl : proCheckoutUrl,
      email,
      name,
      uid: decodedToken.uid,
    });

    return res.status(200).json({ url });
  } catch (error) {
    console.error("Failed to create Lemon Squeezy checkout URL:", error);
    return sendError(res, error);
  }
}
