import { beforeEach, describe, expect, it, vi } from "vitest";

// The chat endpoint with Firestore, plans, usage and Gemini stubbed out.
const ai = vi.hoisted(() => ({
  result: null as unknown,
  error: null as (Error & { statusCode?: number }) | null,
  recorded: 0,
  liveChat: false,
  presence: null as null | { online: boolean; lastSeen: { toMillis: () => number } },
  handoff: "" as string,
  budgetLeft: true,
  called: 0,
}));

vi.mock("../api/_lib/firebaseAdmin.js", () => ({
  adminDb: { collection: () => ({ doc: () => ({ get: async () => ({ data: () => ai.presence ?? undefined }) }) }) },
  adminAuth: {},
}));
vi.mock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => true, takeRateLimits: async () => true, visitorKey: () => "visitor" }));
vi.mock("../api/_lib/plan.js", () => ({
  assertChatbotAiAvailable: async () => ({
    chatbotData: {
      user_id: "owner1",
      title: "Shop bot",
      faqData: [{ question: "Q", answer: "A" }],
      liveChat: ai.liveChat,
      saveConversations: ai.liveChat,
    },
    ownerProfile: { access: { aiReplyLimit: 3000 } },
  }),
}));
vi.mock("../api/_lib/aiUsage.js", () => ({
  getMonthlyAiReplies: async () => 0,
  recordAiReply: async () => void ai.recorded++,
}));
vi.mock("../api/_lib/ai.js", () => ({
  generateChatResponse: async ({ handoff }: { handoff: string }) => {
    ai.handoff = handoff;
    ai.called++;
    if (ai.error) throw ai.error;
    return ai.result;
  },
}));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: () => undefined }));
vi.mock("../api/_lib/aiBudget.js", () => ({ takeAiBudget: async () => ai.budgetLeft, dailyAiLimit: () => 5000 }));

const { default: chatResponse } = await import("../api/_lib/widget/chatResponse.js");

function fakeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    setHeader: () => undefined,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}
const ask = () => ({ method: "POST", headers: {}, body: { chatbotId: "bot1", query: "Do you ship?" } });

beforeEach(() => {
  ai.result = null;
  ai.error = null;
  ai.recorded = 0;
  ai.liveChat = false;
  ai.presence = null;
  ai.handoff = "";
  ai.budgetLeft = true;
  ai.called = 0;
});

describe("AI chat replies (/api/ai/chat-response)", () => {
  it("returns the reply and whether it answered, and counts it", async () => {
    ai.result = { reply: "Yes, to Belgium.", answered: true };
    const res = fakeRes();
    await chatResponse(ask(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "Yes, to Belgium.", answered: true, sources: [], live: false });
    expect(ai.recorded).toBe(1);
  });

  it("hands off to the owner when they're online for live chat", async () => {
    ai.liveChat = true;
    ai.presence = { online: true, lastSeen: { toMillis: () => Date.now() - 30_000 } };
    ai.result = { reply: "I'm asking someone from the team to join.", answered: false };
    const res = fakeRes();
    await chatResponse(ask(), res);
    expect(ai.handoff).toBe("live");
    expect(res.body).toMatchObject({ live: true, answered: false });
  });

  it("doesn't hand off when the owner's status is stale", async () => {
    ai.liveChat = true;
    ai.presence = { online: true, lastSeen: { toMillis: () => Date.now() - 10 * 60_000 } };
    ai.result = { reply: "I don't know.", answered: false };
    const res = fakeRes();
    await chatResponse(ask(), res);
    expect(ai.handoff).toBe("none");
    expect(res.body).toMatchObject({ live: false });
  });

  it("falls back to the FAQs, without counting, when Gemini is out of quota or slow", async () => {
    ai.error = Object.assign(new Error("The AI is at its usage limit right now."), { statusCode: 503 });
    const res = fakeRes();
    await chatResponse(ask(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: null, fallback: "ai_error" });
    expect(ai.recorded).toBe(0);
  });

  it("answers from the FAQs, without calling the AI, once Askio's daily limit is reached", async () => {
    ai.budgetLeft = false;
    ai.result = { reply: "Yes.", answered: true };
    const res = fakeRes();
    await chatResponse(ask(), res);
    expect(res.body).toEqual({ reply: null, fallback: "daily_limit" });
    expect(ai.called).toBe(0);
    expect(ai.recorded).toBe(0);
  });
});
