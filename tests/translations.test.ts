import { describe, expect, it, vi } from "vitest";

// The i18n module syncs the language with the account through Firebase; the
// tests only need the text.
vi.mock("../src/utils/firebase", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: () => () => undefined }));

const { LANGUAGES, makeT } = await import("../src/i18n");
const { widgetMessages } = await import("../src/i18n/widget");
const { docsContent } = await import("../src/i18n/messages/docs-content");
const files = import.meta.glob("../src/i18n/messages/*.ts", { eager: true }) as Record<string, Record<string, unknown>>;

type Table = Record<string, string>;
type MessageSet = Record<string, Table>;

const isMessageSet = (value: unknown): value is MessageSet =>
  !!value && typeof value === "object" && "en" in value && "fr" in value && typeof (value as MessageSet).en === "object";

// Every messages object exported by every file, plus the widget's.
const sets: [string, MessageSet][] = [["widget", widgetMessages as unknown as MessageSet]];
for (const [path, mod] of Object.entries(files)) {
  for (const [name, value] of Object.entries(mod)) {
    if (isMessageSet(value) && typeof Object.values(value.en)[0] === "string") sets.push([`${path.split("/").pop()} ${name}`, value]);
  }
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const codes = LANGUAGES.map((l) => l.code);

describe("translations", () => {
  it("found the messages files", () => {
    expect(sets.length).toBeGreaterThan(10);
  });

  describe.each(sets)("%s", (_name, set) => {
    const english = set.en;

    it.each(codes)("%s has exactly the English keys", (lang) => {
      // Languages with more plural forms than English (Polish, Arabic) may add
      // <base>_zero, _two, _few or _many next to a plural; nothing else.
      const extra = (key: string) => {
        const m = key.match(/^(.*)_(zero|two|few|many)$/);
        return !!m && `${m[1]}_other` in english;
      };
      expect(Object.keys(set[lang]).filter((key) => !extra(key)).sort()).toEqual(Object.keys(english).sort());
    });

    it.each(codes)("%s keeps every {placeholder} in its extra plural forms", (lang) => {
      for (const [key, text] of Object.entries(set[lang])) {
        const m = key.match(/^(.*)_(zero|two|few|many)$/);
        if (m && `${m[1]}_other` in english) expect(placeholders(text), `${lang}.${key}`).toEqual(placeholders(english[`${m[1]}_other`]));
      }
    });

    it.each(codes)("%s keeps every {placeholder} and leaves no line empty", (lang) => {
      for (const [key, text] of Object.entries(english)) {
        const translated = set[lang][key];
        expect(translated, `${lang}.${key}`).toBeTypeOf("string");
        // Some keys are deliberately empty in English too (text around a bold word).
        if (text.trim()) expect(translated.trim(), `${lang}.${key} is empty`).not.toBe("");
        expect(placeholders(translated), `${lang}.${key}`).toEqual(placeholders(text));
      }
    });

    it("has both plural forms for every plural", () => {
      for (const key of Object.keys(english)) {
        if (key.endsWith("_one")) expect(english, key).toHaveProperty(key.replace(/_one$/, "_other"));
        if (key.endsWith("_other")) expect(english, key).toHaveProperty(key.replace(/_other$/, "_one"));
      }
    });
  });

  it("the docs have the same guides and the same number of steps in every language they're in", () => {
    const guides = Object.keys(docsContent.en.guides);
    // Languages without their own articles show the English ones.
    for (const lang of codes.filter((code) => code in docsContent)) {
      const content = docsContent[lang as keyof typeof docsContent]!;
      expect(Object.keys(content.guides).sort(), lang).toEqual([...guides].sort());
      for (const id of guides) {
        const g = id as keyof typeof content.guides;
        expect(content.guides[g].steps.length, `${lang} ${id}`).toBe(docsContent.en.guides[g].steps.length);
      }
      expect(content.faqs.length, `${lang} troubleshooting`).toBe(docsContent.en.faqs.length);
    }
  });
});

describe("makeT", () => {
  const messages = {
    en: { hello: "Hi {name}", items_one: "{count} item", items_other: "{count} items" },
    fr: { hello: "Bonjour {name}", items_one: "{count} élément", items_other: "{count} éléments" },
    nl: { hello: "Hoi {name}", items_one: "{count} item", items_other: "{count} items" },
    de: { hello: "Hallo {name}", items_one: "{count} Element", items_other: "{count} Elemente" },
    es: { hello: "Hola {name}", items_one: "{count} elemento", items_other: "{count} elementos" },
  };

  it("fills in placeholders", () => {
    expect(makeT(messages, "fr")("hello", { name: "Sara" })).toBe("Bonjour Sara");
  });

  it("uses a language's extra plural forms when it has them", () => {
    const polish = {
      ...messages,
      pl: { hello: "Cześć {name}", items_one: "{count} element", items_few: "{count} elementy", items_many: "{count} elementów", items_other: "{count} elementu" },
    };
    const t = makeT(polish as never, "pl" as never);
    expect(t.plural("items", 1)).toBe("1 element");
    expect(t.plural("items", 3)).toBe("3 elementy");
    expect(t.plural("items", 5)).toBe("5 elementów");
    expect(t.plural("items", 22)).toBe("22 elementy");
  });

  it("picks the plural form for the language", () => {
    const t = makeT(messages, "en");
    expect(t.plural("items", 1)).toBe("1 item");
    expect(t.plural("items", 3)).toBe("3 items");
    // French treats 0 as singular.
    expect(makeT(messages, "fr").plural("items", 0)).toBe("0 élément");
  });

  it("formats numbers for the language", () => {
    expect(makeT(messages, "de").plural("items", 1500)).toBe("1.500 Elemente");
  });
});
