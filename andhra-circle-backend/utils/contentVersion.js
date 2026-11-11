/**
 * Helper to track and bump content versions
 * Inbuilt into SecurityState TTL/Atomic collection.
 */

const SecurityState = require("../models/SecurityState");
const logger = require("./logger");

const VERSION_KEY = "portal_content_version";

async function getContentVersion() {
  try {
    const doc = await SecurityState.findOne({ key: VERSION_KEY, type: "ai_daily_cap" }).lean();
    return doc?.count || 1;
  } catch (err) {
    logger.warn("Failed to get content version, defaulting to 1", { error: err.message });
    return 1;
  }
}

async function bumpContentVersion() {
  try {
    const doc = await SecurityState.findOneAndUpdate(
      { key: VERSION_KEY, type: "ai_daily_cap" },
      {
        $inc: { count: 1 },
        $setOnInsert: { key: VERSION_KEY, type: "ai_daily_cap", expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      },
      { upsert: true, returnDocument: "after" }
    );
    logger.info("Content version bumped", { newVersion: doc.count });
    return doc.count;
  } catch (err) {
    logger.warn("Failed to bump content version", { error: err.message });
    return 1;
  }
}

module.exports = {
  getContentVersion,
  bumpContentVersion,
};
