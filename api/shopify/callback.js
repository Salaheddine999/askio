const crypto = require('crypto');

module.exports = async (req, res) => {
  const { shop, code, state, hmac } = req.query;

  if (!shop || !code || !state || !hmac) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Shopify credentials not configured' });
  }

  // Verify HMAC
  const queryParams = { ...req.query };
  delete queryParams.hmac;
  const sortedParams = Object.keys(queryParams)
    .sort()
    .map((key) => `${key}=${queryParams[key]}`)
    .join('&');
  const generatedHmac = crypto
    .createHmac('sha256', apiSecret)
    .update(sortedParams)
    .digest('hex');

  if (generatedHmac !== hmac) {
    return res.status(401).json({ error: 'HMAC validation failed' });
  }

  // Decode chatbotId from state
  let chatbotId;
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    chatbotId = stateData.chatbotId;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  if (!chatbotId) {
    return res.status(400).json({ error: 'No chatbot ID found in state' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.status(500).json({ error: 'Failed to exchange authorization code' });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // First, check for existing Askio script tags and remove them
    const existingScriptsResponse = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (existingScriptsResponse.ok) {
      const existingScripts = await existingScriptsResponse.json();
      for (const script of existingScripts.script_tags) {
        if (script.src && script.src.includes('askio.vercel.app')) {
          await fetch(`https://${shop}/admin/api/2024-01/script_tags/${script.id}.json`, {
            method: 'DELETE',
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
          });
        }
      }
    }

    // Create new ScriptTag
    const scriptTagSrc = `https://askio.vercel.app/api/shopify/script.js?id=${chatbotId}`;
    const scriptTagResponse = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script_tag: {
          event: 'onload',
          src: scriptTagSrc,
        },
      }),
    });

    if (!scriptTagResponse.ok) {
      const errorText = await scriptTagResponse.text();
      console.error('ScriptTag creation failed:', errorText);
      return res.status(500).json({ error: 'Failed to install chatbot script' });
    }

    // Success — redirect to Shopify admin with success indicator
    res.redirect(302, `https://${shop}/admin/apps?notification=askio-installed`);
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ error: 'Internal server error during installation' });
  }
};
