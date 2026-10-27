import { GoogleGenAI } from "@google/genai";
import { safeFetch } from "./safeFetch.js";

const apiKey = process.env.GEMINI_API_KEY;

function getAiClient() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
}

// Each list tries the next model when one is out of quota or overloaded; every
// model has its own quota. Chat wants speed (Flash-Lite answers in about a
// second); writing FAQs from a website wants quality.
const CHAT_MODELS = ["gemini-3.5-flash-lite", "gemini-2.5-flash"];
const FAQ_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash-lite"];
const RETRY_ON = new Set([429, 500, 503]);

function statusOf(error) {
  if (typeof error?.status === "number") return error.status;
  const match = /"code":\s*(\d{3})/.exec(String(error?.message || ""));
  return match ? Number(match[1]) : 0;
}

/**
 * Calls Gemini within `timeoutMs`, moving to the lighter model when the main
 * one is out of quota or busy. Failures become a plain 503: Google's own
 * error text includes quota details that shouldn't reach visitors or owners.
 */
async function generate(models, request, timeoutMs) {
  const ai = getAiClient();
  const deadline = Date.now() + timeoutMs;
  let lastStatus = 0;
  for (const model of models) {
    const remaining = deadline - Date.now();
    if (remaining < 1500) break;
    // Gemini 2.5 thinks before answering unless told not to; for a short
    // reply that's seconds of waiting for nothing.
    const thinking = request.fast && model.startsWith("gemini-2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {};
    try {
      return await ai.models.generateContent({
        contents: request.contents,
        model,
        config: { ...request.config, ...thinking, abortSignal: AbortSignal.timeout(remaining) },
      });
    } catch (error) {
      lastStatus = statusOf(error);
      console.error(`Gemini ${model} failed: ${lastStatus || error?.name || "error"}`);
      if (!RETRY_ON.has(lastStatus)) break;
    }
  }
  const failure = new Error(
    lastStatus === 429
      ? "The AI is at its usage limit right now. Please try again later."
      : "The AI didn't respond in time. Please try again in a moment."
  );
  failure.statusCode = 503;
  failure.aiStatus = lastStatus;
  // Out of quota, overloaded or slow happens and passes; anything else (a
  // bad key, a retired model) needs a look, so only that is reported.
  failure.expected = lastStatus === 0 || RETRY_ON.has(lastStatus);
  throw failure;
}

// `fetcher` is safeFetch for addresses a user gave us, plain fetch for our own services.
async function fetchWithTimeout(url, options = {}, timeoutMs = 12000, fetcher = fetch) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetcher(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLinksFromHtml(rawHtml, baseUrl) {
  const links = new Set();
  const base = new URL(baseUrl);
  const matches = rawHtml.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of matches) {
    const href = match[1]?.trim();
    const text = stripHtml(match[2] || "").toLowerCase();

    if (!href) continue;

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname !== base.hostname) continue;

      if (
        /about|service|feature|pricing|faq|contact/i.test(text) ||
        /about|service|feature|pricing|faq|contact/i.test(resolved.pathname)
      ) {
        links.add(resolved.href);
      }
    } catch {
      continue;
    }
  }

  return Array.from(links);
}

function extractLinksFromMarkdown(markdown, baseUrl) {
  const links = new Set();
  const base = new URL(baseUrl);
  const matches = markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);

  for (const match of matches) {
    const linkText = (match[1] || "").toLowerCase();
    const href = (match[2] || "").trim();
    if (!href) continue;

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname !== base.hostname) continue;

      if (
        /about|service|feature|pricing|faq|contact/i.test(linkText) ||
        /about|service|feature|pricing|faq|contact/i.test(resolved.pathname)
      ) {
        links.add(resolved.href);
      }
    } catch {
      continue;
    }
  }

  return Array.from(links);
}

function extractPageContent(rawHtml, url) {
  const metaData = [`URL: ${url}`];

  const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) metaData.push(`Page Title: ${titleMatch[1].trim()}`);

  const descMatch =
    rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    rawHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  if (descMatch) metaData.push(`Meta Description: ${descMatch[1].trim()}`);

  const bodyText = stripHtml(rawHtml).slice(0, 12000);
  if (bodyText) {
    metaData.push(`Visible Page Text:\n${bodyText}`);
  }

  return metaData.join("\n");
}

