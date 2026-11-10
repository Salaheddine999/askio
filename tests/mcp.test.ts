import { beforeEach, describe, expect, it, vi } from "vitest";

// An in-memory stand-in for Firestore, so the real key handlers, MCP endpoint
// and chatbot save path run without credentials or network.
const db = vi.hoisted(() => {
  type Doc = Record<string, unknown>;
  const state = { data: {} as Record<string, Record<string, Doc>>, nextId: 1, rateAllow: true, scans: [] as unknown[] };
  const table = (name: string) => (state.data[name] ||= {});

  const docRef = (name: string, id: string) => ({
    id,
    collectionName: name,
    get: async () => ({ id, ref: docRef(name, id), exists: id in table(name), data: () => table(name)[id] }),
    set: async (data: Doc, options?: { merge?: boolean }) => {
      table(name)[id] = options?.merge ? { ...table(name)[id], ...data } : { ...data };
    },
    update: async (data: Doc) => {
      table(name)[id] = { ...table(name)[id], ...data };
    },
    delete: async () => {
      delete table(name)[id];
    },
  });

  const query = (name: string, filters: [string, unknown][] = [], max = Infinity) => ({
    isQuery: true,
    where: (field: string, _op: string, value: unknown) => query(name, [...filters, [field, value]], max),
    orderBy: () => query(name, filters, max),
    limit: (n: number) => query(name, filters, n),
    get: async () => {
      const docs = Object.entries(table(name))
        .filter(([, doc]) => filters.every(([field, value]) => doc[field] === value))
        .slice(0, max)
        .map(([id, doc]) => ({ id, ref: docRef(name, id), data: () => doc }));
      return { docs, size: docs.length, empty: docs.length === 0 };
    },
  });

  const collection = (name: string) => ({
    ...query(name),
    doc: (id?: string) => docRef(name, id ?? `auto${state.nextId++}`),
  });

  const runTransaction = async (fn: (t: unknown) => Promise<unknown>) =>
    fn({
      get: (target: { get: () => Promise<unknown> }) => target.get(),
      set: (ref: ReturnType<typeof docRef>, data: Doc, options?: { merge?: boolean }) => void ref.set(data, options),
    });

  return { state, table, adminDb: { collection, runTransaction } };
});

vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: db.adminDb, adminAuth: {} }));
vi.mock("../api/_lib/auth.js", () => ({
  requireUser: async (req: { uid?: string }) => {
    if (!req.uid) throw Object.assign(new Error("Authentication required."), { statusCode: 401 });
    return { uid: req.uid };
  },
}));
vi.mock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => db.state.rateAllow }));
vi.mock("../api/_lib/aiBudget.js", () => ({ takeAiBudget: async () => true }));
vi.mock("../api/_lib/aiHealth.js", () => ({ noteAiFailure: async () => undefined }));
vi.mock("../api/_lib/safeFetch.js", () => ({ assertPublicUrl: async () => undefined }));
vi.mock("../api/_lib/ai.js", () => ({
  generateFaqsFromUrl: async (...args: unknown[]) => {
    db.state.scans.push(args);
    return [{ question: "Do you ship abroad?", answer: "Yes." }];
  },
}));

const { default: apiKeys, hashApiKey, MAX_KEYS } = await import("../api/_lib/apiKeys.js");
const { default: mcp } = await import("../api/mcp.js");

function fakeRes() {
  const res = {
    statusCode: 0,
    // The tests read many shapes of answer from it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: undefined as any,
    headers: {} as Record<string, string>,
    headersSent: false,
    setHeader: (name: string, value: string) => void (res.headers[name] = value),
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      res.headersSent = true;
      return res;
    },
    end() {
      res.headersSent = true;
      return res;
    },
  };
  return res;
}

async function keyAction(action: string, uid: string, body: Record<string, unknown> = {}) {
  const res = fakeRes();
  await apiKeys({ method: "POST", uid, body } as never, res as never, action);
  return res;
}

async function newKey(uid: string, name = "Claude Code") {
  return (await keyAction("create", uid, { name })).body.key as string;
}

async function rpc(key: string | null, body: unknown, method = "POST") {
  const res = fakeRes();
  await mcp({ method, headers: key ? { authorization: `Bearer ${key}` } : {}, body } as never, res as never);
  return res;
}

