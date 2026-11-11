// ==========================================
// Failed Login Attempt Tracker
// Persistent MongoDB TTL storage with in-memory fast fallback
// ==========================================

const SecurityState = require("../models/SecurityState");
const logger = require("../utils/logger");

const FAILED_ATTEMPT_THRESHOLD = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory fallback if MongoDB is not reachable
const memAttempts = new Map();

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
async function isCaptchaRequired(ip, email) {
  const cleanIp = normalizeIp(ip);
  const cleanEmail = normalizeEmail(email);

  try {
    const keys = [`ip:${cleanIp}`];
    if (cleanEmail) keys.push(`email:${cleanEmail}`);

    const docs = await SecurityState.find({
      key: { $in: keys },
      type: "login_attempt",
      expiresAt: { $gt: new Date() },
    }).lean();

    for (const doc of docs) {
      if (doc.count >= FAILED_ATTEMPT_THRESHOLD) {
        return true;
      }
    }
  } catch (err) {
    // Memory fallback
    const now = Date.now();
    const ipEntry = memAttempts.get(`ip:${cleanIp}`);
    if (ipEntry && ipEntry.resetAt > now && ipEntry.count >= FAILED_ATTEMPT_THRESHOLD) {
      return true;
    }
    if (cleanEmail) {
      const emailEntry = memAttempts.get(`email:${cleanEmail}`);
      if (emailEntry && emailEntry.resetAt > now && emailEntry.count >= FAILED_ATTEMPT_THRESHOLD) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Records a failed login attempt for the given IP and email
 */
async function recordFailedAttempt(ip, email) {
  const cleanIp = normalizeIp(ip);
  const cleanEmail = normalizeEmail(email);
  const expiresAt = new Date(Date.now() + WINDOW_MS);

  const keys = [`ip:${cleanIp}`];
  if (cleanEmail) keys.push(`email:${cleanEmail}`);

  for (const key of keys) {
    try {
      await SecurityState.findOneAndUpdate(
        { key, type: "login_attempt" },
        {
          $inc: { count: 1 },
          $setOnInsert: { key, type: "login_attempt" },
          $set: { expiresAt },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      // Memory fallback
      const current = memAttempts.get(key);
      const count = (current && current.resetAt > Date.now()) ? current.count + 1 : 1;
      memAttempts.set(key, { count, resetAt: Date.now() + WINDOW_MS });
    }
  }
}

/**
 * Clears failed attempt tracking on successful login
 */
async function clearFailedAttempts(ip, email) {
  const cleanIp = normalizeIp(ip);
  const cleanEmail = normalizeEmail(email);

  const keys = [`ip:${cleanIp}`];
  if (cleanEmail) keys.push(`email:${cleanEmail}`);

  try {
    await SecurityState.deleteMany({ key: { $in: keys }, type: "login_attempt" });
  } catch (err) {
    // Memory fallback
    keys.forEach((k) => memAttempts.delete(k));
  }
}

module.exports = {
  FAILED_ATTEMPT_THRESHOLD,
  WINDOW_MS,
  isCaptchaRequired,
  recordFailedAttempt,
  clearFailedAttempts,
};
