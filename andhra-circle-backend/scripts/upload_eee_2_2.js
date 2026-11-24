const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\EEE\\2-2";
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

async function uploadEee2_2() {
  console.log("==================================================");
  console.log("STARTING EEE 2-2 CURRICULUM INGESTION");
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

  console.log("Cleaning any previous EEE 2-2 notes and labs to avoid duplicates...");
  const delNotes = await Note.deleteMany({ branch: "EEE", semester: "2-2" });
  const delLabs = await LabProgram.deleteMany({ branch: "EEE", semester: "2-2" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} notes and ${delLabs.deletedCount} lab programs.\n`);

  const createdNotes = [];
  const createdLabs = [];

  // =============================================================
  // SECTION 1: THEORY SUBJECTS (Stored in Note collection)
  // =============================================================

  // -------------------------------------------------------------
  // 1. 23A02401 Analog Circuits (Theory)
  // -------------------------------------------------------------
  console.log("1. Processing Theory: 23A02401 Analog Circuits");
  const acDir = path.join(SOURCE_BASE, "23A02401 Analog Circuits");
  const acFiles = [
    { file: "Unit1_Analog_Circuits_23A02401.pdf", mod: "Unit 1: Small Signal Low Frequency Transistor Models & Analysis", dest: "EEE_2-2_23A02401_Unit1_Analog_Circuits.pdf" },
    { file: "Unit2_Analog_Circuits_23A02401.pdf", mod: "Unit 2: High Frequency Transistor Amplifiers & Multistage Systems", dest: "EEE_2-2_23A02401_Unit2_Analog_Circuits.pdf" },
    { file: "Unit3_Analog_Circuits_23A02401.pdf", mod: "Unit 3: Feedback Amplifiers & Oscillators Design", dest: "EEE_2-2_23A02401_Unit3_Analog_Circuits.pdf" },
    { file: "Unit4_Analog_Circuits_23A02401.pdf", mod: "Unit 4: Large Signal / Power Amplifiers & Tuned Amplifiers", dest: "EEE_2-2_23A02401_Unit4_Analog_Circuits.pdf" },
    { file: "Unit5_Analog_Circuits_23A02401.pdf", mod: "Unit 5: Linear Wave Shaping, Multivibrators & Operational Amplifier Applications", dest: "EEE_2-2_23A02401_Unit5_Analog_Circuits.pdf" },
  ];
  const acSources = [];
  const acUrls = [];
  for (const f of acFiles) {
    const src = path.join(acDir, f.file);
    acSources.push(src);
    acUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const acMergedUrl = await mergePdfs(acSources, "EEE_2-2_23A02401_Analog_Circuits_Complete_Notes.pdf");
  const acDoc = await Note.create({
    title: "Analog Circuits Notes",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Analog Circuits",
    subjectCode: "23A02401",
    description: "Complete academic unit notes for Analog Circuits (23A02401) under JNTU R23 Curriculum for EEE 2-2 semester. Covers Small Signal BJT & FET Models, High Frequency Response, Feedback Amplifiers & Oscillators, Power Amplifiers, and Wave Shaping with Op-Amps.",
    credits: "3",
    module1: acFiles[0].mod,
    module2: acFiles[1].mod,
    module3: acFiles[2].mod,
    module4: acFiles[3].mod,
    module5: acFiles[4].mod,
    module1Pdf: acUrls[0],
    module2Pdf: acUrls[1],
    module3Pdf: acUrls[2],
    module4Pdf: acUrls[3],
    module5Pdf: acUrls[4],
    pdfUrl: acMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(acDoc);
  console.log(`  [SAVED NOTE] ${acDoc.title} (_id: ${acDoc._id})\n`);

  // -------------------------------------------------------------
  // 2. 23A02402 Power Systems-I (Theory)
  // -------------------------------------------------------------
  console.log("2. Processing Theory: 23A02402 Power Systems-I");
  const psDir = path.join(SOURCE_BASE, "23A02402 Power Systems-I");
  const psFiles = [
    { file: "Power_Systems-I_23A02402_UNITI.pdf", mod: "Unit 1: Generation of Electric Power (Thermal, Hydro & Nuclear Power Plants)", dest: "EEE_2-2_23A02402_Unit1_Power_Systems_I.pdf" },
    { file: "Power_Systems-I_23A02402_UNITII.pdf", mod: "Unit 2: Substations, Gas Insulated Substations (GIS) & Distribution Systems", dest: "EEE_2-2_23A02402_Unit2_Power_Systems_I.pdf" },
    { file: "Power_Systems-I_23A02402_UNITIII.pdf", mod: "Unit 3: Transmission Line Parameters (Resistance, Inductance & Capacitance)", dest: "EEE_2-2_23A02402_Unit3_Power_Systems_I.pdf" },
    { file: "Power_Systems-I_23A02402_UNITIV.pdf", mod: "Unit 4: Performance of Short, Medium & Long Transmission Lines and Corona", dest: "EEE_2-2_23A02402_Unit4_Power_Systems_I.pdf" },
    { file: "Power_Systems-I_23A02402_UNITV.pdf", mod: "Unit 5: Mechanical Design of Lines, Overhead Insulators & Underground Cables", dest: "EEE_2-2_23A02402_Unit5_Power_Systems_I.pdf" },
  ];
  const psSources = [];
  const psUrls = [];
  for (const f of psFiles) {
    const src = path.join(psDir, f.file);
    psSources.push(src);
    psUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const psMergedUrl = await mergePdfs(psSources, "EEE_2-2_23A02402_Power_Systems_I_Complete_Notes.pdf");
  const psDoc = await Note.create({
    title: "Power Systems-I Notes",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Power Systems-I",
    subjectCode: "23A02402",
    description: "Complete study notes for Power Systems-I (23A02402) for EEE 2-2 semester under JNTU R23. Details Power Generation Stations, Substations & AC/DC Distribution, Transmission Line Parameters Calculations, Line Performance Analysis & Corona, and Overhead Insulators & Cables.",
    credits: "3",
    module1: psFiles[0].mod,
    module2: psFiles[1].mod,
    module3: psFiles[2].mod,
    module4: psFiles[3].mod,
    module5: psFiles[4].mod,
    module1Pdf: psUrls[0],
    module2Pdf: psUrls[1],
    module3Pdf: psUrls[2],
    module4Pdf: psUrls[3],
    module5Pdf: psUrls[4],
    pdfUrl: psMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(psDoc);
  console.log(`  [SAVED NOTE] ${psDoc.title} (_id: ${psDoc._id})\n`);

  // -------------------------------------------------------------
  // 3. 23A02403T Induction and Synchronous Machines (Theory)
  // -------------------------------------------------------------
  console.log("3. Processing Theory: 23A02403T Induction and Synchronous");
  const isDir = path.join(SOURCE_BASE, "23A02403T Induction and Synchronous");
  const isFiles = [
    { file: "23A02403T_Unit1_Induction_Synchronous_Machines.pdf", mod: "Unit 1: Three Phase Induction Motors Principles, Construction & Characteristics", dest: "EEE_2-2_23A02403T_Unit1_Induction_Synchronous_Machines.pdf" },
    { file: "23A02403T_Unit2_Induction_Synchronous_Machines.pdf", mod: "Unit 2: Starting, Speed Control & Circle Diagrams of Induction Motors", dest: "EEE_2-2_23A02403T_Unit2_Induction_Synchronous_Machines.pdf" },
    { file: "23A02403T_Unit3_Induction_Synchronous_Machines.pdf", mod: "Unit 3: Single Phase Induction Motors & Special Purpose Machines", dest: "EEE_2-2_23A02403T_Unit3_Induction_Synchronous_Machines.pdf" },
    { file: "23A02403T_Unit4_Induction_Synchronous_Machines.pdf", mod: "Unit 4: Synchronous Generators / Alternators, Regulation & Parallel Operation", dest: "EEE_2-2_23A02403T_Unit4_Induction_Synchronous_Machines.pdf" },
    { file: "23A02403T_Unit5_Induction_Synchronous_Machines.pdf", mod: "Unit 5: Synchronous Motors Principles, V & Inverted V Curves, and Hunting", dest: "EEE_2-2_23A02403T_Unit5_Induction_Synchronous_Machines.pdf" },
  ];
  const isSources = [];
  const isUrls = [];
  for (const f of isFiles) {
    const src = path.join(isDir, f.file);
    isSources.push(src);
    isUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const isMergedUrl = await mergePdfs(isSources, "EEE_2-2_23A02403T_Induction_and_Synchronous_Machines_Complete_Notes.pdf");
  const isDoc = await Note.create({
    title: "Induction and Synchronous Machines Notes",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Induction and Synchronous Machines",
    subjectCode: "23A02403T",
    description: "Complete unit-wise lecture notes for Induction and Synchronous Machines (23A02403T) for EEE 2-2 semester under JNTU R23. Covers 3-Phase Induction Motors, Starting & Speed Control, Single Phase Motors, Alternator Voltage Regulation (EMF, MMF, Potier, ASA), and Synchronous Motor Operating Dynamics.",
    credits: "3",
    module1: isFiles[0].mod,
    module2: isFiles[1].mod,
    module3: isFiles[2].mod,
    module4: isFiles[3].mod,
    module5: isFiles[4].mod,
    module1Pdf: isUrls[0],
    module2Pdf: isUrls[1],
    module3Pdf: isUrls[2],
    module4Pdf: isUrls[3],
    module5Pdf: isUrls[4],
    pdfUrl: isMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(isDoc);
  console.log(`  [SAVED NOTE] ${isDoc.title} (_id: ${isDoc._id})\n`);

  // -------------------------------------------------------------
  // 4. 23A02404T Control Systems (Theory)
  // -------------------------------------------------------------
  console.log("4. Processing Theory: 23A02404T Control Systems");
  const csDir = path.join(SOURCE_BASE, "23A02404T Control Systems");
  const csFiles = [
    { file: "Control_Systems_23A02404T_Unit1_Notes.pdf", mod: "Unit 1: Introduction to Control Systems & Mathematical Modeling (Transfer Functions & Block Diagrams)", dest: "EEE_2-2_23A02404T_Unit1_Control_Systems.pdf" },
    { file: "Control_Systems_23A02404T_Unit2_Notes.pdf", mod: "Unit 2: Time Response Analysis & Steady State Errors of Feedback Systems", dest: "EEE_2-2_23A02404T_Unit2_Control_Systems.pdf" },
    { file: "Control_Systems_23A02404T_Unit3_Notes.pdf", mod: "Unit 3: Stability Analysis, Routh-Hurwitz Criterion & Root Locus Technique", dest: "EEE_2-2_23A02404T_Unit3_Control_Systems.pdf" },
    { file: "Control_Systems_23A02404T_Unit4_Notes.pdf", mod: "Unit 4: Frequency Response Analysis (Bode Plots, Polar Plots & Nyquist Stability)", dest: "EEE_2-2_23A02404T_Unit4_Control_Systems.pdf" },
    { file: "Control_Systems_23A02404T_Unit5_Notes.pdf", mod: "Unit 5: State Space Analysis of Continuous Time Systems & Compensators Design", dest: "EEE_2-2_23A02404T_Unit5_Control_Systems.pdf" },
  ];
  const csSources = [];
  const csUrls = [];
  for (const f of csFiles) {
    const src = path.join(csDir, f.file);
    csSources.push(src);
    csUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const csMergedUrl = await mergePdfs(csSources, "EEE_2-2_23A02404T_Control_Systems_Complete_Notes.pdf");
  const csDoc = await Note.create({
    title: "Control Systems Notes",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Control Systems",
    subjectCode: "23A02404T",
    description: "Complete university study notes for Control Systems (23A02404T) under JNTU R23 for EEE 2-2 semester. Covers Mathematical Modeling & Signal Flow Graphs, Time Domain Performance Specifications, Root Locus, Frequency Domain Stability (Bode & Nyquist Plots), and State Space Modeling.",
    credits: "3",
    module1: csFiles[0].mod,
    module2: csFiles[1].mod,
    module3: csFiles[2].mod,
    module4: csFiles[3].mod,
    module5: csFiles[4].mod,
    module1Pdf: csUrls[0],
    module2Pdf: csUrls[1],
    module3Pdf: csUrls[2],
    module4Pdf: csUrls[3],
    module5Pdf: csUrls[4],
    pdfUrl: csMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(csDoc);
  console.log(`  [SAVED NOTE] ${csDoc.title} (_id: ${csDoc._id})\n`);

  // -------------------------------------------------------------
  // 5. 23A05304 Python Programming (Theory / Skill Course)
  // -------------------------------------------------------------
  console.log("5. Processing Theory: 23A05304 Python Programming");
  const pyDir = path.join(SOURCE_BASE, "23A05304 Python Programming");
  const pyFiles = [
    { file: "Python_Unit_I_Basics_and_Control_Flow.pdf", mod: "Unit 1: Python Basics, Data Types, Operators & Control Flow Statements", dest: "EEE_2-2_23A05304_Unit1_Python_Programming.pdf" },
    { file: "Python_Unit_II_Functions_Strings_Lists.pdf", mod: "Unit 2: Functions, Scope, Strings & Lists Manipulation", dest: "EEE_2-2_23A05304_Unit2_Python_Programming.pdf" },
    { file: "Python_Unit_III_Dictionaries_Tuples_Sets.pdf", mod: "Unit 3: Dictionaries, Tuples, Sets & Compound Data Structures", dest: "EEE_2-2_23A05304_Unit3_Python_Programming.pdf" },
    { file: "Python_Unit_IV_Files_and_OOP.pdf", mod: "Unit 4: File Handling, Exceptions & Object Oriented Programming (OOP)", dest: "EEE_2-2_23A05304_Unit4_Python_Programming.pdf" },
    { file: "Python_Unit_V_Introduction_to_Data_Science.pdf", mod: "Unit 5: Python Libraries for Data Science (NumPy, Pandas & Matplotlib)", dest: "EEE_2-2_23A05304_Unit5_Python_Programming.pdf" },
  ];
  const pySources = [];
  const pyUrls = [];
  for (const f of pyFiles) {
    const src = path.join(pyDir, f.file);
    pySources.push(src);
    pyUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const pyMergedUrl = await mergePdfs(pySources, "EEE_2-2_23A05304_Python_Programming_Complete_Notes.pdf");
  const pyDoc = await Note.create({
    title: "Python Programming Notes",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Python Programming",
    subjectCode: "23A05304",
    description: "Unit-wise notes for Python Programming (23A05304) under JNTU R23 Curriculum for EEE 2-2 semester. Covers Fundamentals, Functions, Modular Design, Object Oriented Programming, File I/O, Exception Handling, and Data Science Fundamentals with NumPy and Pandas.",
    credits: "2",
    module1: pyFiles[0].mod,
    module2: pyFiles[1].mod,
    module3: pyFiles[2].mod,
    module4: pyFiles[3].mod,
    module5: pyFiles[4].mod,
    module1Pdf: pyUrls[0],
    module2Pdf: pyUrls[1],
    module3Pdf: pyUrls[2],
    module4Pdf: pyUrls[3],
    module5Pdf: pyUrls[4],
    pdfUrl: pyMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(pyDoc);
  console.log(`  [SAVED NOTE] ${pyDoc.title} (_id: ${pyDoc._id})\n`);

  // -------------------------------------------------------------
  // 6. 23A52402a Managerial Economics and Financial Analysis (Humanities Elective)
  // -------------------------------------------------------------
  console.log("6. Processing Theory: 23A52402a Managerial Economics and Financial Analysis(2)");
  const mefaDir = path.join(SOURCE_BASE, "23A52402a Managerial Economics and Financial Analysis(2)");
  const mefaFiles = [
    { file: "MEFA_23A52402a_Unit_1_Managerial_Economics.pdf", mod: "Unit 1: Introduction to Managerial Economics & Demand Analysis", dest: "EEE_2-2_23A52402A_Unit1_MEFA.pdf" },
    { file: "MEFA_23A52402a_Unit_2_Production_and_Cost_Analysis.pdf", mod: "Unit 2: Production Function, Laws of Returns & Cost Analysis", dest: "EEE_2-2_23A52402A_Unit2_MEFA.pdf" },
    { file: "MEFA_23A52402a_Unit_3_Business_Organizations_and_Markets.pdf", mod: "Unit 3: Business Organizations & Market Structures (Pricing Strategies)", dest: "EEE_2-2_23A52402A_Unit3_MEFA.pdf" },
    { file: "MEFA_23A52402a_Unit_4_Capital_Budgeting.pdf", mod: "Unit 4: Capital Budgeting & Investment Evaluation Methods", dest: "EEE_2-2_23A52402A_Unit4_MEFA.pdf" },
    { file: "MEFA_23A52402a_Unit_5_Financial_Accounting_and_Analysis.pdf", mod: "Unit 5: Financial Accounting, Financial Statements & Ratio Analysis", dest: "EEE_2-2_23A52402A_Unit5_MEFA.pdf" },
  ];
  const mefaSources = [];
  const mefaUrls = [];
  for (const f of mefaFiles) {
    const src = path.join(mefaDir, f.file);
    mefaSources.push(src);
    mefaUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const mefaMergedUrl = await mergePdfs(mefaSources, "EEE_2-2_23A52402A_Managerial_Economics_and_Financial_Analysis_Complete_Notes.pdf");
  const mefaDoc = await Note.create({
    title: "Managerial Economics and Financial Analysis Notes",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Managerial Economics and Financial Analysis",
    subjectCode: "23A52402A",
    description: "Comprehensive notes for Managerial Economics and Financial Analysis (23A52402a) under JNTU R23 Curriculum for EEE 2-2 semester. Covers Demand Analysis, Production and Cost Analysis, Market Structures & Pricing, Capital Budgeting, and Financial Statement Ratio Analysis.",
    credits: "2",
    module1: mefaFiles[0].mod,
    module2: mefaFiles[1].mod,
    module3: mefaFiles[2].mod,
    module4: mefaFiles[3].mod,
    module5: mefaFiles[4].mod,
    module1Pdf: mefaUrls[0],
    module2Pdf: mefaUrls[1],
    module3Pdf: mefaUrls[2],
    module4Pdf: mefaUrls[3],
    module5Pdf: mefaUrls[4],
    pdfUrl: mefaMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(mefaDoc);
  console.log(`  [SAVED NOTE] ${mefaDoc.title} (_id: ${mefaDoc._id})\n`);

  // -------------------------------------------------------------
  // 7. 23A52402b Organizational Behavior (Humanities Elective)
  // -------------------------------------------------------------
  console.log("7. Processing Theory: 23A52402b Organizational Behavior(2)");
  const obDir = path.join(SOURCE_BASE, "23A52402b Organizational Behavior(2)");
  const obFiles = [
    { file: "OB_U1.pdf", mod: "Unit 1: Introduction to Organizational Behavior, Personality & Perceptions", dest: "EEE_2-2_23A52402B_Unit1_Organizational_Behavior.pdf" },
    { file: "OB_U2.pdf", mod: "Unit 2: Learning, Values, Attitudes & Job Satisfaction Dynamics", dest: "EEE_2-2_23A52402B_Unit2_Organizational_Behavior.pdf" },
    { file: "OB_U3.pdf", mod: "Unit 3: Motivation Theories & Behavioral Workplace Applications", dest: "EEE_2-2_23A52402B_Unit3_Organizational_Behavior.pdf" },
    { file: "OB_U4.pdf", mod: "Unit 4: Group Dynamics, Teams, Communication & Leadership Styles", dest: "EEE_2-2_23A52402B_Unit4_Organizational_Behavior.pdf" },
    { file: "OB_U5.pdf", mod: "Unit 5: Organizational Culture, Conflict Resolution & Change Management", dest: "EEE_2-2_23A52402B_Unit5_Organizational_Behavior.pdf" },
  ];
  const obSources = [];
  const obUrls = [];
  for (const f of obFiles) {
    const src = path.join(obDir, f.file);
    obSources.push(src);
    obUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const obMergedUrl = await mergePdfs(obSources, "EEE_2-2_23A52402B_Organizational_Behavior_Complete_Notes.pdf");
  const obDoc = await Note.create({
    title: "Organizational Behavior Notes",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Organizational Behavior",
    subjectCode: "23A52402B",
    description: "Detailed unit notes for Organizational Behavior (23A52402b) under JNTU R23 Curriculum for EEE 2-2 semester. Covers Individual Personality, Perception & Learning, Motivation Principles, Team Dynamics, Leadership Models, and Organizational Change Strategies.",
    credits: "2",
    module1: obFiles[0].mod,
    module2: obFiles[1].mod,
    module3: obFiles[2].mod,
    module4: obFiles[3].mod,
    module5: obFiles[4].mod,
    module1Pdf: obUrls[0],
    module2Pdf: obUrls[1],
    module3Pdf: obUrls[2],
    module4Pdf: obUrls[3],
    module5Pdf: obUrls[4],
    pdfUrl: obMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(obDoc);
  console.log(`  [SAVED NOTE] ${obDoc.title} (_id: ${obDoc._id})\n`);

  // -------------------------------------------------------------
  // 8. 23A52402c Business Environment (Humanities Elective)
  // -------------------------------------------------------------
  console.log("8. Processing Theory: 23A52402c Business Environment");
  const beDir = path.join(SOURCE_BASE, "23A52402c Business Environment");
  const beFiles = [
    { file: "BE_23A52402c_UnitI_Notes.pdf", mod: "Unit 1: Dynamics of Business Environment & Economic Policies", dest: "EEE_2-2_23A52402C_Unit1_Business_Environment.pdf" },
    { file: "BE_23A52402c_UnitII_Notes.pdf", mod: "Unit 2: Industrial Policy, Licensing & Privatization (LPG Framework)", dest: "EEE_2-2_23A52402C_Unit2_Business_Environment.pdf" },
    { file: "BE_23A52402c_UnitIII_Notes.pdf", mod: "Unit 3: Fiscal Policy, Monetary Policy & Indian Financial System", dest: "EEE_2-2_23A52402C_Unit3_Business_Environment.pdf" },
    { file: "BE_23A52402c_UnitIV_Notes.pdf", mod: "Unit 4: International Trade Environment, Foreign Trade Policy & FDI", dest: "EEE_2-2_23A52402C_Unit4_Business_Environment.pdf" },
    { file: "BE_23A52402c_UnitV_Notes.pdf", mod: "Unit 5: WTO Agreements, Globalization & Ethical Corporate Governance", dest: "EEE_2-2_23A52402C_Unit5_Business_Environment.pdf" },
  ];
  const beSources = [];
  const beUrls = [];
  for (const f of beFiles) {
    const src = path.join(beDir, f.file);
    beSources.push(src);
    beUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const beMergedUrl = await mergePdfs(beSources, "EEE_2-2_23A52402C_Business_Environment_Complete_Notes.pdf");
  const beDoc = await Note.create({
    title: "Business Environment Notes",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Business Environment",
    subjectCode: "23A52402C",
    description: "Academic lecture notes for Business Environment (23A52402c) under JNTU R23 Curriculum for EEE 2-2 semester. Covers Environmental Analysis, Industrial & Licensing Policies, Monetary and Fiscal Policies, Foreign Direct Investment (FDI), and WTO Framework.",
    credits: "2",
    module1: beFiles[0].mod,
    module2: beFiles[1].mod,
    module3: beFiles[2].mod,
    module4: beFiles[3].mod,
    module5: beFiles[4].mod,
    module1Pdf: beUrls[0],
    module2Pdf: beUrls[1],
    module3Pdf: beUrls[2],
    module4Pdf: beUrls[3],
    module5Pdf: beUrls[4],
    pdfUrl: beMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(beDoc);
  console.log(`  [SAVED NOTE] ${beDoc.title} (_id: ${beDoc._id})\n`);

  // =============================================================
  // SECTION 2: LAB PROGRAMS (Stored in LabProgram collection)
  // =============================================================

  // -------------------------------------------------------------
  // 9. 23A02403P Induction and Synchronous Machines Lab (Lab)
  // -------------------------------------------------------------
  console.log("9. Processing Lab: 23A02403P Induction and Synchronous Machines Lab");
  const isLabDir = path.join(SOURCE_BASE, "23A02403P Induction and Synchronous Machines Lab");
  const isLabFile = "Induction_Synchronous_Machines_Lab_23A02403P_All_Experiments.pdf";
  const isLabSrc = path.join(isLabDir, isLabFile);
  const isLabUrl = copyFileSafe(isLabSrc, "EEE_2-2_23A02403P_Induction_and_Synchronous_Machines_Lab_Manual.pdf");
  copyFileSafe(isLabSrc, isLabFile);

  const isLabDoc = await LabProgram.create({
    title: "Induction and Synchronous Machines Lab Manual",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Induction and Synchronous Machines Lab",
    subjectCode: "23A02403P",
    description: "Complete laboratory manual, circuit connections, load test procedures, circle diagram determinations, synchronization methods, and observation calculations for Induction and Synchronous Machines Lab (23A02403P) under JNTU R23 Curriculum for EEE 2-2 semester.",
    pdfUrl: isLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(isLabDoc);
  console.log(`  [SAVED LAB] ${isLabDoc.title} (_id: ${isLabDoc._id})\n`);

  // -------------------------------------------------------------
  // 10. 23A02404P Control Systems Lab (Lab)
  // -------------------------------------------------------------
  console.log("10. Processing Lab: 23A02404P Control Systems Lab");
  const csLabDir = path.join(SOURCE_BASE, "23A02404P Control Systems Lab");
  const csLabFile = "Control_Systems_Lab_23A02404P_All_Experiments.pdf";
  const csLabSrc = path.join(csLabDir, csLabFile);
  const csLabUrl = copyFileSafe(csLabSrc, "EEE_2-2_23A02404P_Control_Systems_Lab_Manual.pdf");
  copyFileSafe(csLabSrc, csLabFile);

  const csLabDoc = await LabProgram.create({
    title: "Control Systems Lab Manual",
    branch: "EEE",
    semester: "2-2",
    regulation: "R23",
    subject: "Control Systems Lab",
    subjectCode: "23A02404P",
    description: "Comprehensive laboratory manual, hardware experiment procedures (time response of second order systems, synchros, AC/DC servo motors, lag/lead compensators) and MATLAB/Simulink simulations (root locus, Bode plots, state space analysis) for Control Systems Lab (23A02404P) under JNTU R23 Curriculum for EEE 2-2 semester.",
    pdfUrl: csLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(csLabDoc);
  console.log(`  [SAVED LAB] ${csLabDoc.title} (_id: ${csLabDoc._id})\n`);

  // =============================================================
  // SECTION 3: CACHE INVALIDATION & FINAL VERIFICATION
  // =============================================================
  console.log("Invalidating Feed Cache...");
  if (typeof invalidateFeedCache === "function") {
    invalidateFeedCache();
    console.log("  [CACHE] In-memory feed cache invalidated.");
  }

  console.log("\n==================================================");
  console.log("SUMMARY OF EEE 2-2 INGESTION");
  console.log(`Theory Notes Saved in Note collection: ${createdNotes.length}`);
  createdNotes.forEach((n) => console.log(`  - [${n.subjectCode}] ${n.subject} (PDF: ${n.pdfUrl})`));

  console.log(`\nLab Programs Saved in LabProgram collection: ${createdLabs.length}`);
  createdLabs.forEach((l) => console.log(`  - [${l.subjectCode}] ${l.subject} (PDF: ${l.pdfUrl})`));
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Database disconnected. Done!");
}

uploadEee2_2().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
