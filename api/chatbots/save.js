import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "../_lib/auth.js";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { assertCanEnableAiChatbot, getOwnedChatbot } from "../_lib/plan.js";

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({ error: error.message || "Request failed." });
}

function normalizeFaqData(faqData) {
  if (!Array.isArray(faqData)) return [];

  return faqData
    .filter((item) => item && typeof item.question === "string" && typeof item.answer === "string")
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer);
}

function normalizeChatbotPayload(payload, uid) {
  const aiEnabled = payload.aiEnabled === true;

  return {
    name: String(payload.name || "").trim(),
    title: String(payload.title || "").trim(),
    primaryColor: String(payload.primaryColor || "#4F46E5"),
    secondaryColor: String(payload.secondaryColor || "#6366F1"),
    position: String(payload.position || "bottom-right"),
    initialMessage: String(payload.initialMessage || "Hello! How can I help you today?"),
    placeholder: String(payload.placeholder || "Type your message..."),
    faqData: normalizeFaqData(payload.faqData),
    liveChatLink: String(payload.liveChatLink || "").trim(),
    enableLeadCapture: payload.enableLeadCapture === true,
    aiEnabled,
    aiTone: aiEnabled ? String(payload.aiTone || "").trim() : "",
    user_id: uid,
    lastUpdated: FieldValue.serverTimestamp(),
  };
}

export default async function handler(req, res) {
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

    const targetRef = chatbotId
      ? adminDb.collection("chatbot_configs").doc(chatbotId)
      : adminDb.collection("chatbot_configs").doc();

    if (chatbotId) {
      await getOwnedChatbot(decodedToken.uid, chatbotId);
    }

    if (normalized.aiEnabled) {
      await assertCanEnableAiChatbot(decodedToken.uid, chatbotId || targetRef.id);
    }

    const existingSnap = chatbotId ? await targetRef.get() : null;
    const payload = {
      ...normalized,
      createdAt: existingSnap?.exists
        ? existingSnap.data().createdAt || FieldValue.serverTimestamp()
        : FieldValue.serverTimestamp(),
    };

    await targetRef.set(payload, { merge: true });

    return res.status(200).json({
      chatbotId: targetRef.id,
      aiEnabled: normalized.aiEnabled,
    });
  } catch (error) {
    console.error("Failed to save chatbot config:", error);
    return sendError(res, error);
  }
}
