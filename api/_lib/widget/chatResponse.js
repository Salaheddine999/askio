import { generateChatResponse } from "../ai.js";
import { sendError } from "../response.js";
import { assertChatbotAiAvailable } from "../plan.js";
import { getMonthlyAiReplies, recordAiReply } from "../aiUsage.js";
import { takeRateLimit, visitorKey } from "../rateLimit.js";
import { reportError } from "../monitoring.js";

const MAX_QUERY_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 500;
/** AI requests per minute. A visitor types far slower than this. */
const VISITOR_PER_MINUTE = 12;
const CHATBOT_PER_MINUTE = 60;


// Only the last few messages matter for context, and each is trimmed, so a
// long or crafted conversation can't inflate the prompt.
function trimHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .filter((msg) => msg && typeof msg.text === "string")
    .map((msg) => ({
      sender: msg.sender === "user" ? "user" : "bot",
      text: msg.text.slice(0, MAX_HISTORY_CHARS),
    }));
}

// No AI reply this time; the widget answers from the bot's FAQs instead.
function sendFallback(res, reason) {
  return res.status(200).json({ reply: null, fallback: reason });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { chatbotId, query, history = [] } = req.body || {};

    if (typeof chatbotId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(chatbotId) || !query) {
      return res.status(400).json({ error: "Chatbot ID and query are required." });
    }

    const [visitorAllowed, chatbotAllowed] = await Promise.all([
      takeRateLimit(`visitor_${visitorKey(req)}`, VISITOR_PER_MINUTE),
      takeRateLimit(`chatbot_${chatbotId}`, CHATBOT_PER_MINUTE),
    ]);
    if (!visitorAllowed || !chatbotAllowed) {
      return sendFallback(res, "rate_limited");
    }

    let availability;
    try {
      availability = await assertChatbotAiAvailable(chatbotId);
    } catch (error) {
      // AI switched off or the owner's plan lapsed: keep answering from FAQs.
      if (error.statusCode === 403) return sendFallback(res, "ai_unavailable");
      throw error;
    }
    const { chatbotData, ownerProfile } = availability;
    const ownerUid = chatbotData.user_id;

    const used = await getMonthlyAiReplies(ownerUid);
    if (used >= ownerProfile.access.aiReplyLimit) {
      return sendFallback(res, "monthly_limit");
    }

    let result;
    try {
      result = await generateChatResponse({
        query: String(query).slice(0, MAX_QUERY_CHARS),
        history: trimHistory(history),
        faqData: Array.isArray(chatbotData.faqData) ? chatbotData.faqData : [],
        aiTone: chatbotData.aiTone || "",
        language: chatbotData.language || "en",
        botName: String(chatbotData.title || "").slice(0, 60),
        handoff: chatbotData.enableLeadCapture === true ? "email" : chatbotData.liveChatLink ? "human" : "none",
      });
    } catch (error) {
      // Out of quota, overloaded or slow: the widget answers from the FAQs.
      if (error.statusCode !== 503) throw error;
      reportError(error, { route: "chat-response", aiStatus: error.aiStatus });
      return sendFallback(res, "ai_error");
    }

    // Only replies the visitor actually receives count toward the limit.
    if (result.reply) {
      await recordAiReply(ownerUid);
    }

    return res.status(200).json({ reply: result.reply, answered: result.answered });
  } catch (error) {
    console.error("Failed to generate AI chat response:", error);
    return sendError(res, error);
  }
}
