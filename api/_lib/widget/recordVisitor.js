import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin.js";
import { takeRateLimit, visitorKey } from "../rateLimit.js";

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
};

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
    case "feedback":
      if (typeof body.isPositive !== "boolean") throw badRequest("Invalid rating.");
      return { isPositive: body.isPositive, anonymousToken: token(body.anonymousToken, { required: true }) };
    default:
      throw badRequest("Unknown record type.");
  }
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
    const [visitorOk, chatbotOk] = await Promise.all([
      takeRateLimit(`rec_${kind}_v_${visitorKey(req)}`, perVisitor),
      takeRateLimit(`rec_${kind}_c_${chatbotId}`, perChatbot),
    ]);
    if (!visitorOk || !chatbotOk) {
      return res.status(429).json({ error: "Too many requests. Please try again in a minute." });
    }

    const chatbotSnap = await adminDb.collection("chatbot_configs").doc(chatbotId).get();
    const chatbot = chatbotSnap.data();
    // Suspended or deleted chatbots take no new records.
    if (!chatbotSnap.exists || chatbot.suspended === true || !chatbot.user_id) {
      return res.status(404).json({ error: "Chatbot not found." });
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

    return res.status(201).json({ ok: true });
  } catch (error) {
    if (!error.statusCode) console.error("Failed to save a visitor record:", error);
    return res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : "Request failed." });
  }
}
