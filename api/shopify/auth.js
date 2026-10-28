import { reportError, withMonitoring } from "../_lib/monitoring.js";

function handler(req, res) {
  try {
    const { shop, chatbotId } = req.query;

    if (!shop || !chatbotId) {
      // When opened from Shopify admin (no chatbotId), show a friendly page
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Askio Chatbot</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f7f5f3; color: #37322f; }
              .card { text-align: center; padding: 40px; max-width: 420px; }
              h1 { font-size: 22px; margin-bottom: 8px; }
              p { color: #605a57; font-size: 14px; line-height: 1.6; }
              a { display: inline-block; margin-top: 16px; padding: 10px 24px; background: #37322f; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; }
              a:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Askio Chatbot is installed ✅</h1>
              <p>Your chatbot is active on your store. To change which chatbot is displayed or manage settings, visit the Askio dashboard.</p>
              <a href="https://askio.vercel.app/integrations" target="_top">Open Askio Dashboard</a>
            </div>
          </body>
        </html>
      `);
    }

    // Installs start signed in, from Integrations (POST /api/account/shopify-start),
    // so an install is always bound to the owner of the chatbot. Old links land there.
    res.redirect(302, 'https://askio.vercel.app/integrations?platform=shopify');
  } catch (err) {
    console.error('Auth error:', err);
    reportError(err, { route: "shopify/auth" });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withMonitoring("shopify/auth", handler);
