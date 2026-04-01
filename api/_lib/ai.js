import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

function getAiClient() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
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
  const ai = getAiClient();
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
      const rawResponse = await fetchWithTimeout(
        url,
        { headers: requestHeaders },
        10000
      );

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

          const res = await fetchWithTimeout(link, { headers: requestHeaders }, 8000);
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

  const prompt = isSpaFallback
    ? `
      You are an expert customer support agent and business analyst.
      I need you to generate FAQs for the website at this URL: ${url}

      The website is a JavaScript-heavy Single Page Application, so we could only extract the following metadata and fragments:

      ${textContent}

      Based on this metadata, determine what this business or website is about.
      Then generate between 3 to 5 high-quality Frequently Asked Questions and their answers relevant for customers visiting this website.
      The FAQs must be about the business, its services, or its products.
      If the metadata suggests it's a French website, write the FAQs in French.${toneInstruction}
      Assume the persona of the company answering a customer's question. Use "we" and "our" where appropriate.

      Return only a raw JSON array of objects.
      Each object must exactly match this format:
      {"question": "The generated question", "answer": "The generated answer"}
    `
    : `
      You are an expert customer support agent and business analyst.
      First, analyze the following website content to figure out exactly what the company does and what services or products they provide.
      Then, acting as a knowledgeable representative of that company, generate between 3 to 5 high-quality, common Frequently Asked Questions and answers.
      The questions and answers must be highly specific to their actual business, products, or services based strictly on the provided text.
      Assume the persona of the company answering a customer's question. Use "we" and "our" where appropriate.${toneInstruction}
      Ignore irrelevant navigational text, privacy policies, cookie notices, or generic placeholder text.
      Do not generate FAQs about the website's technology, frameworks, or development tools.

      Website Content:
      ${textContent}

      Return only a raw JSON array of objects.
      Each object must exactly match this format:
      {"question": "The generated question", "answer": "The generated answer"}
    `;

  const aiResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const resultText = aiResponse.text;
  if (!resultText) {
    throw new Error("AI returned empty response.");
  }

  return safeParseFaqs(resultText);
}

export async function generateChatResponse(query, history, faqData, aiTone) {
  const ai = getAiClient();

  const contextStr = faqData
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join("\n\n");

  const historyStr = history
    .slice(-5)
    .map((msg) => `${msg.sender === "user" ? "User" : "Agent"}: ${msg.text}`)
    .join("\n");

  const prompt = `
    You are an AI assistant for a website.
    Here is your persona/instructions from the website owner:
    "${aiTone || "You are helpful, concise, and friendly."}"

    Here is the official knowledge base (FAQs) you must use to answer questions:
    -----
    ${contextStr || "No FAQs provided."}
    -----

    Here is the recent conversation history:
    -----
    ${historyStr}
    -----

    The user just said: "${query}"

    Instructions:
    1. Answer the user's question using only the information provided in the knowledge base.
    2. If the user's question asks for information not found in the knowledge base, politely state that you don't know the answer and offer to connect them with a human agent.
    3. Do not make up information.
    4. Adopt the persona described above.

    Provide your response below without markdown formatting or prefix.
  `;

  const aiResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return aiResponse.text;
}
