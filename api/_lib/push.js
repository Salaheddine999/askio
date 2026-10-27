import { getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin.js";
import { reportError } from "./monitoring.js";
import { stringsFor } from "./email/templates.js";

// Push notifications to an owner's devices (Firebase Cloud Messaging). Each
// device that turned them on in Settings saved a token on the account.

const appUrl = () => (process.env.APP_URL || "https://www.getaskio.xyz").replace(/\/$/, "");
// Tokens Firebase says will never work again; they're removed.
const GONE = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token", "messaging/invalid-argument"]);

/** Sends to every device of this owner; never throws. */
export async function sendPush(uid, { title, body, path, tag }) {
  try {
    const ref = adminDb.collection("users").doc(uid);
    const tokens = (await ref.get()).data()?.pushTokens;
    if (!Array.isArray(tokens) || tokens.length === 0) return 0;
    const app = getApps()[0];
    if (!app) return 0;
    const result = await getMessaging(app).sendEachForMulticast({
      tokens: tokens.slice(0, 20),
      webpush: {
        notification: { title, body, icon: "/icon-192.png", badge: "/favicon-32.png", tag, renotify: true },
        fcmOptions: { link: `${appUrl()}${path}` },
      },
    });
    const gone = result.responses.map((r, i) => (!r.success && GONE.has(r.error?.code) ? tokens[i] : null)).filter(Boolean);
    if (gone.length) await ref.update({ pushTokens: FieldValue.arrayRemove(...gone) }).catch(() => undefined);
    return result.successCount;
  } catch (error) {
    console.error("Couldn't send a push notification:", error.message);
    reportError(error, { route: "push" });
    return 0;
  }
}

/** "A visitor wants to talk to you", in the owner's language. */
export async function pushLiveChatRequest({ chatbot, conversationId, preview }) {
  if (!chatbot?.user_id) return 0;
  const user = (await adminDb.collection("users").doc(chatbot.user_id).get().catch(() => null))?.data();
  const s = stringsFor(user?.language || chatbot.language || "en");
  return sendPush(chatbot.user_id, {
    title: s.pushLiveTitle,
    body: preview ? `${chatbot.title || "Askio"}: ${String(preview).slice(0, 120)}` : s.pushLiveBody.replace("{bot}", chatbot.title || "Askio"),
    path: `/conversations?open=${encodeURIComponent(conversationId)}`,
    tag: `live-${conversationId}`,
  });
}
