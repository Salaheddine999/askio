import crypto from "node:crypto";
import { requireUser } from "../auth.js";
import { adminDb } from "../firebaseAdmin.js";
import { getOwnedChatbot } from "../plan.js";
import { takeRateLimit } from "../rateLimit.js";
import { sendError } from "../response.js";
import { emailConfigured, sendEmail } from "../email/send.js";
import { escapeHtml } from "../email/templates.js";

// POST /api/account/install-email { chatbotId, email }: send the install
// code and steps to whoever builds the owner's website. The text is fixed
// (no message of the owner's own), replies go to the owner, and an account
// can send a few a day, so it can't be used to send anything else.

const DAY_MS = 86_400_000;
const PER_DAY = 5;
const PER_RECIPIENT_PER_DAY = 2;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const CHATBOT_ID = /^[A-Za-z0-9_-]{1,128}$/;
const ORIGIN = "https://www.getaskio.xyz";

const STRINGS = {
  en: {
    subject: "Please add the {bot} chat to our website",
    heading: "Please add this chat to the website",
    intro: "{owner} uses Askio for the website's chat. Paste this one line into every page, just before </body>. It loads after the page, so it won't slow the site down.",
    codeLabel: "The code",
    platformsLabel: "Where it goes",
    platforms: [
      "Shopify: Online Store → Themes → Edit code → theme.liquid, before </body>",
      "WordPress: a footer code plugin such as WPCode, or the Askio plugin",
      "Wix: Settings → Custom code → Add custom code, All pages, Body - end",
      "Squarespace: Code Injection → Footer",
      "Webflow: Site settings → Custom code → Footer code, then publish",
      "Google Tag Manager: a Custom HTML tag on All Pages",
    ],
    reply: "Questions? Reply to this email to reach {owner}.",
  },
  fr: {
    subject: "Merci d'ajouter le chat {bot} à notre site",
    heading: "Merci d'ajouter ce chat au site",
    intro: "{owner} utilise Askio pour le chat du site. Collez cette ligne sur toutes les pages, juste avant </body>. Elle se charge après la page, donc elle ne ralentit pas le site.",
    codeLabel: "Le code",
    platformsLabel: "Où le mettre",
    platforms: [
      "Shopify : Online Store → Themes → Edit code → theme.liquid, avant </body>",
      "WordPress : une extension de code de pied de page comme WPCode, ou l'extension Askio",
      "Wix : Settings → Custom code → Add custom code, All pages, Body - end",
      "Squarespace : Code Injection → Footer",
      "Webflow : Site settings → Custom code → Footer code, puis publier",
      "Google Tag Manager : une balise HTML personnalisée sur All Pages",
    ],
    reply: "Des questions ? Répondez à cet e-mail pour joindre {owner}.",
  },
  nl: {
    subject: "Wil je de {bot}-chat aan onze website toevoegen?",
    heading: "Wil je deze chat aan de website toevoegen?",
    intro: "{owner} gebruikt Askio voor de chat op de website. Plak deze ene regel op elke pagina, vlak voor </body>. Hij laadt na de pagina, dus de site wordt er niet trager van.",
    codeLabel: "De code",
    platformsLabel: "Waar hij komt",
    platforms: [
      "Shopify: Online Store → Themes → Edit code → theme.liquid, vóór </body>",
      "WordPress: een footer-code-plugin zoals WPCode, of de Askio-plugin",
      "Wix: Settings → Custom code → Add custom code, All pages, Body - end",
      "Squarespace: Code Injection → Footer",
      "Webflow: Site settings → Custom code → Footer code, daarna publiceren",
      "Google Tag Manager: een Aangepaste HTML-tag op All Pages",
    ],
    reply: "Vragen? Beantwoord deze e-mail om {owner} te bereiken.",
  },
  de: {
    subject: "Bitte den {bot}-Chat auf unserer Website einbauen",
    heading: "Bitte diesen Chat auf der Website einbauen",
    intro: "{owner} nutzt Askio für den Chat auf der Website. Fügen Sie diese eine Zeile auf jeder Seite ein, direkt vor </body>. Sie lädt nach der Seite und bremst die Website nicht aus.",
    codeLabel: "Der Code",
    platformsLabel: "Wohin er gehört",
    platforms: [
      "Shopify: Online Store → Themes → Edit code → theme.liquid, vor </body>",
      "WordPress: ein Footer-Code-Plugin wie WPCode oder das Askio-Plugin",
      "Wix: Settings → Custom code → Add custom code, All pages, Body - end",
      "Squarespace: Code Injection → Footer",
      "Webflow: Site settings → Custom code → Footer code, dann veröffentlichen",
      "Google Tag Manager: ein Benutzerdefiniertes-HTML-Tag auf All Pages",
    ],
    reply: "Fragen? Antworten Sie auf diese E-Mail, um {owner} zu erreichen.",
  },
  es: {
    subject: "Por favor, añade el chat de {bot} a nuestra web",
    heading: "Por favor, añade este chat a la web",
    intro: "{owner} usa Askio para el chat de la web. Pega esta línea en todas las páginas, justo antes de </body>. Se carga después de la página, así que no ralentiza la web.",
    codeLabel: "El código",
    platformsLabel: "Dónde va",
    platforms: [
      "Shopify: Online Store → Themes → Edit code → theme.liquid, antes de </body>",
      "WordPress: un plugin de código para el pie como WPCode, o el plugin de Askio",
      "Wix: Settings → Custom code → Add custom code, All pages, Body - end",
      "Squarespace: Code Injection → Footer",
      "Webflow: Site settings → Custom code → Footer code, y publicar",
      "Google Tag Manager: una etiqueta HTML personalizada en All Pages",
    ],
    reply: "¿Dudas? Responde a este correo para hablar con {owner}.",
  },
};

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));

