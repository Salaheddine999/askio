import { isChunkLoadError } from "./lazyPage";

// Error reporting for the app and the chat widget (which runs inside the same
// app at /chatbot/:id). It does nothing until VITE_SENTRY_DSN is set. Sentry is
// loaded after the page is idle so it never slows the first load; errors
// reported before then are queued.
//
// Privacy: no visitor messages or emails are sent. Console breadcrumbs (which
// can contain them) are dropped, and in the app owners are identified only by
// their user id.

type SentryModule = typeof import("@sentry/react");

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
let sentry: SentryModule | null = null;
let pendingUser: string | null | undefined;
const queue: { error: unknown; tags?: Record<string, string> }[] = [];

const isWidget = () => window.location.pathname.startsWith("/chatbot/");

export function startMonitoring() {
  if (!dsn) return;
  const load = () =>
    import("@sentry/react")
      .then((S) => {
        S.init({
          dsn,
          environment: import.meta.env.MODE,
          release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
          sendDefaultPii: false,
          tracesSampleRate: 0,
          ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection captured"],
          beforeBreadcrumb: (breadcrumb) => (breadcrumb.category === "console" ? null : breadcrumb),
          beforeSend(event, hint) {
            // A page file missing after a deploy reloads the page by itself.
            if (isChunkLoadError(hint?.originalException)) return null;
            return event;
          },
          initialScope: { tags: { surface: isWidget() ? "widget" : "app" } },
        });
        sentry = S;
        if (pendingUser !== undefined) S.setUser(pendingUser ? { id: pendingUser } : null);
        for (const { error, tags } of queue.splice(0)) S.captureException(error, { tags });
      })
      .catch(() => undefined);
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback;
  if (idle) idle(load, { timeout: 4000 });
  else window.setTimeout(load, 2000);
}

/** Report an error caught by the app (e.g. by the error screen). */
export function reportClientError(error: unknown, tags?: Record<string, string>) {
  if (!dsn) return;
  if (sentry) sentry.captureException(error, { tags });
  else if (queue.length < 20) queue.push({ error, tags });
}

/** Attach the signed-in owner's user id (never their email) to reports. */
export function setMonitoringUser(uid: string | null) {
  if (!dsn || isWidget()) return;
  if (sentry) sentry.setUser(uid ? { id: uid } : null);
  else pendingUser = uid;
}
