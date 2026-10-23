export type BillingInterval = "monthly" | "yearly";

/** Pro prices in USD. These must match the Lemon Squeezy variants. */
export const PRO_PRICE: Record<BillingInterval, number> = {
  monthly: 39,
  yearly: 390,
};

export const YEARLY_SAVINGS_LABEL = "2 months free";

/** AI replies per Pro account each month. Keep in sync with api/_lib/aiUsage.js. */
export const PRO_AI_REPLY_LIMIT = 3000;

/** Share of the monthly AI replies at which the dashboard starts warning. */
export const AI_USAGE_WARNING_RATIO = 0.8;

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}

/** What Pro costs per month when paid yearly, e.g. "$32.50". */
export function proYearlyMonthlyEquivalent() {
  return `$${(PRO_PRICE.yearly / 12).toFixed(2)}`;
}
