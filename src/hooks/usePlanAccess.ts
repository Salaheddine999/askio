import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";

export type Plan = "free" | "pro" | "enterprise";

function paidUntilPeriodEnd(status: string, periodEnd?: string | null) {
  if (!["cancelled", "canceled"].includes(String(status || "").toLowerCase()) || !periodEnd) return false;
  const end = new Date(periodEnd);
  return !Number.isNaN(end.getTime()) && end.getTime() > Date.now();
}

/**
 * The signed-in account's plan and whether it may use AI features, by the
 * same rules as the server (api/_lib/plan.js). The server still decides.
 */
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
        const data = snap.data() || {};
        const stored: Plan = data.plan || (data.isPro ? "pro" : "free");
        const status = data.subscriptionStatus || (stored === "free" ? "inactive" : "active");
        const paidThrough = paidUntilPeriodEnd(status, data.currentPeriodEnd);
        const plan: Plan = stored === "enterprise" ? "enterprise" : stored === "pro" || paidThrough ? "pro" : "free";
        const canUseAi =
          plan === "enterprise" ||
          (plan === "pro" && (["active", "trialing", "on_trial"].includes(status) || paidThrough));
        if (!cancelled) setState({ loading: false, plan, canUseAi });
      })
      .catch(() => !cancelled && setState({ loading: false, plan: "free", canUseAi: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
