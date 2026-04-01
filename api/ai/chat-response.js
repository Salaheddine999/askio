import { generateChatResponse } from "../_lib/ai.js";
import { assertChatbotAiAvailable } from "../_lib/plan.js";

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({ error: error.message || "Request failed." });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { chatbotId, query, history = [] } = req.body || {};

    if (!chatbotId || !query) {
      return res.status(400).json({ error: "Chatbot ID and query are required." });
    }

    const { chatbotData } = await assertChatbotAiAvailable(chatbotId);

    const reply = await generateChatResponse(
      String(query),
      Array.isArray(history) ? history : [],
      Array.isArray(chatbotData.faqData) ? chatbotData.faqData : [],
      chatbotData.aiTone || ""
    );

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Failed to generate AI chat response:", error);
    return sendError(res, error);
  }
}
