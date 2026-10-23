import type { LiveOrbProps } from "../components/LiveOrb";

export type LauncherStyle = "classic" | "orb";

export function isLauncherStyle(value: unknown): value is LauncherStyle {
  return value === "classic" || value === "orb";
}

// Dark eyes on light bodies, light eyes on dark ones.
function eyeColorFor(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return "#F9FCFF";
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#101723" : "#F9FCFF";
}

/**
 * Maps a chatbot's primary color to orb props. A solid color becomes the orb's
 * body; a gradient becomes the animated WebGL wash using its color stops.
 */
export function orbPropsFor(primaryColor: string): Pick<LiveOrbProps, "variant" | "color" | "eyeColor" | "colors"> {
  const hexes: string[] = primaryColor.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  if (primaryColor.startsWith("linear-gradient") && hexes.length >= 2) {
    const pick = (i: number) => hexes[i] ?? hexes[0] ?? "#101723";
    return { variant: "webgl", colors: [pick(0), pick(Math.floor(hexes.length / 2)), pick(hexes.length - 1)] };
  }
  const body = hexes[0] ?? "#101723";
  return { variant: "custom", color: body, eyeColor: eyeColorFor(body) };
}

/**
 * The orb for the chat header, which is painted in the primary color: a light
 * body with eyes in the brand color, so it stands out from the header.
 */
export function headerOrbPropsFor(primaryColor: string): Pick<LiveOrbProps, "variant" | "color" | "eyeColor"> {
  const brand = primaryColor.match(/#[0-9a-fA-F]{3,8}\b/)?.[0] ?? "#101723";
  const body = "#F4F7FB";
  return { variant: "custom", color: body, eyeColor: eyeColorFor(brand) === "#101723" ? "#101723" : brand };
}
