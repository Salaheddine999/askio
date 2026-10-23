import { generateChatResponse } from "../_lib/ai.js";
import { assertChatbotAiAvailable } from "../_lib/plan.js";
import { getMonthlyAiReplies, recordAiReply } from "../_lib/aiUsage.js";
import { takeRateLimit, visitorKey } from "../_lib/rateLimit.js";

const MAX_QUERY_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 500;
/** AI requests per minute. A visitor types far slower than this. */
const VISITOR_PER_MINUTE = 12;
const CHATBOT_PER_MINUTE = 60;

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({ error: error.message || "Request failed." });
}

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

    const reply = await generateChatResponse(
      String(query).slice(0, MAX_QUERY_CHARS),
      trimHistory(history),
      Array.isArray(chatbotData.faqData) ? chatbotData.faqData : [],
      chatbotData.aiTone || ""
    );

    // Only replies the visitor actually receives count toward the limit.
    if (reply) {
      await recordAiReply(ownerUid);
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Failed to generate AI chat response:", error);
    return sendError(res, error);
  }
}
