const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\EEE\\3-1";
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

async function uploadEee3_1() {
  console.log("==================================================");
  console.log("STARTING EEE 3-1 CURRICULUM INGESTION");
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

  console.log("Cleaning any previous EEE 3-1 notes and labs to avoid duplicates...");
  const delNotes = await Note.deleteMany({ branch: "EEE", semester: "3-1" });
  const delLabs = await LabProgram.deleteMany({ branch: "EEE", semester: "3-1" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} notes and ${delLabs.deletedCount} lab programs.\n`);

  const createdNotes = [];
  const createdLabs = [];

  // =============================================================
  // SECTION 1: THEORY SUBJECTS (Stored in Note collection)
  // =============================================================

  // -------------------------------------------------------------
  // 1. 23A02501T Power Electronics (Theory)
  // -------------------------------------------------------------
  console.log("1. Processing Theory: 23A02501T Power Electronics");
  const peDir = path.join(SOURCE_BASE, "23A02501T Power Electronics");
  const peFiles = [
    { file: "PE_Unit1_Power_Switching_Devices_Notes.pdf", mod: "Unit 1: Power Switching Devices (SCR, MOSFET, IGBT Characteristics & Protection)", dest: "EEE_3-1_23A02501T_Unit1_Power_Switching_Devices.pdf" },
    { file: "PE_Unit2_Rectifiers_Notes.pdf", mod: "Unit 2: Controlled Rectifiers & Phase Controlled Converters", dest: "EEE_3-1_23A02501T_Unit2_Rectifiers.pdf" },
    { file: "PE_Unit3_DC-DC_Converters_Notes.pdf", mod: "Unit 3: DC-DC Choppers & Switching Regulators (Buck, Boost, Buck-Boost)", dest: "EEE_3-1_23A02501T_Unit3_DC_DC_Converters.pdf" },
    { file: "PE_Unit4_Inverters_Notes.pdf", mod: "Unit 4: Inverters (Single Phase & Three Phase Voltage Source Inverters, PWM)", dest: "EEE_3-1_23A02501T_Unit4_Inverters.pdf" },
    { file: "PE_Unit5_AC_Controllers_and_Cycloconverters_Notes.pdf", mod: "Unit 5: AC Voltage Controllers and Cycloconverters", dest: "EEE_3-1_23A02501T_Unit5_AC_Controllers_and_Cycloconverters.pdf" },
  ];
  const peSources = [];
  const peUrls = [];
  for (const f of peFiles) {
    const src = path.join(peDir, f.file);
    peSources.push(src);
    peUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const peMergedUrl = await mergePdfs(peSources, "EEE_3-1_23A02501T_Power_Electronics_Complete_Notes.pdf");
  const peDoc = await Note.create({
    title: "Power Electronics Notes",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Power Electronics",
    subjectCode: "23A02501T",
    description: "Complete academic study notes for Power Electronics (23A02501T) under JNTU R23 Curriculum for EEE 3-1 semester. Covers Power Switching Semiconductor Devices, Phase Controlled Rectifiers, DC-DC Converters & Switching Regulators, Inverters & PWM Techniques, and AC Controllers & Cycloconverters.",
    credits: "3",
    module1: peFiles[0].mod,
    module2: peFiles[1].mod,
    module3: peFiles[2].mod,
    module4: peFiles[3].mod,
    module5: peFiles[4].mod,
    module1Pdf: peUrls[0],
    module2Pdf: peUrls[1],
    module3Pdf: peUrls[2],
    module4Pdf: peUrls[3],
    module5Pdf: peUrls[4],
    pdfUrl: peMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(peDoc);
  console.log(`  [SAVED NOTE] ${peDoc.title} (_id: ${peDoc._id})\n`);

  // -------------------------------------------------------------
  // 2. 23A02502 Digital Circuits (Theory)
  // -------------------------------------------------------------
  console.log("2. Processing Theory: 23A02502 Digital Circuits");
  const dcDir = path.join(SOURCE_BASE, "23A02502 Digital Circuits");
  const dcFiles = [
    { file: "DC_Unit1_Logic_Simplification.pdf", mod: "Unit 1: Number Systems, Boolean Algebra & Logic Simplification (K-Maps, Quine-McCluskey)", dest: "EEE_3-1_23A02502_Unit1_Logic_Simplification.pdf" },
    { file: "DC_Unit2_Combinational_Design_1.pdf", mod: "Unit 2: Combinational Logic Design - I (Adders, Subtractors, Comparators)", dest: "EEE_3-1_23A02502_Unit2_Combinational_Design_1.pdf" },
    { file: "DC_Unit3_Combinational_Design_2.pdf", mod: "Unit 3: Combinational Logic Design - II (Multiplexers, Demultiplexers, Decoders, Encoders)", dest: "EEE_3-1_23A02502_Unit3_Combinational_Design_2.pdf" },
    { file: "DC_Unit4_Sequential_Logic_Design.pdf", mod: "Unit 4: Sequential Logic Design (Latches, Flip-Flops, Registers & Counters)", dest: "EEE_3-1_23A02502_Unit4_Sequential_Logic_Design.pdf" },
    { file: "DC_Unit5_PLDs_and_Digital_ICs.pdf", mod: "Unit 5: Programmable Logic Devices (PROM, PLA, PAL, FPGA) & Digital IC Logic Families", dest: "EEE_3-1_23A02502_Unit5_PLDs_and_Digital_ICs.pdf" },
  ];
  const dcSources = [];
  const dcUrls = [];
  for (const f of dcFiles) {
    const src = path.join(dcDir, f.file);
    dcSources.push(src);
    dcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dcMergedUrl = await mergePdfs(dcSources, "EEE_3-1_23A02502_Digital_Circuits_Complete_Notes.pdf");
  const dcDoc = await Note.create({
    title: "Digital Circuits Notes",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Digital Circuits",
    subjectCode: "23A02502",
    description: "Complete lecture notes for Digital Circuits (23A02502) under JNTU R23 Curriculum for EEE 3-1 semester. Details Boolean Algebra & Logic Gate Minimization, Combinational Circuit Architectures (Arithmetic & Data Routing), Sequential Logic Design (Flip-Flops, Shift Registers, Synchronous & Asynchronous Counters), and Programmable Logic Devices (PLDs) with Digital IC Families.",
    credits: "3",
    module1: dcFiles[0].mod,
    module2: dcFiles[1].mod,
    module3: dcFiles[2].mod,
    module4: dcFiles[3].mod,
    module5: dcFiles[4].mod,
    module1Pdf: dcUrls[0],
    module2Pdf: dcUrls[1],
    module3Pdf: dcUrls[2],
    module4Pdf: dcUrls[3],
    module5Pdf: dcUrls[4],
    pdfUrl: dcMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(dcDoc);
  console.log(`  [SAVED NOTE] ${dcDoc.title} (_id: ${dcDoc._id})\n`);

  // -------------------------------------------------------------
  // 3. 23A02503 Power Systems-II (Theory)
  // -------------------------------------------------------------
  console.log("3. Processing Theory: 23A02503 Power Systems-II");
  const psDir = path.join(SOURCE_BASE, "23A02503 Power Systems-II");
  const psFiles = [
    { file: "Unit1_Transmission_Line_Parameters.pdf", mod: "Unit 1: Transmission Line Parameters & Modeling", dest: "EEE_3-1_23A02503_Unit1_Transmission_Line_Parameters.pdf" },
    { file: "Unit2_Performance_of_Transmission_Lines.pdf", mod: "Unit 2: Performance of Transmission Lines & ABCD Parameters", dest: "EEE_3-1_23A02503_Unit2_Performance_of_Transmission_Lines.pdf" },
    { file: "Unit3_Insulators_Sag_Tension_Corona.pdf", mod: "Unit 3: Overhead Line Insulators, Sag-Tension Calculations & Corona", dest: "EEE_3-1_23A02503_Unit3_Insulators_Sag_Tension_Corona.pdf" },
    { file: "Unit4_Underground_Cables_and_Transients.pdf", mod: "Unit 4: Underground Cables & Traveling Waves / Transients", dest: "EEE_3-1_23A02503_Unit4_Underground_Cables_and_Transients.pdf" },
    { file: "Unit5_Voltage_Control_and_Compensation.pdf", mod: "Unit 5: Voltage Control, Power Factor Improvement & Reactive Power Compensation", dest: "EEE_3-1_23A02503_Unit5_Voltage_Control_and_Compensation.pdf" },
  ];
  const psSources = [];
  const psUrls = [];
  for (const f of psFiles) {
    const src = path.join(psDir, f.file);
    psSources.push(src);
    psUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const psMergedUrl = await mergePdfs(psSources, "EEE_3-1_23A02503_Power_Systems_II_Complete_Notes.pdf");
  const psDoc = await Note.create({
    title: "Power Systems-II Notes",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Power Systems-II",
    subjectCode: "23A02503",
    description: "Comprehensive study notes for Power Systems-II (23A02503) under JNTU R23 Curriculum for EEE 3-1 semester. Details Transmission Line Constants Calculation, Performance & Surge Impedance Loading of Lines, Mechanical Design of Lines (Insulators, Sag, Corona), Underground Cable Technologies, and Voltage Regulation & Reactive Power Compensation.",
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
  // 4. 23A02504a Signals and Systems (Theory - Professional Elective I)
  // -------------------------------------------------------------
  console.log("4. Processing Theory: 23A02504a Signals and Systems");
  const ssDir = path.join(SOURCE_BASE, "23A02504a Signals and Systems");
  const ssFiles = [
    { file: "Unit_I.pdf", mod: "Unit 1: Introduction to Signals and Systems (Continuous & Discrete Time Signals, System Properties)", dest: "EEE_3-1_23A02504A_Unit1_Signals_and_Systems.pdf" },
    { file: "Unit_II.pdf", mod: "Unit 2: Fourier Series and Fourier Transform of Continuous-Time Signals", dest: "EEE_3-1_23A02504A_Unit2_Signals_and_Systems.pdf" },
    { file: "Unit_III.pdf", mod: "Unit 3: Signal Transmission Through Linear Time-Invariant (LTI) Systems & Convolution", dest: "EEE_3-1_23A02504A_Unit3_Signals_and_Systems.pdf" },
    { file: "Unit_IV.pdf", mod: "Unit 4: Laplace Transforms and Applications to Continuous-Time Systems", dest: "EEE_3-1_23A02504A_Unit4_Signals_and_Systems.pdf" },
    { file: "Unit_V.pdf", mod: "Unit 5: Sampling Theorem, Discrete-Time Signals & Z-Transforms", dest: "EEE_3-1_23A02504A_Unit5_Signals_and_Systems.pdf" },
  ];
  const ssSources = [];
  const ssUrls = [];
  for (const f of ssFiles) {
    const src = path.join(ssDir, f.file);
    ssSources.push(src);
    ssUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const ssMergedUrl = await mergePdfs(ssSources, "EEE_3-1_23A02504A_Signals_and_Systems_Complete_Notes.pdf");
  const ssDoc = await Note.create({
    title: "Signals and Systems Notes",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Signals and Systems",
    subjectCode: "23A02504A",
    description: "Complete study material for Signals and Systems (23A02504a) under JNTU R23 Curriculum for EEE 3-1 semester. Covers Continuous-Time and Discrete-Time Signals & Systems Classification, Fourier Analysis, LTI System Impulse Response & Convolution, Laplace Transform Analysis, and Nyquist Sampling Theorem with Z-Transforms.",
    credits: "3",
    module1: ssFiles[0].mod,
    module2: ssFiles[1].mod,
    module3: ssFiles[2].mod,
    module4: ssFiles[3].mod,
    module5: ssFiles[4].mod,
    module1Pdf: ssUrls[0],
    module2Pdf: ssUrls[1],
    module3Pdf: ssUrls[2],
    module4Pdf: ssUrls[3],
    module5Pdf: ssUrls[4],
    pdfUrl: ssMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(ssDoc);
  console.log(`  [SAVED NOTE] ${ssDoc.title} (_id: ${ssDoc._id})\n`);

  // -------------------------------------------------------------
  // 5. 23A02504b Electrical safety and Risk Management (Theory - Professional Elective I)
  // -------------------------------------------------------------
  console.log("5. Processing Theory: 23A02504b Electrical safety and Risk Management");
  const esDir = path.join(SOURCE_BASE, "23A02504b Electrical safety and Risk Management");
  const esFiles = [
    { file: "Unit_1_Electrical_Shocks_and_Prevention.pdf", mod: "Unit 1: Electrical Shocks, Physiological Effects & First Aid / Prevention", dest: "EEE_3-1_23A02504B_Unit1_Electrical_Safety.pdf" },
    { file: "Unit_2_Safety_During_Installation_of_Plant_and_Equipment.pdf", mod: "Unit 2: Safety During Installation of Electrical Plant and Equipment", dest: "EEE_3-1_23A02504B_Unit2_Electrical_Safety.pdf" },
    { file: "Unit_3_Electrical_Safety_in_Residential_Commercial_Agricultural.pdf", mod: "Unit 3: Electrical Safety in Residential, Commercial & Agricultural Installations", dest: "EEE_3-1_23A02504B_Unit3_Electrical_Safety.pdf" },
    { file: "Unit_4_Hazardous_Areas_and_Earthing.pdf", mod: "Unit 4: Hazardous Zones, Explosion-Proof Equipment & Earthing Systems", dest: "EEE_3-1_23A02504B_Unit4_Electrical_Safety.pdf" },
    { file: "Unit_5_Safety_Management_IE_Rules_and_Electricity_Act.pdf", mod: "Unit 5: Safety Management Systems, Indian Electricity (IE) Rules & Electricity Act", dest: "EEE_3-1_23A02504B_Unit5_Electrical_Safety.pdf" },
  ];
  const esSources = [];
  const esUrls = [];
  for (const f of esFiles) {
    const src = path.join(esDir, f.file);
    esSources.push(src);
    esUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const esMergedUrl = await mergePdfs(esSources, "EEE_3-1_23A02504B_Electrical_Safety_and_Risk_Management_Complete_Notes.pdf");
  const esDoc = await Note.create({
    title: "Electrical Safety and Risk Management Notes",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Electrical Safety and Risk Management",
    subjectCode: "23A02504B",
    description: "Unit-wise notes for Electrical Safety and Risk Management (23A02504b) under JNTU R23 Curriculum for EEE 3-1 semester. Details Shock Hazards & Physiological Effects, Industrial Equipment Safety & Isolation, Residential & Commercial Safety Norms, Hazardous Zone Classification & Earthing Practices, and Indian Electricity (IE) Regulations.",
    credits: "3",
    module1: esFiles[0].mod,
    module2: esFiles[1].mod,
    module3: esFiles[2].mod,
    module4: esFiles[3].mod,
    module5: esFiles[4].mod,
    module1Pdf: esUrls[0],
    module2Pdf: esUrls[1],
    module3Pdf: esUrls[2],
    module4Pdf: esUrls[3],
    module5Pdf: esUrls[4],
    pdfUrl: esMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(esDoc);
  console.log(`  [SAVED NOTE] ${esDoc.title} (_id: ${esDoc._id})\n`);

  // -------------------------------------------------------------
  // 6. 23A02504c Utilization of Electrical Energy (Theory - Professional Elective I)
  // -------------------------------------------------------------
  console.log("6. Processing Theory: 23A02504c Utilization of Electrical Energy");
  const ueeDir = path.join(SOURCE_BASE, "23A02504c Utilization of Electrical Energy");
  const ueeFiles = [
    { file: "UEE_Unit1_Electric_Drives.pdf", mod: "Unit 1: Electric Drives, Motors Selection & Industrial Applications", dest: "EEE_3-1_23A02504C_Unit1_UEE.pdf" },
    { file: "UEE_Unit2_Electric_Heating_and_Welding.pdf", mod: "Unit 2: Electric Heating (Resistance, Induction, Dielectric) & Electric Welding", dest: "EEE_3-1_23A02504C_Unit2_UEE.pdf" },
    { file: "UEE_Unit3_Illumination.pdf", mod: "Unit 3: Fundamentals of Illumination, Laws, Lamps & Lighting Schemes", dest: "EEE_3-1_23A02504C_Unit3_UEE.pdf" },
    { file: "UEE_Unit4_Electric_Traction.pdf", mod: "Unit 4: Electric Traction Systems, Speed-Time Curves, Mechanics & Tractive Effort", dest: "EEE_3-1_23A02504C_Unit4_UEE.pdf" },
    { file: "UEE_Unit5_Electrolytic_Process.pdf", mod: "Unit 5: Electrolytic Processes, Faraday's Laws, Electroplating & Energy Storage", dest: "EEE_3-1_23A02504C_Unit5_UEE.pdf" },
  ];
  const ueeSources = [];
  const ueeUrls = [];
  for (const f of ueeFiles) {
    const src = path.join(ueeDir, f.file);
    ueeSources.push(src);
    ueeUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const ueeMergedUrl = await mergePdfs(ueeSources, "EEE_3-1_23A02504C_Utilization_of_Electrical_Energy_Complete_Notes.pdf");
  const ueeDoc = await Note.create({
    title: "Utilization of Electrical Energy Notes",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Utilization of Electrical Energy",
    subjectCode: "23A02504C",
    description: "Complete study material for Utilization of Electrical Energy (23A02504c) under JNTU R23 Curriculum for EEE 3-1 semester. Details Industrial Electric Drives & Motors Characteristics, Industrial Heating (Resistance, Induction, Arc) & Welding Techniques, Illumination Engineering Principles & Modern Lamps, Electric Traction Engineering (Speed-Time Curves & Specific Energy Consumption), and Electroplating & Electrolysis.",
    credits: "3",
    module1: ueeFiles[0].mod,
    module2: ueeFiles[1].mod,
    module3: ueeFiles[2].mod,
    module4: ueeFiles[3].mod,
    module5: ueeFiles[4].mod,
    module1Pdf: ueeUrls[0],
    module2Pdf: ueeUrls[1],
    module3Pdf: ueeUrls[2],
    module4Pdf: ueeUrls[3],
    module5Pdf: ueeUrls[4],
    pdfUrl: ueeMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(ueeDoc);
  console.log(`  [SAVED NOTE] ${ueeDoc.title} (_id: ${ueeDoc._id})\n`);

  // -------------------------------------------------------------
  // 7. 23A05503 Introduction To Quantum Technologies And Applications (Theory)
  // -------------------------------------------------------------
  console.log("7. Processing Theory: 23A05503 Introduction To Quantum Technologies And Applications");
  const qtDir = path.join(SOURCE_BASE, "23A05503 Introduction To Quantum Technologies And Applications");
  const qtFiles = [
    { file: "QT_Unit1_Introduction_to_Quantum_Theory.pdf", mod: "Unit 1: Introduction to Quantum Theory, Qubits & Superposition", dest: "EEE_3-1_23A05503_Unit1_Quantum_Technologies.pdf" },
    { file: "QT_Unit2_Quantum_Information_Systems.pdf", mod: "Unit 2: Quantum Information Systems, Entanglement & Quantum Gates", dest: "EEE_3-1_23A05503_Unit2_Quantum_Technologies.pdf" },
    { file: "QT_Unit3_Building_a_Quantum_Computer.pdf", mod: "Unit 3: Building a Quantum Computer, Hardware Architectures & Quantum Error Correction", dest: "EEE_3-1_23A05503_Unit3_Quantum_Technologies.pdf" },
    { file: "QT_Unit4_Quantum_Communication_and_Computing.pdf", mod: "Unit 4: Quantum Communication, Cryptography (QKD) & Quantum Algorithms", dest: "EEE_3-1_23A05503_Unit4_Quantum_Technologies.pdf" },
    { file: "QT_Unit5_Applications_and_Quantum_Future.pdf", mod: "Unit 5: Practical Applications of Quantum Technologies & Future Paradigms", dest: "EEE_3-1_23A05503_Unit5_Quantum_Technologies.pdf" },
  ];
  const qtSources = [];
  const qtUrls = [];
  for (const f of qtFiles) {
    const src = path.join(qtDir, f.file);
    qtSources.push(src);
    qtUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const qtMergedUrl = await mergePdfs(qtSources, "EEE_3-1_23A05503_Introduction_to_Quantum_Technologies_Complete_Notes.pdf");
  const qtDoc = await Note.create({
    title: "Introduction to Quantum Technologies and Applications Notes",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Introduction to Quantum Technologies and Applications",
    subjectCode: "23A05503",
    description: "Complete academic study notes for Introduction to Quantum Technologies and Applications (23A05503) under JNTU R23 Curriculum for EEE 3-1 semester. Details Fundamentals of Quantum Mechanics, Qubit Representations, Quantum Logic Gates, Physical Architectures for Quantum Computing, Quantum Key Distribution (QKD), and Algorithms (Shor's & Grover's Algorithms).",
    credits: "3",
    module1: qtFiles[0].mod,
    module2: qtFiles[1].mod,
    module3: qtFiles[2].mod,
    module4: qtFiles[3].mod,
    module5: qtFiles[4].mod,
    module1Pdf: qtUrls[0],
    module2Pdf: qtUrls[1],
    module3Pdf: qtUrls[2],
    module4Pdf: qtUrls[3],
    module5Pdf: qtUrls[4],
    pdfUrl: qtMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(qtDoc);
  console.log(`  [SAVED NOTE] ${qtDoc.title} (_id: ${qtDoc._id})\n`);

  // =============================================================
  // SECTION 2: LAB PROGRAMS (Stored in LabProgram collection)
  // =============================================================

  // -------------------------------------------------------------
  // 8. 23A02501P Power Electronics Lab (Lab)
  // -------------------------------------------------------------
  console.log("8. Processing Lab: 23A02501P Power Electronics Lab");
  const peLabDir = path.join(SOURCE_BASE, "23A02501P Power Electronics Lab");
  const peLabFile = "Power_Electronics_Lab_Handwritten_Answers.pdf";
  const peLabSrc = path.join(peLabDir, peLabFile);
  const peLabUrl = copyFileSafe(peLabSrc, "EEE_3-1_23A02501P_Power_Electronics_Lab_Manual.pdf");
  copyFileSafe(peLabSrc, peLabFile);

  const peLabDoc = await LabProgram.create({
    title: "Power Electronics Lab Manual & Record",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Power Electronics Lab",
    subjectCode: "23A02501P",
    description: "Complete laboratory manual, handwritten experimental answers, circuit diagrams, testing procedures, and waveforms for Power Electronics Lab (23A02501P) under JNTU R23 Curriculum for EEE 3-1 semester.",
    pdfUrl: peLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(peLabDoc);
  console.log(`  [SAVED LAB] ${peLabDoc.title} (_id: ${peLabDoc._id})\n`);

  // -------------------------------------------------------------
  // 9. 23A02506 Analog and Digital Circuits Lab (Lab)
  // -------------------------------------------------------------
  console.log("9. Processing Lab: 23A02506 Analog and Digital Circuits Lab");
  const adcLabDir = path.join(SOURCE_BASE, "23A02506 Analog and Digital Circuits Lab");
  const adcLabFile = "Analog_Digital_Circuits_Lab_Record.pdf";
  const adcLabSrc = path.join(adcLabDir, adcLabFile);
  const adcLabUrl = copyFileSafe(adcLabSrc, "EEE_3-1_23A02506_Analog_and_Digital_Circuits_Lab_Manual.pdf");
  copyFileSafe(adcLabSrc, adcLabFile);

  const adcLabDoc = await LabProgram.create({
    title: "Analog and Digital Circuits Lab Manual & Record",
    branch: "EEE",
    semester: "3-1",
    regulation: "R23",
    subject: "Analog and Digital Circuits Lab",
    subjectCode: "23A02506",
    description: "Comprehensive laboratory record, circuit connections, pin configurations, experimental procedures, truth tables, and observation data for Analog and Digital Circuits Lab (23A02506) under JNTU R23 Curriculum for EEE 3-1 semester.",
    pdfUrl: adcLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(adcLabDoc);
  console.log(`  [SAVED LAB] ${adcLabDoc.title} (_id: ${adcLabDoc._id})\n`);

  // =============================================================
  // SECTION 3: CACHE INVALIDATION & FINAL VERIFICATION
  // =============================================================
  console.log("Invalidating Feed Cache...");
  if (typeof invalidateFeedCache === "function") {
    invalidateFeedCache();
    console.log("  [CACHE] In-memory feed cache invalidated.");
  }

  console.log("\n==================================================");
  console.log("SUMMARY OF EEE 3-1 INGESTION");
  console.log(`Theory Notes Saved in Note collection: ${createdNotes.length}`);
  createdNotes.forEach((n) => console.log(`  - [${n.subjectCode}] ${n.subject} (PDF: ${n.pdfUrl})`));

  console.log(`\nLab Programs Saved in LabProgram collection: ${createdLabs.length}`);
  createdLabs.forEach((l) => console.log(`  - [${l.subjectCode}] ${l.subject} (PDF: ${l.pdfUrl})`));
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Database disconnected. Done!");
}

uploadEee3_1().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
