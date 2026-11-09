const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function seedMechanicalSyllabus() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    const jsonPath = path.join(__dirname, "mechanical_syllabus_items.json");
    const items = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    console.log(`Loaded ${items.length} mechanical syllabus items to process.`);

    let inserted = 0;
    let updated = 0;

    for (const item of items) {
      const filter = {
        branch: item.branch,
        semester: item.semester,
        title: item.title,
        ...(item.subjectCode ? { subjectCode: item.subjectCode } : {})
      };

      const res = await Syllabus.findOneAndUpdate(
        filter,
        {
          $set: {
            title: item.title,
            branch: item.branch,
            semester: item.semester,
            description: item.description,
            pdfUrl: item.pdfUrl,
            regulation: item.regulation,
            subject: item.subject,
            subjectCode: item.subjectCode,
          },
          $setOnInsert: {
            views: 0,
            likes: 0,
            downloads: 0,
          }
        },
        { upsert: true, returnDocument: "after", rawResult: true }
      );

      if (res.lastErrorObject && res.lastErrorObject.updatedExisting) {
        updated++;
      } else {
        inserted++;
      }
    }

    console.log(`Seeding complete! Inserted: ${inserted}, Updated: ${updated}`);
    const totalCount = await Syllabus.countDocuments({ branch: "Mechanical Engineering" });
    console.log(`Total Mechanical Engineering syllabus documents in DB: ${totalCount}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

seedMechanicalSyllabus();
