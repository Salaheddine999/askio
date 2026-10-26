import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

// These modules load the Firebase Admin SDK, which needs real credentials.
vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: {}, adminAuth: {} }));

const { verifyWebhookSignature } = await import("../api/_lib/lemonsqueezy.js");
const { mapPlanStatus } = await import("../api/webhooks/lemonsqueezy.js");
const { buildAccessProfile } = await import("../api/_lib/plan.js");

const sign = (body: string, secret: string) => crypto.createHmac("sha256", secret).update(body).digest("hex");

describe("Lemon Squeezy webhook signature", () => {
  const body = JSON.stringify({ meta: { event_name: "subscription_created" } });

  it("accepts a correct signature", () => {
    expect(verifyWebhookSignature(body, sign(body, "secret"), "secret")).toBe(true);
  });

  it("rejects a wrong secret, a tampered body and a missing signature", () => {
    expect(verifyWebhookSignature(body, sign(body, "other"), "secret")).toBe(false);
    expect(verifyWebhookSignature(body + " ", sign(body, "secret"), "secret")).toBe(false);
    expect(verifyWebhookSignature(body, "", "secret")).toBe(false);
  });
});

describe("mapPlanStatus (subscription status to plan)", () => {
  it.each(["active", "on_trial", "cancelled"])("%s keeps Pro", (status) => {
    expect(mapPlanStatus(status)).toMatchObject({ plan: "pro", isPro: true, aiChatbotLimit: 10 });
  });

  it.each(["paused", "past_due", "unpaid", "expired", "", "something_new"])("%s drops to free", (status) => {
    expect(mapPlanStatus(status)).toMatchObject({ plan: "free", isPro: false, aiChatbotLimit: 0 });
  });
});

describe("buildAccessProfile (what an account may use)", () => {
  const future = new Date(Date.now() + 10 * 86_400_000).toISOString();
  const past = new Date(Date.now() - 10 * 86_400_000).toISOString();

  it("free accounts get no AI", () => {
    expect(buildAccessProfile({ plan: "free" })).toMatchObject({ plan: "free", aiChatbotLimit: 0, aiReplyLimit: 0 });
  });

  it("active Pro gets 10 AI chatbots and the monthly reply limit", () => {
    const access = buildAccessProfile({ plan: "pro", subscriptionStatus: "active" });
    expect(access).toMatchObject({ plan: "pro", aiChatbotLimit: 10, isSubscriptionActive: true });
    expect(access.aiReplyLimit).toBeGreaterThan(0);
  });

  it("a cancelled Pro keeps access until the period ends", () => {
    expect(
      buildAccessProfile({ plan: "free", subscriptionStatus: "cancelled", currentPeriodEnd: future })
    ).toMatchObject({ plan: "pro", isSubscriptionActive: true });
    expect(
      buildAccessProfile({ plan: "free", subscriptionStatus: "cancelled", currentPeriodEnd: past })
    ).toMatchObject({ plan: "free" });
  });

  it("a past-due Pro is not active", () => {
    expect(buildAccessProfile({ plan: "pro", subscriptionStatus: "past_due" })).toMatchObject({
      isSubscriptionActive: false,
    });
  });

  it("legacy isPro accounts count as Pro", () => {
    expect(buildAccessProfile({ isPro: true })).toMatchObject({ plan: "pro" });
  });
});
