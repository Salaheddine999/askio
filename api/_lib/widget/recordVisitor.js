import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin.js";
import { takeRateLimit, visitorKey } from "../rateLimit.js";
import { getUserAccessProfile } from "../plan.js";
import { sendLeadAlert, sendMissedChatAlert } from "../email/alerts.js";
import { pushLiveChatRequest } from "../push.js";

// Visitor records written by the chat widget: leads, analytics events,
// unanswered questions and ratings. Visitors are anonymous, so these used to
// be written straight to Firestore; going through here lets us validate each
// record and cap how fast one visitor (or one chatbot) can add them.

const EMAIL = /^[^@ ]+@[^@ ]+[.][^@ ]+$/;
const CHATBOT_ID = /^[A-Za-z0-9_-]{1,64}$/;
const EVENT_TYPES = new Set(["faq_matched", "suggestion_clicked", "ai_generated"]);

/** Per minute: [per visitor, per chatbot]. Real visitors stay far below these. */
const LIMITS = {
  lead: [3, 30],
  event: [40, 600],
  unanswered: [20, 300],
  feedback: [5, 60],
  message: [40, 1200],
  handoff: [4, 60],
  typing: [30, 900],
  seen: [10, 600],
};

const SESSION_ID = /^[A-Za-z0-9_-]{8,64}$/;
/** A conversation stops growing here, well under Firestore's 1 MB document limit. */
const MAX_MESSAGES = 200;
const MAX_MESSAGE_CHARS = 2000;

const COLLECTIONS = {
  lead: "leads",
  event: "analytics_events",
  unanswered: "unanswered_queries",
  feedback: "feedback",
};

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

const text = (value, max, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest("Missing a required field.");
    return null;
  }
  if (typeof value !== "string") throw badRequest("Invalid field.");
  return value.slice(0, max);
};

function token(value, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest("Missing visitor token.");
    return null;
  }
  if (typeof value !== "string" || value.length > 64) throw badRequest("Invalid visitor token.");
  return value;
}

/** A page address without its query or hash, which can hold private details. */
function pageOf(value) {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return null;
  }
}

/** The fields to store for each kind, checked the way the Firestore rules used to. */
function fieldsFor(kind, body) {
  switch (kind) {
    case "lead": {
      const email = text(body.email, 254, { required: true }).trim();
      if (!EMAIL.test(email)) throw badRequest("Please enter a valid email address.");
      return { email, anonymousToken: token(body.anonymousToken) || "anonymous" };
    }
    case "event": {
      if (!EVENT_TYPES.has(body.type)) throw badRequest("Unknown event type.");
      const fields = { type: body.type, anonymousToken: token(body.anonymousToken) };
      const question = text(body.question, 1000);
      const userQuery = text(body.userQuery, 2000);
      if (question) fields.question = question;
      if (userQuery) fields.userQuery = userQuery;
      return fields;
    }
    case "unanswered":
      return { query: text(body.query, 2000, { required: true }), anonymousToken: token(body.anonymousToken) };
    case "message":
      if (!["visitor", "bot"].includes(body.role)) throw badRequest("Invalid message.");
      if (typeof body.sessionId !== "string" || !SESSION_ID.test(body.sessionId)) throw badRequest("Invalid session.");
      return {
        role: body.role,
        text: text(body.text, MAX_MESSAGE_CHARS, { required: true }),
        sessionId: body.sessionId,
        anonymousToken: token(body.anonymousToken),
        page: pageOf(body.page),
      };
    case "seen": {
      // The page the widget loaded on; the embed script sends it.
      const page = pageOf(body.page);
      if (!page) throw badRequest("Invalid page.");
      const host = new URL(page).host;
      // A local test page isn't a website visitors see.
      const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) || /\.localhost(:\d+)?$/.test(host);
      return { host: local ? null : host };
    }
    case "typing":
      if (typeof body.sessionId !== "string" || !SESSION_ID.test(body.sessionId)) throw badRequest("Invalid session.");
      return { sessionId: body.sessionId };
    case "handoff":
      if (!["request", "cancel"].includes(body.action)) throw badRequest("Invalid request.");
      if (typeof body.sessionId !== "string" || !SESSION_ID.test(body.sessionId)) throw badRequest("Invalid session.");
      return { action: body.action, sessionId: body.sessionId, anonymousToken: token(body.anonymousToken) };
    case "feedback":
      if (typeof body.isPositive !== "boolean") throw badRequest("Invalid rating.");
      return { isPositive: body.isPositive, anonymousToken: token(body.anonymousToken, { required: true }) };
    default:
      throw badRequest("Unknown record type.");
  }
}

