import crypto from 'crypto';

export default function handler(req, res) {
  try {
    const { shop, chatbotId } = req.query;

    if (!shop || !chatbotId) {
      return res.status(400).json({ error: 'Missing required parameters: shop and chatbotId' });
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
