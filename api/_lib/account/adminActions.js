import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "../auth.js";
import { adminAuth, adminDb } from "../firebaseAdmin.js";
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

async function suspend(admin, body) {
  const { authUser, userRef, userData } = await targetAccount(admin, body.uid);
  const reason = String(body.reason || "").trim().slice(0, 500) || null;

  // Disabling the login also ends their sessions at the next token check.
  if (authUser) {
    await adminAuth.updateUser(body.uid, { disabled: true });
    await adminAuth.revokeRefreshTokens(body.uid);
  }
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

  if (authUser) await adminAuth.updateUser(body.uid, { disabled: false });
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

const ACTIONS = { suspend, unsuspend, delete: remove };

/** POST /api/account/admin-<suspend|unsuspend|delete> with { uid, ... }. */
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
