import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

// These modules load the Firebase Admin SDK, which needs real credentials.
vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: {}, adminAuth: {} }));

const { verifyWebhookSignature } = await import("../api/_lib/lemonsqueezy.js");
const { billingIntervalOf: billingIntervalFromVariant, keepsGift, keepsRefund, mapPlanStatus, refundUpdate } = await import(
  "../api/webhooks/lemonsqueezy.js"
);
const { billingIntervalOf } = await import("../src/utils/pricing");
const { buildAccessProfile } = await import("../api/_lib/plan.js");
const { giftEndDate } = await import("../api/_lib/account/adminActions.js");
const { planAccess } = await import("../src/utils/planAccess");

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

describe("refunds end Pro", () => {
  const PERIOD_END = "2026-12-02T10:00:00.000000Z";
  const stored = { lemonSqueezySubscriptionId: "77", lemonSqueezyOrderId: 501, currentPeriodEnd: PERIOD_END, plan: "pro" };
  const invoice = (status: string, subscriptionId = 77) => ({
    data: { type: "subscription-invoices", id: "9", attributes: { status, subscription_id: subscriptionId, refunded_at: "2026-11-05T00:00:00Z" } },
  });
  const order = (status: string, id = "501") => ({ data: { type: "orders", id, attributes: { status } } });
  const refunded = () => ({ ...stored, ...refundUpdate(stored, invoice("refunded")) });

  it("a fully refunded subscription payment drops the account to free", () => {
    expect(refundUpdate(stored, invoice("refunded"))).toMatchObject({
      plan: "free",
      isPro: false,
      subscriptionStatus: "refunded",
      refundedPeriodEnd: PERIOD_END,
    });
  });

  it("a fully refunded first order drops the account to free", () => {
    expect(refundUpdate(stored, order("refunded"))).toMatchObject({ plan: "free", isPro: false });
  });

  it("partial refunds change nothing", () => {
    expect(refundUpdate(stored, invoice("partial_refund"))).toBeNull();
    expect(refundUpdate(stored, order("partial_refund"))).toBeNull();
  });

  it("a refund for another subscription or order changes nothing", () => {
    expect(refundUpdate(stored, invoice("refunded", 78))).toBeNull();
    expect(refundUpdate(stored, order("refunded", "502"))).toBeNull();
    expect(refundUpdate({}, order("refunded", "501"))).toBeNull();
  });

  it("cancelling after the refund doesn't bring Pro back for that period", () => {
    const periodEnd = "2026-12-02T10:00:00Z";
    expect(keepsRefund(refunded(), { subscriptionId: "77", periodEnd, mapped: mapPlanStatus("cancelled") })).toBe(true);
  });

  it("a new payment gives Pro again", () => {
    const periodEnd = "2027-01-02T10:00:00Z";
    expect(keepsRefund(refunded(), { subscriptionId: "77", periodEnd, mapped: mapPlanStatus("active") })).toBe(false);
  });

  it("a refunded account has no Pro access", () => {
    expect(buildAccessProfile(refunded())).toMatchObject({ plan: "free" });
  });
});

describe("monthly or yearly", () => {
  it("reads it from the variant name Lemon Squeezy sends", () => {
    expect(billingIntervalFromVariant("Yearly")).toBe("yearly");
    expect(billingIntervalFromVariant("Annual plan")).toBe("yearly");
    expect(billingIntervalFromVariant("Monthly")).toBe("monthly");
    expect(billingIntervalFromVariant("Default")).toBeNull();
    expect(billingIntervalFromVariant(undefined)).toBeNull();
  });

  it("falls back to the live variant ids for accounts saved before", () => {
    expect(billingIntervalOf({ billingInterval: "yearly" })).toBe("yearly");
    expect(billingIntervalOf({ lemonSqueezyVariantId: 2329884 })).toBe("yearly");
    expect(billingIntervalOf({ lemonSqueezyVariantId: 2329885 })).toBe("monthly");
    expect(billingIntervalOf({ lemonSqueezyVariantId: 1 })).toBeNull();
  });
});

describe("gifts of Pro", () => {
  const DAY = 86_400_000;
  const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString();
  const gifted = (days: number) => ({ plan: "pro", isPro: true, aiChatbotLimit: 10, subscriptionStatus: "gifted", giftedUntil: inDays(days) });

  it("a gift gives Pro and AI until its end date", () => {
    expect(buildAccessProfile(gifted(10))).toMatchObject({ plan: "pro", isSubscriptionActive: true });
    expect(planAccess(gifted(10))).toEqual({ plan: "pro", canUseAi: true, gifted: true });
  });

  it("an ended gift is free, even before the daily job runs", () => {
    expect(buildAccessProfile(gifted(-1))).toMatchObject({ plan: "free" });
    expect(planAccess(gifted(-1))).toMatchObject({ plan: "free", canUseAi: false });
  });

  it("a subscription ending during a gift keeps the gift", () => {
    expect(keepsGift({ giftedUntil: inDays(10) }, mapPlanStatus("expired"))).toBe(true);
    expect(keepsGift({ giftedUntil: inDays(-1) }, mapPlanStatus("expired"))).toBe(false);
    expect(keepsGift({ giftedUntil: inDays(10) }, mapPlanStatus("active"))).toBe(false);
  });

  it("the end date is the end of the chosen day, in the future and within 3 years", () => {
    const now = Date.parse("2026-11-02T12:00:00Z");
    expect(giftEndDate("2026-12-02", now)).toBe("2026-12-02T23:59:59.000Z");
    expect(() => giftEndDate("2026-11-01", now)).toThrow("future");
    expect(() => giftEndDate("2031-01-01", now)).toThrow("3 years");
    expect(() => giftEndDate("soon", now)).toThrow();
  });
});
