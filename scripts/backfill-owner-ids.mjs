// One-time backfill: adds ownerId to existing leads, analytics_events and
// unanswered_queries, so owners keep seeing them under the owner-only rules.
// Run it BEFORE publishing those rules:
//
//   node --env-file=.env scripts/backfill-owner-ids.mjs --dry-run
//   node --env-file=.env scripts/backfill-owner-ids.mjs
//
// Safe to run again: records that already have an ownerId are skipped.
import { adminDb } from "../api/_lib/firebaseAdmin.js";

const COLLECTIONS = ["leads", "analytics_events", "unanswered_queries"];
const BATCH_LIMIT = 400;
const dryRun = process.argv.includes("--dry-run");

const owners = new Map();
async function ownerOf(chatbotId) {
  if (!chatbotId) return null;
  if (!owners.has(chatbotId)) {
    const snap = await adminDb.collection("chatbot_configs").doc(chatbotId).get();
    owners.set(chatbotId, snap.exists ? snap.data().user_id || null : null);
  }
  return owners.get(chatbotId);
}

for (const name of COLLECTIONS) {
  const snap = await adminDb.collection(name).get();
  let updated = 0;
  let alreadySet = 0;
  let orphaned = 0;
  let batch = adminDb.batch();
  let pending = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.ownerId) {
      alreadySet += 1;
      continue;
    }
    const ownerId = await ownerOf(data.chatbotId);
    if (!ownerId) {
      // Its chatbot is gone; with no owner it stays hidden, as it should.
      orphaned += 1;
      continue;
    }
    updated += 1;
    if (dryRun) continue;
    batch.update(doc.ref, { ownerId });
    pending += 1;
    if (pending === BATCH_LIMIT) {
      await batch.commit();
      batch = adminDb.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();

  console.log(
    `${name}: ${dryRun ? "would update" : "updated"} ${updated}, already set ${alreadySet}, no owner ${orphaned} (of ${snap.size})`
  );
}

if (dryRun) console.log("Dry run: nothing was written.");
