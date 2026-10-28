import React from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown, Languages } from "./icons";
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
        className={`inline-flex w-full items-center gap-2 rounded-lg border border-ink-120 bg-ink-25 pl-3 pr-2.5 text-left text-body-sm text-ink-900 transition-colors hover:border-ink-230 dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130 dark:hover:border-ink-710 ${
          size === "sm" ? "h-9" : "h-10"
        } ${focusRing} ${className}`}
      >
        <Languages size={15} className="shrink-0 text-fg-subtle" />
        <span className="min-w-0 flex-1 truncate">{current.label}</span>
        <ChevronDown size={15} className="ml-1 shrink-0 text-ink-425" />
      </ListboxButton>
      {/* Anchored and non-modal, like the other pickers, so the page doesn't lock or shift. */}
      <ListboxOptions
        anchor="bottom start"
        modal={false}
        transition
        className="z-50 w-[var(--button-width)] min-w-48 rounded-xl border border-ink-120 bg-ink-25 p-1.5 shadow-lg transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-ink-780 dark:bg-ink-850"
      >
        {LANGUAGES.map((l) => (
          <ListboxOption
            key={l.code}
            value={l.code}
            lang={l.code}
            className="group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-body-sm text-ink-900 data-[focus]:bg-ink-30 dark:text-ink-130 dark:data-[focus]:bg-ink-790"
          >
            <span className="min-w-0 flex-1 truncate group-data-[selected]:font-medium">{l.label}</span>
            {l.label !== ENGLISH_NAMES[l.code] && (
              <span className="shrink-0 text-caption text-ink-425">{ENGLISH_NAMES[l.code]}</span>
            )}
            <Check size={14} className="invisible shrink-0 group-data-[selected]:visible" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
};

export default LanguageSelect;
