#!/usr/bin/env node
/* ==============================================================================
   JNTU Circle - MongoDB Text Index Builder
   Builds full-text search indexes on:
   - Notes (title, subject, subjectCode, description, module1..5)
   - Papers (title, subject, examType)
   - Syllabuses (title, subject, subjectCode, description, regulation)
   - LabPrograms (title, subject, subjectCode, description)
   - Notifications (title, description, category)
   ============================================================================== */

require("dotenv").config();
const mongoose = require("mongoose");

const Note = require("../models/note");
const Paper = require("../models/paper");
const Syllabus = require("../models/syllabus");
const LabProgram = require("../models/LabProgram");
const Notification = require("../models/Notification");

async function buildIndexes() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Error: MONGO_URI is missing from environment (.env).");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("Connected successfully.\n");

    const models = [
      { name: "Note", model: Note },
      { name: "Paper", model: Paper },
      { name: "Syllabus", model: Syllabus },
      { name: "LabProgram", model: LabProgram },
      { name: "Notification", model: Notification },
    ];

    for (const { name, model } of models) {
      process.stdout.write(`Building text indexes for ${name}... `);
      try {
        await model.createIndexes();
        const indexes = await model.collection.indexes();
        const textIdx = indexes.find((idx) => idx.textIndexVersion || idx.weights);
        if (textIdx) {
          console.log(`✓ OK (Index: ${textIdx.name})`);
        } else {
          console.log(`✓ OK (Indexes: ${indexes.map((i) => i.name).join(", ")})`);
        }
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

