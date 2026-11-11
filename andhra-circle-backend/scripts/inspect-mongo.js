const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../config/db");

async function inspectDb() {
  await connectDB();
  console.log("--- CONNECTED DB DETAILS ---");
  console.log("Current Connected Database Name:", mongoose.connection.name);
  console.log("Database Host:", mongoose.connection.host);

  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log("\n--- ALL DATABASES ON THIS ATLAS CLUSTER ---");
  for (const db of dbs.databases) {
    console.log(`- Database: "${db.name}" (sizeOnDisk: ${db.sizeOnDisk} bytes)`);
  }

  console.log(`\n--- COLLECTIONS IN CONNECTED DATABASE "${mongoose.connection.name}" ---`);
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    const totalCount = await mongoose.connection.db.collection(col.name).countDocuments();
    const activeCount = await mongoose.connection.db.collection(col.name).countDocuments({ deletedAt: null });
    const softDeletedCount = await mongoose.connection.db.collection(col.name).countDocuments({ deletedAt: { $ne: null } });
    console.log(`- "${col.name}": total=${totalCount}, active=${activeCount}, softDeleted=${softDeletedCount}`);
  }

  // Also check if any other database on the cluster has collections
  for (const db of dbs.databases) {
    if (db.name !== mongoose.connection.name && !["admin", "local", "config"].includes(db.name)) {
      console.log(`\n--- COLLECTIONS IN OTHER DATABASE "${db.name}" ---`);
      const otherDb = mongoose.connection.client.db(db.name);
      const otherCols = await otherDb.listCollections().toArray();
      for (const col of otherCols) {
        const count = await otherDb.collection(col.name).countDocuments();
        console.log(`- "${col.name}": ${count} documents`);
      }
    }
  }

  await mongoose.connection.close();
  process.exit(0);
}

inspectDb().catch((err) => {
  console.error(err);
  process.exit(1);
});

