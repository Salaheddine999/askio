import { describe, expect, it } from "vitest";
import { sourceQuestions } from "../api/_lib/ai.js";

// "Answered from: …" under AI replies: the FAQ entry numbers the model
// returns become the FAQ questions shown to visitors.
const faqs = [
  { question: "Do you ship to Belgium?", answer: "Yes, in 2-3 days." },
  { question: "What does shipping cost?", answer: "€4.95, free above €50." },
  { question: "Can I return an order?", answer: "Within 30 days." },
];

describe("answer sources", () => {
  it("maps entry numbers to their questions, most relevant first", () => {
    expect(sourceQuestions([2, 1], faqs)).toEqual(["What does shipping cost?", "Do you ship to Belgium?"]);
  });

  it("keeps at most two, without repeats", () => {
    expect(sourceQuestions([3, 3, 1, 2], faqs)).toEqual(["Can I return an order?", "Do you ship to Belgium?"]);
  });

  it("ignores numbers that aren't FAQ entries", () => {
    expect(sourceQuestions([0, 4, -1, 1.5, "2"], faqs)).toEqual([]);
    expect(sourceQuestions(undefined, faqs)).toEqual([]);
  });
});
