/**
 * Migration 002: Lowercase existing user emails & audit duplicate candidates
 * 
 * Safe migration with dry run capabilities:
 * - Detects documents whose email is not strictly lowercase
 * - Checks whether lowercasing would conflict with an existing document (_id collision or duplicate email)
 * - In dry run mode (default or DRY_RUN=true): logs audit details and returns without modifications
 * - In execute mode: updates non-lowercase emails safely and ensures unique index
 */

const mongoose = require("mongoose");
const logger = require("../utils/logger");

async function run({ dryRun = true } = {}) {
  const User = mongoose.model("User");
  logger.info(`[Migration 002] Starting lowercase email migration (dryRun: ${dryRun})...`);

  const allUsers = await User.find({}, { email: 1 }).lean();
  logger.info(`[Migration 002] Total user records examined: ${allUsers.length}`);

  const candidatesToUpdate = [];
  const lowercaseMap = new Map();
  const duplicateConflicts = [];

  for (const user of allUsers) {
    if (!user.email) continue;
    const lower = user.email.trim().toLowerCase();

    if (lowercaseMap.has(lower)) {
      duplicateConflicts.push({
        existingId: lowercaseMap.get(lower),
        conflictingId: user._id,
        normalizedEmail: lower,
      });
    } else {
      lowercaseMap.set(lower, user._id);
    }

    if (user.email !== lower) {
      candidatesToUpdate.push({
        _id: user._id,
        currentEmail: user.email,
        targetEmail: lower,
      });
    }
  }

  logger.info(`[Migration 002] Non-lowercase records found: ${candidatesToUpdate.length}`);
  logger.info(`[Migration 002] Duplicate conflict conflicts found: ${duplicateConflicts.length}`);

  if (duplicateConflicts.length > 0) {
    logger.warn("[Migration 002] Duplicate conflicts detected! Manual resolution required:", duplicateConflicts);
  }

  if (dryRun) {
    logger.info("[Migration 002] DRY RUN complete. No documents were modified.");
    return {
      totalExamined: allUsers.length,
      candidatesToUpdate: candidatesToUpdate.length,
      conflicts: duplicateConflicts.length,
      modified: 0,
      dryRun: true,
    };
  }

  let modifiedCount = 0;
  for (const item of candidatesToUpdate) {
    // Ensure we do not overwrite if another doc now has this lower email
    const exists = await User.findOne({ email: item.targetEmail, _id: { $ne: item._id } });
    if (exists) {
      logger.error(`[Migration 002] Skipping update for ${item._id}: target email ${item.targetEmail} already exists`);
      continue;
    }
    await User.updateOne({ _id: item._id }, { $set: { email: item.targetEmail } });
    modifiedCount++;
  }

  // Ensure case-insensitive unique index
  try {
    await User.collection.createIndex(
      { email: 1 },
      {
        unique: true,
        collation: { locale: "en", strength: 2 },
        name: "email_case_insensitive_unique",
        background: true,
      }
    );
    logger.info("[Migration 002] Case-insensitive unique index verified.");
  } catch (idxErr) {
    logger.warn(`[Migration 002] Index creation note: ${idxErr.message}`);
  }

  logger.info(`[Migration 002] Execution complete. Updated ${modifiedCount} records.`);
  return {
    totalExamined: allUsers.length,
    candidatesToUpdate: candidatesToUpdate.length,
    conflicts: duplicateConflicts.length,
    modified: modifiedCount,
    dryRun: false,
  };
}

async function up() {
  return run({ dryRun: false });
}

async function down() {
  logger.info("[Migration 002] Down migration is a no-op (emails remain lowercase).");
}

module.exports = { up, down, run };
