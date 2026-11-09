// ==========================================
// safeFetch: fetch a user-supplied URL without letting it reach
// internal services (SSRF protection).
//
// - only http / https, only ports 80 / 443
// - the hostname is resolved first; loopback, private, link-local and
//   cloud-metadata addresses are refused
// - redirects are followed by hand (max 4) and every hop is re-checked
// - hard timeout and a maximum response size
//
// Known limit: a hostile DNS server could answer differently between our
// check and fetch's own lookup (DNS rebinding). Closing that completely needs
// a pinned-IP agent; this blocks the realistic attacks.
// ==========================================

const dns = require("dns").promises;
const net = require("net");

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 15000;
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;

function isPrivateIPv4(ip) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
    if (/^fe[89ab]/.test(lower)) return true; // fe80::/10
    // IPv4 hidden inside IPv6 (::ffff:127.0.0.1). Node rewrites the dotted
    // form to hex (::ffff:7f00:1), so both spellings are handled.
    const dotted = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) return isPrivateIPv4(dotted[1]);

    const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const hi = parseInt(hex[1], 16);
      const lo = parseInt(hex[2], 16);
      return isPrivateIPv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }

    return false;
  }

  return true; // not a valid IP at all: refuse
}

async function assertPublicUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed");
  }

  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  if (port !== "80" && port !== "443") {
    throw new Error("Only standard web ports are allowed");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");

  const addresses = net.isIP(host)
    ? [{ address: host }]
    : await dns.lookup(host, { all: true });

  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error("This address is not allowed");
  }

  return url;
}

async function safeFetch(rawUrl, options = {}, { maxBytes = DEFAULT_MAX_BYTES } = {}) {
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await fetch(url, {
        ...options,
        redirect: "manual",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect without a location");
      current = new URL(location, url).toString();
      continue;
    }

    const declared = Number(response.headers.get("content-length") || 0);
    if (declared > maxBytes) {
      throw new Error("File is too large");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) {
      throw new Error("File is too large");
    }

    return { response, buffer };
  }

  throw new Error("Too many redirects");
}

module.exports = { safeFetch, assertPublicUrl, isPrivateAddress };