/**
 * Appends one message to the visitor's conversation, kept only when the owner
 * turned on conversation history for this chatbot and is on an active paid
 * plan. Otherwise it's silently dropped: the widget doesn't need to know.
 */
async function appendMessage(chatbotId, chatbot, { role, text: messageText, sessionId, anonymousToken, page }) {
  if (chatbot.saveConversations !== true) return;
  const { access } = await getUserAccessProfile(chatbot.user_id);
  if (access.plan === "free" || !access.isSubscriptionActive) return;

  const ref = adminDb.collection("conversations").doc(`${chatbotId}_${sessionId}`);
  await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const count = snap.exists ? Number(snap.data().messageCount) || 0 : 0;
    if (count >= MAX_MESSAGES) return;
    const message = { role, text: messageText, at: Date.now() };
    if (!snap.exists) {
      transaction.set(ref, {
        chatbotId,
        ownerId: chatbot.user_id,
        anonymousToken: anonymousToken || null,
        startedAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: 1,
        visitorMessages: role === "visitor" ? 1 : 0,
        preview: role === "visitor" ? messageText.slice(0, 200) : null,
        messages: [message],
        ...(page ? { lastPage: page } : {}),
        // With live chat on, the owner can join any time; "idle" lets the
        // visitor's widget follow the conversation to see them arrive.
        ...(chatbot.liveChat === true ? { liveStatus: "idle" } : {}),
      });
      return;
    }
    const update = {
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
      messages: FieldValue.arrayUnion(message),
    };
    // A chat started before live chat was turned on becomes joinable too.
    if (chatbot.liveChat === true && !snap.data().liveStatus) update.liveStatus = "idle";
    if (role === "visitor") {
      update.visitorMessages = FieldValue.increment(1);
      if (page) update.lastPage = page;
      if (!snap.data().preview) update.preview = messageText.slice(0, 200);
    }
    transaction.update(ref, update);
  });
}

const SEEN_REFRESH_MS = 20 * 3_600_000;

/**
 * The widget loaded on a website: the dashboard shows the chatbot as
 * installed, and the setup reminder isn't sent. Written at most about once a
 * day per chatbot, or when it shows up on another site.
 */
async function markSeen(ref, chatbot, host) {
  const last = chatbot.lastSeenAt?.toMillis?.() ?? 0;
  if (chatbot.installedAt && chatbot.lastSeenHost === host && Date.now() - last < SEEN_REFRESH_MS) return;
  await ref.update({
    lastSeenAt: FieldValue.serverTimestamp(),
    lastSeenHost: host,
    ...(chatbot.installedAt ? {} : { installedAt: FieldValue.serverTimestamp() }),
  });
}

/**
 * A visitor asks to talk to a person (live chat), or gives up waiting. Needs
 * live chat and conversation history on, and the owner on an active paid
 * plan. The conversation becomes "waiting" until the owner replies (then
 * "active") or ends it; "missed" when nobody answered in time.
 */
async function handoff(chatbotId, chatbot, { action, sessionId, anonymousToken }) {
  const ref = adminDb.collection("conversations").doc(`${chatbotId}_${sessionId}`);
  if (action === "cancel") {
    const missed = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists || snap.data().liveStatus !== "waiting") return false;
      transaction.update(ref, { liveStatus: "missed" });
      return true;
    });
    if (missed) await sendMissedChatAlert({ chatbotId, chatbot, sessionId });
    return missed ? "missed" : "unchanged";
  }

  if (chatbot.liveChat !== true || chatbot.saveConversations !== true) {
    const error = badRequest("Live chat isn't available for this chatbot.");
    error.statusCode = 403;
    throw error;
  }
  const { access } = await getUserAccessProfile(chatbot.user_id);
  if (access.plan === "free" || !access.isSubscriptionActive) {
    const error = badRequest("Live chat isn't available for this chatbot.");
    error.statusCode = 403;
    throw error;
  }

  const status = await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists && snap.data().liveStatus === "active") return "active";
    const live = {
      liveStatus: "waiting",
      liveRequestedAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp(),
    };
    if (snap.exists) transaction.update(ref, live);
    else
      transaction.set(ref, {
        chatbotId,
        ownerId: chatbot.user_id,
        anonymousToken: anonymousToken || null,
        startedAt: FieldValue.serverTimestamp(),
        messageCount: 0,
        visitorMessages: 0,
        preview: null,
        messages: [],
        ...live,
      });
    return "waiting";
  });
  if (status === "waiting") {
    const preview = (await ref.get().catch(() => null))?.data()?.preview;
    await pushLiveChatRequest({ chatbot, conversationId: ref.id, preview });
  }
  return status;
}

