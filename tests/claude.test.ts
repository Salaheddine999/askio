import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// AI replies and FAQ writing on Claude, with Gemini as the fallback. Both
// SDKs and the website fetch are stubbed.
const fake = vi.hoisted(() => ({
  claudeCalls: [] as { params: Record<string, unknown>; options: Record<string, unknown>; beta: boolean }[],
  claudeReply: "" as string,
  claudeError: null as null | { status: number },
  geminiCalls: 0,
  geminiText: "",
  reported: [] as unknown[],
}));

vi.mock("@anthropic-ai/sdk", () => {
  const create = (beta: boolean) => async (params: Record<string, unknown>, options: Record<string, unknown>) => {
    fake.claudeCalls.push({ params, options, beta });
    if (fake.claudeError) throw Object.assign(new Error("claude error"), fake.claudeError);
    return { stop_reason: "end_turn", content: [{ type: "text", text: fake.claudeReply }] };
  };
  return {
    default: class {
      messages = { create: create(false) };
      beta = { messages: { create: create(true) } };
    },
  };
});
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: async () => {
        fake.geminiCalls++;
        return { text: fake.geminiText };
      },
    };
  },
}));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: (e: unknown) => void fake.reported.push(e) }));

const realFetch = globalThis.fetch;
globalThis.fetch = (async () => new Response("We sell sofas and ship across Europe. ".repeat(40), { status: 200 })) as typeof fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});
process.env.ANTHROPIC_API_KEY = "sk-ant-test";
process.env.GEMINI_API_KEY = "gemini-test";

const { generateChatResponse, generateFaqsFromUrl } = await import("../api/_lib/ai.js");

const faqData = [
  { question: "Do you ship to Belgium?", answer: "Yes, in 2 to 3 days." },
  { question: "Can I return a sofa?", answer: "Within 30 days." },
];

beforeEach(() => {
  fake.claudeCalls = [];
  fake.claudeReply = JSON.stringify({ reply: "Yes, in 2 to 3 days.", answered: true, sources: [1] });
  fake.claudeError = null;
  fake.geminiCalls = 0;
  fake.geminiText = JSON.stringify({ reply: "From Gemini.", answered: true, sources: [] });
  fake.reported = [];
});

describe("chat replies", () => {
  it("come from Claude Haiku 5.5, fast and as JSON", async () => {
    const result = await generateChatResponse({ query: "Belgium?", faqData });
    expect(result).toEqual({ reply: "Yes, in 2 to 3 days.", answered: true, sources: ["Do you ship to Belgium?"] });
    expect(fake.geminiCalls).toBe(0);
    const { params, options, beta } = fake.claudeCalls[0];
    expect(beta).toBe(false);
    expect(params).toMatchObject({
      model: "claude-haiku-5-5",
      thinking: { type: "disabled" },
      output_config: { effort: "low", format: { type: "json_schema" } },
    });
    expect(params).not.toHaveProperty("temperature");
    expect(options).toMatchObject({ timeout: 7000 });
  });

  it("fall back to Gemini when Claude is busy, without reporting it", async () => {
    fake.claudeError = { status: 529 };
    const result = await generateChatResponse({ query: "Belgium?", faqData });
    expect(result.reply).toBe("From Gemini.");
    expect(fake.geminiCalls).toBe(1);
    expect(fake.reported).toHaveLength(0);
  });

  it("report a broken Claude setup, and still answer from Gemini", async () => {
    fake.claudeError = { status: 401 };
    const result = await generateChatResponse({ query: "Belgium?", faqData });
    expect(result.reply).toBe("From Gemini.");
    expect(fake.reported).toHaveLength(1);
  });
});

describe("FAQ writing", () => {
  it("comes from Claude Sonnet 5.5 with the server-side fallback", async () => {
    fake.claudeReply = JSON.stringify({ faqs: [{ question: "Do you ship to Europe?", answer: "Yes, we ship across Europe." }] });
    const faqs = await generateFaqsFromUrl("https://shop.example/");
    expect(faqs).toEqual([{ question: "Do you ship to Europe?", answer: "Yes, we ship across Europe." }]);
    const { params, beta } = fake.claudeCalls[0];
    expect(beta).toBe(true);
    expect(params).toMatchObject({
      model: "claude-sonnet-5-5",
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema" } },
    });
    expect(params).not.toHaveProperty("thinking");
  });
});
