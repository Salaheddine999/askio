import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { arrayUnion, deleteDoc, doc, getDoc, getDocs, collection, increment, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// Runs firestore.rules in the Firestore emulator, which needs Java. Locally:
// `npm run test:rules`; on GitHub it runs on every push.
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "askio-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

const owner = () => env.authenticatedContext("owner1").firestore();
const stranger = () => env.authenticatedContext("stranger").firestore();
const admin = () => env.authenticatedContext("admin1", { admin: true }).firestore();
const visitor = () => env.unauthenticatedContext().firestore();

const profile = {
  email: "owner@example.com",
  plan: "pro",
  subscriptionStatus: "active",
  aiChatbotLimit: 10,
  isPro: true,
  aiReplyLimit: 1000,
};
const chatbot = { user_id: "owner1", name: "Shop bot", aiEnabled: false };
const record = { ownerId: "owner1", chatbotId: "bot1" };

// Seed data as the server would write it, past the rules.
async function seed(extra: { suspended?: boolean } = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/owner1"), { ...profile, ...(extra.suspended ? { suspended: true, suspendedReason: "Spam reports from visitors" } : {}) });
    await setDoc(doc(db, "chatbot_configs/bot1"), chatbot);
    for (const name of ["leads", "analytics_events", "unanswered_queries", "feedback", "conversations"]) {
      await setDoc(doc(db, `${name}/r1`), record);
    }
    await setDoc(doc(db, "conversations/bot1_livesession1"), { ...record, liveStatus: "waiting" });
    await setDoc(doc(db, "conversations/bot1_idlesession1"), { ...record, liveStatus: "idle" });
    await setDoc(doc(db, "presence/owner1"), { online: true, lastSeen: new Date() });
    await setDoc(doc(db, "ai_usage/owner1_2026-10"), { count: 3 });
    await setDoc(doc(db, "admin_log/e1"), { action: "suspend" });
    await setDoc(doc(db, "ai_rate_limits/w1"), { count: 1 });
  });
}

beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

describe("user profiles", () => {
  it("owners read their own profile; others can't, admins can", async () => {
    await assertSucceeds(getDoc(doc(owner(), "users/owner1")));
    await assertFails(getDoc(doc(stranger(), "users/owner1")));
    await assertFails(getDoc(doc(visitor(), "users/owner1")));
    await assertSucceeds(getDoc(doc(admin(), "users/owner1")));
  });

  it("owners can edit ordinary fields", async () => {
    await assertSucceeds(updateDoc(doc(owner(), "users/owner1"), { language: "fr" }));
  });

  it("older profiles missing billing fields can still save, but can't add them", async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/owner1"), { email: "owner@example.com", plan: "free" }));
    await assertSucceeds(updateDoc(doc(owner(), "users/owner1"), { pushTokens: ["device-token"] }));
    await assertFails(updateDoc(doc(owner(), "users/owner1"), { aiChatbotLimit: 999 }));
    await assertFails(updateDoc(doc(owner(), "users/owner1"), { isPro: true }));
  });

  it.each([
    ["plan", "business"],
    ["subscriptionStatus", "active_forever"],
    ["aiChatbotLimit", 999],
    ["isPro", false],
    ["aiReplyLimit", 1e9],
    ["suspended", true],
    ["suspendedReason", "made up"],
  ])("owners can't change %s", async (field, value) => {
    await assertFails(updateDoc(doc(owner(), "users/owner1"), { [field]: value }));
  });

  it("admins can't write profiles from the browser", async () => {
    await assertFails(updateDoc(doc(admin(), "users/owner1"), { suspended: true }));
  });

  // As sign-up writes it (src/components/Auth.tsx).
  const signUp = {
    email: "new@example.com",
    name: "",
    createdAt: new Date(),
    aiScansCount: 0,
    isPro: false,
    plan: "free",
    subscriptionStatus: "inactive",
    aiChatbotLimit: 0,
    language: "en",
  };
  const newUser = () => env.authenticatedContext("new", { email: "new@example.com" }).firestore();

  it("sign-up creates a free profile with the account's own email", async () => {
    await assertSucceeds(setDoc(doc(newUser(), "users/new"), signUp));
    await assertFails(setDoc(doc(newUser(), "users/new"), { ...signUp, email: "someone@else.com" }));
    await assertFails(setDoc(doc(stranger(), "users/someone-else"), { plan: "free" }));
  });

  it.each([
    ["plan", "enterprise"],
    ["plan", "pro"],
    ["subscriptionStatus", "active"],
    ["isPro", true],
    ["aiChatbotLimit", 10],
    ["aiReplyLimit", 1e9],
    ["suspended", false],
    ["lemonSqueezySubscriptionId", "999"],
    ["currentPeriodEnd", new Date(2099, 0, 1)],
  ])("a new profile can't start with %s = %s", async (field, value) => {
    await assertFails(setDoc(doc(newUser(), "users/new"), { ...signUp, [field]: value }));
  });

  it.each([
    ["lemonSqueezySubscriptionId", "999"],
    ["lemonSqueezyCustomerId", "5"],
    ["lemonSqueezyCustomerPortalUrl", "https://example.com"],
    ["currentPeriodEnd", new Date(2099, 0, 1)],
    ["email", "attacker@example.com"],
  ])("owners can't change the server-written %s", async (field, value) => {
    await assertFails(updateDoc(doc(owner(), "users/owner1"), { [field]: value }));
  });

  it("owners edit their name, alerts, language and devices", async () => {
    await assertSucceeds(updateDoc(doc(owner(), "users/owner1"), { name: "Sara" }));
    await assertSucceeds(updateDoc(doc(owner(), "users/owner1"), { "emailAlerts.leads": false }));
    await assertSucceeds(updateDoc(doc(owner(), "users/owner1"), { pushTokens: arrayUnion("device-token") }));
    await assertFails(updateDoc(doc(owner(), "users/owner1"), { name: "x".repeat(81) }));
  });

  it("nobody deletes a profile from the browser, so it can't be re-created with other fields", async () => {
    await assertFails(deleteDoc(doc(owner(), "users/owner1")));
  });
});

