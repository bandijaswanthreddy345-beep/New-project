/**
 * Cost & Quota Monitoring Service
 * Checks MongoDB Atlas storage size and warns before approaching M0 (512MB) limits.
 */

const mongoose = require("mongoose");
const logger = require("./logger");

const ATLAS_FREE_TIER_LIMIT_BYTES = 512 * 1024 * 1024; // 512 MB
const WARNING_THRESHOLD_PERCENT = 0.8; // 80% (approx 409 MB)

async function checkStorageQuotas() {
  if (mongoose.connection.readyState !== 1) return null;

  try {
    const stats = await mongoose.connection.db.stats();
    const dataSize = stats.dataSize || 0;
    const storageSize = stats.storageSize || 0;
    const usagePercent = ((storageSize / ATLAS_FREE_TIER_LIMIT_BYTES) * 100).toFixed(2);

    if (storageSize >= ATLAS_FREE_TIER_LIMIT_BYTES * WARNING_THRESHOLD_PERCENT) {
      logger.warn(`Atlas storage alert: ${usagePercent}% of free-tier capacity consumed`, {
        storageSizeBytes: storageSize,
        thresholdPercent: WARNING_THRESHOLD_PERCENT * 100,
      });
    }

    return {
      database: mongoose.connection.name,
      dataSizeMb: (dataSize / (1024 * 1024)).toFixed(2),
      storageSizeMb: (storageSize / (1024 * 1024)).toFixed(2),
      percentUsed: `${usagePercent}%`,
    };
  } catch (err) {
    logger.warn("Failed to retrieve database storage quota stats", { error: err.message });
    return null;
  }
}

module.exports = {
  checkStorageQuotas,
};

