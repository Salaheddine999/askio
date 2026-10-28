import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin.js";
import { generateFaqsFromUrl } from "../ai.js";
import { assertPublicUrl, safeFetch } from "../safeFetch.js";
import { takeRateLimit, visitorKey } from "../rateLimit.js";
import { sendError } from "../response.js";
import { noteAiFailure } from "../aiHealth.js";
import { reportError } from "../monitoring.js";

// POST /api/ai/demo { url }: the homepage's "see it on your website". Reads a
// visitor's site and returns what Askio would look like there: its name,
// image and colour, and a few FAQs written from it. No account needed, so
// it's held to a few a day per visitor and overall, and results are kept a
// week per site so trying again costs nothing.

const DAY_MS = 86_400_000;
const PER_VISITOR = 3;
// New sites a day across all visitors. DEMO_DAILY_LIMIT raises it once Gemini
// billing is on; the default stays within the free tier's few dozen calls.
const perDay = () => {
  const n = Number.parseInt(process.env.DEMO_DAILY_LIMIT || "", 10);
  return Number.isFinite(n) && n >= 0 ? n : 15;
};
const CACHE_MS = 7 * DAY_MS;
const MAX_FAQS = 6;

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

/** "shop.example" or "https://shop.example/x" → the site's front page. */
export function demoUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > 300) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    return { url: `${url.protocol}//${url.host}/`, host: url.host.replace(/^www\./, "").toLowerCase() };
  } catch {
    return null;
  }
}

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

/** The page's name, picture, colour and icon, from its <head>. */
export function siteMeta(html, pageUrl) {
  const head = html.slice(0, 200_000);
  const meta = (names) => {
    for (const name of names) {
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, "i");
      const tag = head.match(re)?.[0];
      const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
      if (content) return decode(content);
    }
    return "";
  };
  const absolute = (href) => {
    if (!href) return "";
    try {
      const url = new URL(href, pageUrl);
      return url.protocol === "https:" ? url.toString() : "";
    } catch {
      return "";
    }
  };
  const iconTag = head.match(/<link[^>]+rel=["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]*>/i)?.[0];
  const color = meta(["theme-color"]);
  return {
    title: (meta(["og:site_name", "og:title"]) || decode(head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "")).slice(0, 60),
    image: absolute(meta(["og:image", "twitter:image"])),
    icon: absolute(iconTag?.match(/href=["']([^"']+)["']/i)?.[1]),
    // Only a plain hex colour; anything else falls back to Askio's.
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : /^#[0-9a-f]{3}$/i.test(color) ? `#${[...color.slice(1)].map((c) => c + c).join("")}` : "",
  };
}

async function readMeta(url) {
  try {
    const response = await safeFetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AskioDemo/1.0; +https://www.getaskio.xyz)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return { title: "", image: "", icon: "", color: "" };
    return siteMeta(await response.text(), url);
  } catch {
    return { title: "", image: "", icon: "", color: "" };
  }
}

export default async function demo(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const target = demoUrl(req.body?.url);
    if (!target) throw badRequest("Enter your website's address, like yourstore.com.");
    await assertPublicUrl(target.url);

    const cacheRef = adminDb.collection("demo_cache").doc(target.host);
    const cached = (await cacheRef.get()).data();
    if (cached && Date.now() - (cached.createdAt?.toMillis?.() ?? 0) < CACHE_MS) {
      return res.status(200).json({ host: target.host, site: cached.site, faqs: cached.faqs });
    }

    const [visitorOk, dayOk] = await Promise.all([
      takeRateLimit(`demo_v_${visitorKey(req)}`, PER_VISITOR, DAY_MS),
      takeRateLimit("demo_all", perDay(), DAY_MS),
    ]);
    // "busy" tells the page to offer sign-up instead of a dead end.
    if (!visitorOk) {
      return res.status(429).json({ busy: true, error: "You've tried a few sites already today." });
    }
    if (!dayOk) {
      return res.status(429).json({ busy: true, error: "The demo is busy right now." });
    }

    let faqs;
    let site;
    try {
      [faqs, site] = await Promise.all([generateFaqsFromUrl(target.url), readMeta(target.url)]);
    } catch (error) {
      if (error.aiStatus !== undefined) await noteAiFailure(error.aiStatus, "demo");
      throw error;
    }
    const cleaned = (Array.isArray(faqs) ? faqs : [])
      .filter((f) => typeof f?.question === "string" && typeof f?.answer === "string" && f.question.trim() && f.answer.trim())
      .slice(0, MAX_FAQS)
      .map((f) => ({ question: f.question.trim().slice(0, 300), answer: f.answer.trim().slice(0, 2000) }));
    if (!cleaned.length) {
      return res.status(422).json({ error: "We couldn't find enough on that page to write answers. Try another address." });
    }
    await cacheRef.set({ site, faqs: cleaned, createdAt: FieldValue.serverTimestamp() });
    return res.status(200).json({ host: target.host, site, faqs: cleaned });
  } catch (error) {
    console.error("Demo failed:", error.message);
    // Our side failed (the AI out of quota, slow, or a bug): the same
    // friendly way out as a busy day. Real bugs still reach Sentry.
    const status = error.statusCode || 500;
    if (status >= 500) {
      if (status !== 503 && !error.expected) reportError(error, { route: "demo" });
      return res.status(503).json({ busy: true, error: "The demo is busy right now." });
    }
    return sendError(res, error);
  }
}
