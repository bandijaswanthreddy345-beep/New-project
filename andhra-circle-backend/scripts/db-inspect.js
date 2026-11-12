/**
 * scripts/db-inspect.js
 * Read-only database telemetry inspection tool.
 * Connects with the app's settings and prints:
 * - All visible databases on the cluster
 * - Document counts for each collection
 * - Index names for each collection
 * NEVER prints document content, passwords, emails or hashes.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

async function inspect() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("ERROR: MONGO_URI not found in environment.");
    process.exit(1);
  }

  // Parse connection URI safely without logging credentials
  const sanitizedUri = uri.replace(/^mongodb(?:\+srv)?:\/\/[^@]+@/, "mongodb://***:***@");
  console.log("==================================================");
  console.log("READ-ONLY DATABASE TELEMETRY INSPECTION");
  console.log("==================================================");
  console.log("Connection URI (sanitized):", sanitizedUri);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  const currentDbName = mongoose.connection.name;
  const host = mongoose.connection.host;
  console.log(`Connected Cluster Host: ${host}`);
  console.log(`Connected Database: "${currentDbName}"`);
  console.log("--------------------------------------------------");

  const admin = mongoose.connection.db.admin();
  const dbsList = await admin.listDatabases();

  console.log("\n--- CLUSTER DATABASES OVERVIEW ---");
  for (const dbInfo of dbsList.databases) {
    console.log(`Database: "${dbInfo.name}" | Size: ${(dbInfo.sizeOnDisk / 1024).toFixed(1)} KB | Empty: ${dbInfo.empty}`);
  }

  // Iterate over non-system databases
  for (const dbInfo of dbsList.databases) {
    if (["admin", "local", "config"].includes(dbInfo.name)) continue;

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

