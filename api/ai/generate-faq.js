import { requireUser } from "../_lib/auth.js";
import { sendError } from "../_lib/response.js";
import { generateFaqsFromUrl } from "../_lib/ai.js";
import { assertPublicUrl } from "../_lib/safeFetch.js";
import { adminDb } from "../_lib/firebaseAdmin.js";
import { assertCanUseAiForOwner, assertNotSuspended, getOwnedChatbot } from "../_lib/plan.js";
import { withMonitoring } from "../_lib/monitoring.js";
import { noteAiFailure } from "../_lib/aiHealth.js";
import { takeRateLimit } from "../_lib/rateLimit.js";
import { takeAiBudget } from "../_lib/aiBudget.js";
import { FieldValue } from "firebase-admin/firestore";

/** Website scans per account per UTC day. Each one is a long Sonnet call. */
export const FAQ_SCANS_PER_DAY = 10;
const DAY_MS = 86_400_000;
/** The persona goes into the prompt; a sentence or two is all it needs. */
const MAX_TONE_CHARS = 300;


function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const normalized = new URL(withProtocol);
    if (!["http:", "https:"].includes(normalized.protocol)) {
      return null;
    }

    return normalized.toString();
  } catch {
    return null;
  }
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decodedToken = await requireUser(req);
    const { chatbotId, url, isDeepCrawl = false, aiTone = "" } = req.body || {};

    const normalizedUrl = normalizeUrl(url);

    if (!chatbotId) {
      return res.status(400).json({ error: "Chatbot ID is required." });
    }

    if (!normalizedUrl) {
      return res.status(400).json({ error: "Please provide a valid website URL." });
    }

    // Only public websites: never localhost, private networks or cloud metadata.
    await assertPublicUrl(normalizedUrl);

    const { chatbotRef, chatbotData } = await getOwnedChatbot(decodedToken.uid, chatbotId);
    const ownerProfile = await assertCanUseAiForOwner(decodedToken.uid);
    assertNotSuspended(ownerProfile.userData);

    if (!chatbotData.aiEnabled) {
      return res.status(403).json({
        error: "Enable AI for this chatbot before generating FAQs.",
      });
    }

    // Checked last, so a refused request (no plan, AI off) doesn't use a scan.
    if (!(await takeRateLimit(`faq_${decodedToken.uid}`, FAQ_SCANS_PER_DAY, DAY_MS))) {
      return res.status(429).json({
        error: `You've used today's ${FAQ_SCANS_PER_DAY} website scans. You can scan again tomorrow, or add FAQs by hand.`,
      });
    }
    if (!(await takeAiBudget("faq"))) {
      return res.status(503).json({ error: "FAQ writing is paused for today. Please try again tomorrow, or add FAQs by hand." });
    }

    const tone = typeof aiTone === "string" ? aiTone.slice(0, MAX_TONE_CHARS) : "";
    const faqs = await generateFaqsFromUrl(normalizedUrl, Boolean(isDeepCrawl), tone);

    await adminDb.collection("users").doc(decodedToken.uid).set({ aiScansCount: FieldValue.increment(1) }, { merge: true });

    await chatbotRef.set(
      {
        lastAiFaqGeneratedAt: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ faqs });
  } catch (error) {
    console.error("Failed to generate FAQs:", error);
    // Gemini itself failed (quota, timeout, outage), not the request.
    if (error.aiStatus !== undefined) await noteAiFailure(error.aiStatus, "faq");
    return sendError(res, error);
  }
}

export default withMonitoring("ai/generate-faq", handler);
