import { useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../utils/firebase";

/**
 * Whether the signed-in account has the admin claim (set with
 * scripts/set-admin.mjs). Only for showing admin UI: the server and the
 * Firestore rules check the claim themselves. null while it's being read.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(
    () =>
      onIdTokenChanged(auth, async (user) => {
        if (!user) return setIsAdmin(false);
        try {
          const { claims } = await user.getIdTokenResult();
          setIsAdmin(claims.admin === true);
        } catch {
          setIsAdmin(false);
        }
      }),
    []
  );

  return isAdmin;
}
