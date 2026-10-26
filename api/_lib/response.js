import { reportError } from "./monitoring.js";

/** Sends an error as JSON. Unexpected (5xx) errors are also reported to Sentry. */
export function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) reportError(error, { status: statusCode });
  return res.status(statusCode).json({ error: error.message || "Request failed." });
}
