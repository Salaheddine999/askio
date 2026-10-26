import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A tiny stand-in for Firestore and the rate limiter, so the real handlers
// run without credentials or network.
const db = vi.hoisted(() => {
  const state = {
    chatbots: {} as Record<string, Record<string, unknown>>,
    writes: [] as { collection: string; id?: string; data: Record<string, unknown> }[],
    deleted: [] as string[],
    conversations: {} as Record<string, Record<string, unknown>>,
  };
  const collection = (name: string) => ({
    doc: (id: string) => ({
      id,
      get: async () => {
        const data = name === "chatbot_configs" ? state.chatbots[id] : state.conversations[id];
        return { exists: Boolean(data), data: () => data };
      },
      delete: async () => void state.deleted.push(`${name}/${id}`),
      create: async (data: Record<string, unknown>) => void state.writes.push({ collection: name, id, data }),
      update: async () => undefined,
    }),
    add: async (data: Record<string, unknown>) => void state.writes.push({ collection: name, data }),
  });
  const runTransaction = async (fn: (t: unknown) => Promise<void>) =>
    fn({
      get: async (ref: { id: string }) => ({ exists: Boolean(state.conversations[ref.id]), data: () => state.conversations[ref.id] }),
      set: (ref: { id: string }, data: Record<string, unknown>) => {
        state.conversations[ref.id] = data;
        state.writes.push({ collection: "conversations", id: ref.id, data });
      },
      update: (ref: { id: string }, data: Record<string, unknown>) => {
        state.writes.push({ collection: "conversations", id: ref.id, data });
      },
    });
  return { state, adminDb: { collection, runTransaction }, rate: { allow: true }, plan: { value: "pro" } };
});

vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: db.adminDb, adminAuth: {} }));
vi.mock("../api/_lib/rateLimit.js", () => ({
  takeRateLimit: async () => db.rate.allow,
  visitorKey: () => "visitor",
}));
vi.mock("../api/_lib/plan.js", () => ({
  getUserAccessProfile: async () => ({
    access: { plan: db.plan.value, isSubscriptionActive: db.plan.value !== "free" },
  }),
}));

const { default: shopifyWebhook } = await import("../api/shopify/webhooks/[topic].js");
const { default: recordVisitor } = await import("../api/_lib/widget/recordVisitor.js");
const { withMonitoring } = await import("../api/_lib/monitoring.js");

function fakeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headersSent: false,
    setHeader: () => undefined,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      res.headersSent = true;
      return res;
    },
  };
  return res;
}

beforeEach(() => {
  db.state.chatbots = { bot1: { user_id: "owner1", saveConversations: true } };
  db.state.writes = [];
  db.state.deleted = [];
  db.state.conversations = {};
  db.rate.allow = true;
  db.plan.value = "pro";
});

describe("Shopify privacy webhooks", () => {
  const body = JSON.stringify({ shop_domain: "demo.myshopify.com" });
  const sign = (raw: string) => crypto.createHmac("sha256", "test-shopify-secret").update(raw).digest("base64");
  const request = (topic: string, raw: string, signature?: string, method = "POST") => ({
    method,
    query: { topic },
    headers: signature ? { "x-shopify-hmac-sha256": signature } : {},
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(raw);
    },
  });

  it("rejects unsigned and tampered requests", async () => {
    for (const req of [request("shop-redact", body), request("shop-redact", body.replace("demo", "evil"), sign(body))]) {
      const res = fakeRes();
      await shopifyWebhook(req, res);
      expect(res.statusCode).toBe(401);
    }
    expect(db.state.deleted).toEqual([]);
  });

  it("accepts a signed shop-redact and deletes the store's connection", async () => {
    const res = fakeRes();
    await shopifyWebhook(request("shop-redact", body, sign(body)), res);
    expect(res.statusCode).toBe(200);
    expect(db.state.deleted).toEqual(["shopify_connections/demo_myshopify_com"]);
  });

  it("only allows POST", async () => {
    const res = fakeRes();
    await shopifyWebhook(request("shop-redact", body, sign(body), "GET"), res);
    expect(res.statusCode).toBe(405);
  });
});

describe("Visitor records (/api/ai/record)", () => {
  const post = (body: Record<string, unknown>) => ({ method: "POST", headers: {}, body: { chatbotId: "bot1", ...body } });

  it("saves a valid lead with the owner taken from the chatbot", async () => {
    const res = fakeRes();
    await recordVisitor(post({ kind: "lead", email: "sara@example.com", ownerId: "attacker" }), res);
    expect(res.statusCode).toBe(201);
    expect(db.state.writes[0]).toMatchObject({ collection: "leads", data: { email: "sara@example.com", ownerId: "owner1" } });
  });

  it.each([
    [{ kind: "lead", email: "not-an-email" }, 400],
    [{ kind: "event", type: "page_view" }, 400],
    [{ kind: "spam" }, 400],
    [{ kind: "lead", email: "a@b.co", chatbotId: "../users/x" }, 400],
  ])("rejects %j", async (body, status) => {
    const res = fakeRes();
    await recordVisitor(post(body), res);
    expect(res.statusCode).toBe(status);
    expect(db.state.writes).toEqual([]);
  });

  it("answers 429 when a visitor sends too much", async () => {
    db.rate.allow = false;
    const res = fakeRes();
    await recordVisitor(post({ kind: "lead", email: "sara@example.com" }), res);
    expect(res.statusCode).toBe(429);
    expect(db.state.writes).toEqual([]);
  });

  it("refuses records for suspended chatbots", async () => {
    db.state.chatbots.bot1.suspended = true;
    const res = fakeRes();
    await recordVisitor(post({ kind: "unanswered", query: "Hello?" }), res);
    expect(res.statusCode).toBe(404);
  });

  describe("conversation messages", () => {
    const message = { kind: "message", role: "visitor", text: "Do you ship to Rotterdam?", sessionId: "session12345" };

    it("are saved for Pro owners who turned history on", async () => {
      const res = fakeRes();
      await recordVisitor(post(message), res);
      expect(res.statusCode).toBe(201);
      expect(db.state.writes[0]).toMatchObject({
        collection: "conversations",
        id: "bot1_session12345",
        data: { ownerId: "owner1", preview: "Do you ship to Rotterdam?", messageCount: 1 },
      });
    });

    it("are dropped when history is off", async () => {
      db.state.chatbots.bot1.saveConversations = false;
      await recordVisitor(post(message), fakeRes());
      expect(db.state.writes).toEqual([]);
    });

    it("are dropped when the owner isn't on a paid plan", async () => {
      db.plan.value = "free";
      await recordVisitor(post(message), fakeRes());
      expect(db.state.writes).toEqual([]);
    });

    it("need a valid role and session", async () => {
      for (const bad of [{ role: "admin" }, { sessionId: "x" }]) {
        const res = fakeRes();
        await recordVisitor(post({ ...message, ...bad }), res);
        expect(res.statusCode).toBe(400);
      }
    });
  });
});

describe("withMonitoring", () => {
  it("turns a crash into a 500 instead of failing the function", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = fakeRes();
    await withMonitoring("test", async () => {
      throw new Error("boom");
    })({}, res);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Request failed." });
    quiet.mockRestore();
  });

  it("leaves normal responses alone", async () => {
    const res = fakeRes();
    await withMonitoring("test", async (_req: unknown, r: ReturnType<typeof fakeRes>) => r.status(204).json({}))({}, res);
    expect(res.statusCode).toBe(204);
  });
});
