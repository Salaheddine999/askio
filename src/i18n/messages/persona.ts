import { defineMessages } from "..";

// The editor's AI persona tab. Persona names are kept as names; the prompt
// each persona sends to the AI stays in English (see AiPersonaTab).
export const personaMessages = defineMessages({
  en: {
    sampleQuestion: "What are your opening hours?",
    defaultName: "Standard",
    defaultTagline: "Helpful, concise and friendly",
    defaultSample: "We're open Monday to Friday, 9 AM to 6 PM EST. Is there anything else I can help you with?",
    professionalTagline: "Polished, clear and knowledgeable",
    professionalSample:
      "Thank you for your inquiry. Our business hours are Monday through Friday, 9 AM to 6 PM EST. Is there anything else I can assist you with?",
    friendlyTagline: "Warm, upbeat and encouraging",
    friendlySample:
      "Hey there! 😊 Great question! We're open Mon–Fri, 9 AM to 6 PM EST. Don't hesitate to reach out anytime. We're always happy to help! 🎉",
    genzTagline: "Casual and straight to the point",
    genzSample: "bestie we're open Mon–Fri 9-6 EST 💅 slide into our DMs anytime during those hours and we gotchu ✨",
    pirateTagline: "Swashbuckling, but helpful",
    pirateSample:
      "Ahoy, matey! 🏴‍☠️ We be open fer business Monday through Friday, 9 in the mornin' to 6 in the evenin'. Now set sail back 'ere if ye need more help, savvy?",
    zenTagline: "Peaceful and reassuring",
    zenSample:
      "Welcome 🌿 Our doors are open Monday through Friday, from 9 AM to 6 PM EST. Like the sun rising and setting, we're here during the brightest hours. Take your time, and reach out whenever feels right.",
    robotTagline: "Efficient, precise and structured",
    robotSample:
      "QUERY PROCESSED ✅\n• Operating hours: Mon–Fri, 09:00–18:00 EST\n• Status: Currently online\n• Response time: < 2 minutes\nAdditional queries welcome.",
    voice: "Voice",
    voiceDesc: "How AI replies sound. What they say still comes from your questions & answers.",
    voiceAria: "AI voice",
    soundsLike: "Sounds like · {name}",
    yourOwnVoice: "Your own voice",
    customSample: "Replies follow your instructions below. Ask the preview something to hear how it sounds.",
    instructions: "Instructions",
    custom: "Custom",
    instructionsDesc:
      "What the AI is told about its voice. Edit them to make your own; picking a voice above replaces them.",
    persona: "Persona",
    personaHint: "For example: “You work at a small bakery. Keep answers under two sentences and sign off warmly.”",
    personaPlaceholder: "Leave empty for the standard voice: helpful, concise and friendly.",
  },
  fr: {
    sampleQuestion: "Quels sont vos horaires d'ouverture ?",
    defaultName: "Standard",
    defaultTagline: "Serviable, concis et aimable",
    defaultSample: "Nous sommes ouverts du lundi au vendredi, de 9 h à 18 h. Puis-je vous aider pour autre chose ?",
    professionalTagline: "Soigné, clair et compétent",
    professionalSample:
      "Merci pour votre demande. Nos horaires d'ouverture sont du lundi au vendredi, de 9 h à 18 h. Puis-je vous aider pour autre chose ?",
    friendlyTagline: "Chaleureux, enjoué et encourageant",
    friendlySample:
      "Bonjour ! 😊 Excellente question ! Nous sommes ouverts du lundi au vendredi, de 9 h à 18 h. N'hésitez pas à nous écrire quand vous voulez, on est toujours ravis d'aider ! 🎉",
    genzTagline: "Décontracté et droit au but",
    genzSample: "coucou 💅 on est ouverts du lundi au vendredi, 9h-18h, écris-nous quand tu veux sur ces horaires, on gère ✨",
    pirateTagline: "Flibustier, mais serviable",
    pirateSample:
      "Ohé, moussaillon ! 🏴‍☠️ Le navire est ouvert du lundi au vendredi, de 9 heures du matin à 6 heures du soir. Revenez jeter l'ancre ici si vous avez besoin d'aide, compris ?",
    zenTagline: "Paisible et rassurant",
    zenSample:
      "Bienvenue 🌿 Nos portes sont ouvertes du lundi au vendredi, de 9 h à 18 h. Comme le soleil qui se lève et se couche, nous sommes là aux heures les plus lumineuses. Prenez votre temps et écrivez-nous quand vous le sentez.",
    robotTagline: "Efficace, précis et structuré",
    robotSample:
      "REQUÊTE TRAITÉE ✅\n• Horaires : lun–ven, 09:00–18:00\n• Statut : en ligne\n• Délai de réponse : < 2 minutes\nAutres requêtes bienvenues.",
    voice: "Voix",
    voiceDesc: "Le ton des réponses IA. Leur contenu vient toujours de vos questions et réponses.",
    voiceAria: "Voix de l'IA",
    soundsLike: "Aperçu · {name}",
    yourOwnVoice: "Votre propre voix",
    customSample: "Les réponses suivent vos instructions ci-dessous. Posez une question dans l'aperçu pour entendre le résultat.",
    instructions: "Instructions",
    custom: "Personnalisée",
    instructionsDesc:
      "Ce qu'on dit à l'IA sur sa voix. Modifiez-les pour créer la vôtre ; choisir une voix ci-dessus les remplace.",
    persona: "Personnalité",
    personaHint:
      "Par exemple : « Vous travaillez dans une petite boulangerie. Répondez en deux phrases maximum et terminez chaleureusement. »",
    personaPlaceholder: "Laissez vide pour la voix standard : serviable, concise et aimable.",
  },
  nl: {
    sampleQuestion: "Wat zijn jullie openingstijden?",
    defaultName: "Standaard",
    defaultTagline: "Behulpzaam, beknopt en vriendelijk",
    defaultSample: "We zijn open van maandag tot en met vrijdag, van 9.00 tot 18.00 uur. Kan ik je nog ergens anders mee helpen?",
    professionalTagline: "Verzorgd, helder en deskundig",
    professionalSample:
      "Bedankt voor je vraag. Onze openingstijden zijn maandag tot en met vrijdag, van 9.00 tot 18.00 uur. Kan ik je nog ergens anders mee helpen?",
    friendlyTagline: "Warm, vrolijk en bemoedigend",
    friendlySample:
      "Hoi! 😊 Goeie vraag! We zijn open van ma–vr, 9.00 tot 18.00 uur. Stuur gerust altijd een berichtje. We helpen je graag! 🎉",
    genzTagline: "Relaxed en recht voor zijn raap",
    genzSample: "yo we zijn open ma–vr 9-18 💅 stuur ons gewoon een DM in die uren en we fixen het ✨",
    pirateTagline: "Avontuurlijk, maar behulpzaam",
    pirateSample:
      "Ahoy, maatje! 🏴‍☠️ Wij liggen voor anker van maandag tot vrijdag, van 9 uur 's ochtends tot 6 uur 's avonds. Zet weer koers hierheen als je meer hulp nodig hebt, begrepen?",
    zenTagline: "Rustig en geruststellend",
    zenSample:
      "Welkom 🌿 Onze deuren staan open van maandag tot en met vrijdag, van 9.00 tot 18.00 uur. Zoals de zon opkomt en ondergaat, zijn wij er tijdens de lichtste uren. Neem je tijd en laat van je horen wanneer het goed voelt.",
    robotTagline: "Efficiënt, precies en gestructureerd",
    robotSample:
      "VERZOEK VERWERKT ✅\n• Openingstijden: ma–vr, 09:00–18:00\n• Status: online\n• Reactietijd: < 2 minuten\nAanvullende verzoeken welkom.",
    voice: "Stem",
    voiceDesc: "Hoe AI-antwoorden klinken. Wat ze zeggen komt nog steeds uit je vragen en antwoorden.",
    voiceAria: "AI-stem",
    soundsLike: "Klinkt als · {name}",
    yourOwnVoice: "Je eigen stem",
    customSample: "Antwoorden volgen je instructies hieronder. Stel het voorbeeld een vraag om te horen hoe het klinkt.",
    instructions: "Instructies",
    custom: "Eigen",
    instructionsDesc:
      "Wat de AI over zijn stem te horen krijgt. Pas ze aan om je eigen stem te maken; een stem hierboven kiezen vervangt ze.",
    persona: "Persona",
    personaHint: "Bijvoorbeeld: “Je werkt bij een kleine bakkerij. Houd antwoorden onder de twee zinnen en sluit hartelijk af.”",
    personaPlaceholder: "Laat leeg voor de standaardstem: behulpzaam, beknopt en vriendelijk.",
  },
  de: {
    sampleQuestion: "Wie sind Ihre Öffnungszeiten?",
    defaultName: "Standard",
    defaultTagline: "Hilfsbereit, knapp und freundlich",
    defaultSample: "Wir haben montags bis freitags von 9 bis 18 Uhr geöffnet. Kann ich Ihnen sonst noch helfen?",
    professionalTagline: "Professionell, klar und kompetent",
    professionalSample:
      "Vielen Dank für Ihre Anfrage. Unsere Geschäftszeiten sind montags bis freitags von 9 bis 18 Uhr. Kann ich Ihnen sonst noch behilflich sein?",
    friendlyTagline: "Herzlich, fröhlich und ermutigend",
    friendlySample:
      "Hallo! 😊 Gute Frage! Wir sind Mo–Fr von 9 bis 18 Uhr für Sie da. Melden Sie sich jederzeit gern. Wir helfen immer gern! 🎉",
    genzTagline: "Locker und auf den Punkt",
    genzSample: "hey, wir sind Mo–Fr 9-18 Uhr da 💅 schreib uns einfach in der Zeit ne DM und wir kümmern uns ✨",
    pirateTagline: "Verwegen, aber hilfsbereit",
    pirateSample:
      "Ahoi, Landratte! 🏴‍☠️ Wir haben von Montag bis Freitag geöffnet, von 9 Uhr morgens bis 6 Uhr abends. Segelt wieder her, wenn Ihr mehr Hilfe braucht, verstanden?",
    zenTagline: "Ruhig und beruhigend",
    zenSample:
      "Willkommen 🌿 Unsere Türen sind montags bis freitags von 9 bis 18 Uhr geöffnet. Wie die Sonne, die auf- und untergeht, sind wir in den hellsten Stunden für Sie da. Lassen Sie sich Zeit und melden Sie sich, wann immer es passt.",
    robotTagline: "Effizient, präzise und strukturiert",
    robotSample:
      "ANFRAGE VERARBEITET ✅\n• Öffnungszeiten: Mo–Fr, 09:00–18:00\n• Status: online\n• Antwortzeit: < 2 Minuten\nWeitere Anfragen willkommen.",
    voice: "Stimme",
    voiceDesc: "Wie KI-Antworten klingen. Der Inhalt kommt weiterhin aus Ihren Fragen und Antworten.",
    voiceAria: "KI-Stimme",
    soundsLike: "Klingt wie · {name}",
    yourOwnVoice: "Ihre eigene Stimme",
    customSample:
      "Antworten folgen Ihren Anweisungen unten. Stellen Sie der Vorschau eine Frage, um zu hören, wie es klingt.",
    instructions: "Anweisungen",
    custom: "Eigene",
    instructionsDesc:
      "Was der KI über ihre Stimme gesagt wird. Bearbeiten Sie den Text für Ihre eigene Stimme; die Wahl einer Stimme oben ersetzt ihn.",
    persona: "Persona",
    personaHint:
      "Zum Beispiel: „Du arbeitest in einer kleinen Bäckerei. Antworte in höchstens zwei Sätzen und verabschiede dich herzlich.“",
    personaPlaceholder: "Leer lassen für die Standardstimme: hilfsbereit, knapp und freundlich.",
  },
  es: {
    sampleQuestion: "¿Cuál es vuestro horario?",
    defaultName: "Estándar",
    defaultTagline: "Útil, conciso y amable",
    defaultSample: "Abrimos de lunes a viernes, de 9:00 a 18:00. ¿Te puedo ayudar con algo más?",
    professionalTagline: "Cuidado, claro y experto",
    professionalSample:
      "Gracias por tu consulta. Nuestro horario es de lunes a viernes, de 9:00 a 18:00. ¿Hay algo más en lo que pueda ayudarte?",
    friendlyTagline: "Cercano, alegre y motivador",
    friendlySample:
      "¡Hola! 😊 ¡Buena pregunta! Abrimos de lunes a viernes, de 9:00 a 18:00. Escríbenos cuando quieras. ¡Siempre encantados de ayudar! 🎉",
    genzTagline: "Informal y al grano",
    genzSample: "holi, abrimos de lunes a viernes de 9 a 18 💅 escríbenos por DM en ese horario y te lo solucionamos ✨",
    pirateTagline: "Bucanero, pero servicial",
    pirateSample:
      "¡Ah del barco, grumete! 🏴‍☠️ Abrimos de lunes a viernes, de las 9 de la mañana a las 6 de la tarde. Vuelve a poner rumbo aquí si necesitas más ayuda, ¿entendido?",
    zenTagline: "Sereno y tranquilizador",
    zenSample:
      "Bienvenido 🌿 Nuestras puertas están abiertas de lunes a viernes, de 9:00 a 18:00. Como el sol que sale y se pone, estamos aquí en las horas de más luz. Tómate tu tiempo y escríbenos cuando lo sientas.",
    robotTagline: "Eficiente, preciso y estructurado",
    robotSample:
      "CONSULTA PROCESADA ✅\n• Horario: lun–vie, 09:00–18:00\n• Estado: en línea\n• Tiempo de respuesta: < 2 minutos\nSe admiten más consultas.",
    voice: "Voz",
    voiceDesc: "Cómo suenan las respuestas de IA. Lo que dicen sigue saliendo de tus preguntas y respuestas.",
    voiceAria: "Voz de la IA",
    soundsLike: "Suena así · {name}",
    yourOwnVoice: "Tu propia voz",
    customSample: "Las respuestas siguen tus instrucciones de abajo. Pregunta algo en la vista previa para oír cómo suena.",
    instructions: "Instrucciones",
    custom: "Personalizada",
    instructionsDesc:
      "Lo que se le dice a la IA sobre su voz. Edítalas para crear la tuya; elegir una voz arriba las reemplaza.",
    persona: "Personalidad",
    personaHint:
      "Por ejemplo: «Trabajas en una pequeña panadería. Responde en menos de dos frases y despídete con cariño».",
    personaPlaceholder: "Déjalo vacío para la voz estándar: útil, concisa y amable.",
  },
});
