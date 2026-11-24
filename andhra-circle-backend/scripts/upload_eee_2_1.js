const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\EEE\\2-1";
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

async function uploadEee2_1() {
  console.log("==================================================");
  console.log("STARTING EEE 2-1 NOTES INGESTION");
  console.log(`Source: ${SOURCE_BASE}`);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`Directory not found: ${SOURCE_BASE}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test",
  });
  console.log("Connected to MongoDB successfully!\n");

  console.log("Cleaning any previous EEE 2-1 notes and lab programs to avoid duplicates...");
  const delNotes = await Note.deleteMany({ branch: "EEE", semester: "2-1" });
  const delLabs = await LabProgram.deleteMany({ branch: "EEE", semester: "2-1" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} notes and ${delLabs.deletedCount} lab programs.\n`);

  const results = [];

  // -------------------------------------------------------------
  // 1. 23A02301 Electromagnetic Field Theory
  // -------------------------------------------------------------
  console.log("1. Processing: 23A02301 Electromagnetic Field Theory");
  const emftDir = path.join(SOURCE_BASE, "23A02301 Electromagnetic Field Theory");
  const emftFiles = [
    { file: "EMFT_Unit1_Vector_Analysis_Electrostatics.pdf", mod: "Unit 1: Vector Analysis & Electrostatics", dest: "EEE_2-1_23A02301_Unit1_Vector_Analysis_Electrostatics.pdf" },
    { file: "EMFT_Unit2_Conductors_Dielectrics_Capacitance.pdf", mod: "Unit 2: Conductors, Dielectrics & Capacitance", dest: "EEE_2-1_23A02301_Unit2_Conductors_Dielectrics_Capacitance.pdf" },
    { file: "EMFT_Unit3_Magnetostatics_Ampere_Magnetic_Force.pdf", mod: "Unit 3: Magnetostatics, Ampere's Law & Magnetic Force", dest: "EEE_2-1_23A02301_Unit3_Magnetostatics_Ampere_Magnetic_Force.pdf" },
    { file: "EMFT_Unit4_Self_and_Mutual_Inductance.pdf", mod: "Unit 4: Self and Mutual Inductance", dest: "EEE_2-1_23A02301_Unit4_Self_and_Mutual_Inductance.pdf" },
    { file: "EMFT_Unit5_Time_Varying_Fields.pdf", mod: "Unit 5: Time Varying Fields & Maxwell's Equations", dest: "EEE_2-1_23A02301_Unit5_Time_Varying_Fields.pdf" },
  ];
  const emftSources = [];
  const emftUrls = [];
  for (const f of emftFiles) {
    const src = path.join(emftDir, f.file);
    emftSources.push(src);
    emftUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const emftMergedUrl = await mergePdfs(emftSources, "EEE_2-1_23A02301_Electromagnetic_Field_Theory_Complete_Notes.pdf");
  const emftDoc = await Note.create({
    title: "Electromagnetic Field Theory Notes",
    branch: "EEE",
    semester: "2-1",
    regulation: "R23",
    subject: "Electromagnetic Field Theory",
    subjectCode: "23A02301",
    description: "Official R23 lecture notes and comprehensive unit-wise study materials for Electromagnetic Field Theory (23A02301) for Electrical & Electronics Engineering (EEE) 2-1 semester. Covers Vector Analysis, Electrostatics, Conductors & Dielectrics, Magnetostatics, Inductance, and Time-Varying Fields & Maxwell's Equations.",
    credits: "3",
    module1: emftFiles[0].mod,
    module2: emftFiles[1].mod,
    module3: emftFiles[2].mod,
    module4: emftFiles[3].mod,
    module5: emftFiles[4].mod,
    module1Pdf: emftUrls[0],
    module2Pdf: emftUrls[1],
    module3Pdf: emftUrls[2],
    module4Pdf: emftUrls[3],
    module5Pdf: emftUrls[4],
    pdfUrl: emftMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  results.push(emftDoc);
  console.log(`  [SAVED] ${emftDoc.title} (_id: ${emftDoc._id})\n`);

  // -------------------------------------------------------------
  // 2. 23A02302T Electrical Circuit Analysis-II
  // -------------------------------------------------------------
  console.log("2. Processing: 23A02302T Electrical Circuit Analysis-II");
  const eca2Dir = path.join(SOURCE_BASE, "23A02302T Electrical Circuit Analysis-II");
  const eca2Files = [
    { file: "ECA2_Unit1.pdf", mod: "Unit 1: Three Phase Circuits & Balanced/Unbalanced Loads", dest: "EEE_2-1_23A02302T_Unit1_Three_Phase_Circuits.pdf" },
    { file: "ECA2_Unit2.pdf", mod: "Unit 2: Transient Analysis of AC & DC Circuits (RL, RC, RLC)", dest: "EEE_2-1_23A02302T_Unit2_Transient_Analysis.pdf" },
    { file: "ECA2_Unit3.pdf", mod: "Unit 3: Two Port Networks & Network Parameters (Z, Y, ABCD, h)", dest: "EEE_2-1_23A02302T_Unit3_Two_Port_Networks.pdf" },
    { file: "ECA2_Unit4.pdf", mod: "Unit 4: Fourier Analysis of AC Circuits & Complex Frequency", dest: "EEE_2-1_23A02302T_Unit4_Fourier_Analysis.pdf" },
    { file: "ECA2_Unit5.pdf", mod: "Unit 5: Network Synthesis & Driving Point Functions", dest: "EEE_2-1_23A02302T_Unit5_Network_Synthesis.pdf" },
  ];
  const eca2Sources = [];
  const eca2Urls = [];
  for (const f of eca2Files) {
    const src = path.join(eca2Dir, f.file);
    eca2Sources.push(src);
    eca2Urls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const eca2MergedUrl = await mergePdfs(eca2Sources, "EEE_2-1_23A02302T_Electrical_Circuit_Analysis_II_Complete_Notes.pdf");
  const eca2Doc = await Note.create({
    title: "Electrical Circuit Analysis-II Notes",
    branch: "EEE",
    semester: "2-1",
    regulation: "R23",
    subject: "Electrical Circuit Analysis-II",
    subjectCode: "23A02302T",
    description: "Comprehensive R23 study notes and syllabus materials for Electrical Circuit Analysis-II (23A02302T) for EEE 2-1 semester. Covers Three Phase Circuits, Transient Analysis of AC & DC Circuits, Two Port Networks, Fourier Analysis of AC Circuits, and Network Synthesis.",
    credits: "3",
    module1: eca2Files[0].mod,
    module2: eca2Files[1].mod,
    module3: eca2Files[2].mod,
    module4: eca2Files[3].mod,
    module5: eca2Files[4].mod,
    module1Pdf: eca2Urls[0],
    module2Pdf: eca2Urls[1],
    module3Pdf: eca2Urls[2],
    module4Pdf: eca2Urls[3],
    module5Pdf: eca2Urls[4],
    pdfUrl: eca2MergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  results.push(eca2Doc);
  console.log(`  [SAVED] ${eca2Doc.title} (_id: ${eca2Doc._id})\n`);

  // -------------------------------------------------------------
  // 3. 23A02302P Electrical Circuit Analysis -II and Simulation Lab
  // -------------------------------------------------------------
  console.log("3. Processing: 23A02302P Electrical Circuit Analysis -II and Simulation Lab");
  const ecaLabDir = path.join(SOURCE_BASE, "23A02302P Electrical Circuit Analysis -II and Simulation Lab");
  const ecaLabFile = "Electrical_Circuit_Analysis-II_Lab_Inputs_and_Outputs.pdf";
  const ecaLabSrc = path.join(ecaLabDir, ecaLabFile);
  const ecaLabUrl = copyFileSafe(ecaLabSrc, "EEE_2-1_23A02302P_Electrical_Circuit_Analysis_II_Simulation_Lab_Manual.pdf");
  copyFileSafe(ecaLabSrc, ecaLabFile);

  const ecaLabDoc = await LabProgram.create({
    title: "Electrical Circuit Analysis -II & Simulation Lab Manual",
    branch: "EEE",
    semester: "2-1",
    regulation: "R23",
    subject: "Electrical Circuit Analysis -II and Simulation Lab",
    subjectCode: "23A02302P",
    description: "Laboratory manual, simulation procedures (MATLAB/Simulink/PSPICE), circuit diagrams, and experimental inputs & outputs for Electrical Circuit Analysis -II and Simulation Lab (23A02302P) under JNTU R23 Curriculum for EEE 2-1 semester.",
    pdfUrl: ecaLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  results.push(ecaLabDoc);
  console.log(`  [SAVED] ${ecaLabDoc.title} (_id: ${ecaLabDoc._id})\n`);

  // -------------------------------------------------------------
  // 4. 23A02303T DC Machines & Transformers
  // -------------------------------------------------------------
  console.log("4. Processing: 23A02303T DC Machines & Transformers");
  const dcmtDir = path.join(SOURCE_BASE, "23A02303T DC Machines & Transformers");
  const dcmtFiles = [
    { file: "Unit1_DC_Generators.pdf", mod: "Unit 1: DC Generators Principles, Construction & Characteristics", dest: "EEE_2-1_23A02303T_Unit1_DC_Generators.pdf" },
    { file: "Unit2_DC_Motors_Starting_Speed_Control_Testing.pdf", mod: "Unit 2: DC Motors Starting, Speed Control & Testing", dest: "EEE_2-1_23A02303T_Unit2_DC_Motors.pdf" },
    { file: "Unit3_Single_Phase_Transformers.pdf", mod: "Unit 3: Single Phase Transformers Operation & Equivalent Circuits", dest: "EEE_2-1_23A02303T_Unit3_Single_Phase_Transformers.pdf" },
    { file: "Unit4_Testing_of_Transformers.pdf", mod: "Unit 4: Testing of Transformers (OC/SC, Sumpner's, Efficiency)", dest: "EEE_2-1_23A02303T_Unit4_Testing_of_Transformers.pdf" },
    { file: "Unit5_Three_Phase_Transformers.pdf", mod: "Unit 5: Three Phase Transformers, Scott Connection & Auto-Transformers", dest: "EEE_2-1_23A02303T_Unit5_Three_Phase_Transformers.pdf" },
  ];
  const dcmtSources = [];
  const dcmtUrls = [];
  for (const f of dcmtFiles) {
    const src = path.join(dcmtDir, f.file);
    dcmtSources.push(src);
    dcmtUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dcmtMergedUrl = await mergePdfs(dcmtSources, "EEE_2-1_23A02303T_DC_Machines_and_Transformers_Complete_Notes.pdf");
  const dcmtDoc = await Note.create({
    title: "DC Machines & Transformers Notes",
    branch: "EEE",
    semester: "2-1",
    regulation: "R23",
    subject: "DC Machines & Transformers",
    subjectCode: "23A02303T",
    description: "Complete R23 academic study notes for DC Machines & Transformers (23A02303T) for EEE 2-1 semester. Covers Principles of DC Generators, DC Motors (Starting, Speed Control, Testing), Single Phase Transformers, Testing of Transformers (OC/SC, Sumpner's), and Three Phase Transformers.",
    credits: "3",
    module1: dcmtFiles[0].mod,
    module2: dcmtFiles[1].mod,
    module3: dcmtFiles[2].mod,
    module4: dcmtFiles[3].mod,
    module5: dcmtFiles[4].mod,
    module1Pdf: dcmtUrls[0],
    module2Pdf: dcmtUrls[1],
    module3Pdf: dcmtUrls[2],
    module4Pdf: dcmtUrls[3],
    module5Pdf: dcmtUrls[4],
    pdfUrl: dcmtMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  results.push(dcmtDoc);
  console.log(`  [SAVED] ${dcmtDoc.title} (_id: ${dcmtDoc._id})\n`);

  // -------------------------------------------------------------
  // 5. 23A02303P DC Machines & Transformers Lab
  // -------------------------------------------------------------
  console.log("5. Processing: 23A02303P DC Machines & Transformers Lab");
  const dcmtLabDir = path.join(SOURCE_BASE, "23A02303P DC Machines & Transformers Lab");
  const dcmtLabFile = "DC_Machines_and_Transformers_Lab_Inputs_and_Outputs.pdf";
  const dcmtLabSrc = path.join(dcmtLabDir, dcmtLabFile);
  const dcmtLabUrl = copyFileSafe(dcmtLabSrc, "EEE_2-1_23A02303P_DC_Machines_and_Transformers_Lab_Manual.pdf");
  copyFileSafe(dcmtLabSrc, dcmtLabFile);

  const dcmtLabDoc = await LabProgram.create({
    title: "DC Machines & Transformers Lab Manual",
    branch: "EEE",
    semester: "2-1",
    regulation: "R23",
    subject: "DC Machines & Transformers Lab",
    subjectCode: "23A02303P",
    description: "Comprehensive laboratory manual, circuit connections, testing procedures, calculations, and experimental input/output data for DC Machines & Transformers Lab (23A02303P) under JNTU R23 Curriculum for EEE 2-1 semester.",
    pdfUrl: dcmtLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  results.push(dcmtLabDoc);
  console.log(`  [SAVED] ${dcmtLabDoc.title} (_id: ${dcmtLabDoc._id})\n`);

  // -------------------------------------------------------------
  // 6. 23A05305 Data Structures
  // -------------------------------------------------------------
  console.log("6. Processing: 23A05305 Data Structures");
  const dsDir = path.join(SOURCE_BASE, "23A05305 Data Structures");
  const dsFiles = [
    { file: "DS_Unit_I_Handwritten_Notes.pdf", mod: "Unit 1: Introduction to Data Structures, Arrays, Searching & Sorting", dest: "EEE_2-1_23A05305_Unit1_Data_Structures.pdf" },
    { file: "DS_Unit_II_Handwritten_Notes.pdf", mod: "Unit 2: Stacks, Queues & Linked Lists Implementation", dest: "EEE_2-1_23A05305_Unit2_Data_Structures.pdf" },
    { file: "DS_Unit_III_Handwritten_Notes.pdf", mod: "Unit 3: Non-Linear Data Structures & Trees (Binary Trees, BST, AVL)", dest: "EEE_2-1_23A05305_Unit3_Data_Structures.pdf" },
    { file: "DS_Unit_IV_Handwritten_Notes.pdf", mod: "Unit 4: Graphs Traversal (BFS, DFS) & Minimum Spanning Trees", dest: "EEE_2-1_23A05305_Unit4_Data_Structures.pdf" },
    { file: "DS_Unit_V_Handwritten_Notes.pdf", mod: "Unit 5: Hashing Techniques, Hash Functions & Collision Resolution", dest: "EEE_2-1_23A05305_Unit5_Data_Structures.pdf" },
  ];
  const dsSources = [];
  const dsUrls = [];
  for (const f of dsFiles) {
    const src = path.join(dsDir, f.file);
    dsSources.push(src);
    dsUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dsMergedUrl = await mergePdfs(dsSources, "EEE_2-1_23A05305_Data_Structures_Complete_Notes.pdf");
  const dsDoc = await Note.create({
    title: "Data Structures Notes",
    branch: "EEE",
    semester: "2-1",
    regulation: "R23",
    subject: "Data Structures",
    subjectCode: "23A05305",
    description: "Unit-wise academic lecture notes for Data Structures (23A05305) under JNTU R23 Curriculum for EEE 2-1 semester. Covers Linear Data Structures, Stacks & Queues, Linked Lists, Non-Linear Trees (BST, AVL), Graphs, and Hashing Techniques.",
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
    downloads: 0,
    views: 0,
    likes: 0,
  });
  results.push(dsDoc);
  console.log(`  [SAVED] ${dsDoc.title} (_id: ${dsDoc._id})\n`);

  // -------------------------------------------------------------
  // 7. 23A54304 Complex Variables & Numerical
  // -------------------------------------------------------------
  console.log("7. Processing: 23A54304 Complex Variables & Numerical");
  const cvnmDir = path.join(SOURCE_BASE, "23A54304 Complex Variables & Numerical");
  const cvnmFiles = [
    { file: "Unit_1_Complex_Variable_Differentiation.pdf", mod: "Unit 1: Complex Variable Differentiation & Analytic Functions", dest: "EEE_2-1_23A54304_Unit1_Complex_Differentiation.pdf" },
    { file: "Unit_2_Complex_Variable_Integration.pdf", mod: "Unit 2: Complex Variable Integration, Cauchy's Theorem & Residues", dest: "EEE_2-1_23A54304_Unit2_Complex_Integration.pdf" },
    { file: "Unit_3_Solution_of_Algebraic_Transcendental_Equations.pdf", mod: "Unit 3: Solution of Algebraic & Transcendental Equations", dest: "EEE_2-1_23A54304_Unit3_Algebraic_Equations.pdf" },
    { file: "Unit_4_Interpolation_and_Curve_Fitting.pdf", mod: "Unit 4: Finite Differences, Interpolation & Curve Fitting", dest: "EEE_2-1_23A54304_Unit4_Interpolation.pdf" },
    { file: "Unit_5_Numerical_Solution_of_ODE_Initial_Value_Problems.pdf", mod: "Unit 5: Numerical Solution of Ordinary Differential Equations (Taylor, RK)", dest: "EEE_2-1_23A54304_Unit5_Numerical_ODE.pdf" },
  ];
  const cvnmSources = [];
  const cvnmUrls = [];
  for (const f of cvnmFiles) {
    const src = path.join(cvnmDir, f.file);
    cvnmSources.push(src);
    cvnmUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const cvnmMergedUrl = await mergePdfs(cvnmSources, "EEE_2-1_23A54304_Complex_Variables_and_Numerical_Methods_Complete_Notes.pdf");
  const cvnmDoc = await Note.create({
    title: "Complex Variables & Numerical Methods Notes",
    branch: "EEE",
    semester: "2-1",
    regulation: "R23",
    subject: "Complex Variables & Numerical Methods",
    subjectCode: "23A54304",
    description: "Comprehensive R23 lecture notes for Complex Variables & Numerical Methods (23A54304) for EEE 2-1 semester. Covers Complex Variable Differentiation (Analytic Functions), Complex Integration & Residues, Numerical Solution of Algebraic Equations, Interpolation & Curve Fitting, and Numerical Solutions of ODEs.",
    credits: "3",
    module1: cvnmFiles[0].mod,
    module2: cvnmFiles[1].mod,
    module3: cvnmFiles[2].mod,
    module4: cvnmFiles[3].mod,
    module5: cvnmFiles[4].mod,
    module1Pdf: cvnmUrls[0],
    module2Pdf: cvnmUrls[1],
    module3Pdf: cvnmUrls[2],
    module4Pdf: cvnmUrls[3],
    module5Pdf: cvnmUrls[4],
    pdfUrl: cvnmMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  results.push(cvnmDoc);
  console.log(`  [SAVED] ${cvnmDoc.title} (_id: ${cvnmDoc._id})\n`);

  // Invalidate feed cache so latest notes appear immediately
  if (typeof invalidateFeedCache === "function") {
    invalidateFeedCache();
    console.log("Feed cache invalidated successfully.");
  }

  console.log("==================================================");
  console.log(`COMPLETED: ${results.length} EEE 2-1 note subjects uploaded!`);
  console.log("==================================================");
  process.exit(0);
}

uploadEee2_1().catch((err) => {
  console.error("FATAL ERROR during EEE 2-1 upload:", err);
  process.exit(1);
});
