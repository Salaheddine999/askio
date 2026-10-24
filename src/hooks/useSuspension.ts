import { useEffect, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../utils/db";

export interface Suspension {
  reason: string | null;
  since: Date | null;
}

/**
 * The signed-in account's suspension, kept live so a suspension (or lifting
 * one) shows up without reloading. null when the account isn't suspended.
 */
export function useSuspension(user: User | null) {
  const [suspension, setSuspension] = useState<Suspension | null>(null);

  useEffect(() => {
    if (!user) {
      setSuspension(null);
      return;
    }
    return onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        const data = snap.data();
        setSuspension(
          data?.suspended === true
            ? {
                reason: data.suspendedReason || null,
                since: data.suspendedAt instanceof Timestamp ? data.suspendedAt.toDate() : null,
              }
            : null
        );
      },
      (error) => console.warn("Couldn't check the account status:", error)
    );
  }, [user]);

  return suspension;
}