export function installEmail({ lang, bot, owner, code }) {
  const s = STRINGS[lang] || STRINGS.en;
  const vars = { bot: bot || "Askio", owner };
  const subject = fill(s.subject, vars);
  const intro = fill(s.intro, vars);
  const reply = fill(s.reply, vars);
  const html = `<!doctype html><html><body style="margin:0;background:#F3F7FC;padding:24px 12px;font:15px/1.5 Arial,sans-serif;color:#101723">
  <div style="max-width:560px;margin:0 auto;background:#F9FCFF;border:1px solid #D8DFE9;border-radius:12px;padding:28px">
    <div style="font:700 18px/1.3 Arial,sans-serif">${escapeHtml(s.heading)}</div>
    <p style="margin:8px 0 18px;color:#566273">${escapeHtml(intro)}</p>
    <div style="font:600 12px/1.4 Arial,sans-serif;color:#647184;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(s.codeLabel)}</div>
    <pre style="margin:6px 0 18px;padding:12px 14px;background:#101723;color:#E7EDF6;border-radius:8px;font:13px/1.5 Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-all">${escapeHtml(code)}</pre>
    <div style="font:600 12px/1.4 Arial,sans-serif;color:#647184;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(s.platformsLabel)}</div>
    <ul style="margin:6px 0 18px;padding-left:18px;color:#3B4656">${s.platforms.map((p) => `<li style="margin:3px 0">${escapeHtml(p)}</li>`).join("")}</ul>
    <p style="margin:0;color:#647184;font-size:13px">${escapeHtml(reply)}</p>
  </div>
</body></html>`;
  const text = [s.heading, "", intro, "", `${s.codeLabel}:`, code, "", `${s.platformsLabel}:`, ...s.platforms.map((p) => `- ${p}`), "", reply].join("\n");
  return { subject, html, text };
}

export default async function sendInstallEmail(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const decoded = await requireUser(req);
    const { chatbotId, email } = req.body || {};
    const to = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (typeof chatbotId !== "string" || !CHATBOT_ID.test(chatbotId)) {
      return res.status(400).json({ error: "Invalid chatbot." });
    }
    if (!EMAIL.test(to) || to.length > 254) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (!emailConfigured()) {
      return res.status(503).json({ error: "Email isn't set up yet. Copy the code and send it yourself for now." });
    }
    await getOwnedChatbot(decoded.uid, chatbotId);
    if (!(await takeRateLimit(`install_email_${decoded.uid}`, PER_DAY, DAY_MS))) {
      return res.status(429).json({ error: "You've sent a few already today. Try again tomorrow." });
    }
    // One address gets at most a couple a day, from all accounts together.
    const recipientKey = crypto.createHash("sha256").update(to).digest("hex").slice(0, 32);
    if (!(await takeRateLimit(`install_email_to_${recipientKey}`, PER_RECIPIENT_PER_DAY, DAY_MS))) {
      return res.status(429).json({ error: "That address already got the code today. Try again tomorrow." });
    }
    const user = (await adminDb.collection("users").doc(decoded.uid).get()).data() || {};
    if (user.suspended === true) return res.status(403).json({ error: "This account is suspended." });
    // Only fixed text and the signed-in account's own address: no names or
    // titles the owner typed, so the email can't carry a message of theirs.
    const ownerEmail = String(decoded.email || "").toLowerCase();
    const owner = ownerEmail || "The site owner";
    const code = `<script src="${ORIGIN}/chatbot-embed.js" data-chatbot="${chatbotId}" async></script>`;
    const message = installEmail({ lang: user.language || "en", bot: "Askio", owner, code });
    await sendEmail({ to, ...message, ...(ownerEmail ? { replyTo: ownerEmail } : {}) });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Couldn't send the install email:", error.message);
    return sendError(res, error);
  }
}
