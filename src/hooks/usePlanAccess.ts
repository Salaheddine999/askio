import { useEffect, useState } from "react";
import { doc, getDoc, type DocumentData } from "firebase/firestore";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";

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

/** The signed-in account's plan access (see planAccess). The server still decides. */
export function usePlanAccess() {
  const [state, setState] = useState<{ loading: boolean; plan: Plan; canUseAi: boolean }>({
    loading: true,
    plan: "free",
    canUseAi: false,
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setState({ loading: false, plan: "free", canUseAi: false });
      return;
    }
    let cancelled = false;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        const { plan, canUseAi } = planAccess(snap.data());
        if (!cancelled) setState({ loading: false, plan, canUseAi });
      })
      .catch(() => !cancelled && setState({ loading: false, plan: "free", canUseAi: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
