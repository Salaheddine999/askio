import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin.js";
import { emailConfigured, sendEmail } from "./email/send.js";

// A ceiling on AI calls across all of Askio per UTC day, whatever the cause:
// a bug, a loop, or many accounts abused at once. Past it, chatbots answer
// from their FAQs and FAQ writing pauses until midnight UTC, and Askio's
// operator gets one email per kind per day. Each account's own limits still
// apply below this.

const DAY_MS = 86_400_000;

const LIMITS = {
  chat: () => Number(process.env.AI_DAILY_REPLY_LIMIT) || 5000,
  faq: () => Number(process.env.AI_DAILY_FAQ_LIMIT) || 200,
};

const operatorEmail = () => process.env.OPS_ALERT_EMAIL || "support@getaskio.xyz";

export function dailyAiLimit(kind) {
  return LIMITS[kind]();
}

/**
 * Takes one AI call of `kind` ("chat" or "faq") from today's budget; false
 * once the day's budget is spent. Not a transaction: under heavy traffic a
 * few calls can slip past the limit, which is fine for a safety ceiling and
 * keeps every chat reply from queueing on one document.
 */
export async function takeAiBudget(kind) {
  const dayStart = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  const ref = adminDb.collection("ops").doc(`ai_budget_${kind}_${dayStart}`);
  const used = Number((await ref.get()).data()?.count) || 0;
  const limit = dailyAiLimit(kind);
  if (used >= limit) {
    await alertOnce(kind, dayStart, limit);
    return false;
  }
  await ref.set(
    // The nightly cleanup deletes the counter once this passes.
    { count: FieldValue.increment(1), expiresAt: Timestamp.fromMillis(dayStart + 2 * DAY_MS) },
    { merge: true }
  );
  return true;
}

/** One email per kind per day: create() fails once today's marker exists. */
async function alertOnce(kind, dayStart, limit) {
  try {
    await adminDb
      .collection("ops")
      .doc(`ai_budget_alert_${kind}_${dayStart}`)
      .create({ limit, sentAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(dayStart + 2 * DAY_MS) });
  } catch {
    return; // Already sent today.
  }
  if (emailConfigured()) {
    await sendEmail({ to: operatorEmail(), ...aiBudgetEmail(kind, limit) }).catch((error) =>
      console.error("Couldn't send the AI budget alert:", error.message)
    );
  }
}

export function aiBudgetEmail(kind, limit) {
  const what = kind === "chat" ? `${limit.toLocaleString("en-US")} AI chat replies` : `${limit.toLocaleString("en-US")} AI FAQ scans`;
  const effect =
    kind === "chat"
      ? "Chatbots are answering from their FAQs until midnight UTC."
      : "Owners can't generate FAQs from their website until midnight UTC.";
  const subject = `Askio: today's limit of ${what} was reached`;
  const advice = `${effect} If this is real growth, raise ${kind === "chat" ? "AI_DAILY_REPLY_LIMIT" : "AI_DAILY_FAQ_LIMIT"} in Vercel. If not, check the Vercel logs and the Anthropic Console for unusual use.`;
  const html = `<!doctype html><html><body style="margin:0;background:#F3F7FC;padding:24px 12px;font:15px/1.5 Arial,sans-serif;color:#101723">
  <div style="max-width:520px;margin:0 auto;background:#F9FCFF;border:1px solid #D8DFE9;border-radius:12px;padding:28px">
    <div style="font:700 18px/1.3 Arial,sans-serif">Today's AI limit was reached</div>
    <p style="margin:8px 0 0;color:#566273">${advice}</p>
  </div>
</body></html>`;
  return { subject, html, text: [subject, "", advice].join("\n") };
}