/** Marks a saved conversation as having left this email, if there is one. */
async function tagConversationLead(chatbotId, sessionId, email) {
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) return;
  const ref = adminDb.collection("conversations").doc(`${chatbotId}_${sessionId}`);
  await ref.update({ leadEmail: email }).catch(() => undefined);
}

/** POST /api/ai/record with { kind, chatbotId, ...fields }. */
export default async function recordVisitor(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = req.body || {};
    const { kind, chatbotId } = body;
    if (!LIMITS[kind]) throw badRequest("Unknown record type.");
    if (typeof chatbotId !== "string" || !CHATBOT_ID.test(chatbotId)) throw badRequest("Invalid chatbot.");

    const fields = fieldsFor(kind, body);

    const [perVisitor, perChatbot] = LIMITS[kind];
    // The chatbot is read alongside the limits, so a live chat message
    // reaches the owner one round trip sooner.
    const [visitorOk, chatbotOk, chatbotSnap] = await Promise.all([
      takeRateLimit(`rec_${kind}_v_${visitorKey(req)}`, perVisitor),
      takeRateLimit(`rec_${kind}_c_${chatbotId}`, perChatbot),
      adminDb.collection("chatbot_configs").doc(chatbotId).get(),
    ]);
    if (!visitorOk || !chatbotOk) {
      return res.status(429).json({ error: "Too many requests. Please try again in a minute." });
    }

    const chatbot = chatbotSnap.data();
    // Suspended or deleted chatbots take no new records.
    if (!chatbotSnap.exists || chatbot.suspended === true || !chatbot.user_id) {
      return res.status(404).json({ error: "Chatbot not found." });
    }

    if (kind === "message") {
      await appendMessage(chatbotId, chatbot, fields);
      return res.status(201).json({ ok: true });
    }
    if (kind === "seen") {
      if (fields.host) await markSeen(chatbotSnap.ref, chatbot, fields.host);
      return res.status(201).json({ ok: true });
    }
    if (kind === "typing") {
      // Only during a live chat; otherwise nobody is there to see it.
      const ref = adminDb.collection("conversations").doc(`${chatbotId}_${fields.sessionId}`);
      const snap = await ref.get();
      if (snap.exists && ["waiting", "active"].includes(snap.data().liveStatus)) {
        await ref.update({ visitorTypingAt: FieldValue.serverTimestamp() });
      }
      return res.status(201).json({ ok: true });
    }
    if (kind === "handoff") {
      const status = await handoff(chatbotId, chatbot, fields);
      return res.status(201).json({ ok: true, status });
    }

    const record = {
      chatbotId,
      ownerId: chatbot.user_id,
      ...fields,
      timestamp: FieldValue.serverTimestamp(),
    };

    const collection = adminDb.collection(COLLECTIONS[kind]);
    if (kind === "feedback") {
      // One rating per visitor per chatbot; the widget looks it up by this id.
      try {
        await collection.doc(`${chatbotId}_${fields.anonymousToken}`).create(record);
      } catch (error) {
        if (error?.code === 6 /* ALREADY_EXISTS */) {
          return res.status(409).json({ error: "You've already rated this chat." });
        }
        throw error;
      }
    } else {
      await collection.add(record);
    }
    if (kind === "lead") {
      await tagConversationLead(chatbotId, body.sessionId, fields.email);
      await sendLeadAlert({ chatbotId, chatbot, email: fields.email, sessionId: body.sessionId });
    }

    return res.status(201).json({ ok: true });
  } catch (error) {
    if (!error.statusCode) console.error("Failed to save a visitor record:", error);
    return res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : "Request failed." });
  }
}
