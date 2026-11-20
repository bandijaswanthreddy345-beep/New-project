const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes\\2-2";
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

async function uploadAiml2_2() {
  console.log("==================================================");
  console.log("STARTING AIML 2-2 INGESTION FROM USER DIRECTORY");
  console.log(`Source: ${SOURCE_BASE}`);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`User directory not found: ${SOURCE_BASE}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test"
  });
  console.log("Connected to MongoDB successfully!\n");

  // Clean any previous 2-2 AIML records to prevent duplication
  console.log("Cleaning any previous AIML 2-2 records...");
  const delNotes = await Note.deleteMany({ branch: "AIML", semester: "2-2" });
  const delLabs = await LabProgram.deleteMany({ branch: "AIML", semester: "2-2" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} existing notes, ${delLabs.deletedCount} existing labs.\n`);

  // =========================================================================
  // 1. 23A05402T Database Management Systems
  // =========================================================================
  console.log("1. Processing Theory: 23A05402T Database Management Systems");
  const dbmsDir = path.join(SOURCE_BASE, "23A05402T Database Management Systems(3)");
  const dbmsFiles = [
    { file: "DBMS_Unit1_Introduction_and_ER_Model.pdf", mod: "Unit 1: Introduction to DBMS and Entity-Relationship Model", dest: "23A05402T_Unit_1_Database_Management_Systems.pdf" },
    { file: "DBMS_Unit2_Relational_Model_and_Basic_SQL.pdf", mod: "Unit 2: Relational Model and Relational Algebra", dest: "23A05402T_Unit_2_Database_Management_Systems.pdf" },
    { file: "DBMS_Unit3_SQL.pdf", mod: "Unit 3: Structured Query Language (SQL) & Schema Refinement", dest: "23A05402T_Unit_3_Database_Management_Systems.pdf" },
    { file: "DBMS_Unit4_Normalization.pdf", mod: "Unit 4: Schema Refinement and Normalization (1NF, 2NF, 3NF, BCNF)", dest: "23A05402T_Unit_4_Database_Management_Systems.pdf" },
    { file: "DBMS_Unit5_Transactions_and_Indexing.pdf", mod: "Unit 5: Transaction Management, Concurrency Control & Indexing", dest: "23A05402T_Unit_5_Database_Management_Systems.pdf" }
  ];
  const dbmsSources = [];
  const dbmsUrls = [];
  for (const f of dbmsFiles) {
    const src = path.join(dbmsDir, f.file);
    dbmsSources.push(src);
    dbmsUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dbmsMergedUrl = await mergePdfs(dbmsSources, "23A05402T_Database_Management_Systems_Complete_Notes.pdf");
  const dbmsDoc = await Note.create({
    title: "Database Management Systems",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "Database Management Systems",
    subjectCode: "23A05402T",
    description: "Comprehensive R23 lecture notes for Database Management Systems covering ER Modeling, Relational Algebra, SQL Queries & Constraints, Normal Forms (1NF through BCNF), Transaction Processing, ACID Properties, Concurrency Control, and Indexing Techniques.",
    credits: "3",
    module1: dbmsFiles[0].mod,
    module2: dbmsFiles[1].mod,
    module3: dbmsFiles[2].mod,
    module4: dbmsFiles[3].mod,
    module5: dbmsFiles[4].mod,
    module1Pdf: dbmsUrls[0],
    module2Pdf: dbmsUrls[1],
    module3Pdf: dbmsUrls[2],
    module4Pdf: dbmsUrls[3],
    module5Pdf: dbmsUrls[4],
    pdfUrl: dbmsMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created DBMS: ${dbmsDoc._id}\n`);

  // =========================================================================
  // 2. 23A05402P Database Management Systems Lab
  // =========================================================================
  console.log("2. Processing Lab: 23A05402P Database Management Systems Lab");
  const dbmsLabDir = path.join(SOURCE_BASE, "23A05402P Database Management Systems Lab(1.5)");
  const dbmsLabSrc = path.join(dbmsLabDir, "DBMS_Lab_23A05402P_Programs.pdf");
  const dbmsLabUrl = copyFileSafe(dbmsLabSrc, "23A05402P_Database_Management_Systems_Lab_Programs.pdf");
  copyFileSafe(dbmsLabSrc, "DBMS_Lab_23A05402P_Programs.pdf");

  const dbmsLabDoc = await LabProgram.create({
    title: "Database Management Systems Lab",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "Database Management Systems Lab",
    subjectCode: "23A05402P",
    description: "Complete R23 DBMS laboratory manual with DDL, DML, DCL commands, nested subqueries, joins, views, PL/SQL cursors, procedures, functions, triggers, and sample execution outputs.",
    pdfUrl: dbmsLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created DBMS Lab: ${dbmsLabDoc._id}\n`);

  // =========================================================================
  // 3. 23A30402 Digital Logic and Computer organization
  // =========================================================================
  console.log("3. Processing Theory: 23A30402 Digital Logic and Computer organization");
  const dlcoDir = path.join(SOURCE_BASE, "23A30402 Digital Logic and Computer organization(3)");
  const dlcoFiles = [
    { file: "unit-1.pdf", mod: "Unit 1: Data Representation & Digital Logic-I (Number Systems & Boolean Algebra)", dest: "23A30402_Unit_1_Digital_Logic_and_Computer_Organization.pdf" },
    { file: "DLCO_Unit2_Sequential_Circuits_Computer_Structure.pdf", mod: "Unit 2: Sequential Circuits & Basic Structure of Computers", dest: "23A30402_Unit_2_Digital_Logic_and_Computer_Organization.pdf" },
    { file: "Unit3_Computer_Organization_Notes.pdf", mod: "Unit 3: Central Processing Unit & Computer Organization", dest: "23A30402_Unit_3_Digital_Logic_and_Computer_Organization.pdf" },
    { file: "Unit-IV_Memory_Organization_Notes.pdf", mod: "Unit 4: Memory Organization, Hierarchy & Cache Management", dest: "23A30402_Unit_4_Digital_Logic_and_Computer_Organization.pdf" },
    { file: "Unit-V_IO_Organization_Notes.pdf", mod: "Unit 5: Input-Output Organization, Interrupts & DMA", dest: "23A30402_Unit_5_Digital_Logic_and_Computer_Organization.pdf" }
  ];
  const dlcoSources = [];
  const dlcoUrls = [];
  for (const f of dlcoFiles) {
    const src = path.join(dlcoDir, f.file);
    dlcoSources.push(src);
    dlcoUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dlcoMergedUrl = await mergePdfs(dlcoSources, "23A30402_Digital_Logic_and_Computer_Organization_Complete_Notes.pdf");
  const dlcoDoc = await Note.create({
    title: "Digital Logic and Computer Organization",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "Digital Logic and Computer Organization",
    subjectCode: "23A30402",
    description: "Comprehensive R23 study notes for Digital Logic & Computer Organization covering Number Systems, Combinational and Sequential Circuits, CPU Architecture, Instruction Cycles, Memory Hierarchy (RAM, ROM, Cache, Virtual Memory), and I/O Interfacing & DMA.",
    credits: "3",
    module1: dlcoFiles[0].mod,
    module2: dlcoFiles[1].mod,
    module3: dlcoFiles[2].mod,
    module4: dlcoFiles[3].mod,
    module5: dlcoFiles[4].mod,
    module1Pdf: dlcoUrls[0],
    module2Pdf: dlcoUrls[1],
    module3Pdf: dlcoUrls[2],
    module4Pdf: dlcoUrls[3],
    module5Pdf: dlcoUrls[4],
    pdfUrl: dlcoMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created DLCO: ${dlcoDoc._id}\n`);

  // =========================================================================
  // 4. 23A31401T Machine Learning
  // =========================================================================
  console.log("4. Processing Theory: 23A31401T Machine Learning");
  const mlDir = path.join(SOURCE_BASE, "23A31401T Machine Learning(3)");
  const mlFiles = [
    { file: "ML_Unit1_Introduction_to_Machine_Learning.pdf", mod: "Unit 1: Introduction to Machine Learning & Foundational Concepts", dest: "23A31401T_Unit_1_Machine_Learning.pdf" },
    { file: "ML_Unit2_Nearest_Neighbor_Models.pdf", mod: "Unit 2: Nearest Neighbor-Based Models & Similarity Metrics", dest: "23A31401T_Unit_2_Machine_Learning.pdf" },
    { file: "ML_Unit3_Decision_Trees_and_Bayes_Classifier.pdf", mod: "Unit 3: Decision Trees and Bayes Classifier", dest: "23A31401T_Unit_3_Machine_Learning.pdf" },
    { file: "ML_Unit4_Linear_Discriminants_SVM_MLP.pdf", mod: "Unit 4: Linear Discriminants, Support Vector Machines (SVM) & Multi-Layer Perceptrons", dest: "23A31401T_Unit_4_Machine_Learning.pdf" },
    { file: "ML_Unit5_Clustering.pdf", mod: "Unit 5: Unsupervised Clustering & Evaluation Metrics", dest: "23A31401T_Unit_5_Machine_Learning.pdf" }
  ];
  const mlSources = [];
  const mlUrls = [];
  for (const f of mlFiles) {
    const src = path.join(mlDir, f.file);
    mlSources.push(src);
    mlUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const mlMergedUrl = await mergePdfs(mlSources, "23A31401T_Machine_Learning_Complete_Notes.pdf");
  const mlDoc = await Note.create({
    title: "Machine Learning",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "Machine Learning",
    subjectCode: "23A31401T",
    description: "Official R23 Machine Learning core course notes covering Fundamentals of Machine Learning, k-Nearest Neighbors (k-NN), Decision Tree Induction, Naïve Bayes Classifiers, Linear Discriminant Analysis, Support Vector Machines (SVM), Multi-Layer Perceptron (MLP), and Unsupervised Clustering Algorithms.",
    credits: "3",
    module1: mlFiles[0].mod,
    module2: mlFiles[1].mod,
    module3: mlFiles[2].mod,
    module4: mlFiles[3].mod,
    module5: mlFiles[4].mod,
    module1Pdf: mlUrls[0],
    module2Pdf: mlUrls[1],
    module3Pdf: mlUrls[2],
    module4Pdf: mlUrls[3],
    module5Pdf: mlUrls[4],
    pdfUrl: mlMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Machine Learning: ${mlDoc._id}\n`);

  // =========================================================================
  // 5. 23A31403 AI & ML Lab
  // =========================================================================
  console.log("5. Processing Lab: 23A31403 AI & ML Lab");
  const aiMlLabDir = path.join(SOURCE_BASE, "23A31403 AI & ML Lab(1.5)");
  const aiMlLabSrc = path.join(aiMlLabDir, "AI_ML_Lab_23A31403_Programs (2).pdf");
  const aiMlLabUrl = copyFileSafe(aiMlLabSrc, "23A31403_AI_and_ML_Lab_Programs.pdf");
  copyFileSafe(aiMlLabSrc, "AI_ML_Lab_23A31403_Programs (2).pdf");

  const aiMlLabDoc = await LabProgram.create({
    title: "AI & ML Lab",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "AI & ML Lab",
    subjectCode: "23A31403",
    description: "Official R23 Artificial Intelligence & Machine Learning laboratory manual containing Python implementations of search algorithms, regression, classification, Decision Trees, SVM, clustering, and execution outputs.",
    pdfUrl: aiMlLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created AI & ML Lab: ${aiMlLabDoc._id}\n`);

  // =========================================================================
  // 6. 23A52401 Full Stack Development-1 (Skill Course / Lab)
  // =========================================================================
  console.log("6. Processing Practical/Lab: 23A52401 Full Stack Development-1");
  const fsdDir = path.join(SOURCE_BASE, "23A52401 Full Stack Development-1(2)");
  const fsdSrc = path.join(fsdDir, "FSD1_Lab_Notes.pdf");
  const fsdUrl = copyFileSafe(fsdSrc, "23A52401_Full_Stack_Development_1_Lab_Notes.pdf");
  copyFileSafe(fsdSrc, "FSD1_Lab_Notes.pdf");

  const fsdLabDoc = await LabProgram.create({
    title: "Full Stack Development-1",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "Full Stack Development-1",
    subjectCode: "23A52401",
    description: "Official R23 Full Stack Development - 1 laboratory and skill course manual covering HTML5, CSS3, JavaScript, DOM manipulation, responsive layouts, front-end development, and practical programs with outputs.",
    pdfUrl: fsdUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created FSD-1 Lab: ${fsdLabDoc._id}\n`);

  // Also create a Note entry for FSD-1 so students can access under Notes or Labs
  const fsdNoteDoc = await Note.create({
    title: "Full Stack Development-1",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "Full Stack Development-1",
    subjectCode: "23A52401",
    description: "Official R23 Full Stack Development - 1 skill course study manual containing web technology fundamentals, responsive front-end design, client-side scripting, and project execution guides.",
    credits: "2",
    module1: "Complete Full Stack Development 1 Manual & Practical Notes",
    module2: "",
    module3: "",
    module4: "",
    module5: "",
    module1Pdf: fsdUrl,
    module2Pdf: "",
    module3Pdf: "",
    module4Pdf: "",
    module5Pdf: "",
    pdfUrl: fsdUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created FSD-1 Note: ${fsdNoteDoc._id}\n`);

  // =========================================================================
  // 7. 23A52402e Optimization Techniques
  // =========================================================================
  console.log("7. Processing Theory: 23A52402e Optimization Techniques");
  const otDir = path.join(SOURCE_BASE, "23A52402e Optimization Techniques(2)");
  const otFiles = [
    { file: "OT_Unit1_Intro_and_Linear_Programming_23A52402e.pdf", mod: "Unit 1: Introduction to Optimization & Linear Programming Models", dest: "23A52402e_Unit_1_Optimization_Techniques.pdf" },
    { file: "OT_Unit2_Transportation_and_Assignment_23A52402e.pdf", mod: "Unit 2: Transportation and Assignment Models", dest: "23A52402e_Unit_2_Optimization_Techniques.pdf" },
    { file: "OT_Unit3_Sequencing_23A52402e.pdf", mod: "Unit 3: Sequencing Models", dest: "23A52402e_Unit_3_Optimization_Techniques.pdf" }
  ];
  // Also copy any extra files from this folder to uploads so they exist on disk safely
  const otSources = [];
  const otUrls = [];
  for (const f of otFiles) {
    const src = path.join(otDir, f.file);
    otSources.push(src);
    otUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const otMergedUrl = await mergePdfs(otSources, "23A52402e_Optimization_Techniques_Complete_Notes.pdf");
  const otDoc = await Note.create({
    title: "Optimization Techniques",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "Optimization Techniques",
    subjectCode: "23A52402e",
    description: "Official R23 Optimization Techniques lecture notes covering Linear Programming Problem (LPP) formulation & Simplex methods, Transportation & Assignment problem algorithms (MODI, Hungarian), and n-job Machine Sequencing models.",
    credits: "2",
    module1: otFiles[0].mod,
    module2: otFiles[1].mod,
    module3: otFiles[2].mod,
    module4: "",
    module5: "",
    module1Pdf: otUrls[0],
    module2Pdf: otUrls[1],
    module3Pdf: otUrls[2],
    module4Pdf: "",
    module5Pdf: "",
    pdfUrl: otMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Optimization Techniques: ${otDoc._id}\n`);

  // =========================================================================
  // 8. 23A54401 Probability & Statistics
  // =========================================================================
  console.log("8. Processing Theory: 23A54401 Probability & Statistics");
  const psDir = path.join(SOURCE_BASE, "23A54401 Probability & Statistics(3)");
  const psFiles = [
    { file: "Unit1_Descriptive_Statistics_23A54401.pdf", mod: "Unit 1: Descriptive Statistics & Measures of Central Tendency", dest: "23A54401_Unit_1_Probability_and_Statistics.pdf" },
    { file: "Unit2_Probability_23A54401.pdf", mod: "Unit 2: Probability & Bayes Theorem", dest: "23A54401_Unit_2_Probability_and_Statistics.pdf" },
    { file: "Unit3_Probability_Distributions_23A54401.pdf", mod: "Unit 3: Probability Distributions (Binomial, Poisson, Normal)", dest: "23A54401_Unit_3_Probability_and_Statistics.pdf" },
    { file: "Unit4_Estimation_and_Testing_of_Hypothesis_23A54401.pdf", mod: "Unit 4: Estimation and Large Sample Tests of Hypothesis", dest: "23A54401_Unit_4_Probability_and_Statistics.pdf" },
    { file: "Unit5_Small_Sample_Tests_23A54401.pdf", mod: "Unit 5: Small Sample Tests (t-Test, F-Test, Chi-Square)", dest: "23A54401_Unit_5_Probability_and_Statistics.pdf" }
  ];
  const psSources = [];
  const psUrls = [];
  for (const f of psFiles) {
    const src = path.join(psDir, f.file);
    psSources.push(src);
    psUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const psMergedUrl = await mergePdfs(psSources, "23A54401_Probability_and_Statistics_Complete_Notes.pdf");
  const psDoc = await Note.create({
    title: "Probability & Statistics",
    branch: "AIML",
    semester: "2-2",
    regulation: "R23",
    subject: "Probability & Statistics",
    subjectCode: "23A54401",
    description: "Official R23 Probability & Statistics complete study notes covering Descriptive Statistics, Probability Theory, Bayes Theorem, Discrete & Continuous Distributions, Estimation Theory, and Hypothesis Testing (Large and Small Sample Tests: z, t, F, Chi-Square).",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Probability & Statistics: ${psDoc._id}\n`);

  // Invalidate feed cache
  invalidateFeedCache();

  // Summary Verification
  console.log("==================================================");
  console.log("INGESTION SUMMARY FOR AIML 2-2");
  console.log("==================================================");
  const finalNotes = await Note.find({ branch: "AIML", semester: "2-2" });
  console.log(`Total AIML 2-2 Notes Ingested: ${finalNotes.length}`);
  finalNotes.forEach(n => {
    console.log(`  - [${n.subjectCode}] ${n.title} (Credits: ${n.credits})`);
    console.log(`    Main PDF: ${n.pdfUrl}`);
    console.log(`    Units: M1: ${Boolean(n.module1Pdf)}, M2: ${Boolean(n.module2Pdf)}, M3: ${Boolean(n.module3Pdf)}, M4: ${Boolean(n.module4Pdf)}, M5: ${Boolean(n.module5Pdf)}`);
  });

  const finalLabs = await LabProgram.find({ branch: "AIML", semester: "2-2" });
  console.log(`\nTotal AIML 2-2 Labs Ingested: ${finalLabs.length}`);
  finalLabs.forEach(l => {
    console.log(`  - [${l.subjectCode}] ${l.title}`);
    console.log(`    PDF: ${l.pdfUrl}`);
  });

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("INGESTION COMPLETED SUCCESSFULLY WITH 0 ERRORS!");
  console.log("==================================================");
}

uploadAiml2_2().catch(err => {
  console.error("FATAL ERROR IN INGESTION:", err);
  process.exit(1);
});
