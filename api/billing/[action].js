import createCheckout from "../_lib/billing/createCheckout.js";
import customerPortal from "../_lib/billing/customerPortal.js";

// Billing endpoints share one function to stay within Vercel's function limit:
//   POST /api/billing/create-checkout
//   POST /api/billing/customer-portal
const HANDLERS = {
  "create-checkout": createCheckout,
  "customer-portal": customerPortal,
};

export default function handler(req, res) {
  const route = HANDLERS[req.query.action];
  if (!route) return res.status(404).json({ error: "Not found." });
  return route(req, res);
}
