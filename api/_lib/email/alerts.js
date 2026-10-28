import crypto from "node:crypto";
import { adminAuth, adminDb } from "../firebaseAdmin.js";
import { takeRateLimit } from "../rateLimit.js";
import { reportError } from "../monitoring.js";
import { emailConfigured, sendEmail } from "./send.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { leadEmail, missedChatEmail, setupReminderEmail, unsubscribePage } from "./templates.js";

// Email alerts for chatbot owners: a new lead, a missed live chat, a new
// chatbot that isn't on a website yet (sent once, by the nightly cron). Each type
// can be turned off in Settings or with the link in every email, and an
// account gets at most DAILY_CAP alerts a day, so fake leads can't flood it.

export const ALERT_TYPES = ["leads", "missedChats", "setup"];
const DAILY_CAP = 50;
const TYPE_CAPS = { leads: 30, missedChats: 15, setup: 5 };
const DAY_MS = 86_400_000;
const UID = /^[A-Za-z0-9]{1,128}$/;

const appUrl = () => (process.env.APP_URL || "https://www.getaskio.xyz").replace(/\/$/, "");
// Unsubscribe links are signed so nobody can turn off someone else's alerts.
const signingSecret = () => process.env.EMAIL_SIGNING_SECRET || process.env.CRON_SECRET || process.env.RESEND_API_KEY || "";

// Links are signed with a key used for nothing else, derived from the secret.
// Links in emails sent before that change used the secret itself and still work.
const sign = (key, uid, type) => crypto.createHmac("sha256", key).update(`${uid}:${type}`).digest("base64url").slice(0, 32);
const linkKey = () => `askio-unsubscribe:${signingSecret()}`;

export function unsubscribeSignature(uid, type) {
  return sign(linkKey(), uid, type);
}

export function verifyUnsubscribe(uid, type, signature) {
  if (!signingSecret() || typeof uid !== "string" || !UID.test(uid) || !ALERT_TYPES.includes(type)) return false;
  if (typeof signature !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(signature)) return false;
  const given = Buffer.from(signature);
  return [sign(linkKey(), uid, type), sign(signingSecret(), uid, type)].some((expected) =>
    crypto.timingSafeEqual(given, Buffer.from(expected))
  );
}

export function unsubscribeUrl(uid, type) {
  return `${appUrl()}/api/account/email-unsubscribe?u=${encodeURIComponent(uid)}&t=${type}&s=${unsubscribeSignature(uid, type)}`;
}

/**
 * The owner to email, unless they turned this alert off or can't receive it.
 * The address is the account's sign-in email from Firebase Auth, never a
 * profile field, so alerts can't be redirected to someone else.
 */
async function recipientFor(chatbot, type) {
  const snap = await adminDb.collection("users").doc(chatbot.user_id).get();
  const user = snap.data();
  if (!user || user.suspended === true || user.emailAlerts?.[type] === false) return null;
  const email = (await adminAuth.getUser(chatbot.user_id).catch(() => null))?.email;
  if (!email) return null;
  return { uid: chatbot.user_id, email, lang: user.language || chatbot.language || "en" };
}

/** What the visitor last asked, from the saved conversation (Pro), if any. */
async function visitorQuestions(chatbotId, sessionId, max = 3) {
  if (typeof sessionId !== "string" || !sessionId) return [];
  try {
    const snap = await adminDb.collection("conversations").doc(`${chatbotId}_${sessionId}`).get();
    const messages = Array.isArray(snap.data()?.messages) ? snap.data().messages : [];
    return messages
      .filter((m) => m.role === "visitor" && typeof m.text === "string")
      .slice(-max)
      .map((m) => m.text.slice(0, 500));
  } catch {
    return [];
  }
}

/** Sends one alert; never throws, so a visitor's request never fails over email. */
async function deliver(chatbot, type, build) {
  if (!emailConfigured() || !chatbot?.user_id) return false;
  try {
    const recipient = await recipientFor(chatbot, type);
    if (!recipient) return false;
    // Each type has its own share first, so fake leads can't use up the
    // account's emails and silence missed chats or setup reminders.
    if (!(await takeRateLimit(`email_${recipient.uid}_${type}`, TYPE_CAPS[type] ?? DAILY_CAP, DAY_MS))) return false;
    if (!(await takeRateLimit(`email_${recipient.uid}`, DAILY_CAP, DAY_MS))) return false;
    const unsubscribe = unsubscribeUrl(recipient.uid, type);
    const message = build({ lang: recipient.lang, appUrl: appUrl(), unsubscribe, botName: chatbot.title });
    await sendEmail({
      to: recipient.email,
      ...message,
      // One-click unsubscribe, as Gmail and Yahoo expect.
      headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    return true;
  } catch (error) {
    console.error(`Couldn't send the ${type} email:`, error.message);
    if (!error.expected) reportError(error, { route: "email", type });
    return false;
  }
}

export async function sendLeadAlert({ chatbotId, chatbot, email, sessionId }) {
  const asked = await visitorQuestions(chatbotId, sessionId);
  return deliver(chatbot, "leads", (ctx) => leadEmail({ ...ctx, leadEmail: email, asked }));
}

export async function sendMissedChatAlert({ chatbotId, chatbot, sessionId }) {
  const asked = await visitorQuestions(chatbotId, sessionId);
  const conversationId = `${chatbotId}_${sessionId}`;
  return deliver(chatbot, "missedChats", (ctx) => missedChatEmail({ ...ctx, asked, conversationId }));
}

// A chatbot gets its reminder once it's a day old and still hasn't been seen
// on a website; after a week it's left alone.
const SETUP_AFTER_MS = DAY_MS;
const SETUP_UNTIL_MS = 7 * DAY_MS;
const SETUP_PER_RUN = 100;

/**
 * For the nightly cron: one email per new chatbot that no website has loaded
 * yet. Returns how many were sent.
 */
export async function sendSetupReminders() {
  if (!emailConfigured()) return 0;
  const now = Date.now();
  const snap = await adminDb
    .collection("chatbot_configs")
    .where("createdAt", ">=", Timestamp.fromMillis(now - SETUP_UNTIL_MS))
    .where("createdAt", "<=", Timestamp.fromMillis(now - SETUP_AFTER_MS))
    .limit(SETUP_PER_RUN * 3)
    .get();
  let sent = 0;
  for (const doc of snap.docs) {
    if (sent >= SETUP_PER_RUN) break;
    const chatbot = doc.data();
    if (chatbot.installedAt || chatbot.setupReminderSentAt || chatbot.suspended === true) continue;
    // Marked first, so a failed or repeated run never emails twice.
    await doc.ref.update({ setupReminderSentAt: FieldValue.serverTimestamp() });
    if (await deliver(chatbot, "setup", (ctx) => setupReminderEmail({ ...ctx, chatbotId: doc.id }))) sent += 1;
  }
  return sent;
}

/**
 * GET /api/account/email-unsubscribe?u&t&s from the email's link, and the
 * POST mail apps send for one-click unsubscribe. Turns that alert type off.
 */
export async function emailUnsubscribe(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const { u: uid, t: type, s: signature } = req.query || {};
  const ok = verifyUnsubscribe(uid, type, signature);
  let lang = "en";
  if (ok) {
    const ref = adminDb.collection("users").doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
      lang = snap.data().language || "en";
      await ref.set({ emailAlerts: { [type]: false } }, { merge: true });
    }
  }
  if (req.method === "POST") return res.status(ok ? 200 : 400).json({ ok });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(ok ? 200 : 400).send(unsubscribePage({ lang, appUrl: appUrl(), ok }));
}
