const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\EEE\\1-2";
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

async function uploadEee1_2() {
  console.log("==================================================");
  console.log("STARTING EEE 1-2 CURRICULUM INGESTION");
  console.log("Separate Notes (Theory) & Lab Programs (Labs)");
  console.log(`Source: ${SOURCE_BASE}`);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`Directory not found: ${SOURCE_BASE}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test",
  });
  console.log("Connected to MongoDB successfully!\n");

  console.log("Cleaning any previous EEE 1-2 notes and labs to avoid duplicates...");
  const delNotes = await Note.deleteMany({ branch: "EEE", semester: "1-2" });
  const delLabs = await LabProgram.deleteMany({ branch: "EEE", semester: "1-2" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} notes and ${delLabs.deletedCount} lab programs.\n`);

  const createdNotes = [];
  const createdLabs = [];

  // =============================================================
  // SECTION 1: THEORY SUBJECTS (Stored in Note collection)
  // =============================================================

  // -------------------------------------------------------------
  // 1. 23A02101T Basic Electrical & Electronics (Part-A: Electrical)
  // -------------------------------------------------------------
  console.log("1. Processing Theory: 23A02101T Basic Electrical & Electronics (Part-A: Electrical)");
  const beeeADir = path.join(SOURCE_BASE, "23A02101T(Basic Electrical & Electronics)3 part-A");
  const beeeAFiles = [
    { file: "BEEE_Unit1_DC_and_AC_Circuits.pdf", mod: "Unit 1: DC and AC Circuits (Mesh, Nodal Analysis & Single Phase AC)", dest: "EEE_1-2_23A02101T_PartA_Unit1_DC_and_AC_Circuits.pdf" },
    { file: "BEEE_Unit2_Machines_and_Measuring_Instruments.pdf", mod: "Unit 2: Electrical Machines (Generators, Motors, Transformers) & Measuring Instruments", dest: "EEE_1-2_23A02101T_PartA_Unit2_Machines_and_Measuring_Instruments.pdf" },
    { file: "BEEE_Unit3_Energy_Resources_Bill_and_Safety.pdf", mod: "Unit 3: Energy Resources, Electricity Bill Calculation & Electrical Safety Precautions", dest: "EEE_1-2_23A02101T_PartA_Unit3_Energy_Resources_Bill_and_Safety.pdf" },
  ];
  const beeeASources = [];
  const beeeAUrls = [];
  for (const f of beeeAFiles) {
    const src = path.join(beeeADir, f.file);
    beeeASources.push(src);
    beeeAUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const beeeAMergedUrl = await mergePdfs(beeeASources, "EEE_1-2_23A02101T_PartA_Basic_Electrical_Engineering_Complete_Notes.pdf");
  const beeeADoc = await Note.create({
    title: "Basic Electrical Engineering (Part-A) Notes",
    branch: "EEE",
    semester: "1-2",
    regulation: "R23",
    subject: "Basic Electrical & Electronics Engineering (Part-A: Electrical)",
    subjectCode: "23A02101T",
    description: "Comprehensive study notes for Basic Electrical & Electronics Engineering Part-A (Electrical Engineering) (23A02101T) under JNTU R23 Curriculum for EEE 1-2 semester. Covers DC & AC Circuit Analysis, Electrical Machines (DC Machines, Induction Motors, Transformers), Measuring Instruments, and Energy Resources & Safety.",
    credits: "1.5",
    module1: beeeAFiles[0].mod,
    module2: beeeAFiles[1].mod,
    module3: beeeAFiles[2].mod,
    module4: "",
    module5: "",
    module1Pdf: beeeAUrls[0],
    module2Pdf: beeeAUrls[1],
    module3Pdf: beeeAUrls[2],
    module4Pdf: "",
    module5Pdf: "",
    pdfUrl: beeeAMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(beeeADoc);
  console.log(`  [SAVED NOTE] ${beeeADoc.title} (_id: ${beeeADoc._id})\n`);

  // -------------------------------------------------------------
  // 2. 23A02101T Basic Electrical & Electronics (Part-B: Electronics)
  // -------------------------------------------------------------
  console.log("2. Processing Theory: 23A02101T Basic Electrical & Electronics (Part-B: Electronics)");
  const beeeBDir = path.join(SOURCE_BASE, "23A02101T(Electrical & Electronics Engineering)part-B");
  const beeeBFiles = [
    { file: "Unit_I_Semiconductor_Devices.pdf", mod: "Unit 1: Semiconductor Devices (PN Junction Diodes, Zener Diodes, BJTs & FETs)", dest: "EEE_1-2_23A02101T_PartB_Unit1_Semiconductor_Devices.pdf" },
    { file: "Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf", mod: "Unit 2: Basic Electronic Circuits and Instrumentation (Rectifiers, Filters, Amplifiers & Sensors)", dest: "EEE_1-2_23A02101T_PartB_Unit2_Basic_Electronic_Circuits_and_Instrumentation.pdf" },
    { file: "Unit_III_Digital_Electronics.pdf", mod: "Unit 3: Digital Electronics (Number Systems, Logic Gates & Combinational Circuits)", dest: "EEE_1-2_23A02101T_PartB_Unit3_Digital_Electronics.pdf" },
  ];
  const beeeBSources = [];
  const beeeBUrls = [];
  for (const f of beeeBFiles) {
    const src = path.join(beeeBDir, f.file);
    beeeBSources.push(src);
    beeeBUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const beeeBMergedUrl = await mergePdfs(beeeBSources, "EEE_1-2_23A02101T_PartB_Basic_Electronics_Engineering_Complete_Notes.pdf");
  const beeeBDoc = await Note.create({
    title: "Basic Electronics Engineering (Part-B) Notes",
    branch: "EEE",
    semester: "1-2",
    regulation: "R23",
    subject: "Basic Electrical & Electronics Engineering (Part-B: Electronics)",
    subjectCode: "23A02101T",
    description: "Detailed unit notes for Basic Electrical & Electronics Engineering Part-B (Electronics Engineering) (23A02101T) under JNTU R23 Curriculum for EEE 1-2 semester. Covers Semiconductor Physics & Devices, Rectifiers, Transistor Amplifiers, Electronic Instrumentation & Sensors, and Digital Logic Fundamentals.",
    credits: "1.5",
    module1: beeeBFiles[0].mod,
    module2: beeeBFiles[1].mod,
    module3: beeeBFiles[2].mod,
    module4: "",
    module5: "",
    module1Pdf: beeeBUrls[0],
    module2Pdf: beeeBUrls[1],
    module3Pdf: beeeBUrls[2],
    module4Pdf: "",
    module5Pdf: "",
    pdfUrl: beeeBMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(beeeBDoc);
  console.log(`  [SAVED NOTE] ${beeeBDoc.title} (_id: ${beeeBDoc._id})\n`);

  // -------------------------------------------------------------
  // 3. 23A02201T Electrical circuit Analysis-I
  // -------------------------------------------------------------
  console.log("3. Processing Theory: 23A02201T Electrical circuit Analysis-I");
  const ecaDir = path.join(SOURCE_BASE, "23A02201T Electrical circuit Analysis-I");
  const ecaFiles = [
    { file: "Unit_1_Introduction_to_Electrical_Circuits.pdf", mod: "Unit 1: Introduction to Electrical Circuits (R-L-C Parameters, KCL, KVL & Star-Delta Transformations)", dest: "EEE_1-2_23A02201T_Unit1_Electrical_Circuit_Analysis_I.pdf" },
    { file: "Unit_2_Magnetic_Circuits.pdf", mod: "Unit 2: Magnetic Circuits & Coupled Circuits (Self & Mutual Inductance, Dot Convention)", dest: "EEE_1-2_23A02201T_Unit2_Electrical_Circuit_Analysis_I.pdf" },
    { file: "Unit_3_Single_Phase_Circuits.pdf", mod: "Unit 3: Single Phase AC Circuits & Phasor Representations (Series & Parallel R-L, R-C, R-L-C)", dest: "EEE_1-2_23A02201T_Unit3_Electrical_Circuit_Analysis_I.pdf" },
    { file: "Unit_4_Resonance_and_Locus_Diagrams.pdf", mod: "Unit 4: Resonance and Locus Diagrams (Series & Parallel Resonance, Q-Factor & Bandwidth)", dest: "EEE_1-2_23A02201T_Unit4_Electrical_Circuit_Analysis_I.pdf" },
    { file: "Unit_5_Network_Theorems.pdf", mod: "Unit 5: Network Theorems (Thevenin, Norton, Superposition, Maximum Power Transfer & Reciprocity)", dest: "EEE_1-2_23A02201T_Unit5_Electrical_Circuit_Analysis_I.pdf" },
  ];
  const ecaSources = [];
  const ecaUrls = [];
  for (const f of ecaFiles) {
    const src = path.join(ecaDir, f.file);
    ecaSources.push(src);
    ecaUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const ecaMergedUrl = await mergePdfs(ecaSources, "EEE_1-2_23A02201T_Electrical_Circuit_Analysis_I_Complete_Notes.pdf");
  const ecaDoc = await Note.create({
    title: "Electrical Circuit Analysis-I Notes",
    branch: "EEE",
    semester: "1-2",
    regulation: "R23",
    subject: "Electrical Circuit Analysis-I",
    subjectCode: "23A02201T",
    description: "Complete academic lecture notes for Electrical Circuit Analysis-I (23A02201T) under JNTU R23 Curriculum for EEE 1-2 semester. Covers Fundamental Circuit Concepts & Laws, Magnetically Coupled Circuits, Single Phase AC Steady State Analysis, Resonance & Locus Diagrams, and Network Theorems in DC/AC.",
    credits: "3",
    module1: ecaFiles[0].mod,
    module2: ecaFiles[1].mod,
    module3: ecaFiles[2].mod,
    module4: ecaFiles[3].mod,
    module5: ecaFiles[4].mod,
    module1Pdf: ecaUrls[0],
    module2Pdf: ecaUrls[1],
    module3Pdf: ecaUrls[2],
    module4Pdf: ecaUrls[3],
    module5Pdf: ecaUrls[4],
    pdfUrl: ecaMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(ecaDoc);
  console.log(`  [SAVED NOTE] ${ecaDoc.title} (_id: ${ecaDoc._id})\n`);

  // -------------------------------------------------------------
  // 4. 23A03101T Engineering Graphics
  // -------------------------------------------------------------
  console.log("4. Processing Theory: 23A03101T(Engineering Graphics)3");
  const egDir = path.join(SOURCE_BASE, "23A03101T(Engineering Graphics)3");
  const egFiles = [
    { file: "Unit_1_Drawing_Basics_Curves_Scales.pdf", mod: "Unit 1: Drawing Basics, Conic Sections, Special Curves & Plain / Diagonal Scales", dest: "EEE_1-2_23A03101T_Unit1_Engineering_Graphics.pdf" },
    { file: "Unit_2_Orthographic_Projections_Points_Lines_Planes.pdf", mod: "Unit 2: Orthographic Projections of Points, Straight Lines & Regular Planes", dest: "EEE_1-2_23A03101T_Unit2_Engineering_Graphics.pdf" },
    { file: "Unit_3_Projections_of_Solids.pdf", mod: "Unit 3: Projections of Regular Solids (Prisms, Pyramids, Cylinders & Cones)", dest: "EEE_1-2_23A03101T_Unit3_Engineering_Graphics.pdf" },
    { file: "Unit_4_Sections_and_Development_of_Surfaces.pdf", mod: "Unit 4: Sections of Solids and Development of Lateral Surfaces", dest: "EEE_1-2_23A03101T_Unit4_Engineering_Graphics.pdf" },
    { file: "Unit_5_Conversion_of_Views.pdf", mod: "Unit 5: Isometric Projections & Conversion of Orthographic to Isometric Views", dest: "EEE_1-2_23A03101T_Unit5_Engineering_Graphics.pdf" },
  ];
  const egSources = [];
  const egUrls = [];
  for (const f of egFiles) {
    const src = path.join(egDir, f.file);
    egSources.push(src);
    egUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const egMergedUrl = await mergePdfs(egSources, "EEE_1-2_23A03101T_Engineering_Graphics_Complete_Notes.pdf");
  const egDoc = await Note.create({
    title: "Engineering Graphics Notes",
    branch: "EEE",
    semester: "1-2",
    regulation: "R23",
    subject: "Engineering Graphics",
    subjectCode: "23A03101T",
    description: "Complete study notes for Engineering Graphics (23A03101T) under JNTU R23 Curriculum for EEE 1-2 semester. Covers Lettering & Dimensioning, Conics & Scales, Projections of Points, Lines and Planes, Projections of Solids, Sections of Solids, Development of Surfaces, and Isometric Views.",
    credits: "3",
    module1: egFiles[0].mod,
    module2: egFiles[1].mod,
    module3: egFiles[2].mod,
    module4: egFiles[3].mod,
    module5: egFiles[4].mod,
    module1Pdf: egUrls[0],
    module2Pdf: egUrls[1],
    module3Pdf: egUrls[2],
    module4Pdf: egUrls[3],
    module5Pdf: egUrls[4],
    pdfUrl: egMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(egDoc);
  console.log(`  [SAVED NOTE] ${egDoc.title} (_id: ${egDoc._id})\n`);

  // -------------------------------------------------------------
  // 5. 23A54201 Differential Equations & Vector Calculus
  // -------------------------------------------------------------
  console.log("5. Processing Theory: 23A54201 Differential Equations & Vector Calculus(3)");
  const devcDir = path.join(SOURCE_BASE, "23A54201 Differential Equations & Vector Calculus(3)");
  const devcFiles = [
    { file: "DEVC_Unit1_FirstOrder_ODE (6).pdf", mod: "Unit 1: First Order Ordinary Differential Equations (Exact, Linear & Bernoulli Equations)", dest: "EEE_1-2_23A54201_Unit1_DEVC.pdf" },
    { file: "DEVC_Unit2_Higher_Order_ODE (3).pdf", mod: "Unit 2: Higher Order Linear Differential Equations with Constant Coefficients & Variation of Parameters", dest: "EEE_1-2_23A54201_Unit2_DEVC.pdf" },
    { file: "DEVC_Unit3_PDE (3).pdf", mod: "Unit 3: Partial Differential Equations (First Order Solutions & Separation of Variables)", dest: "EEE_1-2_23A54201_Unit3_DEVC.pdf" },
    { file: "DEVC_Unit4_Vector_Differentiation (3).pdf", mod: "Unit 4: Vector Differentiation, Scalar & Vector Fields, Gradient, Divergence & Curl", dest: "EEE_1-2_23A54201_Unit4_DEVC.pdf" },
    { file: "DEVC_Unit5_Vector_Integration (3).pdf", mod: "Unit 5: Vector Integration, Line, Surface & Volume Integrals (Green's, Stokes' & Gauss Theorems)", dest: "EEE_1-2_23A54201_Unit5_DEVC.pdf" },
  ];
  const devcSources = [];
  const devcUrls = [];
  for (const f of devcFiles) {
    const src = path.join(devcDir, f.file);
    devcSources.push(src);
    devcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const devcMergedUrl = await mergePdfs(devcSources, "EEE_1-2_23A54201_Differential_Equations_and_Vector_Calculus_Complete_Notes.pdf");
  const devcDoc = await Note.create({
    title: "Differential Equations & Vector Calculus Notes",
    branch: "EEE",
    semester: "1-2",
    regulation: "R23",
    subject: "Differential Equations & Vector Calculus",
    subjectCode: "23A54201",
    description: "Complete R23 academic notes for Differential Equations & Vector Calculus (23A54201) for EEE 1-2 semester. Covers First Order ODEs, Higher Order Linear ODEs, Partial Differential Equations, Vector Differentiation (Gradient, Divergence, Curl), and Vector Integration (Green's, Stokes', Gauss Divergence Theorems).",
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
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(devcDoc);
  console.log(`  [SAVED NOTE] ${devcDoc.title} (_id: ${devcDoc._id})\n`);

  // -------------------------------------------------------------
  // 6. 23A56101T Engineering Physics
  // -------------------------------------------------------------
  console.log("6. Processing Theory: 23A56101T(Engineering Physics)3");
  const epDir = path.join(SOURCE_BASE, "23A56101T(Engineering Physics)3");
  const epFiles = [
    { file: "Unit_I_Wave_Optics.pdf", mod: "Unit 1: Wave Optics (Interference, Diffraction & Polarization Principles)", dest: "EEE_1-2_23A56101T_Unit1_Engineering_Physics.pdf" },
    { file: "Unit_II_Crystallography_XRD.pdf", mod: "Unit 2: Crystallography and X-Ray Diffraction (Bragg's Law & Crystal Structures)", dest: "EEE_1-2_23A56101T_Unit2_Engineering_Physics.pdf" },
    { file: "Unit_III_Dielectric_Magnetic_Materials.pdf", mod: "Unit 3: Dielectric and Magnetic Materials (Polarization, Hysteresis & Domain Theory)", dest: "EEE_1-2_23A56101T_Unit3_Engineering_Physics.pdf" },
    { file: "Unit_IV_Quantum_Mechanics_Free_Electron_Theory.pdf", mod: "Unit 4: Quantum Mechanics & Free Electron Theory of Metals (Schrodinger Equation & Fermi-Dirac)", dest: "EEE_1-2_23A56101T_Unit4_Engineering_Physics.pdf" },
    { file: "Unit_V_Semiconductors.pdf", mod: "Unit 5: Semiconductors and Superconductivity (Intrinsic/Extrinsic Semiconductors & Meissner Effect)", dest: "EEE_1-2_23A56101T_Unit5_Engineering_Physics.pdf" },
  ];
  const epSources = [];
  const epUrls = [];
  for (const f of epFiles) {
    const src = path.join(epDir, f.file);
    epSources.push(src);
    epUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const epMergedUrl = await mergePdfs(epSources, "EEE_1-2_23A56101T_Engineering_Physics_Complete_Notes.pdf");
  const epDoc = await Note.create({
    title: "Engineering Physics Notes",
    branch: "EEE",
    semester: "1-2",
    regulation: "R23",
    subject: "Engineering Physics",
    subjectCode: "23A56101T",
    description: "Complete unit-wise lecture notes for Engineering Physics (23A56101T) for EEE 1-2 semester under JNTU R23. Details Wave Optics, Crystallography & XRD, Dielectric & Magnetic Properties, Quantum Mechanics & Free Electron Theory, and Semiconductors & Superconductors.",
    credits: "3",
    module1: epFiles[0].mod,
    module2: epFiles[1].mod,
    module3: epFiles[2].mod,
    module4: epFiles[3].mod,
    module5: epFiles[4].mod,
    module1Pdf: epUrls[0],
    module2Pdf: epUrls[1],
    module3Pdf: epUrls[2],
    module4Pdf: epUrls[3],
    module5Pdf: epUrls[4],
    pdfUrl: epMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(epDoc);
  console.log(`  [SAVED NOTE] ${epDoc.title} (_id: ${epDoc._id})\n`);

  // =============================================================
  // SECTION 2: LAB PROGRAMS (Stored in LabProgram collection)
  // =============================================================

  // -------------------------------------------------------------
  // 7. 23A02201P Electrical circuit Analysis-I Lab (Lab)
  // -------------------------------------------------------------
  console.log("7. Processing Lab: 23A02201P Electrical circuit Analysis-I Lab");
  const ecaLabDir = path.join(SOURCE_BASE, "23A02201P Electrical circuit Analysis-I Lab");
  const ecaLabFile = "ECA_Lab_Handwritten_Record (1).pdf";
  const ecaLabSrc = path.join(ecaLabDir, ecaLabFile);
  const ecaLabUrl = copyFileSafe(ecaLabSrc, "EEE_1-2_23A02201P_Electrical_Circuit_Analysis_I_Lab_Manual.pdf");
  copyFileSafe(ecaLabSrc, ecaLabFile);

  const ecaLabDoc = await LabProgram.create({
    title: "Electrical Circuit Analysis-I Lab Manual & Record",
    branch: "EEE",
    semester: "1-2",
    regulation: "R23",
    subject: "Electrical Circuit Analysis-I Lab",
    subjectCode: "23A02201P",
    description: "Complete laboratory handwritten record, experiment procedures, circuit diagrams, and observations for Electrical Circuit Analysis-I Lab (23A02201P) under JNTU R23 Curriculum for EEE 1-2 semester.",
    pdfUrl: ecaLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(ecaLabDoc);
  console.log(`  [SAVED LAB] ${ecaLabDoc.title} (_id: ${ecaLabDoc._id})\n`);

  // -------------------------------------------------------------
  // 8. 23A56101P Engineering Physics Lab (Lab)
  // -------------------------------------------------------------
  console.log("8. Processing Lab: 23A56101P(Engineering Physics Lab)1");
  const epLabDir = path.join(SOURCE_BASE, "23A56101P(Engineering Physics Lab)1");
  const epLabFile = "Engineering_Physics_Lab_Notes.pdf";
  const epLabSrc = path.join(epLabDir, epLabFile);
  const epLabUrl = copyFileSafe(epLabSrc, "EEE_1-2_23A56101P_Engineering_Physics_Lab_Manual.pdf");
  copyFileSafe(epLabSrc, epLabFile);

  const epLabDoc = await LabProgram.create({
    title: "Engineering Physics Lab Manual & Notes",
    branch: "EEE",
    semester: "1-2",
    regulation: "R23",
    subject: "Engineering Physics Lab",
    subjectCode: "23A56101P",
    description: "Official laboratory manual, handwritten experiment notes, apparatus diagrams, formulae, and observation procedures for Engineering Physics Laboratory (23A56101P) under JNTU R23 Curriculum for EEE 1-2 semester.",
    pdfUrl: epLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(epLabDoc);
  console.log(`  [SAVED LAB] ${epLabDoc.title} (_id: ${epLabDoc._id})\n`);

  // =============================================================
  // SECTION 3: CACHE INVALIDATION & FINAL VERIFICATION
  // =============================================================
  console.log("Invalidating Feed Cache...");
  if (typeof invalidateFeedCache === "function") {
    invalidateFeedCache();
    console.log("  [CACHE] In-memory feed cache invalidated.");
  }

  console.log("\n==================================================");
  console.log("SUMMARY OF EEE 1-2 INGESTION");
  console.log(`Theory Notes Saved in Note collection: ${createdNotes.length}`);
  createdNotes.forEach((n) => console.log(`  - [${n.subjectCode}] ${n.subject} (PDF: ${n.pdfUrl})`));

  console.log(`\nLab Programs Saved in LabProgram collection: ${createdLabs.length}`);
  createdLabs.forEach((l) => console.log(`  - [${l.subjectCode}] ${l.subject} (PDF: ${l.pdfUrl})`));
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Database disconnected. Done!");
}

uploadEee1_2().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
