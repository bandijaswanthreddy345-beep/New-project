const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function syncModulePdfs() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/andhra-circle";
  await mongoose.connect(uri);

  const notesCol = mongoose.connection.db.collection("notes");
  const notes = await notesCol.find({}).toArray();

  let updated = 0;
  for (const n of notes) {
    if (n.pdfUrl) {
      const updateFields = {};
      if (!n.module1Pdf) {
        updateFields.module1Pdf = n.pdfUrl;
      }
      if (!n.module1Title) {
        updateFields.module1Title = "Unit 1: Course Syllabus & Complete Study Material";
      }
      if (Object.keys(updateFields).length > 0) {
        await notesCol.updateOne({ _id: n._id }, { $set: updateFields });
        updated++;
      }
    }
  }

  console.log(`Updated ${updated} notes out of ${notes.length} in database "${mongoose.connection.name}".`);
  const sample = await notesCol.findOne({ pdfUrl: { $exists: true, $ne: "" } });
  console.log("Sample Note Record Verification:");
  console.log({
    _id: sample._id.toString(),
    subject: sample.subject,
    pdfUrl: sample.pdfUrl,
    module1Pdf: sample.module1Pdf,
    module1Title: sample.module1Title,
  });

  await mongoose.disconnect();
}

syncModulePdfs().catch((err) => {
  console.error("Error syncing module PDFs:", err);
  process.exit(1);
});

