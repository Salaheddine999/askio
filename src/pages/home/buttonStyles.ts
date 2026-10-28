// Shared homepage call-to-action styles. Hover only shifts the colour; pressing
// gives a small, quick press-in. No lifting or growing shadows.

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-425";

const press = "active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

// The main button (MainCta); its icon sits in a chip on the right (ctaChip).
export const primaryCta = `group inline-flex h-[52px] items-center justify-center gap-3 rounded-full bg-ink-900 pl-6 pr-2 text-button sm:pl-7 font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(16,23,35,0.18)] ring-1 ring-inset ring-ink-900 transition-[background-color,transform] duration-150 ease-out hover:bg-ink-830 active:bg-ink-925 dark:bg-ink-70 dark:text-ink-900 dark:shadow-[inset_0_-1px_0_rgba(16,23,35,0.1)] dark:ring-ink-70 dark:hover:bg-white dark:active:bg-ink-130 ${focus} ${press}`;

export const ghostCta = `inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-body-sm font-medium text-ink-605 transition-[background-color,color,transform] duration-150 ease-out hover:bg-ink-70/70 hover:text-ink-900 active:bg-ink-70 dark:text-ink-325 dark:hover:bg-ink-805/70 dark:hover:text-ink-130 dark:active:bg-ink-805 ${focus} ${press}`;

/** The round chip on a main button's right, clipping the icons that slide through it (see ArrowBubble). */
export const ctaChip = "relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full";

/** Small round icon buttons (the testimonial arrows). */
export const iconPress = `transition-[background-color,color,transform] duration-150 ease-out ${press}`;
