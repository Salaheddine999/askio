import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { apiRequest } from "./api";

const publicCheckoutUrl = import.meta.env.VITE_LEMONSQUEEZY_PRO_CHECKOUT_URL || "";
const publicBillingUrl = import.meta.env.VITE_LEMONSQUEEZY_BILLING_URL || "";

function hasPaidAccessUntilPeriodEnd(subscriptionStatus: string, currentPeriodEnd?: string | null) {
  if (!["cancelled", "canceled"].includes(String(subscriptionStatus || "").toLowerCase())) {
    return false;
  }

  if (!currentPeriodEnd) {
    return false;
  }

  const endDate = new Date(currentPeriodEnd);
  return !Number.isNaN(endDate.getTime()) && endDate.getTime() > Date.now();
}

function buildClientCheckoutUrl({
  baseUrl,
  uid,
  email,
  name,
}: {
  baseUrl: string;
  uid?: string;
  email?: string;
  name?: string;
}) {
  const url = new URL(baseUrl);

  if (email) {
    url.searchParams.set("checkout[email]", email);
  }

  if (name) {
    url.searchParams.set("checkout[name]", name);
  }

  if (uid) {
    url.searchParams.set("checkout[custom][uid]", uid);
  }

  return url.toString();
}

async function userHasActivePaidPlan(uid: string) {
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    return false;
  }

  const userData = userDoc.data();
  const storedPlan = userData.plan || (userData.isPro ? "pro" : "free");
  const subscriptionStatus =
    userData.subscriptionStatus || (storedPlan === "free" ? "inactive" : "active");
  const paidThroughPeriodEnd = hasPaidAccessUntilPeriodEnd(
    subscriptionStatus,
    userData.currentPeriodEnd
  );
  const plan =
    storedPlan === "enterprise"
      ? "enterprise"
      : storedPlan === "pro" || paidThroughPeriodEnd
        ? "pro"
        : "free";

  return (
    plan !== "free" &&
    (["active", "trialing", "on_trial"].includes(subscriptionStatus) ||
      paidThroughPeriodEnd)
  );
}

export async function redirectToProCheckout() {
  const user = auth.currentUser;

  if (!publicCheckoutUrl) {
    throw new Error("Public checkout URL is not configured.");
  }

  if (!user) {
    window.location.href = publicCheckoutUrl;
    return;
  }

  try {
    const alreadyPaid = await userHasActivePaidPlan(user.uid);

    if (alreadyPaid) {
      window.location.href = "/dashboard";
      return;
    }
  } catch (error) {
    console.warn("Unable to verify current plan before checkout:", error);
  }

  try {
    const { url } = await apiRequest<{ url: string }>("/api/billing/create-checkout", {
      authRequired: true,
      body: {
        email: user.email || "",
        name: user.displayName || "",
      },
    });

    window.location.href = url;
  } catch (error) {
    console.warn("Falling back to client-built Lemon Squeezy checkout URL:", error);
    window.location.href = buildClientCheckoutUrl({
      baseUrl: publicCheckoutUrl,
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "",
    });
  }
}

export async function redirectToBillingPortal() {
  const user = auth.currentUser;

  if (!user) {
    if (!publicBillingUrl) {
      throw new Error("Billing portal URL is not configured.");
    }

    window.location.href = publicBillingUrl;
    return;
  }

  const { url } = await apiRequest<{ url: string | null }>(
    "/api/billing/customer-portal",
    { authRequired: true }
  );

  if (!url) {
    throw new Error("Billing portal URL is not available yet.");
  }

  window.location.href = url;
}
