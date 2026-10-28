/**
 * The one line an owner pastes into their site. It loads without holding up
 * the page, and starts the widget once the page has loaded.
 */
export function embedCodeFor(chatbotId: string, origin = window.location.origin) {
  return `<script src="${origin}/chatbot-embed.js" data-chatbot="${chatbotId}" async></script>`;
}