describe("chatbots", () => {
  it("anyone can read a chatbot (the widget loads it)", async () => {
    await assertSucceeds(getDoc(doc(visitor(), "chatbot_configs/bot1")));
  });

  it("only owners list their own chatbots, and admins list all", async () => {
    await assertFails(getDocs(collection(visitor(), "chatbot_configs")));
    await assertFails(getDocs(collection(stranger(), "chatbot_configs")));
    await assertSucceeds(getDocs(query(collection(owner(), "chatbot_configs"), where("user_id", "==", "owner1"))));
    await assertFails(getDocs(query(collection(stranger(), "chatbot_configs"), where("user_id", "==", "owner1"))));
    await assertSucceeds(getDocs(collection(admin(), "chatbot_configs")));
  });

  it("owners create chatbots for themselves, without AI turned on", async () => {
    await assertSucceeds(setDoc(doc(owner(), "chatbot_configs/bot2"), chatbot));
    await assertFails(setDoc(doc(owner(), "chatbot_configs/bot3"), { ...chatbot, aiEnabled: true }));
    await assertFails(setDoc(doc(owner(), "chatbot_configs/bot4"), { ...chatbot, user_id: "stranger" }));
    await assertFails(setDoc(doc(visitor(), "chatbot_configs/bot5"), chatbot));
  });

  it("only the owner edits or deletes, and can't switch on AI or take it over", async () => {
    await assertSucceeds(updateDoc(doc(owner(), "chatbot_configs/bot1"), { name: "Renamed" }));
    await assertFails(updateDoc(doc(owner(), "chatbot_configs/bot1"), { aiEnabled: true }));
    await assertFails(updateDoc(doc(owner(), "chatbot_configs/bot1"), { user_id: "stranger" }));
    await assertFails(updateDoc(doc(owner(), "chatbot_configs/bot1"), { suspended: true }));
    await assertFails(updateDoc(doc(stranger(), "chatbot_configs/bot1"), { name: "Mine now" }));
    await assertFails(deleteDoc(doc(stranger(), "chatbot_configs/bot1")));
    await assertSucceeds(deleteDoc(doc(owner(), "chatbot_configs/bot1")));
  });
});

