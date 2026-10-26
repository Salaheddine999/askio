import type { Lang } from "..";

// The guides and troubleshooting answers on the documentation page, one copy
// per language with the same structure. Text can use a little markup, which
// the page renders:
//   {{Name}}       an editor field, tab or button name
//   **text**       bold
//   `text`         inline code
//   [label](/path) a link inside the app

export type GuideId = "create" | "faqs" | "appearance" | "ai" | "leads" | "install" | "improve" | "conversations" | "languages";

export interface GuideContent {
  title: string;
  summary: string;
  /** Extra words that should find this guide in search. */
  keywords: string;
  steps: string[];
  tip?: string;
  /** Label of the button next to the title, for guides that have one. */
  linkLabel?: string;
}

export interface DocsContent {
  guides: Record<GuideId, GuideContent>;
  faqs: { q: string; a: string }[];
}

export const docsContent: Record<Lang, DocsContent> = {
  en: {
    guides: {
      create: {
        title: "Create your first chatbot",
        summary: "Name it, write a welcome message and choose where it appears.",
        linkLabel: "Create a chatbot",
        keywords: "new name title basics conversation language welcome message placeholder position corner save create general guided setup start",
        steps: [
          "Click {{New chatbot}} at the top of the sidebar. The chatbot editor opens on the {{General}} tab.",
          "Under {{Basics}}, give it a {{Name}} (only you see this, in your dashboard) and a {{Title}}, which visitors see at the top of the chat.",
          "Under {{Conversation}}, choose the chat's {{Language}}, write the {{Welcome message}} visitors see when they open the chat, and set the {{Message box placeholder}}, the faint text in the box where they type.",
          "Under {{Position}}, click the tile for the corner of your site where the chat should sit, such as {{Bottom right}}.",
          "Click {{Create chatbot}} in the save bar. Your chatbot now appears on the dashboard. Later edits are saved with {{Save changes}}.",
        ],
        tip: "The preview on the right updates as you type, so you can see exactly what visitors will see. For your first chatbot you can also use the [guided setup](/start), which fills in the basics from your business name and suggests questions to start with.",
      },
      faqs: {
        title: "Add your FAQs",
        summary: "The questions and answers your chatbot replies with.",
        keywords: "faq questions answer add edit delete generate ai website url import",
        steps: [
          "Open the {{Questions}} tab in the chatbot editor.",
          "Click {{Add question}}, fill in the {{Question}} and the {{Answer}}, then click {{Add question}} below them. Repeat for each common question.",
          "Use the edit and delete buttons next to a question to change or remove it. Click {{Save changes}} to publish your questions.",
          "On Pro, click {{Generate with AI}}: paste your {{Website URL}} and Askio reads the page and drafts questions and answers for you to review. This needs {{Answer with AI}} turned on in the {{General}} tab.",
        ],
        tip: "Write questions the way visitors ask them (\"How long does delivery take?\"), not as headings. Askio matches similar wording, so one FAQ covers many phrasings.",
      },
      appearance: {
        title: "Match your brand",
        summary: "Launcher style, the greeting bubble and colours.",
        keywords: "appearance color colour solid gradient primary secondary presets brand launcher kio orb classic greeting bubble style",
        steps: [
          "Open the {{Appearance}} tab.",
          "Under {{Launcher}}, choose {{Classic}} (a chat bubble icon) or {{Kio}} (an orb in your colour whose eyes follow the visitor's pointer).",
          "Turn on {{Greeting bubble}} to show a short greeting beside the launcher a few seconds after someone arrives. Each visitor sees it once.",
          "Under {{Colors}}, keep {{Solid}} and choose a {{Primary}} colour (the header and the launcher) and a {{Secondary}} colour (your visitors' messages and the send button), or click one of the {{Presets}}.",
          "Switch to {{Gradient}} for a gradient, and set its {{Start}}, {{End}} and {{Angle}}.",
        ],
      },
      ai: {
        title: "AI replies and persona",
        summary: "Let AI answer what your FAQs don't cover.",
        keywords: "ai artificial intelligence answer with ai replies persona voice instructions tone personality limit pro gemini",
        steps: [
          "AI replies are part of the Pro plan. If you're on Free, click {{Upgrade to Pro}} in [Settings](/settings).",
          "In the {{General}} tab, under {{AI replies}}, turn on {{Answer with AI}}. Pro covers up to 10 chatbots with AI.",
          "Open the {{AI persona}} tab and pick a {{Voice}} for your chatbot, or edit the {{Instructions}} to write your own.",
          "Pro includes 3,000 AI replies a month across your chatbots. The dashboard shows how many you've used, and if you run out, your chatbots keep answering from your FAQs until the next month.",
        ],
        tip: "AI uses your FAQs as its source, so better FAQs mean better AI answers.",
      },
      leads: {
        title: "Capture leads and hand off to a person",
        summary: "Collect emails and offer a way to reach you.",
        keywords: "lead capture leads email contact can't answer fallback link to a human whatsapp contact page handoff support export",
        steps: [
          "In the {{General}} tab, go to {{When it can't answer}}. It decides what happens when a question isn't covered by your FAQs. The default, {{Suggest related questions}}, offers the closest questions from your FAQs.",
          "Choose {{Ask for their email}} to show visitors an email form, so you can follow up.",
          "Or choose {{Offer to talk to a human}} and fill in {{Link to a human}}: a WhatsApp link, a contact page or an email address. The chatbot then suggests related questions and adds a button that opens your link.",
          "Find collected emails under {{Leads}} on the [Analytics](/analytics) page, where you can also click {{Export CSV}}.",
        ],
        tip: "Mention in your website's privacy notice that you collect emails through the chatbot.",
      },
      install: {
        title: "Put it on your website",
        summary: "WordPress, Shopify, Wix or any site.",
        linkLabel: "Open Integrations",
        keywords: "install embed code website wordpress shopify wix webflow squarespace html script body",
        steps: [
          "Open [Integrations](/integrations) and pick the chatbot to install.",
          "Choose your platform: **WordPress** (install the plugin), **Shopify** (connect your store), **Wix** or **Any website** (paste the embed code).",
          "Paste the embed code (also in the editor's {{Install}} tab) just before the closing `</body>` tag, ideally in a shared footer or layout so it loads on every page.",
          "Reload your site. The launcher appears in the corner you chose. Changes you save in Askio show up automatically.",
        ],
      },
      improve: {
        title: "Track and improve",
        summary: "See what visitors ask and fill the gaps.",
        linkLabel: "Open Analytics",
        keywords: "analytics stats performance unanswered questions answer rate reports csv improve",
        steps: [
          "Open [Analytics](/analytics) to see questions answered, your answer rate, unanswered questions and leads.",
          "Check {{Couldn't answer}}: these are questions visitors asked that your chatbot had no answer for. Click {{Add answer}} to add one.",
          "Download raw data from the {{Reports}} tab on the dashboard.",
        ],
        tip: "A quick weekly look at unanswered questions is the fastest way to make your chatbot more useful.",
      },
      conversations: {
        title: "Read your conversations",
        summary: "See every chat visitors had with your chatbot.",
        linkLabel: "Open Conversations",
        keywords: "conversations chat history transcript messages saved read visitors pro privacy 90 days delete",
        steps: [
          "Open the chatbot editor and, in the {{General}} tab, turn on {{Save conversations}} under {{Conversation history}}. Click {{Save changes}}. This is part of Pro.",
          "From then on, each chat with that chatbot is saved. Visitors see a short notice in the chat that chats are saved.",
          "Open [Conversations](/conversations) in the sidebar. Pick a chat to read it, or filter by chatbot when you have several.",
          "Chats where the visitor left their email are marked, and the email is shown at the top so you can copy it.",
        ],
        tip: "Conversations are deleted automatically 90 days after the last message, and you can delete one yourself at any time. Mention saved chats in your own website's privacy notice.",
      },
      languages: {
        title: "Chat in your visitors' language",
        summary: "Pick each chatbot's language, and Askio's own.",
        keywords: "language languages french dutch german spanish english translate multilingual locale",
        steps: [
          "In the chatbot editor, open {{General}} and choose the chatbot's {{Language}} under {{Conversation}}. The chat's built-in text, like the message box and the email form, appears in that language.",
          "Switching the language also swaps the default welcome message and placeholder. Text you wrote yourself isn't changed, so translate your {{Welcome message}} and FAQs too.",
          "With AI replies on, the chatbot answers each visitor in the language they write in.",
          "To change the language of Askio itself, go to [Settings](/settings), then {{Appearance}}, then {{Language}}. It's saved on your account, so it follows you to every device.",
        ],
        tip: "Running a site in two languages? Make one chatbot per language and add each one to its version of the site.",
      },
    },
    faqs: [
      {
        q: "The chatbot doesn't appear on my website",
        a: "Check that the code is inside the `<body>` of every page, that the chatbot is live (not paused) on your dashboard, and clear your site's cache if it uses one. Some site builders only show custom code on the published site, not in their editor preview.",
      },
      {
        q: "My changes aren't showing on my site",
        a: "Make sure you clicked {{Save changes}}, then reload your site. Changes apply automatically; you don't need to update the code.",
      },
      {
        q: "The chatbot gives the wrong answer",
        a: "Rewrite the FAQ so the question matches how visitors phrase it, or add a second FAQ for a different phrasing. For AI answers, make sure your FAQs cover the topic and adjust the {{Instructions}} in the {{AI persona}} tab.",
      },
      {
        q: "AI replies stopped working",
        a: "You may have used this month's AI replies. Your dashboard shows your usage; your chatbots answer from FAQs until the limit resets on the 1st of the month.",
      },
      {
        q: "Shopify says the app isn't approved",
        a: "Askio is still in Shopify's review. It's safe to continue: click \"Install unlisted app\" at the bottom of Shopify's page.",
      },
    ],
  },

  fr: {
    guides: {
      create: {
        title: "Créer votre premier chatbot",
        summary: "Donnez-lui un nom, écrivez un message d'accueil et choisissez où il apparaît.",
        linkLabel: "Créer un chatbot",
        keywords: "nouveau nom titre informations de base conversation langue message d'accueil texte indicatif position coin enregistrer créer général configuration guidée start",
        steps: [
          "Cliquez sur {{Nouveau chatbot}} en haut de la barre latérale. L'éditeur du chatbot s'ouvre sur l'onglet {{Général}}.",
          "Dans {{Informations de base}}, donnez-lui un {{Nom}} (vous seul le voyez, dans votre tableau de bord) et un {{Titre}}, que les visiteurs voient en haut du chat.",
          "Dans {{Conversation}}, choisissez la {{Langue}} du chat, rédigez le {{Message d'accueil}} que les visiteurs voient en ouvrant le chat, et le {{Texte indicatif de la zone de message}}, le texte pâle affiché là où ils écrivent.",
          "Dans {{Position}}, cliquez sur la vignette du coin de votre site où le chat doit se placer, par exemple {{En bas à droite}}.",
          "Cliquez sur {{Créer le chatbot}} dans la barre d'enregistrement. Votre chatbot apparaît maintenant sur le tableau de bord. Les modifications suivantes s'enregistrent avec {{Enregistrer}}.",
        ],
        tip: "L'aperçu à droite se met à jour pendant que vous tapez : vous voyez exactement ce que verront les visiteurs. Pour votre premier chatbot, vous pouvez aussi utiliser la [configuration guidée](/start), qui remplit les informations de base à partir du nom de votre activité et propose des questions pour commencer.",
      },
      faqs: {
        title: "Ajouter vos questions et réponses",
        summary: "Les questions et réponses avec lesquelles votre chatbot répond.",
        keywords: "faq questions réponse ajouter modifier supprimer générer ia site web url importer",
        steps: [
          "Ouvrez l'onglet {{Questions}} dans l'éditeur du chatbot.",
          "Cliquez sur {{Ajouter une question}}, remplissez la {{Question}} et la {{Réponse}}, puis cliquez sur {{Ajouter une question}} en dessous. Recommencez pour chaque question fréquente.",
          "Utilisez les boutons de modification et de suppression à côté d'une question pour la changer ou la retirer. Cliquez sur {{Enregistrer}} pour publier vos questions.",
          "Avec Pro, cliquez sur {{Générer avec l'IA}} : collez l'{{URL du site}}, Askio lit la page et rédige des questions et réponses que vous pouvez relire. Il faut pour cela activer {{Répondre avec l'IA}} dans l'onglet {{Général}}.",
        ],
        tip: "Formulez les questions comme les visiteurs les posent (« Combien de temps prend la livraison ? »), pas comme des titres. Askio reconnaît les formulations proches : une seule question couvre donc de nombreuses variantes.",
      },
      appearance: {
        title: "Adapter le chatbot à votre marque",
        summary: "Style du lanceur, bulle de bienvenue et couleurs.",
        keywords: "apparence couleur unie dégradé principale secondaire couleurs prédéfinies marque lanceur kio orbe classique bulle de bienvenue style",
        steps: [
          "Ouvrez l'onglet {{Apparence}}.",
          "Dans {{Lanceur}}, choisissez {{Classique}} (une icône de bulle de chat) ou {{Kio}} (un orbe à vos couleurs dont les yeux suivent le pointeur du visiteur).",
          "Activez {{Bulle de bienvenue}} pour afficher un court message à côté du lanceur quelques secondes après l'arrivée d'un visiteur. Chaque visiteur ne la voit qu'une fois.",
          "Dans {{Couleurs}}, gardez {{Unie}} et choisissez une couleur {{Principale}} (l'en-tête et le lanceur) et une couleur {{Secondaire}} (les messages des visiteurs et le bouton d'envoi), ou cliquez sur l'une des {{Couleurs prédéfinies}}.",
          "Passez à {{Dégradé}} pour obtenir un dégradé, puis réglez son {{Début}}, sa {{Fin}} et son {{Angle}}.",
        ],
      },
      ai: {
        title: "Réponses IA et personnalité",
        summary: "Laissez l'IA répondre à ce que vos questions et réponses ne couvrent pas.",
        keywords: "ia intelligence artificielle répondre avec l'ia réponses personnalité voix instructions ton limite pro gemini",
        steps: [
          "Les réponses IA font partie de l'offre Pro. Si vous êtes sur l'offre gratuite, cliquez sur {{Passer à Pro}} dans les [Paramètres](/settings).",
          "Dans l'onglet {{Général}}, section {{Réponses IA}}, activez {{Répondre avec l'IA}}. Pro inclut l'IA sur 10 chatbots maximum.",
          "Ouvrez l'onglet {{Personnalité IA}} et choisissez une {{Voix}} pour votre chatbot, ou modifiez les {{Instructions}} pour écrire la vôtre.",
          "Pro inclut 3 000 réponses IA par mois pour l'ensemble de vos chatbots. Le tableau de bord indique combien vous en avez utilisé ; une fois la limite atteinte, vos chatbots continuent de répondre à partir de vos questions et réponses jusqu'au mois suivant.",
        ],
        tip: "L'IA s'appuie sur vos questions et réponses : plus elles sont bonnes, meilleures sont les réponses de l'IA.",
      },
      leads: {
        title: "Collecter des contacts et passer le relais à une personne",
        summary: "Récupérez des e-mails et proposez un moyen de vous joindre.",
        keywords: "contacts collecte e-mail email ne sait pas répondre lien vers un conseiller whatsapp page de contact relais humain assistance exporter",
        steps: [
          "Dans l'onglet {{Général}}, allez à {{Quand il ne sait pas répondre}}. Ce réglage décide de ce qui se passe quand une question n'est pas couverte par vos questions et réponses. Par défaut, {{Suggérer des questions proches}} propose les questions les plus proches.",
          "Choisissez {{Demander leur e-mail}} pour afficher un formulaire d'e-mail aux visiteurs et pouvoir les recontacter.",
          "Ou choisissez {{Proposer de parler à quelqu'un}} et remplissez {{Lien vers un conseiller}} : un lien WhatsApp, une page de contact ou une adresse e-mail. Le chatbot propose alors des questions proches et ajoute un bouton qui ouvre votre lien.",
          "Retrouvez les e-mails collectés dans {{Contacts}} sur la page [Statistiques](/analytics), où vous pouvez aussi cliquer sur {{Exporter en CSV}}.",
        ],
        tip: "Indiquez dans la politique de confidentialité de votre site que vous collectez des e-mails via le chatbot.",
      },
      install: {
        title: "L'ajouter à votre site",
        summary: "WordPress, Shopify, Wix ou n'importe quel site.",
        linkLabel: "Ouvrir Intégrations",
        keywords: "installer intégrer code site web wordpress shopify wix webflow squarespace html script body",
        steps: [
          "Ouvrez [Intégrations](/integrations) et choisissez le chatbot à installer.",
          "Choisissez votre plateforme : **WordPress** (installez le plugin), **Shopify** (connectez votre boutique), **Wix** ou **Autre site** (collez le code d'intégration).",
          "Collez le code d'intégration (également dans l'onglet {{Installer}} de l'éditeur) juste avant la balise de fermeture `</body>`, idéalement dans un pied de page ou une mise en page commune pour qu'il se charge sur toutes les pages.",
          "Rechargez votre site. Le lanceur apparaît dans le coin choisi. Les modifications enregistrées dans Askio s'affichent automatiquement.",
        ],
      },
      improve: {
        title: "Suivre et améliorer",
        summary: "Voyez ce que demandent les visiteurs et comblez les lacunes.",
        linkLabel: "Ouvrir Statistiques",
        keywords: "statistiques performances questions sans réponse taux de réponse rapports csv améliorer",
        steps: [
          "Ouvrez [Statistiques](/analytics) pour voir les questions traitées, votre taux de réponse, les questions sans réponse et les contacts.",
          "Consultez {{Sans réponse}} : ce sont les questions posées par les visiteurs auxquelles votre chatbot n'a pas su répondre. Cliquez sur {{Ajouter une réponse}} pour en ajouter une.",
          "Téléchargez les données brutes depuis l'onglet {{Rapports}} du tableau de bord.",
        ],
        tip: "Un coup d'œil hebdomadaire aux questions sans réponse est le moyen le plus rapide de rendre votre chatbot plus utile.",
      },
      conversations: {
        title: "Lire vos conversations",
        summary: "Consultez chaque échange de vos visiteurs avec votre chatbot.",
        linkLabel: "Ouvrir Conversations",
        keywords: "conversations historique chat messages enregistrés lire visiteurs pro confidentialité 90 jours supprimer",
        steps: [
          "Ouvrez l'éditeur du chatbot et, dans l'onglet {{Général}}, activez {{Enregistrer les conversations}} sous {{Historique des conversations}}. Cliquez sur {{Enregistrer}}. Cette fonction fait partie de Pro.",
          "À partir de là, chaque échange avec ce chatbot est enregistré. Les visiteurs voient un court avis dans le chat.",
          "Ouvrez [Conversations](/conversations) dans la barre latérale. Choisissez un échange pour le lire, ou filtrez par chatbot si vous en avez plusieurs.",
          "Les échanges où le visiteur a laissé son e-mail sont signalés, et l'e-mail s'affiche en haut pour que vous puissiez le copier.",
        ],
        tip: "Les conversations sont supprimées automatiquement 90 jours après le dernier message, et vous pouvez en supprimer une à tout moment. Mentionnez l'enregistrement des chats dans la politique de confidentialité de votre site.",
      },
      languages: {
        title: "Parler la langue de vos visiteurs",
        summary: "Choisissez la langue de chaque chatbot, et celle d'Askio.",
        keywords: "langue langues français néerlandais allemand espagnol anglais traduire multilingue",
        steps: [
          "Dans l'éditeur, ouvrez {{Général}} et choisissez la {{Langue}} du chatbot sous {{Conversation}}. Les textes intégrés du chat, comme le champ de message et le formulaire d'e-mail, s'affichent dans cette langue.",
          "Changer de langue remplace aussi le message d'accueil et le texte indicatif par défaut. Les textes que vous avez écrits ne changent pas : traduisez aussi votre {{Message d'accueil}} et vos questions.",
          "Avec les réponses IA activées, le chatbot répond à chaque visiteur dans la langue où il écrit.",
          "Pour changer la langue d'Askio, allez dans [Paramètres](/settings), puis {{Apparence}}, puis {{Langue}}. Elle est enregistrée sur votre compte et vous suit sur tous vos appareils.",
        ],
        tip: "Votre site existe en deux langues ? Créez un chatbot par langue et ajoutez chacun à la version correspondante du site.",
      },
    },
    faqs: [
      {
        q: "Le chatbot n'apparaît pas sur mon site",
        a: "Vérifiez que le code se trouve dans le `<body>` de chaque page, que le chatbot est en ligne (pas en pause) sur votre tableau de bord, et videz le cache de votre site s'il en utilise un. Certains créateurs de sites n'affichent le code personnalisé que sur le site publié, pas dans l'aperçu de leur éditeur.",
      },
      {
        q: "Mes modifications n'apparaissent pas sur mon site",
        a: "Vérifiez que vous avez cliqué sur {{Enregistrer}}, puis rechargez votre site. Les modifications s'appliquent automatiquement : inutile de mettre à jour le code.",
      },
      {
        q: "Le chatbot donne une mauvaise réponse",
        a: "Reformulez la question pour qu'elle corresponde à la façon dont les visiteurs la posent, ou ajoutez une deuxième question pour une autre formulation. Pour les réponses IA, assurez-vous que vos questions et réponses couvrent le sujet et ajustez les {{Instructions}} dans l'onglet {{Personnalité IA}}.",
      },
      {
        q: "Les réponses IA ne fonctionnent plus",
        a: "Vous avez peut-être utilisé toutes les réponses IA de ce mois. Votre tableau de bord indique votre consommation ; vos chatbots répondent à partir de vos questions et réponses jusqu'à la remise à zéro de la limite le 1er du mois.",
      },
      {
        q: "Shopify indique que l'application n'est pas approuvée",
        a: "Askio est encore en cours d'examen chez Shopify. Vous pouvez continuer sans risque : cliquez sur « Install unlisted app » en bas de la page Shopify.",
      },
    ],
  },

  nl: {
    guides: {
      create: {
        title: "Maak je eerste chatbot",
        summary: "Geef hem een naam, schrijf een welkomstbericht en kies waar hij verschijnt.",
        linkLabel: "Maak een chatbot",
        keywords: "nieuw naam titel basis gesprek taal welkomstbericht voorbeeldtekst berichtvak positie hoek opslaan aanmaken algemeen begeleide installatie start",
        steps: [
          "Klik bovenaan de zijbalk op {{Nieuwe chatbot}}. De chatboteditor opent op het tabblad {{Algemeen}}.",
          "Geef hem onder {{Basis}} een {{Naam}} (alleen jij ziet die, in je dashboard) en een {{Titel}}, die bezoekers bovenin de chat zien.",
          "Kies onder {{Gesprek}} de {{Taal}} van de chat, schrijf het {{Welkomstbericht}} dat bezoekers zien als ze de chat openen, en stel de {{Voorbeeldtekst in berichtvak}} in, de lichte tekst in het vak waar ze typen.",
          "Klik onder {{Positie}} op de tegel van de hoek van je site waar de chat moet staan, bijvoorbeeld {{Rechtsonder}}.",
          "Klik in de opslagbalk op {{Chatbot aanmaken}}. Je chatbot staat nu op het dashboard. Latere wijzigingen sla je op met {{Wijzigingen opslaan}}.",
        ],
        tip: "De voorbeeldweergave rechts werkt bij terwijl je typt, zodat je precies ziet wat bezoekers te zien krijgen. Voor je eerste chatbot kun je ook de [begeleide installatie](/start) gebruiken: die vult de basis in op basis van je bedrijfsnaam en stelt vragen voor om mee te beginnen.",
      },
      faqs: {
        title: "Voeg je vragen en antwoorden toe",
        summary: "De vragen en antwoorden waarmee je chatbot reageert.",
        keywords: "faq veelgestelde vragen antwoord toevoegen bewerken verwijderen genereren ai website url importeren",
        steps: [
          "Open het tabblad {{Vragen}} in de chatboteditor.",
          "Klik op {{Vraag toevoegen}}, vul de {{Vraag}} en het {{Antwoord}} in en klik daaronder op {{Vraag toevoegen}}. Herhaal dit voor elke veelgestelde vraag.",
          "Gebruik de knoppen voor bewerken en verwijderen naast een vraag om die aan te passen of weg te halen. Klik op {{Wijzigingen opslaan}} om je vragen te publiceren.",
          "Klik met Pro op {{Genereren met AI}}: plak je {{Website-URL}}, dan leest Askio de pagina en stelt vragen en antwoorden op die jij kunt nakijken. Hiervoor moet {{Antwoorden met AI}} aanstaan op het tabblad {{Algemeen}}.",
        ],
        tip: "Schrijf vragen zoals bezoekers ze stellen (‘Hoe lang duurt de levering?’), niet als kopjes. Askio herkent vergelijkbare formuleringen, dus één vraag dekt veel varianten.",
      },
      appearance: {
        title: "Laat hem bij je merk passen",
        summary: "De stijl van de startknop, de begroetingsballon en kleuren.",
        keywords: "uiterlijk kleur effen verloop kleurverloop primair secundair voorinstellingen merk startknop kio bol klassiek begroetingsballon stijl",
        steps: [
          "Open het tabblad {{Uiterlijk}}.",
          "Kies onder {{Startknop}} voor {{Klassiek}} (een chatballonnetje) of {{Kio}} (een bol in jouw kleur waarvan de ogen de muisaanwijzer van de bezoeker volgen).",
          "Zet {{Begroetingsballon}} aan om een paar seconden nadat iemand binnenkomt een korte begroeting naast de startknop te tonen. Elke bezoeker ziet hem één keer.",
          "Laat onder {{Kleuren}} {{Effen}} staan en kies een kleur voor {{Primair}} (de kop en de startknop) en voor {{Secundair}} (de berichten van je bezoekers en de verzendknop), of klik op een van de {{Voorinstellingen}}.",
          "Kies {{Verloop}} voor een kleurverloop en stel het {{Begin}}, het {{Eind}} en de {{Hoek}} in.",
        ],
      },
      ai: {
        title: "AI-antwoorden en persona",
        summary: "Laat AI antwoorden op wat je vragen en antwoorden niet dekken.",
        keywords: "ai kunstmatige intelligentie antwoorden met ai persona stem instructies toon persoonlijkheid limiet pro gemini",
        steps: [
          "AI-antwoorden horen bij het Pro-abonnement. Heb je het gratis abonnement, klik dan in [Instellingen](/settings) op {{Upgrade naar Pro}}.",
          "Zet op het tabblad {{Algemeen}} onder {{AI-antwoorden}} de optie {{Antwoorden met AI}} aan. Met Pro kunnen tot 10 chatbots AI gebruiken.",
          "Open het tabblad {{AI-persona}} en kies een {{Stem}} voor je chatbot, of pas de {{Instructies}} aan om je eigen stem te schrijven.",
          "Pro bevat 3.000 AI-antwoorden per maand voor al je chatbots samen. Het dashboard laat zien hoeveel je er hebt gebruikt. Zijn ze op, dan blijven je chatbots tot de volgende maand antwoorden vanuit je vragen en antwoorden.",
        ],
        tip: "AI gebruikt je vragen en antwoorden als bron, dus betere vragen en antwoorden betekenen betere AI-antwoorden.",
      },
      leads: {
        title: "Verzamel leads en geef door aan een mens",
        summary: "Verzamel e-mailadressen en bied een manier om je te bereiken.",
        keywords: "leads verzamelen e-mail email geen antwoord link naar een medewerker whatsapp contactpagina doorverbinden mens support exporteren",
        steps: [
          "Ga op het tabblad {{Algemeen}} naar {{Als hij het antwoord niet weet}}. Hier kies je wat er gebeurt als een vraag niet in je vragen en antwoorden staat. Standaard staat {{Vergelijkbare vragen voorstellen}} aan, dat de vragen toont die er het dichtst bij liggen.",
          "Kies {{Om hun e-mailadres vragen}} om bezoekers een e-mailformulier te tonen, zodat je contact met ze kunt opnemen.",
          "Of kies {{Gesprek met een medewerker aanbieden}} en vul {{Link naar een medewerker}} in: een WhatsApp-link, een contactpagina of een e-mailadres. De chatbot stelt dan vergelijkbare vragen voor en voegt een knop toe die je link opent.",
          "Je vindt de verzamelde e-mailadressen onder {{Leads}} op de pagina [Statistieken](/analytics), waar je ook op {{CSV exporteren}} kunt klikken.",
        ],
        tip: "Vermeld in de privacyverklaring van je website dat je via de chatbot e-mailadressen verzamelt.",
      },
      install: {
        title: "Zet hem op je website",
        summary: "WordPress, Shopify, Wix of elke andere site.",
        linkLabel: "Open Integraties",
        keywords: "installeren insluiten embedcode code website wordpress shopify wix webflow squarespace html script body",
        steps: [
          "Open [Integraties](/integrations) en kies de chatbot die je wilt installeren.",
          "Kies je platform: **WordPress** (installeer de plugin), **Shopify** (koppel je winkel), **Wix** of **Andere website** (plak de embedcode).",
          "Plak de embedcode (ook te vinden op het tabblad {{Installeren}} van de editor) vlak voor de afsluitende `</body>`-tag, het liefst in een gedeelde footer of lay-out zodat hij op elke pagina laadt.",
          "Laad je site opnieuw. De startknop verschijnt in de hoek die je hebt gekozen. Wijzigingen die je in Askio opslaat, verschijnen vanzelf.",
        ],
      },
      improve: {
        title: "Volgen en verbeteren",
        summary: "Zie wat bezoekers vragen en vul de gaten op.",
        linkLabel: "Open Statistieken",
        keywords: "statistieken prestaties onbeantwoorde vragen antwoordpercentage rapporten csv verbeteren",
        steps: [
          "Open [Statistieken](/analytics) om beantwoorde vragen, je antwoordpercentage, onbeantwoorde vragen en leads te zien.",
          "Bekijk {{Geen antwoord}}: dit zijn vragen van bezoekers waarop je chatbot geen antwoord had. Klik op {{Antwoord toevoegen}} om er een toe te voegen.",
          "Download ruwe gegevens via het tabblad {{Rapporten}} op het dashboard.",
        ],
        tip: "Elke week even naar de onbeantwoorde vragen kijken is de snelste manier om je chatbot nuttiger te maken.",
      },
      conversations: {
        title: "Je gesprekken lezen",
        summary: "Bekijk elke chat die bezoekers met je chatbot voerden.",
        linkLabel: "Gesprekken openen",
        keywords: "gesprekken geschiedenis chat berichten opgeslagen lezen bezoekers pro privacy 90 dagen verwijderen",
        steps: [
          "Open de chatbot-editor en zet in het tabblad {{Algemeen}} {{Gesprekken opslaan}} aan onder {{Gespreksgeschiedenis}}. Klik op {{Wijzigingen opslaan}}. Dit hoort bij Pro.",
          "Vanaf dan wordt elke chat met die chatbot opgeslagen. Bezoekers zien een korte melding in de chat.",
          "Open [Gesprekken](/conversations) in de zijbalk. Kies een chat om hem te lezen, of filter op chatbot als je er meerdere hebt.",
          "Chats waarin de bezoeker een e-mailadres achterliet, zijn gemarkeerd, en het adres staat bovenaan zodat je het kunt kopiëren.",
        ],
        tip: "Gesprekken worden automatisch verwijderd 90 dagen na het laatste bericht, en je kunt er zelf altijd een verwijderen. Vermeld opgeslagen chats in de privacyverklaring van je eigen website.",
      },
      languages: {
        title: "Chat in de taal van je bezoekers",
        summary: "Kies de taal van elke chatbot, en die van Askio.",
        keywords: "taal talen frans nederlands duits spaans engels vertalen meertalig",
        steps: [
          "Open in de editor {{Algemeen}} en kies de {{Taal}} van de chatbot onder {{Gesprek}}. De vaste teksten in de chat, zoals het berichtvak en het e-mailformulier, verschijnen in die taal.",
          "Als je de taal wisselt, worden ook het standaard welkomstbericht en de voorbeeldtekst aangepast. Teksten die je zelf schreef blijven staan, dus vertaal ook je {{Welkomstbericht}} en vragen.",
          "Met AI-antwoorden aan antwoordt de chatbot elke bezoeker in de taal waarin die schrijft.",
          "Wil je de taal van Askio zelf wijzigen? Ga naar [Instellingen](/settings), dan {{Weergave}}, dan {{Taal}}. Die wordt op je account bewaard en volgt je naar elk apparaat.",
        ],
        tip: "Heeft je site twee talen? Maak per taal een chatbot en zet elke chatbot op de bijbehorende versie van je site.",
      },
    },
    faqs: [
      {
        q: "De chatbot verschijnt niet op mijn website",
        a: "Controleer of de code in de `<body>` van elke pagina staat, of de chatbot op je dashboard live is (niet gepauzeerd), en leeg de cache van je site als die er een gebruikt. Sommige websitebouwers tonen eigen code alleen op de gepubliceerde site, niet in de voorbeeldweergave van hun editor.",
      },
      {
        q: "Mijn wijzigingen zijn niet te zien op mijn site",
        a: "Controleer of je op {{Wijzigingen opslaan}} hebt geklikt en laad je site daarna opnieuw. Wijzigingen worden vanzelf doorgevoerd; je hoeft de code niet bij te werken.",
      },
      {
        q: "De chatbot geeft een verkeerd antwoord",
        a: "Herschrijf de vraag zodat die aansluit bij hoe bezoekers hem stellen, of voeg een tweede vraag toe voor een andere formulering. Zorg bij AI-antwoorden dat je vragen en antwoorden het onderwerp dekken en pas de {{Instructies}} op het tabblad {{AI-persona}} aan.",
      },
      {
        q: "AI-antwoorden werken niet meer",
        a: "Misschien heb je de AI-antwoorden van deze maand opgebruikt. Je dashboard toont je verbruik; je chatbots antwoorden vanuit je vragen en antwoorden tot de limiet op de 1e van de maand weer wordt gereset.",
      },
      {
        q: "Shopify zegt dat de app niet is goedgekeurd",
        a: "Askio wordt nog door Shopify beoordeeld. Je kunt veilig doorgaan: klik onderaan de Shopify-pagina op ‘Install unlisted app’.",
      },
    ],
  },

  de: {
    guides: {
      create: {
        title: "Ihren ersten Chatbot erstellen",
        summary: "Geben Sie ihm einen Namen, schreiben Sie eine Begrüßung und wählen Sie, wo er erscheint.",
        linkLabel: "Chatbot erstellen",
        keywords: "neu name titel grundlagen gespräch sprache begrüßungsnachricht platzhalter nachrichtenfeld position ecke speichern erstellen allgemein geführte einrichtung start",
        steps: [
          "Klicken Sie oben in der Seitenleiste auf {{Neuer Chatbot}}. Der Chatbot-Editor öffnet sich im Tab {{Allgemein}}.",
          "Geben Sie ihm unter {{Grundlagen}} einen {{Name}} (nur für Sie sichtbar, in Ihrem Dashboard) und einen {{Titel}}, den Besucher oben im Chat sehen.",
          "Wählen Sie unter {{Gespräch}} die {{Sprache}} des Chats, schreiben Sie die {{Begrüßungsnachricht}}, die Besucher beim Öffnen des Chats sehen, und legen Sie den {{Platzhalter im Nachrichtenfeld}} fest, den hellen Text im Feld, in das sie tippen.",
          "Klicken Sie unter {{Position}} auf die Kachel der Ecke Ihrer Website, in der der Chat erscheinen soll, zum Beispiel {{Unten rechts}}.",
          "Klicken Sie in der Speicherleiste auf {{Chatbot erstellen}}. Ihr Chatbot erscheint jetzt im Dashboard. Spätere Änderungen speichern Sie mit {{Änderungen speichern}}.",
        ],
        tip: "Die Vorschau rechts aktualisiert sich beim Tippen, sodass Sie genau sehen, was Besucher sehen werden. Für Ihren ersten Chatbot können Sie auch die [geführte Einrichtung](/start) nutzen: Sie füllt die Grundlagen anhand Ihres Unternehmensnamens aus und schlägt Fragen für den Anfang vor.",
      },
      faqs: {
        title: "Fragen und Antworten hinzufügen",
        summary: "Die Fragen und Antworten, mit denen Ihr Chatbot antwortet.",
        keywords: "faq fragen antwort hinzufügen bearbeiten löschen erstellen generieren ki website url importieren",
        steps: [
          "Öffnen Sie im Chatbot-Editor den Tab {{Fragen}}.",
          "Klicken Sie auf {{Frage hinzufügen}}, füllen Sie {{Frage}} und {{Antwort}} aus und klicken Sie darunter auf {{Frage hinzufügen}}. Wiederholen Sie das für jede häufige Frage.",
          "Mit den Schaltflächen zum Bearbeiten und Löschen neben einer Frage ändern oder entfernen Sie sie. Klicken Sie auf {{Änderungen speichern}}, um Ihre Fragen zu veröffentlichen.",
          "Mit Pro klicken Sie auf {{Mit KI erstellen}}: Fügen Sie Ihre {{Website-URL}} ein, Askio liest die Seite und entwirft Fragen und Antworten, die Sie prüfen können. Dafür muss {{Mit KI antworten}} im Tab {{Allgemein}} eingeschaltet sein.",
        ],
        tip: "Formulieren Sie Fragen so, wie Besucher sie stellen („Wie lange dauert die Lieferung?“), nicht als Überschriften. Askio erkennt ähnliche Formulierungen, sodass eine Frage viele Varianten abdeckt.",
      },
      appearance: {
        title: "An Ihre Marke anpassen",
        summary: "Stil des Chat-Buttons, die Begrüßungsblase und Farben.",
        keywords: "design darstellung farbe einfarbig farbverlauf verlauf primär sekundär vorlagen marke chat-button kio kugel klassisch begrüßungsblase stil",
        steps: [
          "Öffnen Sie den Tab {{Design}}.",
          "Wählen Sie unter {{Chat-Button}} {{Klassisch}} (ein Chat-Sprechblasen-Symbol) oder {{Kio}} (eine Kugel in Ihrer Farbe, deren Augen dem Mauszeiger des Besuchers folgen).",
          "Schalten Sie {{Begrüßungsblase}} ein, um einige Sekunden nach dem Eintreffen eines Besuchers eine kurze Begrüßung neben dem Chat-Button anzuzeigen. Jeder Besucher sieht sie einmal.",
          "Lassen Sie unter {{Farben}} {{Einfarbig}} ausgewählt und wählen Sie eine Farbe für {{Primär}} (Kopfzeile und Chat-Button) und für {{Sekundär}} (die Nachrichten Ihrer Besucher und die Senden-Schaltfläche), oder klicken Sie auf eine der {{Vorlagen}}.",
          "Wechseln Sie zu {{Verlauf}} für einen Farbverlauf und legen Sie {{Anfang}}, {{Ende}} und {{Winkel}} fest.",
        ],
      },
      ai: {
        title: "KI-Antworten und Persona",
        summary: "Lassen Sie die KI beantworten, was Ihre Fragen und Antworten nicht abdecken.",
        keywords: "ki künstliche intelligenz mit ki antworten persona stimme anweisungen ton persönlichkeit antworten limit pro gemini",
        steps: [
          "KI-Antworten sind Teil des Pro-Tarifs. Wenn Sie den kostenlosen Tarif nutzen, klicken Sie in den [Einstellungen](/settings) auf {{Zu Pro wechseln}}.",
          "Schalten Sie im Tab {{Allgemein}} unter {{KI-Antworten}} die Option {{Mit KI antworten}} ein. Pro umfasst KI für bis zu 10 Chatbots.",
          "Öffnen Sie den Tab {{KI-Persona}} und wählen Sie eine {{Stimme}} für Ihren Chatbot, oder bearbeiten Sie die {{Anweisungen}}, um eine eigene zu schreiben.",
          "Pro enthält 3.000 KI-Antworten pro Monat für alle Ihre Chatbots zusammen. Das Dashboard zeigt, wie viele Sie verbraucht haben. Sind sie aufgebraucht, antworten Ihre Chatbots bis zum nächsten Monat weiter mit Ihren Fragen und Antworten.",
        ],
        tip: "Die KI nutzt Ihre Fragen und Antworten als Quelle: Je besser diese sind, desto besser antwortet die KI.",
      },
      leads: {
        title: "Leads erfassen und an eine Person übergeben",
        summary: "Sammeln Sie E-Mail-Adressen und bieten Sie einen Weg, Sie zu erreichen.",
        keywords: "leads erfassung e-mail email keine antwort link zu einem mitarbeiter whatsapp kontaktseite übergabe mensch support exportieren",
        steps: [
          "Gehen Sie im Tab {{Allgemein}} zu {{Wenn er keine Antwort weiß}}. Hier legen Sie fest, was passiert, wenn eine Frage nicht von Ihren Fragen und Antworten abgedeckt ist. Standardmäßig ist {{Ähnliche Fragen vorschlagen}} ausgewählt und bietet die passendsten Fragen an.",
          "Wählen Sie {{Nach der E-Mail-Adresse fragen}}, um Besuchern ein E-Mail-Formular zu zeigen, damit Sie sich bei ihnen melden können.",
          "Oder wählen Sie {{Gespräch mit einem Menschen anbieten}} und füllen Sie {{Link zu einem Mitarbeiter}} aus: einen WhatsApp-Link, eine Kontaktseite oder eine E-Mail-Adresse. Der Chatbot schlägt dann ähnliche Fragen vor und fügt eine Schaltfläche hinzu, die Ihren Link öffnet.",
          "Die gesammelten E-Mail-Adressen finden Sie unter {{Leads}} auf der Seite [Statistiken](/analytics), wo Sie auch auf {{CSV exportieren}} klicken können.",
        ],
        tip: "Weisen Sie in der Datenschutzerklärung Ihrer Website darauf hin, dass Sie über den Chatbot E-Mail-Adressen erfassen.",
      },
      install: {
        title: "Auf Ihrer Website einbinden",
        summary: "WordPress, Shopify, Wix oder jede andere Website.",
        linkLabel: "Integrationen öffnen",
        keywords: "installieren einbetten code website wordpress shopify wix webflow squarespace html script body",
        steps: [
          "Öffnen Sie [Integrationen](/integrations) und wählen Sie den Chatbot, den Sie installieren möchten.",
          "Wählen Sie Ihre Plattform: **WordPress** (Plugin installieren), **Shopify** (Shop verbinden), **Wix** oder **Andere Website** (Einbettungscode einfügen).",
          "Fügen Sie den Einbettungscode (auch im Tab {{Installieren}} des Editors) direkt vor dem schließenden `</body>`-Tag ein, am besten in einer gemeinsamen Fußzeile oder Vorlage, damit er auf jeder Seite geladen wird.",
          "Laden Sie Ihre Website neu. Der Chat-Button erscheint in der gewählten Ecke. Änderungen, die Sie in Askio speichern, werden automatisch übernommen.",
        ],
      },
      improve: {
        title: "Auswerten und verbessern",
        summary: "Sehen Sie, was Besucher fragen, und schließen Sie die Lücken.",
        linkLabel: "Statistiken öffnen",
        keywords: "statistiken leistung unbeantwortete fragen keine antwort antwortquote berichte csv verbessern",
        steps: [
          "Öffnen Sie [Statistiken](/analytics), um beantwortete Fragen, Ihre Antwortquote, unbeantwortete Fragen und Leads zu sehen.",
          "Prüfen Sie {{Keine Antwort}}: Das sind Fragen von Besuchern, auf die Ihr Chatbot keine Antwort hatte. Klicken Sie auf {{Antwort hinzufügen}}, um eine zu ergänzen.",
          "Rohdaten laden Sie im Tab {{Berichte}} im Dashboard herunter.",
        ],
        tip: "Ein kurzer wöchentlicher Blick auf unbeantwortete Fragen ist der schnellste Weg, Ihren Chatbot nützlicher zu machen.",
      },
      conversations: {
        title: "Gespräche lesen",
        summary: "Sehen Sie jeden Chat Ihrer Besucher mit Ihrem Chatbot.",
        linkLabel: "Gespräche öffnen",
        keywords: "gespräche verlauf chat nachrichten gespeichert lesen besucher pro datenschutz 90 tage löschen",
        steps: [
          "Öffnen Sie den Chatbot-Editor und aktivieren Sie im Tab {{Allgemein}} unter {{Gesprächsverlauf}} die Option {{Gespräche speichern}}. Klicken Sie auf {{Änderungen speichern}}. Das ist Teil von Pro.",
          "Ab dann wird jeder Chat mit diesem Chatbot gespeichert. Besucher sehen im Chat einen kurzen Hinweis.",
          "Öffnen Sie [Gespräche](/conversations) in der Seitenleiste. Wählen Sie einen Chat zum Lesen aus, oder filtern Sie nach Chatbot, wenn Sie mehrere haben.",
          "Chats, in denen der Besucher seine E-Mail-Adresse hinterlassen hat, sind markiert, und die Adresse steht oben zum Kopieren.",
        ],
        tip: "Gespräche werden 90 Tage nach der letzten Nachricht automatisch gelöscht, und Sie können jedes jederzeit selbst löschen. Erwähnen Sie gespeicherte Chats in der Datenschutzerklärung Ihrer Website.",
      },
      languages: {
        title: "In der Sprache Ihrer Besucher chatten",
        summary: "Wählen Sie die Sprache jedes Chatbots und die von Askio.",
        keywords: "sprache sprachen französisch niederländisch deutsch spanisch englisch übersetzen mehrsprachig",
        steps: [
          "Öffnen Sie im Editor {{Allgemein}} und wählen Sie unter {{Gespräch}} die {{Sprache}} des Chatbots. Die festen Texte im Chat, etwa das Nachrichtenfeld und das E-Mail-Formular, erscheinen in dieser Sprache.",
          "Beim Wechsel der Sprache werden auch die Standard-Begrüßungsnachricht und der Platzhalter angepasst. Selbst geschriebene Texte bleiben, übersetzen Sie also auch Ihre {{Begrüßungsnachricht}} und Fragen.",
          "Mit KI-Antworten antwortet der Chatbot jedem Besucher in der Sprache, in der er schreibt.",
          "Die Sprache von Askio selbst ändern Sie unter [Einstellungen](/settings), dann {{Darstellung}}, dann {{Sprache}}. Sie wird in Ihrem Konto gespeichert und gilt auf allen Geräten.",
        ],
        tip: "Ihre Website gibt es in zwei Sprachen? Erstellen Sie pro Sprache einen Chatbot und binden Sie jeden in die passende Version ein.",
      },
    },
    faqs: [
      {
        q: "Der Chatbot erscheint nicht auf meiner Website",
        a: "Prüfen Sie, ob der Code im `<body>` jeder Seite steht und der Chatbot in Ihrem Dashboard live (nicht pausiert) ist, und leeren Sie den Cache Ihrer Website, falls sie einen verwendet. Manche Website-Baukästen zeigen eigenen Code nur auf der veröffentlichten Seite, nicht in der Vorschau ihres Editors.",
      },
      {
        q: "Meine Änderungen erscheinen nicht auf meiner Website",
        a: "Stellen Sie sicher, dass Sie auf {{Änderungen speichern}} geklickt haben, und laden Sie Ihre Website dann neu. Änderungen werden automatisch übernommen; Sie müssen den Code nicht aktualisieren.",
      },
      {
        q: "Der Chatbot gibt eine falsche Antwort",
        a: "Formulieren Sie die Frage so um, wie Besucher sie stellen, oder fügen Sie eine zweite Frage für eine andere Formulierung hinzu. Achten Sie bei KI-Antworten darauf, dass Ihre Fragen und Antworten das Thema abdecken, und passen Sie die {{Anweisungen}} im Tab {{KI-Persona}} an.",
      },
      {
        q: "KI-Antworten funktionieren nicht mehr",
        a: "Möglicherweise haben Sie die KI-Antworten dieses Monats aufgebraucht. Ihr Dashboard zeigt Ihren Verbrauch; Ihre Chatbots antworten mit Ihren Fragen und Antworten, bis das Limit am 1. des Monats zurückgesetzt wird.",
      },
      {
        q: "Shopify meldet, dass die App nicht genehmigt ist",
        a: "Askio befindet sich noch in der Prüfung durch Shopify. Sie können bedenkenlos fortfahren: Klicken Sie unten auf der Shopify-Seite auf „Install unlisted app“.",
      },
    ],
  },

  es: {
    guides: {
      create: {
        title: "Crea tu primer chatbot",
        summary: "Ponle nombre, escribe un mensaje de bienvenida y elige dónde aparece.",
        linkLabel: "Crear un chatbot",
        keywords: "nuevo nombre título lo básico conversación idioma mensaje de bienvenida texto de ejemplo posición esquina guardar crear general configuración guiada start",
        steps: [
          "Haz clic en {{Nuevo chatbot}} en la parte superior de la barra lateral. El editor del chatbot se abre en la pestaña {{General}}.",
          "En {{Lo básico}}, dale un {{Nombre}} (solo lo ves tú, en tu panel) y un {{Título}}, que los visitantes ven en la parte superior del chat.",
          "En {{Conversación}}, elige el {{Idioma}} del chat, escribe el {{Mensaje de bienvenida}} que ven los visitantes al abrir el chat y define el {{Texto de ejemplo del cuadro de mensaje}}, el texto tenue del cuadro donde escriben.",
          "En {{Posición}}, haz clic en la casilla de la esquina de tu sitio donde debe ir el chat, por ejemplo {{Abajo a la derecha}}.",
          "Haz clic en {{Crear chatbot}} en la barra de guardado. Tu chatbot aparece ahora en el panel. Los cambios posteriores se guardan con {{Guardar cambios}}.",
        ],
        tip: "La vista previa de la derecha se actualiza mientras escribes, así ves exactamente lo que verán los visitantes. Para tu primer chatbot también puedes usar la [configuración guiada](/start), que rellena lo básico a partir del nombre de tu negocio y te sugiere preguntas para empezar.",
      },
      faqs: {
        title: "Añade tus preguntas y respuestas",
        summary: "Las preguntas y respuestas con las que responde tu chatbot.",
        keywords: "faq preguntas respuesta añadir editar eliminar generar ia sitio web url importar",
        steps: [
          "Abre la pestaña {{Preguntas}} en el editor del chatbot.",
          "Haz clic en {{Añadir pregunta}}, rellena la {{Pregunta}} y la {{Respuesta}}, y haz clic en {{Añadir pregunta}} debajo. Repite con cada pregunta frecuente.",
          "Usa los botones de editar y eliminar junto a una pregunta para cambiarla o quitarla. Haz clic en {{Guardar cambios}} para publicar tus preguntas.",
          "Con Pro, haz clic en {{Generar con IA}}: pega la {{URL del sitio}} y Askio lee la página y redacta preguntas y respuestas para que las revises. Para ello, {{Responder con IA}} debe estar activado en la pestaña {{General}}.",
        ],
        tip: "Escribe las preguntas como las hacen los visitantes («¿Cuánto tarda el envío?»), no como títulos. Askio reconoce formulaciones parecidas, así que una pregunta cubre muchas variantes.",
      },
      appearance: {
        title: "Adáptalo a tu marca",
        summary: "Estilo del botón del chat, la burbuja de saludo y colores.",
        keywords: "apariencia color sólido degradado principal secundario predefinidos marca botón del chat kio orbe clásico burbuja de saludo estilo",
        steps: [
          "Abre la pestaña {{Apariencia}}.",
          "En {{Botón del chat}}, elige {{Clásico}} (un icono de burbuja de chat) o {{Kio}} (un orbe de tu color cuyos ojos siguen el puntero del visitante).",
          "Activa {{Burbuja de saludo}} para mostrar un saludo breve junto al botón del chat unos segundos después de que llegue alguien. Cada visitante la ve una vez.",
          "En {{Colores}}, deja {{Sólido}} y elige un color {{Principal}} (la cabecera y el botón del chat) y un color {{Secundario}} (los mensajes de tus visitantes y el botón de enviar), o haz clic en uno de los {{Predefinidos}}.",
          "Cambia a {{Degradado}} para tener un degradado y define su {{Inicio}}, su {{Fin}} y su {{Ángulo}}.",
        ],
      },
      ai: {
        title: "Respuestas de IA y personalidad",
        summary: "Deja que la IA responda lo que tus preguntas y respuestas no cubren.",
        keywords: "ia inteligencia artificial responder con ia respuestas personalidad voz instrucciones tono límite pro gemini",
        steps: [
          "Las respuestas de IA forman parte del plan Pro. Si tienes el plan gratuito, haz clic en {{Pasar a Pro}} en [Ajustes](/settings).",
          "En la pestaña {{General}}, en {{Respuestas de IA}}, activa {{Responder con IA}}. Pro incluye IA en hasta 10 chatbots.",
          "Abre la pestaña {{Personalidad de IA}} y elige una {{Voz}} para tu chatbot, o edita las {{Instrucciones}} para escribir la tuya.",
          "Pro incluye 3000 respuestas de IA al mes entre todos tus chatbots. El panel muestra cuántas has usado y, si se acaban, tus chatbots siguen respondiendo con tus preguntas y respuestas hasta el mes siguiente.",
        ],
        tip: "La IA usa tus preguntas y respuestas como fuente: cuanto mejores sean, mejores serán las respuestas de la IA.",
      },
      leads: {
        title: "Capta contactos y pasa la conversación a una persona",
        summary: "Recoge correos electrónicos y ofrece una forma de contactarte.",
        keywords: "contactos captación correo email no sabe responder enlace para hablar con una persona whatsapp página de contacto traspaso soporte exportar",
        steps: [
          "En la pestaña {{General}}, ve a {{Cuando no sabe responder}}. Ahí decides qué pasa cuando una pregunta no está cubierta por tus preguntas y respuestas. La opción por defecto, {{Sugerir preguntas relacionadas}}, ofrece las preguntas más parecidas.",
          "Elige {{Pedir su correo}} para mostrar a los visitantes un formulario de correo y poder contactarles después.",
          "O elige {{Ofrecer hablar con una persona}} y rellena {{Enlace para hablar con una persona}}: un enlace de WhatsApp, una página de contacto o una dirección de correo. El chatbot sugiere entonces preguntas relacionadas y añade un botón que abre tu enlace.",
          "Encontrarás los correos recogidos en {{Contactos}} en la página [Estadísticas](/analytics), donde también puedes hacer clic en {{Exportar CSV}}.",
        ],
        tip: "Indica en el aviso de privacidad de tu sitio web que recoges correos electrónicos a través del chatbot.",
      },
      install: {
        title: "Ponlo en tu sitio web",
        summary: "WordPress, Shopify, Wix o cualquier sitio.",
        linkLabel: "Abrir Integraciones",
        keywords: "instalar insertar código sitio web wordpress shopify wix webflow squarespace html script body",
        steps: [
          "Abre [Integraciones](/integrations) y elige el chatbot que quieres instalar.",
          "Elige tu plataforma: **WordPress** (instala el plugin), **Shopify** (conecta tu tienda), **Wix** u **Otra web** (pega el código de inserción).",
          "Pega el código de inserción (también en la pestaña {{Instalar}} del editor) justo antes de la etiqueta de cierre `</body>`, idealmente en un pie de página o plantilla común para que se cargue en todas las páginas.",
          "Recarga tu sitio. El botón del chat aparece en la esquina que elegiste. Los cambios que guardes en Askio se aplican automáticamente.",
        ],
      },
      improve: {
        title: "Mide y mejora",
        summary: "Mira qué preguntan los visitantes y cubre los vacíos.",
        linkLabel: "Abrir Estadísticas",
        keywords: "estadísticas rendimiento preguntas sin respuesta tasa de respuesta informes csv mejorar",
        steps: [
          "Abre [Estadísticas](/analytics) para ver las preguntas respondidas, tu tasa de respuesta, las preguntas sin respuesta y los contactos.",
          "Revisa {{Sin respuesta}}: son preguntas de los visitantes para las que tu chatbot no tenía respuesta. Haz clic en {{Añadir respuesta}} para añadir una.",
          "Descarga los datos sin procesar desde la pestaña {{Informes}} del panel.",
        ],
        tip: "Revisar cada semana las preguntas sin respuesta es la forma más rápida de que tu chatbot sea más útil.",
      },
      conversations: {
        title: "Leer tus conversaciones",
        summary: "Mira cada chat de tus visitantes con tu chatbot.",
        linkLabel: "Abrir Conversaciones",
        keywords: "conversaciones historial chat mensajes guardados leer visitantes pro privacidad 90 días eliminar",
        steps: [
          "Abre el editor del chatbot y, en la pestaña {{General}}, activa {{Guardar conversaciones}} en {{Historial de conversaciones}}. Haz clic en {{Guardar cambios}}. Forma parte de Pro.",
          "A partir de entonces, cada chat con ese chatbot se guarda. Los visitantes ven un breve aviso en el chat.",
          "Abre [Conversaciones](/conversations) en la barra lateral. Elige un chat para leerlo, o filtra por chatbot si tienes varios.",
          "Los chats en los que el visitante dejó su correo aparecen marcados, y el correo se muestra arriba para que puedas copiarlo.",
        ],
        tip: "Las conversaciones se eliminan automáticamente 90 días después del último mensaje, y puedes eliminar cualquiera cuando quieras. Menciona los chats guardados en la política de privacidad de tu web.",
      },
      languages: {
        title: "Chatea en el idioma de tus visitantes",
        summary: "Elige el idioma de cada chatbot y el de Askio.",
        keywords: "idioma idiomas francés neerlandés alemán español inglés traducir multilingüe",
        steps: [
          "En el editor, abre {{General}} y elige el {{Idioma}} del chatbot en {{Conversación}}. Los textos propios del chat, como el cuadro de mensaje y el formulario de correo, aparecen en ese idioma.",
          "Al cambiar el idioma también se cambian el mensaje de bienvenida y el texto de ejemplo por defecto. Lo que escribiste tú no cambia, así que traduce también tu {{Mensaje de bienvenida}} y tus preguntas.",
          "Con las respuestas de IA activadas, el chatbot responde a cada visitante en el idioma en que escribe.",
          "Para cambiar el idioma de Askio, ve a [Ajustes](/settings), luego {{Apariencia}} y luego {{Idioma}}. Se guarda en tu cuenta y te sigue en todos tus dispositivos.",
        ],
        tip: "¿Tu web está en dos idiomas? Crea un chatbot por idioma y añade cada uno a su versión de la web.",
      },
    },
    faqs: [
      {
        q: "El chatbot no aparece en mi sitio web",
        a: "Comprueba que el código está dentro del `<body>` de cada página, que el chatbot está activo (no en pausa) en tu panel, y borra la caché de tu sitio si usa una. Algunos creadores de sitios solo muestran el código personalizado en el sitio publicado, no en la vista previa de su editor.",
      },
      {
        q: "Mis cambios no se ven en mi sitio",
        a: "Asegúrate de haber hecho clic en {{Guardar cambios}} y recarga tu sitio. Los cambios se aplican automáticamente; no necesitas actualizar el código.",
      },
      {
        q: "El chatbot da una respuesta incorrecta",
        a: "Reescribe la pregunta para que coincida con cómo la formulan los visitantes, o añade una segunda pregunta con otra formulación. Para las respuestas de IA, asegúrate de que tus preguntas y respuestas cubren el tema y ajusta las {{Instrucciones}} en la pestaña {{Personalidad de IA}}.",
      },
      {
        q: "Las respuestas de IA dejaron de funcionar",
        a: "Puede que hayas agotado las respuestas de IA de este mes. Tu panel muestra tu uso; tus chatbots responden con tus preguntas y respuestas hasta que el límite se reinicia el día 1 del mes.",
      },
      {
        q: "Shopify dice que la app no está aprobada",
        a: "Askio todavía está en revisión por parte de Shopify. Puedes continuar con seguridad: haz clic en «Install unlisted app» al final de la página de Shopify.",
      },
    ],
  },
};
