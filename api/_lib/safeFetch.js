import dns from "node:dns/promises";
import net from "node:net";

// Fetches a URL a user gave us, refusing anything that isn't a public website:
// localhost, private networks, link-local (including cloud metadata at
// 169.254.169.254) and other reserved ranges, checked again on every redirect.
// It doesn't pin the resolved address, so a DNS answer that changes between
// the check and the request (DNS rebinding) isn't covered.

const MAX_REDIRECTS = 5;

const BLOCKED_V4 = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const toInt = (ip) => ip.split(".").reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;

function isBlockedV4(ip) {
  const n = toInt(ip);
  return BLOCKED_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (toInt(base) & mask);
  });
}

function isBlockedV6(ip) {
  const lower = ip.toLowerCase();
  // IPv4 written as IPv6 (::ffff:10.0.0.1) is checked as IPv4.
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedV4(mapped[1]);
  // The same in hex, as URL parsing writes it: ::ffff:7f00:1 is 127.0.0.1.
  const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const [hi, lo] = [parseInt(mappedHex[1], 16), parseInt(mappedHex[2], 16)];
    return isBlockedV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  return (
    lower === "::" ||
    lower === "::1" ||
    /^f[cd]/.test(lower) || // unique local fc00::/7
    /^fe[89ab]/.test(lower) || // link-local fe80::/10
    /^ff/.test(lower) || // multicast
    lower.startsWith("2001:db8") // documentation
  );
}

export function isPublicAddress(ip) {
  if (net.isIPv4(ip)) return !isBlockedV4(ip);
  if (net.isIPv6(ip)) return !isBlockedV6(ip);
  return false;
}

function refuse(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

/** Throws unless the URL is http(s) on a standard port and resolves only to public addresses. */
export async function assertPublicUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw refuse("That doesn't look like a website address.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw refuse("Only http and https websites can be read.");
  if (url.port && !["80", "443"].includes(url.port)) throw refuse("That website uses a port we don't read.");
  if (url.username || url.password) throw refuse("Website addresses with a login can't be read.");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw refuse("That address isn't a public website.");
  }

  let addresses;
  if (net.isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = (await dns.lookup(host, { all: true, verbatim: true })).map((a) => a.address);
    } catch {
      throw refuse("We couldn't find that website. Check the address.");
    }
  }
  if (addresses.length === 0 || !addresses.every(isPublicAddress)) {
    throw refuse("That address isn't a public website.");
  }
  return url;
}

/** fetch() for user-supplied URLs; follows redirects itself so each hop is checked. */
export async function safeFetch(rawUrl, options = {}) {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current);
    const response = await fetch(current, { ...options, redirect: "manual" });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  throw refuse("That website redirects too many times.");
}
