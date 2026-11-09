const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function checkCseSemesters() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const records = await Syllabus.find({
      branch: { $regex: /computer science/i }
    });

    console.log(`Found ${records.length} total records for CSE.`);
    const semCounts = {};
    for (const r of records) {
      semCounts[r.semester] = (semCounts[r.semester] || 0) + 1;
    }
    console.log("Semesters found:", semCounts);

    console.log("First 10 records:");
    records.slice(0, 10).forEach(r => console.log(`[Sem: ${r.semester}] Title: "${r.title}"`));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkCseSemesters();
