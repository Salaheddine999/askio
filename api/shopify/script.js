import { withMonitoring } from "../_lib/monitoring.js";
function handler(req, res) {
  const chatbotId = req.query.id;

  if (!chatbotId) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.status(200).send('// Askio: No chatbot ID provided');
  }

  // The site's final address: the old askio.vercel.app redirects here, and
  // the widget only hears messages sent to the address it really loads from.
  const origin = 'https://www.getaskio.xyz';
  const id = String(chatbotId).replace(/[^A-Za-z0-9_-]/g, '');

  const script = `
(function() {
  var embedScript = document.createElement('script');
  embedScript.src = '${origin}/chatbot-embed.js';
  embedScript.async = true;
  embedScript.setAttribute('data-chatbot', '${id}');
  document.body.appendChild(embedScript);
})();
`;

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(script);
}

export default withMonitoring("shopify/script", handler);
