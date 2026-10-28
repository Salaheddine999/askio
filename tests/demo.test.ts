import { beforeEach, describe, expect, it, vi } from "vitest";

// The homepage demo: reading a visitor's site and writing FAQs from it, with
// the AI, the website fetch, Firestore and rate limits stubbed.
const fake = vi.hoisted(() => ({
  cache: {} as Record<string, Record<string, unknown>>,
  allowed: true,
  faqs: [] as unknown[],
  html: "",
  generated: 0,
}));

vi.mock("firebase-admin/firestore", () => ({ FieldValue: { serverTimestamp: () => ({ toMillis: () => Date.now() }) } }));
vi.mock("../api/_lib/firebaseAdmin.js", () => ({
  adminDb: {
    collection: () => ({
      doc: (id: string) => ({
        get: async () => ({ data: () => fake.cache[id] }),
        set: async (data: Record<string, unknown>) => void (fake.cache[id] = data),
      }),
    }),
  },
  adminAuth: {},
}));
vi.mock("../api/_lib/ai.js", () => ({
  generateFaqsFromUrl: async () => {
    fake.generated++;
    return fake.faqs;
  },
}));
vi.mock("../api/_lib/safeFetch.js", () => ({
  assertPublicUrl: async (url: string) => {
    if (url.includes("localhost")) throw Object.assign(new Error("That address isn't a public website."), { statusCode: 400 });
  },
  safeFetch: async () => new Response(fake.html, { status: 200 }),
}));
vi.mock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => fake.allowed, visitorKey: () => "visitor" }));
vi.mock("../api/_lib/aiHealth.js", () => ({ noteAiFailure: async () => undefined }));
vi.mock("../api/_lib/monitoring.js", () => ({ reportError: () => undefined }));

const { default: demo, demoUrl, siteMeta } = await import("../api/_lib/widget/demo.js");

const res = () => {
  const r = { statusCode: 0, body: undefined as unknown, setHeader: () => undefined, status: (c: number) => ((r.statusCode = c), r), json: (b: unknown) => ((r.body = b), r) };
  return r;
};
const ask = (url: unknown) => ({ method: "POST", headers: {}, body: { url } });

beforeEach(() => {
  fake.cache = {};
  fake.allowed = true;
  fake.faqs = [{ question: "Do you ship to Belgium?", answer: "Yes, in 2 to 3 days." }];
  fake.html = `<html><head><title>Fallback</title><meta property="og:site_name" content="Sofa &amp; Co"><meta property="og:image" content="/hero.jpg"><meta name="theme-color" content="#2a6"><link rel="icon" href="https://shop.example/icon.png"></head></html>`;
  fake.generated = 0;
});

describe("demoUrl", () => {
  it("turns what a visitor types into the site's front page", () => {
    expect(demoUrl("shop.example/products/sofa")).toEqual({ url: "https://shop.example/", host: "shop.example" });
    expect(demoUrl("https://www.Shop.example")).toEqual({ url: "https://www.shop.example/", host: "shop.example" });
    expect(demoUrl("not a site")).toBeNull();
    expect(demoUrl("")).toBeNull();
  });
});

describe("siteMeta", () => {
  it("reads the name, picture, colour and icon", () => {
    expect(siteMeta(fake.html, "https://shop.example/")).toEqual({
      title: "Sofa & Co",
      image: "https://shop.example/hero.jpg",
      icon: "https://shop.example/icon.png",
      color: "#22aa66",
    });
  });

  it("falls back to the page title and leaves out what isn't safe to show", () => {
    const meta = siteMeta('<title>My shop</title><meta property="og:image" content="http://insecure.example/a.jpg"><meta name="theme-color" content="red">', "https://shop.example/");
    expect(meta).toEqual({ title: "My shop", image: "", icon: "", color: "" });
  });
});

describe("POST /api/ai/demo", () => {
  it("returns the site and its FAQs, and keeps them for the next visitor", async () => {
    const first = res();
    await demo(ask("shop.example"), first);
    expect(first.statusCode).toBe(200);
    expect(first.body).toMatchObject({ host: "shop.example", site: { title: "Sofa & Co" }, faqs: fake.faqs });

    const second = res();
    await demo(ask("https://shop.example/about"), second);
    expect(second.statusCode).toBe(200);
    expect(fake.generated).toBe(1);
  });

  it("refuses private addresses and stops at the daily limit", async () => {
    const local = res();
    await demo(ask("localhost:3000"), local);
    expect(local.statusCode).toBe(400);

    fake.allowed = false;
    const limited = res();
    await demo(ask("other.example"), limited);
    expect(limited.statusCode).toBe(429);
  });

  it("says so when there's nothing to write answers from", async () => {
    fake.faqs = [];
    const r = res();
    await demo(ask("empty.example"), r);
    expect(r.statusCode).toBe(422);
  });
});
