/**
 * Standalone Migration Runner
 * Usage: node migrations/runner.js [up|down]
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const Migration = require("../models/Migration");
const logger = require("../utils/logger");

async function run() {
  const direction = process.argv[2] || "up";
  logger.info(`Starting database migrations (direction: ${direction})...`);

  await connectDB();

  // Load all migration files sorted alphabetically
  const migrationFiles = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".js") && file !== "runner.js")
    .sort();

  if (direction === "up") {
    for (const file of migrationFiles) {
      const migration = require(path.join(__dirname, file));
      const migrationName = migration.name || file.replace(/\.js$/, "");

      const alreadyApplied = await Migration.findOne({ name: migrationName }).lean();
      if (alreadyApplied) {
        logger.info(`Skipping already applied migration: ${migrationName}`);
        continue;
      }

      logger.info(`Applying migration: ${migrationName}...`);
      await migration.up();
      await Migration.create({ name: migrationName, appliedAt: new Date() });
      logger.info(`Successfully recorded migration: ${migrationName}`);
    }
  } else if (direction === "down") {
    // Revert the latest migration
    const latestApplied = await Migration.findOne().sort({ appliedAt: -1 }).lean();
    if (!latestApplied) {
      logger.info("No applied migrations found to revert.");
    } else {
      const file = migrationFiles.find((f) => f.includes(latestApplied.name));
      if (file) {
        const migration = require(path.join(__dirname, file));
        logger.info(`Reverting migration: ${latestApplied.name}...`);
        if (typeof migration.down === "function") {
          await migration.down();
        }
        await Migration.deleteOne({ name: latestApplied.name });
        logger.info(`Reverted migration: ${latestApplied.name}`);
      }
    }
  }

  logger.info("Migration runner completed.");
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  logger.error("Migration runner failed", { error: err.message, stack: err.stack });
  process.exit(1);
});

