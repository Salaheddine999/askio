import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// The AI failure alert, the "seen on a website" record and the setup
// reminder, with Firestore, rate limits and Resend stubbed.
const fake = vi.hoisted(() => {
  type Doc = Record<string, unknown>;
  const store: Record<string, Record<string, Doc>> = {};
  const isSpecial = (v: unknown) => v && typeof v === "object" && ("_inc" in (v as object) || "toMillis" in (v as object));
  const merge = (current: Doc, data: Doc): Doc => {
    const next: Doc = { ...current };
    for (const [key, value] of Object.entries(data)) {
      const v = value as { _inc?: number };
      if (v && typeof v === "object" && typeof v._inc === "number") next[key] = ((current[key] as number) || 0) + v._inc;
      else if (value && typeof value === "object" && !isSpecial(value) && !Array.isArray(value))
        next[key] = merge((current[key] as Doc) || {}, value as Doc);
      else next[key] = value;
    }
    return next;
  };
  const coll = (name: string) => (store[name] ||= {});
  const docRef = (name: string, id: string) => {
    const ref = {
      id,
      get: async () => ({ exists: Boolean(coll(name)[id]), data: () => coll(name)[id], ref }),
      set: async (data: Doc, opts?: { merge?: boolean }) => void (coll(name)[id] = opts?.merge ? merge(coll(name)[id] || {}, data) : merge({}, data)),
      update: async (data: Doc) => void (coll(name)[id] = merge(coll(name)[id] || {}, data)),
    };
    return ref;
  };
  type Filter = [string, string, { toMillis: () => number }];
  const queryOf = (name: string, filters: Filter[] = []) => ({
    where: (field: string, op: string, value: { toMillis: () => number }) => queryOf(name, [...filters, [field, op, value]]),
    limit: () => queryOf(name, filters),
    get: async () => ({
      docs: Object.entries(coll(name))
        .filter(([, d]) =>
          filters.every(([field, op, value]) => {
            const at = (d[field] as { toMillis?: () => number })?.toMillis?.();
            if (at === undefined) return false;
            return op === ">=" ? at >= value.toMillis() : op === "<=" ? at <= value.toMillis() : at < value.toMillis();
          })
        )
        .map(([id, d]) => ({ id, data: () => d, ref: docRef(name, id) })),
    }),
  });
  const adminDb = {
    collection: (name: string) => ({ doc: (id: string) => docRef(name, id), ...queryOf(name) }),
    runTransaction: async (fn: (t: unknown) => Promise<unknown>) =>
      fn({
        get: (ref: { get: () => Promise<unknown> }) => ref.get(),
        set: (ref: { set: (d: Doc, o?: object) => Promise<void> }, data: Doc, opts?: object) => void ref.set(data, opts),
        update: (ref: { update: (d: Doc) => Promise<void> }, data: Doc) => void ref.update(data),
      }),
  };
  return { store, adminDb, sent: [] as { to: string[]; subject: string; text: string }[] };
});

const at = (ms: number) => ({ toMillis: () => ms, toDate: () => new Date(ms) });
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => at(Date.now()), increment: (n: number) => ({ _inc: n }), arrayUnion: () => [] },
  Timestamp: { fromMillis: (ms: number) => at(ms), now: () => at(Date.now()) },
}));
vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: fake.adminDb, adminAuth: {} }));
vi.mock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => true, visitorKey: () => "visitor" }));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: () => undefined }));
vi.mock("../api/_lib/push.js", () => ({ pushLiveChatRequest: async () => 0 }));
vi.mock("../api/_lib/plan.js", () => ({ getUserAccessProfile: async () => ({ access: { plan: "pro", isSubscriptionActive: true } }) }));

const realFetch = globalThis.fetch;
globalThis.fetch = (async (_url: string, init: RequestInit) => {
  fake.sent.push(JSON.parse(String(init.body)));
  return new Response("{}", { status: 200 });
}) as typeof fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});
process.env.RESEND_API_KEY = "re_test_key";
process.env.EMAIL_FROM = "Askio <notifications@getaskio.xyz>";
process.env.CRON_SECRET = "signing-secret";

const { noteAiFailure, THRESHOLD } = await import("../api/_lib/aiHealth.js");
const { sendSetupReminders } = await import("../api/_lib/email/alerts.js");
const { default: recordVisitor } = await import("../api/_lib/widget/recordVisitor.js");

const DAY = 86_400_000;

