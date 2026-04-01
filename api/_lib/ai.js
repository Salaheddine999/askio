import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

function getAiClient() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
}

export async function generateFaqsFromUrl(url, isDeepCrawl = false, aiTone = "") {
  const ai = getAiClient();

  const jinaUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(jinaUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  let textContent = await response.text();
  let isSpaFallback = false;

  if (!textContent || textContent.trim().length < 100) {
    isSpaFallback = true;

    try {
      const rawResponse = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (rawResponse.ok) {
        const rawHtml = await rawResponse.text();
        const metaData = [`URL: ${url}`];

        const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) metaData.push(`Page Title: ${titleMatch[1].trim()}`);

        const descMatch =
          rawHtml.match(
            /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
          ) ||
          rawHtml.match(
            /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
          );
        if (descMatch) metaData.push(`Meta Description: ${descMatch[1].trim()}`);

        const ogTags = rawHtml.matchAll(
          /<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi
        );
        for (const og of ogTags) {
          metaData.push(`OG ${og[1]}: ${og[2].trim()}`);
        }

        const ogTagsRev = rawHtml.matchAll(
          /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:([^"']+)["']/gi
        );
        for (const og of ogTagsRev) {
          metaData.push(`OG ${og[2]}: ${og[1].trim()}`);
        }

        const jsonLdMatches = rawHtml.matchAll(
          /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        );
        for (const jld of jsonLdMatches) {
          metaData.push(`Structured Data (JSON-LD): ${jld[1].trim()}`);
        }

        const nextDataMatch = rawHtml.match(
          /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
        );
        if (nextDataMatch) {
          metaData.push(`Next.js Page Data: ${nextDataMatch[1].trim()}`);
        }

        const textStrings = rawHtml.match(/["']([^"']{50,})["']/g) || [];
        const contentStrings = textStrings
          .map((s) => s.slice(1, -1))
          .filter(
            (s) =>
              !s.includes("{") &&
              !s.includes("<") &&
              !s.includes("http") &&
              !s.includes("function") &&
              !s.includes("webpack")
          )
          .slice(0, 10);

        if (contentStrings.length > 0) {
          metaData.push(`Extracted Text Content:\n${contentStrings.join("\n")}`);
        }

        textContent = metaData.join("\n");
      }
    } catch (fallbackError) {
      console.error("Fallback HTML fetch failed:", fallbackError);
    }

    if (!textContent || textContent.trim().length < 10) {
      textContent = `URL: ${url}\n(This is a JavaScript-heavy SPA website. No text content could be extracted.)`;
    }
  }

  if (isDeepCrawl) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = new Set();
    let match;

    while ((match = linkRegex.exec(textContent)) !== null) {
      const linkText = match[1].toLowerCase();
      const linkPath = match[2];

      if (linkPath.startsWith("http") && !linkPath.includes(new URL(url).hostname)) {
        continue;
      }

      if (
        /about|service|feature|pricing|faq|contact/i.test(linkText) ||
        /about|service|feature|pricing|faq|contact/i.test(linkPath)
      ) {
        const fullLink = linkPath.startsWith("http")
          ? linkPath
          : new URL(linkPath, url).href;
        links.add(fullLink);
      }
    }

    const topLinks = Array.from(links).slice(0, 3);
    if (topLinks.length > 0) {
      const deepResponses = await Promise.allSettled(
        topLinks.map((link) => fetch(`https://r.jina.ai/${link}`).then((res) => res.text()))
      );

      deepResponses.forEach((res, index) => {
        if (res.status === "fulfilled" && res.value) {
          textContent += `\n\n--- Content from ${topLinks[index]} ---\n\n${res.value}`;
        }
      });
    }
  }

  textContent = textContent.slice(0, 80000);

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
      Then generate between 3 to 7 high-quality Frequently Asked Questions and their answers relevant for customers visiting this website.
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
      Then, acting as a knowledgeable representative of that company, generate between 3 to 7 high-quality, common Frequently Asked Questions and answers.
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

  const parsedFaqs = JSON.parse(resultText);
  if (!Array.isArray(parsedFaqs)) {
    throw new Error("AI did not return a FAQ list.");
  }

  return parsedFaqs;
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
