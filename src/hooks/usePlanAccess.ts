import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import { planAccess, type Plan } from "../utils/planAccess";

export { planAccess, type Plan };

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
