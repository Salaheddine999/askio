// The emails Askio sends to chatbot owners, in their account language.
// Everything a visitor typed is escaped before it goes into the HTML.

const STRINGS = {
  en: {
    pushLiveTitle: "A visitor wants to talk to you",
    pushLiveBody: "Someone on {bot} is waiting. Tap to reply.",
    leadSubject: "New lead from {bot}: {email}",
    leadHeading: "A visitor left their email",
    leadIntro: "Someone chatting with {bot} would like you to get back to them.",
    missedSubject: "You missed a live chat on {bot}",
    missedHeading: "A visitor asked to talk to you",
    missedIntro: "Someone chatting with {bot} asked for a person, but nobody answered within 2 minutes.",
    emailLabel: "Email",
    askedLabel: "What they asked",
    openAnalytics: "Open Analytics",
    openConversations: "Open Conversations",
    footer: "You get this email because alerts are on for your Askio account.",
    unsubscribe: "Turn off these emails",
    settings: "Email settings",
    unsubscribedTitle: "You're unsubscribed",
    unsubscribedBody: "You won't get these emails anymore. You can turn them back on in your Askio settings.",
    invalidTitle: "This link doesn't work",
    invalidBody: "It may be incomplete. You can change your email alerts in your Askio settings.",
  },
  fr: {
    pushLiveTitle: "Un visiteur souhaite vous parler",
    pushLiveBody: "Quelqu'un sur {bot} attend. Touchez pour répondre.",
    leadSubject: "Nouveau lead via {bot} : {email}",
    leadHeading: "Un visiteur a laissé son e-mail",
    leadIntro: "Une personne qui discutait avec {bot} aimerait que vous la recontactiez.",
    missedSubject: "Vous avez manqué un chat en direct sur {bot}",
    missedHeading: "Un visiteur a demandé à vous parler",
    missedIntro: "Une personne qui discutait avec {bot} a demandé à parler à quelqu'un, mais personne n'a répondu sous 2 minutes.",
    emailLabel: "E-mail",
    askedLabel: "Ce qu'il a demandé",
    openAnalytics: "Ouvrir les statistiques",
    openConversations: "Ouvrir Conversations",
    footer: "Vous recevez cet e-mail car les alertes sont activées sur votre compte Askio.",
    unsubscribe: "Ne plus recevoir ces e-mails",
    settings: "Paramètres des e-mails",
    unsubscribedTitle: "Vous êtes désabonné",
    unsubscribedBody: "Vous ne recevrez plus ces e-mails. Vous pouvez les réactiver dans les paramètres d'Askio.",
    invalidTitle: "Ce lien ne fonctionne pas",
    invalidBody: "Il est peut-être incomplet. Vous pouvez modifier vos alertes dans les paramètres d'Askio.",
  },
  nl: {
    pushLiveTitle: "Een bezoeker wil je spreken",
    pushLiveBody: "Iemand op {bot} wacht. Tik om te antwoorden.",
    leadSubject: "Nieuwe lead via {bot}: {email}",
    leadHeading: "Een bezoeker heeft zijn e-mail achtergelaten",
    leadIntro: "Iemand die met {bot} chatte, wil graag dat je contact opneemt.",
    missedSubject: "Je hebt een livechat gemist op {bot}",
    missedHeading: "Een bezoeker wilde je spreken",
    missedIntro: "Iemand die met {bot} chatte, vroeg om een medewerker, maar niemand antwoordde binnen 2 minuten.",
    emailLabel: "E-mail",
    askedLabel: "Wat ze vroegen",
    openAnalytics: "Statistieken openen",
    openConversations: "Gesprekken openen",
    footer: "Je krijgt deze e-mail omdat meldingen aanstaan voor je Askio-account.",
    unsubscribe: "Deze e-mails uitzetten",
    settings: "E-mailinstellingen",
    unsubscribedTitle: "Je bent afgemeld",
    unsubscribedBody: "Je krijgt deze e-mails niet meer. Je kunt ze weer aanzetten in je Askio-instellingen.",
    invalidTitle: "Deze link werkt niet",
    invalidBody: "Misschien is hij onvolledig. Je kunt je e-mailmeldingen wijzigen in je Askio-instellingen.",
  },
  de: {
    pushLiveTitle: "Ein Besucher möchte mit Ihnen sprechen",
    pushLiveBody: "Jemand auf {bot} wartet. Tippen, um zu antworten.",
    leadSubject: "Neuer Lead über {bot}: {email}",
    leadHeading: "Ein Besucher hat seine E-Mail hinterlassen",
    leadIntro: "Jemand, der mit {bot} gechattet hat, möchte, dass Sie sich melden.",
    missedSubject: "Sie haben einen Live-Chat auf {bot} verpasst",
    missedHeading: "Ein Besucher wollte mit Ihnen sprechen",
    missedIntro: "Jemand, der mit {bot} gechattet hat, wollte mit einer Person sprechen, aber niemand hat innerhalb von 2 Minuten geantwortet.",
    emailLabel: "E-Mail",
    askedLabel: "Was gefragt wurde",
    openAnalytics: "Statistiken öffnen",
    openConversations: "Gespräche öffnen",
    footer: "Sie erhalten diese E-Mail, weil Benachrichtigungen für Ihr Askio-Konto aktiviert sind.",
    unsubscribe: "Diese E-Mails abbestellen",
    settings: "E-Mail-Einstellungen",
    unsubscribedTitle: "Sie sind abgemeldet",
    unsubscribedBody: "Sie erhalten diese E-Mails nicht mehr. Sie können sie in Ihren Askio-Einstellungen wieder aktivieren.",
    invalidTitle: "Dieser Link funktioniert nicht",
    invalidBody: "Er ist vielleicht unvollständig. Sie können Ihre E-Mail-Benachrichtigungen in den Askio-Einstellungen ändern.",
  },
  es: {
    pushLiveTitle: "Un visitante quiere hablar contigo",
    pushLiveBody: "Alguien en {bot} está esperando. Toca para responder.",
    leadSubject: "Nuevo lead desde {bot}: {email}",
    leadHeading: "Un visitante dejó su correo",
    leadIntro: "Alguien que chateaba con {bot} quiere que te pongas en contacto.",
    missedSubject: "Te perdiste un chat en vivo en {bot}",
    missedHeading: "Un visitante pidió hablar contigo",
    missedIntro: "Alguien que chateaba con {bot} pidió hablar con una persona, pero nadie respondió en 2 minutos.",
    emailLabel: "Correo",
    askedLabel: "Lo que preguntó",
    openAnalytics: "Abrir estadísticas",
    openConversations: "Abrir Conversaciones",
    footer: "Recibes este correo porque las alertas están activadas en tu cuenta de Askio.",
    unsubscribe: "Dejar de recibir estos correos",
    settings: "Ajustes de correo",
    unsubscribedTitle: "Te has dado de baja",
    unsubscribedBody: "Ya no recibirás estos correos. Puedes volver a activarlos en los ajustes de Askio.",
    invalidTitle: "Este enlace no funciona",
    invalidBody: "Puede que esté incompleto. Puedes cambiar tus alertas en los ajustes de Askio.",
  },
};

