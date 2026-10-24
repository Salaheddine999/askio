// Gives an account access to the admin dashboard (/admin), or takes it away.
// Admin is a Firebase custom claim, so only someone with the service account
// (you, running this locally) can grant it.
//
//   node --env-file=.env scripts/set-admin.mjs you@example.com
//   node --env-file=.env scripts/set-admin.mjs you@example.com --remove
//
// Sign out and back in afterwards (or wait up to an hour) for it to apply.
import { adminAuth } from "../api/_lib/firebaseAdmin.js";

const email = process.argv[2];
const remove = process.argv.includes("--remove");

if (!email || email.startsWith("--")) {
  console.error("Usage: node --env-file=.env scripts/set-admin.mjs <email> [--remove]");
  process.exit(1);
}

const user = await adminAuth.getUserByEmail(email);
const claims = { ...(user.customClaims || {}) };
if (remove) delete claims.admin;
else claims.admin = true;

await adminAuth.setCustomUserClaims(user.uid, claims);
console.log(`${email} (${user.uid}) is ${remove ? "no longer an admin" : "now an admin"}.`);
