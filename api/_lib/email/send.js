// Sends email through Resend's HTTP API (no SDK). Needs RESEND_API_KEY and
// EMAIL_FROM (for example "Askio <notifications@getaskio.xyz>"); without
// them, sending is skipped.

const RESEND_URL = "https://api.resend.com/emails";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Returns true once Resend accepts the email; throws if it refuses. */
export async function sendEmail({ to, subject, html, text, headers = {} }) {
  if (!emailConfigured()) return false;
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html, text, headers }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(`Resend refused the email (${response.status}): ${detail.slice(0, 200)}`);
    // Resend's own rate limit passes; anything else (a bad key, an unverified
    // sender) needs a look.
    error.expected = response.status === 429;
    throw error;
  }
  return true;
}
