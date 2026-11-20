const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes\\3-1";
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

async function uploadAiml3_1() {
  console.log("==================================================");
  console.log("STARTING AIML 3-1 INGESTION FROM USER DIRECTORY");
  console.log(`Source: ${SOURCE_BASE}`);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`User directory not found: ${SOURCE_BASE}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test"
  });
  console.log("Connected to MongoDB successfully!\n");

  // Clean any previous 3-1 AIML records to prevent duplication
  console.log("Cleaning any previous AIML 3-1 records...");
  const delNotes = await Note.deleteMany({ branch: "AIML", semester: "3-1" });
  const delLabs = await LabProgram.deleteMany({ branch: "AIML", semester: "3-1" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} existing notes, ${delLabs.deletedCount} existing labs.\n`);

  // =========================================================================
  // 1. 23A05503 Introduction to Quantum Technologies and Applications
  // =========================================================================
  console.log("1. Processing Theory: 23A05503 Introduction to Quantum Technologies and Applications");
  const qtDir = path.join(SOURCE_BASE, "23A05503 Introduction To Quantum Technologies And");
  const qtFiles = [
    { file: "Unit1_Intro_to_Quantum_Theory_and_Technologies.pdf", mod: "Unit 1: Introduction to Quantum Theory and Technologies", dest: "23A05503_Unit_1_Quantum_Technologies.pdf" },
    { file: "Unit2_Theoretical_Structure_of_Quantum_Information_Systems.pdf", mod: "Unit 2: Theoretical Structure of Quantum Information Systems", dest: "23A05503_Unit_2_Quantum_Technologies.pdf" },
    { file: "Unit3_Building_a_Quantum_Computer.pdf", mod: "Unit 3: Building a Quantum Computer", dest: "23A05503_Unit_3_Quantum_Technologies.pdf" },
    { file: "Unit4_Quantum_Communication_and_Computing.pdf", mod: "Unit 4: Quantum Communication and Computing", dest: "23A05503_Unit_4_Quantum_Technologies.pdf" },
    { file: "Unit5_Applications_Use_Cases_and_the_Quantum_Future.pdf", mod: "Unit 5: Applications, Use Cases and the Quantum Future", dest: "23A05503_Unit_5_Quantum_Technologies.pdf" }
  ];
  const qtSources = [];
  const qtUrls = [];
  for (const f of qtFiles) {
    const src = path.join(qtDir, f.file);
    qtSources.push(src);
    qtUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const qtMergedUrl = await mergePdfs(qtSources, "23A05503_Quantum_Technologies_Complete_Notes.pdf");
  const qtDoc = await Note.create({
    title: "Introduction to Quantum Technologies and Applications",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Introduction to Quantum Technologies and Applications",
    subjectCode: "23A05503",
    description: "Official R23 course notes covering Introduction to Quantum Theory & Technologies, Theoretical Structure of Quantum Information Systems, Building Quantum Computers, Quantum Communication & Computing, and Future Applications.",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Quantum Technologies: ${qtDoc._id}\n`);

  // =========================================================================
  // 2. 23A05504b Soft Computing
  // =========================================================================
  console.log("2. Processing Theory: 23A05504b Soft Computing");
  const scDir = path.join(SOURCE_BASE, "23A05504b Soft Computing");
  const scFiles = [
    { file: "SoftComputing_Unit1_Introduction.pdf", mod: "Unit 1: Introduction to Soft Computing and Neural Networks", dest: "23A05504b_Unit_1_Soft_Computing.pdf" },
    { file: "SoftComputing_Unit2_FuzzySystems.pdf", mod: "Unit 2: Fuzzy Logic and Fuzzy Systems", dest: "23A05504b_Unit_2_Soft_Computing.pdf" },
    { file: "SoftComputing_Unit3_FuzzyDecision_PSO.pdf", mod: "Unit 3: Fuzzy Decision Making and Particle Swarm Optimization", dest: "23A05504b_Unit_3_Soft_Computing.pdf" },
    { file: "SoftComputing_Unit4_GeneticAlgorithms.pdf", mod: "Unit 4: Genetic Algorithms and Evolutionary Computing", dest: "23A05504b_Unit_4_Soft_Computing.pdf" },
    { file: "SoftComputing_Unit5_RoughSets_Integration.pdf", mod: "Unit 5: Rough Sets and Hybrid Soft Computing Systems", dest: "23A05504b_Unit_5_Soft_Computing.pdf" }
  ];
  const scSources = [];
  const scUrls = [];
  for (const f of scFiles) {
    const src = path.join(scDir, f.file);
    scSources.push(src);
    scUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const scMergedUrl = await mergePdfs(scSources, "23A05504b_Soft_Computing_Complete_Notes.pdf");
  const scDoc = await Note.create({
    title: "Soft Computing",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Soft Computing",
    subjectCode: "23A05504b",
    description: "Complete lecture notes for Soft Computing covering Fundamentals of Neural Networks, Fuzzy Logic & Sets, Fuzzy Decision Making, Particle Swarm Optimization (PSO), Genetic Algorithms, and Rough Set Hybrid Systems.",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Soft Computing: ${scDoc._id}\n`);

  // =========================================================================
  // 3. 23A30503a Data Visualization
  // =========================================================================
  console.log("3. Processing Theory: 23A30503a Data Visualization");
  const dvDir = path.join(SOURCE_BASE, "23A30503a Data Visualization");
  const dvFiles = [
    { file: "Unit1_Introduction_and_Perception.pdf", mod: "Unit 1: Introduction to Data Visualization and Visual Perception", dest: "23A30503a_Unit_1_Data_Visualization.pdf" },
    { file: "Unit2_Categorical_and_Quantitative_Charts.pdf", mod: "Unit 2: Categorical and Quantitative Visualization Charts", dest: "23A30503a_Unit_2_Data_Visualization.pdf" },
    { file: "Unit3_Multidimensional_Temporal_Hierarchical.pdf", mod: "Unit 3: Multidimensional, Temporal and Hierarchical Data", dest: "23A30503a_Unit_3_Data_Visualization.pdf" },
    { file: "Unit4_Python_Visualization_and_Dashboards.pdf", mod: "Unit 4: Python Visualization Libraries and Interactive Dashboards", dest: "23A30503a_Unit_4_Data_Visualization.pdf" },
    { file: "Unit5_Storytelling_and_Ethical_Visualization.pdf", mod: "Unit 5: Visual Storytelling and Ethical Visualization Design", dest: "23A30503a_Unit_5_Data_Visualization.pdf" }
  ];
  const dvSources = [];
  const dvUrls = [];
  for (const f of dvFiles) {
    const src = path.join(dvDir, f.file);
    dvSources.push(src);
    dvUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dvMergedUrl = await mergePdfs(dvSources, "23A30503a_Data_Visualization_Complete_Notes.pdf");
  const dvDoc = await Note.create({
    title: "Data Visualization",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Data Visualization",
    subjectCode: "23A30503a",
    description: "JNTUA R23 Data Visualization complete study notes covering Visual Perception Principles, Categorical & Quantitative Charts, Multidimensional & Temporal Data, Matplotlib & Seaborn Dashboard Tools, and Visual Storytelling Ethics.",
    credits: "3",
    module1: dvFiles[0].mod,
    module2: dvFiles[1].mod,
    module3: dvFiles[2].mod,
    module4: dvFiles[3].mod,
    module5: dvFiles[4].mod,
    module1Pdf: dvUrls[0],
    module2Pdf: dvUrls[1],
    module3Pdf: dvUrls[2],
    module4Pdf: dvUrls[3],
    module5Pdf: dvUrls[4],
    pdfUrl: dvMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Data Visualization: ${dvDoc._id}\n`);

  // =========================================================================
  // 4. 23A30503c Exploratory Data Analysis with Python
  // =========================================================================
  console.log("4. Processing Theory: 23A30503c Exploratory Data Analysis with Python");
  const edaDir = path.join(SOURCE_BASE, "23A30503c Exploratory Data Analysis with Python");
  const edaFiles = [
    { file: "EDA_Unit1_Introduction_Notes.pdf", mod: "Unit 1: Introduction to Exploratory Data Analysis", dest: "23A30503c_Unit_1_EDA_Python.pdf" },
    { file: "EDA_Unit2_Data_Wrangling_Notes.pdf", mod: "Unit 2: Data Wrangling, Cleaning and Preparation with Pandas", dest: "23A30503c_Unit_2_EDA_Python.pdf" },
    { file: "EDA_Unit3_Univariate_Bivariate_Notes.pdf", mod: "Unit 3: Univariate and Bivariate Analysis", dest: "23A30503c_Unit_3_EDA_Python.pdf" },
    { file: "EDA_Unit4_Data_Visualization_Notes.pdf", mod: "Unit 4: Data Visualization Techniques in Python", dest: "23A30503c_Unit_4_EDA_Python.pdf" },
    { file: "EDA_Unit5_Case_Studies_Notes.pdf", mod: "Unit 5: Advanced EDA Case Studies and Real-World Applications", dest: "23A30503c_Unit_5_EDA_Python.pdf" }
  ];
  const edaSources = [];
  const edaUrls = [];
  for (const f of edaFiles) {
    const src = path.join(edaDir, f.file);
    edaSources.push(src);
    edaUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const edaMergedUrl = await mergePdfs(edaSources, "23A30503c_EDA_Python_Complete_Notes.pdf");
  const edaDoc = await Note.create({
    title: "Exploratory Data Analysis with Python",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Exploratory Data Analysis with Python",
    subjectCode: "23A30503c",
    description: "Complete lecture notes for Exploratory Data Analysis with Python covering EDA Foundations, Data Cleaning & Preprocessing with Pandas, Univariate & Bivariate Statistical Exploration, Visualization in Python, and Real-World Industry Case Studies.",
    credits: "3",
    module1: edaFiles[0].mod,
    module2: edaFiles[1].mod,
    module3: edaFiles[2].mod,
    module4: edaFiles[3].mod,
    module5: edaFiles[4].mod,
    module1Pdf: edaUrls[0],
    module2Pdf: edaUrls[1],
    module3Pdf: edaUrls[2],
    module4Pdf: edaUrls[3],
    module5Pdf: edaUrls[4],
    pdfUrl: edaMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created EDA Python: ${edaDoc._id}\n`);

  // =========================================================================
  // 5. 23A31501 Natural Language Processing
  // =========================================================================
  console.log("5. Processing Theory: 23A31501 Natural Language Processing");
  const nlpDir = path.join(SOURCE_BASE, "23A31501 Natural Language Processing");
  const nlpFiles = [
    { file: "NLP_Unit1_Introduction_to_Natural_Language.pdf", mod: "Unit 1: Introduction to Natural Language and Text Processing", dest: "23A31501_Unit_1_Natural_Language_Processing.pdf" },
    { file: "NLP_Unit2_Grammars_and_Parsing.pdf", mod: "Unit 2: Grammars, Parsing and Syntactic Analysis", dest: "23A31501_Unit_2_Natural_Language_Processing.pdf" },
    { file: "NLP_Unit3_Grammars_for_Natural_Language.pdf", mod: "Unit 3: Context-Free Grammars and Natural Language Grammar Models", dest: "23A31501_Unit_3_Natural_Language_Processing.pdf" },
    { file: "NLP_Unit4_Semantic_Interpretation_and_Language_Modelling.pdf", mod: "Unit 4: Semantic Interpretation and Language Modeling", dest: "23A31501_Unit_4_Natural_Language_Processing.pdf" },
    { file: "NLP_Unit5_MT_IR_and_Summarization.pdf", mod: "Unit 5: Machine Translation, Information Retrieval & Text Summarization", dest: "23A31501_Unit_5_Natural_Language_Processing.pdf" }
  ];
  const nlpSources = [];
  const nlpUrls = [];
  for (const f of nlpFiles) {
    const src = path.join(nlpDir, f.file);
    nlpSources.push(src);
    nlpUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const nlpMergedUrl = await mergePdfs(nlpSources, "23A31501_Natural_Language_Processing_Complete_Notes.pdf");
  const nlpDoc = await Note.create({
    title: "Natural Language Processing",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Natural Language Processing",
    subjectCode: "23A31501",
    description: "Official R23 NLP lecture notes covering Text Processing, Morphological Analysis, Grammars & Parsing, Syntactic & Semantic Analysis, N-gram Language Models, Word Embeddings, Machine Translation, and Text Summarization.",
    credits: "3",
    module1: nlpFiles[0].mod,
    module2: nlpFiles[1].mod,
    module3: nlpFiles[2].mod,
    module4: nlpFiles[3].mod,
    module5: nlpFiles[4].mod,
    module1Pdf: nlpUrls[0],
    module2Pdf: nlpUrls[1],
    module3Pdf: nlpUrls[2],
    module4Pdf: nlpUrls[3],
    module5Pdf: nlpUrls[4],
    pdfUrl: nlpMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Natural Language Processing: ${nlpDoc._id}\n`);

  // =========================================================================
  // 6. 23A39501 Applied Machine Learning
  // =========================================================================
  console.log("6. Processing Theory: 23A39501 Applied Machine Learning");
  const amlDir = path.join(SOURCE_BASE, "23A39501 Applied Machine Learning");
  const amlFiles = [
    { file: "Unit1_Fundamentals_of_Machine_Learning.pdf", mod: "Unit 1: Fundamentals of Machine Learning and Problem Formulation", dest: "23A39501_Unit_1_Applied_Machine_Learning.pdf" },
    { file: "Unit2_Supervised_Learning_Algorithms.pdf", mod: "Unit 2: Supervised Learning Algorithms and Regression Models", dest: "23A39501_Unit_2_Applied_Machine_Learning.pdf" },
    { file: "Unit3_Unsupervised_and_Ensemble_Methods.pdf", mod: "Unit 3: Unsupervised Learning, Clustering and Ensemble Methods", dest: "23A39501_Unit_3_Applied_Machine_Learning.pdf" },
    { file: "Unit4_Advanced_Learning_Paradigms.pdf", mod: "Unit 4: Advanced Learning Paradigms and Model Selection", dest: "23A39501_Unit_4_Applied_Machine_Learning.pdf" },
    { file: "Unit5_Applications_of_Machine_Learning.pdf", mod: "Unit 5: Machine Learning Applications and Case Studies", dest: "23A39501_Unit_5_Applied_Machine_Learning.pdf" }
  ];
  const amlSources = [];
  const amlUrls = [];
  for (const f of amlFiles) {
    const src = path.join(amlDir, f.file);
    amlSources.push(src);
    amlUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const amlMergedUrl = await mergePdfs(amlSources, "23A39501_Applied_Machine_Learning_Complete_Notes.pdf");
  const amlDoc = await Note.create({
    title: "Applied Machine Learning",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Applied Machine Learning",
    subjectCode: "23A39501",
    description: "Complete study notes for Applied Machine Learning covering Machine Learning Fundamentals, Supervised Classification & Regression Algorithms, Unsupervised Clustering, Ensemble Techniques (Boosting & Bagging), and Industry Applications.",
    credits: "3",
    module1: amlFiles[0].mod,
    module2: amlFiles[1].mod,
    module3: amlFiles[2].mod,
    module4: amlFiles[3].mod,
    module5: amlFiles[4].mod,
    module1Pdf: amlUrls[0],
    module2Pdf: amlUrls[1],
    module3Pdf: amlUrls[2],
    module4Pdf: amlUrls[3],
    module5Pdf: amlUrls[4],
    pdfUrl: amlMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Applied Machine Learning: ${amlDoc._id}\n`);

  // =========================================================================
  // 7. 23A39502 Data Wrangling & Preprocessing
  // =========================================================================
  console.log("7. Processing Theory: 23A39502 Data Wrangling & Preprocessing");
  const dwDir = path.join(SOURCE_BASE, "23A39502 Data Wrangling & Preprocessing");
  const dwFiles = [
    { file: "Unit1_Introduction_to_Data_Wrangling.pdf", mod: "Unit 1: Introduction to Data Wrangling and Foundations", dest: "23A39502_Unit_1_Data_Wrangling.pdf" },
    { file: "Unit2_Excel_PDFs_and_Databases.pdf", mod: "Unit 2: Ingesting Data from Excel, PDFs and Relational Databases", dest: "23A39502_Unit_2_Data_Wrangling.pdf" },
    { file: "Unit3_Data_Cleaning_and_Exploration.pdf", mod: "Unit 3: Data Cleaning, Missing Values and Outlier Detection", dest: "23A39502_Unit_3_Data_Wrangling.pdf" },
    { file: "Unit4_Data_Preprocessing_and_Reduction.pdf", mod: "Unit 4: Data Preprocessing, Normalization and Dimensionality Reduction", dest: "23A39502_Unit_4_Data_Wrangling.pdf" },
    { file: "Unit5_Data_Transformation_and_Web_Scraping.pdf", mod: "Unit 5: Data Transformation, Reshaping and Web Scraping", dest: "23A39502_Unit_5_Data_Wrangling.pdf" }
  ];
  const dwSources = [];
  const dwUrls = [];
  for (const f of dwFiles) {
    const src = path.join(dwDir, f.file);
    dwSources.push(src);
    dwUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dwMergedUrl = await mergePdfs(dwSources, "23A39502_Data_Wrangling_Complete_Notes.pdf");
  const dwDoc = await Note.create({
    title: "Data Wrangling & Preprocessing",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Data Wrangling & Preprocessing",
    subjectCode: "23A39502",
    description: "Comprehensive notes for Data Wrangling & Preprocessing covering Ingestion from multiple sources (Excel, PDF, SQL, APIs), Data Cleaning & Imputation, Preprocessing & Feature Scaling, Dimensionality Reduction, and Web Scraping pipelines.",
    credits: "3",
    module1: dwFiles[0].mod,
    module2: dwFiles[1].mod,
    module3: dwFiles[2].mod,
    module4: dwFiles[3].mod,
    module5: dwFiles[4].mod,
    module1Pdf: dwUrls[0],
    module2Pdf: dwUrls[1],
    module3Pdf: dwUrls[2],
    module4Pdf: dwUrls[3],
    module5Pdf: dwUrls[4],
    pdfUrl: dwMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Data Wrangling: ${dwDoc._id}\n`);

  // =========================================================================
  // 8. 23A39503 Introduction to Reinforcement Learning
  // =========================================================================
  console.log("8. Processing Theory: 23A39503 Introduction to Reinforcement learning");
  const rlDir = path.join(SOURCE_BASE, "23A39503 Introduction to Reinforcement learning");
  const rlFiles = [
    { file: "RL_Unit1_Introduction_to_Reinforcement_Learning.pdf", mod: "Unit 1: Introduction to Reinforcement Learning and MDPs", dest: "23A39503_Unit_1_Reinforcement_Learning.pdf" },
    { file: "RL_Unit2_Dynamic_Programming_and_Monte_Carlo.pdf", mod: "Unit 2: Dynamic Programming and Monte Carlo Methods", dest: "23A39503_Unit_2_Reinforcement_Learning.pdf" },
    { file: "RL_Unit3_Temporal_Difference_and_Eligibility_Traces.pdf", mod: "Unit 3: Temporal Difference Learning and Eligibility Traces", dest: "23A39503_Unit_3_Reinforcement_Learning.pdf" },
    { file: "RL_Unit4_Function_Approximation_and_Deep_RL.pdf", mod: "Unit 4: Value Function Approximation and Deep Q-Learning", dest: "23A39503_Unit_4_Reinforcement_Learning.pdf" },
    { file: "RL_Unit5_Policy_Gradient_and_Actor_Critic.pdf", mod: "Unit 5: Policy Gradient Methods and Actor-Critic Architectures", dest: "23A39503_Unit_5_Reinforcement_Learning.pdf" }
  ];
  const rlSources = [];
  const rlUrls = [];
  for (const f of rlFiles) {
    const src = path.join(rlDir, f.file);
    rlSources.push(src);
    rlUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const rlMergedUrl = await mergePdfs(rlSources, "23A39503_Reinforcement_Learning_Complete_Notes.pdf");
  const rlDoc = await Note.create({
    title: "Introduction to Reinforcement Learning",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Introduction to Reinforcement Learning",
    subjectCode: "23A39503",
    description: "Official R23 lecture notes for Reinforcement Learning covering Markov Decision Processes (MDPs), Dynamic Programming (Policy & Value Iteration), Monte Carlo Methods, Temporal Difference (SARSA & Q-Learning), Function Approximation, and Policy Gradients.",
    credits: "3",
    module1: rlFiles[0].mod,
    module2: rlFiles[1].mod,
    module3: rlFiles[2].mod,
    module4: rlFiles[3].mod,
    module5: rlFiles[4].mod,
    module1Pdf: rlUrls[0],
    module2Pdf: rlUrls[1],
    module3Pdf: rlUrls[2],
    module4Pdf: rlUrls[3],
    module5Pdf: rlUrls[4],
    pdfUrl: rlMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Reinforcement Learning: ${rlDoc._id}\n`);

  // =========================================================================
  // 9. 23A05506 Full Stack Development – II (Skill Course / Lab)
  // =========================================================================
  console.log("9. Processing Practical/Lab: 23A05506 Full Stack Development – II");
  const fsdDir = path.join(SOURCE_BASE, "23A05506 Full Stack Development – II");
  const fsdSrc = path.join(fsdDir, "FSD-II_Lab_Programs_and_Outputs_Complete.pdf");
  const fsdUrl = copyFileSafe(fsdSrc, "23A05506_Full_Stack_Development_II_Lab_Programs.pdf");
  copyFileSafe(fsdSrc, "FSD-II_Lab_Programs_and_Outputs_Complete.pdf");

  const fsdLabDoc = await LabProgram.create({
    title: "Full Stack Development – II",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Full Stack Development – II",
    subjectCode: "23A05506",
    description: "Official R23 Full Stack Development – II lab manual with source codes, backend REST API implementation, frontend components, and complete execution outputs.",
    pdfUrl: fsdUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created FSD-II Lab: ${fsdLabDoc._id}\n`);

  // Also create a Note entry for FSD-II so students can view under Notes or Labs
  const fsdNoteDoc = await Note.create({
    title: "Full Stack Development – II",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Full Stack Development – II",
    subjectCode: "23A05506",
    description: "Official R23 Full Stack Development – II skill advanced course study manual containing full stack application architecture, backend APIs, frontend integration, and execution guides.",
    credits: "2",
    module1: "Complete Full Stack Development II Manual & Practical Programs",
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
  console.log(`  [NOTE DB] Created FSD-II Note: ${fsdNoteDoc._id}\n`);

  // =========================================================================
  // 10. 23A39504 Machine Learning & NLP Lab
  // =========================================================================
  console.log("10. Processing Lab: 23A39504 Machine Learning & NLP Lab");
  const mlLabDir = path.join(SOURCE_BASE, "23A39504 Machine Learning& NLP Lab");
  const mlLabSrc = path.join(mlLabDir, "ML_and_NLP_Lab_Programs_Input_Output.pdf");
  const mlLabUrl = copyFileSafe(mlLabSrc, "23A39504_Machine_Learning_and_NLP_Lab_Programs.pdf");
  copyFileSafe(mlLabSrc, "ML_and_NLP_Lab_Programs_Input_Output.pdf");

  const mlLabDoc = await LabProgram.create({
    title: "Machine Learning & NLP Lab",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Machine Learning & NLP Lab",
    subjectCode: "23A39504",
    description: "Official R23 Machine Learning and Natural Language Processing practical laboratory manual with complete Python programs, sample inputs, and verification outputs.",
    pdfUrl: mlLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created ML & NLP Lab: ${mlLabDoc._id}\n`);

  // =========================================================================
  // 11. 23A39505 Data Wrangling Lab
  // =========================================================================
  console.log("11. Processing Lab: 23A39505 Data Wrangling Lab");
  const dwLabDir = path.join(SOURCE_BASE, "23A39505 Data Wrangling Lab");
  const dwLabSrc = path.join(dwLabDir, "Data_Wrangling_Lab_Programs_and_Outputs.pdf");
  const dwLabUrl = copyFileSafe(dwLabSrc, "23A39505_Data_Wrangling_Lab_Programs.pdf");
  copyFileSafe(dwLabSrc, "Data_Wrangling_Lab_Programs_and_Outputs.pdf");

  const dwLabDoc = await LabProgram.create({
    title: "Data Wrangling Lab",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Data Wrangling Lab",
    subjectCode: "23A39505",
    description: "Official R23 Data Wrangling Lab manual containing hands-on experiments for data ingestion, cleaning, transformation, feature scaling, and preprocessing pipelines in Python.",
    pdfUrl: dwLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created Data Wrangling Lab: ${dwLabDoc._id}\n`);

  // Invalidate feed cache
  invalidateFeedCache();

  // Summary Verification
  console.log("==================================================");
  console.log("INGESTION SUMMARY FOR AIML 3-1");
  console.log("==================================================");
  const finalNotes = await Note.find({ branch: "AIML", semester: "3-1" });
  console.log(`Total AIML 3-1 Notes Ingested: ${finalNotes.length}`);
  finalNotes.forEach(n => {
    console.log(`  - [${n.subjectCode}] ${n.title} (Credits: ${n.credits})`);
    console.log(`    Main PDF: ${n.pdfUrl}`);
    console.log(`    Units: M1: ${Boolean(n.module1Pdf)}, M2: ${Boolean(n.module2Pdf)}, M3: ${Boolean(n.module3Pdf)}, M4: ${Boolean(n.module4Pdf)}, M5: ${Boolean(n.module5Pdf)}`);
  });

  const finalLabs = await LabProgram.find({ branch: "AIML", semester: "3-1" });
  console.log(`\nTotal AIML 3-1 Labs Ingested: ${finalLabs.length}`);
  finalLabs.forEach(l => {
    console.log(`  - [${l.subjectCode}] ${l.title}`);
    console.log(`    PDF: ${l.pdfUrl}`);
  });

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("INGESTION COMPLETED SUCCESSFULLY WITH 0 ERRORS!");
  console.log("==================================================");
}

uploadAiml3_1().catch(err => {
  console.error("FATAL ERROR IN INGESTION:", err);
  process.exit(1);
});
