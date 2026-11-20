const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes\\1-2";
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

async function uploadAiml1_2() {
  console.log("==================================================");
  console.log("STARTING AIML 1-2 INGESTION FROM USER DIRECTORY");
  console.log(`Source: ${SOURCE_BASE}`);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`User directory not found: ${SOURCE_BASE}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test"
  });
  console.log("Connected to MongoDB successfully!\n");

  // Remove any preexisting AIML 1-2 records to avoid duplicates
  console.log("Cleaning any previous AIML 1-2 records...");
  const delNotes = await Note.deleteMany({ branch: "AIML", semester: "1-2" });
  const delLabs = await LabProgram.deleteMany({ branch: "AIML", semester: "1-2" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} existing notes, ${delLabs.deletedCount} existing labs.\n`);

  // =========================================================================
  // 1. Basic Civil & Mechanical Engineering (Part-A)
  // =========================================================================
  console.log("1. Processing Theory: 23A01201T Part-A (Civil Engineering)");
  const partADir = path.join(SOURCE_BASE, "23A01201T Basic Civil & Mechanical Engineering(3)part-A");
  const partAFiles = [
    { file: "Unit_1_Basics_of_Civil_Engineering_23A01201T.pdf", mod: "Unit 1: Basics of Civil Engineering", dest: "23A01201T_PartA_Unit_1_Basics_of_Civil_Engineering.pdf" },
    { file: "Unit_2_Surveying_23A01201T.pdf", mod: "Unit 2: Surveying", dest: "23A01201T_PartA_Unit_2_Surveying.pdf" },
    { file: "Unit_3_Transportation_Water_Environmental_23A01201T.pdf", mod: "Unit 3: Transportation, Water Resources & Environmental Engineering", dest: "23A01201T_PartA_Unit_3_Transportation_Water_Environmental.pdf" }
  ];

  const partASources = [];
  const partAUrls = [];
  for (const pf of partAFiles) {
    const src = path.join(partADir, pf.file);
    partASources.push(src);
    partAUrls.push(copyFileSafe(src, pf.dest));
    // Also copy with original name for fallback
    copyFileSafe(src, pf.file);
  }
  const partAMergedUrl = await mergePdfs(partASources, "23A01201T_Basic_Civil_Engineering_PartA_Complete_Notes.pdf");

  const partADoc = await Note.create({
    title: "Basic Civil and Mechanical Engineering (Part-A)",
    branch: "AIML",
    semester: "1-2",
    regulation: "R23",
    subject: "Basic Civil and Mechanical Engineering (Part-A)",
    subjectCode: "23A01201T",
    description: "JNTUA R23 Basic Civil Engineering (Part-A) complete lecture notes covering Basics of Civil Engineering, Surveying principles & modern instruments, and Transportation, Water Resources & Environmental Engineering.",
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
  console.log(`  [NOTE DB] Created Part-A Note: ${partADoc._id}\n`);

  // =========================================================================
  // 2. Basic Civil & Mechanical Engineering (Part-B)
  // =========================================================================
  console.log("2. Processing Theory: 23A01201T Part-B (Mechanical Engineering)");
  const partBDir = path.join(SOURCE_BASE, "23A01201T PART B BASIC MECHANICAL ENGINEERING");
  const partBFiles = [
    { file: "Unit_1_Intro_Mechanical_Engg_and_Materials.pdf", mod: "Unit 1: Introduction to Mechanical Engineering and Materials", dest: "23A01201T_PartB_Unit_1_Intro_Mechanical_Engg_and_Materials.pdf" },
    { file: "Unit_2_Manufacturing_and_Thermal_Engg.pdf", mod: "Unit 2: Manufacturing Processes and Thermal Engineering", dest: "23A01201T_PartB_Unit_2_Manufacturing_and_Thermal_Engg.pdf" },
    { file: "Unit_3_Power_Plants_Transmission_Robotics.pdf", mod: "Unit 3: Power Plants, Mechanical Transmission and Robotics", dest: "23A01201T_PartB_Unit_3_Power_Plants_Transmission_Robotics.pdf" }
  ];

  const partBSources = [];
  const partBUrls = [];
  for (const pf of partBFiles) {
    const src = path.join(partBDir, pf.file);
    partBSources.push(src);
    partBUrls.push(copyFileSafe(src, pf.dest));
    copyFileSafe(src, pf.file);
  }
  const partBMergedUrl = await mergePdfs(partBSources, "23A01201T_Basic_Mechanical_Engineering_PartB_Complete_Notes.pdf");

  const partBDoc = await Note.create({
    title: "Basic Civil and Mechanical Engineering (Part-B)",
    branch: "AIML",
    semester: "1-2",
    regulation: "R23",
    subject: "Basic Civil and Mechanical Engineering (Part-B)",
    subjectCode: "23A01201T",
    description: "JNTUA R23 Basic Mechanical Engineering (Part-B) comprehensive lecture notes covering Introduction to Mechanical Engineering & Materials, Manufacturing Processes & Thermal Engineering, and Power Plants, Transmission & Robotics.",
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
  console.log(`  [NOTE DB] Created Part-B Note: ${partBDoc._id}\n`);

  // =========================================================================
  // 3. Data Structures
  // =========================================================================
  console.log("3. Processing Theory: 23A05201T Data Structures");
  const dsDir = path.join(SOURCE_BASE, "23A05201T Data Structures(3)");
  const dsFiles = [
    { file: "Unit_1_Linear_Data_Structures_Searching_Sorting.pdf", mod: "Unit 1: Linear Data Structures, Searching and Sorting", dest: "23A05201T_Unit_1_Linear_Data_Structures_Searching_Sorting.pdf" },
    { file: "Unit_2_Linked_Lists.pdf", mod: "Unit 2: Linked Lists", dest: "23A05201T_Unit_2_Linked_Lists.pdf" },
    { file: "Unit_3_Stacks.pdf", mod: "Unit 3: Stacks", dest: "23A05201T_Unit_3_Stacks.pdf" },
    { file: "Unit_4_Queues_and_Deques.pdf", mod: "Unit 4: Queues and Deques", dest: "23A05201T_Unit_4_Queues_and_Deques.pdf" },
    { file: "Unit_5_Trees_and_Hashing.pdf", mod: "Unit 5: Trees and Hashing", dest: "23A05201T_Unit_5_Trees_and_Hashing.pdf" }
  ];

  const dsSources = [];
  const dsUrls = [];
  for (const df of dsFiles) {
    const src = path.join(dsDir, df.file);
    dsSources.push(src);
    dsUrls.push(copyFileSafe(src, df.dest));
    copyFileSafe(src, df.file);
  }
  const dsMergedUrl = await mergePdfs(dsSources, "23A05201T_Data_Structures_Complete_Notes.pdf");

  const dsDoc = await Note.create({
    title: "Data Structures",
    branch: "AIML",
    semester: "1-2",
    regulation: "R23",
    subject: "Data Structures",
    subjectCode: "23A05201T",
    description: "Complete lecture notes for Data Structures covering Linear Data Structures (Searching & Sorting), Singly and Doubly Linked Lists, Stacks, Queues & Deques, and Trees & Hashing.",
    credits: "3",
    module1: dsFiles[0].mod,
    module2: dsFiles[1].mod,
    module3: dsFiles[2].mod,
    module4: dsFiles[3].mod,
    module5: dsFiles[4].mod,
    module1Pdf: dsUrls[0],
    module2Pdf: dsUrls[1],
    module3Pdf: dsUrls[2],
    module4Pdf: dsUrls[3],
    module5Pdf: dsUrls[4],
    pdfUrl: dsMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Data Structures Note: ${dsDoc._id}\n`);

  // =========================================================================
  // 4. Chemistry
  // =========================================================================
  console.log("4. Processing Theory: 23A51202T Chemistry");
  const chemDir = path.join(SOURCE_BASE, "23A51202T Chemistry (3)");
  const chemFiles = [
    { file: "Unit_1_Structure_and_Bonding_Models.pdf", mod: "Unit 1: Structure and Bonding Models", dest: "23A51202T_Unit_1_Structure_and_Bonding_Models.pdf" },
    { file: "Unit_2_Modern_Engineering_Materials.pdf", mod: "Unit 2: Modern Engineering Materials", dest: "23A51202T_Unit_2_Modern_Engineering_Materials.pdf" },
    { file: "Unit_3_Electrochemistry.pdf", mod: "Unit 3: Electrochemistry and Applications", dest: "23A51202T_Unit_3_Electrochemistry.pdf" },
    { file: "Unit_4_Polymer_Chemistry.pdf", mod: "Unit 4: Polymer Chemistry", dest: "23A51202T_Unit_4_Polymer_Chemistry.pdf" },
    { file: "Unit_5_Instrumental_Methods.pdf", mod: "Unit 5: Instrumental Methods and Applications", dest: "23A51202T_Unit_5_Instrumental_Methods.pdf" }
  ];

  const chemSources = [];
  const chemUrls = [];
  for (const cf of chemFiles) {
    const src = path.join(chemDir, cf.file);
    chemSources.push(src);
    chemUrls.push(copyFileSafe(src, cf.dest));
    copyFileSafe(src, cf.file);
  }
  const chemMergedUrl = await mergePdfs(chemSources, "23A51202T_Chemistry_Complete_Notes.pdf");

  const chemDoc = await Note.create({
    title: "Chemistry",
    branch: "AIML",
    semester: "1-2",
    regulation: "R23",
    subject: "Chemistry",
    subjectCode: "23A51202T",
    description: "JNTUA R23 Engineering Chemistry complete course notes covering Structure & Bonding Models, Modern Engineering Materials, Electrochemistry & Applications, Polymer Chemistry, and Instrumental Analytical Methods.",
    credits: "3",
    module1: chemFiles[0].mod,
    module2: chemFiles[1].mod,
    module3: chemFiles[2].mod,
    module4: chemFiles[3].mod,
    module5: chemFiles[4].mod,
    module1Pdf: chemUrls[0],
    module2Pdf: chemUrls[1],
    module3Pdf: chemUrls[2],
    module4Pdf: chemUrls[3],
    module5Pdf: chemUrls[4],
    pdfUrl: chemMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Chemistry Note: ${chemDoc._id}\n`);

  // =========================================================================
  // 5. Differential Equations & Vector Calculus
  // =========================================================================
  console.log("5. Processing Theory: 23A54201 Differential Equations & Vector Calculus");
  const devcDir = path.join(SOURCE_BASE, "23A54201 Differential Equations & Vector Calculus(3)");
  const devcFiles = [
    { file: "DEVC_Unit1_FirstOrder_ODE (6).pdf", mod: "Unit 1: First Order Ordinary Differential Equations", dest: "23A54201_Unit_1_FirstOrder_ODE.pdf" },
    { file: "DEVC_Unit2_Higher_Order_ODE (3).pdf", mod: "Unit 2: Higher Order Linear Differential Equations", dest: "23A54201_Unit_2_Higher_Order_ODE.pdf" },
    { file: "DEVC_Unit3_PDE (3).pdf", mod: "Unit 3: Partial Differential Equations", dest: "23A54201_Unit_3_PDE.pdf" },
    { file: "DEVC_Unit4_Vector_Differentiation (3).pdf", mod: "Unit 4: Vector Differentiation", dest: "23A54201_Unit_4_Vector_Differentiation.pdf" },
    { file: "DEVC_Unit5_Vector_Integration (3).pdf", mod: "Unit 5: Vector Integration", dest: "23A54201_Unit_5_Vector_Integration.pdf" }
  ];

  const devcSources = [];
  const devcUrls = [];
  for (const df of devcFiles) {
    const src = path.join(devcDir, df.file);
    devcSources.push(src);
    devcUrls.push(copyFileSafe(src, df.dest));
    copyFileSafe(src, df.file);
  }
  const devcMergedUrl = await mergePdfs(devcSources, "23A54201_Differential_Equations_Vector_Calculus_Complete_Notes.pdf");

  const devcDoc = await Note.create({
    title: "Differential Equations & Vector Calculus",
    branch: "AIML",
    semester: "1-2",
    regulation: "R23",
    subject: "Differential Equations & Vector Calculus",
    subjectCode: "23A54201",
    description: "Complete study notes for Differential Equations and Vector Calculus covering First Order ODEs, Higher Order Linear ODEs with Constant Coefficients, Partial Differential Equations (PDEs), Vector Differentiation, and Vector Integration (Green's, Stokes' and Gauss Divergence Theorems).",
    credits: "3",
    module1: devcFiles[0].mod,
    module2: devcFiles[1].mod,
    module3: devcFiles[2].mod,
    module4: devcFiles[3].mod,
    module5: devcFiles[4].mod,
    module1Pdf: devcUrls[0],
    module2Pdf: devcUrls[1],
    module3Pdf: devcUrls[2],
    module4Pdf: devcUrls[3],
    module5Pdf: devcUrls[4],
    pdfUrl: devcMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created DEVC Note: ${devcDoc._id}\n`);

  // =========================================================================
  // 6. Data Structures Lab
  // =========================================================================
  console.log("6. Processing Lab: 23A05201P Data Structures Lab");
  const dsLabDir = path.join(SOURCE_BASE, "23A05201P Data Structures Lab(1.5)");
  const dsLabSrc = path.join(dsLabDir, "Data_Structures_Lab_Programs.pdf");
  const dsLabUrl = copyFileSafe(dsLabSrc, "23A05201P_Data_Structures_Lab_Programs.pdf");
  copyFileSafe(dsLabSrc, "Data_Structures_Lab_Programs.pdf");

  const dsLabDoc = await LabProgram.create({
    title: "Data Structures Lab",
    branch: "AIML",
    semester: "1-2",
    regulation: "R23",
    subject: "Data Structures Lab",
    subjectCode: "23A05201P",
    description: "Official R23 Data Structures Lab manual containing programs, algorithms, flowcharts, compilation steps, and execution outputs for Searching, Sorting, Stacks, Queues, Linked Lists, and Binary Trees.",
    pdfUrl: dsLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created Data Structures Lab: ${dsLabDoc._id}\n`);

  // =========================================================================
  // 7. Chemistry Lab
  // =========================================================================
  console.log("7. Processing Lab: 23A51202P Chemistry Lab");
  const chemLabDir = path.join(SOURCE_BASE, "23A51202P Chemistry Lab(1)");
  const chemLabSrc = path.join(chemLabDir, "Chemistry_Lab_Handwritten_Record.pdf");
  const chemLabUrl = copyFileSafe(chemLabSrc, "23A51202P_Chemistry_Lab_Handwritten_Record.pdf");
  copyFileSafe(chemLabSrc, "Chemistry_Lab_Handwritten_Record.pdf");

  const chemLabDoc = await LabProgram.create({
    title: "Chemistry Lab",
    branch: "AIML",
    semester: "1-2",
    regulation: "R23",
    subject: "Chemistry Lab",
    subjectCode: "23A51202P",
    description: "Official R23 Chemistry Lab handwritten record & laboratory manual covering Volumetric Analysis, pH-metry, Conductometry, Potentiometry, and Synthesis of Nanomaterials.",
    pdfUrl: chemLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created Chemistry Lab: ${chemLabDoc._id}\n`);

  // Invalidate feed cache
  invalidateFeedCache();

  // Summary Verification
  console.log("==================================================");
  console.log("INGESTION SUMMARY FOR AIML 1-2");
  console.log("==================================================");
  const finalNotes = await Note.find({ branch: "AIML", semester: "1-2" });
  console.log(`Total AIML 1-2 Notes Ingested: ${finalNotes.length}`);
  finalNotes.forEach(n => {
    console.log(`  - [${n.subjectCode}] ${n.title} (Credits: ${n.credits})`);
    console.log(`    Main PDF: ${n.pdfUrl}`);
    console.log(`    Units: M1: ${Boolean(n.module1Pdf)}, M2: ${Boolean(n.module2Pdf)}, M3: ${Boolean(n.module3Pdf)}, M4: ${Boolean(n.module4Pdf)}, M5: ${Boolean(n.module5Pdf)}`);
  });

  const finalLabs = await LabProgram.find({ branch: "AIML", semester: "1-2" });
  console.log(`\nTotal AIML 1-2 Labs Ingested: ${finalLabs.length}`);
  finalLabs.forEach(l => {
    console.log(`  - [${l.subjectCode}] ${l.title}`);
    console.log(`    PDF: ${l.pdfUrl}`);
  });

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("INGESTION COMPLETED SUCCESSFULLY WITH 0 ERRORS!");
  console.log("==================================================");
}

uploadAiml1_2().catch(err => {
  console.error("FATAL ERROR IN INGESTION:", err);
  process.exit(1);
});
