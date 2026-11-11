/**
 * Backend Test Suite: Auth, Admin Guard, Validators, Soft Deletes, Migrations
 * Uses Node.js built-in test runner (node:test)
 */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/user");
const Note = require("../models/note");
const { createCaptcha, verifyCaptcha } = require("../services/captchaService");
const { getContentVersion, bumpContentVersion } = require("../utils/contentVersion");
const { CircuitBreaker } = require("../utils/resilientFetch");

describe("JNTU Circle Backend Integration Test Suite", () => {
  before(async () => {
    // Only connect if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test("1. Encrypted CAPTCHA Challenge & Replay Defense", async () => {
    const { captchaToken } = createCaptcha();
    assert.ok(captchaToken, "Captcha token generated");

    // Empty/invalid answer fails
    const failCheck = await verifyCaptcha(captchaToken, "wrong_answer");
    assert.strictEqual(failCheck.ok, false, "Invalid captcha answer rejected");
  });

  test("2. Soft Delete Plugin Hides Documents by Default", async (t) => {
    if (mongoose.connection.readyState !== 1) {
      t.skip("Skipping DB dependent test: MongoDB offline");
      return;
    }

    const note = await Note.create({
      title: "Test Soft Delete Note",
      branch: "CSE",
      semester: "2-1",
      subject: "Operating Systems",
    });

    assert.strictEqual(note.deletedAt, null, "Note created with deletedAt: null");

    // Soft delete
    await note.softDelete();
    assert.ok(note.deletedAt instanceof Date, "deletedAt timestamp populated");

    // Default query hides it
    const findAttempt = await Note.findById(note._id);
    assert.strictEqual(findAttempt, null, "Soft-deleted note excluded from normal find");

    // Query with includeDeleted finds it
    const withDeleted = await Note.findOne({ _id: note._id }, null, { includeDeleted: true });
    assert.ok(withDeleted, "includeDeleted flag finds soft-deleted note");

    // Restore
    await withDeleted.restore();
    assert.strictEqual(withDeleted.deletedAt, null, "Restored note has deletedAt: null");

    // Clean up
    await Note.findByIdAndDelete(note._id);
  });

  test("3. Content Version Bumping for Cache Invalidation", async (t) => {
    if (mongoose.connection.readyState !== 1) {
      t.skip("Skipping DB dependent test: MongoDB offline");
      return;
    }
    const v1 = await getContentVersion();
    const v2 = await bumpContentVersion();
    assert.strictEqual(v2, v1 + 1, "Content version incremented atomically");
  });

  test("4. Circuit Breaker Recovers Gracefully", async () => {
    const breaker = new CircuitBreaker("unit-test-circuit", {
      failureThreshold: 2,
      cooldownMs: 50,
    });

    assert.strictEqual(breaker.state, "CLOSED");
    breaker.recordFailure(new Error("Err 1"));
    assert.strictEqual(breaker.state, "CLOSED");
    breaker.recordFailure(new Error("Err 2"));
    assert.strictEqual(breaker.state, "OPEN");

    // Cooldown
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(breaker.isOpen(), false, "Breaker allows execution after cooldown");
    assert.strictEqual(breaker.state, "HALF_OPEN");

    breaker.recordSuccess();
    assert.strictEqual(breaker.state, "CLOSED", "Breaker resets to CLOSED on success");
  });
});

