import { FieldValue } from "firebase-admin/firestore";
import { sendError } from "../_lib/response.js";
import { requireUser } from "../_lib/auth.js";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { assertNotSuspended, getUserAccessProfile } from "../_lib/plan.js";
import { withMonitoring } from "../_lib/monitoring.js";


// Owners can star up to this many questions for the widget to suggest.
const MAX_SUGGESTED = 3;
export const MAX_FAQS = 200;
const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"];
// A hex colour, or the two-colour gradient the editor makes. Nothing else
// reaches the widget's styles (no url() that would load from elsewhere).
const HEX = /^#[0-9a-f]{3,8}$/i;
const GRADIENT = /^linear-gradient\(\s*-?\d+(?:\.\d+)?deg\s*,\s*#[0-9a-f]{3,8}\s*,\s*#[0-9a-f]{3,8}\s*\)$/i;

export function normalizeColor(value, fallback) {
  const color = typeof value === "string" ? value.trim() : "";
  return HEX.test(color) || GRADIENT.test(color) ? color : fallback;
}

/** Free text, trimmed and cut to a length that fits its place in the widget. */
const clip = (value, max) => String(value ?? "").trim().slice(0, max);

/** A button link on an FAQ answer: a web page, email, phone or WhatsApp. */
export function normalizeButtonUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > 500) return null;
  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(raw)) return raw;
  if (/^[^@\s/:]+@[^@\s]+\.[^@\s]+$/.test(raw)) return `mailto:${raw}`;
  if (/^tel:\+?[\d\s().-]{5,}$/i.test(raw)) return raw.replace(/\s+/g, "");
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const MAX_PAGE_GREETINGS = 10;

/** Greetings for pages whose address contains `match`, e.g. "/pricing". */
export function normalizePageGreetings(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      match: typeof item?.match === "string" ? item.match.trim().toLowerCase().slice(0, 100) : "",
      message: typeof item?.message === "string" ? item.message.trim().slice(0, 50) : "",
    }))
    .filter((item) => item.match && item.message)
    .slice(0, MAX_PAGE_GREETINGS);
}

export function normalizeFaqData(faqData) {
  if (!Array.isArray(faqData)) return [];

  let starred = 0;
  return faqData
    .filter((item) => item && typeof item.question === "string" && typeof item.answer === "string")
    .map((item) => {
      const buttonLabel = typeof item.buttonLabel === "string" ? item.buttonLabel.trim().slice(0, 40) : "";
      const buttonUrl = normalizeButtonUrl(item.buttonUrl);
      return {
        question: item.question.trim().slice(0, 300),
        answer: item.answer.trim().slice(0, 2000),
        suggested: item.suggested === true,
        // An optional button under the answer ("Track my order"); both parts or neither.
        ...(buttonLabel && buttonUrl ? { buttonLabel, buttonUrl } : {}),
      };
    })
    .filter((item) => item.question && item.answer)
    .slice(0, MAX_FAQS)
    .map(({ suggested, ...item }) =>
      suggested && starred < MAX_SUGGESTED ? (starred++, { ...item, suggested: true }) : item
    );
}

export const KIO_PERSONALITIES = ["lively", "calm", "shy"];

/** Kio's personality and finish; anything unexpected keeps today's look. */
export function normalizeKioStyle(payload) {
  return {
    kioPersonality: KIO_PERSONALITIES.includes(payload.kioPersonality) ? payload.kioPersonality : "lively",
    kioFinish: payload.kioFinish === "matte" ? "matte" : "glossy",
  };
}

