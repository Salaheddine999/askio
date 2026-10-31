import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "date-fns";
import { ar, de, enUS, es, fr, it, nl, pl, ptBR } from "date-fns/locale";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebase";

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
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "pl", label: "Polski" },
  { code: "ar", label: "العربية" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

export const isLang = (value: unknown): value is Lang => LANGUAGES.some((l) => l.code === value);

// Languages like Polish and Arabic have more plural forms than English's one
// and other; they may add <base>_zero, _two, _few or _many next to a plural.
type ExtraPlurals = { [K in `${string}_${"zero" | "two" | "few" | "many"}`]?: string };
type Translations<T extends Record<string, string>> = { [K in keyof T]: string } & ExtraPlurals;

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
   * Picks the language's plural form for a count, "<base>_one", "<base>_few"
   * and so on, falling back to "<base>_other"; the count is also passed to the
   * text as {count}.
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
    const form = rules.select(count);
    const key = table[`${base}_${form}`] !== undefined ? `${base}_${form}` : form === "one" ? `${base}_one` : `${base}_other`;
    return interpolate(lookup(key), { count: count.toLocaleString(lang), ...vars });
  };
  t.lang = lang;
  return t;
}

const DATE_LOCALES: Record<Lang, Locale> = { en: enUS, fr, nl, de, es, pt: ptBR, it, pl, ar };

/** The date-fns locale for formatting dates in a language. */
export const dateLocale = (lang: Lang) => DATE_LOCALES[lang];

/** Arabic reads right to left; every other language here left to right. */
export const dirFor = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");

// English-only pages currently open (see useLeftToRight); while any is, the
// page stays left to right (and, if they ask, English) whatever the app's language.
let leftToRightPages = 0;
let englishPages = 0;
const applyDir = (lang: Lang) => {
  document.documentElement.dir = leftToRightPages > 0 ? "ltr" : dirFor(lang);
  document.documentElement.lang = englishPages > 0 ? "en" : lang;
};

const STORAGE_KEY = "askio_lang";

function remember(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Not remembered in this browser; the account still has it.
  }
}

// Synced with the account (see accountLanguage.ts), loaded only when signed in.
const accountLanguage = () => import("./accountLanguage");

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

  // The page's language and reading direction. Pages that are only in English
  // (the homepage, legal pages) set dir="ltr" on themselves.
  useEffect(() => {
    applyDir(lang);
  }, [lang]);

  // On sign-in, the language saved on the account wins over this browser's.
  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (!user) return;
        accountLanguage()
          .then((m) => m.readAccountLanguage(user.uid))
          .then((saved) => {
            if (!saved) return;
            setLangState(saved);
            remember(saved);
          })
          .catch((error) => console.warn("Couldn't read the account language:", error));
      }),
    []
  );

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    remember(next);
    const user = auth.currentUser;
    if (user) {
      accountLanguage()
        .then((m) => m.saveAccountLanguage(user.uid, next))
        .catch((error) => console.warn("Couldn't save the account language:", error));
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

/**
 * For pages that are only in English (the homepage, legal pages, the chat
 * widget page): keeps the page left to right while they're open, whatever
 * the app's language.
 */
export function useLeftToRight({ english = false }: { english?: boolean } = {}) {
  const { lang } = useContext(LanguageContext);
  useEffect(() => {
    leftToRightPages++;
    if (english) englishPages++;
    applyDir(lang);
    return () => {
      leftToRightPages--;
      if (english) englishPages--;
      applyDir(lang);
    };
  }, [lang, english]);
}

/** The app's language and a way to change it (Settings has the picker). */
export const useLanguage = () => useContext(LanguageContext);

/** Translations from one messages file, in the app's current language. */
export function useT<T extends Record<string, string>>(messages: Messages<T>) {
  const { lang } = useLanguage();
  return useMemo(() => makeT(messages, lang), [messages, lang]);
}
