// Shared class recipes so every dashboard surface and control reads the same.
// Kept in their own file (no React or Headless UI) so anything, even the
// app-wide error screen, can use them without pulling in the dashboard.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-30 dark:focus-visible:ring-ink-130/40 dark:focus-visible:ring-offset-ink-875";

export const surface =
  "rounded-xl border border-ink-120 dark:border-ink-780 bg-ink-25 dark:bg-ink-850 shadow-[0_1px_2px_rgba(16,23,35,0.04)]";

export const primaryButton = `inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-button bg-ink-900 text-white hover:bg-ink-805 dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

export const secondaryButton = `inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg text-button border border-ink-120 bg-ink-25 text-ink-605 hover:bg-ink-30 hover:text-ink-900 dark:border-ink-780 dark:bg-ink-850 dark:text-ink-325 dark:hover:bg-ink-790 dark:hover:text-ink-130 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;
