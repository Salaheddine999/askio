// The homepage demo ("see Askio on your website") and what it hands to
// onboarding after sign-up.

export type DemoResult = {
  host: string;
  site: { title: string; image: string; icon: string; color: string };
  faqs: { question: string; answer: string }[];
};

/** Picked up by onboarding after sign-up, so the chatbot starts with these. */
export const DEMO_KEY = "askio-demo";
