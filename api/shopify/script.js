export default function handler(req, res) {
  const chatbotId = req.query.id;

  if (!chatbotId) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.status(200).send('// Askio: No chatbot ID provided');
  }

  const origin = 'https://askio.vercel.app';

  const script = `
(function() {
  if (document.getElementById('chatbot-container')) return;

  var container = document.createElement('div');
  container.id = 'chatbot-container';
  document.body.appendChild(container);

  var embedScript = document.createElement('script');
  embedScript.src = '${origin}/chatbot-embed.js';
  embedScript.onload = function() {
    if (window.ChatbotEmbed) {
      ChatbotEmbed.init('${chatbotId}', '${origin}');
    }
  };
  document.body.appendChild(embedScript);
})();
`;

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(script);
}
