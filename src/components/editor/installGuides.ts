import type { Lang } from "../../i18n";

// Step-by-step install guides for the platforms small businesses use. Menu
// names are the platforms' own (in English), as owners see them there.

export type PlatformId = "html" | "shopify" | "wordpress" | "wix" | "squarespace" | "webflow" | "gtm";

export const PLATFORMS: { id: PlatformId; name: string }[] = [
  { id: "html", name: "" },
  { id: "shopify", name: "Shopify" },
  { id: "wordpress", name: "WordPress" },
  { id: "wix", name: "Wix" },
  { id: "squarespace", name: "Squarespace" },
  { id: "webflow", name: "Webflow" },
  { id: "gtm", name: "Google Tag Manager" },
];

type Guide = { steps: string[]; note?: string };

const GUIDES: Record<Lang, Record<PlatformId, Guide> & { otherSite: string }> = {
  en: {
    otherSite: "Any other site",
    html: {
      steps: [
        "Copy the code below.",
        "Paste it into your site's HTML, just before </body>, ideally in a footer or layout shared by every page.",
        "Publish your site. The chat button appears in the corner.",
      ],
    },
    shopify: {
      steps: [
        "Easiest: connect your store under Integrations → Shopify, and Askio adds itself.",
        "Or by hand: in Shopify, go to Online Store → Themes → … → Edit code.",
        "Open theme.liquid, paste the code just before </body>, and Save.",
      ],
    },
    wordpress: {
      steps: [
        "Easiest: download the Askio plugin under Integrations → WordPress.",
        "In WordPress, go to Plugins → Add New → Upload Plugin, choose the file and Activate.",
        "Open Settings → Askio Chatbot, paste your chatbot ID and Save.",
      ],
      note: "Or paste the code with a plugin like WPCode, in its Footer section.",
    },
    wix: {
      steps: [
        "In your site's dashboard, go to Settings → Custom code (under Advanced).",
        "Click + Add Custom Code and paste the code.",
        "Choose All pages, place it in Body - end, and Apply.",
      ],
      note: "Custom code needs a Wix Premium plan with a connected domain.",
    },
    squarespace: {
      steps: [
        "Open Code Injection: Settings → Advanced → Code Injection, or in newer versions Website → Pages → Custom code → Code Injection.",
        "Paste the code into the Footer box.",
        "Save.",
      ],
      note: "Code Injection needs a Core, Plus or Advanced plan (Business or Commerce on older plans).",
    },
    webflow: {
      steps: [
        "Open Site settings → Custom code.",
        "Paste the code into Footer code and Save.",
        "Publish your site.",
      ],
      note: "Custom code needs a paid Webflow site plan.",
    },
    gtm: {
      steps: [
        "In Tag Manager, go to Tags → New → Tag configuration → Custom HTML.",
        "Paste the code below (made for Tag Manager).",
        "Set the trigger to All Pages, Save, then Submit and Publish.",
      ],
    },
  },
  fr: {
    otherSite: "Autre site",
    html: {
      steps: [
        "Copiez le code ci-dessous.",
        "Collez-le dans le HTML de votre site, juste avant </body>, idéalement dans un pied de page ou une mise en page commune à toutes les pages.",
        "Publiez votre site. Le bouton de chat apparaît dans le coin.",
      ],
    },
    shopify: {
      steps: [
        "Le plus simple : connectez votre boutique dans Intégrations → Shopify, et Askio s'ajoute tout seul.",
        "Ou à la main : dans Shopify, allez dans Online Store → Themes → … → Edit code.",
        "Ouvrez theme.liquid, collez le code juste avant </body>, puis Save.",
      ],
    },
    wordpress: {
      steps: [
        "Le plus simple : téléchargez l'extension Askio dans Intégrations → WordPress.",
        "Dans WordPress, allez dans Extensions → Ajouter → Téléverser une extension, choisissez le fichier et activez-la.",
        "Ouvrez Réglages → Askio Chatbot, collez l'identifiant de votre chatbot et enregistrez.",
      ],
      note: "Vous pouvez aussi coller le code avec une extension comme WPCode, dans sa section Footer.",
    },
    wix: {
      steps: [
        "Dans le tableau de bord de votre site, allez dans Settings → Custom code (sous Advanced).",
        "Cliquez sur + Add Custom Code et collez le code.",
        "Choisissez All pages, placez-le dans Body - end, puis Apply.",
      ],
      note: "Le code personnalisé nécessite un forfait Wix Premium avec un domaine connecté.",
    },
    squarespace: {
      steps: [
        "Ouvrez Code Injection : Settings → Advanced → Code Injection, ou dans les versions récentes Website → Pages → Custom code → Code Injection.",
        "Collez le code dans le champ Footer.",
        "Enregistrez.",
      ],
      note: "Code Injection nécessite un forfait Core, Plus ou Advanced (Business ou Commerce sur les anciens forfaits).",
    },
    webflow: {
      steps: [
        "Ouvrez Site settings → Custom code.",
        "Collez le code dans Footer code et enregistrez.",
        "Publiez votre site.",
      ],
      note: "Le code personnalisé nécessite un forfait de site Webflow payant.",
    },
    gtm: {
      steps: [
        "Dans Tag Manager, allez dans Balises → Nouvelle → Configuration de la balise → HTML personnalisé.",
        "Collez le code ci-dessous (prévu pour Tag Manager).",
        "Choisissez le déclencheur All Pages, enregistrez, puis Envoyer et Publier.",
      ],
    },
  },
  nl: {
    otherSite: "Andere site",
    html: {
      steps: [
        "Kopieer de code hieronder.",
        "Plak hem in de HTML van je site, vlak voor </body>, het liefst in een footer of lay-out die elke pagina gebruikt.",
        "Publiceer je site. De chatknop verschijnt in de hoek.",
      ],
    },
    shopify: {
      steps: [
        "Het makkelijkst: koppel je winkel bij Integraties → Shopify, dan voegt Askio zichzelf toe.",
        "Of met de hand: ga in Shopify naar Online Store → Themes → … → Edit code.",
        "Open theme.liquid, plak de code vlak voor </body> en klik op Save.",
      ],
    },
    wordpress: {
      steps: [
        "Het makkelijkst: download de Askio-plugin bij Integraties → WordPress.",
        "Ga in WordPress naar Plugins → Nieuwe plugin → Plugin uploaden, kies het bestand en activeer hem.",
        "Open Instellingen → Askio Chatbot, plak je chatbot-ID en sla op.",
      ],
      note: "Of plak de code met een plugin als WPCode, in het Footer-gedeelte.",
    },
    wix: {
      steps: [
        "Ga in het dashboard van je site naar Settings → Custom code (onder Advanced).",
        "Klik op + Add Custom Code en plak de code.",
        "Kies All pages, zet hem in Body - end en klik op Apply.",
      ],
      note: "Eigen code werkt alleen met een Wix Premium-abonnement en een gekoppeld domein.",
    },
    squarespace: {
      steps: [
        "Open Code Injection: Settings → Advanced → Code Injection, of in nieuwere versies Website → Pages → Custom code → Code Injection.",
        "Plak de code in het vak Footer.",
        "Sla op.",
      ],
      note: "Code Injection vraagt een Core-, Plus- of Advanced-abonnement (Business of Commerce bij oudere abonnementen).",
    },
    webflow: {
      steps: [
        "Open Site settings → Custom code.",
        "Plak de code in Footer code en sla op.",
        "Publiceer je site.",
      ],
      note: "Eigen code vraagt een betaald Webflow-site-abonnement.",
    },
    gtm: {
      steps: [
        "Ga in Tag Manager naar Tags → Nieuw → Tagconfiguratie → Aangepaste HTML.",
        "Plak de code hieronder (gemaakt voor Tag Manager).",
        "Kies de trigger All Pages, sla op en klik dan op Verzenden en Publiceren.",
      ],
    },
  },
  de: {
    otherSite: "Andere Website",
    html: {
      steps: [
        "Kopieren Sie den Code unten.",
        "Fügen Sie ihn ins HTML Ihrer Website ein, direkt vor </body>, am besten in einer Fußzeile oder Vorlage für alle Seiten.",
        "Veröffentlichen Sie die Website. Die Chat-Schaltfläche erscheint in der Ecke.",
      ],
    },
    shopify: {
      steps: [
        "Am einfachsten: Verbinden Sie Ihren Shop unter Integrationen → Shopify, dann fügt Askio sich selbst hinzu.",
        "Oder von Hand: Gehen Sie in Shopify zu Online Store → Themes → … → Edit code.",
        "Öffnen Sie theme.liquid, fügen Sie den Code direkt vor </body> ein und klicken Sie auf Save.",
      ],
    },
    wordpress: {
      steps: [
        "Am einfachsten: Laden Sie das Askio-Plugin unter Integrationen → WordPress herunter.",
        "Gehen Sie in WordPress zu Plugins → Neues Plugin → Plugin hochladen, wählen Sie die Datei und aktivieren Sie es.",
        "Öffnen Sie Einstellungen → Askio Chatbot, fügen Sie Ihre Chatbot-ID ein und speichern Sie.",
      ],
      note: "Oder fügen Sie den Code mit einem Plugin wie WPCode im Footer-Bereich ein.",
    },
    wix: {
      steps: [
        "Gehen Sie im Dashboard Ihrer Website zu Settings → Custom code (unter Advanced).",
        "Klicken Sie auf + Add Custom Code und fügen Sie den Code ein.",
        "Wählen Sie All pages, platzieren Sie ihn in Body - end und klicken Sie auf Apply.",
      ],
      note: "Eigener Code braucht einen Wix-Premium-Tarif mit verbundener Domain.",
    },
    squarespace: {
      steps: [
        "Öffnen Sie Code Injection: Settings → Advanced → Code Injection, in neueren Versionen Website → Pages → Custom code → Code Injection.",
        "Fügen Sie den Code in das Feld Footer ein.",
        "Speichern Sie.",
      ],
      note: "Code Injection braucht einen Core-, Plus- oder Advanced-Tarif (Business oder Commerce bei älteren Tarifen).",
    },
    webflow: {
      steps: [
        "Öffnen Sie Site settings → Custom code.",
        "Fügen Sie den Code in Footer code ein und speichern Sie.",
        "Veröffentlichen Sie die Website.",
      ],
      note: "Eigener Code braucht einen kostenpflichtigen Webflow-Site-Tarif.",
    },
    gtm: {
      steps: [
        "Gehen Sie in Tag Manager zu Tags → Neu → Tag-Konfiguration → Benutzerdefiniertes HTML.",
        "Fügen Sie den Code unten ein (für Tag Manager gemacht).",
        "Wählen Sie den Trigger All Pages, speichern Sie, dann Senden und Veröffentlichen.",
      ],
    },
  },
  es: {
    otherSite: "Otra web",
    html: {
      steps: [
        "Copia el código de abajo.",
        "Pégalo en el HTML de tu web, justo antes de </body>, idealmente en un pie de página o plantilla común a todas las páginas.",
        "Publica tu web. El botón del chat aparece en la esquina.",
      ],
    },
    shopify: {
      steps: [
        "Lo más fácil: conecta tu tienda en Integraciones → Shopify y Askio se añade solo.",
        "O a mano: en Shopify, ve a Online Store → Themes → … → Edit code.",
        "Abre theme.liquid, pega el código justo antes de </body> y pulsa Save.",
      ],
    },
    wordpress: {
      steps: [
        "Lo más fácil: descarga el plugin de Askio en Integraciones → WordPress.",
        "En WordPress, ve a Plugins → Añadir nuevo → Subir plugin, elige el archivo y actívalo.",
        "Abre Ajustes → Askio Chatbot, pega el ID de tu chatbot y guarda.",
      ],
      note: "También puedes pegar el código con un plugin como WPCode, en su sección Footer.",
    },
    wix: {
      steps: [
        "En el panel de tu web, ve a Settings → Custom code (en Advanced).",
        "Pulsa + Add Custom Code y pega el código.",
        "Elige All pages, colócalo en Body - end y pulsa Apply.",
      ],
      note: "El código personalizado requiere un plan Wix Premium con dominio conectado.",
    },
    squarespace: {
      steps: [
        "Abre Code Injection: Settings → Advanced → Code Injection, o en versiones nuevas Website → Pages → Custom code → Code Injection.",
        "Pega el código en el cuadro Footer.",
        "Guarda.",
      ],
      note: "Code Injection requiere un plan Core, Plus o Advanced (Business o Commerce en planes antiguos).",
    },
    webflow: {
      steps: [
        "Abre Site settings → Custom code.",
        "Pega el código en Footer code y guarda.",
        "Publica tu web.",
      ],
      note: "El código personalizado requiere un plan de sitio de Webflow de pago.",
    },
    gtm: {
      steps: [
        "En Tag Manager, ve a Etiquetas → Nueva → Configuración de la etiqueta → HTML personalizado.",
        "Pega el código de abajo (hecho para Tag Manager).",
        "Elige el activador All Pages, guarda y luego Enviar y Publicar.",
      ],
    },
  },
};

export function guideFor(lang: Lang, platform: PlatformId): Guide {
  return (GUIDES[lang] || GUIDES.en)[platform];
}

export function otherSiteLabel(lang: Lang) {
  return (GUIDES[lang] || GUIDES.en).otherSite;
}

/** Tag Manager adds scripts itself, so this version builds the tag in code. */
export function tagManagerCodeFor(chatbotId: string, origin = window.location.origin) {
  return `<script>
  (function () {
    var s = document.createElement("script");
    s.src = "${origin}/chatbot-embed.js";
    s.async = true;
    s.setAttribute("data-chatbot", "${chatbotId}");
    document.body.appendChild(s);
  })();
</script>`;
}
