const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\EEE\\4-1";
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

async function uploadEee4_1() {
  console.log("==================================================");
  console.log("STARTING EEE 4-1 CURRICULUM INGESTION");
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

  console.log("Cleaning any previous EEE 4-1 notes and labs to avoid duplicates...");
  const delNotes = await Note.deleteMany({ branch: "EEE", semester: "4-1" });
  const delLabs = await LabProgram.deleteMany({ branch: "EEE", semester: "4-1" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} notes and ${delLabs.deletedCount} lab programs.\n`);

  const createdNotes = [];
  const createdLabs = [];

  // =============================================================
  // SECTION 1: THEORY SUBJECTS (Stored in Note collection)
  // =============================================================

  // -------------------------------------------------------------
  // 1. 23A02701 Power System Operation and Control
  // -------------------------------------------------------------
  console.log("1. Processing Theory: 23A02701 Power System Operation and Control");
  const psocDir = path.join(SOURCE_BASE, "23A02701 Power System Operation and Control");
  const psocFiles = [
    { file: "Unit_I_Optimum_Operation_of_Thermal_Power_Stations.pdf", mod: "Unit 1: Optimum Operation of Thermal Power Stations (Economic Dispatch & Heat Rate Curves)", dest: "EEE_4-1_23A02701_Unit1_Optimum_Operation_Thermal.pdf" },
    { file: "Unit_II_Economic_Operation_Hydro_Thermal_Scheduling.pdf", mod: "Unit 2: Hydrothermal Scheduling & Unit Commitment (Dynamic Programming)", dest: "EEE_4-1_23A02701_Unit2_Hydrothermal_Scheduling.pdf" },
    { file: "Unit_III_Load_Frequency_Control.pdf", mod: "Unit 3: Load Frequency Control (Single Area, Two-Area Systems & Tie-Line Bias Control)", dest: "EEE_4-1_23A02701_Unit3_Load_Frequency_Control.pdf" },
    { file: "Unit_IV_Reactive_Power_Control.pdf", mod: "Unit 4: Reactive Power Control & Voltage Stability (Compensators & Tap-Changing Transformers)", dest: "EEE_4-1_23A02701_Unit4_Reactive_Power_Control.pdf" },
    { file: "Unit_V_Power_System_Deregulation.pdf", mod: "Unit 5: Power System Deregulation & Restructuring (GENCOs, TRANSCOs, DISCOMs & ISO)", dest: "EEE_4-1_23A02701_Unit5_Power_System_Deregulation.pdf" },
  ];
  const psocSources = [];
  const psocUrls = [];
  for (const f of psocFiles) {
    const src = path.join(psocDir, f.file);
    psocSources.push(src);
    psocUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const psocMergedUrl = await mergePdfs(psocSources, "EEE_4-1_23A02701_Power_System_Operation_and_Control_Complete_Notes.pdf");
  const psocDoc = await Note.create({
    title: "Power System Operation and Control Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Power System Operation and Control",
    subjectCode: "23A02701",
    description: "Complete lecture notes for Power System Operation and Control (23A02701) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Economic Dispatch of Thermal Units, Hydrothermal Scheduling, Single & Two-Area Load Frequency Control, Reactive Power Control and Voltage Regulation, and Power System Deregulation & Restructuring.",
    credits: "3",
    module1: psocFiles[0].mod,
    module2: psocFiles[1].mod,
    module3: psocFiles[2].mod,
    module4: psocFiles[3].mod,
    module5: psocFiles[4].mod,
    module1Pdf: psocUrls[0],
    module2Pdf: psocUrls[1],
    module3Pdf: psocUrls[2],
    module4Pdf: psocUrls[3],
    module5Pdf: psocUrls[4],
    pdfUrl: psocMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(psocDoc);
  console.log(`  [SAVED NOTE] ${psocDoc.title} (_id: ${psocDoc._id})\n`);

  // -------------------------------------------------------------
  // 2. 23A02702a Digital Signal Processing (PE - III)
  // -------------------------------------------------------------
  console.log("2. Processing Theory: 23A02702a Digital Signal Processing");
  const dspDir = path.join(SOURCE_BASE, "23A02702a Digital Signal Processing");
  const dspFiles = [
    { file: "DSP_Unit_1_Handwritten_Notes.pdf", mod: "Unit 1: Introduction to Discrete-Time Signals & Systems (Linear Convolution & Z-Transforms)", dest: "EEE_4-1_23A02702a_Unit1_DSP.pdf" },
    { file: "DSP_Unit_2_Handwritten_Notes.pdf", mod: "Unit 2: Discrete Fourier Transform (DFT, IDFT & Fast Fourier Transform Algorithms)", dest: "EEE_4-1_23A02702a_Unit2_DSP.pdf" },
    { file: "DSP_Unit_3_Handwritten_Notes.pdf", mod: "Unit 3: IIR Digital Filter Design (Butterworth, Chebyshev & Bilinear Transformation)", dest: "EEE_4-1_23A02702a_Unit3_DSP.pdf" },
    { file: "DSP_Unit_4_Handwritten_Notes.pdf", mod: "Unit 4: FIR Digital Filter Design (Fourier Series & Windowing Techniques)", dest: "EEE_4-1_23A02702a_Unit4_DSP.pdf" },
    { file: "DSP_Unit_5_Handwritten_Notes.pdf", mod: "Unit 5: Realizations of Digital Filters & Multirate Digital Signal Processing", dest: "EEE_4-1_23A02702a_Unit5_DSP.pdf" },
  ];
  const dspSources = [];
  const dspUrls = [];
  for (const f of dspFiles) {
    const src = path.join(dspDir, f.file);
    dspSources.push(src);
    dspUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dspMergedUrl = await mergePdfs(dspSources, "EEE_4-1_23A02702a_Digital_Signal_Processing_Complete_Notes.pdf");
  const dspDoc = await Note.create({
    title: "Digital Signal Processing Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Digital Signal Processing",
    subjectCode: "23A02702a",
    description: "Complete handwritten notes for Digital Signal Processing (23A02702a) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Discrete-Time Systems Analysis, DFT and Decimation-in-Time/Frequency FFT Algorithms, Design of IIR and FIR Digital Filters, and Filter Realization Architectures.",
    credits: "3",
    module1: dspFiles[0].mod,
    module2: dspFiles[1].mod,
    module3: dspFiles[2].mod,
    module4: dspFiles[3].mod,
    module5: dspFiles[4].mod,
    module1Pdf: dspUrls[0],
    module2Pdf: dspUrls[1],
    module3Pdf: dspUrls[2],
    module4Pdf: dspUrls[3],
    module5Pdf: dspUrls[4],
    pdfUrl: dspMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(dspDoc);
  console.log(`  [SAVED NOTE] ${dspDoc.title} (_id: ${dspDoc._id})\n`);

  // -------------------------------------------------------------
  // 3. 23A02702b Electric Vehicle Technology (PE - III)
  // -------------------------------------------------------------
  console.log("3. Processing Theory: 23A02702b Electric Vehicle Technology");
  const evDir = path.join(SOURCE_BASE, "23A02702b Electric Vehicle Technology");
  const evFiles = [
    { file: "EV_Technology_Unit1_Handwritten_Notes.pdf", mod: "Unit 1: Introduction to Electric Vehicles & Vehicle Mechanics (Tractive Effort & Configurations)", dest: "EEE_4-1_23A02702b_Unit1_EV_Technology.pdf" },
    { file: "EV_Technology_Unit2_Handwritten_Notes.pdf", mod: "Unit 2: Energy Storage Systems & Battery Management Systems (BMS, Fuel Cells, Ultracapacitors)", dest: "EEE_4-1_23A02702b_Unit2_EV_Technology.pdf" },
    { file: "EV_Technology_Unit3_Handwritten_Notes.pdf", mod: "Unit 3: Electric Propulsion Systems & Motors (BLDC, PMSM & Induction Motor Drives)", dest: "EEE_4-1_23A02702b_Unit3_EV_Technology.pdf" },
    { file: "EV_Technology_Unit4_Handwritten_Notes.pdf", mod: "Unit 4: Power Electronic Converters & Regenerative Braking in EVs", dest: "EEE_4-1_23A02702b_Unit4_EV_Technology.pdf" },
    { file: "EV_Technology_Unit5_Handwritten_Notes.pdf", mod: "Unit 5: EV Charging Infrastructure, Standards, Smart Charging & Grid Integration (V2G)", dest: "EEE_4-1_23A02702b_Unit5_EV_Technology.pdf" },
  ];
  const evSources = [];
  const evUrls = [];
  for (const f of evFiles) {
    const src = path.join(evDir, f.file);
    evSources.push(src);
    evUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const evMergedUrl = await mergePdfs(evSources, "EEE_4-1_23A02702b_Electric_Vehicle_Technology_Complete_Notes.pdf");
  const evDoc = await Note.create({
    title: "Electric Vehicle Technology Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Electric Vehicle Technology",
    subjectCode: "23A02702b",
    description: "Complete handwritten study notes for Electric Vehicle Technology (23A02702b) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Electric Vehicle Architecture, Battery Chemistry and BMS, Electric Motors for EV Propulsion, Power Converters and Regenerative Braking, and Charging Infrastructure with Vehicle-to-Grid (V2G) technology.",
    credits: "3",
    module1: evFiles[0].mod,
    module2: evFiles[1].mod,
    module3: evFiles[2].mod,
    module4: evFiles[3].mod,
    module5: evFiles[4].mod,
    module1Pdf: evUrls[0],
    module2Pdf: evUrls[1],
    module3Pdf: evUrls[2],
    module4Pdf: evUrls[3],
    module5Pdf: evUrls[4],
    pdfUrl: evMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(evDoc);
  console.log(`  [SAVED NOTE] ${evDoc.title} (_id: ${evDoc._id})\n`);

  // -------------------------------------------------------------
  // 4. 23A02702c HVDC & FACTS (PE - III)
  // -------------------------------------------------------------
  console.log("4. Processing Theory: 23A02702c HVDC & FACTS");
  const hvdcDir = path.join(SOURCE_BASE, "23A02702c HVDC & FACTS");
  const hvdcFiles = [
    { file: "HVDC_FACTS_Unit-I_Handwritten_Notes.pdf", mod: "Unit 1: HVDC Transmission Fundamentals & Comparison with AC Transmission", dest: "EEE_4-1_23A02702c_Unit1_HVDC_FACTS.pdf" },
    { file: "HVDC_FACTS_Unit-II_Handwritten_Notes.pdf", mod: "Unit 2: HVDC Converters, Converter Control, Harmonics & Filter Design", dest: "EEE_4-1_23A02702c_Unit2_HVDC_FACTS.pdf" },
    { file: "HVDC_FACTS_Unit-III_Handwritten_Notes.pdf", mod: "Unit 3: Concept of Flexible AC Transmission Systems (FACTS) & Voltage Source Converters", dest: "EEE_4-1_23A02702c_Unit3_HVDC_FACTS.pdf" },
    { file: "HVDC_FACTS_Unit-IV_Handwritten_Notes.pdf", mod: "Unit 4: Static Shunt & Series Compensators (SVC, STATCOM, TCSC & SSSC)", dest: "EEE_4-1_23A02702c_Unit4_HVDC_FACTS.pdf" },
    { file: "HVDC_FACTS_Unit-V_Handwritten_Notes.pdf", mod: "Unit 5: Combined & Special Compensators (UPFC, IPFC & Coordination of Controllers)", dest: "EEE_4-1_23A02702c_Unit5_HVDC_FACTS.pdf" },
  ];
  const hvdcSources = [];
  const hvdcUrls = [];
  for (const f of hvdcFiles) {
    const src = path.join(hvdcDir, f.file);
    hvdcSources.push(src);
    hvdcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const hvdcMergedUrl = await mergePdfs(hvdcSources, "EEE_4-1_23A02702c_HVDC_and_FACTS_Complete_Notes.pdf");
  const hvdcDoc = await Note.create({
    title: "HVDC & FACTS Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "HVDC & FACTS",
    subjectCode: "23A02702c",
    description: "Complete study material for HVDC & FACTS (23A02702c) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Economics and Applications of HVDC Systems, 6-Pulse and 12-Pulse Converters, Harmonics & Filter Topologies, FACTS Controllers, Shunt (SVC/STATCOM) and Series (TCSC/SSSC) Compensation, and Unified Power Flow Controllers (UPFC).",
    credits: "3",
    module1: hvdcFiles[0].mod,
    module2: hvdcFiles[1].mod,
    module3: hvdcFiles[2].mod,
    module4: hvdcFiles[3].mod,
    module5: hvdcFiles[4].mod,
    module1Pdf: hvdcUrls[0],
    module2Pdf: hvdcUrls[1],
    module3Pdf: hvdcUrls[2],
    module4Pdf: hvdcUrls[3],
    module5Pdf: hvdcUrls[4],
    pdfUrl: hvdcMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(hvdcDoc);
  console.log(`  [SAVED NOTE] ${hvdcDoc.title} (_id: ${hvdcDoc._id})\n`);

  // -------------------------------------------------------------
  // 5. 23A02703a Modern Control Theory (PE - IV)
  // -------------------------------------------------------------
  console.log("5. Processing Theory: 23A02703a Modern Control Theory");
  const mctDir = path.join(SOURCE_BASE, "23A02703a Modern Control Theory");
  const mctFiles = [
    { file: "MCT_Unit1_State_Space_Analysis.pdf", mod: "Unit 1: State Space Analysis of Continuous-Time Systems (State Transition Matrix & Transfer Functions)", dest: "EEE_4-1_23A02703a_Unit1_Modern_Control.pdf" },
    { file: "MCT_Unit2_Controllability_Observability_Pole_Placement.pdf", mod: "Unit 2: Controllability, Observability & State Feedback Controller Design (Pole Placement)", dest: "EEE_4-1_23A02703a_Unit2_Modern_Control.pdf" },
    { file: "Unit3_Nonlinear_Systems.pdf", mod: "Unit 3: Analysis of Non-Linear Systems (Describing Function Method & Phase Plane Analysis)", dest: "EEE_4-1_23A02703a_Unit3_Modern_Control.pdf" },
    { file: "Unit4_Stability_Analysis_by_Lyapunov_Method.pdf", mod: "Unit 4: Stability Analysis by Lyapunov's Direct & Indirect Methods", dest: "EEE_4-1_23A02703a_Unit4_Modern_Control.pdf" },
    { file: "Unit5_Calculus_of_Variations.pdf", mod: "Unit 5: Calculus of Variations & Introduction to Optimal Control Systems", dest: "EEE_4-1_23A02703a_Unit5_Modern_Control.pdf" },
  ];
  // Note: let's verify actual file names for Unit3, Unit4, Unit5 in MCT directory:
  // In our earlier inspection:
  // MCT_Unit3_Nonlinear_Systems.pdf
  // MCT_Unit4_Stability_Analysis_by_Lyapunov_Method.pdf
  // MCT_Unit5_Calculus_of_Variations.pdf
  // Let's ensure exact file names:
  mctFiles[2].file = "MCT_Unit3_Nonlinear_Systems.pdf";
  mctFiles[3].file = "MCT_Unit4_Stability_Analysis_by_Lyapunov_Method.pdf";
  mctFiles[4].file = "MCT_Unit5_Calculus_of_Variations.pdf";

  const mctSources = [];
  const mctUrls = [];
  for (const f of mctFiles) {
    const src = path.join(mctDir, f.file);
    mctSources.push(src);
    mctUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const mctMergedUrl = await mergePdfs(mctSources, "EEE_4-1_23A02703a_Modern_Control_Theory_Complete_Notes.pdf");
  const mctDoc = await Note.create({
    title: "Modern Control Theory Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Modern Control Theory",
    subjectCode: "23A02703a",
    description: "Complete lecture notes for Modern Control Theory (23A02703a) under JNTU R23 Curriculum for EEE 4-1 semester. Covers State Space Modeling and Solutions, Controllability and Observability Criteria, State Feedback Design with Pole Placement, Non-linear Control Techniques, Lyapunov Stability Analysis, and Calculus of Variations for Optimal Control.",
    credits: "3",
    module1: mctFiles[0].mod,
    module2: mctFiles[1].mod,
    module3: mctFiles[2].mod,
    module4: mctFiles[3].mod,
    module5: mctFiles[4].mod,
    module1Pdf: mctUrls[0],
    module2Pdf: mctUrls[1],
    module3Pdf: mctUrls[2],
    module4Pdf: mctUrls[3],
    module5Pdf: mctUrls[4],
    pdfUrl: mctMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(mctDoc);
  console.log(`  [SAVED NOTE] ${mctDoc.title} (_id: ${mctDoc._id})\n`);

  // -------------------------------------------------------------
  // 6. 23A02703b Switched Mode Power Conversion (PE - IV)
  // -------------------------------------------------------------
  console.log("6. Processing Theory: 23A02703b Switched Mode Power Conversion");
  const smpcDir = path.join(SOURCE_BASE, "23A02703b Switched Mode Power Conversion");
  const smpcFiles = [
    { file: "Unit1_DC-DC_Converters.pdf", mod: "Unit 1: Non-Isolated DC-DC Converters (Buck, Boost, Buck-Boost, Cuk & SEPIC Topologies)", dest: "EEE_4-1_23A02703b_Unit1_SMPC.pdf" },
    { file: "Unit2_Switching_Mode_Power_Converters.pdf", mod: "Unit 2: Isolated Switching Mode Power Converters (Flyback, Forward, Push-Pull, Bridge)", dest: "EEE_4-1_23A02703b_Unit2_SMPC.pdf" },
    { file: "Unit3_Resonant_Converters.pdf", mod: "Unit 3: Resonant Converters (Zero Voltage Switching & Zero Current Switching Principles)", dest: "EEE_4-1_23A02703b_Unit3_SMPC.pdf" },
    { file: "Unit4_DC-AC_Converters.pdf", mod: "Unit 4: DC-AC Switching Converters & High Frequency Inverter Topologies", dest: "EEE_4-1_23A02703b_Unit4_SMPC.pdf" },
    { file: "Unit5_Power_Conditioners_UPS_Filters.pdf", mod: "Unit 5: Power Conditioners, Uninterruptible Power Supplies (UPS) & Active Power Filters", dest: "EEE_4-1_23A02703b_Unit5_SMPC.pdf" },
  ];
  const smpcSources = [];
  const smpcUrls = [];
  for (const f of smpcFiles) {
    const src = path.join(smpcDir, f.file);
    smpcSources.push(src);
    smpcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const smpcMergedUrl = await mergePdfs(smpcSources, "EEE_4-1_23A02703b_Switched_Mode_Power_Conversion_Complete_Notes.pdf");
  const smpcDoc = await Note.create({
    title: "Switched Mode Power Conversion Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Switched Mode Power Conversion",
    subjectCode: "23A02703b",
    description: "Complete study material for Switched Mode Power Conversion (23A02703b) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Non-Isolated DC-DC Converters, Transformer Isolated Topologies (Flyback, Forward, Half/Full Bridge), Soft-Switching & Resonant Converters (ZVS/ZCS), DC-AC Inverter Systems, and UPS & Power Conditioning Architectures.",
    credits: "3",
    module1: smpcFiles[0].mod,
    module2: smpcFiles[1].mod,
    module3: smpcFiles[2].mod,
    module4: smpcFiles[3].mod,
    module5: smpcFiles[4].mod,
    module1Pdf: smpcUrls[0],
    module2Pdf: smpcUrls[1],
    module3Pdf: smpcUrls[2],
    module4Pdf: smpcUrls[3],
    module5Pdf: smpcUrls[4],
    pdfUrl: smpcMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(smpcDoc);
  console.log(`  [SAVED NOTE] ${smpcDoc.title} (_id: ${smpcDoc._id})\n`);

  // -------------------------------------------------------------
  // 7. 23A02703c Electrical Distribution System (PE - IV)
  // -------------------------------------------------------------
  console.log("7. Processing Theory: 23A02703c Electrical Distribution System");
  const edsDir = path.join(SOURCE_BASE, "23A02703c Electrical Distribution System");
  const edsFiles = [
    { file: "23A02703c_Unit1_Handwritten_Notes.pdf", mod: "Unit 1: General Concepts of Distribution Systems & Load Characteristics", dest: "EEE_4-1_23A02703c_Unit1_EDS.pdf" },
    { file: "23A02703c_Unit2_Handwritten_Notes.pdf", mod: "Unit 2: Distribution Feeders Design, Radial & Loop Feeders, Voltage Drop Computations", dest: "EEE_4-1_23A02703c_Unit2_EDS.pdf" },
    { file: "23A02703c_Unit3_Handwritten_Notes.pdf", mod: "Unit 3: Substation Location Optimization, Ratings & Bus Schemes", dest: "EEE_4-1_23A02703c_Unit3_EDS.pdf" },
    { file: "23A02703c_Unit4_Handwritten_Notes.pdf", mod: "Unit 4: Power Factor Improvement & Voltage Control in Distribution Networks", dest: "EEE_4-1_23A02703c_Unit4_EDS.pdf" },
    { file: "23A02703c_Unit5_Handwritten_Notes.pdf", mod: "Unit 5: Distribution System Protection, Reclosers, Sectionalizers & Coordination", dest: "EEE_4-1_23A02703c_Unit5_EDS.pdf" },
  ];
  const edsSources = [];
  const edsUrls = [];
  for (const f of edsFiles) {
    const src = path.join(edsDir, f.file);
    edsSources.push(src);
    edsUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const edsMergedUrl = await mergePdfs(edsSources, "EEE_4-1_23A02703c_Electrical_Distribution_System_Complete_Notes.pdf");
  const edsDoc = await Note.create({
    title: "Electrical Distribution System Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Electrical Distribution System",
    subjectCode: "23A02703c",
    description: "Complete handwritten notes for Electrical Distribution System (23A02703c) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Distribution System Organization, Primary and Secondary Feeders Design, Substation Planning & Capacity, Reactive Power Compensation, and Protective Device Coordination (Fuses, Reclosers & Relays).",
    credits: "3",
    module1: edsFiles[0].mod,
    module2: edsFiles[1].mod,
    module3: edsFiles[2].mod,
    module4: edsFiles[3].mod,
    module5: edsFiles[4].mod,
    module1Pdf: edsUrls[0],
    module2Pdf: edsUrls[1],
    module3Pdf: edsUrls[2],
    module4Pdf: edsUrls[3],
    module5Pdf: edsUrls[4],
    pdfUrl: edsMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(edsDoc);
  console.log(`  [SAVED NOTE] ${edsDoc.title} (_id: ${edsDoc._id})\n`);

  // -------------------------------------------------------------
  // 8. 23A52701a Business Ethics and Corporate Governance (Humanities Elective)
  // -------------------------------------------------------------
  console.log("8. Processing Theory: 23A52701a Business Ethics and Corporate Governance");
  const begDir = path.join(SOURCE_BASE, "23A52701a Business Ethics and Corporate Governance");
  const begFiles = [
    { file: "BEG_Unit_1_Handwritten_Notes.pdf", mod: "Unit 1: Fundamentals of Business Ethics & Moral Standards", dest: "EEE_4-1_23A52701a_Unit1_Business_Ethics.pdf" },
    { file: "BEG_Unit_2_Handwritten_Notes.pdf", mod: "Unit 2: Ethical Decision Making, Values & Corporate Culture", dest: "EEE_4-1_23A52701a_Unit2_Business_Ethics.pdf" },
    { file: "BEG_Unit_3_Handwritten_Notes.pdf", mod: "Unit 3: Corporate Governance Framework, Global Codes & Indian Regulations", dest: "EEE_4-1_23A52701a_Unit3_Business_Ethics.pdf" },
    { file: "BEG_Unit_4_Handwritten_Notes.pdf", mod: "Unit 4: Board of Directors, Independent Directors & Audit Committees", dest: "EEE_4-1_23A52701a_Unit4_Business_Ethics.pdf" },
    { file: "BEG_Unit_5_Handwritten_Notes.pdf", mod: "Unit 5: Corporate Social Responsibility (CSR), Whistleblowing & Business Sustainability", dest: "EEE_4-1_23A52701a_Unit5_Business_Ethics.pdf" },
  ];
  const begSources = [];
  const begUrls = [];
  for (const f of begFiles) {
    const src = path.join(begDir, f.file);
    begSources.push(src);
    begUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const begMergedUrl = await mergePdfs(begSources, "EEE_4-1_23A52701a_Business_Ethics_and_Corporate_Governance_Complete_Notes.pdf");
  const begDoc = await Note.create({
    title: "Business Ethics and Corporate Governance Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Business Ethics and Corporate Governance",
    subjectCode: "23A52701a",
    description: "Complete handwritten notes for Business Ethics and Corporate Governance (23A52701a) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Ethical Theories in Business, Corporate Governance Standards & Regulatory Compliance, Role and Responsibilities of Board of Directors, Whistleblowing Policies, and Corporate Social Responsibility (CSR).",
    credits: "3",
    module1: begFiles[0].mod,
    module2: begFiles[1].mod,
    module3: begFiles[2].mod,
    module4: begFiles[3].mod,
    module5: begFiles[4].mod,
    module1Pdf: begUrls[0],
    module2Pdf: begUrls[1],
    module3Pdf: begUrls[2],
    module4Pdf: begUrls[3],
    module5Pdf: begUrls[4],
    pdfUrl: begMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(begDoc);
  console.log(`  [SAVED NOTE] ${begDoc.title} (_id: ${begDoc._id})\n`);

  // -------------------------------------------------------------
  // 9. 23A52701b E-Business (Humanities Elective)
  // -------------------------------------------------------------
  console.log("9. Processing Theory: 23A52701b E-Business");
  const ebDir = path.join(SOURCE_BASE, "23A52701b E-Business");
  const ebFiles = [
    { file: "EBusiness_Unit1_Electronic_Business.pdf", mod: "Unit 1: Introduction to Electronic Business & E-Commerce Infrastructure", dest: "EEE_4-1_23A52701b_Unit1_EBusiness.pdf" },
    { file: "EBusiness_Unit2_Electronic_Markets_and_Business_Models.pdf", mod: "Unit 2: Electronic Markets & Business Models (B2B, B2C, C2C & Portals)", dest: "EEE_4-1_23A52701b_Unit2_EBusiness.pdf" },
    { file: "EBusiness_Unit3_Electronic_Payment_Systems.pdf", mod: "Unit 3: Electronic Payment Systems (Payment Gateways, Net Banking, UPI & Smart Cards)", dest: "EEE_4-1_23A52701b_Unit3_EBusiness.pdf" },
    { file: "EBusiness_Unit4_E-Security.pdf", mod: "Unit 4: E-Security, Encryption Technologies, SSL & Digital Signatures", dest: "EEE_4-1_23A52701b_Unit4_EBusiness.pdf" },
    { file: "EBusiness_Unit5_E-Marketing.pdf", mod: "Unit 5: E-Marketing, SEO, Social Media Marketing & Customer Relationship Management (e-CRM)", dest: "EEE_4-1_23A52701b_Unit5_EBusiness.pdf" },
  ];
  const ebSources = [];
  const ebUrls = [];
  for (const f of ebFiles) {
    const src = path.join(ebDir, f.file);
    ebSources.push(src);
    ebUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const ebMergedUrl = await mergePdfs(ebSources, "EEE_4-1_23A52701b_E-Business_Complete_Notes.pdf");
  const ebDoc = await Note.create({
    title: "E-Business Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "E-Business",
    subjectCode: "23A52701b",
    description: "Complete study material for E-Business (23A52701b) under JNTU R23 Curriculum for EEE 4-1 semester. Covers E-Commerce Architectures, Online Business Models, Digital Payment Protocols & Security, Cryptographic Protocols, and E-Marketing & E-Supply Chain Management.",
    credits: "3",
    module1: ebFiles[0].mod,
    module2: ebFiles[1].mod,
    module3: ebFiles[2].mod,
    module4: ebFiles[3].mod,
    module5: ebFiles[4].mod,
    module1Pdf: ebUrls[0],
    module2Pdf: ebUrls[1],
    module3Pdf: ebUrls[2],
    module4Pdf: ebUrls[3],
    module5Pdf: ebUrls[4],
    pdfUrl: ebMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(ebDoc);
  console.log(`  [SAVED NOTE] ${ebDoc.title} (_id: ${ebDoc._id})\n`);

  // -------------------------------------------------------------
  // 10. 23A52701c Management Science (Humanities Elective)
  // -------------------------------------------------------------
  console.log("10. Processing Theory: 23A52701c Management Science");
  const msDir = path.join(SOURCE_BASE, "23A52701c Management Science");
  const msFiles = [
    { file: "Unit-1_Introduction_to_Management.pdf", mod: "Unit 1: Introduction to Management, Principles & Organizational Structures", dest: "EEE_4-1_23A52701c_Unit1_Management_Science.pdf" },
    { file: "Unit-2_Operations_Management.pdf", mod: "Unit 2: Operations Management (Plant Location, Layout, Inventory Control & Statistical Quality Control)", dest: "EEE_4-1_23A52701c_Unit2_Management_Science.pdf" },
    { file: "Unit-3_Human_Resources_Management.pdf", mod: "Unit 3: Human Resources Management (Job Analysis, Recruitment, Selection, Training & Performance Appraisal)", dest: "EEE_4-1_23A52701c_Unit3_Management_Science.pdf" },
    { file: "Unit-4_Strategic_and_Project_Management.pdf", mod: "Unit 4: Strategic Management & Project Network Techniques (PERT/CPM)", dest: "EEE_4-1_23A52701c_Unit4_Management_Science.pdf" },
    { file: "Unit-5_Contemporary_Issues_in_Management.pdf", mod: "Unit 5: Contemporary Management Practices (TQM, Six Sigma, Just-In-Time & ERP Systems)", dest: "EEE_4-1_23A52701c_Unit5_Management_Science.pdf" },
  ];
  const msSources = [];
  const msUrls = [];
  for (const f of msFiles) {
    const src = path.join(msDir, f.file);
    msSources.push(src);
    msUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const msMergedUrl = await mergePdfs(msSources, "EEE_4-1_23A52701c_Management_Science_Complete_Notes.pdf");
  const msDoc = await Note.create({
    title: "Management Science Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Management Science",
    subjectCode: "23A52701c",
    description: "Complete lecture notes for Management Science (23A52701c) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Management Concepts & Organizational Theories, Production Planning and Inventory Management (EOQ, ABC), Human Resource Management, Project Network Scheduling (PERT/CPM), and Modern Management Methodologies (TQM, Six Sigma).",
    credits: "3",
    module1: msFiles[0].mod,
    module2: msFiles[1].mod,
    module3: msFiles[2].mod,
    module4: msFiles[3].mod,
    module5: msFiles[4].mod,
    module1Pdf: msUrls[0],
    module2Pdf: msUrls[1],
    module3Pdf: msUrls[2],
    module4Pdf: msUrls[3],
    module5Pdf: msUrls[4],
    pdfUrl: msMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(msDoc);
  console.log(`  [SAVED NOTE] ${msDoc.title} (_id: ${msDoc._id})\n`);

  // -------------------------------------------------------------
  // 11. 23A52702 Gender Sensitization (Mandatory Course)
  // -------------------------------------------------------------
  console.log("11. Processing Theory: 23A52702 Gender Sensitization");
  const gsDir = path.join(SOURCE_BASE, "23A52702 Gender Sensitization");
  const gsFiles = [
    { file: "Gender_Unit_1_Understanding_Gender.pdf", mod: "Unit 1: Understanding Gender, Sex vs Gender, Socialization & Stereotyping", dest: "EEE_4-1_23A52702_Unit1_Gender_Sensitization.pdf" },
    { file: "Gender_Unit_2_Gender_Roles_and_Relations.pdf", mod: "Unit 2: Gender Roles, Relations & Family Dynamics", dest: "EEE_4-1_23A52702_Unit2_Gender_Sensitization.pdf" },
    { file: "Gender_Unit_3_Gender_and_Labour.pdf", mod: "Unit 3: Gender and Labour (Division of Labour, Unpaid Work & Glass Ceiling)", dest: "EEE_4-1_23A52702_Unit3_Gender_Sensitization.pdf" },
    { file: "Gender_Unit_4_Gender_Based_Violence.pdf", mod: "Unit 4: Gender-Based Violence, Legal Protections, POCSO & POSH Acts", dest: "EEE_4-1_23A52702_Unit4_Gender_Sensitization.pdf" },
    { file: "Gender_Unit_5_Gender_and_Culture.pdf", mod: "Unit 5: Gender and Culture, Media Representation & Building an Equal Society", dest: "EEE_4-1_23A52702_Unit5_Gender_Sensitization.pdf" },
  ];
  const gsSources = [];
  const gsUrls = [];
  for (const f of gsFiles) {
    const src = path.join(gsDir, f.file);
    gsSources.push(src);
    gsUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const gsMergedUrl = await mergePdfs(gsSources, "EEE_4-1_23A52702_Gender_Sensitization_Complete_Notes.pdf");
  const gsDoc = await Note.create({
    title: "Gender Sensitization Notes",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Gender Sensitization",
    subjectCode: "23A52702",
    description: "Complete study material for Gender Sensitization (23A52702) under JNTU R23 Curriculum for EEE 4-1 semester. Covers Conceptual Understanding of Gender & Socialization, Gender Relations, Gender and the Economy, Laws against Gender-Based Harassment and Violence, and Media Representations of Gender.",
    credits: "0",
    module1: gsFiles[0].mod,
    module2: gsFiles[1].mod,
    module3: gsFiles[2].mod,
    module4: gsFiles[3].mod,
    module5: gsFiles[4].mod,
    module1Pdf: gsUrls[0],
    module2Pdf: gsUrls[1],
    module3Pdf: gsUrls[2],
    module4Pdf: gsUrls[3],
    module5Pdf: gsUrls[4],
    pdfUrl: gsMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(gsDoc);
  console.log(`  [SAVED NOTE] ${gsDoc.title} (_id: ${gsDoc._id})\n`);

  // =============================================================
  // SECTION 2: LAB PROGRAMS (Stored in LabProgram collection)
  // =============================================================

  // -------------------------------------------------------------
  // 12. 23A02706 Power Systems and Simulation Lab
  // -------------------------------------------------------------
  console.log("12. Processing Lab: 23A02706 Power Systems and Simulation Lab");
  const pssLabDir = path.join(SOURCE_BASE, "23A02706 Power Systems and Simulation Lab");
  const pssLabFile = "Power_Systems_and_Simulation_Lab_Answers.pdf";
  const pssLabSrc = path.join(pssLabDir, pssLabFile);
  const pssLabUrl = copyFileSafe(pssLabSrc, "EEE_4-1_23A02706_Power_Systems_and_Simulation_Lab_Manual.pdf");
  copyFileSafe(pssLabSrc, pssLabFile);

  const pssLabDoc = await LabProgram.create({
    title: "Power Systems and Simulation Lab Manual & Answers",
    branch: "EEE",
    semester: "4-1",
    regulation: "R23",
    subject: "Power Systems and Simulation Lab",
    subjectCode: "23A02706",
    description: "Complete laboratory manual, experiment code, MATLAB/Simulink solutions, load flow simulations, short-circuit fault studies, and observation answers for Power Systems and Simulation Lab (23A02706) under JNTU R23 Curriculum for EEE 4-1 semester.",
    pdfUrl: pssLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(pssLabDoc);
  console.log(`  [SAVED LAB] ${pssLabDoc.title} (_id: ${pssLabDoc._id})\n`);

  // =============================================================
  // SECTION 3: CACHE INVALIDATION & FINAL VERIFICATION
  // =============================================================
  console.log("Invalidating Feed Cache...");
  if (typeof invalidateFeedCache === "function") {
    invalidateFeedCache();
    console.log("  [CACHE] In-memory feed cache invalidated.");
  }

  console.log("\n==================================================");
  console.log("SUMMARY OF EEE 4-1 INGESTION");
  console.log(`Theory Notes Saved in Note collection: ${createdNotes.length}`);
  createdNotes.forEach((n) => console.log(`  - [${n.subjectCode}] ${n.subject} (PDF: ${n.pdfUrl})`));

  console.log(`\nLab Programs Saved in LabProgram collection: ${createdLabs.length}`);
  createdLabs.forEach((l) => console.log(`  - [${l.subjectCode}] ${l.subject} (PDF: ${l.pdfUrl})`));
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Database disconnected. Done!");
}

uploadEee4_1().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
