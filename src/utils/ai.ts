import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateFaqsFromUrl = async (url: string, isDeepCrawl: boolean = false, aiTone?: string) => {
  try {
    // 1. Scrape the primary website text using Jina AI's Reader (bypasses CORS & renders JS)
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    
    let textContent = await response.text();
    
    // Some sites (especially heavy SPAs) might return an empty body through Jina scraping.
    // For these, we extract metadata from raw HTML and give Gemini the URL + context.
    let isSpaFallback = false;
    if (!textContent || textContent.trim().length < 100) {
      console.warn("Jina Reader returned empty or very short text. Extracting metadata from raw HTML...");
      isSpaFallback = true;
      
      try {
        const rawResponse = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        if (rawResponse.ok) {
          const rawHtml = await rawResponse.text();
          
          // Extract useful structured data from the HTML
          const metaData: string[] = [];
          metaData.push(`URL: ${url}`);
          
          // Title
          const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) metaData.push(`Page Title: ${titleMatch[1].trim()}`);
          
          // Meta description
          const descMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
            || rawHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
          if (descMatch) metaData.push(`Meta Description: ${descMatch[1].trim()}`);
          
          // OG tags (title, description, site_name, type)
          const ogTags = rawHtml.matchAll(/<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi);
          for (const og of ogTags) {
            metaData.push(`OG ${og[1]}: ${og[2].trim()}`);
          }
          // Also try reverse order (content before property)
          const ogTagsRev = rawHtml.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:([^"']+)["']/gi);
          for (const og of ogTagsRev) {
            metaData.push(`OG ${og[2]}: ${og[1].trim()}`);
          }
          
          // JSON-LD structured data
          const jsonLdMatches = rawHtml.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
          for (const jld of jsonLdMatches) {
            metaData.push(`Structured Data (JSON-LD): ${jld[1].trim()}`);
          }
          
          // __NEXT_DATA__ for Next.js sites
          const nextDataMatch = rawHtml.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
          if (nextDataMatch) {
            metaData.push(`Next.js Page Data: ${nextDataMatch[1].trim()}`);
          }

          // Extract all visible text-like strings from inline scripts (often contain CMS data)
          // Look for long text strings in the HTML that look like actual content
          const textStrings = rawHtml.match(/["']([^"']{50,})["']/g) || [];
          const contentStrings = textStrings
            .map(s => s.slice(1, -1))
            .filter(s => !s.includes('{') && !s.includes('<') && !s.includes('http') && !s.includes('function') && !s.includes('webpack'))
            .slice(0, 10);
          if (contentStrings.length > 0) {
            metaData.push(`Extracted Text Content:\n${contentStrings.join('\n')}`);
          }

          textContent = metaData.join('\n');
        }
      } catch (fallbackError) {
        console.error("Fallback HTML fetch failed:", fallbackError);
      }
      
      // For SPA fallback, even minimal metadata is acceptable since we'll tell Gemini the URL
      if (!textContent || textContent.trim().length < 10) {
        textContent = `URL: ${url}\n(This is a JavaScript-heavy SPA website. No text content could be extracted.)`;
      }
    }

    // 2. Deep Crawl Logic (Optional Pro Feature)
    if (isDeepCrawl) {
      // Regex to find markdown links: [text](link) and filter for priority pages
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const links = new Set<string>();
      let match;
      
      while ((match = linkRegex.exec(textContent)) !== null) {
        const linkText = match[1].toLowerCase();
        const linkPath = match[2];
        
        // Only grab relative links or links matching the base domain
        if (linkPath.startsWith('http') && !linkPath.includes(new URL(url).hostname)) continue;
        
        // Priority keywords for Deep Crawling
        if (/about|service|feature|pricing|faq|contact/i.test(linkText) || 
            /about|service|feature|pricing|faq|contact/i.test(linkPath)) {
            
            // Normalize path
            const fullLink = linkPath.startsWith('http') ? linkPath : new URL(linkPath, url).href;
            links.add(fullLink);
        }
      }

      // Take top 3 unique relevant links
      const topLinks = Array.from(links).slice(0, 3);
      
      if (topLinks.length > 0) {
        console.log("Deep Crawling sub-pages:", topLinks);
        // Fetch them concurrently
        const deepResponses = await Promise.allSettled(
          topLinks.map(link => fetch(`https://r.jina.ai/${link}`).then(res => res.text()))
        );
        
        // Append all successful texts together
        deepResponses.forEach((res, index) => {
          if (res.status === 'fulfilled' && res.value) {
             textContent += `\n\n--- Content from ${topLinks[index]} ---\n\n${res.value}`;
          }
        });
      }
    }

    // Limit to 80k chars to stay safe within Gemini Flash context (1M tokens is plenty though)
    textContent = textContent.slice(0, 80000);

    // Tone instructions block
    const toneInstruction = aiTone && aiTone.trim() !== "" 
      ? `\nIMPORTANT PERSONA INSTRUCTION: The user has defined a specific persona: "${aiTone}". You must adopt this persona and tone when writing the answers.`
      : "";

    // 3. Call Gemini with different prompts depending on whether we had full text or just metadata
    const prompt = isSpaFallback
      ? `
      You are an expert customer support agent and business analyst.
      I need you to generate FAQs for the website at this URL: ${url}
      
      The website is a JavaScript-heavy Single Page Application, so we could only extract the following metadata and fragments:
      
      ${textContent}
      
      Based on this metadata (especially the title, description, OG tags, and any structured data), determine what this business or website is about.
      Then generate between 3 to 7 high-quality Frequently Asked Questions and their answers that would be relevant for customers visiting this website.
      The FAQs must be about the BUSINESS, its SERVICES, or its PRODUCTS — NOT about the website's technology stack.
      If the metadata suggests it's a French website, write the FAQs in French.${toneInstruction}
      Assume the persona of the company answering a customer's question. Use "we" and "our" (or "nous" and "notre" if French).
      
      Return ONLY a raw JSON array of objects. Do not wrap it in \`\`\`json markdown blocks.
      Each object must exactly match this format:
      {"question": "The generated question", "answer": "The generated answer"}
    `
      : `
      You are an expert customer support agent and business analyst. 
      First, analyze the following website content to figure out exactly what the company does, what services they provide, or what products they sell if it's a shop.
      Then, acting as a knowledgeable representative of that company, generate between 3 to 7 high-quality, most common Frequently Asked Questions (FAQs) and their corresponding answers.
      The questions and answers must be highly specific to their actual business, products, or services based strictly on the provided text.
      Assume the persona of the company answering a customer's question. Use "we" and "our" where appropriate.${toneInstruction}
      Ignore irrelevant navigational text, privacy policies, cookie notices, or generic placeholder text.
      IMPORTANT: Do NOT generate FAQs about the website's technology, frameworks, or development tools. Only generate FAQs about the actual business.
      
      Website Content:
      ${textContent}
      
      Return ONLY a raw JSON array of objects. Do not wrap it in \`\`\`json markdown blocks.
      Each object must exactly match this format:
      {"question": "The generated question", "answer": "The generated answer"}
    `;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = aiResponse.text;
    
    if (!resultText) {
        throw new Error("AI returned empty response");
    }

    try {
      const parsedFaqs = JSON.parse(resultText);
      if (!Array.isArray(parsedFaqs)) {
          throw new Error("AI did not return an array");
      }
      return parsedFaqs;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", resultText);
      throw new Error("Failed to parse the AI generated FAQs.");
    }

  } catch (error) {
    console.error("Error generating FAQs:", error);
    throw error;
  }
};

export const generateChatResponse = async (
  query: string,
  history: Array<{ text: string; sender: "user" | "bot" }>,
  faqData: Array<{ question: string; answer: string }>,
  aiTone: string
) => {
  try {
    const contextStr = faqData
      .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
      .join("\n\n");

    const historyStr = history
      .slice(-5) // Send last 5 messages for context
      .map((msg) => `${msg.sender === "user" ? "User" : "Agent"}: ${msg.text}`)
      .join("\n");

    const prompt = `
      You are an AI assistant for a website.
      Here is your persona/instructions from the website owner:
      "${aiTone}"

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
      1. Answer the user's question using ONLY the information provided in the knowledge base.
      2. If the user's question asks for information not found in the knowledge base, politely state that you don't know the answer and offer to connect them with a human agent. Do not make up information.
      3. CRITICAL: You must adopt the persona/tone described above. Your entire response must sound like it's coming from that persona.
      
      Provide your response below without any markdown formatting or prefix.
    `;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return aiResponse.text;
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
};
