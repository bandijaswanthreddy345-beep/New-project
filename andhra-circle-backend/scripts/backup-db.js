/**
 * Automated Database Backup Script
 * Exports collections to JSON Lines archives in backups/
 * Usage: node scripts/backup-db.js
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../config/db");
const logger = require("../utils/logger");

async function backup() {
  await connectDB();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "../backups", timestamp);

  fs.mkdirSync(backupDir, { recursive: true });
  logger.info("Starting database backup...", { targetDir: backupDir });

  const collections = await mongoose.connection.db.listCollections().toArray();

  for (const col of collections) {
    const colName = col.name;
    const documents = await mongoose.connection.db.collection(colName).find({}).toArray();
    const filePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), "utf8");
    logger.info(`Exported collection: ${colName} (${documents.length} records)`);
  }

  logger.info("Database backup completed successfully.", { timestamp, path: backupDir });
  await mongoose.connection.close();
  process.exit(0);
}

backup().catch((err) => {
  logger.error("Database backup failed", { error: err.message });
  process.exit(1);
});

