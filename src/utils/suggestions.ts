/** How many questions the widget suggests at a time: the starred (or first)
 * ones to start, or the closest ones after a missed question. */
export const SUGGESTED_QUESTIONS = 3;

type Faq = { question: string; suggested?: boolean };

/**
 * The questions the widget suggests first: the ones the owner starred, in
 * list order, or the first ones when none are starred.
 */
export function pickSuggested<T extends Faq>(faqs: T[], max = SUGGESTED_QUESTIONS): T[] {
  const starred = faqs.filter((faq) => faq.suggested);
  return (starred.length > 0 ? starred : faqs).slice(0, max);
}
