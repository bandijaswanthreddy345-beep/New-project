const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes\\1-1";
const BACKEND_UPLOADS = path.join(__dirname, "../uploads");
const ROOT_UPLOADS = path.join(__dirname, "../../uploads");

function copyFileSafe(srcPath, destName) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file does not exist: ${srcPath}`);
  }

  [BACKEND_UPLOADS, ROOT_UPLOADS].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dest = path.join(dir, destName);
    fs.copyFileSync(srcPath, dest);
  });

  const size = fs.statSync(path.join(BACKEND_UPLOADS, destName)).size;
  console.log(`  [COPIED] -> ${destName} (${(size / 1024).toFixed(1)} KB)`);
  return `/uploads/${destName}`;
}

async function mergePdfs(pdfPaths, destName) {
  const mergedPdf = await PDFDocument.create();
  for (const p of pdfPaths) {
    if (!fs.existsSync(p)) {
      throw new Error(`PDF to merge does not exist: ${p}`);
    }
    const bytes = fs.readFileSync(p);
    const pdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  const mergedBytes = await mergedPdf.save();

  [BACKEND_UPLOADS, ROOT_UPLOADS].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dest = path.join(dir, destName);
    fs.writeFileSync(dest, mergedBytes);
  });

  console.log(
    `  [MERGED] -> ${destName} (${(mergedBytes.length / 1024).toFixed(1)} KB, from ${pdfPaths.length} files)`
  );
  return `/uploads/${destName}`;
}

async function uploadAiml1_1SeparateBEEE() {
  console.log("==================================================");
  console.log("STARTING AIML 1-1 RE-INGESTION WITH SEPARATE PART-A & PART-B");
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully!\n");

  // 1. CLEANUP UNRELATED DATA:
  // Remove Lab items mistakenly created in Note collection for AIML 1-1
  console.log("Cleaning up incorrect Note records (labs mistakenly added as notes)...");
  const delLabsFromNotes = await Note.deleteMany({
    branch: "AIML",
    semester: "1-1",
    subjectCode: { $in: ["23A05101P", "23A56101P"] }
  });
  console.log(`  [CLEANUP] Deleted ${delLabsFromNotes.deletedCount} lab records from Note collection.`);

  // Remove old combined BEEE note record
  const delCombinedBEEE = await Note.deleteMany({
    branch: "AIML",
    semester: "1-1",
    subjectCode: "23A02101T"
  });
  console.log(`  [CLEANUP] Deleted ${delCombinedBEEE.deletedCount} combined BEEE note records.`);

  // Remove any lab records that might not be in the folder if any
  // Note: 23A02101P was from 2026-11-14, let's keep only what user provided or verify
  // User provided in 1-1:
  // - 23A54101 (Linear Algebra & Calculus)
  // - 23A56101T (Engineering Physics)
  // - 23A05101T (Introduction to Programming)
  // - 23A03101T (Engineering Graphics)
  // - 23A02101T Part-A (Basic Electrical & Electronics)
  // - 23A02101T Part-B (Electrical & Electronics Engineering)
  // - 23A05101P (computer programming lab)
  // - 23A56101P (Engineering Physics Lab)

  // 2. PROCESS PART-A: Basic Electrical & Electronics Engineering (Part-A)
  console.log("\nProcessing Theory: 23A02101T (Part-A) - Basic Electrical Engineering");
  const partADir = path.join(SOURCE_BASE, "23A02101T(Basic Electrical & Electronics)3 part-A");
  const partAFiles = [
    { file: "BEEE_Unit1_DC_and_AC_Circuits.pdf", mod: "Unit 1: DC and AC Circuits", dest: "23A02101T_PartA_Unit_1_DC_and_AC_Circuits.pdf" },
    { file: "BEEE_Unit2_Machines_and_Measuring_Instruments.pdf", mod: "Unit 2: Machines and Measuring Instruments", dest: "23A02101T_PartA_Unit_2_Machines_and_Measuring_Instruments.pdf" },
    { file: "BEEE_Unit3_Energy_Resources_Bill_and_Safety.pdf", mod: "Unit 3: Energy Resources, Bill and Safety", dest: "23A02101T_PartA_Unit_3_Energy_Resources_Bill_and_Safety.pdf" }
  ];

  const partASources = [];
  const partAUrls = [];
  for (const pf of partAFiles) {
    const src = path.join(partADir, pf.file);
    partASources.push(src);
    partAUrls.push(copyFileSafe(src, pf.dest));
  }
  const partAMergedUrl = await mergePdfs(partASources, "23A02101T_AIML_PartA_Complete_Notes.pdf");

  const partADoc = await Note.create({
    title: "Notes",
    branch: "AIML",
    semester: "1-1",
    regulation: "R23",
    subject: "Basic Electrical and Electronics Engineering (Part-A)",
    subjectCode: "23A02101T",
    description: "JNTUA R23 Basic Electrical Engineering (Part-A) complete lecture notes covering DC & AC Circuits, Electrical Machines & Measuring Instruments, and Energy Resources, Electricity Bill & Safety Practices.",
    credits: "1.5",
    module1: partAFiles[0].mod,
    module2: partAFiles[1].mod,
    module3: partAFiles[2].mod,
    module4: "",
    module5: "",
    module1Pdf: partAUrls[0],
    module2Pdf: partAUrls[1],
    module3Pdf: partAUrls[2],
    module4Pdf: "",
    module5Pdf: "",
    pdfUrl: partAMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Part-A Note: ${partADoc._id}`);

  // 3. PROCESS PART-B: Basic Electrical and Electronics Engineering (Part-B)
  console.log("\nProcessing Theory: 23A02101T (Part-B) - Basic Electronics Engineering");
  const partBDir = path.join(SOURCE_BASE, "23A02101T(Electrical & Electronics Engineering)part-B");
  const partBFiles = [
    { file: "Unit_I_Semiconductor_Devices.pdf", mod: "Unit 1: Semiconductor Devices", dest: "23A02101T_PartB_Unit_1_Semiconductor_Devices.pdf" },
    { file: "Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf", mod: "Unit 2: Basic Electronic Circuits and Instrumentation", dest: "23A02101T_PartB_Unit_2_Basic_Electronic_Circuits.pdf" },
    { file: "Unit_III_Digital_Electronics.pdf", mod: "Unit 3: Digital Electronics", dest: "23A02101T_PartB_Unit_3_Digital_Electronics.pdf" }
  ];

  const partBSources = [];
  const partBUrls = [];
  for (const pf of partBFiles) {
    const src = path.join(partBDir, pf.file);
    partBSources.push(src);
    partBUrls.push(copyFileSafe(src, pf.dest));
  }
  const partBMergedUrl = await mergePdfs(partBSources, "23A02101T_AIML_PartB_Complete_Notes.pdf");

  const partBDoc = await Note.create({
    title: "Notes",
    branch: "AIML",
    semester: "1-1",
    regulation: "R23",
    subject: "Basic Electrical and Electronics Engineering (Part-B)",
    subjectCode: "23A02101T",
    description: "JNTUA R23 Basic Electronics Engineering (Part-B) complete study notes covering Semiconductor Devices (Diodes, BJTs, MOSFETs), Basic Electronic Circuits & Instrumentation (Rectifiers, Amplifiers, CRO), and Digital Electronics (Logic Gates, Number Systems, Flip-Flops).",
    credits: "1.5",
    module1: partBFiles[0].mod,
    module2: partBFiles[1].mod,
    module3: partBFiles[2].mod,
    module4: "",
    module5: "",
    module1Pdf: partBUrls[0],
    module2Pdf: partBUrls[1],
    module3Pdf: partBUrls[2],
    module4Pdf: "",
    module5Pdf: "",
    pdfUrl: partBMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Part-B Note: ${partBDoc._id}`);

  // Invalidate in-memory feed cache
  invalidateFeedCache();

  // Print final status for AIML 1-1
  console.log("\n==================================================");
  console.log("FINAL STATUS OF AIML 1-1 IN DATABASE");
  console.log("==================================================");
  const finalNotes = await Note.find({ branch: "AIML", semester: "1-1" });
  console.log(`AIML 1-1 Notes (${finalNotes.length}):`);
  finalNotes.forEach(n => console.log(`  - [${n.subjectCode}] ${n.subject} (Credits: ${n.credits}) -> PDF: ${n.pdfUrl}`));

  const finalLabs = await LabProgram.find({ branch: "AIML", semester: "1-1" });
  console.log(`AIML 1-1 Labs (${finalLabs.length}):`);
  finalLabs.forEach(l => console.log(`  - [${l.subjectCode}] ${l.subject} (Credits: ${l.credits}) -> PDF: ${l.pdfUrl}`));

  await mongoose.disconnect();
  console.log("\nDone!");
}

uploadAiml1_1SeparateBEEE().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
