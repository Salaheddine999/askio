import deleteOwnAccount from "../_lib/account/deleteAccount.js";
import adminAction from "../_lib/account/adminActions.js";
import liveChat from "../_lib/account/liveChat.js";
import sendInstallEmail from "../_lib/account/installEmail.js";
import { emailUnsubscribe } from "../_lib/email/alerts.js";
import { withMonitoring } from "../_lib/monitoring.js";

// Account endpoints share one function to stay within Vercel's function limit:
//   POST /api/account/delete            the signed-in user deletes their own account
//   POST /api/account/admin-suspend     admin only: block an account and its chatbots
//   POST /api/account/admin-unsuspend   admin only: restore it
//   POST /api/account/admin-delete      admin only: delete an account and its data
//   POST /api/account/live-reply        reply to a visitor who asked for a person
//   POST /api/account/live-end          end that live chat
//   GET|POST /api/account/email-unsubscribe   the signed link in alert emails
//   POST /api/account/install-email     send the install code to the owner's developer
const HANDLERS = {
  delete: deleteOwnAccount,
  "admin-suspend": (req, res) => adminAction(req, res, "suspend"),
  "admin-unsuspend": (req, res) => adminAction(req, res, "unsuspend"),
  "admin-delete": (req, res) => adminAction(req, res, "delete"),
  "live-reply": (req, res) => liveChat(req, res, "reply"),
  "live-end": (req, res) => liveChat(req, res, "end"),
  "email-unsubscribe": emailUnsubscribe,
  "install-email": sendInstallEmail,
};

function handler(req, res) {
  const route = HANDLERS[req.query.action];
  if (!route) return res.status(404).json({ error: "Not found." });
  return route(req, res);
}

export default withMonitoring("account", handler);
