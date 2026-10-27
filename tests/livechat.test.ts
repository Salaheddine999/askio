import { beforeEach, describe, expect, it, vi } from "vitest";

// Live chat on the server: a visitor asking for a person (the record
// endpoint) and the owner replying or ending it (account actions), with
// Firestore, auth and plans stubbed.
const fake = vi.hoisted(() => {
  const state = {
    chatbots: {} as Record<string, Record<string, unknown>>,
    conversations: {} as Record<string, Record<string, unknown>>,
    plan: "pro",
    uid: "owner1",
  };
  const apply = (id: string, data: Record<string, unknown>) => {
    const current = state.conversations[id] || {};
    const next: Record<string, unknown> = { ...current };
    for (const [key, value] of Object.entries(data)) {
      const v = value as { _union?: unknown[]; _inc?: number } | null;
      if (v && Array.isArray(v._union)) next[key] = [...((current[key] as unknown[]) || []), ...v._union];
      else if (v && typeof v._inc === "number") next[key] = ((current[key] as number) || 0) + v._inc;
      else next[key] = value;
    }
    state.conversations[id] = next;
  };
  const docRef = (name: string, id: string) => ({
    id,
    get: async () => {
      const data = name === "chatbot_configs" ? state.chatbots[id] : state.conversations[id];
      return { exists: Boolean(data), data: () => data };
    },
    update: async (data: Record<string, unknown>) => apply(id, data),
  });
  const adminDb = {
    collection: (name: string) => ({ doc: (id: string) => docRef(name, id), add: async () => undefined }),
    runTransaction: async (fn: (t: unknown) => Promise<unknown>) =>
      fn({
        get: async (ref: { id: string }) => ({ exists: Boolean(state.conversations[ref.id]), data: () => state.conversations[ref.id] }),
        set: (ref: { id: string }, data: Record<string, unknown>) => void (state.conversations[ref.id] = { ...data }),
        update: (ref: { id: string }, data: Record<string, unknown>) => apply(ref.id, data),
      }),
  };
  return { state, adminDb };
});

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: () => "now",
    arrayUnion: (...items: unknown[]) => ({ _union: items }),
    increment: (n: number) => ({ _inc: n }),
  },
}));
vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: fake.adminDb, adminAuth: {} }));
vi.mock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => true, visitorKey: () => "visitor" }));
vi.mock("../api/_lib/auth.js", () => ({ requireUser: async () => ({ uid: fake.state.uid, name: "Sara Janssen" }) }));
vi.mock("../api/_lib/plan.js", () => ({
  getUserAccessProfile: async () => ({
    userData: {},
    access: { plan: fake.state.plan, isSubscriptionActive: fake.state.plan !== "free" },
  }),
  assertNotSuspended: () => undefined,
}));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: () => undefined }));
vi.mock("../api/_lib/push.js", () => ({ pushLiveChatRequest: async () => 0 }));

const { default: recordVisitor } = await import("../api/_lib/widget/recordVisitor.js");
const { default: liveChat } = await import("../api/_lib/account/liveChat.js");

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
const SESSION = "session12345";
const CONVERSATION = `bot1_${SESSION}`;
const handoff = (action: "request" | "cancel") => ({
  method: "POST",
  headers: {},
  body: { kind: "handoff", action, chatbotId: "bot1", sessionId: SESSION },
});
const owner = (text?: string, conversationId = CONVERSATION) => ({ method: "POST", headers: {}, body: { conversationId, text } });

beforeEach(() => {
  fake.state.chatbots = { bot1: { user_id: "owner1", saveConversations: true, liveChat: true } };
  fake.state.conversations = {};
  fake.state.plan = "pro";
  fake.state.uid = "owner1";
});

describe("a visitor asking for a person", () => {
  it("is refused when live chat is off", async () => {
    fake.state.chatbots.bot1.liveChat = false;
    const res = fakeRes();
    await recordVisitor(handoff("request"), res);
    expect(res.statusCode).toBe(403);
    expect(fake.state.conversations).toEqual({});
  });

  it("is refused when the owner isn't on a paid plan", async () => {
    fake.state.plan = "free";
    const res = fakeRes();
    await recordVisitor(handoff("request"), res);
    expect(res.statusCode).toBe(403);
  });

  it("marks the conversation as waiting, for the owner", async () => {
    const res = fakeRes();
    await recordVisitor(handoff("request"), res);
    expect(res.statusCode).toBe(201);
    expect(fake.state.conversations[CONVERSATION]).toMatchObject({ ownerId: "owner1", chatbotId: "bot1", liveStatus: "waiting" });
  });

  it("gives up as missed, but never ends a chat the owner joined", async () => {
    await recordVisitor(handoff("request"), fakeRes());
    await recordVisitor(handoff("cancel"), fakeRes());
    expect(fake.state.conversations[CONVERSATION].liveStatus).toBe("missed");

    fake.state.conversations[CONVERSATION].liveStatus = "active";
    await recordVisitor(handoff("cancel"), fakeRes());
    expect(fake.state.conversations[CONVERSATION].liveStatus).toBe("active");
  });
});