describe("visitor records", () => {
  it.each(["leads", "analytics_events", "unanswered_queries", "conversations"])(
    "%s: only the owner reads them, and nobody creates them from the browser",
    async (name) => {
      await assertSucceeds(getDoc(doc(owner(), `${name}/r1`)));
      await assertSucceeds(getDocs(query(collection(owner(), name), where("ownerId", "==", "owner1"))));
      await assertFails(getDoc(doc(stranger(), `${name}/r1`)));
      await assertFails(getDocs(collection(stranger(), name)));
      await assertFails(setDoc(doc(visitor(), `${name}/new`), record));
      await assertFails(setDoc(doc(owner(), `${name}/new`), record));
    }
  );

  it.each(["leads", "analytics_events", "unanswered_queries"])(
    "%s: owners may mark a record resolved but not rewrite it into another dashboard",
    async (name) => {
      await assertSucceeds(updateDoc(doc(owner(), `${name}/r1`), { resolved: true }));
      await assertFails(updateDoc(doc(owner(), `${name}/r1`), { ownerId: "stranger" }));
      await assertFails(updateDoc(doc(owner(), `${name}/r1`), { chatbotId: "botS" }));
      await assertFails(updateDoc(doc(owner(), `${name}/r1`), { resolved: "yes" }));
    }
  );

  it("admins can't read saved conversations or leads", async () => {
    await assertFails(getDoc(doc(admin(), "conversations/r1")));
    await assertFails(getDocs(collection(admin(), "conversations")));
    await assertFails(getDoc(doc(admin(), "leads/r1")));
  });

  it("owners can delete conversations but not edit them", async () => {
    await assertFails(updateDoc(doc(owner(), "conversations/r1"), { preview: "edited" }));
    await assertSucceeds(deleteDoc(doc(owner(), "conversations/r1")));
  });

  it("a visitor can read one rating by id, but only the owner lists them", async () => {
    await assertSucceeds(getDoc(doc(visitor(), "feedback/r1")));
    await assertFails(getDocs(collection(visitor(), "feedback")));
    await assertSucceeds(getDocs(query(collection(owner(), "feedback"), where("ownerId", "==", "owner1"))));
    await assertFails(setDoc(doc(visitor(), "feedback/new"), record));
  });
});

describe("suspended owners", () => {
  beforeEach(async () => {
    await env.clearFirestore();
    await seed({ suspended: true });
  });

  it("can still sign in and read their data", async () => {
    await assertSucceeds(getDoc(doc(owner(), "users/owner1")));
    await assertSucceeds(getDoc(doc(owner(), "leads/r1")));
  });

  it("can't create, edit or delete anything", async () => {
    await assertFails(setDoc(doc(owner(), "chatbot_configs/bot2"), chatbot));
    await assertFails(updateDoc(doc(owner(), "chatbot_configs/bot1"), { name: "Renamed" }));
    await assertFails(deleteDoc(doc(owner(), "chatbot_configs/bot1")));
    await assertFails(deleteDoc(doc(owner(), "leads/r1")));
    await assertFails(deleteDoc(doc(owner(), "conversations/r1")));
  });

  it("can't go online for live chat", async () => {
    await assertFails(setDoc(doc(owner(), "presence/owner1"), { online: true, lastSeen: serverTimestamp() }));
  });

  it("can't lift the suspension or delete the profile to escape it", async () => {
    await assertFails(updateDoc(doc(owner(), "users/owner1"), { suspended: false }));
    await assertFails(deleteDoc(doc(owner(), "users/owner1")));
  });
});

