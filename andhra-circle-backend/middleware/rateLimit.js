// ==========================================
// Tiny in-memory rate limiter (no dependencies)
//
// Usage:
//   const { rateLimit } = require("./middleware/rateLimit");
//   router.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), handler);
//
// Notes:
// - Counters live in this process's memory, so they reset on restart and are
//   not shared between several server instances. That is fine for a single
//   server; use Redis + express-rate-limit if you scale out.
// - Behind a reverse proxy (Nginx, Render, Railway...) set
//   app.set("trust proxy", 1) in server.js, otherwise every visitor shares
//   the proxy's IP address.
// ==========================================

function rateLimit({
  windowMs = 60 * 1000,
  max = 60,
  message = "Too many requests. Please try again later.",
  skip = null, // optional (req) => true to exempt a request
  skipSuccessful = false, // true: only failed requests (status >= 400) count
} = {}) {
  const hits = new Map();

  // Drop expired entries every minute so memory cannot grow without bound
  const cleaner = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, 60 * 1000);
  cleaner.unref();

  return (req, res, next) => {
    if (skip && skip(req)) return next();

    const key = req.realClientIp || req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    // Used for login: a student who logs in correctly should not use up the
    // allowance (many students share one campus Wi-Fi address).
    if (skipSuccessful) {
      res.on("finish", () => {
        if (res.statusCode < 400 && entry.count > 0) entry.count -= 1;
      });
    }

    const remaining = Math.max(0, max - entry.count);
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ success: false, message });
    }

    next();
  };
}

module.exports = { rateLimit };
