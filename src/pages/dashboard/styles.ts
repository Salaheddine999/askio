// Shared class recipes so every dashboard surface and control reads the same.
// Kept in their own file (no React or Headless UI) so anything, even the
// app-wide error screen, can use them without pulling in the dashboard.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#101723]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3F7FC] dark:focus-visible:ring-[#D7DFE5]/40 dark:focus-visible:ring-offset-[#141D2B]";

export const surface =
  "rounded-xl border border-[#D8DFE9] dark:border-[#2B3646] bg-[#F9FCFF] dark:bg-[#1A2533] shadow-[0_1px_2px_rgba(16,23,35,0.04)]";

export const primaryButton = `inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-button bg-[#101723] text-white hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6] shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

export const secondaryButton = `inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg text-button border border-[#D8DFE9] bg-[#F9FCFF] text-[#566273] hover:bg-[#F3F7FC] hover:text-[#101723] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;