function hasUsefulContent(text) {
  return typeof text === "string" && text.trim().length >= 500;
}

function mergeLinks(...groups) {
  return Array.from(new Set(groups.flat().filter(Boolean)));
}

function safeParseFaqs(resultText) {
  const cleaned = resultText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  const parsedFaqs = JSON.parse(cleaned);
  if (!Array.isArray(parsedFaqs)) {
    throw new Error("AI did not return a FAQ list.");
  }

  return parsedFaqs;
}

export async function generateFaqsFromUrl(url, isDeepCrawl = false, aiTone = "") {
  const requestHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  let rawHtml = "";
  let textContent = "";
  let isSpaFallback = false;

  try {
    const jinaResponse = await fetchWithTimeout(`https://r.jina.ai/${url}`, {}, 10000);
    if (jinaResponse.ok) {
      textContent = await jinaResponse.text();
    }
  } catch (error) {
    console.error("Primary Jina fetch failed:", error);
  }

  if (!hasUsefulContent(textContent)) {
    isSpaFallback = true;

    try {
      const rawResponse = await fetchWithTimeout(url, { headers: requestHeaders }, 10000, safeFetch);

      if (rawResponse.ok) {
        rawHtml = await rawResponse.text();
        textContent = extractPageContent(rawHtml, url);
      }
    } catch (error) {
      console.error("Raw HTML fallback fetch failed:", error);
    }
  }

  if (!textContent || textContent.trim().length < 10) {
    textContent = `URL: ${url}\nWe could not extract enough content from this page to generate FAQs.`;
  }

  if (isDeepCrawl) {
    const topLinks = mergeLinks(
      extractLinksFromMarkdown(textContent, url),
      rawHtml ? extractLinksFromHtml(rawHtml, url) : []
    ).slice(0, 2);

    if (topLinks.length > 0) {
      const deepResponses = await Promise.allSettled(
        topLinks.map(async (link) => {
          try {
            const jinaRes = await fetchWithTimeout(`https://r.jina.ai/${link}`, {}, 8000);
            if (jinaRes.ok) {
              const jinaText = await jinaRes.text();
              if (hasUsefulContent(jinaText)) {
                return jinaText;
              }
            }
          } catch (error) {
            console.error(`Deep crawl Jina fetch failed for ${link}:`, error);
          }

          const res = await fetchWithTimeout(link, { headers: requestHeaders }, 8000, safeFetch);
          if (!res.ok) {
            throw new Error(`Failed to fetch ${link}`);
          }

          return extractPageContent(await res.text(), link);
        })
      );

      deepResponses.forEach((res, index) => {
        if (res.status === "fulfilled" && res.value) {
          textContent += `\n\n--- Content from ${topLinks[index]} ---\n\n${res.value}`;
        }
      });
    }
  }

  textContent = textContent
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 18000);

  const toneInstruction =
    aiTone && aiTone.trim() !== ""
      ? `\nIMPORTANT PERSONA INSTRUCTION: The user has defined a specific persona: "${aiTone}". You must adopt this persona and tone when writing the answers.`
      : "";

  // The chatbot repeats these answers to visitors word for word, so they
  // must say only what the site says, plainly, without sales language.
  const rules = `
      Rules for every answer:
      - State only facts the text says directly. Do not add features, numbers, prices, guarantees or promises that it doesn't state. If the text doesn't cover something, leave that question out instead of guessing.
      - Write plainly and concretely, like a helpful shop assistant. No sales or hype language, such as "absolutely", "valuable insights", "seamless", "cutting-edge", "actionable" or "take your business to the next level". No exclamation marks.
      - Answer the question in the first sentence, then add detail if the text gives it. Keep each answer to one to three short sentences.
      - Prefer what a real visitor would ask: what it is, prices, how it works, delivery, opening hours, returns, contact.
      - Write in the same language as the website text.
      - Speak as the business, using "we" and "our".${toneInstruction}
      - Fewer FAQs are better than invented ones. If the text has nothing factual to work with, return an empty array.

      Return only a raw JSON array of objects, each exactly in this format:
      {"question": "The question", "answer": "The answer"}
  `;

  const prompt = isSpaFallback
    ? `
      You write the FAQ for a business's website chatbot.
      The website at ${url} loads its content with JavaScript, so only this metadata and these fragments could be read:

      ${textContent}

      Write up to 3 frequently asked questions that this text alone can answer.
      ${rules}
    `
    : `
      You write the FAQ for a business's website chatbot.
      Read the website text below and write 3 to 5 frequently asked questions that its visitors would ask, answered only from this text.
      Ignore navigation, cookie notices, privacy policies and placeholder text. Don't write questions about the website's technology.

      Website text:
      ${textContent}
      ${rules}
    `;

  const aiResponse = await generate(
    FAQ_MODELS,
    {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Low, so answers stick to the page instead of embellishing it.
        temperature: 0.3,
      },
    },
    40_000
  );

  const resultText = aiResponse.text;
  if (!resultText) {
    throw new Error("AI returned empty response.");
  }

  return safeParseFaqs(resultText);
}

