import { beforeEach, describe, expect, it, vi } from "vitest";

// Askio's daily AI ceiling, and the website scan limits on FAQ writing.
// Firestore is an in-memory map; email and the AI are stubbed.
const db = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  emails: [] as { subject: string }[],
  scanAllowed: true,
  budgetAllowed: true,
  aiCalls: [] as { url: string; tone: string }[],
}));

vi.mock("../api/_lib/firebaseAdmin.js", () => {
  const ref = (path: string) => ({
    get: async () => ({ exists: db.docs.has(path), data: () => db.docs.get(path) }),
    set: async (value: Record<string, unknown>) => {
      const current = { ...(db.docs.get(path) || {}) };
      for (const [key, v] of Object.entries(value)) {
        // FieldValue.increment(n) from firebase-admin carries its operand.
        const operand = (v as { operand?: number })?.operand;
        current[key] = typeof operand === "number" ? (Number(current[key]) || 0) + operand : v;
      }
      db.docs.set(path, current);
    },
    create: async (value: Record<string, unknown>) => {
      if (db.docs.has(path)) throw Object.assign(new Error("already exists"), { code: 6 });
      db.docs.set(path, value);
    },
  });
  return { adminDb: { collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`) }) }, adminAuth: {} };
});
vi.mock("../api/_lib/email/send.js", () => ({
  emailConfigured: () => true,
  sendEmail: async (email: { subject: string }) => void db.emails.push(email),
}));

const { takeAiBudget, dailyAiLimit } = await import("../api/_lib/aiBudget.js");

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

beforeEach(() => {
  db.docs.clear();
  db.emails = [];
  db.scanAllowed = true;
  db.budgetAllowed = true;
  db.aiCalls = [];
});

describe("Askio's daily AI limit", () => {
  it("allows calls up to the limit, then refuses and emails the operator once", async () => {
    process.env.AI_DAILY_FAQ_LIMIT = "3";
    expect(dailyAiLimit("faq")).toBe(3);
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await takeAiBudget("faq"));
    expect(results).toEqual([true, true, true, false, false]);
    expect(db.emails).toHaveLength(1);
    expect(db.emails[0].subject).toContain("3 AI FAQ scans");
    delete process.env.AI_DAILY_FAQ_LIMIT;
  });

  it("counts chat replies and FAQ scans apart, with defaults of 5,000 and 200", async () => {
    expect(dailyAiLimit("chat")).toBe(5000);
    expect(dailyAiLimit("faq")).toBe(200);
    await takeAiBudget("chat");
    const counters = [...db.docs.keys()];
    expect(counters).toHaveLength(1);
    expect(counters[0]).toMatch(/^ops\/ai_budget_chat_\d+$/);
  });
});

describe("FAQ writing limits (/api/ai/generate-faq)", () => {
  vi.doMock("../api/_lib/auth.js", () => ({ requireUser: async () => ({ uid: "owner1" }) }));
  vi.doMock("../api/_lib/safeFetch.js", () => ({ assertPublicUrl: async () => undefined }));
  vi.doMock("../api/_lib/plan.js", () => ({
    getOwnedChatbot: async () => ({ chatbotRef: { set: async () => undefined }, chatbotData: { aiEnabled: true } }),
    assertCanUseAiForOwner: async () => ({ userData: {} }),
    assertNotSuspended: () => undefined,
  }));
  vi.doMock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => db.scanAllowed }));
  vi.doMock("../api/_lib/aiBudget.js", () => ({ takeAiBudget: async () => db.budgetAllowed }));
  vi.doMock("../api/_lib/ai.js", () => ({
    generateFaqsFromUrl: async (url: string, _deep: boolean, tone: string) => {
      db.aiCalls.push({ url, tone });
      return [{ question: "Q", answer: "A" }];
    },
  }));
  vi.doMock("../api/_lib/monitoring.js", () => ({ withMonitoring: (_route: string, handler: unknown) => handler }));

  const scan = async (body: Record<string, unknown> = {}) => {
    const { default: generateFaq } = await import("../api/ai/generate-faq.js");
    const res = fakeRes();
    await generateFaq({ method: "POST", headers: {}, body: { chatbotId: "bot1", url: "shop.example", ...body } }, res);
    return res;
  };

  it("writes FAQs, caps the persona text and counts the scan", async () => {
    const res = await scan({ aiTone: "Warm. ".repeat(200) });
    expect(res.statusCode).toBe(200);
    expect(db.aiCalls).toHaveLength(1);
    expect(db.aiCalls[0].tone.length).toBe(300);
    await scan();
    expect(db.docs.get("users/owner1")?.aiScansCount).toBe(2);
  });

  it("stops at the account's daily scans, without calling the AI", async () => {
    db.scanAllowed = false;
    const res = await scan();
    expect(res.statusCode).toBe(429);
    expect(String((res.body as { error: string }).error)).toContain("10 website scans");
    expect(db.aiCalls).toHaveLength(0);
  });

  it("pauses when Askio's daily limit is reached, without calling the AI", async () => {
    db.budgetAllowed = false;
    const res = await scan();
    expect(res.statusCode).toBe(503);
    expect(db.aiCalls).toHaveLength(0);
  });
});
