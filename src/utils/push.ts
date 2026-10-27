import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { app } from "./firebase";
import { db } from "./db";

// Push notifications (Firebase Cloud Messaging) on this device: a visitor
// asking for you rings your phone or computer, even with Askio closed.
// Needs VITE_FIREBASE_VAPID_KEY (Firebase console > Project settings >
// Cloud Messaging > Web Push certificates).

const TOKEN_KEY = "askio_push_token";
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export type PushState = "unsupported" | "unconfigured" | "blocked" | "off" | "on";

export function pushTokenOnThisDevice() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function pushState(): Promise<PushState> {
  if (!vapidKey) return "unconfigured";
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) return "unsupported";
  const { isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return pushTokenOnThisDevice() && Notification.permission === "granted" ? "on" : "off";
}

async function messagingWithWorker() {
  const config = app.options;
  const query = new URLSearchParams({
    apiKey: config.apiKey || "",
    projectId: config.projectId || "",
    messagingSenderId: config.messagingSenderId || "",
    appId: config.appId || "",
  });
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const { getMessaging } = await import("firebase/messaging");
  return { messaging: getMessaging(app), registration };
}

/** Asks permission, then saves this device's push token on your account. */
export async function turnOnPush(uid: string): Promise<PushState> {
  if (!vapidKey) return "unconfigured";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";
  const { messaging, registration } = await messagingWithWorker();
  const { getToken } = await import("firebase/messaging");
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) return "off";
  await updateDoc(doc(db, "users", uid), { pushTokens: arrayUnion(token) });
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The server cleans up tokens that stop working.
  }
  return "on";
}

export async function turnOffPush(uid: string): Promise<PushState> {
  const token = pushTokenOnThisDevice();
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored.
  }
  if (token) {
    await updateDoc(doc(db, "users", uid), { pushTokens: arrayRemove(token) }).catch(() => undefined);
    try {
      const { messaging } = await messagingWithWorker();
      const { deleteToken } = await import("firebase/messaging");
      await deleteToken(messaging);
    } catch {
      // Already gone.
    }
  }
  return "off";
}
