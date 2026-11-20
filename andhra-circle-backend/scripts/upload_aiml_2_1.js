const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes\\2-1";
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

async function uploadAiml2_1() {
  console.log("==================================================");
  console.log("STARTING AIML 2-1 INGESTION FROM USER DIRECTORY");
  console.log(`Source: ${SOURCE_BASE}`);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`User directory not found: ${SOURCE_BASE}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test"
  });
  console.log("Connected to MongoDB successfully!\n");

  // Clean any previous 2-1 AIML records to prevent duplication
  console.log("Cleaning any previous AIML 2-1 records...");
  const delNotes = await Note.deleteMany({ branch: "AIML", semester: "2-1" });
  const delLabs = await LabProgram.deleteMany({ branch: "AIML", semester: "2-1" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} existing notes, ${delLabs.deletedCount} existing labs.\n`);

  // =========================================================================
  // 1. 23A05302T Advanced Data Structures & algorithms analysis
  // =========================================================================
  console.log("1. Processing Theory: 23A05302T Advanced Data Structures & algorithms analysis");
  const adsaDir = path.join(SOURCE_BASE, "23A05302T Advanced Data Structures & algorithms analysis(3)");
  const adsaFiles = [
    { file: "Unit_1_Linear_Data_Structures_Searching_Sorting.pdf", mod: "Unit 1: Linear Data Structures, Searching and Sorting Techniques", dest: "23A05302T_Unit_1_Advanced_Data_Structures.pdf" },
    { file: "Unit_2_Linked_Lists.pdf", mod: "Unit 2: Singly, Doubly and Circular Linked Lists and Operations", dest: "23A05302T_Unit_2_Advanced_Data_Structures.pdf" },
    { file: "Unit_3_Stacks.pdf", mod: "Unit 3: Stacks Implementation, Infix-Postfix Conversion & Applications", dest: "23A05302T_Unit_3_Advanced_Data_Structures.pdf" },
    { file: "Unit_4_Queues_and_Deques.pdf", mod: "Unit 4: Queues, Circular Queues, Priority Queues and Deques", dest: "23A05302T_Unit_4_Advanced_Data_Structures.pdf" },
    { file: "Unit_5_Trees_and_Hashing.pdf", mod: "Unit 5: Binary Search Trees, AVL Trees, B-Trees and Hashing", dest: "23A05302T_Unit_5_Advanced_Data_Structures.pdf" }
  ];
  const adsaSources = [];
  const adsaUrls = [];
  for (const f of adsaFiles) {
    const src = path.join(adsaDir, f.file);
    adsaSources.push(src);
    adsaUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const adsaMergedUrl = await mergePdfs(adsaSources, "23A05302T_Advanced_Data_Structures_and_Algorithms_Complete_Notes.pdf");
  const adsaDoc = await Note.create({
    title: "Advanced Data Structures & Algorithms Analysis",
    branch: "AIML",
    semester: "2-1",
    regulation: "R23",
    subject: "Advanced Data Structures & Algorithms Analysis",
    subjectCode: "23A05302T",
    description: "Comprehensive R23 lecture notes for Advanced Data Structures & Algorithms Analysis covering Linear Data Structures, Searching & Sorting, Linked Lists, Stacks & Applications, Queues & Deques, Non-Linear Trees (BST, AVL, B-Trees), and Hashing Techniques.",
    credits: "3",
    module1: adsaFiles[0].mod,
    module2: adsaFiles[1].mod,
    module3: adsaFiles[2].mod,
    module4: adsaFiles[3].mod,
    module5: adsaFiles[4].mod,
    module1Pdf: adsaUrls[0],
    module2Pdf: adsaUrls[1],
    module3Pdf: adsaUrls[2],
    module4Pdf: adsaUrls[3],
    module5Pdf: adsaUrls[4],
    pdfUrl: adsaMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created ADSAA: ${adsaDoc._id}\n`);

  // =========================================================================
  // 2. 23A05302P Advanced Data Structures and algorithm analysis lab
  // =========================================================================
  console.log("2. Processing Lab: 23A05302P Advanced Data Structures and algorithm analysis lab");
  const adsaLabDir = path.join(SOURCE_BASE, "23A05302P Advanced Data Structures and algorithm analysis lab(1.5)");
  const adsaLabSrc = path.join(adsaLabDir, "ADSAA_Lab_Programs.pdf");
  const adsaLabUrl = copyFileSafe(adsaLabSrc, "23A05302P_Advanced_Data_Structures_Lab_Programs.pdf");
  copyFileSafe(adsaLabSrc, "ADSAA_Lab_Programs.pdf");

  const adsaLabDoc = await LabProgram.create({
    title: "Advanced Data Structures & Algorithms Lab",
    branch: "AIML",
    semester: "2-1",
    regulation: "R23",
    subject: "Advanced Data Structures & Algorithms Lab",
    subjectCode: "23A05302P",
    description: "Official R23 Advanced Data Structures and Algorithm Analysis practical laboratory manual containing complete programs for stacks, queues, linked lists, trees, graph traversals, sorting, hashing, and output logs.",
    pdfUrl: adsaLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created ADSAA Lab: ${adsaLabDoc._id}\n`);

  // =========================================================================
  // 3. 23A05303T Object-Oriented Programming JAVA
  // =========================================================================
  console.log("3. Processing Theory: 23A05303T Object-Oriented Programming JAVA");
  const javaDir = path.join(SOURCE_BASE, "23A05303T Object-Oriented Programming JAVA(3)");
  const javaFiles = [
    { file: "Unit1_Java_Basics_Notes.pdf", mod: "Unit 1: Introduction to OOP and Java Basics (Syntax, Control Statements)", dest: "23A05303T_Unit_1_OOP_Java.pdf" },
    { file: "Unit2_Classes_Objects_Methods_Notes.pdf", mod: "Unit 2: Classes, Objects, Methods and Constructors", dest: "23A05303T_Unit_2_OOP_Java.pdf" },
    { file: "Unit3_Arrays_Inheritance_Interfaces_Notes.pdf", mod: "Unit 3: Arrays, Inheritance, Polymorphism and Interfaces", dest: "23A05303T_Unit_3_OOP_Java.pdf" },
    { file: "Unit4_Packages_Exceptions_IO_Notes.pdf", mod: "Unit 4: Packages, Exception Handling and Stream I/O", dest: "23A05303T_Unit_4_OOP_Java.pdf" },
    { file: "Unit5_Strings_Threads_JDBC_JavaFX_Notes.pdf", mod: "Unit 5: String Handling, Multithreading, JDBC and JavaFX", dest: "23A05303T_Unit_5_OOP_Java.pdf" }
  ];
  const javaSources = [];
  const javaUrls = [];
  for (const f of javaFiles) {
    const src = path.join(javaDir, f.file);
    javaSources.push(src);
    javaUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const javaMergedUrl = await mergePdfs(javaSources, "23A05303T_Object_Oriented_Programming_Java_Complete_Notes.pdf");
  const javaDoc = await Note.create({
    title: "Object-Oriented Programming JAVA",
    branch: "AIML",
    semester: "2-1",
    regulation: "R23",
    subject: "Object-Oriented Programming JAVA",
    subjectCode: "23A05303T",
    description: "Official R23 Object-Oriented Programming through Java notes covering Java Fundamentals, Classes & Objects, Inheritance & Interfaces, Exception Handling, Packages & I/O Streams, Multithreading, JDBC Database Connectivity, and JavaFX GUI development.",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Java: ${javaDoc._id}\n`);

  // =========================================================================
  // 4. 23A05303P Object-Oriented Programming JAVA lab
  // =========================================================================
  console.log("4. Processing Lab: 23A05303P Object-Oriented Programming JAVA lab");
  const javaLabDir = path.join(SOURCE_BASE, "23A05303P Object-Oriented Programming JAVA lab(1.5)");
  const javaLabSrc = path.join(javaLabDir, "OOP_Java_Lab_Programs_and_Outputs.pdf");
  const javaLabUrl = copyFileSafe(javaLabSrc, "23A05303P_OOP_Java_Lab_Programs.pdf");
  copyFileSafe(javaLabSrc, "OOP_Java_Lab_Programs_and_Outputs.pdf");

  const javaLabDoc = await LabProgram.create({
    title: "Object-Oriented Programming JAVA Lab",
    branch: "AIML",
    semester: "2-1",
    regulation: "R23",
    subject: "Object-Oriented Programming JAVA Lab",
    subjectCode: "23A05303P",
    description: "Official R23 Java programming laboratory manual with complete experiments covering OOP concepts, inheritance, interfaces, exception handling, multithreading, file I/O, JDBC, and output results.",
    pdfUrl: javaLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created Java Lab: ${javaLabDoc._id}\n`);

  // =========================================================================
  // 5. 23A05304 python programming
  // =========================================================================
  console.log("5. Processing Theory: 23A05304 python programming");
  const pyDir = path.join(SOURCE_BASE, "23A05304 python programming(2)");
  const pyFiles = [
    { file: "Python_Unit_I_Basics_and_Control_Flow.pdf", mod: "Unit 1: Python Basics, Data Types and Control Flow", dest: "23A05304_Unit_1_Python_Programming.pdf" },
    { file: "Python_Unit_II_Functions_Strings_Lists.pdf", mod: "Unit 2: Functions, Strings and Lists", dest: "23A05304_Unit_2_Python_Programming.pdf" },
    { file: "Python_Unit_III_Dictionaries_Tuples_Sets.pdf", mod: "Unit 3: Dictionaries, Tuples and Sets", dest: "23A05304_Unit_3_Python_Programming.pdf" },
    { file: "Python_Unit_IV_Files_and_OOP.pdf", mod: "Unit 4: File Handling and Object-Oriented Programming in Python", dest: "23A05304_Unit_4_Python_Programming.pdf" },
    { file: "Python_Unit_V_Introduction_to_Data_Science.pdf", mod: "Unit 5: Introduction to Data Science with NumPy and Pandas", dest: "23A05304_Unit_5_Python_Programming.pdf" }
  ];
  const pySources = [];
  const pyUrls = [];
  for (const f of pyFiles) {
    const src = path.join(pyDir, f.file);
    pySources.push(src);
    pyUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const pyMergedUrl = await mergePdfs(pySources, "23A05304_Python_Programming_Complete_Notes.pdf");
  const pyDoc = await Note.create({
    title: "Python Programming",
    branch: "AIML",
    semester: "2-1",
    regulation: "R23",
    subject: "Python Programming",
    subjectCode: "23A05304",
    description: "Official R23 Python Programming course notes covering Python Basics, Control Structures, Functions & Modules, Compound Data Types (Lists, Tuples, Dictionaries, Sets), File I/O, OOP in Python, and Introduction to Data Science with NumPy and Pandas.",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Python: ${pyDoc._id}\n`);

  // =========================================================================
  // 6. 23A31301T Artificial Intelligence
  // =========================================================================
  console.log("6. Processing Theory: 23A31301T Artificial Intelligence");
  const aiDir = path.join(SOURCE_BASE, "23A31301T Artificial Intelligence(3)");
  const aiFiles = [
    { file: "AI_Unit1_Introduction_and_Intelligent_Agents.pdf", mod: "Unit 1: Introduction to AI and Intelligent Agents", dest: "23A31301T_Unit_1_Artificial_Intelligence.pdf" },
    { file: "AI_Unit2_Searching_and_Game_Playing.pdf", mod: "Unit 2: Problem Solving, Uninformed & Heuristic Search, Game Playing", dest: "23A31301T_Unit_2_Artificial_Intelligence.pdf" },
    { file: "AI_Unit3_Knowledge_Representation_and_Reasoning.pdf", mod: "Unit 3: Knowledge Representation, Ontological Engineering and Reasoning", dest: "23A31301T_Unit_3_Artificial_Intelligence.pdf" },
    { file: "AI_Unit4_Logic_and_Learning.pdf", mod: "Unit 4: First-Order Logic, Inference and Machine Learning Foundations", dest: "23A31301T_Unit_4_Artificial_Intelligence.pdf" },
    { file: "unit-5.pdf", mod: "Unit 5: Expert Systems, Natural Language Processing and AI Applications", dest: "23A31301T_Unit_5_Artificial_Intelligence.pdf" }
  ];
  const aiSources = [];
  const aiUrls = [];
  for (const f of aiFiles) {
    const src = path.join(aiDir, f.file);
    aiSources.push(src);
    aiUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const aiMergedUrl = await mergePdfs(aiSources, "23A31301T_Artificial_Intelligence_Complete_Notes.pdf");
  const aiDoc = await Note.create({
    title: "Artificial Intelligence",
    branch: "AIML",
    semester: "2-1",
    regulation: "R23",
    subject: "Artificial Intelligence",
    subjectCode: "23A31301T",
    description: "Official R23 Artificial Intelligence foundation notes covering Intelligent Agent Architectures, Problem Solving by Search (BFS, DFS, A*, Minimax, Alpha-Beta), Knowledge Representation, First-Order Logic & Inference, Learning Paradigms, and AI Applications.",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created AI: ${aiDoc._id}\n`);

  // Invalidate feed cache
  invalidateFeedCache();

  // Summary Verification
  console.log("==================================================");
  console.log("INGESTION SUMMARY FOR AIML 2-1");
  console.log("==================================================");
  const finalNotes = await Note.find({ branch: "AIML", semester: "2-1" });
  console.log(`Total AIML 2-1 Notes Ingested: ${finalNotes.length}`);
  finalNotes.forEach(n => {
    console.log(`  - [${n.subjectCode}] ${n.title} (Credits: ${n.credits})`);
    console.log(`    Main PDF: ${n.pdfUrl}`);
    console.log(`    Units: M1: ${Boolean(n.module1Pdf)}, M2: ${Boolean(n.module2Pdf)}, M3: ${Boolean(n.module3Pdf)}, M4: ${Boolean(n.module4Pdf)}, M5: ${Boolean(n.module5Pdf)}`);
  });

  const finalLabs = await LabProgram.find({ branch: "AIML", semester: "2-1" });
  console.log(`\nTotal AIML 2-1 Labs Ingested: ${finalLabs.length}`);
  finalLabs.forEach(l => {
    console.log(`  - [${l.subjectCode}] ${l.title}`);
    console.log(`    PDF: ${l.pdfUrl}`);
  });

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("INGESTION COMPLETED SUCCESSFULLY WITH 0 ERRORS!");
  console.log("==================================================");
}

uploadAiml2_1().catch(err => {
  console.error("FATAL ERROR IN INGESTION:", err);
  process.exit(1);
});
