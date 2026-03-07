import crypto from 'crypto';

export default function handler(req, res) {
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

    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      return res.status(400).json({ error: 'Invalid shop URL format. Use: yourstore.myshopify.com' });
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Shopify API key not configured. Add SHOPIFY_API_KEY to Vercel environment variables.' });
    }

    const scopes = 'write_script_tags,read_script_tags';
    const redirectUri = 'https://askio.vercel.app/api/shopify/callback';

    const nonce = crypto.randomBytes(16).toString('hex');
    const stateObj = JSON.stringify({ nonce, chatbotId });
    const state = Buffer.from(stateObj).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const installUrl = 'https://' + shop + '/admin/oauth/authorize' +
      '?client_id=' + apiKey +
      '&scope=' + scopes +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&state=' + state;

    res.redirect(302, installUrl);
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
