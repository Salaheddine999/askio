import type { DocumentData } from "firebase/firestore";

// Kept apart from the usePlanAccess hook so it can be used, and tested,
// without loading the Firebase client.

export type Plan = "free" | "pro" | "enterprise";

const isFuture = (value?: string | null) => {
  const end = value ? new Date(value) : null;
  return Boolean(end && !Number.isNaN(end.getTime()) && end.getTime() > Date.now());
};

/**
 * An account's plan and whether it may use AI features, from its user
 * document, by the same rules as the server (api/_lib/plan.js): a cancelled
 * Pro keeps access to its period end, and a gift of Pro lasts until its end date.
 */
export function planAccess(data: DocumentData = {}): { plan: Plan; canUseAi: boolean; gifted: boolean } {
  const stored: Plan = data.plan || (data.isPro ? "pro" : "free");
  const status = String(data.subscriptionStatus || (stored === "free" ? "inactive" : "active")).toLowerCase();
  const gifted = status === "gifted";
  const giftActive = gifted && isFuture(data.giftedUntil);
  const paidThrough = ["cancelled", "canceled"].includes(status) && isFuture(data.currentPeriodEnd);
  const plan: Plan =
    stored === "enterprise"
      ? "enterprise"
      : gifted
        ? giftActive
          ? "pro"
          : "free"
        : stored === "pro" || paidThrough
          ? "pro"
          : "free";
  const canUseAi =
    plan === "enterprise" ||
    (plan === "pro" && (["active", "trialing", "on_trial"].includes(status) || paidThrough || giftActive));
  return { plan, canUseAi, gifted: giftActive };
}
