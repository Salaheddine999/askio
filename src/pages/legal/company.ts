// Operator details used by the Privacy Policy and Terms of Service.
// Askio isn't a registered company: it's an independent service run from Morocco.
// Values in [square brackets] are placeholders; while any remain, or any item in
// CONFIRMED is false, both pages show a "draft" notice.
export const COMPANY = {
  operator: "Askio",
  contactEmail: "abw.salaheddine@gmail.com",
  country: "Morocco",
  courts: "the competent courts of Morocco",
  effectiveDate: "October 27, 2026",
};

// Facts to confirm before launch; each stays highlighted until set to true.
export const CONFIRMED = {
  /**
   * Expired hashed-IP rate-limit records are deleted daily by the Vercel Cron job
   * in api/cron/cleanup-rate-limits.js (needs CRON_SECRET set on Vercel).
   */
  rateLimitCleanup: true,
};

export const isPlaceholder = (value: string) => value.startsWith("[") && value.endsWith("]");

export const hasPlaceholders =
  Object.values(COMPANY).some(isPlaceholder) || Object.values(CONFIRMED).some((ok) => !ok);