describe("live chat", () => {
  it("a visitor can follow a conversation in live chat, but not an ordinary one", async () => {
    await assertSucceeds(getDoc(doc(visitor(), "conversations/bot1_livesession1")));
    await assertSucceeds(getDoc(doc(visitor(), "conversations/bot1_idlesession1")));
    await assertFails(getDoc(doc(visitor(), "conversations/r1")));
  });

  it("nobody but the owner lists conversations, live or not", async () => {
    await assertFails(getDocs(collection(visitor(), "conversations")));
    await assertFails(getDocs(query(collection(stranger(), "conversations"), where("liveStatus", "==", "waiting"))));
    await assertSucceeds(
      getDocs(query(collection(owner(), "conversations"), where("ownerId", "==", "owner1"), where("liveStatus", "==", "waiting")))
    );
  });

  const reply = (text: string, extra: Record<string, unknown> = {}) => ({
    messages: arrayUnion({ role: "agent", text, at: Date.now(), name: "Sara" }),
    messageCount: increment(1),
    lastMessageAt: serverTimestamp(),
    liveStatus: "active",
    agentName: "Sara",
    ...extra,
  });

  it("the owner replies straight from the dashboard, one reply at a time", async () => {
    await assertSucceeds(updateDoc(doc(owner(), "conversations/bot1_livesession1"), reply("Hi, Sara here.")));
    await assertSucceeds(updateDoc(doc(owner(), "conversations/bot1_livesession1"), reply("How can I help?")));
  });

  it("an owner reply can't change anything else", async () => {
    await assertFails(updateDoc(doc(owner(), "conversations/bot1_livesession1"), reply("Hi", { ownerId: "stranger" })));
    await assertFails(
      updateDoc(doc(owner(), "conversations/bot1_livesession1"), {
        messages: arrayUnion({ role: "visitor", text: "fake", at: 1 }),
        messageCount: increment(1),
        lastMessageAt: serverTimestamp(),
        liveStatus: "active",
      })
    );
    await assertFails(updateDoc(doc(owner(), "conversations/bot1_livesession1"), reply("x".repeat(1001))));
  });

  it("only the owner, on Pro, replies; strangers and visitors can't", async () => {
    await assertFails(updateDoc(doc(stranger(), "conversations/bot1_livesession1"), reply("Hi")));
    await assertFails(updateDoc(doc(visitor(), "conversations/bot1_livesession1"), reply("Hi")));
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), "users/owner1"), { plan: "free" }));
    await assertFails(updateDoc(doc(owner(), "conversations/bot1_livesession1"), reply("Hi")));
  });

  it("the owner can't reply into an ordinary or long-finished chat", async () => {
    await assertFails(updateDoc(doc(owner(), "conversations/r1"), reply("Hi")));
  });

  it("the owner can say they're typing, and nothing else with it", async () => {
    await assertSucceeds(updateDoc(doc(owner(), "conversations/bot1_livesession1"), { agentTypingAt: serverTimestamp() }));
    await assertFails(
      updateDoc(doc(owner(), "conversations/bot1_livesession1"), { agentTypingAt: serverTimestamp(), liveStatus: "ended" })
    );
    await assertFails(updateDoc(doc(stranger(), "conversations/bot1_livesession1"), { agentTypingAt: serverTimestamp() }));
  });

  it("the owner ends a live chat", async () => {
    await assertSucceeds(
      updateDoc(doc(owner(), "conversations/bot1_livesession1"), { liveStatus: "ended", liveEndedAt: serverTimestamp() })
    );
  });

  it("visitors can't write to a live conversation", async () => {
    await assertFails(updateDoc(doc(visitor(), "conversations/bot1_livesession1"), { liveStatus: "active" }));
  });

  it("anyone can see whether an owner is online", async () => {
    await assertSucceeds(getDoc(doc(visitor(), "presence/owner1")));
  });

  it("with phone notifications, the owner can stay reachable for up to 12 hours", async () => {
    const inHours = (h: number) => new Date(Date.now() + h * 3600_000);
    await assertSucceeds(setDoc(doc(owner(), "presence/owner1"), { online: true, lastSeen: serverTimestamp(), availableUntil: inHours(8) }));
    await assertFails(setDoc(doc(owner(), "presence/owner1"), { online: true, lastSeen: serverTimestamp(), availableUntil: inHours(48) }));
  });

  it("only the owner sets their status, with the server's time and nothing else", async () => {
    await assertSucceeds(setDoc(doc(owner(), "presence/owner1"), { online: false, lastSeen: serverTimestamp() }));
    await assertFails(setDoc(doc(stranger(), "presence/owner1"), { online: true, lastSeen: serverTimestamp() }));
    await assertFails(setDoc(doc(owner(), "presence/owner1"), { online: true, lastSeen: new Date(2030, 0, 1) }));
    await assertFails(setDoc(doc(owner(), "presence/owner1"), { online: true, lastSeen: serverTimestamp(), name: "x" }));
    await assertFails(setDoc(doc(visitor(), "presence/owner1"), { online: true, lastSeen: serverTimestamp() }));
  });
});

describe("server-only data", () => {
  it("owners read their own AI usage, even for a month not written yet", async () => {
    await assertSucceeds(getDoc(doc(owner(), "ai_usage/owner1_2026-10")));
    await assertSucceeds(getDoc(doc(owner(), "ai_usage/owner1_2026-11")));
    await assertFails(getDoc(doc(stranger(), "ai_usage/owner1_2026-10")));
    await assertFails(setDoc(doc(owner(), "ai_usage/owner1_2026-10"), { count: 0 }));
    await assertSucceeds(getDoc(doc(admin(), "ai_usage/owner1_2026-10")));
  });

  it("the admin log is readable by admins only, and written by nobody", async () => {
    await assertSucceeds(getDoc(doc(admin(), "admin_log/e1")));
    await assertFails(getDoc(doc(owner(), "admin_log/e1")));
    await assertFails(setDoc(doc(admin(), "admin_log/e2"), { action: "fake" }));
  });

  it("rate limits and unknown collections are closed", async () => {
    await assertFails(getDoc(doc(owner(), "ai_rate_limits/w1")));
    await assertFails(setDoc(doc(visitor(), "ai_rate_limits/w2"), { count: 0 }));
    await assertFails(getDoc(doc(admin(), "anything/else")));
    await assertFails(setDoc(doc(owner(), "anything/else"), { a: 1 }));
  });
});
