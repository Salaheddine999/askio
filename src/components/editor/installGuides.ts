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
  pt: {
    otherSite: "Qualquer outro site",
    html: {
      steps: [
        "Copie o código abaixo.",
        "Cole-o no HTML do seu site, logo antes de </body>, de preferência em um rodapé ou layout compartilhado por todas as páginas.",
        "Publique seu site. O botão do chat aparece no canto.",
      ],
    },
    shopify: {
      steps: [
        "Mais fácil: conecte sua loja em Integrações → Shopify, e o Askio se adiciona sozinho.",
        "Ou manualmente: no Shopify, vá em Online Store → Themes → … → Edit code.",
        "Abra o theme.liquid, cole o código logo antes de </body> e clique em Save.",
      ],
    },
    wordpress: {
      steps: [
        "Mais fácil: baixe o plugin do Askio em Integrações → WordPress.",
        "No WordPress, vá em Plugins → Add New → Upload Plugin, escolha o arquivo e clique em Activate.",
        "Abra Settings → Askio Chatbot, cole o ID do seu chatbot e clique em Save.",
      ],
      note: "Ou cole o código com um plugin como o WPCode, na seção Footer.",
    },
    wix: {
      steps: [
        "No painel do seu site, vá em Settings → Custom code (em Advanced).",
        "Clique em + Add Custom Code e cole o código.",
        "Escolha All pages, posicione em Body - end e clique em Apply.",
      ],
      note: "O código personalizado exige um plano Wix Premium com domínio conectado.",
    },
    squarespace: {
      steps: [
        "Abra o Code Injection: Settings → Advanced → Code Injection ou, nas versões mais novas, Website → Pages → Custom code → Code Injection.",
        "Cole o código no campo Footer.",
        "Clique em Save.",
      ],
      note: "O Code Injection exige um plano Core, Plus ou Advanced (Business ou Commerce nos planos antigos).",
    },
    webflow: {
      steps: [
        "Abra Site settings → Custom code.",
        "Cole o código em Footer code e clique em Save.",
        "Publique seu site.",
      ],
      note: "O código personalizado exige um plano de site pago do Webflow.",
    },
    gtm: {
      steps: [
        "No Tag Manager, vá em Tags → New → Tag configuration → Custom HTML.",
        "Cole o código abaixo (feito para o Tag Manager).",
        "Defina o acionador como All Pages, clique em Save e depois em Submit e Publish.",
      ],
    },
  },
  it: {
    otherSite: "Qualsiasi altro sito",
    html: {
      steps: [
        "Copia il codice qui sotto.",
        "Incollalo nell'HTML del tuo sito, subito prima di </body>, idealmente in un footer o layout comune a tutte le pagine.",
        "Pubblica il sito. Il pulsante della chat compare nell'angolo.",
      ],
    },
    shopify: {
      steps: [
        "Il modo più semplice: collega il tuo negozio in Integrazioni → Shopify e Askio si aggiunge da solo.",
        "Oppure a mano: in Shopify, vai su Online Store → Themes → … → Edit code.",
        "Apri theme.liquid, incolla il codice subito prima di </body> e fai clic su Save.",
      ],
    },
    wordpress: {
      steps: [
        "Il modo più semplice: scarica il plugin di Askio in Integrazioni → WordPress.",
        "In WordPress, vai su Plugins → Add New → Upload Plugin, scegli il file e fai clic su Activate.",
        "Apri Settings → Askio Chatbot, incolla l'ID del tuo chatbot e fai clic su Save.",
      ],
      note: "Oppure incolla il codice con un plugin come WPCode, nella sua sezione Footer.",
    },
    wix: {
      steps: [
        "Nella dashboard del tuo sito, vai su Settings → Custom code (in Advanced).",
        "Fai clic su + Add Custom Code e incolla il codice.",
        "Scegli All pages, posizionalo in Body - end e fai clic su Apply.",
      ],
      note: "Il codice personalizzato richiede un piano Wix Premium con un dominio collegato.",
    },
    squarespace: {
      steps: [
        "Apri Code Injection: Settings → Advanced → Code Injection, oppure nelle versioni più recenti Website → Pages → Custom code → Code Injection.",
        "Incolla il codice nella casella Footer.",
        "Salva.",
      ],
      note: "Code Injection richiede un piano Core, Plus o Advanced (Business o Commerce nei piani precedenti).",
    },
    webflow: {
      steps: [
        "Apri Site settings → Custom code.",
        "Incolla il codice in Footer code e salva.",
        "Pubblica il sito.",
      ],
      note: "Il codice personalizzato richiede un piano Webflow a pagamento per il sito.",
    },
    gtm: {
      steps: [
        "In Tag Manager, vai su Tags → New → Tag configuration → Custom HTML.",
        "Incolla il codice qui sotto (pensato per Tag Manager).",
        "Imposta l'attivatore su All Pages, salva, poi fai clic su Submit e Publish.",
      ],
    },
  },
  ar: {
    otherSite: "أي موقع آخر",
    html: {
      steps: [
        "انسخ الكود أدناه.",
        "الصقه في HTML موقعك، مباشرةً قبل </body>، ويُفضّل في تذييل أو قالب مشترك بين كل الصفحات.",
        "انشر موقعك. يظهر زر الدردشة في الزاوية.",
      ],
    },
    shopify: {
      steps: [
        "الأسهل: اربط متجرك من التكاملات ← Shopify، وسيضيف Askio نفسه تلقائيًا.",
        "أو يدويًا: في Shopify، انتقل إلى «Online Store» ← «Themes» ← … ← «Edit code».",
        "افتح theme.liquid، والصق الكود مباشرةً قبل </body>، ثم انقر «Save».",
      ],
    },
    wordpress: {
      steps: [
        "الأسهل: نزّل إضافة Askio من التكاملات ← WordPress.",
        "في WordPress، انتقل إلى الإضافات ← أضف جديد ← رفع إضافة، واختر الملف ثم «تفعيل».",
        "افتح الإعدادات ← Askio Chatbot، والصق معرّف روبوت الدردشة ثم «حفظ».",
      ],
      note: "أو الصق الكود باستخدام إضافة مثل WPCode، في قسم التذييل (Footer).",
    },
    wix: {
      steps: [
        "في لوحة تحكم موقعك، انتقل إلى «Settings» ← «Custom code» (ضمن «Advanced»).",
        "انقر «+ Add Custom Code» والصق الكود.",
        "اختر «All pages»، وضعه في «Body - end»، ثم انقر «Apply».",
      ],
      note: "يتطلب الكود المخصص خطة Wix Premium مع نطاق مرتبط.",
    },
    squarespace: {
      steps: [
        "افتح «Code Injection»: «Settings» ← «Advanced» ← «Code Injection»، أو في الإصدارات الأحدث «Website» ← «Pages» ← «Custom code» ← «Code Injection».",
        "الصق الكود في مربع «Footer».",
        "انقر «Save».",
      ],
      note: "تتطلب ميزة «Code Injection» خطة Core أو Plus أو Advanced (أو Business أو Commerce في الخطط الأقدم).",
    },
    webflow: {
      steps: [
        "افتح «Site settings» ← «Custom code».",
        "الصق الكود في «Footer code» وانقر «Save».",
        "انشر موقعك.",
      ],
      note: "يتطلب الكود المخصص خطة موقع Webflow مدفوعة.",
    },
    gtm: {
      steps: [
        "في Tag Manager، انتقل إلى «Tags» ← «New» ← «Tag configuration» ← «Custom HTML».",
        "الصق الكود أدناه (المُعدّ لـ Tag Manager).",
        "اضبط المشغّل على «All Pages»، وانقر «Save»، ثم «Submit» و«Publish».",
      ],
    },
  },
  pl: {
    otherSite: "Dowolna inna strona",
    html: {
      steps: [
        "Skopiuj poniższy kod.",
        "Wklej go do kodu HTML strony, tuż przed </body>, najlepiej w stopce lub szablonie wspólnym dla wszystkich podstron.",
        "Opublikuj stronę. Przycisk czatu pojawi się w rogu.",
      ],
    },
    shopify: {
      steps: [
        "Najprościej: połącz sklep w Integracje → Shopify, a Askio doda się samo.",
        "Albo ręcznie: w Shopify przejdź do „Online Store” → „Themes” → „…” → „Edit code”.",
        "Otwórz theme.liquid, wklej kod tuż przed </body> i kliknij „Save”.",
      ],
    },
    wordpress: {
      steps: [
        "Najprościej: pobierz wtyczkę Askio w Integracje → WordPress.",
        "W WordPressie przejdź do Wtyczki → Dodaj wtyczkę → Wyślij wtyczkę na serwer, wybierz plik i kliknij Włącz.",
        "Otwórz Ustawienia → Askio Chatbot, wklej ID chatbota i zapisz.",
      ],
      note: "Możesz też wkleić kod za pomocą wtyczki, np. WPCode, w jej sekcji stopki.",
    },
    wix: {
      steps: [
        "W panelu strony przejdź do „Settings” → „Custom code” (w sekcji „Advanced”).",
        "Kliknij „+ Add Custom Code” i wklej kod.",
        "Wybierz „All pages”, umieść kod w „Body - end” i kliknij „Apply”.",
      ],
      note: "Własny kod wymaga planu Wix Premium z podłączoną domeną.",
    },
    squarespace: {
      steps: [
        "Otwórz „Code Injection”: „Settings” → „Advanced” → „Code Injection” albo w nowszych wersjach „Website” → „Pages” → „Custom code” → „Code Injection”.",
        "Wklej kod w pole „Footer”.",
        "Kliknij „Save”.",
      ],
      note: "„Code Injection” wymaga planu Core, Plus lub Advanced (w starszych planach: Business lub Commerce).",
    },
    webflow: {
      steps: [
        "Otwórz „Site settings” → „Custom code”.",
        "Wklej kod w pole „Footer code” i kliknij „Save”.",
        "Opublikuj stronę.",
      ],
      note: "Własny kod wymaga płatnego planu strony w Webflow.",
    },
    gtm: {
      steps: [
        "W Tag Managerze przejdź do „Tags” → „New” → „Tag configuration” → „Custom HTML”.",
        "Wklej poniższy kod (przygotowany dla Tag Managera).",
        "Ustaw regułę „All Pages”, kliknij „Save”, a potem „Submit” i „Publish”.",
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
