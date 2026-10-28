import { reportError, withMonitoring } from "../_lib/monitoring.js";
import { SHOP_PATTERN, isSignedByShopify, parkInstall, readState } from "../_lib/shopify/install.js";

const INTEGRATIONS = "https://askio.vercel.app/integrations";

// Shopify sends the merchant here after they approve the app. The install
// itself finishes on the Integrations page, signed in as the owner who
// started it (see api/_lib/shopify/install.js).
async function handler(req, res) {
  try {
    const { shop, code, state } = req.query;
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: "Shopify isn't set up yet." });
    }
    if (typeof shop !== "string" || !SHOP_PATTERN.test(shop) || typeof code !== "string") {
      return res.status(400).json({ error: "Missing or invalid parameters." });
    }
    if (!isSignedByShopify(req.query, apiSecret)) {
      return res.status(401).json({ error: "This request didn't come from Shopify." });
    }
    const install = readState(state, apiSecret);
    if (!install) {
      return res.redirect(302, `${INTEGRATIONS}?shopify_error=expired`);
    }

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, code }),
    });
    if (!tokenResponse.ok) {
      console.error("Shopify token exchange failed:", (await tokenResponse.text()).slice(0, 300));
      return res.redirect(302, `${INTEGRATIONS}?shopify_error=token`);
    }
    const { access_token: accessToken } = await tokenResponse.json();

    const pending = await parkInstall({
      uid: install.uid,
      chatbotId: install.chatbotId,
      chatbotTitle: install.chatbotTitle || "Chatbot",
      shop,
      accessToken,
    });
    return res.redirect(302, `${INTEGRATIONS}?shopify_pending=${encodeURIComponent(pending)}`);
  } catch (error) {
    console.error("Shopify callback error:", error);
    reportError(error, { route: "shopify/callback" });
    return res.status(500).json({ error: "Something went wrong connecting Shopify. Please try again." });
  }
}

export default withMonitoring("shopify/callback", handler);
