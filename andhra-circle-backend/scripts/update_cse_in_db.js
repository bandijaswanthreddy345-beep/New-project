const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function updateCseInDb() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    // 1. Remove previous incorrectly numbered CSE records
    const deleteResult = await Syllabus.deleteMany({
      branch: { $regex: /computer science/i },
      title: { $regex: /^[0-9]{2}\s/ }
    });
    console.log(`Deleted ${deleteResult.deletedCount} numbered records.`);

    // 2. Load clean items
    const jsonPath = path.join(__dirname, "cse_fixed_syllabus_items.json");
    const items = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    console.log(`Loaded ${items.length} clean CSE syllabus items to insert.`);

    let inserted = 0;
    let updated = 0;

    for (const item of items) {
      const filter = {
        branch: item.branch,
        semester: item.semester,
        title: item.title,
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
            subjectCode: item.subjectCode || "",
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

    // Check count by semester for CSE
    const cseRecords = await Syllabus.find({ branch: { $regex: /computer science/i } });
    console.log(`Total CSE syllabus records in DB: ${cseRecords.length}`);
    const semMap = {};
    for (const r of cseRecords) {
      semMap[r.semester] = (semMap[r.semester] || 0) + 1;
    }
    console.log("CSE counts by semester in DB:", semMap);

    // Verify no records have leading digits
    const remainingNumbered = await Syllabus.countDocuments({
      branch: { $regex: /computer science/i },
      title: { $regex: /^[0-9]{2}\s/ }
    });
    console.log(`Remaining numbered CSE titles in DB: ${remainingNumbered}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Error updating CSE in DB:", error);
    process.exit(1);
  }
}

updateCseInDb();
