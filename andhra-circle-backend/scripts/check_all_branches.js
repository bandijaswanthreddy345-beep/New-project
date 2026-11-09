const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function checkAllBranches() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const branches = await Syllabus.distinct("branch");
    console.log("Distinct branches in DB:", branches);

    for (const b of branches) {
      const records = await Syllabus.find({ branch: b });
      const semMap = {};
      for (const r of records) {
        semMap[r.semester] = (semMap[r.semester] || 0) + 1;
      }
      console.log(`\nBranch: "${b}" (Total: ${records.length})`);
      console.log("Semesters:", semMap);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkAllBranches();
