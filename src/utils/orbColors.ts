import type { LiveOrbProps } from "../components/LiveOrb";

export type LauncherStyle = "classic" | "orb";

export function isLauncherStyle(value: unknown): value is LauncherStyle {
  return value === "classic" || value === "orb";
}

/** A hex color's relative luminance (WCAG), 0 for black to 1 for white; null if it isn't a hex. */
function luminanceOf(hex: string): number | null {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Dark eyes on light bodies, light eyes on dark ones.
function eyeColorFor(hex: string): string {
  const luminance = luminanceOf(hex);
  return luminance !== null && luminance > 0.45 ? "#101723" : "#F9FCFF";
}

/**
 * Whether text on this color (a hex or a linear-gradient of hexes) should be
 * dark rather than white. Past this luminance, dark text has more contrast
 * than white: amber, light green or beige, for example.
 */
export function needsDarkText(color: string): boolean {
  const values = (color.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [])
    .map(luminanceOf)
    .filter((l): l is number => l !== null);
  if (!values.length) return false;
  return values.reduce((sum, l) => sum + l, 0) / values.length > 0.3;
}

// The colour halfway between two hexes, for a gradient's middle.
function blend(a: string, b: string): string {
  const rgb = (hex: string) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
    const n = Number.parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round((v + y[i]) / 2).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Maps a chatbot's primary color to orb props. A solid color becomes the orb's
 * body; a gradient is laid across the orb at its own angle, start to end.
 */
export function orbPropsFor(
  primaryColor: string
): Pick<LiveOrbProps, "variant" | "color" | "eyeColor" | "colors" | "angle"> {
  const hexes: string[] = primaryColor.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  if (primaryColor.startsWith("linear-gradient") && hexes.length >= 2) {
    const start = hexes[0];
    const end = hexes[hexes.length - 1];
    const middle = hexes.length >= 3 ? hexes[Math.floor(hexes.length / 2)] : blend(start, end);
    const angle = Number(primaryColor.match(/linear-gradient\(\s*(-?[\d.]+)deg/)?.[1] ?? 135);
    return { variant: "webgl", colors: [start, middle, end], angle, eyeColor: eyeColorFor(middle) };
  }
  const body = hexes[0] ?? "#101723";
  return { variant: "custom", color: body, eyeColor: eyeColorFor(body) };
}

/**
 * The orb for the chat header, which is painted in the primary color, so it
 * stands out from it: a light body with eyes in the brand color on a dark
 * header, and a dark body with light eyes on a light one.
 */
export function headerOrbPropsFor(primaryColor: string): Pick<LiveOrbProps, "variant" | "color" | "eyeColor"> {
  if (needsDarkText(primaryColor)) return { variant: "custom", color: "#101723", eyeColor: "#F9FCFF" };
  const brand = primaryColor.match(/#[0-9a-fA-F]{3,8}\b/)?.[0] ?? "#101723";
  return { variant: "custom", color: "#F4F7FB", eyeColor: eyeColorFor(brand) === "#101723" ? "#101723" : brand };
}
