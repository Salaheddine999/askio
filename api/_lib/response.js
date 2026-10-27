import { reportError } from "./monitoring.js";

/**
 * Sends an error as JSON. Server errors (5xx) are also reported to Sentry,
 * unless marked `expected` (like the AI being briefly out of quota).
 */
export function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500 && !error.expected) reportError(error, { status: statusCode });
  return res.status(statusCode).json({ error: error.message || "Request failed." });
}
