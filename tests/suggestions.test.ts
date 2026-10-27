import { describe, expect, it, vi } from "vitest";
import { pickSuggested } from "../src/utils/suggestions";

vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: {}, adminAuth: {} }));
const { normalizeFaqData } = await import("../api/chatbots/save.js");

const faq = (question: string, suggested?: boolean) => ({ question, answer: "A", ...(suggested ? { suggested } : {}) });

describe("pickSuggested (which questions the widget suggests first)", () => {
  it("takes the first three when none are starred", () => {
    expect(pickSuggested([faq("a"), faq("b"), faq("c"), faq("d")]).map((f) => f.question)).toEqual(["a", "b", "c"]);
  });

  it("takes only the starred ones, in list order", () => {
    expect(pickSuggested([faq("a"), faq("b", true), faq("c"), faq("d", true)]).map((f) => f.question)).toEqual(["b", "d"]);
  });
});

describe("normalizeFaqData (saving a chatbot)", () => {
  it("keeps stars, at most three, and drops unknown fields", () => {
    const saved = normalizeFaqData([
      { ...faq("a", true), extra: "x" },
      faq("b", true),
      faq("c", true),
      faq("d", true),
      { question: "e", answer: "A", suggested: "yes" },
    ]);
    expect(saved).toEqual([
      { question: "a", answer: "A", suggested: true },
      { question: "b", answer: "A", suggested: true },
      { question: "c", answer: "A", suggested: true },
      { question: "d", answer: "A" },
      { question: "e", answer: "A" },
    ]);
  });
});
