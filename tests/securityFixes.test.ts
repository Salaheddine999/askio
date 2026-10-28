import dns from "node:dns/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The fixes from the security audit (run-1): ordered rate limits, visitor
// keys, the pinned website fetch, signed checkout uids, webhook binding,
// the Shopify install and billing id checks. Firestore is an in-memory map.
const db = vi.hoisted(() => ({ docs: new Map<string, Record<string, unknown>>(), uid: "owner1" }));

vi.mock("../api/_lib/firebaseAdmin.js", () => {
  const ref = (path: string) => ({
    path,
    get: async () => ({ exists: db.docs.has(path), id: path.split("/").pop(), data: () => db.docs.get(path) }),
    set: async (value: Record<string, unknown>) => void db.docs.set(path, { ...(db.docs.get(path) || {}), ...value }),
    delete: async () => void db.docs.delete(path),
  });
  const adminDb = {
    collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`) }),
    runTransaction: async (fn: (t: unknown) => unknown) =>
      fn({
        get: (r: ReturnType<typeof ref>) => r.get(),
        set: (r: ReturnType<typeof ref>, value: Record<string, unknown>) => r.set(value),
      }),
  };
  return { adminDb, adminAuth: {} };
});
vi.mock("../api/_lib/auth.js", () => ({ requireUser: async () => ({ uid: db.uid, email: "owner@example.com" }) }));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: () => undefined, withMonitoring: (_r: string, h: unknown) => h }));

process.env.LEMONSQUEEZY_WEBHOOK_SECRET = "test-lemon-secret";
process.env.LEMONSQUEEZY_API_KEY = "test-lemon-key";
process.env.SHOPIFY_API_KEY = "test-shopify-key";

const { takeRateLimits, visitorKey } = await import("../api/_lib/rateLimit.js");
const { safeFetch } = await import("../api/_lib/safeFetch.js");
const { buildCheckoutUrl, isSignedCheckoutUid, lemonId, ownedSubscription } = await import("../api/_lib/lemonsqueezy.js");
const { shouldApplyEvent } = await import("../api/webhooks/lemonsqueezy.js");
const { signState, readState, isSignedByShopify, connectShopifyInstall } = await import("../api/_lib/shopify/install.js");
const crypto = await import("node:crypto");

const fakeRes = () => {
  const r = { statusCode: 0, body: undefined as unknown, setHeader: () => undefined, status: (c: number) => ((r.statusCode = c), r), json: (b: unknown) => ((r.body = b), r) };
  return r;
};
const realFetch = globalThis.fetch;

beforeEach(() => {
  db.docs.clear();
  db.uid = "owner1";
});
afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("rate limits", () => {
  it("a visitor over their own limit doesn't use up the chatbot's shared window", async () => {
    for (let i = 0; i < 10; i++) await takeRateLimits([["v_a", 2], ["c_bot", 5]]);
    // Visitor a got 2; the chatbot still has 3 left for everyone else.
    expect(await takeRateLimits([["v_b", 2], ["c_bot", 5]])).toBe(true);
    const chatbotCount = [...db.docs].find(([k]) => k.startsWith("ai_rate_limits/c_bot_"))?.[1].count;
    expect(chatbotCount).toBe(3);
  });

  it("keys visitors by the address Vercel saw, and IPv6 per /64", () => {
    const req = (headers: Record<string, string>) => ({ headers, socket: {} });
    expect(visitorKey(req({ "x-vercel-forwarded-for": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe(
      visitorKey(req({ "x-real-ip": "1.2.3.4" }))
    );
    expect(visitorKey(req({ "x-real-ip": "2001:db8:1:2:aaaa::1" }))).toBe(visitorKey(req({ "x-real-ip": "2001:db8:1:2:bbbb:cccc:dddd:eeee" })));
    expect(visitorKey(req({ "x-real-ip": "2001:db8:1:2::1" }))).not.toBe(visitorKey(req({ "x-real-ip": "2001:db8:1:3::1" })));
  });
});

describe("safeFetch", () => {
  it("connects only to the address it checked, so DNS rebinding is refused", async () => {
    let calls = 0;
    vi.spyOn(dns, "lookup").mockImplementation((async () => {
      calls++;
      // The first answer passes the check; the next one points inside.
      return [{ address: calls === 1 ? "93.184.216.34" : "127.0.0.1", family: 4 }];
    }) as unknown as typeof dns.lookup);
    await expect(safeFetch("http://rebind.example/")).rejects.toThrow(/public website/);
    expect(calls).toBe(2);
  });
});

describe("Lemon Squeezy checkout and webhook", () => {
  it("signs the checkout uid, and a changed uid fails the check", () => {
    const url = new URL(buildCheckoutUrl({ checkoutUrl: "https://store.example/checkout/1", uid: "owner1" }));
    const sig = url.searchParams.get("checkout[custom][uid_sig]");
    expect(isSignedCheckoutUid("owner1", sig)).toBe(true);
    expect(isSignedCheckoutUid("victim", sig)).toBe(false);
    expect(isSignedCheckoutUid("owner1", undefined)).toBe(false);
  });

  it("a different subscription can't take over an account that's still billed, unless the uid was signed", () => {
    const stored = { lemonSqueezySubscriptionId: "111", subscriptionStatus: "active" };
    expect(shouldApplyEvent(stored, { subscriptionId: "222", signed: false })).toBe(false);
    expect(shouldApplyEvent(stored, { subscriptionId: "222", signed: true })).toBe(true);
    expect(shouldApplyEvent({}, { subscriptionId: "222", signed: false })).toBe(true);
    expect(shouldApplyEvent({ ...stored, subscriptionStatus: "expired" }, { subscriptionId: "222", signed: false })).toBe(true);
  });

  it("ignores an event older than the last one applied", () => {
    const stored = { lemonSqueezySubscriptionId: "111", lemonSqueezyUpdatedAt: "2026-10-02T00:00:00Z" };
    expect(shouldApplyEvent(stored, { subscriptionId: "111", updatedAt: "2026-10-01T00:00:00Z", signed: false })).toBe(false);
    expect(shouldApplyEvent(stored, { subscriptionId: "111", updatedAt: "2026-10-03T00:00:00Z", signed: false })).toBe(true);
  });
});

describe("billing ids", () => {
  it("only numeric ids reach a Lemon Squeezy path", () => {
    expect(lemonId("123")).toBe("123");
    expect(lemonId("../customers/5")).toBeNull();
    expect(lemonId(undefined)).toBeNull();
  });

  it("uses a subscription only when it belongs to the account's own customer", async () => {
    const urls: string[] = [];
    globalThis.fetch = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ data: { id: "999", attributes: { customer_id: 77 } } }), { status: 200 });
    }) as typeof fetch;
    expect(await ownedSubscription({ lemonSqueezySubscriptionId: "999", lemonSqueezyCustomerId: "77" })).toMatchObject({ id: "999" });
    expect(await ownedSubscription({ lemonSqueezySubscriptionId: "999", lemonSqueezyCustomerId: "5" })).toBeNull();
    expect(await ownedSubscription({ lemonSqueezySubscriptionId: "../webhooks/1" })).toBeNull();
    expect(urls.every((u) => u === "https://api.lemonsqueezy.com/v1/subscriptions/999")).toBe(true);
  });
});

describe("hardening", () => {
  it("errors without a status keep their text out of the response", async () => {
    const { sendError } = await import("../api/_lib/response.js");
    const unexpected = fakeRes();
    sendError(unexpected, new Error("Firebase Admin environment variables are missing."));
    expect(unexpected.statusCode).toBe(500);
    expect(unexpected.body).toEqual({ error: "Something went wrong. Please try again." });
    const meant = fakeRes();
    sendError(meant, Object.assign(new Error("Chatbot not found."), { statusCode: 404 }));
    expect(meant.body).toEqual({ error: "Chatbot not found." });
  });

  it("unsubscribe links: new and already-sent ones work, malformed ones are refused without crashing", async () => {
    process.env.EMAIL_SIGNING_SECRET = "test-signing-secret";
    const { unsubscribeSignature, verifyUnsubscribe } = await import("../api/_lib/email/alerts.js");
    expect(verifyUnsubscribe("owner1", "leads", unsubscribeSignature("owner1", "leads"))).toBe(true);
    const old = crypto.createHmac("sha256", "test-signing-secret").update("owner1:leads").digest("base64url").slice(0, 32);
    expect(verifyUnsubscribe("owner1", "leads", old)).toBe(true);
    expect(verifyUnsubscribe("owner2", "leads", old)).toBe(false);
    expect(verifyUnsubscribe("owner1", "leads", "é".repeat(32))).toBe(false);
  });

  it("chatbot colours are a hex value or the editor's gradient, nothing that loads from elsewhere", async () => {
    const { normalizeColor } = await import("../api/chatbots/save.js");
    expect(normalizeColor("#4F46E5", "x")).toBe("#4F46E5");
    expect(normalizeColor("linear-gradient(145deg, #4F46E5, #22d3ee)", "x")).toBe("linear-gradient(145deg, #4F46E5, #22d3ee)");
    expect(normalizeColor("url(https://tracker.example/p.png)", "x")).toBe("x");
  });

  it("monthly AI replies are reserved up to the limit and can be given back", async () => {
    const { reserveAiReply, releaseAiReply } = await import("../api/_lib/aiUsage.js");
    expect(await reserveAiReply("owner1", 2)).toBe(true);
    expect(await reserveAiReply("owner1", 2)).toBe(true);
    expect(await reserveAiReply("owner1", 2)).toBe(false);
    const [, usage] = [...db.docs].find(([k]) => k.startsWith("ai_usage/owner1_"))!;
    expect(usage.replies).toBe(2);
    await expect(releaseAiReply("owner1")).resolves.toBeUndefined();
  });

  it("the cron runs only on GET with the exact secret", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    const { default: cron } = await import("../api/cron/cleanup-rate-limits.js");
    const post = fakeRes();
    await cron({ method: "POST", headers: { authorization: "Bearer test-cron-secret" } }, post);
    expect(post.statusCode).toBe(405);
    const wrong = fakeRes();
    await cron({ method: "GET", headers: { authorization: "Bearer test-cron-secretX" } }, wrong);
    expect(wrong.statusCode).toBe(401);
  });
});

describe("Shopify install", () => {
  const secret = "test-shopify-secret";

  it("accepts only our own, unexpired state", () => {
    const state = signState({ uid: "owner1", chatbotId: "bot1", chatbotTitle: "Shop bot" }, secret);
    expect(readState(state, secret)).toMatchObject({ uid: "owner1", chatbotId: "bot1" });
    const [body, sig] = state.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), uid: "attacker" })).toString("base64url");
    expect(readState(`${forged}.${sig}`, secret)).toBeNull();
    expect(readState(state, secret, Date.now() + 11 * 60_000)).toBeNull();
    expect(readState("e30", secret)).toBeNull();
  });

  it("checks Shopify's HMAC over the query", () => {
    const query = { shop: "demo.myshopify.com", code: "abc", state: "s", timestamp: "1" };
    const hmac = crypto.createHmac("sha256", secret).update("code=abc&shop=demo.myshopify.com&state=s&timestamp=1").digest("hex");
    expect(isSignedByShopify({ ...query, hmac }, secret)).toBe(true);
    expect(isSignedByShopify({ ...query, shop: "evil.myshopify.com", hmac }, secret)).toBe(false);
  });

  it("only the owner who started an install can finish it", async () => {
    db.docs.set("ops/shopify_pending_abcdefghijklmnop", {
      uid: "attacker",
      chatbotId: "attackerBot",
      shop: "victim.myshopify.com",
      accessToken: "t",
      expiresAt: { toMillis: () => Date.now() + 60_000 },
    });
    let shopifyCalls = 0;
    globalThis.fetch = (async () => {
      shopifyCalls++;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    db.uid = "merchant";
    const res = fakeRes();
    await connectShopifyInstall({ method: "POST", headers: {}, body: { pending: "abcdefghijklmnop" } }, res);
    expect(res.statusCode).toBe(403);
    expect(shopifyCalls).toBe(0);
  });
});
