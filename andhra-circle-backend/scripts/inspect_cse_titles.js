const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function inspectCseTitles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const records = await Syllabus.find({
      branch: { $regex: /computer science/i },
      semester: { $in: ["3-1", "3-2", "4-1", "4-2", "5", "6", "7", "8"] }
    });

    console.log(`Found ${records.length} records for CSE in 3rd & 4th year.`);
    for (const r of records) {
      console.log(`[Sem: ${r.semester}] Title: "${r.title}" | Subject: "${r.subject}" | Code: "${r.subjectCode}"`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

inspectCseTitles();
