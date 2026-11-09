const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function checkExisting() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB!");
    const count = await Syllabus.countDocuments();
    console.log(`Total Syllabus documents in DB: ${count}`);
    const sample = await Syllabus.find().limit(5);
    console.log("Sample records:", JSON.stringify(sample, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkExisting();
