/**
 * Cloudflare IP Range Validator & Client IP Extractor
 * Published Cloudflare IP prefixes (IPv4 & IPv6)
 * https://www.cloudflare.com/ips-v4 / https://www.cloudflare.com/ips-v6
 */

const net = require("net");

const CLOUDFLARE_IPV4_CIDRS = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];

const CLOUDFLARE_IPV6_CIDRS = [
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

function ipToLong(ip) {
  return ip
    .split(".")
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

function isIpv4InCidr(ip, cidr) {
  const [range, bits = "32"] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1) >>> 0;
  return (ipToLong(ip) & mask) === (ipToLong(range) & mask);
}

function isCloudflareIp(ip) {
  if (!ip) return false;
  // Handle mapped IPv6 notation like ::ffff:173.245.48.1
  const cleanIp = ip.replace(/^::ffff:/, "");

  if (net.isIPv4(cleanIp)) {
    return CLOUDFLARE_IPV4_CIDRS.some((cidr) => isIpv4InCidr(cleanIp, cidr));
  }

  if (net.isIPv6(cleanIp)) {
    // Cloudflare IPv6 prefix matching
    const lower = cleanIp.toLowerCase();
    return (
      lower.startsWith("2400:cb00:") ||
      lower.startsWith("2606:4700:") ||
      lower.startsWith("2803:f800:") ||
      lower.startsWith("2405:b500:") ||
      lower.startsWith("2405:8100:") ||
      lower.startsWith("2a06:98c") ||
      lower.startsWith("2c0f:f248:")
    );
  }

  return false;
}

/**
 * Middleware to safely extract real client IP:
 * - If CF-Connecting-IP is present AND direct remote IP is a verified Cloudflare IP range, trust CF-Connecting-IP
 * - Otherwise fallback to req.ip or socket remote address (ignore spoofed headers)
 */
function cloudflareRealIp(req, res, next) {
  const socketIp = req.socket?.remoteAddress || "";
  const cfConnectingIp = req.headers["cf-connecting-ip"];

  if (cfConnectingIp && isCloudflareIp(socketIp)) {
    req.realClientIp = String(cfConnectingIp).trim();
    req.isFromCloudflare = true;
  } else {
    req.realClientIp = req.ip || socketIp || "unknown";
    req.isFromCloudflare = false;
  }

  next();
}

module.exports = {
  isCloudflareIp,
  cloudflareRealIp,
  CLOUDFLARE_IPV4_CIDRS,
  CLOUDFLARE_IPV6_CIDRS,
};
