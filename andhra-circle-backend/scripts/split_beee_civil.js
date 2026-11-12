const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\civil notes\\1-1";
const TARGET_UPLOADS = path.join(__dirname, "../uploads");
const ROOT_UPLOADS = path.join(__dirname, "../../uploads");

function copyFileSafe(srcPath, destName) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file does not exist: ${srcPath}`);
  }
  const destPath = path.join(TARGET_UPLOADS, destName);
  const rootDestPath = path.join(ROOT_UPLOADS, destName);

  fs.copyFileSync(srcPath, destPath);
  fs.copyFileSync(srcPath, rootDestPath);

  const size = fs.statSync(destPath).size;
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
  const destPath = path.join(TARGET_UPLOADS, destName);
  const rootDestPath = path.join(ROOT_UPLOADS, destName);

  fs.writeFileSync(destPath, mergedBytes);
  fs.writeFileSync(rootDestPath, mergedBytes);

  console.log(
    `  [MERGED] -> ${destName} (${(mergedBytes.length / 1024).toFixed(1)} KB, from ${pdfPaths.length} files)`
  );
  return `/uploads/${destName}`;
}

async function splitBEEE() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const dirPartA = path.join(SOURCE_BASE, "23A02101T(Basic Electrical & Electronics)3 part-A");
  const dirPartB = path.join(SOURCE_BASE, "23A02101T(Electrical & Electronics Engineering)1.5 part_B");

  // Remove the old combined single note for CE 1-1
  await Note.deleteMany({
    branch: "CE",
    semester: "1-1",
    subjectCode: "23A02101T"
  });
  console.log("Cleared old combined CE 23A02101T record.");

  // 1. PART-A: Basic Electrical Engineering
  console.log("\n--- PROCESSING CE 1-1 BEEE PART-A ---");
  const partAFiles = [
    { name: "Unit 1: DC and AC Circuits", file: path.join(dirPartA, "BEEE_Unit1_DC_and_AC_Circuits.pdf"), dest: "23A02101T_PartA_Unit_1_DC_and_AC_Circuits.pdf" },
    { name: "Unit 2: Machines and Measuring Instruments", file: path.join(dirPartA, "BEEE_Unit2_Machines_and_Measuring_Instruments.pdf"), dest: "23A02101T_PartA_Unit_2_Machines_and_Measuring_Instruments.pdf" },
    { name: "Unit 3: Energy Resources, Bill and Safety", file: path.join(dirPartA, "BEEE_Unit3_Energy_Resources_Bill_and_Safety.pdf"), dest: "23A02101T_PartA_Unit_3_Energy_Resources_Bill_and_Safety.pdf" },
  ];

  const partAPaths = [];
  const partAUrls = [];
  for (const item of partAFiles) {
    const url = copyFileSafe(item.file, item.dest);
    partAPaths.push(item.file);
    partAUrls.push(url);
  }

  const mergedPartAUrl = await mergePdfs(partAPaths, "23A02101T_PartA_Complete_Notes.pdf");

  const partADoc = await Note.create({
    title: "Notes",
    branch: "CE",
    semester: "1-1",
    regulation: "R23",
    subject: "Basic Electrical and Electronics Engineering (Part-A)",
    subjectCode: "23A02101T",
    credits: "1.5",
    description: "JNTUA R23 Basic Electrical Engineering (Part-A) complete lecture notes covering DC & AC Circuits, Electrical Machines & Measuring Instruments, and Energy Resources, Electricity Bill & Safety Practices.",
    module1: partAFiles[0].name,
    module1Pdf: partAUrls[0],
    module2: partAFiles[1].name,
    module2Pdf: partAUrls[1],
    module3: partAFiles[2].name,
    module3Pdf: partAUrls[2],
    module4: "",
    module4Pdf: "",
    module5: "",
    module5Pdf: "",
    pdfUrl: mergedPartAUrl,
  });
  console.log(`[CREATED PART-A] ID: ${partADoc._id} - ${partADoc.subject}`);

  // 2. PART-B: Basic Electronics Engineering
  console.log("\n--- PROCESSING CE 1-1 BEEE PART-B ---");
  const partBFiles = [
    { name: "Unit 1: Semiconductor Devices", file: path.join(dirPartB, "Unit_I_Semiconductor_Devices.pdf"), dest: "23A02101T_PartB_Unit_1_Semiconductor_Devices.pdf" },
    { name: "Unit 2: Basic Electronic Circuits and Instrumentation", file: path.join(dirPartB, "Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf"), dest: "23A02101T_PartB_Unit_2_Basic_Electronic_Circuits.pdf" },
    { name: "Unit 3: Digital Electronics", file: path.join(dirPartB, "Unit_III_Digital_Electronics.pdf"), dest: "23A02101T_PartB_Unit_3_Digital_Electronics.pdf" },
  ];

  const partBPaths = [];
  const partBUrls = [];
  for (const item of partBFiles) {
    const url = copyFileSafe(item.file, item.dest);
    partBPaths.push(item.file);
    partBUrls.push(url);
  }

  const mergedPartBUrl = await mergePdfs(partBPaths, "23A02101T_PartB_Complete_Notes.pdf");

  const partBDoc = await Note.create({
    title: "Notes",
    branch: "CE",
    semester: "1-1",
    regulation: "R23",
    subject: "Basic Electrical and Electronics Engineering (Part-B)",
    subjectCode: "23A02101T",
    credits: "1.5",
    description: "JNTUA R23 Basic Electronics Engineering (Part-B) complete study notes covering Semiconductor Devices (Diodes, BJTs, MOSFETs), Basic Electronic Circuits & Instrumentation (Rectifiers, Amplifiers, CRO), and Digital Electronics (Logic Gates, Number Systems, Flip-Flops).",
    module1: partBFiles[0].name,
    module1Pdf: partBUrls[0],
    module2: partBFiles[1].name,
    module2Pdf: partBUrls[1],
    module3: partBFiles[2].name,
    module3Pdf: partBUrls[2],
    module4: "",
    module4Pdf: "",
    module5: "",
    module5Pdf: "",
    pdfUrl: mergedPartBUrl,
  });
  console.log(`[CREATED PART-B] ID: ${partBDoc._id} - ${partBDoc.subject}`);

  await mongoose.disconnect();
  console.log("\nDone! Disconnected from MongoDB.");
}

splitBEEE().catch(console.error);
