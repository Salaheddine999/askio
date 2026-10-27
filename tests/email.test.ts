import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Email alerts with Firestore, the rate limiter and Resend stubbed.
const fake = vi.hoisted(() => ({
  users: {} as Record<string, Record<string, unknown>>,
  conversations: {} as Record<string, Record<string, unknown>>,
  allowed: true,
  sent: [] as { url: string; body: Record<string, unknown>; auth: string }[],
}));

vi.mock("../api/_lib/firebaseAdmin.js", () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          const data = name === "users" ? fake.users[id] : fake.conversations[id];
          return { exists: Boolean(data), data: () => data };
        },
        set: async (data: { emailAlerts?: Record<string, boolean> }) => {
          fake.users[id] = { ...fake.users[id], emailAlerts: { ...(fake.users[id]?.emailAlerts as object), ...data.emailAlerts } };
        },
      }),
    }),
  },
  adminAuth: {},
}));
vi.mock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => fake.allowed }));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: () => undefined }));

const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: string, init: RequestInit) => {
  fake.sent.push({
    url,
    body: JSON.parse(String(init.body)),
    auth: String((init.headers as Record<string, string>).Authorization),
  });
  return new Response(JSON.stringify({ id: "email_1" }), { status: 200 });
}) as typeof fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});

process.env.RESEND_API_KEY = "re_test_key";
process.env.EMAIL_FROM = "Askio <notifications@getaskio.xyz>";
process.env.CRON_SECRET = "signing-secret";

const { sendLeadAlert, sendMissedChatAlert, unsubscribeUrl, verifyUnsubscribe, emailUnsubscribe } = await import("../api/_lib/email/alerts.js");

const chatbot = { user_id: "owner1", title: "Shop bot" };

beforeEach(() => {
  fake.users = { owner1: { email: "owner@example.com", language: "en" } };
  fake.conversations = {
    bot1_session12345: { messages: [{ role: "visitor", text: "Do you ship to Belgium?", at: 1 }, { role: "bot", text: "I don't know.", at: 2 }] },
  };
  fake.allowed = true;
  fake.sent = [];
  process.env.RESEND_API_KEY = "re_test_key";
});

describe("lead alert emails", () => {
  it("sends the owner the lead, what they asked and a one-click unsubscribe", async () => {
    expect(await sendLeadAlert({ chatbotId: "bot1", chatbot, email: "sara@example.com", sessionId: "session12345" })).toBe(true);
    expect(fake.sent).toHaveLength(1);
    const { url, body, auth } = fake.sent[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(auth).toBe("Bearer re_test_key");
    expect(body).toMatchObject({
      from: "Askio <notifications@getaskio.xyz>",
      to: ["owner@example.com"],
      subject: "New lead from Shop bot: sara@example.com",
    });
    expect(body.html).toContain("Do you ship to Belgium?");
    expect((body.headers as Record<string, string>)["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect((body.headers as Record<string, string>)["List-Unsubscribe"]).toContain("/api/account/email-unsubscribe?u=owner1&t=leads&s=");
  });

  it("uses the owner's language", async () => {
    fake.users.owner1.language = "fr";
    await sendLeadAlert({ chatbotId: "bot1", chatbot, email: "sara@example.com" });
    expect(fake.sent[0].body.subject).toBe("Nouveau lead via Shop bot : sara@example.com");
  });

  it("escapes what visitors typed", async () => {
    fake.conversations.bot1_session12345.messages = [{ role: "visitor", text: '<img src=x onerror="alert(1)">', at: 1 }];
    await sendLeadAlert({ chatbotId: "bot1", chatbot, email: "a@b.co", sessionId: "session12345" });
    expect(fake.sent[0].body.html).not.toContain("<img");
    expect(fake.sent[0].body.html).toContain("&lt;img");
  });

  it("sends nothing when the owner turned it off, is over the daily cap, or email isn't set up", async () => {
    fake.users.owner1.emailAlerts = { leads: false };
    await sendLeadAlert({ chatbotId: "bot1", chatbot, email: "a@b.co" });
    fake.users.owner1.emailAlerts = {};
    fake.allowed = false;
    await sendLeadAlert({ chatbotId: "bot1", chatbot, email: "a@b.co" });
    fake.allowed = true;
    delete process.env.RESEND_API_KEY;
    await sendLeadAlert({ chatbotId: "bot1", chatbot, email: "a@b.co" });
    expect(fake.sent).toHaveLength(0);
  });
});

describe("missed live chat emails", () => {
  it("links straight to the conversation", async () => {
    await sendMissedChatAlert({ chatbotId: "bot1", chatbot, sessionId: "session12345" });
    expect(fake.sent[0].body.subject).toBe("You missed a live chat on Shop bot");
    expect(fake.sent[0].body.html).toContain("/conversations?open=bot1_session12345");
  });
});

describe("unsubscribe links", () => {
  const params = (url: string) => Object.fromEntries(new URL(url).searchParams);

  it("only accept the signature made for that account and alert", () => {
    const { u, t, s } = params(unsubscribeUrl("owner1", "leads"));
    expect(verifyUnsubscribe(u, t, s)).toBe(true);
    expect(verifyUnsubscribe("stranger", t, s)).toBe(false);
    expect(verifyUnsubscribe(u, "missedChats", s)).toBe(false);
    expect(verifyUnsubscribe(u, t, "x".repeat(32))).toBe(false);
  });

  it("turn the alert off and show a page", async () => {
    const res = {
      statusCode: 0,
      body: "",
      headers: {} as Record<string, string>,
      setHeader(k: string, v: string) {
        res.headers[k] = v;
      },
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      send(body: string) {
        res.body = body;
        return res;
      },
      json(body: unknown) {
        res.body = JSON.stringify(body);
        return res;
      },
    };
    await emailUnsubscribe({ method: "GET", query: params(unsubscribeUrl("owner1", "leads")) }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("You&#39;re unsubscribed");
    expect(fake.users.owner1.emailAlerts).toEqual({ leads: false });

    await emailUnsubscribe({ method: "GET", query: { u: "owner1", t: "leads", s: "forged" } }, res);
    expect(res.statusCode).toBe(400);
  });
});