/** Calls a tool and returns its result, parsed when it's JSON. */
async function call(key: string, name: string, args: Record<string, unknown> = {}) {
  const res = await rpc(key, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  const result = res.body.result;
  const text = result.content[0].text as string;
  return { isError: result.isError as boolean, text, data: result.isError ? null : JSON.parse(text) };
}

beforeEach(() => {
  db.state.data = {
    users: {
      owner1: { plan: "pro", subscriptionStatus: "active" },
      owner2: { plan: "free" },
    },
  };
  db.state.nextId = 1;
  db.state.rateAllow = true;
  db.state.scans = [];
});

describe("API keys", () => {
  it("shows the key once and stores only its hash", async () => {
    const res = await keyAction("create", "owner1", { name: "  Claude Code  " });
    expect(res.statusCode).toBe(200);
    expect(res.body.key).toMatch(/^askio_[A-Za-z0-9_-]{32}$/);
    expect(res.body.name).toBe("Claude Code");

    const stored = db.table("api_keys");
    expect(Object.keys(stored)).toEqual([hashApiKey(res.body.key)]);
    expect(JSON.stringify(stored)).not.toContain(res.body.key);

    const list = await keyAction("list", "owner1");
    expect(list.body.keys).toHaveLength(1);
    expect(JSON.stringify(list.body)).not.toContain(res.body.key);
    expect(list.body.keys[0].hint).toBe(`askio_…${res.body.key.slice(-4)}`);
  });

  it("needs a name and stops at the limit", async () => {
    expect((await keyAction("create", "owner1", { name: " " })).statusCode).toBe(400);
    for (let i = 0; i < MAX_KEYS; i++) expect((await keyAction("create", "owner1", { name: `k${i}` })).statusCode).toBe(200);
    expect((await keyAction("create", "owner1", { name: "one more" })).statusCode).toBe(400);
    // Another account's keys don't count.
    expect((await keyAction("create", "owner2", { name: "mine" })).statusCode).toBe(200);
  });

  it("lists and revokes only your own keys", async () => {
    const key = await newKey("owner1");
    const id = hashApiKey(key);

    expect((await keyAction("list", "owner2")).body.keys).toEqual([]);
    expect((await keyAction("revoke", "owner2", { id })).statusCode).toBe(404);
    expect((await rpc(key, { jsonrpc: "2.0", id: 1, method: "ping" })).statusCode).toBe(200);

    expect((await keyAction("revoke", "owner1", { id })).statusCode).toBe(200);
    expect((await rpc(key, { jsonrpc: "2.0", id: 1, method: "ping" })).statusCode).toBe(401);
  });

  it("refuses a suspended account and a signed-out request", async () => {
    db.table("users").owner1.suspended = true;
    expect((await keyAction("create", "owner1", { name: "x" })).statusCode).toBe(403);
    expect((await keyAction("list", "")).statusCode).toBe(401);
  });
});

describe("MCP endpoint", () => {
  it("refuses requests without a working key", async () => {
    const missing = await rpc(null, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(missing.statusCode).toBe(401);
    expect(missing.headers["WWW-Authenticate"]).toContain("Bearer");

    const unknown = await rpc(`askio_${"a".repeat(32)}`, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(unknown.statusCode).toBe(401);
    // A Firebase ID token or other bearer value is not an API key.
    expect((await rpc("eyJhbGciOi.some.jwt", { jsonrpc: "2.0", id: 1, method: "ping" })).statusCode).toBe(401);
  });

  it("only answers POST", async () => {
    const res = await rpc(await newKey("owner1"), undefined, "GET");
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("POST");
  });

  it("speaks the protocol: initialize, notifications, tools/list, unknown methods", async () => {
    const key = await newKey("owner1");

    const init = await rpc(key, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } });
    expect(init.body.result.protocolVersion).toBe("2025-03-26");
    expect(init.body.result.capabilities).toEqual({ tools: {} });
    expect(init.body.result.serverInfo.name).toBe("askio");

    const newer = await rpc(key, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2099-01-01" } });
    expect(newer.body.result.protocolVersion).toBe("2025-06-18");

    const note = await rpc(key, { jsonrpc: "2.0", method: "notifications/initialized" });
    expect(note.statusCode).toBe(202);
    expect(note.body).toBeUndefined();

    const list = await rpc(key, { jsonrpc: "2.0", id: 2, method: "tools/list" });
    const names = list.body.result.tools.map((tool: { name: string }) => tool.name);
    expect(names).toContain("create_chatbot");
    expect(names).toContain("add_faqs");
    for (const tool of list.body.result.tools) {
      expect(tool.inputSchema.type).toBe("object");
      expect(tool).not.toHaveProperty("run");
    }

    expect((await rpc(key, { jsonrpc: "2.0", id: 3, method: "resources/list" })).body.error.code).toBe(-32601);
    expect((await rpc(key, { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "drop_everything" } })).body.error.code).toBe(-32602);
    expect((await rpc(key, { id: 5, method: "ping" })).body.error.code).toBe(-32600);
    expect((await rpc(key, "not json")).statusCode).toBe(400);
  });

  it("answers a batch, leaving notifications out", async () => {
    const key = await newKey("owner1");
    const res = await rpc(key, [
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", id: 7, method: "ping" },
    ]);
    expect(res.body).toEqual([{ jsonrpc: "2.0", id: 7, result: {} }]);
  });

  it("slows a key that calls too fast", async () => {
    const key = await newKey("owner1");
    db.state.rateAllow = false;
    const result = await call(key, "list_chatbots");
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/too many/i);
  });
});