function normalizeChatbotPayload(payload, uid) {
  const aiEnabled = payload.aiEnabled === true;

  return {
    name: clip(payload.name, 80),
    title: clip(payload.title, 80),
    primaryColor: normalizeColor(payload.primaryColor, "#4F46E5"),
    secondaryColor: normalizeColor(payload.secondaryColor, "#6366F1"),
    position: POSITIONS.includes(payload.position) ? payload.position : "bottom-right",
    launcherStyle: payload.launcherStyle === "orb" ? "orb" : "classic",
    ...normalizeKioStyle(payload),
    greetingBubble: payload.greetingBubble === true,
    pageGreetings: normalizePageGreetings(payload.pageGreetings),
    initialMessage: clip(payload.initialMessage, 500) || "Hello! How can I help you today?",
    placeholder: clip(payload.placeholder, 120) || "Type your message...",
    language: ["en", "fr", "nl", "de", "es"].includes(payload.language) ? payload.language : "en",
    faqData: normalizeFaqData(payload.faqData),
    liveChatLink: clip(payload.liveChatLink, 500),
    enableLeadCapture: payload.enableLeadCapture === true,
    // "Answered from: …" under replies; on unless the owner turns it off.
    showSources: payload.showSources !== false,
    saveConversations: payload.saveConversations === true,
    // Live chat replies through the saved conversation, so it needs history.
    liveChat: payload.liveChat === true && payload.saveConversations === true,
    aiEnabled,
    aiTone: aiEnabled ? clip(payload.aiTone, 500) : "",
    user_id: uid,
    lastUpdated: FieldValue.serverTimestamp(),
  };
}

async function saveChatbotConfigTransactional({ uid, chatbotId, normalized }) {
  const profile = await getUserAccessProfile(uid);
  assertNotSuspended(profile.userData);
  const targetRef = chatbotId
    ? adminDb.collection("chatbot_configs").doc(chatbotId)
    : adminDb.collection("chatbot_configs").doc();

  await adminDb.runTransaction(async (transaction) => {
    const existingSnap = await transaction.get(targetRef);

    if (chatbotId) {
      if (!existingSnap.exists) {
        const error = new Error("Chatbot not found.");
        error.statusCode = 404;
        throw error;
      }

      if (existingSnap.data()?.user_id !== uid) {
        const error = new Error("You do not have access to this chatbot.");
        error.statusCode = 403;
        throw error;
      }
    }

    // Conversation history is a paid feature; it quietly stays off otherwise.
    if (normalized.saveConversations && (profile.access.plan === "free" || !profile.access.isSubscriptionActive)) {
      normalized.saveConversations = false;
      normalized.liveChat = false;
    }

    if (normalized.aiEnabled) {
      if (profile.access.plan === "free") {
        const error = new Error("AI features are available on Pro and Enterprise plans only.");
        error.statusCode = 403;
        throw error;
      }

      if (!profile.access.isSubscriptionActive) {
        const error = new Error("Your subscription is not active. Please update billing to use AI features.");
        error.statusCode = 403;
        throw error;
      }

      if (profile.access.plan !== "enterprise") {
        const aiEnabledQuery = adminDb
          .collection("chatbot_configs")
          .where("user_id", "==", uid)
          .where("aiEnabled", "==", true);

        const aiEnabledSnap = await transaction.get(aiEnabledQuery);
        const currentCount = aiEnabledSnap.docs.filter((doc) => doc.id !== targetRef.id).length;

        if (currentCount >= profile.access.aiChatbotLimit) {
          const error = new Error(
            `Your plan supports up to ${profile.access.aiChatbotLimit} AI chatbots. Contact us to enable more.`
          );
          error.statusCode = 403;
          throw error;
        }
      }
    }

    transaction.set(
      targetRef,
      {
        ...normalized,
        createdAt: existingSnap.exists
          ? existingSnap.data().createdAt || FieldValue.serverTimestamp()
          : FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return targetRef.id;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decodedToken = await requireUser(req);
    const { chatbotId = "", config = {} } = req.body || {};

    const normalized = normalizeChatbotPayload(config, decodedToken.uid);

    if (!normalized.name || !normalized.title) {
      return res.status(400).json({ error: "Chatbot name and title are required." });
    }

    const savedChatbotId = await saveChatbotConfigTransactional({
      uid: decodedToken.uid,
      chatbotId,
      normalized,
    });

    return res.status(200).json({
      chatbotId: savedChatbotId,
      aiEnabled: normalized.aiEnabled,
      saveConversations: normalized.saveConversations,
      liveChat: normalized.liveChat,
    });
  } catch (error) {
    console.error("Failed to save chatbot config:", error);
    return sendError(res, error);
  }
}

export default withMonitoring("chatbots/save", handler);
