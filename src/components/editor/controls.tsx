import React from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { focusRing, surface } from "../../pages/dashboard/ui";
import { useT } from "../../i18n";
import { editorMessages } from "../../i18n/messages/editor";

// Form controls shared by the chatbot editor's tabs, in the Settings page's style.

export const inputClass =
  "w-full rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] px-3 text-body-sm text-[#101723] placeholder:text-[#87909D] transition-colors focus:border-[#101723] focus:outline-none focus:ring-2 focus:ring-[#101723]/10 disabled:opacity-60 dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5] dark:placeholder:text-[#647184] dark:focus:border-[#9BAABD] dark:focus:ring-[#D7DFE5]/10";

export const invalidInput =
  "border-red-300 focus:border-red-500 focus:ring-red-500/15 dark:border-red-900/70 dark:focus:border-red-500";

/** A titled card; its rows are separated by hairlines. */
export const Panel: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, action, children }) => (
  <section className={surface}>
    <div className="flex items-start justify-between gap-4 border-b border-[#E7EDF6] px-5 py-4 sm:px-6 dark:border-[#2B3646]">
      <div className="min-w-0">
        <h2 className="text-body font-semibold text-[#101723] dark:text-[#E7EDF6]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">{description}</p>
        )}
      </div>
      {action}
    </div>
    <div className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">{children}</div>
  </section>
);

export const PanelBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <div className={`px-5 py-5 sm:px-6 ${className}`}>{children}</div>;

export const Field: React.FC<{
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | null;
  counter?: { value: number; max: number };
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, error, counter, children }) => (
  <div className="min-w-0">
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-label text-[#101723] dark:text-[#D7DFE5]">
        {label}
      </label>
      {counter && counter.value > counter.max * 0.8 && (
        <span className="text-caption tabular-nums text-[#87909D]">
          {counter.value}/{counter.max}
        </span>
      )}
    </div>
    {children}
    {error ? (
      <p role="alert" className="mt-1.5 text-caption text-red-600 dark:text-red-400">
        {error}
      </p>
    ) : (
      hint && <p className="mt-1.5 text-caption text-[#647184] dark:text-[#87909D]">{hint}</p>
    )}
  </div>
);

export const Switch: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${
      checked ? "bg-[#101723] dark:bg-[#D7DFE5]" : "bg-[#D8DFE9] dark:bg-[#39485B]"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-[#F9FCFF] shadow-sm transition-transform dark:bg-[#141D2B] ${
        checked ? "translate-x-[21px]" : "translate-x-[3px]"
      }`}
    />
  </button>
);

/** A label and hint on the left, a control on the right. */
export const Row: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div className="flex items-center justify-between gap-6 px-5 py-4 sm:px-6">
    <div className="min-w-0">
      <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{label}</p>
      {hint && <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">{hint}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">{children}</div>
  </div>
);

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] p-0.5 dark:border-[#2B3646] dark:bg-[#141D2B]"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`h-7 rounded-md px-3 text-caption font-medium transition-colors ${focusRing} ${
              selected
                ? "bg-[#F9FCFF] text-[#101723] shadow-[0_1px_2px_rgba(16,23,35,0.08)] dark:bg-[#273444] dark:text-[#E7EDF6]"
                : "text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A swatch that opens a picker; shows the hex beside it. */
export const ColorField: React.FC<{
  label: string;
  hint?: string;
  color: string;
  onChange: (color: string) => void;
}> = ({ label, hint, color, onChange }) => {
  const t = useT(editorMessages);
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-label text-[#101723] dark:text-[#D7DFE5]">{label}</p>
      <Popover>
        <PopoverButton
          className={`flex h-10 w-full items-center gap-2.5 rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] pl-1.5 pr-3 text-left transition-colors hover:border-[#9BAABD] dark:border-[#2B3646] dark:bg-[#141D2B] dark:hover:border-[#566273] ${focusRing}`}
        >
          <span
            className="h-7 w-7 shrink-0 rounded-md ring-1 ring-inset ring-black/10 dark:ring-white/10"
            style={{ background: color }}
          />
          <span className="font-mono text-body-sm uppercase text-[#101723] dark:text-[#D7DFE5]">{color}</span>
        </PopoverButton>
        <PopoverPanel
          anchor={{ to: "bottom start", gap: 6 }}
          className="z-50 w-[232px] rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-3 shadow-[0_12px_32px_-12px_rgba(16,23,35,0.35)] dark:border-[#2B3646] dark:bg-[#1A2533]"
        >
          <HexColorPicker color={color} onChange={onChange} style={{ width: "100%", height: 160 }} />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-caption text-[#647184] dark:text-[#87909D]">{t("hex")}</span>
            <HexColorInput
              color={color}
              onChange={onChange}
              prefixed
              aria-label={t("hexValue", { label })}
              className={`${inputClass} h-8 font-mono uppercase`}
            />
          </div>
        </PopoverPanel>
      </Popover>
      {hint && <p className="mt-1.5 text-caption text-[#647184] dark:text-[#87909D]">{hint}</p>}
    </div>
  );
};
