import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin.js";
import { emailConfigured, sendEmail } from "./email/send.js";
import { escapeHtml } from "./email/templates.js";

// Failed AI replies are counted per hour. Out-of-quota and timeouts aren't
// sent to Sentry (they're expected now and then), so without this nobody
// would notice chatbots quietly falling back to their FAQs. Past THRESHOLD in
// an hour, Askio's operator gets one email, at most every QUIET_HOURS.

const HOUR_MS = 3_600_000;
export const THRESHOLD = 5;
const QUIET_HOURS = 6;

const operatorEmail = () => process.env.OPS_ALERT_EMAIL || "support@getaskio.xyz";

/** What a Gemini status usually means, and what to do about it. */
export function explainStatus(status) {
  if (status === 429) return "Gemini is out of quota. Check billing and limits in Google AI Studio.";
  if (status === 0) return "Gemini didn't answer in time. It may be slow or down; it usually passes.";
  if (status >= 500) return "Gemini is having trouble on Google's side. It usually passes.";
  if (status === 404) return "A Gemini model wasn't found; it may have been retired. Update the model list in api/_lib/ai.js.";
  if (status === 401 || status === 403) return "Gemini refused the API key. Check GEMINI_API_KEY in Vercel.";
  return "Gemini returned an unexpected error. Check the Vercel logs.";
}

/**
 * Counts one failed AI reply (`status` is Gemini's HTTP status, 0 for a
 * timeout) and emails the operator when failures pile up. Never throws.
 */
export async function noteAiFailure(status, source = "chat") {
  try {
    const hourStart = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
    const counter = adminDb.collection("ops").doc(`ai_failures_${hourStart}`);
    const alertRef = adminDb.collection("ops").doc("ai_alert");
    const statusKey = String(Number(status) || 0);

    const alert = await adminDb.runTransaction(async (transaction) => {
      const [counterSnap, alertSnap] = await Promise.all([transaction.get(counter), transaction.get(alertRef)]);
      const count = (counterSnap.exists ? Number(counterSnap.data().count) || 0 : 0) + 1;
      const statuses = { ...(counterSnap.data()?.statuses || {}) };
      statuses[statusKey] = (statuses[statusKey] || 0) + 1;
      transaction.set(
        counter,
        {
          count,
          statuses,
          sources: { [source]: FieldValue.increment(1) },
          // The nightly cleanup deletes counters once this passes.
          expiresAt: Timestamp.fromMillis(hourStart + 2 * 24 * HOUR_MS),
        },
        { merge: true }
      );
      const lastSent = alertSnap.data()?.lastSentAt?.toMillis?.() ?? 0;
      if (count < THRESHOLD || Date.now() - lastSent < QUIET_HOURS * HOUR_MS) return null;
      transaction.set(alertRef, { lastSentAt: FieldValue.serverTimestamp(), count, statuses }, { merge: true });
      return { count, statuses };
    });

    if (alert && emailConfigured()) await sendEmail({ to: operatorEmail(), ...aiFailureEmail(alert) });
  } catch (error) {
    console.error("Couldn't record an AI failure:", error.message);
  }
}

export function aiFailureEmail({ count, statuses }) {
  const sorted = Object.entries(statuses).sort((a, b) => b[1] - a[1]);
  const main = Number(sorted[0]?.[0] ?? 0);
  const lines = sorted.map(([status, n]) => `${n} × ${status === "0" ? "timeout" : `HTTP ${status}`}`);
  const subject = `Askio: ${count} AI replies failed in the last hour`;
  const advice = explainStatus(main);
  const intro = `Chatbots are answering from their FAQs instead of the AI. ${advice}`;
  const html = `<!doctype html><html><body style="margin:0;background:#F3F7FC;padding:24px 12px;font:15px/1.5 Arial,sans-serif;color:#101723">
  <div style="max-width:520px;margin:0 auto;background:#F9FCFF;border:1px solid #D8DFE9;border-radius:12px;padding:28px">
    <div style="font:700 18px/1.3 Arial,sans-serif">AI replies are failing</div>
    <p style="margin:8px 0 16px;color:#566273">${escapeHtml(intro)}</p>
    <div style="font:600 12px/1.4 Arial,sans-serif;color:#647184;text-transform:uppercase;letter-spacing:.04em">This hour</div>
    <p style="margin:4px 0 0;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</p>
    <p style="margin:16px 0 0;font-size:13px;color:#87909D">You'll get at most one of these every ${QUIET_HOURS} hours.</p>
  </div>
</body></html>`;
  const text = [subject, "", intro, "", "This hour:", ...lines, "", `You'll get at most one of these every ${QUIET_HOURS} hours.`].join("\n");
  return { subject, html, text };
}
