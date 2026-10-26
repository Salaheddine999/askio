import React from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { LANGUAGES, type Lang } from "../i18n";
import { focusRing } from "../pages/dashboard/ui";

// Each language's name in English, shown beside its own name so it's easy to
// find whatever language the app is currently in.
const ENGLISH_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "French",
  nl: "Dutch",
  de: "German",
  es: "Spanish",
};

/** A language picker in the app's dropdown style (like the Analytics chatbot filter). */
const LanguageSelect: React.FC<{
  value: Lang;
  onChange: (lang: Lang) => void;
  id?: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}> = ({ value, onChange, id, label, size = "md", className = "" }) => {
  const current = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[0];
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        id={id}
        aria-label={label}
        className={`inline-flex w-full items-center gap-2 rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] pl-3 pr-2.5 text-left text-body-sm text-[#101723] transition-colors hover:border-[#B8C3D1] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5] dark:hover:border-[#39485B] ${
          size === "sm" ? "h-9" : "h-10"
        } ${focusRing} ${className}`}
      >
        <Languages size={15} className="shrink-0 text-[#647184] dark:text-[#87909D]" />
        <span className="min-w-0 flex-1 truncate">{current.label}</span>
        <ChevronDown size={15} className="ml-1 shrink-0 text-[#87909D]" />
      </ListboxButton>
      {/* Anchored and non-modal, like the other pickers, so the page doesn't lock or shift. */}
      <ListboxOptions
        anchor="bottom start"
        modal={false}
        transition
        className="z-50 w-[var(--button-width)] min-w-48 rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-1.5 shadow-xl transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-[#2B3646] dark:bg-[#1A2533]"
      >
        {LANGUAGES.map((l) => (
          <ListboxOption
            key={l.code}
            value={l.code}
            lang={l.code}
            className="group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-body-sm text-[#101723] data-[focus]:bg-[#F3F7FC] dark:text-[#D7DFE5] dark:data-[focus]:bg-[#273444]"
          >
            <span className="min-w-0 flex-1 truncate group-data-[selected]:font-medium">{l.label}</span>
            {l.label !== ENGLISH_NAMES[l.code] && (
              <span className="shrink-0 text-caption text-[#87909D]">{ENGLISH_NAMES[l.code]}</span>
            )}
            <Check size={14} className="invisible shrink-0 group-data-[selected]:visible" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
};

export default LanguageSelect;
