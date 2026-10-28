import { describe, expect, it } from "vitest";
import { assertPublicUrl, isPublicAddress } from "../api/_lib/safeFetch.js";
import { contactChannel, isWhatsAppLink, normalizeContactLink, withWhatsAppText } from "../src/utils/links";

describe("isPublicAddress (AI website scraper)", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.20.0.5",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "0.0.0.0",
    "100.64.0.1",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1", // the same, as URLs write it
  ])("blocks %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it.each(["8.8.8.8", "93.184.216.34", "2606:4700:4700::1111"])("allows %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });
});

describe("assertPublicUrl", () => {
  it.each([
    ["http://localhost:3000", /port/],
    ["http://localhost/", /public website/],
    ["http://169.254.169.254/latest/meta-data/", /public website/],
    ["http://[::1]/", /public website/],
    ["ftp://example.com/", /http and https/],
    ["http://user:pw@example.com/", /login/],
    ["http://metadata.google.internal/", /public website/],
    ["not a url", /website address/],
  ])("refuses %s", async (url, message) => {
    await expect(assertPublicUrl(url)).rejects.toThrow(message);
  });

  it("accepts a public IP address", async () => {
    await expect(assertPublicUrl("https://93.184.216.34/")).resolves.toBeInstanceOf(URL);
  });
});

describe("normalizeContactLink (talk to a human)", () => {
  it.each([
    ["wa.me/212600000000", "https://wa.me/212600000000"],
    ["whatsapp.com", "https://whatsapp.com"],
    ["https://example.com/contact", "https://example.com/contact"],
    ["help@shop.com", "mailto:help@shop.com"],
    ["mailto:help@shop.com", "mailto:help@shop.com"],
    ["tel:+212 600 000 000", "tel:+212600000000"],
  ])("turns %s into %s", (input, expected) => {
    expect(normalizeContactLink(input)).toBe(expected);
  });

  it.each(["", "   ", "not a link", "javascript:alert(1)", "mailto:nope", "localhost"])("rejects %j", (input) => {
    expect(normalizeContactLink(input)).toBeNull();
  });
});

describe("WhatsApp handoff", () => {
  it("recognises WhatsApp chat links, not other pages", () => {
    expect(isWhatsAppLink("https://wa.me/212600000000")).toBe(true);
    expect(isWhatsAppLink("https://api.whatsapp.com/send?phone=212600000000")).toBe(true);
    expect(isWhatsAppLink("https://whatsapp.com")).toBe(false);
    expect(isWhatsAppLink("https://example.com/wa.me")).toBe(false);
    expect(isWhatsAppLink(null)).toBe(false);
  });

  it("types the visitor's question into the WhatsApp message", () => {
    expect(withWhatsAppText("https://wa.me/212600000000", "Do you ship to Belgium?")).toBe(
      "https://wa.me/212600000000?text=Do%20you%20ship%20to%20Belgium%3F"
    );
    expect(withWhatsAppText("https://wa.me/212600000000", "  ")).toBe("https://wa.me/212600000000");
    expect(withWhatsAppText("https://api.whatsapp.com/send?phone=212600000000&text=old", "Hi")).toBe(
      "https://api.whatsapp.com/send?phone=212600000000&text=Hi"
    );
  });
});

describe("contactChannel (which chat app a link opens)", () => {
  it.each([
    ["https://wa.me/31612345678", "whatsapp"],
    ["https://t.me/sofaandco", "telegram"],
    ["https://telegram.me/sofaandco", "telegram"],
    ["https://m.me/sofaandco", "messenger"],
    ["https://www.messenger.com/t/sofaandco", "messenger"],
    ["https://ig.me/m/sofaandco", "instagram"],
    ["https://www.instagram.com/sofaandco/", "instagram"],
  ])("%s opens %s", (href, channel) => {
    expect(contactChannel(href)).toBe(channel);
  });

  it.each(["https://t.me/share/url?url=x", "https://t.me", "https://m.me", "https://www.instagram.com/p/abc123/", "https://shop.example/contact", "mailto:help@shop.com", null])(
    "%s isn't a chat with someone",
    (href) => {
      expect(contactChannel(href)).toBeNull();
    }
  );
});
