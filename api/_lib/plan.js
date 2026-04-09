import { adminDb } from "./firebaseAdmin.js";

function hasPaidAccessUntilPeriodEnd(subscriptionStatus, currentPeriodEnd) {
  if (!["cancelled", "canceled"].includes(String(subscriptionStatus || "").toLowerCase())) {
    return false;
  }

  if (!currentPeriodEnd) {
    return false;
  }

  const endDate = new Date(currentPeriodEnd);
  return !Number.isNaN(endDate.getTime()) && endDate.getTime() > Date.now();
}

function buildAccessProfile(userData = {}) {
  const legacyPlan = userData.isPro ? "pro" : "free";
  const storedPlan = userData.plan || legacyPlan;
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

  const defaultLimit =
    plan === "enterprise" ? Number.MAX_SAFE_INTEGER : plan === "pro" ? 10 : 0;

  return {
    plan,
    subscriptionStatus,
    aiChatbotLimit: userData.aiChatbotLimit ?? defaultLimit,
    isSubscriptionActive:
      plan === "free" ||
      ["active", "trialing", "on_trial"].includes(subscriptionStatus) ||
      (plan === "pro" && paidThroughPeriodEnd),
  };
}

function forbidden(message) {
  const error = new Error(message);
  error.statusCode = 403;
  throw error;
}

export async function getUserAccessProfile(uid) {
  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    uid,
    userRef: userSnap.ref,
    userData: userSnap.data(),
    access: buildAccessProfile(userSnap.data()),
  };
}

export async function assertCanUseAiForOwner(uid) {
  const profile = await getUserAccessProfile(uid);

  if (profile.access.plan === "free") {
    forbidden("AI features are available on Pro and Enterprise plans only.");
  }

  if (!profile.access.isSubscriptionActive) {
    forbidden("Your subscription is not active. Please update billing to use AI features.");
  }

  return profile;
}

export async function assertCanEnableAiChatbot(uid, chatbotId) {
  const profile = await assertCanUseAiForOwner(uid);

  if (profile.access.plan === "enterprise") {
    return profile;
  }

  const snapshot = await adminDb
    .collection("chatbot_configs")
    .where("user_id", "==", uid)
    .where("aiEnabled", "==", true)
    .get();

  const currentCount = snapshot.docs.filter((doc) => doc.id !== chatbotId).length;

  if (currentCount >= profile.access.aiChatbotLimit) {
    forbidden(
      `Your plan supports up to ${profile.access.aiChatbotLimit} AI chatbots. Contact us to enable more.`
    );
  }

  return profile;
}

export async function getOwnedChatbot(uid, chatbotId) {
  const chatbotRef = adminDb.collection("chatbot_configs").doc(chatbotId);
  const chatbotSnap = await chatbotRef.get();

  if (!chatbotSnap.exists) {
    const error = new Error("Chatbot not found.");
    error.statusCode = 404;
    throw error;
  }

  const chatbotData = chatbotSnap.data();
  if (chatbotData.user_id !== uid) {
    const error = new Error("You do not have access to this chatbot.");
    error.statusCode = 403;
    throw error;
  }

  return {
    chatbotRef,
    chatbotId: chatbotSnap.id,
    chatbotData,
  };
}

export async function assertChatbotAiAvailable(chatbotId) {
  const chatbotSnap = await adminDb.collection("chatbot_configs").doc(chatbotId).get();

  if (!chatbotSnap.exists) {
    const error = new Error("Chatbot not found.");
    error.statusCode = 404;
    throw error;
  }

  const chatbotData = chatbotSnap.data();
  if (!chatbotData.aiEnabled) {
    forbidden("AI is not enabled for this chatbot.");
  }

  await assertCanUseAiForOwner(chatbotData.user_id);

  return {
    chatbotId: chatbotSnap.id,
    chatbotData,
  };
}
