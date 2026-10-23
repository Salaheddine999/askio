const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Turns what an owner types as a "talk to a human" link into a working href:
 * "wa.me/123" becomes "https://wa.me/123" and "help@shop.com" a mailto link.
 * Returns null when it can't be a link, so the widget never shows a dead one.
 */
export function normalizeContactLink(value: string | undefined | null): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;

  if (EMAIL.test(raw)) return `mailto:${raw}`;
  if (/^mailto:/i.test(raw)) return EMAIL.test(raw.slice(7)) ? raw : null;
  if (/^tel:\+?[\d\s().-]{5,}$/i.test(raw)) return raw.replace(/\s+/g, "");

  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname.includes(".") || url.hostname.endsWith(".")) return null;
    const href = url.toString();
    // "https://site.com/" reads better as the owner typed it.
    return url.pathname === "/" && !url.search && !url.hash && !/\/$/.test(raw) ? href.slice(0, -1) : href;
  } catch {
    return null;
  }
}