export function stringsFor(lang) {
  return STRINGS[lang] || STRINGS.en;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));

/** One alert email, as HTML and plain text. `rows` are label/value pairs. */
function alertEmail({ s, subject, heading, intro, rows, cta, ctaUrl, settingsUrl, unsubscribe }) {
  const rowHtml = rows
    .map(
      ({ label, value }) => `
        <tr><td style="padding:12px 0 0;font:600 12px/1.4 Arial,sans-serif;color:#647184;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(label)}</td></tr>
        <tr><td style="padding:4px 0 0;font:15px/1.5 Arial,sans-serif;color:#101723;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
    )
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#F3F7FC;padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#F9FCFF;border:1px solid #D8DFE9;border-radius:12px">
      <tr><td style="padding:28px 28px 8px">
        <div style="font:700 18px/1.3 Arial,sans-serif;color:#101723">${escapeHtml(heading)}</div>
        <div style="padding-top:8px;font:15px/1.5 Arial,sans-serif;color:#566273">${escapeHtml(intro)}</div>
      </td></tr>
      <tr><td style="padding:0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowHtml}</table></td></tr>
      <tr><td style="padding:24px 28px 28px">
        <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#101723;color:#ffffff;text-decoration:none;font:600 14px/1 Arial,sans-serif;padding:12px 18px;border-radius:8px">${escapeHtml(cta)}</a>
      </td></tr>
    </table>
    <div style="max-width:520px;padding:16px 8px 0;font:12px/1.5 Arial,sans-serif;color:#87909D">
      ${escapeHtml(s.footer)}<br>
      <a href="${escapeHtml(unsubscribe)}" style="color:#647184">${escapeHtml(s.unsubscribe)}</a> ·
      <a href="${escapeHtml(settingsUrl)}" style="color:#647184">${escapeHtml(s.settings)}</a>
    </div>
  </td></tr></table>
</body></html>`;
  const text = [heading, "", intro, "", ...rows.flatMap(({ label, value }) => [`${label}:`, value, ""]), `${cta}: ${ctaUrl}`, "", s.footer, `${s.unsubscribe}: ${unsubscribe}`].join("\n");
  return { subject, html, text };
}

export function leadEmail({ lang, appUrl, unsubscribe, botName, leadEmail: email, asked = [] }) {
  const s = stringsFor(lang);
  const bot = botName || "Askio";
  return alertEmail({
    s,
    subject: fill(s.leadSubject, { bot, email }),
    heading: s.leadHeading,
    intro: fill(s.leadIntro, { bot }),
    rows: [{ label: s.emailLabel, value: email }, ...(asked.length ? [{ label: s.askedLabel, value: asked.join("\n") }] : [])],
    cta: s.openAnalytics,
    ctaUrl: `${appUrl}/analytics`,
    settingsUrl: `${appUrl}/settings#emails`,
    unsubscribe,
  });
}

export function missedChatEmail({ lang, appUrl, unsubscribe, botName, asked = [], conversationId }) {
  const s = stringsFor(lang);
  const bot = botName || "Askio";
  return alertEmail({
    s,
    subject: fill(s.missedSubject, { bot }),
    heading: s.missedHeading,
    intro: fill(s.missedIntro, { bot }),
    rows: asked.length ? [{ label: s.askedLabel, value: asked.join("\n") }] : [],
    cta: s.openConversations,
    ctaUrl: `${appUrl}/conversations${conversationId ? `?open=${encodeURIComponent(conversationId)}` : ""}`,
    settingsUrl: `${appUrl}/settings#emails`,
    unsubscribe,
  });
}

/** The small page an unsubscribe link opens. */
export function unsubscribePage({ lang, appUrl, ok }) {
  const s = stringsFor(lang);
  const title = ok ? s.unsubscribedTitle : s.invalidTitle;
  const body = ok ? s.unsubscribedBody : s.invalidBody;
  return `<!doctype html><html lang="${escapeHtml(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · Askio</title></head>
<body style="margin:0;background:#F3F7FC;font:15px/1.5 Arial,sans-serif;color:#101723;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;box-sizing:border-box">
  <main style="max-width:420px;background:#F9FCFF;border:1px solid #D8DFE9;border-radius:12px;padding:28px">
    <h1 style="margin:0 0 8px;font-size:20px">${escapeHtml(title)}</h1>
    <p style="margin:0 0 20px;color:#566273">${escapeHtml(body)}</p>
    <a href="${escapeHtml(appUrl)}/settings#emails" style="display:inline-block;background:#101723;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 16px;border-radius:8px">${escapeHtml(s.settings)}</a>
  </main>
</body></html>`;
}
