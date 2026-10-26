import { collection, doc, getCountFromServer, getDoc, orderBy, query, where } from "firebase/firestore";
import { db } from "./db";

// The sidebar's "new" counts. Each is measured against the last time the
// owner looked, stored per browser: the dashboard's notifications tab for
// leads and unanswered questions, the Conversations page for chats.
export const NOTIFICATIONS_SEEN_KEY = "askio_notifications_last_seen";
const CONVERSATIONS_SEEN_KEY = "askio_conversations_last_seen";

/** Fired when the owner has just looked, so the sidebar clears its count. */
export const SEEN_EVENT = "askio:seen";

function readDate(key: string) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
}

function markSeen(key: string) {
  try {
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // Without storage the count just comes back next visit.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

export const markNotificationsSeen = () => markSeen(NOTIFICATIONS_SEEN_KEY);
export const markConversationsSeen = () => markSeen(CONVERSATIONS_SEEN_KEY);

export type SidebarCounts = { dashboard: number; conversations: number };

export async function fetchSidebarCounts(uid: string): Promise<SidebarCounts> {
  // First visit on this browser: count only the last week, not all history.
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const notificationsSince = readDate(NOTIFICATIONS_SEEN_KEY) ?? weekAgo;
  const conversationsSince = readDate(CONVERSATIONS_SEEN_KEY) ?? weekAgo;
  const count = (q: Parameters<typeof getCountFromServer>[0]) =>
    getCountFromServer(q)
      .then((s) => s.data().count)
      .catch(() => 0);
  const owned = (name: string) => [collection(db, name), where("ownerId", "==", uid)] as const;

  const [leads, questions, conversations] = await Promise.all([
    count(query(...owned("leads"), where("timestamp", ">", notificationsSince))),
    count(query(...owned("unanswered_queries"), where("timestamp", ">", notificationsSince))),
    count(
      query(...owned("conversations"), where("lastMessageAt", ">", conversationsSince), orderBy("lastMessageAt", "desc"))
    ),
  ]);
  return { dashboard: leads + questions, conversations };
}

export type AiUsage = { used: number; limit: number | null };

/** This month's AI replies against the plan's limit (null: no limit). */
export async function fetchAiUsage(uid: string, defaultLimit: number): Promise<AiUsage> {
  const [userSnap, usageSnap] = await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDoc(doc(db, "ai_usage", `${uid}_${new Date().toISOString().slice(0, 7)}`)),
  ]);
  const data = userSnap.data() || {};
  const limit = typeof data.aiReplyLimit === "number" ? data.aiReplyLimit : data.plan === "enterprise" ? null : defaultLimit;
  return { used: usageSnap.exists() ? Number(usageSnap.data().replies) || 0 : 0, limit };
}
