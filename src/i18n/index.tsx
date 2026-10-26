import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "date-fns";
import { de, enUS, es, fr, nl } from "date-fns/locale";

// A small translation setup. Each area of the app keeps its text in one
// messages file with every language side by side (see defineMessages), and
// components read it with useT(messages). English is the source; the type
// checker fails if another language is missing a line.

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "nl", label: "Nederlands" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

export const isLang = (value: unknown): value is Lang => LANGUAGES.some((l) => l.code === value);

type Translations<T extends Record<string, string>> = { [K in keyof T]: string };

/** English plus every other language, each with exactly the same keys. */
export type Messages<T extends Record<string, string>> = { en: T } & {
  [L in Exclude<Lang, "en">]: Translations<T>;
};

export function defineMessages<T extends Record<string, string>>(messages: Messages<T>) {
  return messages;
}

type Vars = Record<string, string | number>;

const interpolate = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : text;

export interface TFunction<K extends string> {
  (key: K, vars?: Vars): string;
  /**
   * Picks "<base>_one" or "<base>_other" for a count, which is also passed
   * to the text as {count}.
   */
  plural: (base: string, count: number, vars?: Vars) => string;
  lang: Lang;
}

/** A translate function for one messages file, outside React (e.g. the widget). */
export function makeT<T extends Record<string, string>>(messages: Messages<T>, lang: Lang): TFunction<Extract<keyof T, string>> {
  const table = (messages[lang] || messages.en) as Record<string, string>;
  const english = messages.en as Record<string, string>;
  const lookup = (key: string) => table[key] ?? english[key] ?? key;
  const rules = new Intl.PluralRules(lang);
  const t = ((key: string, vars?: Vars) => interpolate(lookup(key), vars)) as unknown as TFunction<Extract<keyof T, string>>;
  t.plural = (base, count, vars) => {
    const form = rules.select(count) === "one" ? "one" : "other";
    return interpolate(lookup(`${base}_${form}`), { count: count.toLocaleString(lang), ...vars });
  };
  t.lang = lang;
  return t;
}

const DATE_LOCALES: Record<Lang, Locale> = { en: enUS, fr, nl, de, es };

/** The date-fns locale for formatting dates in a language. */
export const dateLocale = (lang: Lang) => DATE_LOCALES[lang];

const STORAGE_KEY = "askio_lang";

function detectLanguage(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage can be blocked; fall back to the browser's language.
  }
  for (const tag of navigator.languages || [navigator.language]) {
    const code = String(tag || "").slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return "en";
}

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageState>({ lang: "en", setLang: () => undefined });

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered across visits; it still applies now.
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

/** The app's language and a way to change it (Settings has the picker). */
export const useLanguage = () => useContext(LanguageContext);

/** Translations from one messages file, in the app's current language. */
export function useT<T extends Record<string, string>>(messages: Messages<T>) {
  const { lang } = useLanguage();
  return useMemo(() => makeT(messages, lang), [messages, lang]);
}
