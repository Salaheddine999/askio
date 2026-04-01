import { requireUser } from "../_lib/auth.js";
import { buildCheckoutUrl, getLemonSqueezyConfig } from "../_lib/lemonsqueezy.js";
import { sendError } from "../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decodedToken = await requireUser(req);
    const { proCheckoutUrl } = getLemonSqueezyConfig();
    const { email = decodedToken.email || "", name = "" } = req.body || {};

    const url = buildCheckoutUrl({
      checkoutUrl: proCheckoutUrl,
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
