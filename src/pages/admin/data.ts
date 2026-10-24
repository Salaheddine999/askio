import {
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  doc,
  getAggregateFromServer,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  sum,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../../utils/db";
import { PRO_AI_REPLY_LIMIT } from "../../utils/pricing";

// Reads for the admin dashboard. They only work for accounts with the admin
// claim: the Firestore rules give admins read access to these collections.

export const PAGE_SIZE = 25;

export type Plan = "free" | "pro" | "enterprise";

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string | null;
  storedPlan: Plan;
  plan: Plan;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  createdAt: Date | null;
  suspended: boolean;
  suspendedReason: string | null;
  subscriptionId: string | null;
  customerId: string | null;
  aiReplyLimit: number;
}

export interface AdminChatbot {
  id: string;
  name: string;
  title: string;
  aiEnabled: boolean;
  suspended: boolean;
  faqCount: number;
  lastUpdated: Date | null;
}

export interface Overview {
  accounts: number | null;
  signups7d: number | null;
  signups30d: number | null;
  paid: number | null;
  suspended: number | null;
  chatbots: number | null;
  aiChatbots: number | null;
  aiRepliesThisMonth: number | null;
}

export interface UsageRow {
  uid: string;
  replies: number;
  user: AdminUser | null;
}

export interface LogEntry {
  id: string;
  action: string;
  targetEmail: string | null;
  adminEmail: string | null;
  reason: string | null;
  at: Date | null;
}

/** The usage period, e.g. "2026-10", matching the server (UTC months). */
export const currentUsageMonth = () => new Date().toISOString().slice(0, 7);

const toDate = (value: unknown): Date | null => {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// Same rules as api/_lib/plan.js: a cancelled Pro keeps access to its period end.
function effectivePlan(data: DocumentData): Plan {
  const stored: Plan = data.plan || (data.isPro ? "pro" : "free");
  if (stored === "enterprise" || stored === "pro") return stored;
  const status = String(data.subscriptionStatus || "").toLowerCase();
  const end = toDate(data.currentPeriodEnd);
  return ["cancelled", "canceled"].includes(status) && end && end.getTime() > Date.now() ? "pro" : "free";
}

export function toAdminUser(uid: string, data: DocumentData): AdminUser {
  const plan = effectivePlan(data);
  return {
    uid,
    email: data.email || "",
    displayName: data.displayName || data.name || null,
    storedPlan: data.plan || (data.isPro ? "pro" : "free"),
    plan,
    subscriptionStatus: data.subscriptionStatus || (plan === "free" ? "inactive" : "active"),
    currentPeriodEnd: data.currentPeriodEnd || null,
    createdAt: toDate(data.createdAt),
    suspended: data.suspended === true,
    suspendedReason: data.suspendedReason || null,
    subscriptionId: data.lemonSqueezySubscriptionId ? String(data.lemonSqueezySubscriptionId) : null,
    customerId: data.lemonSqueezyCustomerId ? String(data.lemonSqueezyCustomerId) : null,
    aiReplyLimit:
      data.aiReplyLimit ?? (plan === "enterprise" ? Infinity : plan === "pro" ? PRO_AI_REPLY_LIMIT : 0),
  };
}

const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));

/** Each figure loads on its own, so one failing (say, an index still building) leaves the rest. */
export async function fetchOverview(): Promise<Overview> {
  const users = collection(db, "users");
  const bots = collection(db, "chatbot_configs");
  const count = (q: Parameters<typeof getCountFromServer>[0]) =>
    getCountFromServer(q).then((s) => s.data().count);

  const results = await Promise.allSettled([
    count(users),
    count(query(users, where("createdAt", ">=", daysAgo(7)))),
    count(query(users, where("createdAt", ">=", daysAgo(30)))),
    count(query(users, where("plan", "in", ["pro", "enterprise"]))),
    count(query(users, where("suspended", "==", true))),
    count(bots),
    count(query(bots, where("aiEnabled", "==", true))),
    getAggregateFromServer(query(collection(db, "ai_usage"), where("month", "==", currentUsageMonth())), {
      replies: sum("replies"),
    }).then((s) => s.data().replies ?? 0),
  ]);
  results.forEach((r) => r.status === "rejected" && console.warn("Admin overview figure failed:", r.reason));
  const [accounts, signups7d, signups30d, paid, suspended, chatbots, aiChatbots, aiRepliesThisMonth] = results.map(
    (r) => (r.status === "fulfilled" ? r.value : null)
  );
  return { accounts, signups7d, signups30d, paid, suspended, chatbots, aiChatbots, aiRepliesThisMonth };
}

export async function fetchUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? toAdminUser(snap.id, snap.data()) : null;
}

export async function fetchTopUsage(max = 8): Promise<UsageRow[]> {
  const snap = await getDocs(
    query(collection(db, "ai_usage"), where("month", "==", currentUsageMonth()), orderBy("replies", "desc"), limit(max))
  );
  return Promise.all(
    snap.docs.map(async (d) => {
      const uid = String(d.data().uid || d.id.split("_")[0]);
      return { uid, replies: Number(d.data().replies) || 0, user: await fetchUser(uid).catch(() => null) };
    })
  );
}

/**
 * A page of accounts, newest first, or matching an email prefix when searching.
 * Accounts created before sign-up dates were recorded only show up in search.
 */
export async function fetchUsers(search: string, after?: QueryDocumentSnapshot | null) {
  const users = collection(db, "users");
  const term = search.trim().toLowerCase();
  const base = term
    ? query(users, where("email", ">=", term), where("email", "<=", `${term}`), orderBy("email"))
    : query(users, orderBy("createdAt", "desc"));
  const snap = await getDocs(after ? query(base, startAfter(after), limit(PAGE_SIZE)) : query(base, limit(PAGE_SIZE)));
  return {
    users: snap.docs.map((d) => toAdminUser(d.id, d.data())),
    last: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.size === PAGE_SIZE,
  };
}

export async function fetchAccountDetail(uid: string) {
  const [botsSnap, usageSnap] = await Promise.all([
    getDocs(query(collection(db, "chatbot_configs"), where("user_id", "==", uid))),
    getDoc(doc(db, "ai_usage", `${uid}_${currentUsageMonth()}`)),
  ]);
  const chatbots: AdminChatbot[] = botsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || "Untitled",
      title: data.title || "",
      aiEnabled: data.aiEnabled === true,
      suspended: data.suspended === true,
      faqCount: Array.isArray(data.faqData) ? data.faqData.length : 0,
      lastUpdated: toDate(data.lastUpdated),
    };
  });
  return { chatbots, aiReplies: usageSnap.exists() ? Number(usageSnap.data().replies) || 0 : 0 };
}

export async function fetchLog(max = 10): Promise<LogEntry[]> {
  const snap = await getDocs(query(collection(db, "admin_log"), orderBy("at", "desc"), limit(max)));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      action: data.action,
      targetEmail: data.targetEmail ?? null,
      adminEmail: data.adminEmail ?? null,
      reason: data.reason ?? null,
      at: toDate(data.at),
    };
  });
}
