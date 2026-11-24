const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

async function migrateEeeLabs() {
  console.log("==================================================");
  console.log("STARTING MIGRATION: EEE 1-1 & 2-1 LAB MANUALS");
  console.log("Moving lab manuals from Note to LabProgram collection");
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test",
  });
  console.log("Connected to MongoDB successfully!\n");

  const labDefs = [
    {
      subjectCode: "23A51202P",
      subject: "Chemistry Laboratory",
      title: "Chemistry Lab Manual & Record",
      branch: "EEE",
      semester: "1-1",
      regulation: "R23",
      pdfUrl: "/uploads/EEE_23A51202P_manual_1795442521303_900001.pdf",
      description:
        "Official laboratory manual, handwritten experimental records, and procedures for Chemistry Laboratory (23A51202P) under JNTU R23 Curriculum for Electrical & Electronics Engineering (EEE) 1-1 semester.",
    },
    {
      subjectCode: "23A05101P",
      subject: "Computer Programming Laboratory",
      title: "Computer Programming Lab Manual & Programs",
      branch: "EEE",
      semester: "1-1",
      regulation: "R23",
      pdfUrl: "/uploads/EEE_23A05101P_manual_1795442520955_888660.pdf",
      description:
        "Official laboratory manual, C programming exercises, source codes, and outputs for Computer Programming Laboratory (23A05101P) under JNTU R23 Curriculum for Electrical & Electronics Engineering (EEE) 1-1 semester.",
    },
    {
      subjectCode: "23A02302P",
      subject: "Electrical Circuit Analysis -II and Simulation Lab",
      title: "Electrical Circuit Analysis -II & Simulation Lab Manual",
      branch: "EEE",
      semester: "2-1",
      regulation: "R23",
      pdfUrl: "/uploads/EEE_2-1_23A02302P_Electrical_Circuit_Analysis_II_Simulation_Lab_Manual.pdf",
      description:
        "Laboratory manual, simulation procedures (MATLAB/Simulink/PSPICE), circuit diagrams, and experimental inputs & outputs for Electrical Circuit Analysis -II and Simulation Lab (23A02302P) under JNTU R23 Curriculum for EEE 2-1 semester.",
    },
    {
      subjectCode: "23A02303P",
      subject: "DC Machines & Transformers Lab",
      title: "DC Machines & Transformers Lab Manual",
      branch: "EEE",
      semester: "2-1",
      regulation: "R23",
      pdfUrl: "/uploads/EEE_2-1_23A02303P_DC_Machines_and_Transformers_Lab_Manual.pdf",
      description:
        "Comprehensive laboratory manual, circuit connections, testing procedures, calculations, and experimental input/output data for DC Machines & Transformers Lab (23A02303P) under JNTU R23 Curriculum for EEE 2-1 semester.",
    },
  ];

  console.log("1. Upserting into LabProgram collection...");
  for (const lab of labDefs) {
    const existing = await LabProgram.findOne({
      branch: lab.branch,
      semester: lab.semester,
      subjectCode: lab.subjectCode,
    });

    if (existing) {
      existing.title = lab.title;
      existing.subject = lab.subject;
      existing.regulation = lab.regulation;
      existing.pdfUrl = lab.pdfUrl;
      existing.description = lab.description;
      await existing.save();
      console.log(`  [UPDATED LAB] ${lab.subjectCode} (${lab.semester}) -> ${existing._id}`);
    } else {
      const created = await LabProgram.create({
        title: lab.title,
        branch: lab.branch,
        semester: lab.semester,
        regulation: lab.regulation,
        subject: lab.subject,
        subjectCode: lab.subjectCode,
        description: lab.description,
        pdfUrl: lab.pdfUrl,
        likes: 0,
        views: 0,
        downloads: 0,
      });
      console.log(`  [CREATED LAB] ${lab.subjectCode} (${lab.semester}) -> ${created._id}`);
    }
  }

  console.log("\n2. Removing lab manuals from Note collection...");
  const labCodes = labDefs.map((l) => l.subjectCode);
  const deletedNotes = await Note.deleteMany({
    branch: "EEE",
    subjectCode: { $in: labCodes },
  });
  console.log(`  [CLEANUP] Deleted ${deletedNotes.deletedCount} lab manual documents from Note collection.`);

  console.log("\n3. Invalidating Feed Cache...");
  if (typeof invalidateFeedCache === "function") {
    invalidateFeedCache();
    console.log("  [CACHE] In-memory feed cache invalidated.");
  }

  console.log("\n4. Verifying Final Database State:");
  const finalNotes11 = await Note.find({ branch: "EEE", semester: "1-1" });
  console.log(`  EEE 1-1 Pure Theory Notes Count: ${finalNotes11.length}`);
  finalNotes11.forEach((n) => console.log(`    - [${n.subjectCode}] ${n.subject}`));

  const finalNotes21 = await Note.find({ branch: "EEE", semester: "2-1" });
  console.log(`  EEE 2-1 Pure Theory Notes Count: ${finalNotes21.length}`);
  finalNotes21.forEach((n) => console.log(`    - [${n.subjectCode}] ${n.subject}`));

  const finalLabs = await LabProgram.find({ branch: "EEE" }).sort({ semester: 1 });
  console.log(`\n  EEE Lab Programs Count in LabProgram collection: ${finalLabs.length}`);
  finalLabs.forEach((l) =>
    console.log(`    - [${l.semester}] [${l.subjectCode}] ${l.subject} (${l.title})`)
  );

  await mongoose.disconnect();
  console.log("\nMigration completed successfully!");
}

migrateEeeLabs().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
