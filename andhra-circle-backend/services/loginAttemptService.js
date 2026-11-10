// ==========================================
// Failed Login Attempt Tracker
//
// Tracks failed login attempts per IP address and per email address
// to enforce CAPTCHA challenges after repeated failures (default >= 3).
//
// In-memory with TTL cleanup, bounded size to prevent memory exhaustion.
// ==========================================

const FAILED_ATTEMPT_THRESHOLD = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes (matches login rate limiter)
const MAX_ENTRIES = 10000;

// key -> { count: number, resetAt: number }
const attempts = new Map();

// Periodic cleanup every 60 seconds
const cleaner = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) {
      attempts.delete(key);
    }
  }
}, 60 * 1000);
cleaner.unref();

function normalizeIp(ip) {
  if (typeof ip !== "string") return "unknown";
  return ip.trim().toLowerCase();
}

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * Checks whether CAPTCHA is required for this IP or email
 */
function isCaptchaRequired(ip, email) {
  const now = Date.now();
  const cleanIp = normalizeIp(ip);
  const cleanEmail = normalizeEmail(email);

  const ipEntry = attempts.get(`ip:${cleanIp}`);
  if (ipEntry && ipEntry.resetAt > now && ipEntry.count >= FAILED_ATTEMPT_THRESHOLD) {
    return true;
  }

  if (cleanEmail) {
    const emailEntry = attempts.get(`email:${cleanEmail}`);
    if (emailEntry && emailEntry.resetAt > now && emailEntry.count >= FAILED_ATTEMPT_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/**
 * Records a failed login attempt for IP and email
 * Returns boolean indicating if CAPTCHA is now required
 */
function recordFailedAttempt(ip, email) {
  const now = Date.now();
  const cleanIp = normalizeIp(ip);
  const cleanEmail = normalizeEmail(email);

  // Safeguard memory size
  if (attempts.size >= MAX_ENTRIES) {
    for (const [key, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(key);
    }
    if (attempts.size >= MAX_ENTRIES) {
      // Clear oldest entry if still full
      const firstKey = attempts.keys().next().value;
      if (firstKey) attempts.delete(firstKey);
    }
  }

  // Increment IP failures
  const ipKey = `ip:${cleanIp}`;
  let ipEntry = attempts.get(ipKey);
  if (!ipEntry || ipEntry.resetAt <= now) {
    ipEntry = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(ipKey, ipEntry);
  }
  ipEntry.count += 1;

  // Increment Email failures if provided
  let emailCount = 0;
  if (cleanEmail) {
    const emailKey = `email:${cleanEmail}`;
    let emailEntry = attempts.get(emailKey);
    if (!emailEntry || emailEntry.resetAt <= now) {
      emailEntry = { count: 0, resetAt: now + WINDOW_MS };
      attempts.set(emailKey, emailEntry);
    }
    emailEntry.count += 1;
    emailCount = emailEntry.count;
  }

  return ipEntry.count >= FAILED_ATTEMPT_THRESHOLD || emailCount >= FAILED_ATTEMPT_THRESHOLD;
}

/**
 * Clears failed attempts upon successful login
 */
function clearFailedAttempts(ip, email) {
  const cleanIp = normalizeIp(ip);
  const cleanEmail = normalizeEmail(email);

  if (cleanEmail) {
    attempts.delete(`email:${cleanEmail}`);
  }

  const ipKey = `ip:${cleanIp}`;
  const ipEntry = attempts.get(ipKey);
  if (ipEntry) {
    // Decrement or clear IP count on successful login
    if (ipEntry.count <= FAILED_ATTEMPT_THRESHOLD) {
      attempts.delete(ipKey);
    } else {
      ipEntry.count -= FAILED_ATTEMPT_THRESHOLD;
    }
  }
}

/**
 * Helper to get current attempt counters (useful for inspection/tests)
 */
function getFailedCount(ip, email) {
  const now = Date.now();
  const cleanIp = normalizeIp(ip);
  const cleanEmail = normalizeEmail(email);

  const ipEntry = attempts.get(`ip:${cleanIp}`);
  const ipCount = ipEntry && ipEntry.resetAt > now ? ipEntry.count : 0;

  let emailCount = 0;
  if (cleanEmail) {
    const emailEntry = attempts.get(`email:${cleanEmail}`);
    emailCount = emailEntry && emailEntry.resetAt > now ? emailEntry.count : 0;
  }

  return Math.max(ipCount, emailCount);
}

module.exports = {
  isCaptchaRequired,
  recordFailedAttempt,
  clearFailedAttempts,
  getFailedCount,
  FAILED_ATTEMPT_THRESHOLD,
};
