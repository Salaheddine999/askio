// Starter questions for a first chatbot, by kind of business. Text in
// [square brackets] is for the owner to replace; onboarding flags it until
// they do.

export interface Starter {
  id: string;
  label: string;
  hint: string;
  welcome: string;
  faqs: { question: string; answer: string }[];
}

export const BLANK_ID = "blank";

export const STARTERS: Starter[] = [
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

/** Whether an answer still has [placeholder] text to fill in. */
export const hasPlaceholder = (text: string) => /\[[^\]]+\]/.test(text);
