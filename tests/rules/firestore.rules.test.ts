import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, getDocs, collection, query, setDoc, updateDoc, where } from "firebase/firestore";
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

  it("a new profile can't start suspended or belong to someone else", async () => {
    await assertSucceeds(setDoc(doc(stranger(), "users/stranger"), { ...profile, plan: "free" }));
    await assertFails(setDoc(doc(env.authenticatedContext("new").firestore(), "users/new"), { suspended: false }));
    await assertFails(setDoc(doc(stranger(), "users/someone-else"), { plan: "free" }));
  });
});

describe("chatbots", () => {
  it("anyone can read a chatbot (the widget loads it)", async () => {
    await assertSucceeds(getDoc(doc(visitor(), "chatbot_configs/bot1")));
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

  it("can't lift the suspension or delete the profile to escape it", async () => {
    await assertFails(updateDoc(doc(owner(), "users/owner1"), { suspended: false }));
    await assertFails(deleteDoc(doc(owner(), "users/owner1")));
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
