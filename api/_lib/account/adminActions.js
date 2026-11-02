import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "../auth.js";
import { adminAuth, adminDb } from "../firebaseAdmin.js";
import { cancelAccountSubscription } from "../billing/cancelSubscription.js";
import { GIFT_ENDED, GIFTED_PRO, buildAccessProfile } from "../plan.js";
import { sendError } from "../response.js";
import { deleteAccountData } from "./deleteAccount.js";

// Admin-only account actions. Being an admin is a Firebase custom claim
// (admin: true), set with scripts/set-admin.mjs; it is checked here on every
// request, never trusted from the browser.

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function requireAdmin(req) {
  const decoded = await requireUser(req);
  if (decoded.admin !== true) throw httpError(403, "Admins only.");
  return decoded;
}

/** The account an action targets, refusing admins (including yourself). */
async function targetAccount(admin, uid) {
  if (typeof uid !== "string" || !uid) throw httpError(400, "Which account? Send its uid.");
  if (uid === admin.uid) throw httpError(400, "You can't do this to your own account.");

  let authUser = null;
  try {
    authUser = await adminAuth.getUser(uid);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }
  if (authUser?.customClaims?.admin === true) throw httpError(400, "Admin accounts can't be changed here.");

  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!authUser && !userSnap.exists) throw httpError(404, "Account not found.");

  return { authUser, userRef: userSnap.ref, userData: userSnap.data() || {} };
}

async function setChatbotsSuspended(uid, suspended) {
  const snap = await adminDb.collection("chatbot_configs").where("user_id", "==", uid).get();
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = adminDb.batch();
    snap.docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, { suspended }));
    await batch.commit();
  }
  return snap.size;
}

async function logAction(admin, action, uid, email, details = {}) {
  await adminDb.collection("admin_log").add({
    action,
    targetUid: uid,
    targetEmail: email || null,
    adminUid: admin.uid,
    adminEmail: admin.email || null,
    ...details,
    at: FieldValue.serverTimestamp(),
  });
}

// A suspended owner can still sign in, see why, contact us, manage billing and
// delete their account; everything else is refused by the server and the
// Firestore rules, and their chatbots stop showing on their sites.
async function suspend(admin, body) {
  const { authUser, userRef, userData } = await targetAccount(admin, body.uid);
  // The Terms promise to tell them why, so the reason is shown to them.
  const reason = String(body.reason || "").trim().slice(0, 500);
  if (reason.length < 10) throw httpError(400, "Write the reason they'll see (at least 10 characters).");

  await userRef.set(
    { suspended: true, suspendedAt: FieldValue.serverTimestamp(), suspendedReason: reason },
    { merge: true }
  );
  const chatbots = await setChatbotsSuspended(body.uid, true);

  const email = authUser?.email || userData.email;
  await logAction(admin, "suspend", body.uid, email, { reason, chatbots });
  return { suspended: true, chatbots };
}

async function unsuspend(admin, body) {
  const { authUser, userRef, userData } = await targetAccount(admin, body.uid);

  // Older suspensions also disabled the login; make sure it's back on.
  if (authUser?.disabled) await adminAuth.updateUser(body.uid, { disabled: false });
  await userRef.set(
    { suspended: false, suspendedAt: FieldValue.delete(), suspendedReason: FieldValue.delete() },
    { merge: true }
  );
  const chatbots = await setChatbotsSuspended(body.uid, false);

  await logAction(admin, "unsuspend", body.uid, authUser?.email || userData.email, { chatbots });
  return { suspended: false, chatbots };
}

async function remove(admin, body) {
  const { authUser, userData } = await targetAccount(admin, body.uid);
  const email = String(authUser?.email || userData.email || "").toLowerCase();

  // The admin types the account's email to confirm, as owners do for themselves.
  if (!email || String(body.confirmEmail || "").trim().toLowerCase() !== email) {
    throw httpError(400, "Type the account's email exactly to confirm.");
  }

  const { chatbots } = await deleteAccountData(body.uid);
  await logAction(admin, "delete", body.uid, email, { chatbots });
  return { deleted: true, chatbots };
}

/** Longest gift, so a typo in the year can't hand out Pro forever. */
const MAX_GIFT_DAYS = 3 * 366;

/** "2027-01-31" means through the end of that day (UTC). */
export function giftEndDate(value, now = Date.now()) {
  const text = String(value || "").trim();
  const end = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T23:59:59.000Z` : text);
  if (!Number.isFinite(end) || end <= now) throw httpError(400, "Pick an end date in the future.");
  if (end > now + MAX_GIFT_DAYS * 86_400_000) throw httpError(400, "A gift can last up to 3 years.");
  return new Date(end).toISOString();
}

// Pro for free until a date, with no payment or subscription in Lemon Squeezy.
// Sending it again for a gifted account changes the end date.
async function gift(admin, body) {
  const { authUser, userRef, userData } = await targetAccount(admin, body.uid);
  const until = giftEndDate(body.until);
  const gifted = String(userData.subscriptionStatus || "").toLowerCase() === "gifted";
  if (!gifted && buildAccessProfile(userData).plan !== "free") {
    throw httpError(400, "They already have a paid plan, so there's nothing to gift.");
  }
  const note = String(body.note || "").trim().slice(0, 200);

  await userRef.set(
    {
      ...GIFTED_PRO,
      giftedUntil: until,
      giftNote: note || null,
      giftedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await logAction(admin, gifted ? "gift-extend" : "gift", body.uid, authUser?.email || userData.email, { until, note });
  return { gifted: true, until };
}

async function endGift(admin, body) {
  const { authUser, userRef, userData } = await targetAccount(admin, body.uid);
  if (String(userData.subscriptionStatus || "").toLowerCase() !== "gifted") {
    throw httpError(400, "This account doesn't have a gift.");
  }
  await userRef.set({ ...GIFT_ENDED, giftedAt: FieldValue.delete() }, { merge: true });
  await logAction(admin, "gift-end", body.uid, authUser?.email || userData.email);
  return { gifted: false };
}

// Cancels the account's subscription in Lemon Squeezy. `when: "now"` also ends
// Pro straight away, for example after a refund.
async function cancelSubscription(admin, body) {
  const { authUser, userRef, userData } = await targetAccount(admin, body.uid);
  const now = body.when === "now";
  const result = await cancelAccountSubscription(userRef, userData, { now });
  await logAction(admin, "cancel-subscription", body.uid, authUser?.email || userData.email, {
    when: now ? "now" : "period_end",
    until: now ? null : result.endsAt,
  });
  return result;
}

const ACTIONS = {
  suspend,
  unsuspend,
  delete: remove,
  gift,
  "end-gift": endGift,
  "cancel-subscription": cancelSubscription,
};

/** POST /api/account/admin-<suspend|unsuspend|delete|gift|end-gift|cancel-subscription> with { uid, ... }. */
export default async function adminAction(req, res, name) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const admin = await requireAdmin(req);
    const result = await ACTIONS[name](admin, req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Admin ${name} failed:`, error);
    return sendError(res, error);
  }
}
