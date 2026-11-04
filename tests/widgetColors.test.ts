import { describe, expect, it } from "vitest";
import { needsDarkText } from "../src/utils/orbColors";

// The widget's header, buttons and visitor bubbles are painted in the owner's
// colors; their text has to stay readable whatever the owner picks.
describe("text on the owner's colors", () => {
  it.each(["#EDE6D6", "#FFFFFF", "#F59E0B", "#22C55E", "#FDE68A", "#fff"])("%s gets dark text", (color) => {
    expect(needsDarkText(color)).toBe(true);
  });

  it.each(["#101723", "#3B82F6", "#7C3AED", "#DC2626", "#0F766E", "#000"])("%s gets white text", (color) => {
    expect(needsDarkText(color)).toBe(false);
  });

  it("averages a gradient's colors", () => {
    expect(needsDarkText("linear-gradient(135deg, #FDE68A, #FCD34D)")).toBe(true);
    expect(needsDarkText("linear-gradient(135deg, #3B82F6, #7C3AED)")).toBe(false);
  });

  it("keeps white text when the color can't be read", () => {
    expect(needsDarkText("")).toBe(false);
    expect(needsDarkText("rebeccapurple")).toBe(false);
  });
});
