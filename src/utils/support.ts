import { COMPANY } from "../pages/legal/company";

/** A prefilled email to ask for a review, with the account it's about. */
export function reviewEmailHref(email?: string | null) {
  const subject = "Account review request";
  const body = [
    "Hi Askio team,",
    "",
    "My account was suspended and I'd like it reviewed.",
    "",
    `Account email: ${email || ""}`,
    "",
    "What I'd like you to know:",
    "",
  ].join("\n");
  return `mailto:${COMPANY.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
