// Shared homepage call-to-action styles. Hover only shifts the colour; pressing
// gives a small, quick press-in. No lifting or growing shadows.

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87909D]";

const press = "active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

// The main button (MainCta); its icon sits in a chip on the right (ctaChip).
export const primaryCta = `group inline-flex h-[52px] items-center justify-center gap-3 rounded-full bg-[#101723] pl-6 pr-2 text-button sm:pl-7 font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(16,23,35,0.18)] ring-1 ring-inset ring-[#101723] transition-[background-color,transform] duration-150 ease-out hover:bg-[#1F2A3A] active:bg-[#0B111B] dark:bg-[#E7EDF6] dark:text-[#101723] dark:shadow-[inset_0_-1px_0_rgba(16,23,35,0.1)] dark:ring-[#E7EDF6] dark:hover:bg-white dark:active:bg-[#D7DFE5] ${focus} ${press}`;

export const ghostCta = `inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-body-sm font-medium text-[#566273] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#E7EDF6]/70 hover:text-[#101723] active:bg-[#E7EDF6] dark:text-[#9BAABD] dark:hover:bg-[#243040]/70 dark:hover:text-[#D7DFE5] dark:active:bg-[#243040] ${focus} ${press}`;

/** The round chip on a main button's right, clipping the icons that slide through it (see ArrowBubble). */
export const ctaChip = "relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full";

/** Small round icon buttons (carousel arrows, back to top). */
export const iconPress = `transition-[background-color,color,transform] duration-150 ease-out ${press}`;
