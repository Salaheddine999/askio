import { requireUser } from "../_lib/auth.js";
import { generateFaqsFromUrl } from "../_lib/ai.js";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { assertCanUseAiForOwner, getOwnedChatbot } from "../_lib/plan.js";

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
    const decodedToken = await requireUser(req);
    const { chatbotId, url, isDeepCrawl = false, aiTone = "" } = req.body || {};

    if (!chatbotId || !url) {
      return res.status(400).json({ error: "Chatbot ID and URL are required." });
    }

    const { chatbotRef, chatbotData } = await getOwnedChatbot(decodedToken.uid, chatbotId);
    await assertCanUseAiForOwner(decodedToken.uid);

    if (!chatbotData.aiEnabled) {
      return res.status(403).json({
        error: "Enable AI for this chatbot before generating FAQs.",
      });
    }

    const faqs = await generateFaqsFromUrl(url, Boolean(isDeepCrawl), aiTone);

    await adminDb.collection("users").doc(decodedToken.uid).set(
      {
        aiScansCount: (Number((await adminDb.collection("users").doc(decodedToken.uid).get()).data()?.aiScansCount) || 0) + 1,
      },
      { merge: true }
    );

    await chatbotRef.set(
      {
        lastAiFaqGeneratedAt: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ faqs });
  } catch (error) {
    console.error("Failed to generate FAQs:", error);
    return sendError(res, error);
  }
}
