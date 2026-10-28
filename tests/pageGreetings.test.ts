import { describe, expect, it, vi } from "vitest";
import { pageGreetingFor } from "../src/utils/pageGreetings";

vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: {}, adminAuth: {} }));
const { normalizePageGreetings } = await import("../api/chatbots/save.js");

// Greetings for specific pages: "Questions about plans?" on /pricing.
const rules = [
  { match: "/pricing", message: "Questions about plans?" },
  { match: "/products", message: "Need help with sizing?" },
];

describe("pageGreetingFor", () => {
  it("picks the first rule whose text is in the page's path", () => {
    expect(pageGreetingFor(rules, "https://shop.example/pricing")?.message).toBe("Questions about plans?");
    expect(pageGreetingFor(rules, "https://shop.example/products/sofa")?.message).toBe("Need help with sizing?");
  });

  it("ignores the domain and letter case", () => {
    expect(pageGreetingFor([{ match: "shop", message: "Hi" }], "https://shop.example/")).toBeNull();
    expect(pageGreetingFor(rules, "https://shop.example/PRICING")?.message).toBe("Questions about plans?");
  });

  it("has nothing for other pages, or before the page is known", () => {
    expect(pageGreetingFor(rules, "https://shop.example/about")).toBeNull();
    expect(pageGreetingFor(rules, "")).toBeNull();
    expect(pageGreetingFor(undefined, "https://shop.example/pricing")).toBeNull();
  });
});

describe("normalizePageGreetings (saving a chatbot)", () => {
  it("keeps complete rules, trimmed and limited", () => {
    const saved = normalizePageGreetings([
      { match: " /Pricing ", message: " Questions about plans? " },
      { match: "/empty", message: "" },
      { match: "", message: "No page" },
      { match: "/long", message: "x".repeat(80) },
      "not a rule",
    ]);
    expect(saved).toEqual([
      { match: "/pricing", message: "Questions about plans?" },
      { match: "/long", message: "x".repeat(50) },
    ]);
  });

  it("keeps at most ten", () => {
    const many = Array.from({ length: 14 }, (_, i) => ({ match: `/p${i}`, message: "Hi" }));
    expect(normalizePageGreetings(many)).toHaveLength(10);
  });
});
