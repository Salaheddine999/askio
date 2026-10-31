import { motion } from "framer-motion";
import { YEARLY_SAVINGS_LABEL, type BillingInterval } from "../utils/pricing";

const OPTIONS: BillingInterval[] = ["monthly", "yearly"];

/** The English text, which the homepage uses; app pages pass translations. */
const ENGLISH = { monthly: "Monthly", yearly: "Yearly", savings: YEARLY_SAVINGS_LABEL, group: "Billing period" };

export default function BillingToggle({
  value,
  onChange,
  layoutId = "billing-toggle-pill",
  labels = ENGLISH,
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
  /** Distinct per page so two toggles never share an animation. */
  layoutId?: string;
  labels?: typeof ENGLISH;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={labels.group}
      className="inline-flex items-center rounded-full border border-ink-120 bg-ink-25 p-1 dark:border-ink-780 dark:bg-ink-850"
    >
      {OPTIONS.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            // The savings badge sits as evenly inset (6px) as the button sits in
            // the track, so its right end matches its top and bottom.
            className={`relative flex h-8 items-center gap-2 rounded-full text-sm font-medium leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-425 ${
              option === "yearly" ? "ps-4 pe-1.5" : "px-4"
            }`}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-ink-900 dark:bg-ink-130"
              />
            ) : null}
            <span
              className={`relative transition-colors duration-200 ${
                selected ? "text-white dark:text-ink-875" : "text-fg-muted"
              }`}
            >
              {labels[option]}
            </span>
            {option === "yearly" ? (
              <span
                className={`relative flex h-5 items-center rounded-full px-2 text-caption font-semibold leading-none transition-colors duration-200 ${
                  selected
                    ? "bg-[#4F9A63] text-white"
                    : "bg-[#EEF6F0] text-[#4F9A63] dark:bg-[#253128] dark:text-[#8FD19B]"
                }`}
              >
                {labels.savings}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
