import { motion } from "framer-motion";
import { YEARLY_SAVINGS_LABEL, type BillingInterval } from "../utils/pricing";

const OPTIONS: { value: BillingInterval; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function BillingToggle({
  value,
  onChange,
  layoutId = "billing-toggle-pill",
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
  /** Distinct per page so two toggles never share an animation. */
  layoutId?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className="inline-flex items-center rounded-full border border-[#D8DFE9] bg-[#F9FCFF] p-1 dark:border-[#2B3646] dark:bg-[#1A2533]"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            // The savings badge sits as evenly inset (6px) as the button sits in
            // the track, so its right end matches its top and bottom.
            className={`relative flex h-8 items-center gap-2 rounded-full text-sm font-medium leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87909D] ${
              option.value === "yearly" ? "pl-4 pr-1.5" : "px-4"
            }`}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-[#101723] dark:bg-[#D7DFE5]"
              />
            ) : null}
            <span
              className={`relative transition-colors duration-200 ${
                selected ? "text-white dark:text-[#141D2B]" : "text-[#566273] dark:text-[#9BAABD]"
              }`}
            >
              {option.label}
            </span>
            {option.value === "yearly" ? (
              <span
                className={`relative flex h-5 items-center rounded-full px-2 text-[11px] font-semibold leading-none transition-colors duration-200 ${
                  selected
                    ? "bg-[#4F9A63] text-white"
                    : "bg-[#EEF6F0] text-[#4F9A63] dark:bg-[#253128] dark:text-[#8FD19B]"
                }`}
              >
                {YEARLY_SAVINGS_LABEL}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
