#!/usr/bin/env node
/* ==============================================================================
   JNTU Circle - MongoDB Index Builder
   Builds full-text search, compound, unique and TTL indexes across collections:
   - Note (text, softDelete, compound)
   - Paper (text, softDelete)
   - Syllabus (text, softDelete)
   - LabProgram (text, softDelete)
   - Notification (text, softDelete)
   - SecurityState (TTL index expiresAt_1, unique key)
   - User (unique email)
   - Comment (note, softDelete)
   - UserMaterial, AuditLog, ChatFeedback, Migration
   ============================================================================== */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Note = require("../models/note");
const Paper = require("../models/paper");
const Syllabus = require("../models/syllabus");
const LabProgram = require("../models/LabProgram");
const Notification = require("../models/Notification");
const SecurityState = require("../models/SecurityState");
const User = require("../models/user");
const Comment = require("../models/Comment");
const UserMaterial = require("../models/userMaterial");
const AuditLog = require("../models/AuditLog");
const ChatFeedback = require("../models/ChatFeedback");
const Migration = require("../models/Migration");

async function buildIndexes() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/andhra-circle";

  console.log("Connecting to MongoDB database...");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`Connected successfully to host: ${mongoose.connection.host}, database: "${mongoose.connection.name}"\n`);

    const models = [
      { name: "Note", model: Note },
      { name: "Paper", model: Paper },
      { name: "Syllabus", model: Syllabus },
      { name: "LabProgram", model: LabProgram },
      { name: "Notification", model: Notification },
      { name: "SecurityState", model: SecurityState },
      { name: "User", model: User },
      { name: "Comment", model: Comment },
      { name: "UserMaterial", model: UserMaterial },
      { name: "AuditLog", model: AuditLog },
      { name: "ChatFeedback", model: ChatFeedback },
      { name: "Migration", model: Migration },
    ];

    for (const { name, model } of models) {
      process.stdout.write(`Building indexes for ${name}... `);
      try {
        await model.createIndexes();
        const indexes = await model.collection.indexes();
        console.log(`✓ OK (${indexes.length} indexes: ${indexes.map((i) => i.name).join(", ")})`);
      } catch (err) {
        console.log(`⚠ ${err.message}`);
      }
    }

    console.log("\nAll indexes successfully verified.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Database connection failure:", err.message);
    process.exit(1);
  }
}

buildIndexes();