beforeEach(() => {
  for (const key of Object.keys(fake.store)) delete fake.store[key];
  fake.sent.length = 0;
});

describe("AI failure alerts", () => {
  it("email the operator once failures pile up, then stay quiet", async () => {
    for (let i = 0; i < THRESHOLD - 1; i++) await noteAiFailure(429);
    expect(fake.sent).toHaveLength(0);

    await noteAiFailure(429);
    expect(fake.sent).toHaveLength(1);
    expect(fake.sent[0].to).toEqual(["support@getaskio.xyz"]);
    expect(fake.sent[0].subject).toContain(`${THRESHOLD} AI replies failed`);
    expect(fake.sent[0].text).toContain("out of quota");

    await noteAiFailure(0);
    expect(fake.sent).toHaveLength(1);
  });
});

describe("the widget loading on a website", () => {
  const seen = (page: unknown) => ({ method: "POST", headers: {}, body: { kind: "seen", chatbotId: "bot1", page } });
  const res = () => {
    const r = { statusCode: 0, setHeader: () => undefined, status: (c: number) => ((r.statusCode = c), r), json: () => r };
    return r;
  };

  it("marks the chatbot installed, with the site it's on", async () => {
    fake.store.chatbot_configs = { bot1: { user_id: "owner1", title: "Shop bot" } };
    const r = res();
    await recordVisitor(seen("https://shop.example/products/sofa?ref=x"), r);
    expect(r.statusCode).toBe(201);
    expect(fake.store.chatbot_configs.bot1).toMatchObject({ lastSeenHost: "shop.example" });
    expect(fake.store.chatbot_configs.bot1.installedAt).toBeTruthy();
  });

  it("ignores local test pages", async () => {
    fake.store.chatbot_configs = { bot1: { user_id: "owner1" } };
    const r = res();
    await recordVisitor(seen("http://localhost:5173/"), r);
    expect(r.statusCode).toBe(201);
    expect(fake.store.chatbot_configs.bot1.installedAt).toBeUndefined();
  });

  it("ignores Askio's own preview deployments", async () => {
    fake.store.chatbot_configs = { bot1: { user_id: "owner1" } };
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "askio-abc123-team.vercel.app";
    try {
      await recordVisitor(seen("https://askio-abc123-team.vercel.app/"), res());
      expect(fake.store.chatbot_configs.bot1.installedAt).toBeUndefined();
      await recordVisitor(seen("https://someshop.vercel.app/"), res());
      expect(fake.store.chatbot_configs.bot1.lastSeenHost).toBe("someshop.vercel.app");
    } finally {
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_URL;
    }
  });

  it("refuses a missing or odd page", async () => {
    fake.store.chatbot_configs = { bot1: { user_id: "owner1" } };
    const r = res();
    await recordVisitor(seen("javascript:alert(1)"), r);
    expect(r.statusCode).toBe(400);
    expect(fake.store.chatbot_configs.bot1.installedAt).toBeUndefined();
  });
});

describe("setup reminders", () => {
  beforeEach(() => {
    fake.store.users = { owner1: { email: "owner@example.com", language: "en" } };
  });

  it("email once about a day-old chatbot that isn't on a website", async () => {
    fake.store.chatbot_configs = { bot1: { user_id: "owner1", title: "Shop bot", createdAt: at(Date.now() - 2 * DAY) } };
    expect(await sendSetupReminders()).toBe(1);
    expect(fake.sent[0].subject).toBe("Shop bot isn't on your website yet");
    expect(fake.sent[0].text).toContain("/configure/bot1?tab=embed");
    expect(await sendSetupReminders()).toBe(0);
  });

  it("skip chatbots that are installed, too new, too old, or opted out", async () => {
    fake.store.chatbot_configs = {
      installed: { user_id: "owner1", createdAt: at(Date.now() - 2 * DAY), installedAt: at(Date.now()) },
      fresh: { user_id: "owner1", createdAt: at(Date.now() - DAY / 2) },
      old: { user_id: "owner1", createdAt: at(Date.now() - 10 * DAY) },
    };
    expect(await sendSetupReminders()).toBe(0);

    fake.store.users.owner1.emailAlerts = { setup: false };
    fake.store.chatbot_configs = { bot1: { user_id: "owner1", createdAt: at(Date.now() - 2 * DAY) } };
    expect(await sendSetupReminders()).toBe(0);
    expect(fake.store.chatbot_configs.bot1.setupReminderSentAt).toBeTruthy();
  });
});
