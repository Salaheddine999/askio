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
  const profile = await getUserAccessProfile(uid);
  assertNotSuspended(profile.userData);
  if (profile.access.plan === "free" || !profile.access.isSubscriptionActive) {
    throw httpError(403, "Live chat is part of the Pro plan.");
  }
  const ref = adminDb.collection("conversations").doc(conversationId);
  const snap = await ref.get();
  if (!snap.exists || snap.data().ownerId !== uid) throw httpError(404, "Conversation not found.");
  return ref;
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
    const ref = await ownedLiveConversation(decoded.uid, conversationId);

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
      // You can reply while the visitor waits or chats with you, not after.
      if (!["waiting", "active"].includes(data.liveStatus)) throw httpError(409, "This chat has ended.");
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
