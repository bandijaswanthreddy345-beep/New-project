const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\cse notes\\3-1";
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

async function uploadCse3_1() {
  console.log("==================================================");
  console.log("STARTING CSE 3-1 CURRICULUM INGESTION");
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

  console.log("Cleaning any previous CSE 3-1 notes and labs to avoid duplicates...");
  const delNotes = await Note.deleteMany({ branch: "CSE", semester: "3-1" });
  const delLabs = await LabProgram.deleteMany({ branch: "CSE", semester: "3-1" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} notes and ${delLabs.deletedCount} lab programs.\n`);

  const createdNotes = [];
  const createdLabs = [];

  // =============================================================
  // SECTION 1: THEORY SUBJECTS (Stored in Note collection)
  // =============================================================

  // -------------------------------------------------------------
  // 1. 23A05501T Artificial Intelligence
  // -------------------------------------------------------------
  console.log("1. Processing Theory: 23A05501T Artificial Intelligence");
  const aiDir = path.join(SOURCE_BASE, "artificial intelligence(23A05501T)3");
  const aiFiles = [
    { file: "AI_Unit1_Introduction_Notes.pdf", mod: "Unit 1: Introduction to Artificial Intelligence & Intelligent Agents", dest: "CSE_3-1_23A05501T_Unit1_AI.pdf" },
    { file: "AI_Unit2_Solving_Problems_by_Searching_Notes.pdf", mod: "Unit 2: Problem Solving by Searching (Heuristic & Adversarial Search)", dest: "CSE_3-1_23A05501T_Unit2_AI.pdf" },
    { file: "AI_Unit3_RL_and_NLP_Notes.pdf", mod: "Unit 3: Reinforcement Learning & Natural Language Processing", dest: "CSE_3-1_23A05501T_Unit3_AI.pdf" },
    { file: "AI_Unit4_NL_for_Communication_and_Perception_Notes.pdf", mod: "Unit 4: Natural Language for Communication & Perception", dest: "CSE_3-1_23A05501T_Unit4_AI.pdf" },
    { file: "AI_Unit5_Robotics_and_Philosophy_Notes.pdf", mod: "Unit 5: Robotics, Ethics & Philosophy of AI", dest: "CSE_3-1_23A05501T_Unit5_AI.pdf" },
  ];
  const aiSources = [];
  const aiUrls = [];
  for (const f of aiFiles) {
    const src = path.join(aiDir, f.file);
    aiSources.push(src);
    aiUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const aiMergedUrl = await mergePdfs(aiSources, "CSE_3-1_23A05501T_Artificial_Intelligence_Complete_Notes.pdf");
  const aiDoc = await Note.create({
    title: "Artificial Intelligence Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Artificial Intelligence",
    subjectCode: "23A05501T",
    description: "Complete lecture notes for Artificial Intelligence (23A05501T) under JNTU R23 Curriculum for CSE 3-1 semester. Covers Intelligent Agents, Uninformed & Heuristic Search Algorithms, Adversarial Search & Games, Reinforcement Learning, Natural Language Processing, Perception & Vision, and Robotics & Ethical Foundations of AI.",
    credits: "3",
    module1: aiFiles[0].mod,
    module2: aiFiles[1].mod,
    module3: aiFiles[2].mod,
    module4: aiFiles[3].mod,
    module5: aiFiles[4].mod,
    module1Pdf: aiUrls[0],
    module2Pdf: aiUrls[1],
    module3Pdf: aiUrls[2],
    module4Pdf: aiUrls[3],
    module5Pdf: aiUrls[4],
    pdfUrl: aiMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(aiDoc);
  console.log(`  [SAVED NOTE] ${aiDoc.title} (_id: ${aiDoc._id})\n`);

  // -------------------------------------------------------------
  // 2. 23A05502T Computer Networks
  // -------------------------------------------------------------
  console.log("2. Processing Theory: 23A05502T Computer Networks");
  const cnDir = path.join(SOURCE_BASE, "computer networks(23A05502T)3");
  const cnFiles = [
    { file: "CN_Unit1_Computer_Networks_and_Internet_Notes.pdf", mod: "Unit 1: Computer Networks and the Internet (Protocols & Layered Architectures)", dest: "CSE_3-1_23A05502T_Unit1_CN.pdf" },
    { file: "CN_Unit2_Data_Link_Layer_and_LANs_Notes.pdf", mod: "Unit 2: Data Link Layer & Local Area Networks (Error Detection, MAC & Ethernet)", dest: "CSE_3-1_23A05502T_Unit2_CN.pdf" },
    { file: "CN_Unit3_Network_Layer_Notes.pdf", mod: "Unit 3: Network Layer (Routing Algorithms, IPv4, IPv6 & Subnetting)", dest: "CSE_3-1_23A05502T_Unit3_CN.pdf" },
    { file: "CN_Unit4_Transport_Layer_Notes.pdf", mod: "Unit 4: Transport Layer (TCP, UDP, Congestion Control & Reliable Transfer)", dest: "CSE_3-1_23A05502T_Unit4_CN.pdf" },
    { file: "CN_Unit5_Network_Applications_Notes.pdf", mod: "Unit 5: Application Layer Protocols (DNS, HTTP, SMTP) & Network Security Basics", dest: "CSE_3-1_23A05502T_Unit5_CN.pdf" },
  ];
  const cnSources = [];
  const cnUrls = [];
  for (const f of cnFiles) {
    const src = path.join(cnDir, f.file);
    cnSources.push(src);
    cnUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const cnMergedUrl = await mergePdfs(cnSources, "CSE_3-1_23A05502T_Computer_Networks_Complete_Notes.pdf");
  const cnDoc = await Note.create({
    title: "Computer Networks Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Computer Networks",
    subjectCode: "23A05502T",
    description: "Complete study notes for Computer Networks (23A05502T) under JNTU R23 Curriculum for CSE 3-1 semester. Covers Network Core & Edge Principles, Data Link Framing and Medium Access Control, Network Layer Routing (OSPF, BGP, Distance Vector, Link State), Transport Protocols (TCP & UDP), and Application Layer Protocols.",
    credits: "3",
    module1: cnFiles[0].mod,
    module2: cnFiles[1].mod,
    module3: cnFiles[2].mod,
    module4: cnFiles[3].mod,
    module5: cnFiles[4].mod,
    module1Pdf: cnUrls[0],
    module2Pdf: cnUrls[1],
    module3Pdf: cnUrls[2],
    module4Pdf: cnUrls[3],
    module5Pdf: cnUrls[4],
    pdfUrl: cnMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(cnDoc);
  console.log(`  [SAVED NOTE] ${cnDoc.title} (_id: ${cnDoc._id})\n`);

  // -------------------------------------------------------------
  // 3. 23A05503 Automata Theory and Compiler Design
  // -------------------------------------------------------------
  console.log("3. Processing Theory: 23A05503 Automata Theory and Compiler Design");
  const atcdDir = path.join(SOURCE_BASE, "automata theory and compiler design(23A05503)3");
  const atcdFiles = [
    { file: "ATCD_Unit_I_Notes.pdf", mod: "Unit 1: Finite Automata & Regular Expressions (DFA, NFA, Minimization & Pumping Lemma)", dest: "CSE_3-1_23A05503_Unit1_ATCD.pdf" },
    { file: "ATCD_Unit_II_Notes.pdf", mod: "Unit 2: Context-Free Grammars, Pushdown Automata & Lexical Analysis (LEX/FLEX)", dest: "CSE_3-1_23A05503_Unit2_ATCD.pdf" },
    { file: "ATCD_Unit_III_Notes.pdf", mod: "Unit 3: Syntax Analysis & Parsing Techniques (Top-Down LL(1) & Bottom-Up LR, LALR)", dest: "CSE_3-1_23A05503_Unit3_ATCD.pdf" },
    { file: "ATCD_Unit_IV_Notes.pdf", mod: "Unit 4: Syntax-Directed Translation, Type Checking & Intermediate Code Generation", dest: "CSE_3-1_23A05503_Unit4_ATCD.pdf" },
    { file: "ATCD_Unit_V_Notes.pdf", mod: "Unit 5: Code Optimization, Code Generation & Target Machine Architecture", dest: "CSE_3-1_23A05503_Unit5_ATCD.pdf" },
  ];
  const atcdSources = [];
  const atcdUrls = [];
  for (const f of atcdFiles) {
    const src = path.join(atcdDir, f.file);
    atcdSources.push(src);
    atcdUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const atcdMergedUrl = await mergePdfs(atcdSources, "CSE_3-1_23A05503_Automata_Theory_and_Compiler_Design_Complete_Notes.pdf");
  const atcdDoc = await Note.create({
    title: "Automata Theory and Compiler Design Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Automata Theory and Compiler Design",
    subjectCode: "23A05503",
    description: "Complete study material for Automata Theory and Compiler Design (23A05503) under JNTU R23 Curriculum for CSE 3-1 semester. Covers Finite State Automata, Context-Free Grammars & PDA, Lexical Analysis, Top-Down and Bottom-Up Parsing, Syntax-Directed Translation, Intermediate Code Generation (Three-Address Code), and Code Optimization & Generation.",
    credits: "3",
    module1: atcdFiles[0].mod,
    module2: atcdFiles[1].mod,
    module3: atcdFiles[2].mod,
    module4: atcdFiles[3].mod,
    module5: atcdFiles[4].mod,
    module1Pdf: atcdUrls[0],
    module2Pdf: atcdUrls[1],
    module3Pdf: atcdUrls[2],
    module4Pdf: atcdUrls[3],
    module5Pdf: atcdUrls[4],
    pdfUrl: atcdMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(atcdDoc);
  console.log(`  [SAVED NOTE] ${atcdDoc.title} (_id: ${atcdDoc._id})\n`);

  // -------------------------------------------------------------
  // 4. 23A05504a Object Oriented Analysis and Design (PE-I)
  // -------------------------------------------------------------
  console.log("4. Processing Theory: 23A05504a Object Oriented Analysis and Design");
  const ooadDir = path.join(SOURCE_BASE, "object oriented analysis and design(23A05504a)3");
  const ooadFiles = [
    { file: "OOAD_Unit1.pdf", mod: "Unit 1: Introduction to OOAD & Unified Modeling Language (UML Building Blocks)", dest: "CSE_3-1_23A05504a_Unit1_OOAD.pdf" },
    { file: "OOAD_Unit2.pdf", mod: "Unit 2: Basic & Advanced Structural Modeling (Class, Object & Package Diagrams)", dest: "CSE_3-1_23A05504a_Unit2_OOAD.pdf" },
    { file: "OOAD_Unit3.pdf", mod: "Unit 3: Basic & Advanced Behavioral Modeling (Interaction, Use Case, Statechart & Activity Diagrams)", dest: "CSE_3-1_23A05504a_Unit3_OOAD.pdf" },
    { file: "OOAD_Unit4.pdf", mod: "Unit 4: Architectural Modeling (Component Diagrams, Deployment Diagrams & Patterns)", dest: "CSE_3-1_23A05504a_Unit4_OOAD.pdf" },
    { file: "OOAD_Unit5.pdf", mod: "Unit 5: Design Patterns & Case Studies (Library, ATM & Hospital Management Systems)", dest: "CSE_3-1_23A05504a_Unit5_OOAD.pdf" },
  ];
  const ooadSources = [];
  const ooadUrls = [];
  for (const f of ooadFiles) {
    const src = path.join(ooadDir, f.file);
    ooadSources.push(src);
    ooadUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const ooadMergedUrl = await mergePdfs(ooadSources, "CSE_3-1_23A05504a_Object_Oriented_Analysis_and_Design_Complete_Notes.pdf");
  const ooadDoc = await Note.create({
    title: "Object Oriented Analysis and Design Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Object Oriented Analysis and Design",
    subjectCode: "23A05504a",
    description: "Complete lecture notes for Object Oriented Analysis and Design (23A05504a) under JNTU R23 Curriculum for CSE 3-1 semester. Covers Object-Oriented Modeling Principles, UML 2.0 Diagrams (Class, Use Case, Sequence, State Machine, Activity), Architectural Modeling (Components & Deployment), Creational/Structural/Behavioral Design Patterns, and Real-World Software Case Studies.",
    credits: "3",
    module1: ooadFiles[0].mod,
    module2: ooadFiles[1].mod,
    module3: ooadFiles[2].mod,
    module4: ooadFiles[3].mod,
    module5: ooadFiles[4].mod,
    module1Pdf: ooadUrls[0],
    module2Pdf: ooadUrls[1],
    module3Pdf: ooadUrls[2],
    module4Pdf: ooadUrls[3],
    module5Pdf: ooadUrls[4],
    pdfUrl: ooadMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(ooadDoc);
  console.log(`  [SAVED NOTE] ${ooadDoc.title} (_id: ${ooadDoc._id})\n`);

  // -------------------------------------------------------------
  // 5. 23A05504b Soft Computing (PE-I)
  // -------------------------------------------------------------
  console.log("5. Processing Theory: 23A05504b Soft Computing");
  const scDir = path.join(SOURCE_BASE, "soft computing(23A05504b)3");
  const scFiles = [
    { file: "Unit_I_Introduction_to_Soft_Computing.pdf", mod: "Unit 1: Introduction to Soft Computing & Artificial Neural Networks (Perceptrons & Backpropagation)", dest: "CSE_3-1_23A05504b_Unit1_Soft_Computing.pdf" },
    { file: "Unit_II_Fuzzy_Systems.pdf", mod: "Unit 2: Fuzzy Logic & Fuzzy Systems (Fuzzy Sets, Operations, Membership Functions & Rules)", dest: "CSE_3-1_23A05504b_Unit2_Soft_Computing.pdf" },
    { file: "Unit_III_Fuzzy_Decision_Making_and_PSO.pdf", mod: "Unit 3: Fuzzy Decision Making & Particle Swarm Optimization (PSO)", dest: "CSE_3-1_23A05504b_Unit3_Soft_Computing.pdf" },
    { file: "Unit_IV_Genetic_Algorithms.pdf", mod: "Unit 4: Genetic Algorithms & Evolutionary Computation (Crossover, Mutation & Selection)", dest: "CSE_3-1_23A05504b_Unit4_Soft_Computing.pdf" },
    { file: "Unit_V_Rough_Sets_and_Integration.pdf", mod: "Unit 5: Rough Sets & Hybrid Soft Computing Systems (Neuro-Fuzzy & Genetic-Neuro Systems)", dest: "CSE_3-1_23A05504b_Unit5_Soft_Computing.pdf" },
  ];
  const scSources = [];
  const scUrls = [];
  for (const f of scFiles) {
    const src = path.join(scDir, f.file);
    scSources.push(src);
    scUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const scMergedUrl = await mergePdfs(scSources, "CSE_3-1_23A05504b_Soft_Computing_Complete_Notes.pdf");
  const scDoc = await Note.create({
    title: "Soft Computing Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Soft Computing",
    subjectCode: "23A05504b",
    description: "Complete study material for Soft Computing (23A05504b) under JNTU R23 Curriculum for CSE 3-1 semester. Covers Neural Networks (Supervised & Unsupervised Learning), Fuzzy Logic & Inference Systems, Fuzzy Decision Making, Particle Swarm Optimization (PSO), Genetic Algorithms, Rough Set Theory, and Hybrid Soft Computing Systems.",
    credits: "3",
    module1: scFiles[0].mod,
    module2: scFiles[1].mod,
    module3: scFiles[2].mod,
    module4: scFiles[3].mod,
    module5: scFiles[4].mod,
    module1Pdf: scUrls[0],
    module2Pdf: scUrls[1],
    module3Pdf: scUrls[2],
    module4Pdf: scUrls[3],
    module5Pdf: scUrls[4],
    pdfUrl: scMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(scDoc);
  console.log(`  [SAVED NOTE] ${scDoc.title} (_id: ${scDoc._id})\n`);

  // -------------------------------------------------------------
  // 6. 23A05504c Microprocessors and Microcontrollers (PE-I)
  // -------------------------------------------------------------
  console.log("6. Processing Theory: 23A05504c Microprocessors and Microcontrollers");
  const mpmcDir = path.join(SOURCE_BASE, "microprocesssors nad microcontrollers(23A05504c)3");
  const mpmcFiles = [
    { file: "unit1-hand.pdf", mod: "Unit 1: 8086 Microprocessor Architecture, Register Organization & Memory Segmentation", dest: "CSE_3-1_23A05504c_Unit1_MPMC.pdf" },
    { file: "unit2-hand.pdf", mod: "Unit 2: 8086 Instruction Set, Addressing Modes & Assembly Language Programming", dest: "CSE_3-1_23A05504c_Unit2_MPMC.pdf" },
    { file: "unit3-hand.pdf", mod: "Unit 3: 8086 Memory & I/O Interfacing (8255 PPI, Timers, Interrupts & DMA Controller)", dest: "CSE_3-1_23A05504c_Unit3_MPMC.pdf" },
    { file: "unit4-hand.pdf", mod: "Unit 4: 8051 Microcontroller Architecture, Memory Organization & Peripheral Interfacing", dest: "CSE_3-1_23A05504c_Unit4_MPMC.pdf" },
    { file: "unit5-hand.pdf", mod: "Unit 5: Advanced Microcontrollers, Real-World Embedded Applications & Interfacing", dest: "CSE_3-1_23A05504c_Unit5_MPMC.pdf" },
  ];
  const mpmcSources = [];
  const mpmcUrls = [];
  for (const f of mpmcFiles) {
    const src = path.join(mpmcDir, f.file);
    mpmcSources.push(src);
    mpmcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const mpmcMergedUrl = await mergePdfs(mpmcSources, "CSE_3-1_23A05504c_Microprocessors_and_Microcontrollers_Complete_Notes.pdf");
  const mpmcDoc = await Note.create({
    title: "Microprocessors and Microcontrollers Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Microprocessors and Microcontrollers",
    subjectCode: "23A05504c",
    description: "Complete handwritten lecture notes for Microprocessors and Microcontrollers (23A05504c) under JNTU R23 Curriculum for CSE 3-1 semester. Covers 8086 Architecture, Assembly Language Programming, Peripheral Interfacing (8255, 8259, 8251, 8257), 8051 Microcontroller Architecture, Timers, Serial Communication, and Embedded System Applications.",
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

  // -------------------------------------------------------------
  // 7. 23A05504d Data Warehousing and Data Mining (PE-I)
  // -------------------------------------------------------------
  console.log("7. Processing Theory: 23A05504d Data Warehousing and Data Mining");
  const dwdmDir = path.join(SOURCE_BASE, "data warehousing and data mining(23A05504d)3");
  const dwdmFiles = [
    { file: "DWDM_Unit_1_Handwritten_Notes.pdf", mod: "Unit 1: Data Warehousing Fundamentals, Multidimensional Data Models & OLAP Operations", dest: "CSE_3-1_23A05504d_Unit1_DWDM.pdf" },
    { file: "DWDM_Unit_2_Handwritten_Notes.pdf", mod: "Unit 2: Data Preprocessing (Cleaning, Integration, Transformation & Reduction)", dest: "CSE_3-1_23A05504d_Unit2_DWDM.pdf" },
    { file: "DWDM_Unit_3_Handwritten_Notes.pdf", mod: "Unit 3: Mining Frequent Patterns, Association Rules & Correlation Analysis (Apriori & FP-Growth)", dest: "CSE_3-1_23A05504d_Unit3_DWDM.pdf" },
    { file: "DWDM_Unit_4_Handwritten_Notes.pdf", mod: "Unit 4: Classification Techniques (Decision Trees, Naïve Bayes, Rule-Based & Backpropagation)", dest: "CSE_3-1_23A05504d_Unit4_DWDM.pdf" },
    { file: "DWDM_Unit_5_Handwritten_Notes.pdf", mod: "Unit 5: Cluster Analysis (Partitioning, Hierarchical, Density-Based) & Outlier Detection", dest: "CSE_3-1_23A05504d_Unit5_DWDM.pdf" },
  ];
  const dwdmSources = [];
  const dwdmUrls = [];
  for (const f of dwdmFiles) {
    const src = path.join(dwdmDir, f.file);
    dwdmSources.push(src);
    dwdmUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dwdmMergedUrl = await mergePdfs(dwdmSources, "CSE_3-1_23A05504d_Data_Warehousing_and_Data_Mining_Complete_Notes.pdf");
  const dwdmDoc = await Note.create({
    title: "Data Warehousing and Data Mining Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Data Warehousing and Data Mining",
    subjectCode: "23A05504d",
    description: "Complete handwritten notes for Data Warehousing and Data Mining (23A05504d) under JNTU R23 Curriculum for CSE 3-1 semester. Covers Data Warehouse Architecture, Schema Design (Star, Snowflake, Fact Constellation), Data Preprocessing, Association Rule Mining (Apriori, FP-Tree), Classification Algorithms, and Clustering Methods.",
    credits: "3",
    module1: dwdmFiles[0].mod,
    module2: dwdmFiles[1].mod,
    module3: dwdmFiles[2].mod,
    module4: dwdmFiles[3].mod,
    module5: dwdmFiles[4].mod,
    module1Pdf: dwdmUrls[0],
    module2Pdf: dwdmUrls[1],
    module3Pdf: dwdmUrls[2],
    module4Pdf: dwdmUrls[3],
    module5Pdf: dwdmUrls[4],
    pdfUrl: dwdmMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(dwdmDoc);
  console.log(`  [SAVED NOTE] ${dwdmDoc.title} (_id: ${dwdmDoc._id})\n`);

  // -------------------------------------------------------------
  // 8. 23A05505a Introduction to Artificial Intelligence (OE-I)
  // -------------------------------------------------------------
  console.log("8. Processing Theory: 23A05505a Introduction to Artificial Intelligence");
  const oaiDir = path.join(SOURCE_BASE, "introduction to artificial intelligence(23A05505a)3");
  const oaiFiles = [
    { file: "AI_Unit_1_Handwritten_Notes.pdf", mod: "Unit 1: Overview of Artificial Intelligence, Turing Test & Intelligent Agents", dest: "CSE_3-1_23A05505a_Unit1_Intro_AI.pdf" },
    { file: "AI_Unit_2_Handwritten_Notes.pdf", mod: "Unit 2: Problem Solving & Search Strategies (BFS, DFS, Greedy & A* Search)", dest: "CSE_3-1_23A05505a_Unit2_Intro_AI.pdf" },
    { file: "AI_Unit_3_Handwritten_Notes.pdf", mod: "Unit 3: Knowledge Representation, Propositional & First-Order Predicate Logic", dest: "CSE_3-1_23A05505a_Unit3_Intro_AI.pdf" },
    { file: "AI_Unit_4_Handwritten_Notes.pdf", mod: "Unit 4: Reasoning Under Uncertainty, Probabilistic Reasoning & Bayes Rule", dest: "CSE_3-1_23A05505a_Unit4_Intro_AI.pdf" },
    { file: "AI_Unit_5_Handwritten_Notes.pdf", mod: "Unit 5: Practical Applications of AI in Computer Vision, Speech & Automation", dest: "CSE_3-1_23A05505a_Unit5_Intro_AI.pdf" },
  ];
  const oaiSources = [];
  const oaiUrls = [];
  for (const f of oaiFiles) {
    const src = path.join(oaiDir, f.file);
    oaiSources.push(src);
    oaiUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const oaiMergedUrl = await mergePdfs(oaiSources, "CSE_3-1_23A05505a_Introduction_to_Artificial_Intelligence_Complete_Notes.pdf");
  const oaiDoc = await Note.create({
    title: "Introduction to Artificial Intelligence Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Introduction to Artificial Intelligence",
    subjectCode: "23A05505a",
    description: "Complete handwritten notes for Introduction to Artificial Intelligence (23A05505a) under JNTU R23 Curriculum for CSE 3-1 semester (Open Elective - I). Covers Foundations of AI, Search Strategies, Knowledge Representation, Uncertainty & Bayesian Networks, and Real-World AI Applications.",
    credits: "3",
    module1: oaiFiles[0].mod,
    module2: oaiFiles[1].mod,
    module3: oaiFiles[2].mod,
    module4: oaiFiles[3].mod,
    module5: oaiFiles[4].mod,
    module1Pdf: oaiUrls[0],
    module2Pdf: oaiUrls[1],
    module3Pdf: oaiUrls[2],
    module4Pdf: oaiUrls[3],
    module5Pdf: oaiUrls[4],
    pdfUrl: oaiMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(oaiDoc);
  console.log(`  [SAVED NOTE] ${oaiDoc.title} (_id: ${oaiDoc._id})\n`);

  // -------------------------------------------------------------
  // 9. 23A05505b Java Programming (OE-I)
  // -------------------------------------------------------------
  console.log("9. Processing Theory: Java Programming (Open Elective - I)");
  const javaDir = path.join(SOURCE_BASE, "java programming(23A05505a)3");
  const javaFiles = [
    { file: "Java_Unit_1_Notes.pdf", mod: "Unit 1: Introduction to OOP, Java Language Fundamentals, JVM, Data Types & Operators", dest: "CSE_3-1_23A05505b_Unit1_Java.pdf" },
    { file: "Java_Unit_2_Notes.pdf", mod: "Unit 2: Classes, Objects, Methods, Constructors, Inheritance & Polymorphism", dest: "CSE_3-1_23A05505b_Unit2_Java.pdf" },
    { file: "Java_Unit_3_Notes.pdf", mod: "Unit 3: Packages, Interfaces & Exception Handling Mechanisms", dest: "CSE_3-1_23A05505b_Unit3_Java.pdf" },
    { file: "Java_Unit_4_Notes.pdf", mod: "Unit 4: Multithreading, Thread Synchronization, Generics & Collections Framework", dest: "CSE_3-1_23A05505b_Unit4_Java.pdf" },
    { file: "Java_Unit_5_Notes.pdf", mod: "Unit 5: Event Handling, GUI Programming (AWT/Swing) & Java I/O Streams", dest: "CSE_3-1_23A05505b_Unit5_Java.pdf" },
  ];
  const javaSources = [];
  const javaUrls = [];
  for (const f of javaFiles) {
    const src = path.join(javaDir, f.file);
    javaSources.push(src);
    javaUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const javaMergedUrl = await mergePdfs(javaSources, "CSE_3-1_23A05505b_Java_Programming_Complete_Notes.pdf");
  const javaDoc = await Note.create({
    title: "Java Programming Notes",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Java Programming",
    subjectCode: "23A05505b",
    description: "Complete lecture notes for Java Programming under JNTU R23 Curriculum for CSE 3-1 semester (Open Elective - I). Covers Object-Oriented Programming Principles, JVM Architecture, Inheritance & Interfaces, Exception Handling, Multithreading, Java Collections Framework, and GUI Development using Swing/AWT.",
    credits: "3",
    module1: javaFiles[0].mod,
    module2: javaFiles[1].mod,
    module3: javaFiles[2].mod,
    module4: javaFiles[3].mod,
    module5: javaFiles[4].mod,
    module1Pdf: javaUrls[0],
    module2Pdf: javaUrls[1],
    module3Pdf: javaUrls[2],
    module4Pdf: javaUrls[3],
    module5Pdf: javaUrls[4],
    pdfUrl: javaMergedUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdNotes.push(javaDoc);
  console.log(`  [SAVED NOTE] ${javaDoc.title} (_id: ${javaDoc._id})\n`);

  // =============================================================
  // SECTION 2: LAB PROGRAMS (Stored in LabProgram collection)
  // =============================================================

  // -------------------------------------------------------------
  // 10. 23A05501P Artificial Intelligence Lab
  // -------------------------------------------------------------
  console.log("10. Processing Lab: 23A05501P Artificial Intelligence Lab");
  const aiLabDir = path.join(SOURCE_BASE, "Artificial intelligence lab(23A05501P)1.5");
  const aiLabFile = "AI_Lab_Programs.pdf";
  const aiLabSrc = path.join(aiLabDir, aiLabFile);
  const aiLabUrl = copyFileSafe(aiLabSrc, "CSE_3-1_23A05501P_Artificial_Intelligence_Lab_Manual.pdf");
  copyFileSafe(aiLabSrc, aiLabFile);

  const aiLabDoc = await LabProgram.create({
    title: "Artificial Intelligence Lab Manual & Programs",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Artificial Intelligence Lab",
    subjectCode: "23A05501P",
    description: "Complete laboratory manual, Python source programs, search algorithms implementation (BFS, DFS, A*, AO*, Mini-Max), problem solving implementations (8-Puzzle, Water Jug, Travelling Salesperson), and observation results for Artificial Intelligence Lab (23A05501P) under JNTU R23 Curriculum for CSE 3-1 semester.",
    pdfUrl: aiLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(aiLabDoc);
  console.log(`  [SAVED LAB] ${aiLabDoc.title} (_id: ${aiLabDoc._id})\n`);

  // -------------------------------------------------------------
  // 11. 23A05502P Computer Networks Lab
  // -------------------------------------------------------------
  console.log("11. Processing Lab: 23A05502P Computer Networks Lab");
  const cnLabDir = path.join(SOURCE_BASE, "computer networks lab(23A05502P)1.5");
  const cnLabFile = "CN_Lab_Programs.pdf";
  const cnLabSrc = path.join(cnLabDir, cnLabFile);
  const cnLabUrl = copyFileSafe(cnLabSrc, "CSE_3-1_23A05502P_Computer_Networks_Lab_Manual.pdf");
  copyFileSafe(cnLabSrc, cnLabFile);

  const cnLabDoc = await LabProgram.create({
    title: "Computer Networks Lab Manual & Programs",
    branch: "CSE",
    semester: "3-1",
    regulation: "R23",
    subject: "Computer Networks Lab",
    subjectCode: "23A05502P",
    description: "Complete laboratory manual, socket programming code (TCP/UDP client-server in C/Java/Python), packet sniffing and analysis experiments using Wireshark, routing algorithm simulations (Distance Vector, Link State), and network topology configuration for Computer Networks Lab (23A05502P) under JNTU R23 Curriculum for CSE 3-1 semester.",
    pdfUrl: cnLabUrl,
    downloads: 0,
    views: 0,
    likes: 0,
  });
  createdLabs.push(cnLabDoc);
  console.log(`  [SAVED LAB] ${cnLabDoc.title} (_id: ${cnLabDoc._id})\n`);

  // =============================================================
  // SECTION 3: CACHE INVALIDATION & FINAL VERIFICATION
  // =============================================================
  console.log("Invalidating Feed Cache...");
  if (typeof invalidateFeedCache === "function") {
    invalidateFeedCache();
    console.log("  [CACHE] In-memory feed cache invalidated.");
  }

  console.log("\n==================================================");
  console.log("SUMMARY OF CSE 3-1 INGESTION");
  console.log(`Theory Notes Saved in Note collection: ${createdNotes.length}`);
  createdNotes.forEach((n) => console.log(`  - [${n.subjectCode}] ${n.subject} (PDF: ${n.pdfUrl})`));

  console.log(`\nLab Programs Saved in LabProgram collection: ${createdLabs.length}`);
  createdLabs.forEach((l) => console.log(`  - [${l.subjectCode}] ${l.subject} (PDF: ${l.pdfUrl})`));
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Database disconnected. Done!");
}

uploadCse3_1().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
