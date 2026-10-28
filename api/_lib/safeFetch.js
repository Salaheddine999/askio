import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

// Fetches a URL a user gave us, refusing anything that isn't a public website:
// localhost, private networks, link-local (including cloud metadata at
// 169.254.169.254) and other reserved ranges, checked again on every redirect.
// The address check runs inside the connection's own DNS lookup, so the
// address that was checked is the one connected to (no DNS rebinding).

const MAX_REDIRECTS = 5;
/** Pages are read for their text; anything past this is cut off. */
const MAX_BODY_BYTES = 2 * 1024 * 1024;

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
  // IPv4 inside other IPv6 forms: IPv4-compatible (::a.b.c.d, written by URL
  // parsing as ::7f00:1), NAT64 (64:ff9b::/96) and 6to4 (2002::/16).
  const embedded = embeddedV4(lower);
  if (embedded) return isBlockedV4(embedded);
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("100::") || // discard-only 100::/64
    /^f[cd]/.test(lower) || // unique local fc00::/7
    /^fe[89ab]/.test(lower) || // link-local fe80::/10
    /^ff/.test(lower) || // multicast
    lower.startsWith("2001:db8") // documentation
  );
}

function expandV6(ip) {
  const [head, tail = ""] = ip.split("::");
  const parts = (text) => (text ? text.split(":") : []);
  let groups = ip.includes("::") ? [...parts(head), "", ...parts(tail)] : parts(ip);
  // A trailing dotted IPv4 counts as two groups.
  const last = groups[groups.length - 1] || "";
  if (last.includes(".")) {
    const [a, b, c, d] = last.split(".").map(Number);
    groups = [...groups.slice(0, -1), ((a << 8) | b).toString(16), ((c << 8) | d).toString(16)];
  }
  const fill = Math.max(0, 8 - groups.filter((g) => g !== "").length);
  return groups.flatMap((g) => (g === "" ? Array(fill).fill(0) : [parseInt(g, 16) || 0])).slice(0, 8);
}

function embeddedV4(lower) {
  const g = expandV6(lower);
  if (g.length !== 8) return null;
  const v4 = (hi, lo) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  if (g.slice(0, 6).every((x) => x === 0) && (g[6] || g[7] > 1)) return v4(g[6], g[7]); // ::a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return v4(g[6], g[7]); // NAT64
  if (g[0] === 0x2002) return v4(g[1], g[2]); // 6to4
  return null;
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

/**
 * dns.lookup for the connection itself: every address is checked here, and
 * the connection can only use an address that passed.
 */
export function publicOnlyLookup(hostname, options, callback) {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "function" ? {} : options || {};
  dns
    .lookup(hostname, { all: true, verbatim: true })
    .then((list) => {
      if (list.length === 0 || !list.every((a) => isPublicAddress(a.address))) {
        return cb(refuse("That address isn't a public website."));
      }
      if (opts.all) return cb(null, list);
      return cb(null, list[0].address, list[0].family);
    })
    .catch(() => cb(refuse("We couldn't find that website. Check the address.")));
}

/** One request, connecting only to checked addresses, with the body capped. */
function requestOnce(url, { method = "GET", headers = {}, signal } = {}) {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(url, { method, headers, signal, lookup: publicOnlyLookup }, (response) => {
      const chunks = [];
      let size = 0;
      const finish = () => {
        const responseHeaders = new Headers();
        for (const [name, value] of Object.entries(response.headers)) {
          if (value !== undefined) responseHeaders.set(name, Array.isArray(value) ? value.join(", ") : String(value));
        }
        const status = response.statusCode || 502;
        const noBody = status === 204 || status === 304 || (status >= 300 && status < 400);
        resolve(new Response(noBody ? null : Buffer.concat(chunks), { status, headers: responseHeaders }));
      };
      // A redirect is followed by the caller; its body isn't needed.
      if (response.statusCode >= 300 && response.statusCode < 400) {
        response.resume();
        return finish();
      }
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
          chunks.push(chunk.subarray(0, chunk.length - (size - MAX_BODY_BYTES)));
          response.destroy();
          return finish();
        }
        chunks.push(chunk);
      });
      response.on("end", finish);
      response.on("error", reject);
    });
    request.on("error", reject);
    request.end();
  });
}

/** fetch() for user-supplied URLs; follows redirects itself so each hop is checked. */
export async function safeFetch(rawUrl, options = {}) {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current);
    const response = await requestOnce(url, options);
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  throw refuse("That website redirects too many times.");
}
