import { auth } from "./firebase";
import { apiRequest } from "./api";

const publicCheckoutUrl = import.meta.env.VITE_LEMONSQUEEZY_PRO_CHECKOUT_URL || "";
const publicBillingUrl = import.meta.env.VITE_LEMONSQUEEZY_BILLING_URL || "";

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
