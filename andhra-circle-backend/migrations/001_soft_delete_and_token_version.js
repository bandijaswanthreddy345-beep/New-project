/**
 * Migration 001: Set defaults for deletedAt and tokenVersion, build compound indexes
 */

const Note = require("../models/note");
const Paper = require("../models/paper");
const Syllabus = require("../models/syllabus");
const LabProgram = require("../models/LabProgram");
const Notification = require("../models/Notification");
const Comment = require("../models/Comment");
const User = require("../models/user");
const logger = require("../utils/logger");

async function up() {
  logger.info("[Migration 001] Running up migration...");

  // 1. Set default deletedAt: null where undefined
  const collections = [
    { model: Note, name: "Note" },
    { model: Paper, name: "Paper" },
    { model: Syllabus, name: "Syllabus" },
    { model: LabProgram, name: "LabProgram" },
    { model: Notification, name: "Notification" },
    { model: Comment, name: "Comment" },
  ];

  for (const { model, name } of collections) {
    const res = await model.updateMany(
      { deletedAt: { $exists: false } },
      { $set: { deletedAt: null, deletedBy: null } }
    );
    logger.info(`[Migration 001] Updated ${name}: ${res.modifiedCount} documents set deletedAt: null`);
    
    // Ensure indexes
    await model.syncIndexes();
    logger.info(`[Migration 001] Synced indexes for ${name}`);
  }

  // 2. Set tokenVersion: 0 where missing on User
  const userRes = await User.updateMany(
    { tokenVersion: { $exists: false } },
    { $set: { tokenVersion: 0 } }
  );
  logger.info(`[Migration 001] Updated User: ${userRes.modifiedCount} documents set tokenVersion: 0`);
  await User.syncIndexes();

  logger.info("[Migration 001] Up migration completed successfully.");
}

async function down() {
  logger.info("[Migration 001] Running down migration...");
  // Reversible operations
  logger.info("[Migration 001] Down migration completed.");
}

module.exports = {
  name: "001_soft_delete_and_token_version",
  up,
  down,
};

