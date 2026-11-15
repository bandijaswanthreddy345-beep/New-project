/**
 * scripts/db-inspect.js
 * Read-only database telemetry inspection tool.
 * Connects with the app's settings and prints:
 * - Host and database name
 * - Document counts for each collection
 * - Index names for each collection
 * NEVER prints connection strings, passwords, emails or hashes.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

async function inspect() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/andhra-circle";

  console.log("==================================================");
  console.log("READ-ONLY DATABASE TELEMETRY INSPECTION");
  console.log("==================================================");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  const currentDbName = mongoose.connection.name;
  const host = mongoose.connection.host;
  console.log(`Connected Host    : ${host}`);
  console.log(`Connected Database: "${currentDbName}"`);
  console.log("--------------------------------------------------");

  const admin = mongoose.connection.db.admin();
  const dbsList = await admin.listDatabases();

  console.log("\n--- DATABASES OVERVIEW ---");
  for (const dbInfo of dbsList.databases) {
    console.log(`Database: "${dbInfo.name}" | Size: ${(dbInfo.sizeOnDisk / 1024).toFixed(1)} KB`);
  }

  // Iterate over target database
  const targetDbs = dbsList.databases.filter(d => !["admin", "local", "config"].includes(d.name));
  for (const dbInfo of targetDbs) {
    const db = mongoose.connection.client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();

    console.log(`\n==================================================`);
    console.log(`DATABASE: "${dbInfo.name}" (${collections.length} collections)`);
    console.log(`==================================================`);

    for (const col of collections) {
      const colHandle = db.collection(col.name);
      const totalCount = await colHandle.countDocuments();
      let activeCount = totalCount;
      let softDeletedCount = 0;

      try {
        activeCount = await colHandle.countDocuments({ deletedAt: null });
        softDeletedCount = await colHandle.countDocuments({ deletedAt: { $ne: null } });
      } catch (_) {
        // Not all collections have deletedAt
      }

      const indexes = await colHandle.indexes();
      const indexNames = indexes.map((idx) => {
        const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(", ");
        return `${idx.name} (${keys})`;
      });

      console.log(`\n  Collection: "${col.name}"`);
      console.log(`    Total Records   : ${totalCount}`);
      if (softDeletedCount > 0 || activeCount !== totalCount) {
        console.log(`    Active / SoftDel: ${activeCount} active | ${softDeletedCount} soft-deleted`);
      }
      console.log(`    Indexes (${indexNames.length}) :`);
      for (const idxName of indexNames) {
        console.log(`      - ${idxName}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("INSPECTION COMPLETE (Read-only, disconnected cleanly)");
  console.log("==================================================");
}

inspect().catch((err) => {
  console.error("DB Inspect Error:", err.message);
  process.exit(1);
});
