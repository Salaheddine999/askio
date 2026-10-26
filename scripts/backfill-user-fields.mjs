// One-time backfill: gives older user profiles the fields newer sign-ups get,
// so the admin page's Free/Paid filters, counts and newest-first list include
// them. Firestore queries skip documents that are missing the queried field.
//
//   node --env-file=.env scripts/backfill-user-fields.mjs --dry-run
//   node --env-file=.env scripts/backfill-user-fields.mjs
//
// Sets plan (from the legacy isPro flag), subscriptionStatus and createdAt
// (from the sign-in account's creation time). Only fills missing fields, so
// it's safe to run again.
import { adminAuth, adminDb } from "../api/_lib/firebaseAdmin.js";

const BATCH_LIMIT = 400;
const dryRun = process.argv.includes("--dry-run");

const snap = await adminDb.collection("users").get();
let batch = adminDb.batch();
let pending = 0;
let updated = 0;
const fieldCounts = {};

for (const doc of snap.docs) {
  const data = doc.data();
  const patch = {};
  if (!data.plan) patch.plan = data.isPro ? "pro" : "free";
  if (!data.subscriptionStatus) patch.subscriptionStatus = (patch.plan || data.plan) === "free" ? "inactive" : "active";
  if (!data.createdAt) {
    const created = await adminAuth
      .getUser(doc.id)
      .then((u) => u.metadata.creationTime)
      .catch(() => null);
    if (created) patch.createdAt = new Date(created);
  }
  if (!Object.keys(patch).length) continue;

  for (const key of Object.keys(patch)) fieldCounts[key] = (fieldCounts[key] || 0) + 1;
  updated += 1;
  if (dryRun) continue;
  batch.update(doc.ref, patch);
  pending += 1;
  if (pending >= BATCH_LIMIT) {
    await batch.commit();
    batch = adminDb.batch();
    pending = 0;
  }
}
if (!dryRun && pending) await batch.commit();

console.log(
  `${dryRun ? "[dry run] would update" : "Updated"} ${updated} of ${snap.size} profiles.`,
  Object.keys(fieldCounts).length ? fieldCounts : ""
);
