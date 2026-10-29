import { describe, expect, it, vi } from "vitest";

vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: {}, adminAuth: {} }));
const { normalizeKioStyle } = await import("../api/chatbots/save.js");

// Kio's personality and finish come from the editor, so the server keeps
// only the known values and falls back to today's look.
describe("normalizeKioStyle", () => {
  it("keeps the known personalities and finishes", () => {
    expect(normalizeKioStyle({ kioPersonality: "calm", kioFinish: "matte" })).toEqual({
      kioPersonality: "calm",
      kioFinish: "matte",
    });
    expect(normalizeKioStyle({ kioPersonality: "shy", kioFinish: "glossy" })).toEqual({
      kioPersonality: "shy",
      kioFinish: "glossy",
    });
  });

  it("falls back to lively and glossy for anything else", () => {
    expect(normalizeKioStyle({})).toEqual({ kioPersonality: "lively", kioFinish: "glossy" });
    expect(normalizeKioStyle({ kioPersonality: "angry", kioFinish: "<script>" })).toEqual({
      kioPersonality: "lively",
      kioFinish: "glossy",
    });
    expect(normalizeKioStyle({ kioPersonality: ["calm"], kioFinish: { matte: true } })).toEqual({
      kioPersonality: "lively",
      kioFinish: "glossy",
    });
  });
});
