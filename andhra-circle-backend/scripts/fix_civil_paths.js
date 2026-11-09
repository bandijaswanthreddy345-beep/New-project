const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function fixCivilPaths() {
  try {
    const civilDir = path.join(__dirname, "../uploads/civil");
    const uploadsDir = path.join(__dirname, "../uploads");

    if (fs.existsSync(civilDir)) {
      const files = fs.readdirSync(civilDir);
      console.log(`Copying ${files.length} files from uploads/civil to uploads/...`);
      for (const file of files) {
        const src = path.join(civilDir, file);
        const dst = path.join(uploadsDir, file);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dst);
        }
      }
      console.log(`Successfully copied ${files.length} files to uploads/ root.`);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");

    // Update all Civil Engineering records so pdfUrl is /uploads/<filename>
    const civilRecords = await Syllabus.find({ branch: "Civil Engineering" });
    console.log(`Found ${civilRecords.length} Civil Engineering records in DB.`);

    let updatedCount = 0;
    for (const record of civilRecords) {
      if (record.pdfUrl && record.pdfUrl.includes("/uploads/civil/")) {
        const newUrl = record.pdfUrl.replace("/uploads/civil/", "/uploads/");
        record.pdfUrl = newUrl;
        await record.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} records to point to /uploads/<filename>`);
    
    // Check one sample
    const sample = await Syllabus.findOne({ branch: "Civil Engineering" });
    console.log("Sample updated record:", {
      title: sample.title,
      subjectCode: sample.subjectCode,
      pdfUrl: sample.pdfUrl,
      semester: sample.semester
    });

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing paths:", err);
    process.exit(1);
  }
}

fixCivilPaths();
