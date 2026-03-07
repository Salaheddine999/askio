const crypto = require('crypto');

module.exports = (req, res) => {
  const { shop, chatbotId } = req.query;

  if (!shop || !chatbotId) {
    return res.status(400).json({ error: 'Missing required parameters: shop and chatbotId' });
  }

  // Validate shop format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).json({ error: 'Invalid shop URL format. Use: yourstore.myshopify.com' });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Shopify API key not configured' });
  }

  const scopes = 'write_script_tags,read_script_tags';
  const redirectUri = `https://askio.vercel.app/api/shopify/callback`;

  // Encode chatbotId in the state parameter so we can retrieve it in the callback
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = Buffer.from(JSON.stringify({ nonce, chatbotId })).toString('base64url');

  const installUrl = `https://${shop}/admin/oauth/authorize` +
    `?client_id=${apiKey}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  res.redirect(302, installUrl);
};
