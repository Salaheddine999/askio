import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "../auth.js";
import { adminDb } from "../firebaseAdmin.js";
import { assertNotSuspended, getUserAccessProfile } from "../plan.js";
import { sendError } from "../response.js";

// Live chat, the owner's side: replying to a visitor who asked for a person,
// and ending the chat. Visitors ask through POST /api/ai/record (kind
// "handoff"); both sides watch the conversation in Firestore.

const CONVERSATION_ID = /^[A-Za-z0-9_-]{1,64}_[A-Za-z0-9_-]{8,64}$/;
const MAX_REPLY_CHARS = 1000;
/** Same cap as visitor messages, well under Firestore's 1 MB document limit. */
const MAX_MESSAGES = 200;
/** The owner can join a chat whose visitor wrote within this long. */
export const JOIN_WINDOW_MS = 30 * 60_000;

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/** The first name the visitor sees next to your replies. */
function agentNameFor(decoded) {
  const name = String(decoded.name || "").trim().split(/\s+/)[0] || "";
  return name.slice(0, 40);
}

async function ownedLiveConversation(uid, conversationId) {
  if (typeof conversationId !== "string" || !CONVERSATION_ID.test(conversationId)) {
    throw httpError(400, "Which conversation? Send its id.");
  }
  const ref = adminDb.collection("conversations").doc(conversationId);
  // Both reads at once: each one is a round trip to the database.
  const [profile, snap] = await Promise.all([getUserAccessProfile(uid), ref.get()]);
  assertNotSuspended(profile.userData);
  if (profile.access.plan === "free" || !profile.access.isSubscriptionActive) {
    throw httpError(403, "Live chat is part of the Pro plan.");
  }
  if (!snap.exists || snap.data().ownerId !== uid) throw httpError(404, "Conversation not found.");
  return { ref, chatbotId: snap.data().chatbotId };
}

/** Whether the owner may write into this chat now. */
function canReply(data) {
  if (data.liveStatus === "waiting" || data.liveStatus === "active") return true;
  // Otherwise only while the visitor is likely still there, on a chatbot whose
  // widget follows the conversation (live chat on).
  const last = data.lastMessageAt?.toMillis?.() ?? 0;
  return data.liveStatus !== undefined && data.liveStatus !== null && Date.now() - last < JOIN_WINDOW_MS;
}

/** POST /api/account/live-reply { conversationId, text } and /api/account/live-end { conversationId }. */
export default async function liveChat(req, res, action) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const decoded = await requireUser(req);
    const { conversationId, text } = req.body || {};
    const { ref, chatbotId } = await ownedLiveConversation(decoded.uid, conversationId);

    if (action === "end") {
      await ref.update({ liveStatus: "ended", liveEndedAt: FieldValue.serverTimestamp() });
      return res.status(200).json({ ok: true });
    }

    const reply = typeof text === "string" ? text.trim().slice(0, MAX_REPLY_CHARS) : "";
    if (!reply) throw httpError(400, "Write a reply first.");
    const agentName = agentNameFor(decoded);

    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const data = snap.data();
      if (!canReply(data)) {
        const chatbot = (await transaction.get(adminDb.collection("chatbot_configs").doc(chatbotId))).data();
        throw httpError(
          409,
          chatbot?.liveChat === true
            ? "This visitor left a while ago, so they won't see a reply here."
            : "Turn on Live chat for this chatbot to reply to visitors."
        );
      }
      if ((Number(data.messageCount) || 0) >= MAX_MESSAGES) throw httpError(409, "This conversation is full.");
      transaction.update(ref, {
        messages: FieldValue.arrayUnion({ role: "agent", text: reply, at: Date.now(), name: agentName }),
        messageCount: FieldValue.increment(1),
        lastMessageAt: FieldValue.serverTimestamp(),
        liveStatus: "active",
        agentName,
      });
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    return sendError(res, error);
  }
}
