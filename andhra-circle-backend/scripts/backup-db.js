/**
 * Automated Database Backup Script
 * Exports collections from local MongoDB into a dated local archive directory
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
  const dbName = mongoose.connection.name;
  const host = mongoose.connection.host;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "../backups", `backup-${timestamp}`);

  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Starting local database backup from "${dbName}" on ${host}...`);
  console.log(`Destination: ${backupDir}\n`);

  const collections = await mongoose.connection.db.listCollections().toArray();
  const summary = {};

  for (const col of collections) {
    const colName = col.name;
    const documents = await mongoose.connection.db.collection(colName).find({}).toArray();
    const filePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), "utf8");
    summary[colName] = documents.length;
    console.log(`  ✓ Exported ${colName.padEnd(20)}: ${documents.length} records`);
  }

  // Write backup manifest
  fs.writeFileSync(
    path.join(backupDir, "manifest.json"),
    JSON.stringify(
      {
        timestamp,
        database: dbName,
        host,
        totalCollections: collections.length,
        collections: summary,
      },
      null,
      2
    )
  );

  console.log(`\nLocal backup completed successfully.`);
  console.log(`Backup manifest and JSON files written to: ${backupDir}`);
  await mongoose.connection.close();
  process.exit(0);
}

backup().catch((err) => {
  logger.error("Database backup failed", { error: err.message });
  console.error("Backup failed:", err.message);
  process.exit(1);
});
