import type { Lang } from "../../i18n";

// Starter questions for a first chatbot, by kind of business, in each app
// language. Text in [square brackets] is for the owner to replace; onboarding
// flags it until they do.

export interface Starter {
  id: string;
  label: string;
  hint: string;
  welcome: string;
  faqs: { question: string; answer: string }[];
}

export const BLANK_ID = "blank";

const en: Starter[] = [
  {
    id: "store",
    label: "Online store",
    hint: "Shipping, returns, payments",
    welcome: "Hi! Looking for something, or have a question about an order?",
    faqs: [
      { question: "How long does shipping take?", answer: "Orders ship within [1–2] business days. Delivery usually takes [3–5] business days." },
      { question: "How much does shipping cost?", answer: "Shipping is [free on orders over $50]. Otherwise it's [$5], shown at checkout." },
      { question: "Can I return or exchange an item?", answer: "Yes. You can return unused items within [30] days. Start a return at [link or email]." },
      { question: "How can I track my order?", answer: "You'll get a tracking link by email as soon as your order ships. Check your spam folder if you can't find it." },
      { question: "Which payment methods do you accept?", answer: "We accept [Visa, Mastercard, PayPal and cash on delivery]." },
      { question: "Do you ship internationally?", answer: "We ship to [list of countries]. Costs and delivery times are shown at checkout." },
      { question: "How can I contact you?", answer: "Email us at [your email] or message us on [WhatsApp number]. We reply within [24 hours]." },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurant or café",
    hint: "Hours, bookings, menu",
    welcome: "Hi! Want to book a table or check our hours?",
    faqs: [
      { question: "What are your opening hours?", answer: "We're open [Monday to Saturday, 12pm–11pm]. We're closed on [Sundays]." },
      { question: "Can I book a table?", answer: "Yes. Book at [booking link] or call us on [phone number]." },
      { question: "Where are you located?", answer: "We're at [address]. [Parking is available nearby.]" },
      { question: "Do you deliver or do takeaway?", answer: "Yes, order takeaway by phone or get delivery through [delivery apps]." },
      { question: "Do you have vegetarian or vegan options?", answer: "Yes. Vegetarian and vegan dishes are marked on our menu: [menu link]." },
      { question: "Do you cater for allergies?", answer: "Please tell us about any allergies when you order and we'll do our best to help." },
    ],
  },
  {
    id: "beauty",
    label: "Salon, spa or clinic",
    hint: "Appointments, prices, services",
    welcome: "Hi! Would you like to book an appointment or ask about a treatment?",
    faqs: [
      { question: "How do I book an appointment?", answer: "Book online at [booking link] or call us on [phone number]." },
      { question: "What are your prices?", answer: "You'll find our full price list here: [link]. [Haircuts start at $30.]" },
      { question: "What are your opening hours?", answer: "We're open [Tuesday to Saturday, 9am–7pm]." },
      { question: "Can I cancel or reschedule?", answer: "Yes, free of charge up to [24 hours] before your appointment." },
      { question: "Where are you located?", answer: "We're at [address]." },
      { question: "Do you sell gift cards?", answer: "Yes. Buy them [in the salon or online at link]." },
    ],
  },
  {
    id: "services",
    label: "Local services",
    hint: "Quotes, areas, availability",
    welcome: "Hi! Need a quote or want to know if we cover your area?",
    faqs: [
      { question: "Which areas do you cover?", answer: "We work in [city and nearby areas]." },
      { question: "How do I get a quote?", answer: "Tell us what you need at [contact link or phone] and we'll send a free quote within [24 hours]." },
      { question: "How much do you charge?", answer: "Prices depend on the job. [Most visits start at $X.] We always confirm the price before we start." },
      { question: "How soon can you come?", answer: "We usually book visits within [2–3 days], and offer [same-day emergency visits]." },
      { question: "Are you insured?", answer: "Yes, we're [fully insured and licensed]." },
      { question: "How can I pay?", answer: "We accept [cash, card and bank transfer]." },
    ],
  },
  {
    id: "agency",
    label: "Agency or freelancer",
    hint: "Services, pricing, process",
    welcome: "Hi! Tell me about your project, or ask how we work.",
    faqs: [
      { question: "What services do you offer?", answer: "We do [web design, branding and marketing] for [small businesses]." },
      { question: "How much does a project cost?", answer: "Projects usually start at [$X]. Tell us what you need and we'll send a clear quote." },
      { question: "How long does a project take?", answer: "Most projects take [2–6 weeks], depending on the scope." },
      { question: "Can I see your past work?", answer: "Yes, see our portfolio at [link]." },
      { question: "How do we get started?", answer: "Book a free call at [booking link] and we'll talk through your project." },
    ],
  },
];

const fr: Starter[] = [
  {
    id: "store",
    label: "Boutique en ligne",
    hint: "Livraison, retours, paiements",
    welcome: "Bonjour ! Vous cherchez quelque chose ou avez une question sur une commande ?",
    faqs: [
      { question: "Quels sont les délais de livraison ?", answer: "Les commandes sont expédiées sous [1 à 2] jours ouvrés. La livraison prend généralement [3 à 5] jours ouvrés." },
      { question: "Combien coûte la livraison ?", answer: "La livraison est [offerte dès 50 € d'achat]. Sinon, elle coûte [5 €], affichés au moment du paiement." },
      { question: "Puis-je retourner ou échanger un article ?", answer: "Oui. Vous pouvez retourner les articles non utilisés sous [30] jours. Faites votre demande de retour via [lien ou e-mail]." },
      { question: "Comment suivre ma commande ?", answer: "Vous recevez un lien de suivi par e-mail dès l'expédition de votre commande. Pensez à vérifier vos spams si vous ne le trouvez pas." },
      { question: "Quels moyens de paiement acceptez-vous ?", answer: "Nous acceptons [Visa, Mastercard, PayPal et le paiement à la livraison]." },
      { question: "Livrez-vous à l'étranger ?", answer: "Nous livrons dans les pays suivants : [liste des pays]. Les frais et délais sont indiqués au moment du paiement." },
      { question: "Comment vous contacter ?", answer: "Écrivez-nous à [votre e-mail] ou sur WhatsApp au [numéro WhatsApp]. Nous répondons sous [24 heures]." },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurant ou café",
    hint: "Horaires, réservations, carte",
    welcome: "Bonjour ! Vous souhaitez réserver une table ou connaître nos horaires ?",
    faqs: [
      { question: "Quels sont vos horaires d'ouverture ?", answer: "Nous sommes ouverts [du lundi au samedi, de 12 h à 23 h]. Nous sommes fermés [le dimanche]." },
      { question: "Puis-je réserver une table ?", answer: "Oui. Réservez sur [lien de réservation] ou appelez-nous au [numéro de téléphone]." },
      { question: "Où êtes-vous situés ?", answer: "Nous sommes au [adresse]. [Un parking se trouve à proximité.]" },
      { question: "Faites-vous la livraison ou la vente à emporter ?", answer: "Oui, commandez à emporter par téléphone ou faites-vous livrer via [applications de livraison]." },
      { question: "Proposez-vous des plats végétariens ou végans ?", answer: "Oui. Les plats végétariens et végans sont indiqués sur notre carte : [lien vers la carte]." },
      { question: "Tenez-vous compte des allergies ?", answer: "Signalez-nous vos allergies lors de votre commande et nous ferons de notre mieux pour vous accompagner." },
    ],
  },
  {
    id: "beauty",
    label: "Salon, spa ou cabinet",
    hint: "Rendez-vous, tarifs, prestations",
    welcome: "Bonjour ! Vous souhaitez prendre rendez-vous ou en savoir plus sur un soin ?",
    faqs: [
      { question: "Comment prendre rendez-vous ?", answer: "Réservez en ligne sur [lien de réservation] ou appelez-nous au [numéro de téléphone]." },
      { question: "Quels sont vos tarifs ?", answer: "Retrouvez tous nos tarifs ici : [lien]. [Les coupes commencent à 30 €.]" },
      { question: "Quels sont vos horaires d'ouverture ?", answer: "Nous sommes ouverts [du mardi au samedi, de 9 h à 19 h]." },
      { question: "Puis-je annuler ou déplacer mon rendez-vous ?", answer: "Oui, gratuitement jusqu'à [24 heures] avant votre rendez-vous." },
      { question: "Où êtes-vous situés ?", answer: "Nous sommes au [adresse]." },
      { question: "Vendez-vous des cartes cadeaux ?", answer: "Oui. Vous pouvez les acheter [au salon ou en ligne sur lien]." },
    ],
  },
  {
    id: "services",
    label: "Services de proximité",
    hint: "Devis, zones, disponibilités",
    welcome: "Bonjour ! Besoin d'un devis ou de savoir si nous intervenons chez vous ?",
    faqs: [
      { question: "Dans quelles zones intervenez-vous ?", answer: "Nous intervenons à [ville et alentours]." },
      { question: "Comment obtenir un devis ?", answer: "Décrivez-nous votre besoin via [lien de contact ou téléphone] et nous vous envoyons un devis gratuit sous [24 heures]." },
      { question: "Quels sont vos tarifs ?", answer: "Le prix dépend de l'intervention. [La plupart des déplacements commencent à X €.] Nous confirmons toujours le prix avant de commencer." },
      { question: "Dans quels délais pouvez-vous venir ?", answer: "Nous intervenons généralement sous [2 à 3 jours] et proposons [des dépannages d'urgence le jour même]." },
      { question: "Êtes-vous assurés ?", answer: "Oui, nous sommes [entièrement assurés et certifiés]." },
      { question: "Comment puis-je payer ?", answer: "Nous acceptons [les espèces, la carte bancaire et le virement]." },
    ],
  },
  {
    id: "agency",
    label: "Agence ou freelance",
    hint: "Services, tarifs, méthode",
    welcome: "Bonjour ! Parlez-moi de votre projet ou demandez-moi comment nous travaillons.",
    faqs: [
      { question: "Quels services proposez-vous ?", answer: "Nous faisons [du webdesign, de l'identité visuelle et du marketing] pour [les petites entreprises]." },
      { question: "Combien coûte un projet ?", answer: "Nos projets commencent généralement à [X €]. Décrivez-nous votre besoin et nous vous enverrons un devis clair." },
      { question: "Combien de temps dure un projet ?", answer: "La plupart des projets prennent [2 à 6 semaines], selon leur ampleur." },
      { question: "Puis-je voir vos réalisations ?", answer: "Oui, découvrez notre portfolio sur [lien]." },
      { question: "Comment démarrer ?", answer: "Réservez un appel gratuit sur [lien de réservation] et nous parlerons de votre projet." },
    ],
  },
];

const nl: Starter[] = [
  {
    id: "store",
    label: "Webshop",
    hint: "Verzending, retouren, betalen",
    welcome: "Hoi! Ben je iets aan het zoeken, of heb je een vraag over een bestelling?",
    faqs: [
      { question: "Hoe lang duurt de verzending?", answer: "Bestellingen worden binnen [1–2] werkdagen verzonden. De levering duurt meestal [3–5] werkdagen." },
      { question: "Wat kost de verzending?", answer: "Verzending is [gratis bij bestellingen vanaf €50]. Anders kost het [€5], dat zie je bij het afrekenen." },
      { question: "Kan ik een artikel retourneren of ruilen?", answer: "Ja. Je kunt ongebruikte artikelen binnen [30] dagen retourneren. Meld je retour aan via [link of e-mail]." },
      { question: "Hoe kan ik mijn bestelling volgen?", answer: "Zodra je bestelling is verzonden, krijg je een track-and-trace-link per e-mail. Kun je hem niet vinden? Kijk dan even in je spammap." },
      { question: "Welke betaalmethoden accepteren jullie?", answer: "We accepteren [iDEAL, Visa, Mastercard en PayPal]." },
      { question: "Verzenden jullie ook naar het buitenland?", answer: "We verzenden naar [lijst van landen]. Kosten en levertijden zie je bij het afrekenen." },
      { question: "Hoe kan ik contact met jullie opnemen?", answer: "Mail ons op [je e-mailadres] of stuur een bericht via WhatsApp naar [WhatsApp-nummer]. We reageren binnen [24 uur]." },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurant of café",
    hint: "Openingstijden, reserveren, menu",
    welcome: "Hoi! Wil je een tafel reserveren of onze openingstijden bekijken?",
    faqs: [
      { question: "Wat zijn jullie openingstijden?", answer: "We zijn open [van maandag tot en met zaterdag, 12.00–23.00 uur]. Op [zondag] zijn we gesloten." },
      { question: "Kan ik een tafel reserveren?", answer: "Ja. Reserveer via [reserveringslink] of bel ons op [telefoonnummer]." },
      { question: "Waar zitten jullie?", answer: "Je vindt ons op [adres]. [Er is parkeergelegenheid in de buurt.]" },
      { question: "Bezorgen jullie of kan ik afhalen?", answer: "Ja, bestel telefonisch om af te halen of laat bezorgen via [bezorgapps]." },
      { question: "Hebben jullie vegetarische of veganistische gerechten?", answer: "Ja. Vegetarische en veganistische gerechten staan aangegeven op ons menu: [link naar menu]." },
      { question: "Houden jullie rekening met allergieën?", answer: "Laat het ons weten als je allergieën hebt wanneer je bestelt, dan doen we ons best om je te helpen." },
    ],
  },
  {
    id: "beauty",
    label: "Salon, spa of kliniek",
    hint: "Afspraken, prijzen, behandelingen",
    welcome: "Hoi! Wil je een afspraak maken of iets vragen over een behandeling?",
    faqs: [
      { question: "Hoe maak ik een afspraak?", answer: "Boek online via [boekingslink] of bel ons op [telefoonnummer]." },
      { question: "Wat zijn jullie prijzen?", answer: "Onze volledige prijslijst vind je hier: [link]. [Knippen kan vanaf €30.]" },
      { question: "Wat zijn jullie openingstijden?", answer: "We zijn open [van dinsdag tot en met zaterdag, 9.00–19.00 uur]." },
      { question: "Kan ik mijn afspraak annuleren of verzetten?", answer: "Ja, kosteloos tot [24 uur] voor je afspraak." },
      { question: "Waar zitten jullie?", answer: "Je vindt ons op [adres]." },
      { question: "Verkopen jullie cadeaubonnen?", answer: "Ja. Je koopt ze [in de salon of online via link]." },
    ],
  },
  {
    id: "services",
    label: "Lokale diensten",
    hint: "Offertes, regio's, beschikbaarheid",
    welcome: "Hoi! Wil je een offerte of weten of we in jouw regio werken?",
    faqs: [
      { question: "In welke regio's werken jullie?", answer: "We werken in [stad en omgeving]." },
      { question: "Hoe vraag ik een offerte aan?", answer: "Vertel ons wat je nodig hebt via [contactlink of telefoon], dan sturen we binnen [24 uur] een gratis offerte." },
      { question: "Wat kost het?", answer: "De prijs hangt af van de klus. [De meeste bezoeken beginnen vanaf €X.] We spreken de prijs altijd af voordat we beginnen." },
      { question: "Hoe snel kunnen jullie komen?", answer: "Meestal plannen we een bezoek binnen [2–3 dagen] en we bieden [spoedbezoeken op dezelfde dag]." },
      { question: "Zijn jullie verzekerd?", answer: "Ja, we zijn [volledig verzekerd en gecertificeerd]." },
      { question: "Hoe kan ik betalen?", answer: "We accepteren [contant, pin en bankoverschrijving]." },
    ],
  },
  {
    id: "agency",
    label: "Bureau of freelancer",
    hint: "Diensten, prijzen, werkwijze",
    welcome: "Hoi! Vertel me over je project, of vraag hoe we werken.",
    faqs: [
      { question: "Welke diensten bieden jullie aan?", answer: "We doen [webdesign, branding en marketing] voor [kleine bedrijven]." },
      { question: "Wat kost een project?", answer: "Projecten beginnen meestal vanaf [€X]. Vertel ons wat je nodig hebt, dan sturen we een duidelijke offerte." },
      { question: "Hoe lang duurt een project?", answer: "De meeste projecten duren [2–6 weken], afhankelijk van de omvang." },
      { question: "Kan ik eerder werk van jullie zien?", answer: "Ja, bekijk ons portfolio op [link]." },
      { question: "Hoe beginnen we?", answer: "Plan een gratis gesprek via [boekingslink], dan bespreken we je project." },
    ],
  },
];

const de: Starter[] = [
  {
    id: "store",
    label: "Onlineshop",
    hint: "Versand, Rückgabe, Zahlung",
    welcome: "Hallo! Suchen Sie etwas oder haben Sie eine Frage zu einer Bestellung?",
    faqs: [
      { question: "Wie lange dauert der Versand?", answer: "Bestellungen werden innerhalb von [1–2] Werktagen verschickt. Die Lieferung dauert meist [3–5] Werktage." },
      { question: "Was kostet der Versand?", answer: "Der Versand ist [ab 50 € Bestellwert kostenlos]. Sonst kostet er [5 €], angezeigt an der Kasse." },
      { question: "Kann ich einen Artikel zurückgeben oder umtauschen?", answer: "Ja. Unbenutzte Artikel können Sie innerhalb von [30] Tagen zurückgeben. Starten Sie die Rücksendung über [Link oder E-Mail]." },
      { question: "Wie kann ich meine Bestellung verfolgen?", answer: "Sobald Ihre Bestellung verschickt ist, erhalten Sie einen Tracking-Link per E-Mail. Falls Sie ihn nicht finden, sehen Sie bitte in Ihrem Spam-Ordner nach." },
      { question: "Welche Zahlungsarten akzeptieren Sie?", answer: "Wir akzeptieren [Visa, Mastercard, PayPal und Rechnung]." },
      { question: "Liefern Sie auch ins Ausland?", answer: "Wir liefern nach [Liste der Länder]. Kosten und Lieferzeiten sehen Sie an der Kasse." },
      { question: "Wie kann ich Sie kontaktieren?", answer: "Schreiben Sie uns an [Ihre E-Mail] oder per WhatsApp an [WhatsApp-Nummer]. Wir antworten innerhalb von [24 Stunden]." },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurant oder Café",
    hint: "Öffnungszeiten, Reservierung, Speisekarte",
    welcome: "Hallo! Möchten Sie einen Tisch reservieren oder unsere Öffnungszeiten wissen?",
    faqs: [
      { question: "Wann haben Sie geöffnet?", answer: "Wir haben [Montag bis Samstag, 12–23 Uhr] geöffnet. [Sonntags] ist Ruhetag." },
      { question: "Kann ich einen Tisch reservieren?", answer: "Ja. Reservieren Sie über [Reservierungslink] oder rufen Sie uns an unter [Telefonnummer]." },
      { question: "Wo finde ich Sie?", answer: "Sie finden uns in der [Adresse]. [Parkplätze gibt es in der Nähe.]" },
      { question: "Liefern Sie oder gibt es etwas zum Mitnehmen?", answer: "Ja, bestellen Sie telefonisch zum Mitnehmen oder lassen Sie über [Liefer-Apps] liefern." },
      { question: "Haben Sie vegetarische oder vegane Gerichte?", answer: "Ja. Vegetarische und vegane Gerichte sind auf unserer Speisekarte gekennzeichnet: [Link zur Speisekarte]." },
      { question: "Nehmen Sie Rücksicht auf Allergien?", answer: "Bitte nennen Sie uns Ihre Allergien bei der Bestellung, dann tun wir unser Bestes." },
    ],
  },
  {
    id: "beauty",
    label: "Salon, Spa oder Praxis",
    hint: "Termine, Preise, Leistungen",
    welcome: "Hallo! Möchten Sie einen Termin buchen oder etwas zu einer Behandlung fragen?",
    faqs: [
      { question: "Wie buche ich einen Termin?", answer: "Buchen Sie online über [Buchungslink] oder rufen Sie uns an unter [Telefonnummer]." },
      { question: "Was kosten Ihre Leistungen?", answer: "Unsere vollständige Preisliste finden Sie hier: [Link]. [Haarschnitte gibt es ab 30 €.]" },
      { question: "Wann haben Sie geöffnet?", answer: "Wir haben [Dienstag bis Samstag, 9–19 Uhr] geöffnet." },
      { question: "Kann ich einen Termin absagen oder verschieben?", answer: "Ja, kostenlos bis [24 Stunden] vor Ihrem Termin." },
      { question: "Wo finde ich Sie?", answer: "Sie finden uns in der [Adresse]." },
      { question: "Verkaufen Sie Gutscheine?", answer: "Ja. Sie erhalten sie [im Salon oder online unter Link]." },
    ],
  },
  {
    id: "services",
    label: "Lokale Dienstleistungen",
    hint: "Angebote, Gebiete, Verfügbarkeit",
    welcome: "Hallo! Brauchen Sie ein Angebot oder möchten Sie wissen, ob wir in Ihrer Gegend arbeiten?",
    faqs: [
      { question: "In welchen Gebieten sind Sie tätig?", answer: "Wir arbeiten in [Stadt und Umgebung]." },
      { question: "Wie bekomme ich ein Angebot?", answer: "Beschreiben Sie uns Ihr Anliegen über [Kontaktlink oder Telefon], dann erhalten Sie innerhalb von [24 Stunden] ein kostenloses Angebot." },
      { question: "Was kostet das?", answer: "Der Preis hängt vom Auftrag ab. [Die meisten Einsätze beginnen ab X €.] Wir bestätigen den Preis immer, bevor wir anfangen." },
      { question: "Wie schnell können Sie kommen?", answer: "Meist vereinbaren wir einen Termin innerhalb von [2–3 Tagen] und bieten [Notfalleinsätze am selben Tag] an." },
      { question: "Sind Sie versichert?", answer: "Ja, wir sind [vollständig versichert und zugelassen]." },
      { question: "Wie kann ich bezahlen?", answer: "Wir akzeptieren [Bargeld, Karte und Überweisung]." },
    ],
  },
  {
    id: "agency",
    label: "Agentur oder Freelancer",
    hint: "Leistungen, Preise, Ablauf",
    welcome: "Hallo! Erzählen Sie mir von Ihrem Projekt oder fragen Sie, wie wir arbeiten.",
    faqs: [
      { question: "Welche Leistungen bieten Sie an?", answer: "Wir machen [Webdesign, Branding und Marketing] für [kleine Unternehmen]." },
      { question: "Was kostet ein Projekt?", answer: "Projekte beginnen meist ab [X €]. Sagen Sie uns, was Sie brauchen, und Sie erhalten ein klares Angebot." },
      { question: "Wie lange dauert ein Projekt?", answer: "Die meisten Projekte dauern [2–6 Wochen], je nach Umfang." },
      { question: "Kann ich frühere Arbeiten sehen?", answer: "Ja, unser Portfolio finden Sie unter [Link]." },
      { question: "Wie fangen wir an?", answer: "Buchen Sie ein kostenloses Gespräch über [Buchungslink], dann sprechen wir über Ihr Projekt." },
    ],
  },
];

const es: Starter[] = [
  {
    id: "store",
    label: "Tienda online",
    hint: "Envíos, devoluciones, pagos",
    welcome: "¡Hola! ¿Buscas algo o tienes alguna pregunta sobre un pedido?",
    faqs: [
      { question: "¿Cuánto tarda el envío?", answer: "Los pedidos se envían en [1–2] días laborables. La entrega suele tardar [3–5] días laborables." },
      { question: "¿Cuánto cuesta el envío?", answer: "El envío es [gratis en pedidos de más de 50 €]. Si no, cuesta [5 €], que verás al pagar." },
      { question: "¿Puedo devolver o cambiar un artículo?", answer: "Sí. Puedes devolver los artículos sin usar en un plazo de [30] días. Solicita la devolución en [enlace o correo]." },
      { question: "¿Cómo puedo seguir mi pedido?", answer: "Recibirás un enlace de seguimiento por correo en cuanto se envíe tu pedido. Si no lo encuentras, revisa la carpeta de spam." },
      { question: "¿Qué métodos de pago aceptáis?", answer: "Aceptamos [Visa, Mastercard, PayPal y Bizum]." },
      { question: "¿Hacéis envíos internacionales?", answer: "Enviamos a [lista de países]. Los costes y plazos de entrega aparecen al pagar." },
      { question: "¿Cómo puedo contactar con vosotros?", answer: "Escríbenos a [tu correo] o mándanos un WhatsApp al [número de WhatsApp]. Respondemos en menos de [24 horas]." },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurante o cafetería",
    hint: "Horario, reservas, carta",
    welcome: "¡Hola! ¿Quieres reservar mesa o consultar nuestro horario?",
    faqs: [
      { question: "¿Cuál es vuestro horario?", answer: "Abrimos [de lunes a sábado, de 12:00 a 23:00]. Cerramos [los domingos]." },
      { question: "¿Puedo reservar mesa?", answer: "Sí. Reserva en [enlace de reservas] o llámanos al [número de teléfono]." },
      { question: "¿Dónde estáis?", answer: "Estamos en [dirección]. [Hay aparcamiento cerca.]" },
      { question: "¿Tenéis comida a domicilio o para llevar?", answer: "Sí, pide para llevar por teléfono o a domicilio a través de [apps de reparto]." },
      { question: "¿Tenéis opciones vegetarianas o veganas?", answer: "Sí. Los platos vegetarianos y veganos están señalados en nuestra carta: [enlace a la carta]." },
      { question: "¿Tenéis en cuenta las alergias?", answer: "Avísanos de cualquier alergia al hacer tu pedido y haremos todo lo posible por ayudarte." },
    ],
  },
  {
    id: "beauty",
    label: "Salón, spa o clínica",
    hint: "Citas, precios, servicios",
    welcome: "¡Hola! ¿Quieres pedir cita o preguntar por algún tratamiento?",
    faqs: [
      { question: "¿Cómo pido cita?", answer: "Reserva online en [enlace de reservas] o llámanos al [número de teléfono]." },
      { question: "¿Cuáles son vuestros precios?", answer: "Aquí tienes nuestra lista de precios completa: [enlace]. [Los cortes de pelo empiezan en 30 €.]" },
      { question: "¿Cuál es vuestro horario?", answer: "Abrimos [de martes a sábado, de 9:00 a 19:00]." },
      { question: "¿Puedo cancelar o cambiar mi cita?", answer: "Sí, sin coste hasta [24 horas] antes de tu cita." },
      { question: "¿Dónde estáis?", answer: "Estamos en [dirección]." },
      { question: "¿Vendéis tarjetas regalo?", answer: "Sí. Puedes comprarlas [en el salón o online en enlace]." },
    ],
  },
  {
    id: "services",
    label: "Servicios locales",
    hint: "Presupuestos, zonas, disponibilidad",
    welcome: "¡Hola! ¿Necesitas un presupuesto o quieres saber si trabajamos en tu zona?",
    faqs: [
      { question: "¿En qué zonas trabajáis?", answer: "Trabajamos en [ciudad y alrededores]." },
      { question: "¿Cómo pido un presupuesto?", answer: "Cuéntanos qué necesitas en [enlace de contacto o teléfono] y te enviaremos un presupuesto gratis en menos de [24 horas]." },
      { question: "¿Cuánto cobráis?", answer: "El precio depende del trabajo. [La mayoría de visitas empiezan en X €.] Siempre confirmamos el precio antes de empezar." },
      { question: "¿Cuándo podéis venir?", answer: "Normalmente programamos las visitas en [2–3 días] y ofrecemos [visitas urgentes el mismo día]." },
      { question: "¿Tenéis seguro?", answer: "Sí, contamos con [seguro completo y todas las licencias]." },
      { question: "¿Cómo puedo pagar?", answer: "Aceptamos [efectivo, tarjeta y transferencia bancaria]." },
    ],
  },
  {
    id: "agency",
    label: "Agencia o freelance",
    hint: "Servicios, precios, proceso",
    welcome: "¡Hola! Cuéntame tu proyecto o pregúntame cómo trabajamos.",
    faqs: [
      { question: "¿Qué servicios ofrecéis?", answer: "Hacemos [diseño web, branding y marketing] para [pequeñas empresas]." },
      { question: "¿Cuánto cuesta un proyecto?", answer: "Los proyectos suelen empezar en [X €]. Cuéntanos qué necesitas y te enviaremos un presupuesto claro." },
      { question: "¿Cuánto tarda un proyecto?", answer: "La mayoría de proyectos tardan [2–6 semanas], según el alcance." },
      { question: "¿Puedo ver trabajos anteriores?", answer: "Sí, mira nuestro portfolio en [enlace]." },
      { question: "¿Cómo empezamos?", answer: "Reserva una llamada gratuita en [enlace de reservas] y hablamos de tu proyecto." },
    ],
  },
];

const pt: Starter[] = [
  {
    id: "store",
    label: "Loja online",
    hint: "Entrega, trocas, pagamentos",
    welcome: "Oi! Está procurando algo ou tem uma dúvida sobre um pedido?",
    faqs: [
      {
        question: "Quanto tempo leva a entrega?",
        answer: "Os pedidos são enviados em até [1–2] dias úteis. A entrega costuma levar [3–5] dias úteis.",
      },
      {
        question: "Quanto custa o frete?",
        answer: "O frete é [grátis em compras acima de R$ 200]. Caso contrário, custa [R$ 20], exibido no checkout.",
      },
      {
        question: "Posso devolver ou trocar um produto?",
        answer: "Sim. Você pode devolver produtos sem uso em até [30] dias. Solicite a devolução em [link ou e-mail].",
      },
      {
        question: "Como posso rastrear meu pedido?",
        answer: "Você receberá um link de rastreio por e-mail assim que seu pedido for enviado. Confira a pasta de spam se não o encontrar.",
      },
      {
        question: "Quais formas de pagamento vocês aceitam?",
        answer: "Aceitamos [Pix, cartão de crédito em até 3x e boleto].",
      },
      {
        question: "Vocês entregam fora do Brasil?",
        answer: "Entregamos para [lista de países]. Os custos e prazos aparecem no checkout.",
      },
      {
        question: "Como posso falar com vocês?",
        answer: "Envie um e-mail para [seu e-mail] ou mande uma mensagem no [número de WhatsApp]. Respondemos em até [24 horas].",
      },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurante ou café",
    hint: "Horários, reservas, cardápio",
    welcome: "Oi! Quer reservar uma mesa ou ver nossos horários?",
    faqs: [
      {
        question: "Qual é o horário de funcionamento?",
        answer: "Funcionamos [de segunda a sábado, das 12h às 23h]. Fechamos [aos domingos].",
      },
      {
        question: "Posso reservar uma mesa?",
        answer: "Sim. Reserve em [link de reserva] ou ligue para [número de telefone].",
      },
      {
        question: "Onde vocês ficam?",
        answer: "Estamos em [endereço]. [Há estacionamento nas proximidades.]",
      },
      {
        question: "Vocês fazem entrega ou pedidos para viagem?",
        answer: "Sim, peça para viagem por telefone ou receba em casa pelo [iFood ou outros apps de entrega].",
      },
      {
        question: "Vocês têm opções vegetarianas ou veganas?",
        answer: "Sim. Os pratos vegetarianos e veganos estão indicados no nosso cardápio: [link do cardápio].",
      },
      {
        question: "Vocês atendem quem tem alergias?",
        answer: "Informe suas alergias ao fazer o pedido e faremos o possível para ajudar.",
      },
    ],
  },
  {
    id: "beauty",
    label: "Salão, spa ou clínica",
    hint: "Agendamentos, preços, serviços",
    welcome: "Oi! Quer agendar um horário ou tirar dúvidas sobre um tratamento?",
    faqs: [
      {
        question: "Como faço para agendar?",
        answer: "Agende online em [link de agendamento] ou ligue para [número de telefone].",
      },
      {
        question: "Quais são os preços?",
        answer: "Nossa tabela de preços completa está aqui: [link]. [Cortes a partir de R$ 60.]",
      },
      {
        question: "Qual é o horário de funcionamento?",
        answer: "Funcionamos [de terça a sábado, das 9h às 19h].",
      },
      {
        question: "Posso cancelar ou remarcar?",
        answer: "Sim, sem custo até [24 horas] antes do seu horário.",
      },
      {
        question: "Onde vocês ficam?",
        answer: "Estamos em [endereço].",
      },
      {
        question: "Vocês vendem vale-presente?",
        answer: "Sim. Compre [no salão ou online em link].",
      },
    ],
  },
  {
    id: "services",
    label: "Serviços locais",
    hint: "Orçamentos, regiões, disponibilidade",
    welcome: "Oi! Precisa de um orçamento ou quer saber se atendemos sua região?",
    faqs: [
      {
        question: "Quais regiões vocês atendem?",
        answer: "Atendemos [cidade e região].",
      },
      {
        question: "Como faço para pedir um orçamento?",
        answer: "Conte o que você precisa em [link de contato ou telefone] e enviaremos um orçamento gratuito em até [24 horas].",
      },
      {
        question: "Quanto vocês cobram?",
        answer: "O preço depende do serviço. [A maioria das visitas começa em R$ X.] Sempre confirmamos o valor antes de começar.",
      },
      {
        question: "Em quanto tempo vocês podem vir?",
        answer: "Normalmente agendamos visitas em [2–3 dias] e oferecemos [atendimento de emergência no mesmo dia].",
      },
      {
        question: "Vocês têm seguro?",
        answer: "Sim, somos [profissionais registrados e com seguro].",
      },
      {
        question: "Como posso pagar?",
        answer: "Aceitamos [Pix, dinheiro, cartão e transferência bancária].",
      },
    ],
  },
  {
    id: "agency",
    label: "Agência ou freelancer",
    hint: "Serviços, preços, processo",
    welcome: "Oi! Conte sobre seu projeto ou pergunte como trabalhamos.",
    faqs: [
      {
        question: "Quais serviços vocês oferecem?",
        answer: "Fazemos [web design, branding e marketing] para [pequenas empresas].",
      },
      {
        question: "Quanto custa um projeto?",
        answer: "Os projetos geralmente começam em [R$ X]. Conte o que você precisa e enviaremos um orçamento claro.",
      },
      {
        question: "Quanto tempo leva um projeto?",
        answer: "A maioria dos projetos leva [2–6 semanas], dependendo do escopo.",
      },
      {
        question: "Posso ver trabalhos anteriores?",
        answer: "Sim, veja nosso portfólio em [link].",
      },
      {
        question: "Como começamos?",
        answer: "Agende uma conversa gratuita em [link de agendamento] e falaremos sobre o seu projeto.",
      },
    ],
  },
];

const it: Starter[] = [
  {
    id: "store",
    label: "Negozio online",
    hint: "Spedizioni, resi, pagamenti",
    welcome: "Ciao! Stai cercando qualcosa o hai una domanda su un ordine?",
    faqs: [
      {
        question: "Quanto tempo richiede la spedizione?",
        answer: "Gli ordini vengono spediti entro [1–2] giorni lavorativi. La consegna richiede di solito [3–5] giorni lavorativi.",
      },
      {
        question: "Quanto costa la spedizione?",
        answer: "La spedizione è [gratuita per ordini superiori a 50 €]. Altrimenti costa [5 €], indicati al momento del pagamento.",
      },
      {
        question: "Posso restituire o cambiare un articolo?",
        answer: "Sì. Puoi restituire gli articoli non usati entro [30] giorni. Avvia un reso su [link o email].",
      },
      {
        question: "Come posso tracciare il mio ordine?",
        answer: "Riceverai un link di tracciamento via email appena il tuo ordine viene spedito. Se non lo trovi, controlla la cartella spam.",
      },
      {
        question: "Quali metodi di pagamento accettate?",
        answer: "Accettiamo [Visa, Mastercard, PayPal e contrassegno].",
      },
      {
        question: "Spedite all'estero?",
        answer: "Spediamo in [elenco dei paesi]. Costi e tempi di consegna sono indicati al momento del pagamento.",
      },
      {
        question: "Come posso contattarvi?",
        answer: "Scrivici a [la tua email] o mandaci un messaggio su [numero WhatsApp]. Rispondiamo entro [24 ore].",
      },
    ],
  },
  {
    id: "restaurant",
    label: "Ristorante o bar",
    hint: "Orari, prenotazioni, menu",
    welcome: "Ciao! Vuoi prenotare un tavolo o conoscere i nostri orari?",
    faqs: [
      {
        question: "Quali sono i vostri orari di apertura?",
        answer: "Siamo aperti [dal lunedì al sabato, 12:00–23:00]. Siamo chiusi [la domenica].",
      },
      {
        question: "Posso prenotare un tavolo?",
        answer: "Sì. Prenota su [link di prenotazione] o chiamaci al [numero di telefono].",
      },
      {
        question: "Dove vi trovate?",
        answer: "Siamo in [indirizzo]. [C'è parcheggio nelle vicinanze.]",
      },
      {
        question: "Fate consegne a domicilio o asporto?",
        answer: "Sì, ordina da asporto per telefono o ricevi a domicilio tramite [app di consegna].",
      },
      {
        question: "Avete opzioni vegetariane o vegane?",
        answer: "Sì. I piatti vegetariani e vegani sono indicati nel nostro menu: [link al menu].",
      },
      {
        question: "Tenete conto delle allergie?",
        answer: "Segnalaci eventuali allergie quando ordini e faremo del nostro meglio per aiutarti.",
      },
    ],
  },
  {
    id: "beauty",
    label: "Salone, spa o centro estetico",
    hint: "Appuntamenti, prezzi, servizi",
    welcome: "Ciao! Vuoi prenotare un appuntamento o chiedere informazioni su un trattamento?",
    faqs: [
      {
        question: "Come prenoto un appuntamento?",
        answer: "Prenota online su [link di prenotazione] o chiamaci al [numero di telefono].",
      },
      {
        question: "Quali sono i vostri prezzi?",
        answer: "Trovi il listino prezzi completo qui: [link]. [I tagli partono da 30 €.]",
      },
      {
        question: "Quali sono i vostri orari di apertura?",
        answer: "Siamo aperti [dal martedì al sabato, 9:00–19:00].",
      },
      {
        question: "Posso disdire o spostare un appuntamento?",
        answer: "Sì, gratuitamente fino a [24 ore] prima dell'appuntamento.",
      },
      {
        question: "Dove vi trovate?",
        answer: "Siamo in [indirizzo].",
      },
      {
        question: "Vendete buoni regalo?",
        answer: "Sì. Puoi acquistarli [in salone o online su link].",
      },
    ],
  },
  {
    id: "services",
    label: "Servizi locali",
    hint: "Preventivi, zone, disponibilità",
    welcome: "Ciao! Ti serve un preventivo o vuoi sapere se copriamo la tua zona?",
    faqs: [
      {
        question: "Quali zone coprite?",
        answer: "Lavoriamo a [città e dintorni].",
      },
      {
        question: "Come ottengo un preventivo?",
        answer: "Dicci di cosa hai bisogno su [link di contatto o telefono] e ti invieremo un preventivo gratuito entro [24 ore].",
      },
      {
        question: "Quanto costate?",
        answer: "I prezzi dipendono dal lavoro. [La maggior parte degli interventi parte da X €.] Confermiamo sempre il prezzo prima di iniziare.",
      },
      {
        question: "Quanto presto potete venire?",
        answer: "Di solito fissiamo gli interventi entro [2–3 giorni] e offriamo [interventi d'urgenza in giornata].",
      },
      {
        question: "Siete assicurati?",
        answer: "Sì, siamo [pienamente assicurati e abilitati].",
      },
      {
        question: "Come posso pagare?",
        answer: "Accettiamo [contanti, carta e bonifico].",
      },
    ],
  },
  {
    id: "agency",
    label: "Agenzia o freelance",
    hint: "Servizi, prezzi, metodo",
    welcome: "Ciao! Raccontami il tuo progetto o chiedimi come lavoriamo.",
    faqs: [
      {
        question: "Quali servizi offrite?",
        answer: "Ci occupiamo di [web design, branding e marketing] per [piccole imprese].",
      },
      {
        question: "Quanto costa un progetto?",
        answer: "I progetti partono di solito da [X €]. Dicci di cosa hai bisogno e ti invieremo un preventivo chiaro.",
      },
      {
        question: "Quanto dura un progetto?",
        answer: "La maggior parte dei progetti richiede [2–6 settimane], a seconda della portata.",
      },
      {
        question: "Posso vedere i vostri lavori precedenti?",
        answer: "Sì, guarda il nostro portfolio su [link].",
      },
      {
        question: "Come iniziamo?",
        answer: "Prenota una chiamata gratuita su [link di prenotazione] e parleremo del tuo progetto.",
      },
    ],
  },
];

const ar: Starter[] = [
  {
    id: "store",
    label: "متجر إلكتروني",
    hint: "الشحن، الإرجاع، الدفع",
    welcome: "مرحبًا! هل تبحث عن شيء ما، أو لديك سؤال عن طلب؟",
    faqs: [
      {
        question: "كم يستغرق الشحن؟",
        answer: "تُشحن الطلبات خلال [1–2] يوم عمل. ويستغرق التوصيل عادةً [3–5] أيام عمل.",
      },
      {
        question: "كم تكلفة الشحن؟",
        answer: "الشحن [مجاني للطلبات التي تتجاوز 500 درهم]. وإلا فتكلفته [30 درهمًا]، وتظهر عند الدفع.",
      },
      {
        question: "هل يمكنني إرجاع منتج أو استبداله؟",
        answer: "نعم. يمكنك إرجاع المنتجات غير المستخدمة خلال [30] يومًا. ابدأ الإرجاع عبر [الرابط أو البريد الإلكتروني].",
      },
      {
        question: "كيف يمكنني تتبع طلبي؟",
        answer: "ستصلك رسالة بريد إلكتروني فيها رابط التتبع فور شحن طلبك. تحقّق من مجلد الرسائل غير المرغوب فيها إن لم تجدها.",
      },
      {
        question: "ما طرق الدفع المتاحة؟",
        answer: "نقبل [Visa وMastercard وPayPal والدفع عند الاستلام].",
      },
      {
        question: "هل تشحنون إلى الخارج؟",
        answer: "نشحن إلى [قائمة الدول]. تظهر التكاليف ومدة التوصيل عند الدفع.",
      },
      {
        question: "كيف يمكنني التواصل معكم؟",
        answer: "راسلنا على [بريدك الإلكتروني] أو على [رقم WhatsApp]. نرد خلال [24 ساعة].",
      },
    ],
  },
  {
    id: "restaurant",
    label: "مطعم أو مقهى",
    hint: "المواعيد، الحجوزات، القائمة",
    welcome: "مرحبًا! هل تريد حجز طاولة أو معرفة مواعيد العمل؟",
    faqs: [
      {
        question: "ما ساعات العمل لديكم؟",
        answer: "نفتح [من الاثنين إلى السبت، 12 ظهرًا–11 مساءً]. ونغلق [يوم الأحد].",
      },
      {
        question: "هل يمكنني حجز طاولة؟",
        answer: "نعم. احجز عبر [رابط الحجز] أو اتصل بنا على [رقم الهاتف].",
      },
      {
        question: "أين موقعكم؟",
        answer: "نحن في [العنوان]. [يتوفر موقف سيارات قريب.]",
      },
      {
        question: "هل تقدمون التوصيل أو الطلبات الخارجية؟",
        answer: "نعم، اطلب طلبك الخارجي عبر الهاتف أو احصل على التوصيل عبر [تطبيقات التوصيل].",
      },
      {
        question: "هل لديكم خيارات نباتية؟",
        answer: "نعم. الأطباق النباتية والخالية من المنتجات الحيوانية مميّزة في قائمتنا: [رابط القائمة].",
      },
      {
        question: "هل تراعون الحساسية الغذائية؟",
        answer: "يُرجى إخبارنا بأي حساسية عند الطلب وسنبذل قصارى جهدنا للمساعدة.",
      },
    ],
  },
  {
    id: "beauty",
    label: "صالون أو سبا أو عيادة",
    hint: "المواعيد، الأسعار، الخدمات",
    welcome: "مرحبًا! هل تريد حجز موعد أو السؤال عن علاج؟",
    faqs: [
      {
        question: "كيف أحجز موعدًا؟",
        answer: "احجز عبر الإنترنت على [رابط الحجز] أو اتصل بنا على [رقم الهاتف].",
      },
      {
        question: "ما أسعاركم؟",
        answer: "تجد قائمة أسعارنا الكاملة هنا: [الرابط]. [تبدأ قصّات الشعر من 100 درهم.]",
      },
      {
        question: "ما ساعات العمل لديكم؟",
        answer: "نفتح [من الثلاثاء إلى السبت، 9 صباحًا–7 مساءً].",
      },
      {
        question: "هل يمكنني الإلغاء أو تغيير الموعد؟",
        answer: "نعم، مجانًا حتى [24 ساعة] قبل موعدك.",
      },
      {
        question: "أين موقعكم؟",
        answer: "نحن في [العنوان].",
      },
      {
        question: "هل تبيعون بطاقات الهدايا؟",
        answer: "نعم. اشترِها [في الصالون أو عبر الإنترنت على الرابط].",
      },
    ],
  },
  {
    id: "services",
    label: "خدمات محلية",
    hint: "عروض الأسعار، المناطق، التوفر",
    welcome: "مرحبًا! هل تحتاج إلى عرض سعر أو تريد معرفة إن كنا نغطي منطقتك؟",
    faqs: [
      {
        question: "ما المناطق التي تغطونها؟",
        answer: "نعمل في [المدينة والمناطق المجاورة].",
      },
      {
        question: "كيف أحصل على عرض سعر؟",
        answer: "أخبرنا بما تحتاج إليه عبر [رابط التواصل أو الهاتف] وسنرسل إليك عرض سعر مجانيًا خلال [24 ساعة].",
      },
      {
        question: "كم تتقاضون؟",
        answer: "تعتمد الأسعار على العمل. [تبدأ معظم الزيارات من X درهم.] نؤكد السعر دائمًا قبل البدء.",
      },
      {
        question: "متى يمكنكم الحضور؟",
        answer: "نحجز الزيارات عادةً خلال [2–3 أيام]، ونقدم [زيارات طارئة في اليوم نفسه].",
      },
      {
        question: "هل لديكم تأمين؟",
        answer: "نعم، [لدينا تأمين كامل وترخيص].",
      },
      {
        question: "كيف يمكنني الدفع؟",
        answer: "نقبل [النقد والبطاقة والتحويل البنكي].",
      },
    ],
  },
  {
    id: "agency",
    label: "وكالة أو مستقل",
    hint: "الخدمات، الأسعار، طريقة العمل",
    welcome: "مرحبًا! أخبرني عن مشروعك، أو اسأل عن طريقة عملنا.",
    faqs: [
      {
        question: "ما الخدمات التي تقدمونها؟",
        answer: "نقدم [تصميم المواقع والهوية التجارية والتسويق] لـ [الشركات الصغيرة].",
      },
      {
        question: "كم تكلفة المشروع؟",
        answer: "تبدأ المشاريع عادةً من [X درهم]. أخبرنا بما تحتاج إليه وسنرسل إليك عرض سعر واضحًا.",
      },
      {
        question: "كم يستغرق المشروع؟",
        answer: "تستغرق معظم المشاريع [2–6 أسابيع]، حسب نطاق العمل.",
      },
      {
        question: "هل يمكنني رؤية أعمالكم السابقة؟",
        answer: "نعم، اطّلع على معرض أعمالنا على [الرابط].",
      },
      {
        question: "كيف نبدأ؟",
        answer: "احجز مكالمة مجانية عبر [رابط الحجز] وسنتحدث عن مشروعك.",
      },
    ],
  },
];

const pl: Starter[] = [
  {
    id: "store",
    label: "Sklep internetowy",
    hint: "Wysyłka, zwroty, płatności",
    welcome: "Cześć! Szukasz czegoś albo masz pytanie o zamówienie?",
    faqs: [
      {
        question: "Jak długo trwa wysyłka?",
        answer: "Zamówienia wysyłamy w ciągu [1–2] dni roboczych. Dostawa trwa zwykle [2–3] dni robocze.",
      },
      {
        question: "Ile kosztuje wysyłka?",
        answer: "Wysyłka jest [darmowa przy zamówieniach powyżej 200 zł]. W pozostałych przypadkach kosztuje [15 zł], co zobaczysz przy składaniu zamówienia.",
      },
      {
        question: "Czy mogę zwrócić lub wymienić produkt?",
        answer: "Tak. Nieużywane produkty możesz zwrócić w ciągu [30] dni. Zwrot zgłosisz przez [link lub e-mail].",
      },
      {
        question: "Jak mogę śledzić zamówienie?",
        answer: "Gdy tylko zamówienie zostanie wysłane, otrzymasz e-mailem link do śledzenia przesyłki. Jeśli go nie widzisz, sprawdź folder spam.",
      },
      {
        question: "Jakie formy płatności akceptujecie?",
        answer: "Akceptujemy [BLIK, Visa, Mastercard, PayPal i płatność przy odbiorze].",
      },
      {
        question: "Czy wysyłacie za granicę?",
        answer: "Wysyłamy do [lista krajów]. Koszty i czas dostawy zobaczysz przy składaniu zamówienia.",
      },
      {
        question: "Jak mogę się z Wami skontaktować?",
        answer: "Napisz do nas na [Twój e-mail] lub na WhatsAppie: [numer]. Odpowiadamy w ciągu [24 godzin].",
      },
    ],
  },
  {
    id: "restaurant",
    label: "Restauracja lub kawiarnia",
    hint: "Godziny, rezerwacje, menu",
    welcome: "Cześć! Chcesz zarezerwować stolik albo sprawdzić godziny otwarcia?",
    faqs: [
      {
        question: "W jakich godzinach jesteście otwarci?",
        answer: "Jesteśmy otwarci [od poniedziałku do soboty, 12:00–23:00]. [W niedziele] mamy zamknięte.",
      },
      {
        question: "Czy mogę zarezerwować stolik?",
        answer: "Tak. Zarezerwuj przez [link do rezerwacji] lub zadzwoń pod [numer telefonu].",
      },
      {
        question: "Gdzie się znajdujecie?",
        answer: "Znajdziesz nas pod adresem [adres]. [W pobliżu jest parking.]",
      },
      {
        question: "Czy macie dostawę lub jedzenie na wynos?",
        answer: "Tak, zamów na wynos telefonicznie lub z dostawą przez [aplikacje, np. Pyszne.pl, Glovo].",
      },
      {
        question: "Czy macie dania wegetariańskie lub wegańskie?",
        answer: "Tak. Dania wegetariańskie i wegańskie są oznaczone w menu: [link do menu].",
      },
      {
        question: "Czy uwzględniacie alergie?",
        answer: "Poinformuj nas o alergiach przy zamówieniu, a zrobimy wszystko, żeby pomóc.",
      },
    ],
  },
  {
    id: "beauty",
    label: "Salon, spa lub gabinet",
    hint: "Wizyty, ceny, usługi",
    welcome: "Cześć! Chcesz umówić wizytę albo zapytać o zabieg?",
    faqs: [
      {
        question: "Jak umówić wizytę?",
        answer: "Umów się online przez [link do rezerwacji] lub zadzwoń pod [numer telefonu].",
      },
      {
        question: "Jakie są Wasze ceny?",
        answer: "Pełny cennik znajdziesz tutaj: [link]. [Strzyżenie od 80 zł.]",
      },
      {
        question: "W jakich godzinach jesteście otwarci?",
        answer: "Jesteśmy otwarci [od wtorku do soboty, 9:00–19:00].",
      },
      {
        question: "Czy mogę odwołać lub przełożyć wizytę?",
        answer: "Tak, bezpłatnie do [24 godzin] przed wizytą.",
      },
      {
        question: "Gdzie się znajdujecie?",
        answer: "Znajdziesz nas pod adresem [adres].",
      },
      {
        question: "Czy sprzedajecie karty podarunkowe?",
        answer: "Tak. Kupisz je [w salonie lub online: link].",
      },
    ],
  },
  {
    id: "services",
    label: "Usługi lokalne",
    hint: "Wyceny, obszar, terminy",
    welcome: "Cześć! Potrzebujesz wyceny albo chcesz sprawdzić, czy działamy w Twojej okolicy?",
    faqs: [
      {
        question: "Na jakim obszarze działacie?",
        answer: "Pracujemy w [miasto i okolice].",
      },
      {
        question: "Jak otrzymać wycenę?",
        answer: "Opisz, czego potrzebujesz, przez [link do kontaktu lub telefon], a w ciągu [24 godzin] wyślemy bezpłatną wycenę.",
      },
      {
        question: "Ile to kosztuje?",
        answer: "Cena zależy od zlecenia. [Większość wizyt zaczyna się od X zł.] Zawsze potwierdzamy cenę przed rozpoczęciem pracy.",
      },
      {
        question: "Jak szybko możecie przyjechać?",
        answer: "Zwykle umawiamy wizyty w ciągu [2–3 dni] i oferujemy [pilne wizyty tego samego dnia].",
      },
      {
        question: "Czy macie ubezpieczenie?",
        answer: "Tak, [mamy pełne ubezpieczenie OC i wymagane uprawnienia].",
      },
      {
        question: "Jak mogę zapłacić?",
        answer: "Akceptujemy [gotówkę, kartę, BLIK i przelew].",
      },
    ],
  },
  {
    id: "agency",
    label: "Agencja lub freelancer",
    hint: "Usługi, ceny, proces",
    welcome: "Cześć! Opowiedz o swoim projekcie albo zapytaj, jak pracujemy.",
    faqs: [
      {
        question: "Jakie usługi oferujecie?",
        answer: "Zajmujemy się [projektowaniem stron, brandingiem i marketingiem] dla [małych firm].",
      },
      {
        question: "Ile kosztuje projekt?",
        answer: "Projekty zaczynają się zwykle od [X zł]. Opisz, czego potrzebujesz, a wyślemy przejrzystą wycenę.",
      },
      {
        question: "Ile trwa projekt?",
        answer: "Większość projektów trwa [2–6 tygodni], w zależności od zakresu.",
      },
      {
        question: "Czy mogę zobaczyć Wasze realizacje?",
        answer: "Tak, zobacz nasze portfolio: [link].",
      },
      {
        question: "Jak zacząć współpracę?",
        answer: "Umów bezpłatną rozmowę przez [link do rezerwacji], a omówimy Twój projekt.",
      },
    ],
  },
];

const STARTERS: Record<Lang, Starter[]> = { en, fr, nl, de, es, pt, it, ar, pl };

/** The starter templates in a language (English if it has none). */
export const startersFor = (lang: Lang): Starter[] => STARTERS[lang] || STARTERS.en;

/** Whether an answer still has [placeholder] text to fill in. */
export const hasPlaceholder = (text: string) => /\[[^\]]+\]/.test(text);