describe("MCP tools", () => {
  it("creates a chatbot for the key's owner, cleaned like the dashboard does", async () => {
    const key = await newKey("owner1");
    const created = await call(key, "create_chatbot", {
      name: "Shop bot",
      title: "Ask us",
      primaryColor: "url(https://evil.example/x)",
      user_id: "owner2",
      faqs: [{ question: " Where are you? ", answer: "Amsterdam." }],
    });

    expect(created.isError).toBe(false);
    const stored = db.table("chatbot_configs")[created.data.id];
    expect(stored.user_id).toBe("owner1");
    expect(stored.primaryColor).toBe("#4F46E5");
    expect(stored.faqData).toEqual([{ question: "Where are you?", answer: "Amsterdam." }]);
    expect(created.data.installCode).toContain(`data-chatbot="${created.data.id}"`);

    const list = await call(key, "list_chatbots");
    expect(list.data.chatbots).toEqual([expect.objectContaining({ id: created.data.id, name: "Shop bot", faqCount: 1 })]);
  });

  it("keeps one account out of another's chatbots", async () => {
    const mine = await newKey("owner1");
    const theirs = await newKey("owner2");
    const { data } = await call(mine, "create_chatbot", { name: "Mine", title: "Hi" });

    expect((await call(theirs, "list_chatbots")).data.chatbots).toEqual([]);
    for (const tool of ["get_chatbot", "get_install_code"]) {
      expect((await call(theirs, tool, { chatbotId: data.id })).isError).toBe(true);
    }
    const hijack = await call(theirs, "update_chatbot", { chatbotId: data.id, title: "Hacked" });
    expect(hijack.isError).toBe(true);
    const add = await call(theirs, "add_faqs", { chatbotId: data.id, faqs: [{ question: "q", answer: "a" }] });
    expect(add.isError).toBe(true);
    expect(db.table("chatbot_configs")[data.id]).toMatchObject({ title: "Hi", faqData: [] });
  });

  it("changes only the settings passed to update_chatbot", async () => {
    const key = await newKey("owner1");
    const { data } = await call(key, "create_chatbot", {
      name: "Bot",
      title: "Hi",
      language: "nl",
      faqs: [{ question: "q", answer: "a" }],
    });

    const updated = await call(key, "update_chatbot", { chatbotId: data.id, title: "Hallo", position: "top-left" });
    expect(updated.isError).toBe(false);
    expect(db.table("chatbot_configs")[data.id]).toMatchObject({
      name: "Bot",
      title: "Hallo",
      language: "nl",
      position: "top-left",
      faqData: [{ question: "q", answer: "a" }],
    });
    expect((await call(key, "update_chatbot", { chatbotId: data.id })).isError).toBe(true);
  });

  it("adds to the FAQs, replaces them, and refuses bad ones", async () => {
    const key = await newKey("owner1");
    const { data } = await call(key, "create_chatbot", { name: "Bot", title: "Hi", faqs: [{ question: "one", answer: "1" }] });
    const id = data.id;

    const added = await call(key, "add_faqs", { chatbotId: id, faqs: [{ question: "two", answer: "2" }] });
    expect(added.data.faqs.map((faq: { question: string }) => faq.question)).toEqual(["one", "two"]);

    // An FAQ without an answer is refused, not dropped without a word.
    const bad = await call(key, "add_faqs", { chatbotId: id, faqs: [{ question: "three" }] });
    expect(bad.isError).toBe(true);
    const full = await call(key, "add_faqs", {
      chatbotId: id,
      faqs: Array.from({ length: 199 }, (_, i) => ({ question: `q${i}`, answer: "a" })),
    });
    expect(full.isError).toBe(true);
    expect((db.table("chatbot_configs")[id].faqData as unknown[]).length).toBe(2);

    const replaced = await call(key, "replace_faqs", { chatbotId: id, faqs: [{ question: "only", answer: "this" }] });
    expect(replaced.data.faqs).toEqual([{ question: "only", answer: "this" }]);
  });

  it("holds to the plan and to suspension", async () => {
    const free = await newKey("owner2");
    const ai = await call(free, "create_chatbot", { name: "Bot", title: "Hi", aiEnabled: true });
    expect(ai.isError).toBe(true);
    expect(ai.text).toMatch(/Pro/);
    expect(db.table("chatbot_configs")).toEqual({});

    const { data } = await call(free, "create_chatbot", { name: "Bot", title: "Hi", saveConversations: true });
    // Conversation history is a paid feature; it stays off on the free plan.
    expect(db.table("chatbot_configs")[data.id].saveConversations).toBe(false);

    db.table("users").owner2.suspended = true;
    const blocked = await call(free, "update_chatbot", { chatbotId: data.id, title: "New" });
    expect(blocked.isError).toBe(true);
    expect(blocked.text).toMatch(/suspended/);
    // Reading still works, as it does in the dashboard.
    expect((await call(free, "get_chatbot", { chatbotId: data.id })).isError).toBe(false);
  });

  it("drafts FAQs from a website without saving them", async () => {
    const key = await newKey("owner1");
    const { data } = await call(key, "create_chatbot", { name: "Bot", title: "Hi", aiEnabled: true, aiTone: "Friendly" });

    const drafts = await call(key, "generate_faqs_from_website", { chatbotId: data.id, url: "example.com" });
    expect(drafts.data).toEqual({ saved: false, faqs: [{ question: "Do you ship abroad?", answer: "Yes." }] });
    expect(db.state.scans).toEqual([["https://example.com/", false, "Friendly"]]);
    expect(db.table("chatbot_configs")[data.id].faqData).toEqual([]);

    const { data: plain } = await call(key, "create_chatbot", { name: "No AI", title: "Hi" });
    expect((await call(key, "generate_faqs_from_website", { chatbotId: plain.id, url: "example.com" })).isError).toBe(true);
  });

  it("lists only the owner's unanswered questions", async () => {
    const key = await newKey("owner1");
    Object.assign(db.table("unanswered_queries"), {
      a: { ownerId: "owner1", chatbotId: "bot1", query: "Do you deliver on Sunday?" },
      b: { ownerId: "owner1", chatbotId: "bot2", query: "Gift cards?", resolved: true },
      c: { ownerId: "owner2", chatbotId: "bot9", query: "Someone else's" },
    });

    const all = await call(key, "list_unanswered_questions");
    expect(all.data.questions.map((q: { question: string }) => q.question)).toEqual(["Do you deliver on Sunday?", "Gift cards?"]);

    const one = await call(key, "list_unanswered_questions", { chatbotId: "bot2" });
    expect(one.data.questions).toEqual([{ question: "Gift cards?", chatbotId: "bot2", askedAt: null, resolved: true }]);
  });

  it("keeps its own faults out of the answer", async () => {
    const key = await newKey("owner1");
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const original = db.adminDb.collection;
    db.adminDb.collection = ((name: string) => {
      if (name === "chatbot_configs") throw new Error("firestore exploded at 10.0.0.5");
      return original(name);
    }) as typeof original;
    try {
      const result = await call(key, "list_chatbots");
      expect(result.isError).toBe(true);
      expect(result.text).not.toContain("10.0.0.5");
    } finally {
      db.adminDb.collection = original;
      spy.mockRestore();
    }
  });
});
