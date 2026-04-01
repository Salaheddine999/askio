import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "../_lib/auth.js";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { getUserAccessProfile } from "../_lib/plan.js";

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

async function saveChatbotConfigTransactional({ uid, chatbotId, normalized }) {
  const profile = await getUserAccessProfile(uid);
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

    const savedChatbotId = await saveChatbotConfigTransactional({
      uid: decodedToken.uid,
      chatbotId,
      normalized,
    });

    return res.status(200).json({
      chatbotId: savedChatbotId,
      aiEnabled: normalized.aiEnabled,
    });
  } catch (error) {
    console.error("Failed to save chatbot config:", error);
    return sendError(res, error);
  }
}
