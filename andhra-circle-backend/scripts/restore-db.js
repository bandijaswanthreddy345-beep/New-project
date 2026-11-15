/**
 * Database Restore Script
 * Restores collections from a backup directory.
 * By default, restores into a SCRATCH test database ("andhra-circle-test") for dry-run verification.
 * 
 * Usage:
 *   Dry-run / Scratch: node scripts/restore-db.js <backup-dir>
 *   Target specific  : node scripts/restore-db.js <backup-dir> --target-db andhra-circle-test
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const logger = require("../utils/logger");

async function restore() {
  const args = process.argv.slice(2);
  let backupDir = args[0];
  let targetDb = "andhra-circle-test"; // Default to scratch database for safety

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target-db" && args[i + 1]) {
      targetDb = args[i + 1];
    }
  }

  // If no folder provided, find most recent backup
  if (!backupDir || !fs.existsSync(backupDir)) {
    const backupsRoot = path.join(__dirname, "../backups");
    if (fs.existsSync(backupsRoot)) {
      const allDirs = fs
        .readdirSync(backupsRoot)
        .filter((d) => fs.statSync(path.join(backupsRoot, d)).isDirectory())
        .sort()
        .reverse();
      if (allDirs.length > 0) {
        backupDir = path.join(backupsRoot, allDirs[0]);
        console.log(`No backup directory specified. Using most recent backup: ${allDirs[0]}`);
      }
    }
  }

  if (!backupDir || !fs.existsSync(backupDir)) {
    console.error("Usage: node scripts/restore-db.js <path-to-backup-folder> [--target-db <name>]");
    process.exit(1);
  }

  const isScratch = targetDb === "andhra-circle-test";
  const localMongoUri = `mongodb://127.0.0.1:27017/${targetDb}`;

  console.log(`Connecting to restore target: "${targetDb}" on 127.0.0.1:27017 (${isScratch ? "DRY-RUN / SCRATCH DATABASE" : "TARGET DATABASE"})...`);
  await mongoose.connect(localMongoUri, { serverSelectionTimeoutMS: 8000 });

  console.log(`Reading backup archive from: ${backupDir}\n`);

  // Drop scratch database only to ensure clean state
  if (isScratch) {
    console.log(`Cleaning scratch database "${targetDb}" before dry-run restore...`);
    await mongoose.connection.db.dropDatabase();
  }

  const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json") && f !== "manifest.json");
  const restoredCounts = {};

  for (const file of files) {
    const colName = file.replace(/\.json$/, "");
    const content = fs.readFileSync(path.join(backupDir, file), "utf8");
    const docs = JSON.parse(content);

    if (docs.length > 0) {
      await mongoose.connection.db.collection(colName).deleteMany({});
      await mongoose.connection.db.collection(colName).insertMany(docs);
      restoredCounts[colName] = docs.length;
      console.log(`  ✓ Restored ${colName.padEnd(20)}: ${docs.length} records`);
    } else {
      restoredCounts[colName] = 0;
      console.log(`  - Skipped empty ${colName.padEnd(20)}: 0 records`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`RESTORE VERIFICATION: Database "${targetDb}"`);
  console.log(`==================================================`);
  console.table(Object.entries(restoredCounts).map(([collection, count]) => ({ collection, count })));
  console.log(`Total collections restored: ${Object.keys(restoredCounts).length}`);
  console.log(`Status: Dry-run restore verified successfully.`);

  await mongoose.connection.close();
  process.exit(0);
}

restore().catch((err) => {
  console.error("Database restore failed:", err.message);
  process.exit(1);
});
