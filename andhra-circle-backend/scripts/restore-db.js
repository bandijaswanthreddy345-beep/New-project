/**
 * Database Restore Script
 * Restores collections from a backup directory into target MongoDB database
 * Usage: node scripts/restore-db.js <path-to-backup-dir>
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../config/db");
const logger = require("../utils/logger");

async function restore() {
  const targetDir = process.argv[2];
  if (!targetDir || !fs.existsSync(targetDir)) {
    console.error("Usage: node scripts/restore-db.js <path-to-backup-folder>");
    process.exit(1);
  }

  await connectDB();
  logger.info("Starting database restore...", { sourceDir: targetDir });

  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const colName = file.replace(/\.json$/, "");
    const content = fs.readFileSync(path.join(targetDir, file), "utf8");
    const docs = JSON.parse(content);

    if (docs.length > 0) {
      // In scratch or targeted restores
      await mongoose.connection.db.collection(colName).deleteMany({});
      await mongoose.connection.db.collection(colName).insertMany(docs);
      logger.info(`Restored collection: ${colName} (${docs.length} records)`);
    }
  }

  logger.info("Database restore completed successfully.");
  await mongoose.connection.close();
  process.exit(0);
}

restore().catch((err) => {
  logger.error("Database restore failed", { error: err.message });
  process.exit(1);
});

