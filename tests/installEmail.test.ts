import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// "Email these instructions to my developer", with auth, Firestore, rate
// limits and Resend stubbed.
const fake = vi.hoisted(() => ({
  user: {} as Record<string, unknown>,
  owner: "owner1",
  allowed: true,
  sent: [] as Record<string, unknown>[],
}));

vi.mock("../api/_lib/auth.js", () => ({ requireUser: async () => ({ uid: "owner1", email: "owner@shop.example" }) }));
vi.mock("../api/_lib/plan.js", () => ({
  getOwnedChatbot: async (uid: string) => {
    if (uid !== fake.owner) throw Object.assign(new Error("You do not have access to this chatbot."), { statusCode: 403 });
    return { chatbotData: { title: "Shop bot" } };
  },
}));
vi.mock("../api/_lib/firebaseAdmin.js", () => ({
  adminDb: { collection: () => ({ doc: () => ({ get: async () => ({ data: () => fake.user }) }) }) },
  adminAuth: {},
}));
vi.mock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => fake.allowed }));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: () => undefined }));

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

const { default: sendInstallEmail } = await import("../api/_lib/account/installEmail.js");

const res = () => {
  const r = { statusCode: 0, body: undefined as unknown, setHeader: () => undefined, status: (c: number) => ((r.statusCode = c), r), json: (b: unknown) => ((r.body = b), r) };
  return r;
};
const ask = (body: Record<string, unknown>) => ({ method: "POST", headers: {}, body });

beforeEach(() => {
  fake.user = { email: "owner@shop.example", name: "Sara", language: "en" };
  fake.owner = "owner1";
  fake.allowed = true;
  fake.sent = [];
});

describe("POST /api/account/install-email", () => {
  it("sends the one-line code and steps, with replies going to the owner", async () => {
    const r = res();
    await sendInstallEmail(ask({ chatbotId: "bot1", email: " Dev@Agency.example " }), r);
    expect(r.statusCode).toBe(200);
    expect(fake.sent).toHaveLength(1);
    const email = fake.sent[0] as { to: string[]; reply_to: string; subject: string; text: string };
    expect(email.to).toEqual(["dev@agency.example"]);
    expect(email.reply_to).toBe("owner@shop.example");
    expect(email.subject).toBe("Please add the Askio chat to our website");
    expect(email.text).toContain('<script src="https://www.getaskio.xyz/chatbot-embed.js" data-chatbot="bot1" async></script>');
    expect(email.text).toContain("owner@shop.example uses Askio");
  });

  it("carries no text the owner typed, and replies go to the signed-in account", async () => {
    fake.user = { email: "attacker@evil.example", name: "Billing Dept: pay at evil.example", language: "en" };
    const r = res();
    await sendInstallEmail(ask({ chatbotId: "bot1", email: "victim@example.com" }), r);
    const email = fake.sent[0] as { reply_to: string; subject: string; text: string; html: string };
    expect(email.reply_to).toBe("owner@shop.example");
    for (const part of [email.subject, email.text, email.html]) {
      expect(part).not.toContain("evil.example");
      expect(part).not.toContain("Shop bot");
    }
  });

  it("refuses a bad address, someone else's chatbot, or a suspended account", async () => {
    const bad = res();
    await sendInstallEmail(ask({ chatbotId: "bot1", email: "not an email" }), bad);
    expect(bad.statusCode).toBe(400);

    fake.owner = "someone-else";
    const other = res();
    await sendInstallEmail(ask({ chatbotId: "bot1", email: "dev@agency.example" }), other);
    expect(other.statusCode).toBe(403);

    fake.owner = "owner1";
    fake.user = { ...fake.user, suspended: true };
    const suspended = res();
    await sendInstallEmail(ask({ chatbotId: "bot1", email: "dev@agency.example" }), suspended);
    expect(suspended.statusCode).toBe(403);
    expect(fake.sent).toHaveLength(0);
  });

  it("stops after a few a day", async () => {
    fake.allowed = false;
    const r = res();
    await sendInstallEmail(ask({ chatbotId: "bot1", email: "dev@agency.example" }), r);
    expect(r.statusCode).toBe(429);
    expect(fake.sent).toHaveLength(0);
  });
});
