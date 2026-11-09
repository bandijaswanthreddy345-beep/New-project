const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function checkNumberedTitles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const records = await Syllabus.find({
      branch: { $regex: /computer science/i },
      title: { $regex: /^[0-9]{2}\s/ }
    });

    console.log(`Found ${records.length} CSE records with serial numbers at the front.`);
    records.slice(0, 10).forEach(r => console.log(`[Sem: ${r.semester}] Title: "${r.title}" | PDF: ${r.pdfUrl}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkNumberedTitles();
