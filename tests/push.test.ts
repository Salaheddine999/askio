import { beforeEach, describe, expect, it, vi } from "vitest";

// Push notifications with Firestore and Firebase Cloud Messaging stubbed.
// Shaped like real FCM registration tokens.
const PHONE = "phoneAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const LAPTOP = "laptopBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

const fake = vi.hoisted(() => ({
  users: {} as Record<string, Record<string, unknown>>,
  sent: [] as { tokens: string[]; webpush: { notification: { title: string; body: string }; fcmOptions: { link: string } } }[],
  failures: {} as Record<string, string>,
  removed: [] as string[],
}));

vi.mock("firebase-admin/app", () => ({ getApps: () => [{}] }));
vi.mock("firebase-admin/messaging", () => ({
  getMessaging: () => ({
    sendEachForMulticast: async (message: (typeof fake.sent)[number]) => {
      fake.sent.push(message);
      const responses = message.tokens.map((t) =>
        fake.failures[t] ? { success: false, error: { code: fake.failures[t] } } : { success: true }
      );
      return { responses, successCount: responses.filter((r) => r.success).length };
    },
  }),
}));
vi.mock("firebase-admin/firestore", () => ({ FieldValue: { arrayRemove: (...items: string[]) => ({ _remove: items }) } }));
vi.mock("../api/_lib/firebaseAdmin.js", () => ({
  adminDb: {
    collection: () => ({
      doc: (id: string) => ({
        get: async () => ({ data: () => fake.users[id] }),
        update: async (data: { pushTokens: { _remove: string[] } }) => void fake.removed.push(...data.pushTokens._remove),
      }),
    }),
  },
}));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: () => undefined }));

const { pushLiveChatRequest, sendPush } = await import("../api/_lib/push.js");
const chatbot = { user_id: "owner1", title: "Shop bot" };

beforeEach(() => {
  fake.users = { owner1: { pushTokens: [PHONE, LAPTOP], language: "en" } };
  fake.sent = [];
  fake.failures = {};
  fake.removed = [];
});

describe("push notifications", () => {
  it("ring every device with what the visitor wrote and a link to the chat", async () => {
    expect(await pushLiveChatRequest({ chatbot, conversationId: "bot1_s1", preview: "Do you ship to Belgium?" })).toBe(2);
    const [message] = fake.sent;
    expect(message.tokens).toEqual([PHONE, LAPTOP]);
    expect(message.webpush.notification).toMatchObject({ title: "A visitor wants to talk to you", body: "Shop bot: Do you ship to Belgium?" });
    expect(message.webpush.fcmOptions.link).toBe("https://www.getaskio.xyz/conversations?open=bot1_s1");
  });

  it("use the owner's language", async () => {
    fake.users.owner1.language = "fr";
    await pushLiveChatRequest({ chatbot, conversationId: "bot1_s1" });
    expect(fake.sent[0].webpush.notification.title).toBe("Un visiteur souhaite vous parler");
    expect(fake.sent[0].webpush.notification.body).toBe("Quelqu'un sur Shop bot attend. Touchez pour répondre.");
  });

  it("forget devices that will never receive them again", async () => {
    fake.failures = { [LAPTOP]: "messaging/registration-token-not-registered" };
    expect(await sendPush("owner1", { title: "t", body: "b", path: "/", tag: "x" })).toBe(1);
    expect(fake.removed).toEqual([LAPTOP]);
  });

  it("do nothing for an owner without devices", async () => {
    fake.users.owner1.pushTokens = [];
    expect(await sendPush("owner1", { title: "t", body: "b", path: "/", tag: "x" })).toBe(0);
    expect(fake.sent).toHaveLength(0);
  });
});
