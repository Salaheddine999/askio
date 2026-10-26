import * as Sentry from "@sentry/node";

// Error reporting for the API functions. It does nothing until SENTRY_DSN is
// set on Vercel. Reports carry no request bodies, IP addresses or visitor
// messages: only the error, the route and the environment.

let enabled = null;

function ensureInit() {
  if (enabled !== null) return enabled;
  const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
  enabled = Boolean(dsn);
  if (enabled) {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV || "development",
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      // Request data can contain visitor messages or emails; keep it out.
      beforeSend(event) {
        delete event.request;
        delete event.user;
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        // Console lines may include visitor text; HTTP calls are enough context.
        return breadcrumb.category === "console" ? null : breadcrumb;
      },
    });
  }
  return enabled;
}

/** Report an error that didn't crash the request (e.g. a caught 500). */
export function reportError(error, context = {}) {
  if (!ensureInit()) return;
  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) scope.setTag(key, String(value));
    Sentry.captureException(error);
  });
}

/**
 * Wraps an API function: anything it throws is reported and answered with a
 * generic 500, and reports are flushed before the function ends (Vercel can
 * freeze it right after the response).
 */
export function withMonitoring(route, handler) {
  return async function monitored(req, res) {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error(`Unhandled error in ${route}:`, error);
      reportError(error, { route });
      if (!res.headersSent) res.status(500).json({ error: "Request failed." });
    } finally {
      if (enabled) await Sentry.flush(2000).catch(() => undefined);
    }
  };
}
