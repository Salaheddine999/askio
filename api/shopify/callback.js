import crypto from 'crypto';

export default async function handler(req, res) {
  try {
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
    const queryParams = Object.assign({}, req.query);
    delete queryParams.hmac;
    const sortedParams = Object.keys(queryParams)
      .sort()
      .map(function(key) { return key + '=' + queryParams[key]; })
      .join('&');
    const generatedHmac = crypto
      .createHmac('sha256', apiSecret)
      .update(sortedParams)
      .digest('hex');

    if (generatedHmac !== hmac) {
      return res.status(401).json({ error: 'HMAC validation failed' });
    }

    // Decode chatbotId from state (URL-safe base64)
    let chatbotId;
    try {
      let stateStr = state.replace(/-/g, '+').replace(/_/g, '/');
      const padding = stateStr.length % 4;
      if (padding) stateStr += '='.repeat(4 - padding);
      const stateData = JSON.parse(Buffer.from(stateStr, 'base64').toString());
      chatbotId = stateData.chatbotId;
      var chatbotTitle = stateData.chatbotTitle || 'Chatbot';
    } catch (e) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    if (!chatbotId) {
      return res.status(400).json({ error: 'No chatbot ID found in state' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://' + shop + '/admin/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.status(500).json({ error: 'Failed to exchange authorization code' });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Remove existing Askio script tags
    const existingScriptsResponse = await fetch('https://' + shop + '/admin/api/2025-01/script_tags.json', {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (existingScriptsResponse.ok) {
      const existingScripts = await existingScriptsResponse.json();
      for (let i = 0; i < existingScripts.script_tags.length; i++) {
        const script = existingScripts.script_tags[i];
        if (script.src && script.src.indexOf('askio.vercel.app') !== -1) {
          await fetch('https://' + shop + '/admin/api/2025-01/script_tags/' + script.id + '.json', {
            method: 'DELETE',
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
          });
        }
      }
    }

    // Create new ScriptTag
    const scriptTagSrc = 'https://askio.vercel.app/api/shopify/script.js?id=' + chatbotId;
    const scriptTagResponse = await fetch('https://' + shop + '/admin/api/2025-01/script_tags.json', {
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
      const errorText2 = await scriptTagResponse.text();
      console.error('ScriptTag creation failed:', errorText2);
      return res.status(500).json({ error: 'Failed to install chatbot script', shopifyError: errorText2 });
    }

    // Success — redirect to Askio with connection info
    const successUrl = 'https://askio.vercel.app/integrations' +
      '?shopify_connected=true' +
      '&shop=' + encodeURIComponent(shop) +
      '&chatbotId=' + encodeURIComponent(chatbotId) +
      '&chatbotTitle=' + encodeURIComponent(chatbotTitle);
    res.redirect(302, successUrl);
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