const LANGUAGE_NAMES = { en: "English", fr: "French", nl: "Dutch", de: "German", es: "Spanish" };

/**
 * A reply to a visitor from the chatbot's FAQs. Returns the reply and whether
 * it answered their question, so the widget can offer a person or ask for an
 * email in any language. `handoff` is what the widget does when it can't
 * answer: "live" (the owner is online and joins), "email" (it asks for one),
 * "human" (a contact button) or "none".
 */
export async function generateChatResponse({
  query,
  history = [],
  faqData = [],
  aiTone = "",
  language = "en",
  botName = "",
  handoff = "none",
}) {
  const chatbotLanguage = LANGUAGE_NAMES[language] || "English";

  const contextStr = faqData
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join("\n\n");

  const historyStr = history
    .slice(-5)
    .map((msg) => `${msg.sender === "user" ? "Visitor" : "You"}: ${msg.text}`)
    .join("\n");

  const whenUnknown = {
    live: "say you don't know, and that you're asking someone from the team to join this chat now, so they should wait a moment",
    email: "say you don't know and that someone from the business can get back to them",
    human: "say you don't know and that they can talk to a person with the button below your message",
    none: "say you don't know and suggest they contact the business directly",
  }[handoff] || "say you don't know";

  const prompt = `
    You are ${botName ? `"${botName}", ` : ""}the chat assistant on a business's website, answering visitors for the business.

    The owner's instructions for your tone:
    "${aiTone || "Helpful, concise and friendly."}"

    Knowledge base, the only facts you may use:
    -----
    ${contextStr || "(empty)"}
    -----

    Recent conversation:
    -----
    ${historyStr || "(none)"}
    -----

    The visitor just wrote: "${query}"

    How to reply:
    - Greetings, thanks and small talk: reply briefly and naturally and offer to help. Don't recite the knowledge base. This counts as answered.
    - Questions: use only facts from the knowledge base. If it covers only part of the question, answer that part and say plainly what you don't know.
    - Never broaden a fact. "There is a free plan" doesn't mean "it's free"; give conditions, prices and limits exactly as the knowledge base states them.
    - If the knowledge base doesn't cover the question, ${whenUnknown}. Don't guess. This counts as not answered.
    - If asked who or what you are, you are ${botName ? `${botName}, ` : ""}the assistant for this website.
    - One to three short sentences, plain text, no markdown, no hype, no exclamation marks.
    - Reply in the visitor's language. If you can't tell, use ${chatbotLanguage}.

    Return JSON: {"reply": "your reply", "answered": true or false}. "answered" is false only when you couldn't answer their question from the knowledge base.
  `;

  const aiResponse = await generate(
    CHAT_MODELS,
    {
      fast: true,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: { reply: { type: "string" }, answered: { type: "boolean" } },
          required: ["reply", "answered"],
        },
        temperature: 0.3,
      },
    },
    8000
  );

  const text = (aiResponse.text || "").trim();
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.reply === "string" && parsed.reply.trim()) {
      return { reply: parsed.reply.trim(), answered: parsed.answered !== false };
    }
  } catch {
    // Not JSON after all: use the text as the reply.
  }
  return { reply: text || null, answered: undefined };
}
