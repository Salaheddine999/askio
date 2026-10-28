const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Turns what an owner types as a "talk to a human" link into a working href:
 * "wa.me/123" becomes "https://wa.me/123" and "help@shop.com" a mailto link.
 * Returns null when it can't be a link, so the widget never shows a dead one.
 */
export function normalizeContactLink(value: string | undefined | null): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;

  // Check for mailto: first: "mailto:a@b.co" also looks like a bare email.
  if (/^mailto:/i.test(raw)) return EMAIL.test(raw.slice(7)) ? raw : null;
  if (EMAIL.test(raw)) return `mailto:${raw}`;
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

/** A WhatsApp chat link (wa.me, api.whatsapp.com/send, whatsapp.com/send). */
export function isWhatsAppLink(href: string | null | undefined): boolean {
  if (!href) return false;
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    return host === "wa.me" || ((host === "api.whatsapp.com" || host === "whatsapp.com") && url.pathname.startsWith("/send"));
  } catch {
    return false;
  }
}

/** The WhatsApp link with `text` typed into the message box, so the visitor doesn't repeat their question. */
export function withWhatsAppText(href: string, text: string): string {
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return href;
  try {
    const url = new URL(href);
    url.searchParams.delete("text");
    // %20 for spaces, as WhatsApp documents it, not the "+" URLSearchParams writes.
    const base = url.toString();
    return `${base}${url.search ? "&" : "?"}text=${encodeURIComponent(trimmed)}`;
  } catch {
    return href;
  }
}

export type ContactChannel = "whatsapp" | "telegram" | "messenger" | "instagram";

/** The chat app a "talk to a human" link opens, if it's one we know. */
export function contactChannel(href: string | null | undefined): ContactChannel | null {
  if (!href) return null;
  if (isWhatsAppLink(href)) return "whatsapp";
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "");
    // A chat with someone, not a share link or the app's home page.
    if ((host === "t.me" || host === "telegram.me") && /^\/[A-Za-z0-9_+]{3,}$/.test(path) && !/^\/(share|joinchat)\b/.test(path)) return "telegram";
    if ((host === "m.me" && path.length > 1) || (host === "messenger.com" && path.startsWith("/t/"))) return "messenger";
    if ((host === "ig.me" && path.startsWith("/m/")) || (host === "instagram.com" && /^\/[A-Za-z0-9_.]+$/.test(path))) return "instagram";
    return null;
  } catch {
    return null;
  }
}
