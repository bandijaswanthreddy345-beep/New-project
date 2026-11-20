const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes\\3-2";
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

async function uploadAiml3_2() {
  console.log("==================================================");
  console.log("STARTING AIML 3-2 INGESTION FROM USER DIRECTORY");
  console.log(`Source: ${SOURCE_BASE}`);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`User directory not found: ${SOURCE_BASE}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test"
  });
  console.log("Connected to MongoDB successfully!\n");

  // Clean any previous 3-2 AIML records to prevent duplication
  console.log("Cleaning any previous AIML 3-2 records...");
  const delNotes = await Note.deleteMany({ branch: "AIML", semester: "3-2" });
  const delLabs = await LabProgram.deleteMany({ branch: "AIML", semester: "3-2" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} existing notes, ${delLabs.deletedCount} existing labs.\n`);

  // =========================================================================
  // 1. 23A30602T Deep Learning
  // =========================================================================
  console.log("1. Processing Theory: 23A30602T Deep Learning");
  const dlDir = path.join(SOURCE_BASE, "23A30602T Deep Learning");
  const dlFiles = [
    { file: "DL_23A30602T_Unit1_Notes.pdf", mod: "Unit 1: Introduction to Deep Learning and Neural Networks", dest: "23A30602T_Unit_1_Deep_Learning.pdf" },
    { file: "DL_23A30602T_Unit2_Notes.pdf", mod: "Unit 2: Deep Feedforward Networks and Optimization", dest: "23A30602T_Unit_2_Deep_Learning.pdf" },
    { file: "DL_23A30602T_Unit3_Notes.pdf", mod: "Unit 3: Convolutional Neural Networks (CNNs)", dest: "23A30602T_Unit_3_Deep_Learning.pdf" },
    { file: "DL_23A30602T_Unit4_Notes.pdf", mod: "Unit 4: Recurrent Neural Networks (RNNs) and Sequence Modeling", dest: "23A30602T_Unit_4_Deep_Learning.pdf" },
    { file: "DL_23A30602T_Unit5_Notes.pdf", mod: "Unit 5: Autoencoders and Generative Models", dest: "23A30602T_Unit_5_Deep_Learning.pdf" }
  ];
  const dlSources = [];
  const dlUrls = [];
  for (const f of dlFiles) {
    const src = path.join(dlDir, f.file);
    dlSources.push(src);
    dlUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dlMergedUrl = await mergePdfs(dlSources, "23A30602T_Deep_Learning_Complete_Notes.pdf");
  const dlDoc = await Note.create({
    title: "Deep Learning",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Deep Learning",
    subjectCode: "23A30602T",
    description: "Complete lecture notes for Deep Learning covering Fundamentals of Neural Networks, Deep Feedforward Networks, Convolutional Neural Networks (CNNs), Recurrent Neural Networks (RNNs) & LSTMs, and Autoencoders & Generative Models.",
    credits: "3",
    module1: dlFiles[0].mod,
    module2: dlFiles[1].mod,
    module3: dlFiles[2].mod,
    module4: dlFiles[3].mod,
    module5: dlFiles[4].mod,
    module1Pdf: dlUrls[0],
    module2Pdf: dlUrls[1],
    module3Pdf: dlUrls[2],
    module4Pdf: dlUrls[3],
    module5Pdf: dlUrls[4],
    pdfUrl: dlMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Deep Learning: ${dlDoc._id}\n`);

  // =========================================================================
  // 2. 23A30603b Predictive Analytics
  // =========================================================================
  console.log("2. Processing Theory: 23A30603b Predictive Analytics");
  const paDir = path.join(SOURCE_BASE, "23A30603b Predictive Analytics");
  const paFiles = [
    { file: "Predictive_Analytics_23A30603b_Unit1_Notes.pdf", mod: "Unit 1: Overview of Predictive Analytics and Data Preparation", dest: "23A30603b_Unit_1_Predictive_Analytics.pdf" },
    { file: "Predictive_Analytics_23A30603b_Unit2_Notes.pdf", mod: "Unit 2: Linear and Logistic Regression Techniques", dest: "23A30603b_Unit_2_Predictive_Analytics.pdf" },
    { file: "Predictive_Analytics_23A30603b_Unit3_Notes.pdf", mod: "Unit 3: Decision Trees and Classification Models", dest: "23A30603b_Unit_3_Predictive_Analytics.pdf" },
    { file: "Predictive_Analytics_23A30603b_Unit4_Notes.pdf", mod: "Unit 4: Time Series Analysis and Forecasting", dest: "23A30603b_Unit_4_Predictive_Analytics.pdf" },
    { file: "Predictive_Analytics_23A30603b_Unit5_Notes.pdf", mod: "Unit 5: Model Evaluation, Validation and Deployment", dest: "23A30603b_Unit_5_Predictive_Analytics.pdf" }
  ];
  const paSources = [];
  const paUrls = [];
  for (const f of paFiles) {
    const src = path.join(paDir, f.file);
    paSources.push(src);
    paUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const paMergedUrl = await mergePdfs(paSources, "23A30603b_Predictive_Analytics_Complete_Notes.pdf");
  const paDoc = await Note.create({
    title: "Predictive Analytics",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Predictive Analytics",
    subjectCode: "23A30603b",
    description: "Comprehensive course notes for Predictive Analytics covering Predictive Modeling Fundamentals, Regression Techniques, Classification Models, Time Series Analysis & Forecasting, and Model Evaluation & Business Applications.",
    credits: "3",
    module1: paFiles[0].mod,
    module2: paFiles[1].mod,
    module3: paFiles[2].mod,
    module4: paFiles[3].mod,
    module5: paFiles[4].mod,
    module1Pdf: paUrls[0],
    module2Pdf: paUrls[1],
    module3Pdf: paUrls[2],
    module4Pdf: paUrls[3],
    module5Pdf: paUrls[4],
    pdfUrl: paMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Predictive Analytics: ${paDoc._id}\n`);

  // =========================================================================
  // 3. 23A30604a Computer Vision
  // =========================================================================
  console.log("3. Processing Theory: 23A30604a Computer Vision");
  const cvDir = path.join(SOURCE_BASE, "23A30604a Computer Vision");
  const cvFiles = [
    { file: "Computer_Vision_23A30604a_Unit_I.pdf", mod: "Unit 1: Image Formation, Processing and Filtering", dest: "23A30604a_Unit_1_Computer_Vision.pdf" },
    { file: "Computer_Vision_23A30604a_Unit_II.pdf", mod: "Unit 2: Feature Detection, Description and Matching", dest: "23A30604a_Unit_2_Computer_Vision.pdf" },
    { file: "Computer_Vision_23A30604a_Unit_III.pdf", mod: "Unit 3: Image Segmentation and Edge Detection", dest: "23A30604a_Unit_3_Computer_Vision.pdf" },
    { file: "Computer_Vision_23A30604a_Unit_IV.pdf", mod: "Unit 4: Object Recognition and Deep Learning for Vision", dest: "23A30604a_Unit_4_Computer_Vision.pdf" },
    { file: "Computer_Vision_23A30604a_Unit_V.pdf", mod: "Unit 5: Motion Analysis and 3D Vision", dest: "23A30604a_Unit_5_Computer_Vision.pdf" }
  ];
  const cvSources = [];
  const cvUrls = [];
  for (const f of cvFiles) {
    const src = path.join(cvDir, f.file);
    cvSources.push(src);
    cvUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const cvMergedUrl = await mergePdfs(cvSources, "23A30604a_Computer_Vision_Complete_Notes.pdf");
  const cvDoc = await Note.create({
    title: "Computer Vision",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Computer Vision",
    subjectCode: "23A30604a",
    description: "JNTUA R23 Computer Vision complete study notes covering Image Formation & Filtering, Feature Detection & Matching, Segmentation & Grouping, Object Recognition & Deep Vision, and Motion Analysis & Video Processing.",
    credits: "3",
    module1: cvFiles[0].mod,
    module2: cvFiles[1].mod,
    module3: cvFiles[2].mod,
    module4: cvFiles[3].mod,
    module5: cvFiles[4].mod,
    module1Pdf: cvUrls[0],
    module2Pdf: cvUrls[1],
    module3Pdf: cvUrls[2],
    module4Pdf: cvUrls[3],
    module5Pdf: cvUrls[4],
    pdfUrl: cvMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Computer Vision: ${cvDoc._id}\n`);

  // =========================================================================
  // 4. 23A30604c Social Network Analysis
  // =========================================================================
  console.log("4. Processing Theory: 23A30604c Social Network Analysis");
  const snaDir = path.join(SOURCE_BASE, "23A30604c Social Network Analysis");
  const snaFiles = [
    { file: "Unit1_SNA_23A30604c_Intro_Graph_Theory.pdf", mod: "Unit 1: Introduction to Graph Theory and Social Networks", dest: "23A30604c_Unit_1_Social_Network_Analysis.pdf" },
    { file: "Unit2_SNA_23A30604c_Structural_Properties.pdf", mod: "Unit 2: Structural Properties and Centrality Measures", dest: "23A30604c_Unit_2_Social_Network_Analysis.pdf" },
    { file: "Unit3_SNA_23A30604c_Community_Detection.pdf", mod: "Unit 3: Community Detection and Clustering in Networks", dest: "23A30604c_Unit_3_Social_Network_Analysis.pdf" },
    { file: "Unit4_SNA_23A30604c_Information_Diffusion.pdf", mod: "Unit 4: Information Diffusion and Cascade Models", dest: "23A30604c_Unit_4_Social_Network_Analysis.pdf" },
    { file: "Unit5_SNA_23A30604c_Tools_Applications_Ethics.pdf", mod: "Unit 5: Network Tools, Real-World Applications and Ethics", dest: "23A30604c_Unit_5_Social_Network_Analysis.pdf" }
  ];
  const snaSources = [];
  const snaUrls = [];
  for (const f of snaFiles) {
    const src = path.join(snaDir, f.file);
    snaSources.push(src);
    snaUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const snaMergedUrl = await mergePdfs(snaSources, "23A30604c_Social_Network_Analysis_Complete_Notes.pdf");
  const snaDoc = await Note.create({
    title: "Social Network Analysis",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Social Network Analysis",
    subjectCode: "23A30604c",
    description: "Complete lecture notes for Social Network Analysis covering Introduction to Graph Theory, Structural Properties of Networks, Community Detection Algorithms, Information Diffusion & Epidemics, and Tools, Applications & Network Ethics.",
    credits: "3",
    module1: snaFiles[0].mod,
    module2: snaFiles[1].mod,
    module3: snaFiles[2].mod,
    module4: snaFiles[3].mod,
    module5: snaFiles[4].mod,
    module1Pdf: snaUrls[0],
    module2Pdf: snaUrls[1],
    module3Pdf: snaUrls[2],
    module4Pdf: snaUrls[3],
    module5Pdf: snaUrls[4],
    pdfUrl: snaMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Social Network Analysis: ${snaDoc._id}\n`);

  // =========================================================================
  // 5. 23A31603a Graph Neural Networks
  // =========================================================================
  console.log("5. Processing Theory: 23A31603a Graph Neural Networks");
  const gnnDir = path.join(SOURCE_BASE, "23A31603a Graph Neural Networks");
  const gnnFiles = [
    { file: "GNN_Unit1_Fundamentals_of_Graph_Theory_23A31603a.pdf", mod: "Unit 1: Fundamentals of Graph Theory and Node Representation", dest: "23A31603a_Unit_1_Graph_Neural_Networks.pdf" },
    { file: "GNN_Unit2_Spectral_and_Spatial_Methods_23A31603a.pdf", mod: "Unit 2: Spectral and Spatial Methods in Graph Representation", dest: "23A31603a_Unit_2_Graph_Neural_Networks.pdf" },
    { file: "GNN_Unit3_GNN_Architectures_23A31603a.pdf", mod: "Unit 3: GNN Architectures - GCN, GAT and GraphSAGE", dest: "23A31603a_Unit_3_Graph_Neural_Networks.pdf" },
    { file: "GNN_Unit4_Applications_of_GNNs_23A31603a.pdf", mod: "Unit 4: Applications of Graph Neural Networks", dest: "23A31603a_Unit_4_Graph_Neural_Networks.pdf" },
    { file: "GNN_Unit5_Implementation_Optimization_Recent_Advances_23A31603a.pdf", mod: "Unit 5: Implementation, Optimization and Recent Advances in GNNs", dest: "23A31603a_Unit_5_Graph_Neural_Networks.pdf" }
  ];
  const gnnSources = [];
  const gnnUrls = [];
  for (const f of gnnFiles) {
    const src = path.join(gnnDir, f.file);
    gnnSources.push(src);
    gnnUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const gnnMergedUrl = await mergePdfs(gnnSources, "23A31603a_Graph_Neural_Networks_Complete_Notes.pdf");
  const gnnDoc = await Note.create({
    title: "Graph Neural Networks",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Graph Neural Networks",
    subjectCode: "23A31603a",
    description: "Official R23 Graph Neural Networks study notes covering Fundamentals of Graph Theory & Representation Learning, Spectral and Spatial Graph Convolutions, GNN Architectures (GCN, GAT, GraphSAGE), Applications in Knowledge Graphs & Bio-informatics, and Implementation & Scalability.",
    credits: "3",
    module1: gnnFiles[0].mod,
    module2: gnnFiles[1].mod,
    module3: gnnFiles[2].mod,
    module4: gnnFiles[3].mod,
    module5: gnnFiles[4].mod,
    module1Pdf: gnnUrls[0],
    module2Pdf: gnnUrls[1],
    module3Pdf: gnnUrls[2],
    module4Pdf: gnnUrls[3],
    module5Pdf: gnnUrls[4],
    pdfUrl: gnnMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Graph Neural Networks: ${gnnDoc._id}\n`);

  // =========================================================================
  // 6. 23A31702a Explainable AI & Model Interpretability
  // =========================================================================
  console.log("6. Processing Theory: 23A31702a Explainable AI & Model Interpretability");
  const xaiDir = path.join(SOURCE_BASE, "23A31702a Explainable AI & Model Interpretability 3");
  const xaiFiles = [
    { file: "Unit1_Foundations_of_Explainable_AI.pdf", mod: "Unit 1: Foundations of Explainable AI (XAI)", dest: "23A31702a_Unit_1_Explainable_AI.pdf" },
    { file: "Unit2_Model_Specific_Explainability.pdf", mod: "Unit 2: Model-Specific Explainability Techniques", dest: "23A31702a_Unit_2_Explainable_AI.pdf" },
    { file: "Unit3_Model_Agnostic_Explainability.pdf", mod: "Unit 3: Model-Agnostic Explainability - LIME and SHAP", dest: "23A31702a_Unit_3_Explainable_AI.pdf" },
    { file: "Unit4_Deep_Learning_Explainability.pdf", mod: "Unit 4: Deep Learning Explainability and Visual Attribution", dest: "23A31702a_Unit_4_Explainable_AI.pdf" },
    { file: "Unit5_Fairness_Bias_and_Tools_for_XAI.pdf", mod: "Unit 5: Fairness, Bias and Ethical Tools for XAI", dest: "23A31702a_Unit_5_Explainable_AI.pdf" }
  ];
  const xaiSources = [];
  const xaiUrls = [];
  for (const f of xaiFiles) {
    const src = path.join(xaiDir, f.file);
    xaiSources.push(src);
    xaiUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const xaiMergedUrl = await mergePdfs(xaiSources, "23A31702a_Explainable_AI_Complete_Notes.pdf");
  const xaiDoc = await Note.create({
    title: "Explainable AI & Model Interpretability",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Explainable AI & Model Interpretability",
    subjectCode: "23A31702a",
    description: "Comprehensive notes for Explainable AI & Model Interpretability covering Foundations of Explainable AI (XAI), Model-Specific Interpretability Techniques, Model-Agnostic Explainability (LIME, SHAP), Deep Learning Interpretability (CAM, Grad-CAM), and Fairness, Bias & Responsible AI Tools.",
    credits: "3",
    module1: xaiFiles[0].mod,
    module2: xaiFiles[1].mod,
    module3: xaiFiles[2].mod,
    module4: xaiFiles[3].mod,
    module5: xaiFiles[4].mod,
    module1Pdf: xaiUrls[0],
    module2Pdf: xaiUrls[1],
    module3Pdf: xaiUrls[2],
    module4Pdf: xaiUrls[3],
    module5Pdf: xaiUrls[4],
    pdfUrl: xaiMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Explainable AI: ${xaiDoc._id}\n`);

  // =========================================================================
  // 7. 23A32602 Recommender Systems
  // =========================================================================
  console.log("7. Processing Theory: 23A32602 Recommender Systems");
  const rsDir = path.join(SOURCE_BASE, "23A32602 Recommender Systems");
  const rsFiles = [
    { file: "Recommender_Systems_23A32602_Unit-1_Neighborhood-Based_CF.pdf", mod: "Unit 1: Neighborhood-Based Collaborative Filtering", dest: "23A32602_Unit_1_Recommender_Systems.pdf" },
    { file: "Recommender_Systems_23A32602_Unit-2_Model-Based_and_Content-Based.pdf", mod: "Unit 2: Model-Based and Content-Based Recommendation", dest: "23A32602_Unit_2_Recommender_Systems.pdf" },
    { file: "Recommender_Systems_23A32602_Unit-3_Knowledge-Based_and_Hybrid.pdf", mod: "Unit 3: Knowledge-Based and Hybrid Recommender Systems", dest: "23A32602_Unit_3_Recommender_Systems.pdf" },
    { file: "Recommender_Systems_23A32602_Unit-4_Evaluation_and_Context-Sensitive.pdf", mod: "Unit 4: Evaluation Metrics and Context-Sensitive Recommendations", dest: "23A32602_Unit_4_Recommender_Systems.pdf" },
    { file: "Recommender_Systems_23A32602_Unit-5_Time_and_Location-Sensitive.pdf", mod: "Unit 5: Time and Location-Sensitive Recommendations", dest: "23A32602_Unit_5_Recommender_Systems.pdf" }
  ];
  const rsSources = [];
  const rsUrls = [];
  for (const f of rsFiles) {
    const src = path.join(rsDir, f.file);
    rsSources.push(src);
    rsUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const rsMergedUrl = await mergePdfs(rsSources, "23A32602_Recommender_Systems_Complete_Notes.pdf");
  const rsDoc = await Note.create({
    title: "Recommender Systems",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Recommender Systems",
    subjectCode: "23A32602",
    description: "Complete lecture notes for Recommender Systems covering Neighborhood-Based Collaborative Filtering, Model-Based and Content-Based Filtering, Knowledge-Based & Hybrid Recommender Systems, Evaluation Metrics & Context-Sensitive Systems, and Time and Location-Sensitive Recommendations.",
    credits: "3",
    module1: rsFiles[0].mod,
    module2: rsFiles[1].mod,
    module3: rsFiles[2].mod,
    module4: rsFiles[3].mod,
    module5: rsFiles[4].mod,
    module1Pdf: rsUrls[0],
    module2Pdf: rsUrls[1],
    module3Pdf: rsUrls[2],
    module4Pdf: rsUrls[3],
    module5Pdf: rsUrls[4],
    pdfUrl: rsMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Recommender Systems: ${rsDoc._id}\n`);

  // =========================================================================
  // 8. 23A32603 Introduction to Quantum Computing
  // =========================================================================
  console.log("8. Processing Theory: 23A32603 Introduction to Quantum Computing");
  const qcDir = path.join(SOURCE_BASE, "23A32603 Introduction to Quantum Computing");
  const qcFiles = [
    { file: "Quantum_Computing_23A32603_Unit_I_Notes.pdf", mod: "Unit 1: Fundamental Concepts of Quantum Mechanics and Qubits", dest: "23A32603_Unit_1_Quantum_Computing.pdf" },
    { file: "Quantum_Computing_23A32603_Unit_II_Notes.pdf", mod: "Unit 2: Quantum Gates and Quantum Circuits", dest: "23A32603_Unit_2_Quantum_Computing.pdf" },
    { file: "Quantum_Computing_23A32603_Unit_III_Notes.pdf", mod: "Unit 3: Quantum Algorithms - Deutsch-Jozsa and Simon's Algorithm", dest: "23A32603_Unit_3_Quantum_Computing.pdf" },
    { file: "Quantum_Computing_23A32603_Unit_IV_Notes.pdf", mod: "Unit 4: Quantum Search and Factorization - Grover and Shor", dest: "23A32603_Unit_4_Quantum_Computing.pdf" },
    { file: "Quantum_Computing_23A32603_Unit_V_Notes.pdf", mod: "Unit 5: Quantum Error Correction and Hardware Architectures", dest: "23A32603_Unit_5_Quantum_Computing.pdf" }
  ];
  const qcSources = [];
  const qcUrls = [];
  for (const f of qcFiles) {
    const src = path.join(qcDir, f.file);
    qcSources.push(src);
    qcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const qcMergedUrl = await mergePdfs(qcSources, "23A32603_Quantum_Computing_Complete_Notes.pdf");
  const qcDoc = await Note.create({
    title: "Introduction to Quantum Computing",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Introduction to Quantum Computing",
    subjectCode: "23A32603",
    description: "Official R23 study notes for Introduction to Quantum Computing covering Fundamental Quantum Concepts & Qubits, Quantum Circuits & Basic Gates, Quantum Algorithms (Deutsch-Jozsa, Grover & Shor), Quantum Information & Entanglement, and Quantum Error Correction & Applications.",
    credits: "3",
    module1: qcFiles[0].mod,
    module2: qcFiles[1].mod,
    module3: qcFiles[2].mod,
    module4: qcFiles[3].mod,
    module5: qcFiles[4].mod,
    module1Pdf: qcUrls[0],
    module2Pdf: qcUrls[1],
    module3Pdf: qcUrls[2],
    module4Pdf: qcUrls[3],
    module5Pdf: qcUrls[4],
    pdfUrl: qcMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Quantum Computing: ${qcDoc._id}\n`);

  // =========================================================================
  // 9. 23A39601 Advanced Machine Learning
  // =========================================================================
  console.log("9. Processing Theory: 23A39601 Advanced Machine Learning");
  const amlDir = path.join(SOURCE_BASE, "23A39601 Advanced Machine Learning");
  const amlFiles = [
    { file: "AML_23A39601_Unit1_Ensemble_Learning_and_Model_Generalization.pdf", mod: "Unit 1: Ensemble Learning and Model Generalization", dest: "23A39601_Unit_1_Advanced_Machine_Learning.pdf" },
    { file: "AML_23A39601_Unit2_Kernel_Methods_and_SVM.pdf", mod: "Unit 2: Kernel Methods and Support Vector Machines", dest: "23A39601_Unit_2_Advanced_Machine_Learning.pdf" },
    { file: "AML_23A39601_Unit3_Probabilistic_Graphical_Models_and_Bayesian_Learning.pdf", mod: "Unit 3: Probabilistic Graphical Models and Bayesian Learning", dest: "23A39601_Unit_3_Advanced_Machine_Learning.pdf" },
    { file: "AML_23A39601_Unit4_Structured_Prediction_and_Unsupervised_Learning.pdf", mod: "Unit 4: Structured Prediction and Unsupervised Representation Learning", dest: "23A39601_Unit_4_Advanced_Machine_Learning.pdf" },
    { file: "AML_23A39601_Unit5_Optimization_and_Deep_Generative_Models.pdf", mod: "Unit 5: Advanced Optimization and Deep Generative Models", dest: "23A39601_Unit_5_Advanced_Machine_Learning.pdf" }
  ];
  const amlSources = [];
  const amlUrls = [];
  for (const f of amlFiles) {
    const src = path.join(amlDir, f.file);
    amlSources.push(src);
    amlUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const amlMergedUrl = await mergePdfs(amlSources, "23A39601_Advanced_Machine_Learning_Complete_Notes.pdf");
  const amlDoc = await Note.create({
    title: "Advanced Machine Learning",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Advanced Machine Learning",
    subjectCode: "23A39601",
    description: "Complete course notes for Advanced Machine Learning covering Ensemble Learning & Model Generalization, Kernel Methods and Support Vector Machines, Probabilistic Graphical Models & Bayesian Learning, Structured Prediction & Unsupervised Learning, and Optimization & Deep Generative Models.",
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
  console.log(`  [NOTE DB] Created Advanced Machine Learning: ${amlDoc._id}\n`);

  // =========================================================================
  // 10. 23A39602 AI for Edge Computing
  // =========================================================================
  console.log("10. Processing Theory: 23A39602 AI for Edge Computing");
  const edgeDir = path.join(SOURCE_BASE, "23A39602 AI for Edge Computing");
  const edgeFiles = [
    { file: "23A39602_AI_for_Edge_Computing_Unit_I.pdf", mod: "Unit 1: Introduction to Edge Computing and Edge AI Architectures", dest: "23A39602_Unit_1_AI_for_Edge_Computing.pdf" },
    { file: "23A39602_AI_for_Edge_Computing_Unit_II.pdf", mod: "Unit 2: Model Compression, Pruning and Quantization", dest: "23A39602_Unit_2_AI_for_Edge_Computing.pdf" },
    { file: "23A39602_AI_for_Edge_Computing_Unit_III.pdf", mod: "Unit 3: Lightweight Frameworks and Embedded Inference", dest: "23A39602_Unit_3_AI_for_Edge_Computing.pdf" },
    { file: "23A39602_AI_for_Edge_Computing_Unit_IV.pdf", mod: "Unit 4: Hardware Accelerators for Edge AI (TPU, NPU, GPU)", dest: "23A39602_Unit_4_AI_for_Edge_Computing.pdf" },
    { file: "23A39602_AI_for_Edge_Computing_Unit_V.pdf", mod: "Unit 5: Edge AI Applications, Security and Deployment", dest: "23A39602_Unit_5_AI_for_Edge_Computing.pdf" }
  ];
  const edgeSources = [];
  const edgeUrls = [];
  for (const f of edgeFiles) {
    const src = path.join(edgeDir, f.file);
    edgeSources.push(src);
    edgeUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const edgeMergedUrl = await mergePdfs(edgeSources, "23A39602_AI_for_Edge_Computing_Complete_Notes.pdf");
  const edgeDoc = await Note.create({
    title: "AI for Edge Computing",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "AI for Edge Computing",
    subjectCode: "23A39602",
    description: "Complete lecture notes for AI for Edge Computing covering Edge Computing Architectures, Model Compression & Quantization, Lightweight Deep Learning Frameworks (TensorFlow Lite, ONNX), Edge Inference Acceleration, and Real-Time IoT AI Applications.",
    credits: "3",
    module1: edgeFiles[0].mod,
    module2: edgeFiles[1].mod,
    module3: edgeFiles[2].mod,
    module4: edgeFiles[3].mod,
    module5: edgeFiles[4].mod,
    module1Pdf: edgeUrls[0],
    module2Pdf: edgeUrls[1],
    module3Pdf: edgeUrls[2],
    module4Pdf: edgeUrls[3],
    module5Pdf: edgeUrls[4],
    pdfUrl: edgeMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created AI for Edge Computing: ${edgeDoc._id}\n`);

  // =========================================================================
  // 11. 23A39603 Big Data
  // =========================================================================
  console.log("11. Processing Theory: 23A39603 Big Data");
  const bdDir = path.join(SOURCE_BASE, "23A39603 Big Data");
  const bdFiles = [
    { file: "Unit1_Intro_to_BigData_and_Hadoop.pdf", mod: "Unit 1: Introduction to Big Data and Hadoop Architecture", dest: "23A39603_Unit_1_Big_Data.pdf" },
    { file: "Unit2_MapReduce_and_Hadoop_Tools.pdf", mod: "Unit 2: MapReduce Framework and Hadoop Ecosystem Tools", dest: "23A39603_Unit_2_Big_Data.pdf" },
    { file: "Unit3_NoSQL_and_HBase.pdf", mod: "Unit 3: NoSQL Databases, HBase and Data Storage", dest: "23A39603_Unit_3_Big_Data.pdf" },
    { file: "Unit4_Apache_Spark_and_Analytics.pdf", mod: "Unit 4: Apache Spark and Real-Time Stream Analytics", dest: "23A39603_Unit_4_Big_Data.pdf" },
    { file: "Unit5_Applications_and_Case_Studies.pdf", mod: "Unit 5: Big Data Applications, Mining and Case Studies", dest: "23A39603_Unit_5_Big_Data.pdf" }
  ];
  const bdSources = [];
  const bdUrls = [];
  for (const f of bdFiles) {
    const src = path.join(bdDir, f.file);
    bdSources.push(src);
    bdUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const bdMergedUrl = await mergePdfs(bdSources, "23A39603_Big_Data_Complete_Notes.pdf");
  const bdDoc = await Note.create({
    title: "Big Data",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Big Data",
    subjectCode: "23A39603",
    description: "Comprehensive notes for Big Data Analytics covering Introduction to Big Data & Hadoop Architecture, MapReduce Programming & Hadoop Ecosystem Tools, NoSQL Databases & HBase, Apache Spark & Distributed Analytics, and Big Data Applications & Real-World Case Studies.",
    credits: "3",
    module1: bdFiles[0].mod,
    module2: bdFiles[1].mod,
    module3: bdFiles[2].mod,
    module4: bdFiles[3].mod,
    module5: bdFiles[4].mod,
    module1Pdf: bdUrls[0],
    module2Pdf: bdUrls[1],
    module3Pdf: bdUrls[2],
    module4Pdf: bdUrls[3],
    module5Pdf: bdUrls[4],
    pdfUrl: bdMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Big Data: ${bdDoc._id}\n`);

  // =========================================================================
  // 12. 23A39604 ML Model Optimization Lab
  // =========================================================================
  console.log("12. Processing Lab: 23A39604 ML Model Optimization Lab");
  const mlLabDir = path.join(SOURCE_BASE, "23A39604 ML Model Optimization Lab");
  const mlLabSrc = path.join(mlLabDir, "ML_Model_Optimization_Lab_23A39604_Complete_Notes.pdf");
  const mlLabUrl = copyFileSafe(mlLabSrc, "23A39604_ML_Model_Optimization_Lab_Complete_Notes.pdf");
  copyFileSafe(mlLabSrc, "ML_Model_Optimization_Lab_23A39604_Complete_Notes.pdf");

  const mlLabDoc = await LabProgram.create({
    title: "ML Model Optimization Lab",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "ML Model Optimization Lab",
    subjectCode: "23A39604",
    description: "Official R23 Machine Learning Model Optimization Lab manual containing practical programs, hyperparameter tuning, model pruning, quantization, knowledge distillation, and benchmarking experiments.",
    pdfUrl: mlLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created ML Model Optimization Lab: ${mlLabDoc._id}\n`);

  // =========================================================================
  // 13. 23A39605 Edge Computing Lab
  // =========================================================================
  console.log("13. Processing Lab: 23A39605 Edge Computing Lab");
  const edgeLabDir = path.join(SOURCE_BASE, "23A39605 Edge Computing Lab");
  const edgeLabSrc = path.join(edgeLabDir, "Edge_Computing_Lab_23A39605_Complete_Notes.pdf");
  const edgeLabUrl = copyFileSafe(edgeLabSrc, "23A39605_Edge_Computing_Lab_Complete_Notes.pdf");
  copyFileSafe(edgeLabSrc, "Edge_Computing_Lab_23A39605_Complete_Notes.pdf");

  const edgeLabDoc = await LabProgram.create({
    title: "Edge Computing Lab",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Edge Computing Lab",
    subjectCode: "23A39605",
    description: "Official R23 Edge Computing Lab manual containing practical experiments, deployment workflows on Raspberry Pi/Jetson Nano, TensorFlow Lite model conversion, and real-time edge inference pipelines.",
    pdfUrl: edgeLabUrl,
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [LAB DB] Created Edge Computing Lab: ${edgeLabDoc._id}\n`);

  // Invalidate feed cache
  invalidateFeedCache();

  // Summary Verification
  console.log("==================================================");
  console.log("INGESTION SUMMARY FOR AIML 3-2");
  console.log("==================================================");
  const finalNotes = await Note.find({ branch: "AIML", semester: "3-2" });
  console.log(`Total AIML 3-2 Notes Ingested: ${finalNotes.length}`);
  finalNotes.forEach(n => {
    console.log(`  - [${n.subjectCode}] ${n.title} (Credits: ${n.credits})`);
    console.log(`    Main PDF: ${n.pdfUrl}`);
    console.log(`    Units: M1: ${Boolean(n.module1Pdf)}, M2: ${Boolean(n.module2Pdf)}, M3: ${Boolean(n.module3Pdf)}, M4: ${Boolean(n.module4Pdf)}, M5: ${Boolean(n.module5Pdf)}`);
  });

  const finalLabs = await LabProgram.find({ branch: "AIML", semester: "3-2" });
  console.log(`\nTotal AIML 3-2 Labs Ingested: ${finalLabs.length}`);
  finalLabs.forEach(l => {
    console.log(`  - [${l.subjectCode}] ${l.title}`);
    console.log(`    PDF: ${l.pdfUrl}`);
  });

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("INGESTION COMPLETED SUCCESSFULLY WITH 0 ERRORS!");
  console.log("==================================================");
}

uploadAiml3_2().catch(err => {
  console.error("FATAL ERROR IN INGESTION:", err);
  process.exit(1);
});
