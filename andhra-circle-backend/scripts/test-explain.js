const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../config/db");
const Note = require("../models/note");

async function explainQueries() {
  await connectDB();

  console.log("=== EXPLAIN() BEFORE & AFTER INDEX OPTIMIZATION ===");

  // Query: Filtering by branch and semester, sorted by createdAt desc
  const query = { branch: "CSE", semester: "1-1" };

  // 1. Explain execution without index hint (using default index selection)
  const explainDefault = await Note.find(query).sort({ createdAt: -1 }).explain("executionStats");
  
  console.log("\n--- Execution Stats With New Compound Index ---");
  console.log("Winning Plan Stage:", explainDefault.queryPlanner.winningPlan.stage);
  console.log("Index Name Used:", explainDefault.queryPlanner.winningPlan.inputStage?.indexName || explainDefault.queryPlanner.winningPlan.indexName);
  console.log("Total Documents Examined:", explainDefault.executionStats.totalDocsExamined);
  console.log("Total Keys Examined:", explainDefault.executionStats.totalKeysExamined);
  console.log("Execution Time (ms):", explainDefault.executionStats.executionTimeMillis);

  await mongoose.connection.close();
  process.exit(0);
}

explainQueries().catch((err) => {
  console.error(err);
  process.exit(1);
});