describe("conversations on a live-chat chatbot", () => {
  it("start joinable, so the visitor's widget can follow them", async () => {
    const res = fakeRes();
    await recordVisitor(
      { method: "POST", headers: {}, body: { kind: "message", chatbotId: "bot1", role: "visitor", text: "Hi", sessionId: SESSION } },
      res
    );
    expect(res.statusCode).toBe(201);
    expect(fake.state.conversations[CONVERSATION]).toMatchObject({ liveStatus: "idle", preview: "Hi" });
  });

  it("stay private when live chat is off", async () => {
    fake.state.chatbots.bot1.liveChat = false;
    await recordVisitor(
      { method: "POST", headers: {}, body: { kind: "message", chatbotId: "bot1", role: "visitor", text: "Hi", sessionId: SESSION } },
      fakeRes()
    );
    expect(fake.state.conversations[CONVERSATION].liveStatus).toBeUndefined();
  });
});

describe("typing and pages", () => {
  const typing = () => ({ method: "POST", headers: {}, body: { kind: "typing", chatbotId: "bot1", sessionId: SESSION } });

  it("the visitor's typing is noted only during a live chat", async () => {
    fake.state.conversations[CONVERSATION] = { ownerId: "owner1", liveStatus: "idle", messages: [] };
    await recordVisitor(typing(), fakeRes());
    expect(fake.state.conversations[CONVERSATION].visitorTypingAt).toBeUndefined();
    fake.state.conversations[CONVERSATION].liveStatus = "active";
    await recordVisitor(typing(), fakeRes());
    expect(fake.state.conversations[CONVERSATION].visitorTypingAt).toBe("now");
  });

  it("keeps the page a visitor wrote from, without its query or hash", async () => {
    await recordVisitor(
      {
        method: "POST",
        headers: {},
        body: { kind: "message", chatbotId: "bot1", role: "visitor", text: "Hi", sessionId: SESSION, page: "https://shop.example/products/sofa?email=a@b.co#reviews" },
      },
      fakeRes()
    );
    expect(fake.state.conversations[CONVERSATION].lastPage).toBe("https://shop.example/products/sofa");
  });
});

describe("the owner replying live", () => {
  beforeEach(() => {
    fake.state.conversations[CONVERSATION] = { ownerId: "owner1", liveStatus: "waiting", messageCount: 2, messages: [] };
  });

  it("adds the reply with their first name and starts the chat", async () => {
    const res = fakeRes();
    await liveChat(owner("Hi, Sara here. How can I help?"), res, "reply");
    expect(res.statusCode).toBe(201);
    const conversation = fake.state.conversations[CONVERSATION];
    expect(conversation).toMatchObject({ liveStatus: "active", agentName: "Sara", messageCount: 3 });
    expect(conversation.messages).toEqual([expect.objectContaining({ role: "agent", text: "Hi, Sara here. How can I help?", name: "Sara" })]);
  });

  it("can't reply to someone else's conversation, or without Pro", async () => {
    fake.state.uid = "stranger";
    const other = fakeRes();
    await liveChat(owner("Hello"), other, "reply");
    expect(other.statusCode).toBe(404);

    fake.state.uid = "owner1";
    fake.state.plan = "free";
    const free = fakeRes();
    await liveChat(owner("Hello"), free, "reply");
    expect(free.statusCode).toBe(403);
  });

  it("can't reply once the chat has ended, or send an empty reply", async () => {
    const empty = fakeRes();
    await liveChat(owner("   "), empty, "reply");
    expect(empty.statusCode).toBe(400);

    await liveChat(owner(), fakeRes(), "end");
    expect(fake.state.conversations[CONVERSATION].liveStatus).toBe("ended");
    const late = fakeRes();
    await liveChat(owner("Still there?"), late, "reply");
    expect(late.statusCode).toBe(409);
  });

  it("can join a chat the visitor wrote in just now, without being asked", async () => {
    fake.state.conversations[CONVERSATION] = {
      ownerId: "owner1",
      liveStatus: "idle",
      messageCount: 1,
      messages: [],
      lastMessageAt: { toMillis: () => Date.now() - 2 * 60_000 },
    };
    const res = fakeRes();
    await liveChat(owner("Hi! Can I help with your order?"), res, "reply");
    expect(res.statusCode).toBe(201);
    expect(fake.state.conversations[CONVERSATION].liveStatus).toBe("active");
  });

  it("can't join a chat the visitor left long ago", async () => {
    fake.state.conversations[CONVERSATION] = {
      ownerId: "owner1",
      liveStatus: "idle",
      messageCount: 1,
      messages: [],
      lastMessageAt: { toMillis: () => Date.now() - 60 * 60_000 },
    };
    const res = fakeRes();
    await liveChat(owner("Hello?"), res, "reply");
    expect(res.statusCode).toBe(409);
  });

  it("rejects a malformed conversation id", async () => {
    const res = fakeRes();
    await liveChat(owner("Hi", "../users/x"), res, "reply");
    expect(res.statusCode).toBe(400);
  });
});
