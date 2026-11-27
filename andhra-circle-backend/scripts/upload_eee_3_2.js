const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\EEE\\3-2";
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

async function uploadEee3_2() {
  console.log("==================================================");
  console.log("STARTING EEE 3-2 CURRICULUM INGESTION");
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

  console.log("Cleaning any previous EEE 3-2 notes and labs to avoid duplicates...");
  const delNotes = await Note.deleteMany({ branch: "EEE", semester: "3-2" });
  const delLabs = await LabProgram.deleteMany({ branch: "EEE", semester: "3-2" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} notes and ${delLabs.deletedCount} lab programs.\n`);

  const createdNotes = [];
  const createdLabs = [];

  // =============================================================
  // SECTION 1: THEORY SUBJECTS (Stored in Note collection)
  // =============================================================

  // -------------------------------------------------------------
  // 1. 23A02601T Electrical Measurements and Instrumentation
  // -------------------------------------------------------------
  console.log("1. Processing Theory: 23A02601T Electrical Measurements and Instrumentation");
  const emiDir = path.join(SOURCE_BASE, "23A02601T Electrical Measurements and Instrumentation");
  const emiFiles = [
    { file: "EMI_Unit_I.pdf", mod: "Unit 1: Measuring Instruments & Galvanometers (PMMC, MI, Dynamometer Instruments)", dest: "EEE_3-2_23A02601T_Unit1_EMI.pdf" },
    { file: "EMI_Unit_II.pdf", mod: "Unit 2: Measurement of Power and Energy (Wattmeters, Induction Energy Meters & CT/PT)", dest: "EEE_3-2_23A02601T_Unit2_EMI.pdf" },
    { file: "EMI_Unit_III.pdf", mod: "Unit 3: DC and AC Bridges (Wheatstone, Kelvin, Maxwell, Hay, Anderson, Schering, Wien Bridges)", dest: "EEE_3-2_23A02601T_Unit3_EMI.pdf" },
    { file: "EMI_Unit_IV.pdf", mod: "Unit 4: Potentiometers & Magnetic Measurements (DC/AC Potentiometers, Ballistic Galvanometer)", dest: "EEE_3-2_23A02601T_Unit4_EMI.pdf" },
    { file: "EMI_Unit_V.pdf", mod: "Unit 5: Transducers, Digital Voltmeters & CRO (LVDT, Strain Gauges, DVM & Oscilloscopes)", dest: "EEE_3-2_23A02601T_Unit5_EMI.pdf" },
  ];
  const emiSources = [];
  const emiUrls = [];
  for (const f of emiFiles) {
    const src = path.join(emiDir, f.file);
    emiSources.push(src);
    emiUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const emiMergedUrl = await mergePdfs(emiSources, "EEE_3-2_23A02601T_Electrical_Measurements_and_Instrumentation_Complete_Notes.pdf");
  const emiDoc = await Note.create({
    title: "Electrical Measurements and Instrumentation Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Electrical Measurements and Instrumentation",
    subjectCode: "23A02601T",
    description: "Complete study material for Electrical Measurements and Instrumentation (23A02601T) under JNTU R23 Curriculum for EEE 3-2 semester. Covers Indicating Instruments, Power & Energy Measurements, DC/AC Bridges for R-L-C Measurement, Potentiometers & Magnetic Measurements, and Transducers with Digital Instruments.",
    credits: "3",
    module1: emiFiles[0].mod,
    module2: emiFiles[1].mod,
    module3: emiFiles[2].mod,
    module4: emiFiles[3].mod,
    module5: emiFiles[4].mod,
    module1Pdf: emiUrls[0],
    module2Pdf: emiUrls[1],
    module3Pdf: emiUrls[2],
    module4Pdf: emiUrls[3],
    module5Pdf: emiUrls[4],
    pdfUrl: emiMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(emiDoc);
  console.log(`  [SAVED NOTE] ${emiDoc.title} (_id: ${emiDoc._id})\n`);

  // -------------------------------------------------------------
  // 2. 23A02602 Power System Analysis
  // -------------------------------------------------------------
  console.log("2. Processing Theory: 23A02602 Power System Analysis");
  const psaDir = path.join(SOURCE_BASE, "23A02602 Power System Analysis");
  const psaFiles = [
    { file: "Unit_I_Per_Unit_and_Ybus.pdf", mod: "Unit 1: Per Unit Representation and Bus Admittance Matrix (Ybus Formation)", dest: "EEE_3-2_23A02602_Unit1_PSA.pdf" },
    { file: "Unit_II_Formation_of_Zbus.pdf", mod: "Unit 2: Bus Impedance Matrix (Zbus Building Algorithm & Grounding)", dest: "EEE_3-2_23A02602_Unit2_PSA.pdf" },
    { file: "Unit_III_Power_Flow_Analysis.pdf", mod: "Unit 3: Power Flow Analysis (Gauss-Seidel, Newton-Raphson & Fast Decoupled Load Flow)", dest: "EEE_3-2_23A02602_Unit3_PSA.pdf" },
    { file: "Unit_IV_Short_Circuit_Studies.pdf", mod: "Unit 4: Short Circuit Studies (Symmetrical and Unsymmetrical Fault Analysis)", dest: "EEE_3-2_23A02602_Unit4_PSA.pdf" },
    { file: "Unit_V_Stability_Analysis.pdf", mod: "Unit 5: Power System Stability (Swing Equation, Equal Area Criterion & Transient Stability)", dest: "EEE_3-2_23A02602_Unit5_PSA.pdf" },
  ];
  const psaSources = [];
  const psaUrls = [];
  for (const f of psaFiles) {
    const src = path.join(psaDir, f.file);
    psaSources.push(src);
    psaUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const psaMergedUrl = await mergePdfs(psaSources, "EEE_3-2_23A02602_Power_System_Analysis_Complete_Notes.pdf");
  const psaDoc = await Note.create({
    title: "Power System Analysis Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Power System Analysis",
    subjectCode: "23A02602",
    description: "Complete lecture notes for Power System Analysis (23A02602) under JNTU R23 Curriculum for EEE 3-2 semester. Covers Per-Unit Modeling, Network Matrices (Ybus & Zbus Formations), Load Flow Solutions (GS, NR, FDLF), Symmetrical & Unsymmetrical Fault Computations, and Steady-State & Transient Power System Stability.",
    credits: "3",
    module1: psaFiles[0].mod,
    module2: psaFiles[1].mod,
    module3: psaFiles[2].mod,
    module4: psaFiles[3].mod,
    module5: psaFiles[4].mod,
    module1Pdf: psaUrls[0],
    module2Pdf: psaUrls[1],
    module3Pdf: psaUrls[2],
    module4Pdf: psaUrls[3],
    module5Pdf: psaUrls[4],
    pdfUrl: psaMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(psaDoc);
  console.log(`  [SAVED NOTE] ${psaDoc.title} (_id: ${psaDoc._id})\n`);

  // -------------------------------------------------------------
  // 3. 23A02603a AI&ML for Electrical Engineers (Professional Elective - II)
  // -------------------------------------------------------------
  console.log("3. Processing Theory: 23A02603a AI&ML for Electrical Engineers");
  const aimlDir = path.join(SOURCE_BASE, "23A02603a AI&ML for Electrical Engineers");
  const aimlFiles = [
    { file: "Unit_1_Introduction_to_AI.pdf", mod: "Unit 1: Introduction to Artificial Intelligence & Heuristic Search Techniques", dest: "EEE_3-2_23A02603A_Unit1_AIML.pdf" },
    { file: "Unit_2_Overview_of_Machine_Learning.pdf", mod: "Unit 2: Overview of Machine Learning (Supervised, Unsupervised & Reinforcement Learning)", dest: "EEE_3-2_23A02603A_Unit2_AIML.pdf" },
    { file: "Unit_3_Artificial_Neural_Networks.pdf", mod: "Unit 3: Artificial Neural Networks (Perceptron, Multilayer Networks & Backpropagation)", dest: "EEE_3-2_23A02603A_Unit3_AIML.pdf" },
    { file: "Unit_4_Fuzzy_Logic.pdf", mod: "Unit 4: Fuzzy Logic Systems (Fuzzy Sets, Membership Functions, Inference & Defuzzification)", dest: "EEE_3-2_23A02603A_Unit4_AIML.pdf" },
    { file: "Unit_5_Applications_of_AI_Techniques.pdf", mod: "Unit 5: Applications of AI & ML Techniques in Power Systems, Fault Diagnosis & Drives", dest: "EEE_3-2_23A02603A_Unit5_AIML.pdf" },
  ];
  const aimlSources = [];
  const aimlUrls = [];
  for (const f of aimlFiles) {
    const src = path.join(aimlDir, f.file);
    aimlSources.push(src);
    aimlUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const aimlMergedUrl = await mergePdfs(aimlSources, "EEE_3-2_23A02603A_AI_and_ML_for_Electrical_Engineers_Complete_Notes.pdf");
  const aimlDoc = await Note.create({
    title: "AI&ML for Electrical Engineers Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "AI&ML for Electrical Engineers",
    subjectCode: "23A02603A",
    description: "Complete study notes for AI&ML for Electrical Engineers (23A02603a) under JNTU R23 Curriculum for EEE 3-2 semester. Covers Fundamentals of AI & Search Algorithms, Machine Learning Paradigms, Artificial Neural Networks Architecture & Training, Fuzzy Logic Controller Design, and Real-World Applications in Power Systems & Smart Grids.",
    credits: "3",
    module1: aimlFiles[0].mod,
    module2: aimlFiles[1].mod,
    module3: aimlFiles[2].mod,
    module4: aimlFiles[3].mod,
    module5: aimlFiles[4].mod,
    module1Pdf: aimlUrls[0],
    module2Pdf: aimlUrls[1],
    module3Pdf: aimlUrls[2],
    module4Pdf: aimlUrls[3],
    module5Pdf: aimlUrls[4],
    pdfUrl: aimlMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(aimlDoc);
  console.log(`  [SAVED NOTE] ${aimlDoc.title} (_id: ${aimlDoc._id})\n`);

  // -------------------------------------------------------------
  // 4. 23A02603b Programmable Logic Controllers (Professional Elective - II)
  // -------------------------------------------------------------
  console.log("4. Processing Theory: 23A02603b Programmable Logic Controllers");
  const plcDir = path.join(SOURCE_BASE, "23A02603b Programmable Logic Controllers");
  const plcFiles = [
    { file: "Unit1_Introduction_to_PLCs.pdf", mod: "Unit 1: Introduction to PLCs, Hardware Architecture & Operating Cycles", dest: "EEE_3-2_23A02603B_Unit1_PLC.pdf" },
    { file: "Unit2_PLC_Computational_Tool.pdf", mod: "Unit 2: PLC Computational Tools, Input/Output Processing & Modules", dest: "EEE_3-2_23A02603B_Unit2_PLC.pdf" },
    { file: "Unit3_PLC_Development.pdf", mod: "Unit 3: PLC System Development & Ladder Logic Design Principles", dest: "EEE_3-2_23A02603B_Unit3_PLC.pdf" },
    { file: "Unit4_PLC_Programming.pdf", mod: "Unit 4: PLC Programming (Timers, Counters, Shift Registers & Math Functions)", dest: "EEE_3-2_23A02603B_Unit4_PLC.pdf" },
    { file: "Unit5_Applications.pdf", mod: "Unit 5: Industrial Automation Applications & SCADA Integration with PLCs", dest: "EEE_3-2_23A02603B_Unit5_PLC.pdf" },
  ];
  const plcSources = [];
  const plcUrls = [];
  for (const f of plcFiles) {
    const src = path.join(plcDir, f.file);
    plcSources.push(src);
    plcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const plcMergedUrl = await mergePdfs(plcSources, "EEE_3-2_23A02603B_Programmable_Logic_Controllers_Complete_Notes.pdf");
  const plcDoc = await Note.create({
    title: "Programmable Logic Controllers Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Programmable Logic Controllers",
    subjectCode: "23A02603B",
    description: "Detailed unit notes for Programmable Logic Controllers (23A02603b) under JNTU R23 Curriculum for EEE 3-2 semester. Covers PLC Architecture, Signal Conditioning & I/O Modules, Ladder Logic Programming, Advanced Instructions (Timers, Counters, Sequencers), and Industrial Applications in Process Control & Automation.",
    credits: "3",
    module1: plcFiles[0].mod,
    module2: plcFiles[1].mod,
    module3: plcFiles[2].mod,
    module4: plcFiles[3].mod,
    module5: plcFiles[4].mod,
    module1Pdf: plcUrls[0],
    module2Pdf: plcUrls[1],
    module3Pdf: plcUrls[2],
    module4Pdf: plcUrls[3],
    module5Pdf: plcUrls[4],
    pdfUrl: plcMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(plcDoc);
  console.log(`  [SAVED NOTE] ${plcDoc.title} (_id: ${plcDoc._id})\n`);

  // -------------------------------------------------------------
  // 5. 23A02603c Switchgear and Protection (Professional Elective - II)
  // -------------------------------------------------------------
  console.log("5. Processing Theory: 23A02603c Switchgear and Protection");
  const sgpDir = path.join(SOURCE_BASE, "23A02603c Switchgear and Protection");
  const sgpFiles = [
    { file: "Switchgear_and_Protection_23A02603c_Unit_I.pdf", mod: "Unit 1: Circuit Breakers (Arc Phenomena, Air Break, Oil, Vacuum & SF6 Breakers)", dest: "EEE_3-2_23A02603C_Unit1_SGP.pdf" },
    { file: "Switchgear_and_Protection_23A02603c_Unit_II.pdf", mod: "Unit 2: Electromagnetic & Static Relays (Overcurrent, Directional & Distance Relays)", dest: "EEE_3-2_23A02603C_Unit2_SGP.pdf" },
    { file: "Switchgear_and_Protection_23A02603c_Unit_III.pdf", mod: "Unit 3: Generator and Transformer Protection Schemes (Differential, Buchholz, Stator Faults)", dest: "EEE_3-2_23A02603C_Unit3_SGP.pdf" },
    { file: "Switchgear_and_Protection_23A02603c_Unit_IV.pdf", mod: "Unit 4: Feeder, Busbar & Transmission Line Protection (Carrier Current & Distance)", dest: "EEE_3-2_23A02603C_Unit4_SGP.pdf" },
    { file: "Switchgear_and_Protection_23A02603c_Unit_V.pdf", mod: "Unit 5: Overvoltage Protection, Surges, Lightning Arresters & Neutral Grounding", dest: "EEE_3-2_23A02603C_Unit5_SGP.pdf" },
  ];
  const sgpSources = [];
  const sgpUrls = [];
  for (const f of sgpFiles) {
    const src = path.join(sgpDir, f.file);
    sgpSources.push(src);
    sgpUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const sgpMergedUrl = await mergePdfs(sgpSources, "EEE_3-2_23A02603C_Switchgear_and_Protection_Complete_Notes.pdf");
  const sgpDoc = await Note.create({
    title: "Switchgear and Protection Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Switchgear and Protection",
    subjectCode: "23A02603C",
    description: "Complete study material for Switchgear and Protection (23A02603c) under JNTU R23 Curriculum for EEE 3-2 semester. Covers Modern Circuit Breakers (Vacuum & SF6), Electromagnetic, Static and Microprocessor-based Relays, Equipment Protection (Alternators, Transformers, Feeders, Busbars), and Surge Protection with Grounding.",
    credits: "3",
    module1: sgpFiles[0].mod,
    module2: sgpFiles[1].mod,
    module3: sgpFiles[2].mod,
    module4: sgpFiles[3].mod,
    module5: sgpFiles[4].mod,
    module1Pdf: sgpUrls[0],
    module2Pdf: sgpUrls[1],
    module3Pdf: sgpUrls[2],
    module4Pdf: sgpUrls[3],
    module5Pdf: sgpUrls[4],
    pdfUrl: sgpMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(sgpDoc);
  console.log(`  [SAVED NOTE] ${sgpDoc.title} (_id: ${sgpDoc._id})\n`);

  // -------------------------------------------------------------
  // 6. 23A02604a Communication systems (Professional Elective - III)
  // -------------------------------------------------------------
  console.log("6. Processing Theory: 23A02604a Communication systems");
  const csDir = path.join(SOURCE_BASE, "23A02604a Communication systems");
  const csFiles = [
    { file: "Unit1_Analog_Communication-I_23A02604a.pdf", mod: "Unit 1: Analog Communication - I (Amplitude Modulation, DSB-SC, SSB, VSB)", dest: "EEE_3-2_23A02604A_Unit1_Communication.pdf" },
    { file: "Unit2_Analog_Communication-II_23A02604a.pdf", mod: "Unit 2: Analog Communication - II (Angle Modulation, Frequency Modulation & Receivers)", dest: "EEE_3-2_23A02604A_Unit2_Communication.pdf" },
    { file: "Unit3_Digital_Communications-I_23A02604a.pdf", mod: "Unit 3: Digital Communications - I (Pulse Modulation, PAM, PWM, PPM, PCM & Delta Mod)", dest: "EEE_3-2_23A02604A_Unit3_Communication.pdf" },
    { file: "Unit4_Digital_Communications-II_23A02604a.pdf", mod: "Unit 4: Digital Communications - II (Digital Carrier Modulation ASK, FSK, PSK & QPSK)", dest: "EEE_3-2_23A02604A_Unit4_Communication.pdf" },
    { file: "Unit5_Wireless_Communications_23A02604a.pdf", mod: "Unit 5: Wireless Communications & Cellular System Fundamentals", dest: "EEE_3-2_23A02604A_Unit5_Communication.pdf" },
  ];
  const csSources = [];
  const csUrls = [];
  for (const f of csFiles) {
    const src = path.join(csDir, f.file);
    csSources.push(src);
    csUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const csMergedUrl = await mergePdfs(csSources, "EEE_3-2_23A02604A_Communication_Systems_Complete_Notes.pdf");
  const csDoc = await Note.create({
    title: "Communication Systems Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Communication Systems",
    subjectCode: "23A02604A",
    description: "Complete study material for Communication Systems (23A02604a) under JNTU R23 Curriculum for EEE 3-2 semester. Covers Amplitude Modulation and Demodulation, Frequency and Phase Modulation, Pulse Modulation Techniques (PAM, PWM, PCM), Digital Modulation Schemes (ASK, FSK, PSK, QPSK), and Modern Wireless Cellular Principles.",
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
  // 7. 23A02604b Electric Drives (Professional Elective - III)
  // -------------------------------------------------------------
  console.log("7. Processing Theory: 23A02604b Electric Drives");
  const edDir = path.join(SOURCE_BASE, "23A02604b Electric Drives");
  const edFiles = [
    { file: "Electric_Drives_23A02604b_Unit1_Introduction_to_Electric_Drives.pdf", mod: "Unit 1: Introduction to Electric Drives, Dynamics & Multi-Quadrant Operation", dest: "EEE_3-2_23A02604B_Unit1_Electric_Drives.pdf" },
    { file: "Electric_Drives_23A02604b_Unit2_Converter_Fed_DC_Drives.pdf", mod: "Unit 2: Phase Converter Fed DC Motor Drives & Dual Converters", dest: "EEE_3-2_23A02604B_Unit2_Electric_Drives.pdf" },
    { file: "Electric_Drives_23A02604b_Unit3_DC_Chopper_Fed_Drives.pdf", mod: "Unit 3: DC Chopper Fed Drives & Regenerative Braking Operations", dest: "EEE_3-2_23A02604B_Unit3_Electric_Drives.pdf" },
    { file: "Electric_Drives_23A02604b_Unit4_Induction_Motor_Drives.pdf", mod: "Unit 4: Induction Motor Drives (Stator Voltage, V/f Control & Slip Power Recovery)", dest: "EEE_3-2_23A02604B_Unit4_Electric_Drives.pdf" },
    { file: "Electric_Drives_23A02604b_Unit5_Synchronous_and_Stepper_Motor_Drives.pdf", mod: "Unit 5: Synchronous Motor Drives, Permanent Magnet Motors & Stepper Drives", dest: "EEE_3-2_23A02604B_Unit5_Electric_Drives.pdf" },
  ];
  const edSources = [];
  const edUrls = [];
  for (const f of edFiles) {
    const src = path.join(edDir, f.file);
    edSources.push(src);
    edUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const edMergedUrl = await mergePdfs(edSources, "EEE_3-2_23A02604B_Electric_Drives_Complete_Notes.pdf");
  const edDoc = await Note.create({
    title: "Electric Drives Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Electric Drives",
    subjectCode: "23A02604B",
    description: "Complete study notes for Electric Drives (23A02604b) under JNTU R23 Curriculum for EEE 3-2 semester. Covers Dynamics of Motor-Load Systems, Phase-Controlled & Chopper-Controlled DC Drives, Inverter-Fed Induction Motor Drives (V/f & Vector Control), and Synchronous & Permanent Magnet Brushless Drives.",
    credits: "3",
    module1: edFiles[0].mod,
    module2: edFiles[1].mod,
    module3: edFiles[2].mod,
    module4: edFiles[3].mod,
    module5: edFiles[4].mod,
    module1Pdf: edUrls[0],
    module2Pdf: edUrls[1],
    module3Pdf: edUrls[2],
    module4Pdf: edUrls[3],
    module5Pdf: edUrls[4],
    pdfUrl: edMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(edDoc);
  console.log(`  [SAVED NOTE] ${edDoc.title} (_id: ${edDoc._id})\n`);

  // -------------------------------------------------------------
  // 8. 23A02604c Renewable and Distributed Energy Technologies (Professional Elective - III)
  // -------------------------------------------------------------
  console.log("8. Processing Theory: 23A02604c Renewable and Distributed Energy Technologies");
  const rdeDir = path.join(SOURCE_BASE, "23A02604c Renewable and Distributed Energy Technologies");
  const rdeFiles = [
    { file: "Unit_I_Energy_Scenario_and_Solar_Energy.pdf", mod: "Unit 1: Energy Scenario & Solar Energy Technologies (PV Cells, MPPT & Solar Thermal)", dest: "EEE_3-2_23A02604C_Unit1_RDET.pdf" },
    { file: "Unit_II_Wind_and_Other_Energy_Systems.pdf", mod: "Unit 2: Wind Energy Systems & Other Sources (Biomass, Geothermal, Ocean Energy)", dest: "EEE_3-2_23A02604C_Unit2_RDET.pdf" },
    { file: "Unit_III_Energy_Storage_and_Green_Energy.pdf", mod: "Unit 3: Energy Storage Systems & Green Technologies (Batteries, Fuel Cells, Supercapacitors)", dest: "EEE_3-2_23A02604C_Unit3_RDET.pdf" },
    { file: "Unit_IV_Introduction_to_DG_and_its_Grid_Integration.pdf", mod: "Unit 4: Introduction to Distributed Generation (DG) & Grid Integration Concepts", dest: "EEE_3-2_23A02604C_Unit4_RDET.pdf" },
    { file: "Unit_V_Technical_Impact_Economic_and_Control_Aspects_of_DG.pdf", mod: "Unit 5: Technical Impacts, Economic Viability & Control Strategies of DG Systems", dest: "EEE_3-2_23A02604C_Unit5_RDET.pdf" },
  ];
  const rdeSources = [];
  const rdeUrls = [];
  for (const f of rdeFiles) {
    const src = path.join(rdeDir, f.file);
    rdeSources.push(src);
    rdeUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const rdeMergedUrl = await mergePdfs(rdeSources, "EEE_3-2_23A02604C_Renewable_and_Distributed_Energy_Technologies_Complete_Notes.pdf");
  const rdeDoc = await Note.create({
    title: "Renewable and Distributed Energy Technologies Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Renewable and Distributed Energy Technologies",
    subjectCode: "23A02604C",
    description: "Complete study material for Renewable and Distributed Energy Technologies (23A02604c) under JNTU R23 Curriculum for EEE 3-2 semester. Covers Solar PV and Concentrated Solar Power, Wind Turbines & Aerodynamics, Energy Storage Systems & Fuel Cells, Distributed Generation (DG) Architectures, and Microgrid & Grid Integration Challenges.",
    credits: "3",
    module1: rdeFiles[0].mod,
    module2: rdeFiles[1].mod,
    module3: rdeFiles[2].mod,
    module4: rdeFiles[3].mod,
    module5: rdeFiles[4].mod,
    module1Pdf: rdeUrls[0],
    module2Pdf: rdeUrls[1],
    module3Pdf: rdeUrls[2],
    module4Pdf: rdeUrls[3],
    module5Pdf: rdeUrls[4],
    pdfUrl: rdeMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(rdeDoc);
  console.log(`  [SAVED NOTE] ${rdeDoc.title} (_id: ${rdeDoc._id})\n`);

  // -------------------------------------------------------------
  // 9. 23A04503T Microprocessors and Microcontrollers
  // -------------------------------------------------------------
  console.log("9. Processing Theory: 23A04503T Microprocessors and Microcontrollers");
  const mpmcDir = path.join(SOURCE_BASE, "23A04503T Microprocessors and Microcontrollers");
  const mpmcFiles = [
    { file: "MPMC_Unit1_8086_Architecture_Notes.pdf", mod: "Unit 1: 8086 Microprocessor Architecture, Register Organization & Memory Segmentation", dest: "EEE_3-2_23A04503T_Unit1_MPMC.pdf" },
    { file: "MPMC_Unit2_8086_Programming_Notes.pdf", mod: "Unit 2: 8086 Instruction Set, Addressing Modes & Assembly Language Programming", dest: "EEE_3-2_23A04503T_Unit2_MPMC.pdf" },
    { file: "MPMC_Unit3_8086_Interfacing_Notes.pdf", mod: "Unit 3: 8086 Memory & I/O Interfacing (8255 PPI, 8254 Timer, 8259 PIC, 8251 USART)", dest: "EEE_3-2_23A04503T_Unit3_MPMC.pdf" },
    { file: "MPMC_Unit4_8051_Microcontroller_Notes.pdf", mod: "Unit 4: 8051 Microcontroller Architecture, Memory Map, I/O Ports & Instruction Set", dest: "EEE_3-2_23A04503T_Unit4_MPMC.pdf" },
    { file: "MPMC_Unit5_Interfacing_Microcontroller_Notes.pdf", mod: "Unit 5: 8051 Interfacing with Peripheral Devices (ADC, DAC, Stepper Motor, LCD, Keypad)", dest: "EEE_3-2_23A04503T_Unit5_MPMC.pdf" },
  ];
  const mpmcSources = [];
  const mpmcUrls = [];
  for (const f of mpmcFiles) {
    const src = path.join(mpmcDir, f.file);
    mpmcSources.push(src);
    mpmcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const mpmcMergedUrl = await mergePdfs(mpmcSources, "EEE_3-2_23A04503T_Microprocessors_and_Microcontrollers_Complete_Notes.pdf");
  const mpmcDoc = await Note.create({
    title: "Microprocessors and Microcontrollers Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Microprocessors and Microcontrollers",
    subjectCode: "23A04503T",
    description: "Complete study material for Microprocessors and Microcontrollers (23A04503T) under JNTU R23 Curriculum for EEE 3-2 semester. Covers 8086 Microprocessor Hardware Architecture, Assembly Language Programming, Peripheral Interfacing ICs (8255, 8254, 8259), 8051 Microcontroller Architecture, and Real-World Interfacing with Actuators & Sensors.",
    credits: "3",
    module1: mpmcFiles[0].mod,
    module2: mpmcFiles[1].mod,
    module3: mpmcFiles[2].mod,
    module4: mpmcFiles[3].mod,
    module5: mpmcFiles[4].mod,
    module1Pdf: mpmcUrls[0],
    module2Pdf: mpmcUrls[1],
    module3Pdf: mpmcUrls[2],
    module4Pdf: mpmcUrls[3],
    module5Pdf: mpmcUrls[4],
    pdfUrl: mpmcMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(mpmcDoc);
  console.log(`  [SAVED NOTE] ${mpmcDoc.title} (_id: ${mpmcDoc._id})\n`);

  // =============================================================
  // SECTION 2: LAB PROGRAMS (Stored in LabProgram collection)
  // =============================================================

  // -------------------------------------------------------------
  // 10. 23A02601P Electrical Measurements and Instrumentation Lab
  // -------------------------------------------------------------
  console.log("10. Processing Lab: 23A02601P Electrical Measurements and Instrumentation Lab");
  const emiLabDir = path.join(SOURCE_BASE, "23A02601P Electrical Measurements and Instrumentation Lab");
  const emiLabFile = "EMI_Lab_23A02601P_Handwritten_Notes.pdf";
  const emiLabSrc = path.join(emiLabDir, emiLabFile);
  const emiLabUrl = copyFileSafe(emiLabSrc, "EEE_3-2_23A02601P_Electrical_Measurements_and_Instrumentation_Lab_Manual.pdf");
  copyFileSafe(emiLabSrc, emiLabFile);

  const emiLabDoc = await LabProgram.create({
    title: "Electrical Measurements and Instrumentation Lab Manual & Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Electrical Measurements and Instrumentation Lab",
    subjectCode: "23A02601P",
    description: "Complete laboratory manual, handwritten experiment notes, bridge connections, calibration procedures, and observation records for Electrical Measurements and Instrumentation Lab (23A02601P) under JNTU R23 Curriculum for EEE 3-2 semester.",
    pdfUrl: emiLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(emiLabDoc);
  console.log(`  [SAVED LAB] ${emiLabDoc.title} (_id: ${emiLabDoc._id})\n`);

  // -------------------------------------------------------------
  // 11. 23A04503P Microprocessors and Microcontrollers Lab
  // -------------------------------------------------------------
  console.log("11. Processing Lab: 23A04503P Microprocessors and Microcontrollers Lab");
  const mpmcLabDir = path.join(SOURCE_BASE, "23A04503P Microprocessors and Microcontrollers Lab");
  const mpmcLabFile = "MPMC_Lab_23A04503P_Handwritten_Notes.pdf";
  const mpmcLabSrc = path.join(mpmcLabDir, mpmcLabFile);
  const mpmcLabUrl = copyFileSafe(mpmcLabSrc, "EEE_3-2_23A04503P_Microprocessors_and_Microcontrollers_Lab_Manual.pdf");
  copyFileSafe(mpmcLabSrc, mpmcLabFile);

  const mpmcLabDoc = await LabProgram.create({
    title: "Microprocessors and Microcontrollers Lab Manual & Notes",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Microprocessors and Microcontrollers Lab",
    subjectCode: "23A04503P",
    description: "Complete laboratory manual, assembly language programs (ALP for 8086 & 8051), hardware interfacing experiments, and observation calculations for Microprocessors and Microcontrollers Lab (23A04503P) under JNTU R23 Curriculum for EEE 3-2 semester.",
    pdfUrl: mpmcLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(mpmcLabDoc);
  console.log(`  [SAVED LAB] ${mpmcLabDoc.title} (_id: ${mpmcLabDoc._id})\n`);

  // -------------------------------------------------------------
  // 12. 23A02606 Applications of Soft Computing Tools in Electrical Engineering (Skill Lab)
  // -------------------------------------------------------------
  console.log("12. Processing Lab: 23A02606 Applications of Soft Computing Tools in Electrical Engineering");
  const sctDir = path.join(SOURCE_BASE, "23A02606 Applications of Soft Computing Tools in Electrical Engineering");
  const sctFile = "Soft_Computing_Tools_EE_Lab_Answers.pdf";
  const sctSrc = path.join(sctDir, sctFile);
  const sctUrl = copyFileSafe(sctSrc, "EEE_3-2_23A02606_Applications_of_Soft_Computing_Tools_Lab_Manual.pdf");
  copyFileSafe(sctSrc, sctFile);

  const sctLabDoc = await LabProgram.create({
    title: "Applications of Soft Computing Tools in Electrical Engineering Lab Manual",
    branch: "EEE",
    semester: "3-2",
    regulation: "R23",
    subject: "Applications of Soft Computing Tools in Electrical Engineering",
    subjectCode: "23A02606",
    description: "Complete laboratory manual, MATLAB/Python implementation solutions, simulation procedures, and answers for Applications of Soft Computing Tools in Electrical Engineering (23A02606) under JNTU R23 Curriculum for EEE 3-2 semester.",
    pdfUrl: sctUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(sctLabDoc);
  console.log(`  [SAVED LAB] ${sctLabDoc.title} (_id: ${sctLabDoc._id})\n`);

  // =============================================================
  // SECTION 3: CACHE INVALIDATION & FINAL VERIFICATION
  // =============================================================
  console.log("Invalidating Feed Cache...");
  if (typeof invalidateFeedCache === "function") {
    invalidateFeedCache();
    console.log("  [CACHE] In-memory feed cache invalidated.");
  }

  console.log("\n==================================================");
  console.log("SUMMARY OF EEE 3-2 INGESTION");
  console.log(`Theory Notes Saved in Note collection: ${createdNotes.length}`);
  createdNotes.forEach((n) => console.log(`  - [${n.subjectCode}] ${n.subject} (PDF: ${n.pdfUrl})`));

  console.log(`\nLab Programs Saved in LabProgram collection: ${createdLabs.length}`);
  createdLabs.forEach((l) => console.log(`  - [${l.subjectCode}] ${l.subject} (PDF: ${l.pdfUrl})`));
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Database disconnected. Done!");
}

uploadEee3_2().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
