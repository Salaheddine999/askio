import { reportError } from "./monitoring.js";

/**
 * Sends an error as JSON. Server errors (5xx) are also reported to Sentry,
 * unless marked `expected` (like the AI being briefly out of quota).
 */
export function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500 && !error.expected) reportError(error, { status: statusCode });
  // Errors raised on purpose carry a statusCode and a message meant for the
  // user. Anything else is unexpected (a library, Firebase or config error),
  // and its text stays in the logs.
  const message = error.statusCode ? error.message : "";
  return res.status(statusCode).json({ error: message || "Something went wrong. Please try again." });
}
