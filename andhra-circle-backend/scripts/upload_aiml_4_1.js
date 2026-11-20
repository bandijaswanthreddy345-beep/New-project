const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/Note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes\\4-1";
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

async function uploadAiml4_1() {
  console.log("==================================================");
  console.log("STARTING AIML 4-1 INGESTION FROM USER DIRECTORY");
  console.log(`Source: ${SOURCE_BASE}`);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`User directory not found: ${SOURCE_BASE}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "test"
  });
  console.log("Connected to MongoDB successfully!\n");

  // Clean any previous 4-1 AIML records to prevent duplication
  console.log("Cleaning any previous AIML 4-1 records...");
  const delNotes = await Note.deleteMany({ branch: "AIML", semester: "4-1" });
  const delLabs = await LabProgram.deleteMany({ branch: "AIML", semester: "4-1" });
  console.log(`  [CLEANUP] Deleted ${delNotes.deletedCount} existing notes, ${delLabs.deletedCount} existing labs.\n`);

  // =========================================================================
  // 1. 23A30702b Human Computer Interaction
  // =========================================================================
  console.log("1. Processing Theory: 23A30702b Human Computer Interaction");
  const hciDir = path.join(SOURCE_BASE, "23A30702b  Human Computer Interaction");
  const hciFiles = [
    { file: "HCI_Unit_1_Introduction_and_Human_Factors.pdf", mod: "Unit 1: Introduction to HCI & Human Factors", dest: "23A30702b_Unit_1_HCI.pdf" },
    { file: "HCI_Unit_2_Design_Process_and_UCD.pdf", mod: "Unit 2: Design Process & User-Centered Design (UCD)", dest: "23A30702b_Unit_2_HCI.pdf" },
    { file: "HCI_Unit_3_Evaluation_and_Usability_Testing.pdf", mod: "Unit 3: Evaluation Techniques & Usability Testing", dest: "23A30702b_Unit_3_HCI.pdf" },
    { file: "HCI_Unit_4_Interface_Technologies_and_Prototyping.pdf", mod: "Unit 4: Interface Technologies & Prototyping", dest: "23A30702b_Unit_4_HCI.pdf" },
    { file: "HCI_Unit_5_Advanced_Topics_and_Future_Trends.pdf", mod: "Unit 5: Advanced Interaction Paradigms & Future Trends", dest: "23A30702b_Unit_5_HCI.pdf" }
  ];
  const hciSources = [];
  const hciUrls = [];
  for (const f of hciFiles) {
    const src = path.join(hciDir, f.file);
    hciSources.push(src);
    hciUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const hciMergedUrl = await mergePdfs(hciSources, "23A30702b_Human_Computer_Interaction_Complete_Notes.pdf");
  const hciDoc = await Note.create({
    title: "Human Computer Interaction",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Human Computer Interaction",
    subjectCode: "23A30702b",
    description: "Official R23 Human Computer Interaction complete study notes covering Human Factors, Cognitive Principles, User-Centered Design (UCD), Heuristic Evaluation, Usability Testing, UI Prototyping, and Multimodal Interfaces.",
    credits: "3",
    module1: hciFiles[0].mod,
    module2: hciFiles[1].mod,
    module3: hciFiles[2].mod,
    module4: hciFiles[3].mod,
    module5: hciFiles[4].mod,
    module1Pdf: hciUrls[0],
    module2Pdf: hciUrls[1],
    module3Pdf: hciUrls[2],
    module4Pdf: hciUrls[3],
    module5Pdf: hciUrls[4],
    pdfUrl: hciMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created HCI: ${hciDoc._id}\n`);

  // =========================================================================
  // 2. 23A30703b Drone Technology
  // =========================================================================
  console.log("2. Processing Theory: 23A30703b Drone Technology");
  const dtDir = path.join(SOURCE_BASE, "23A30703b .Drone Technology");
  const dtFiles = [
    { file: "Unit1_Introduction_to_Drone_Systems.pdf", mod: "Unit 1: Introduction to Drone Systems & UAV Classifications", dest: "23A30703b_Unit_1_Drone_Technology.pdf" },
    { file: "Unit2_Drone_Hardware_and_Aerodynamics.pdf", mod: "Unit 2: Drone Hardware, Propulsion & Aerodynamics", dest: "23A30703b_Unit_2_Drone_Technology.pdf" },
    { file: "Unit3_Drone_Communication_and_Control_System.pdf", mod: "Unit 3: Drone Communication, Telemetry & Autopilot Flight Control", dest: "23A30703b_Unit_3_Drone_Technology.pdf" },
    { file: "Unit4_Drone_Applications_and_Emerging_Use_Cases.pdf", mod: "Unit 4: Drone Applications in Agriculture, Surveillance & Logistics", dest: "23A30703b_Unit_4_Drone_Technology.pdf" },
    { file: "Unit5_Safety_Regulations_and_Future_Trends.pdf", mod: "Unit 5: Safety Regulations, Airspace Management & Future Drone Tech", dest: "23A30703b_Unit_5_Drone_Technology.pdf" }
  ];
  const dtSources = [];
  const dtUrls = [];
  for (const f of dtFiles) {
    const src = path.join(dtDir, f.file);
    dtSources.push(src);
    dtUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const dtMergedUrl = await mergePdfs(dtSources, "23A30703b_Drone_Technology_Complete_Notes.pdf");
  const dtDoc = await Note.create({
    title: "Drone Technology",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Drone Technology",
    subjectCode: "23A30703b",
    description: "Official R23 Drone Technology lecture notes covering Unmanned Aerial Vehicle (UAV) systems, Aerodynamic principles, Propulsion & Flight Dynamics, Flight Controllers & Sensor Fusion, Telemetry, Surveillance applications, and DGCA Drone Regulations.",
    credits: "3",
    module1: dtFiles[0].mod,
    module2: dtFiles[1].mod,
    module3: dtFiles[2].mod,
    module4: dtFiles[3].mod,
    module5: dtFiles[4].mod,
    module1Pdf: dtUrls[0],
    module2Pdf: dtUrls[1],
    module3Pdf: dtUrls[2],
    module4Pdf: dtUrls[3],
    module5Pdf: dtUrls[4],
    pdfUrl: dtMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Drone Tech: ${dtDoc._id}\n`);

  // =========================================================================
  // 3. 23A30703c Robotics
  // =========================================================================
  console.log("3. Processing Theory: 23A30703c Robotics");
  const robDir = path.join(SOURCE_BASE, "23A30703c Robotics");
  const robFiles = [
    { file: "Unit1_Introduction_to_Robotics.pdf", mod: "Unit 1: Introduction to Robotics & Anatomy", dest: "23A30703c_Unit_1_Robotics.pdf" },
    { file: "Unit2_Kinematics_and_Dynamics_of_Robots.pdf", mod: "Unit 2: Kinematics and Dynamics of Manipulators (DH Parameters)", dest: "23A30703c_Unit_2_Robotics.pdf" },
    { file: "Unit3_Sensors_Perception_and_Localization.pdf", mod: "Unit 3: Robotic Sensors, Vision Perception & Localization", dest: "23A30703c_Unit_3_Robotics.pdf" },
    { file: "Unit4_Robotic_Motion_Planning_and_Control.pdf", mod: "Unit 4: Robotic Motion Planning, Trajectory Generation & Feedback Control", dest: "23A30703c_Unit_4_Robotics.pdf" },
    { file: "Unit5_AI_and_Applications_in_Robotics.pdf", mod: "Unit 5: Artificial Intelligence Integration & Industrial Robot Applications", dest: "23A30703c_Unit_5_Robotics.pdf" }
  ];
  const robSources = [];
  const robUrls = [];
  for (const f of robFiles) {
    const src = path.join(robDir, f.file);
    robSources.push(src);
    robUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const robMergedUrl = await mergePdfs(robSources, "23A30703c_Robotics_Complete_Notes.pdf");
  const robDoc = await Note.create({
    title: "Robotics",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Robotics",
    subjectCode: "23A30703c",
    description: "Comprehensive R23 Robotics notes covering Manipulator Kinematics (Forward & Inverse, Denavit-Hartenberg parameters), Robot Dynamics, Sensor Integration & Vision, Path Planning Algorithms, Actuation & Control, and Intelligent Robotic Applications.",
    credits: "3",
    module1: robFiles[0].mod,
    module2: robFiles[1].mod,
    module3: robFiles[2].mod,
    module4: robFiles[3].mod,
    module5: robFiles[4].mod,
    module1Pdf: robUrls[0],
    module2Pdf: robUrls[1],
    module3Pdf: robUrls[2],
    module4Pdf: robUrls[3],
    module5Pdf: robUrls[4],
    pdfUrl: robMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Robotics: ${robDoc._id}\n`);

  // =========================================================================
  // 4. 23A31701 Generative AI & Prompt Engineering
  // =========================================================================
  console.log("4. Processing Theory: 23A31701 Generative AI & Prompt Engineering");
  const genaiDir = path.join(SOURCE_BASE, "23A31701 Generative AI & Prompt Engineering");
  const genaiFiles = [
    { file: "GenAI_Unit_1_Introduction.pdf", mod: "Unit 1: Introduction to Generative AI & Foundational Architectures", dest: "23A31701_Unit_1_GenAI_Prompt_Eng.pdf" },
    { file: "GenAI_Unit_2_Prompt_Engineering_Fundamentals.pdf", mod: "Unit 2: Prompt Engineering Fundamentals & Prompt Design Patterns", dest: "23A31701_Unit_2_GenAI_Prompt_Eng.pdf" },
    { file: "GenAI_Unit_3_Generative_Models_NLP.pdf", mod: "Unit 3: Generative Models for NLP (Transformers, LLMs, Attention)", dest: "23A31701_Unit_3_GenAI_Prompt_Eng.pdf" },
    { file: "GenAI_Unit_4_Advanced_Prompting_Tools.pdf", mod: "Unit 4: Advanced Prompting (Few-Shot, CoT, RAG, LangChain, Agents)", dest: "23A31701_Unit_4_GenAI_Prompt_Eng.pdf" },
    { file: "GenAI_Unit_5_Ethics_Risks_Applications.pdf", mod: "Unit 5: Generative AI Ethics, Safety, Hallucination Mitigation & Real-World Applications", dest: "23A31701_Unit_5_GenAI_Prompt_Eng.pdf" }
  ];
  const genaiSources = [];
  const genaiUrls = [];
  for (const f of genaiFiles) {
    const src = path.join(genaiDir, f.file);
    genaiSources.push(src);
    genaiUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const genaiMergedUrl = await mergePdfs(genaiSources, "23A31701_Generative_AI_and_Prompt_Engineering_Complete_Notes.pdf");
  const genaiDoc = await Note.create({
    title: "Generative AI & Prompt Engineering",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Generative AI & Prompt Engineering",
    subjectCode: "23A31701",
    description: "Official R23 Generative AI & Prompt Engineering course notes covering Foundation Models, Transformers, In-Context Learning, Zero-Shot/Few-Shot & Chain-of-Thought prompting, Retrieval-Augmented Generation (RAG), Autonomous Agent Workflows, and Generative AI Safety.",
    credits: "3",
    module1: genaiFiles[0].mod,
    module2: genaiFiles[1].mod,
    module3: genaiFiles[2].mod,
    module4: genaiFiles[3].mod,
    module5: genaiFiles[4].mod,
    module1Pdf: genaiUrls[0],
    module2Pdf: genaiUrls[1],
    module3Pdf: genaiUrls[2],
    module4Pdf: genaiUrls[3],
    module5Pdf: genaiUrls[4],
    pdfUrl: genaiMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created GenAI: ${genaiDoc._id}\n`);

  // =========================================================================
  // 5. 23A31702b AI for Robotics
  // =========================================================================
  console.log("5. Processing Theory: 23A31702b AI for Robotics");
  const airDir = path.join(SOURCE_BASE, "23A31702b AI for Robotics");
  const airFiles = [
    { file: "AI_Robotics_Unit_1_Fundamentals.pdf", mod: "Unit 1: Fundamentals of AI in Robotics", dest: "23A31702b_Unit_1_AI_for_Robotics.pdf" },
    { file: "AI_Robotics_Unit_2_Perception_Sensor_Fusion.pdf", mod: "Unit 2: Robot Perception, Computer Vision & Sensor Fusion", dest: "23A31702b_Unit_2_AI_for_Robotics.pdf" },
    { file: "AI_Robotics_Unit_3_Motion_Planning_Navigation.pdf", mod: "Unit 3: Autonomous Navigation, SLAM & Motion Planning", dest: "23A31702b_Unit_3_AI_for_Robotics.pdf" },
    { file: "AI_Robotics_Unit_4_AI_Techniques_Robotics.pdf", mod: "Unit 4: Deep Learning & Reinforcement Learning in Robotics", dest: "23A31702b_Unit_4_AI_for_Robotics.pdf" },
    { file: "AI_Robotics_Unit_5_Applications_Ethics_Future.pdf", mod: "Unit 5: Human-Robot Collaboration, Ethics & Real-World Deployments", dest: "23A31702b_Unit_5_AI_for_Robotics.pdf" }
  ];
  const airSources = [];
  const airUrls = [];
  for (const f of airFiles) {
    const src = path.join(airDir, f.file);
    airSources.push(src);
    airUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const airMergedUrl = await mergePdfs(airSources, "23A31702b_AI_for_Robotics_Complete_Notes.pdf");
  const airDoc = await Note.create({
    title: "AI for Robotics",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "AI for Robotics",
    subjectCode: "23A31702b",
    description: "Official R23 AI for Robotics study notes covering Robotic Perception with Deep Vision, Sensor Fusion (LiDAR, Radar, Cameras), Simultaneous Localization and Mapping (SLAM), Robot Reinforcement Learning, and Human-Robot Interaction (HRI).",
    credits: "3",
    module1: airFiles[0].mod,
    module2: airFiles[1].mod,
    module3: airFiles[2].mod,
    module4: airFiles[3].mod,
    module5: airFiles[4].mod,
    module1Pdf: airUrls[0],
    module2Pdf: airUrls[1],
    module3Pdf: airUrls[2],
    module4Pdf: airUrls[3],
    module5Pdf: airUrls[4],
    pdfUrl: airMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created AI for Robotics: ${airDoc._id}\n`);

  // =========================================================================
  // 6. 23A31702c AI in Cybersecurity
  // =========================================================================
  console.log("6. Processing Theory: 23A31702c AI in Cybersecurity");
  const aicsDir = path.join(SOURCE_BASE, "23A31702c AI in Cybersecurity");
  const aicsFiles = [
    { file: "AI_Cybersecurity_Unit_1_Introduction.pdf", mod: "Unit 1: Introduction to AI in Cybersecurity & Threat Landscape", dest: "23A31702c_Unit_1_AI_Cybersecurity.pdf" },
    { file: "AI_Cybersecurity_Unit_2_ML_Threat_Detection.pdf", mod: "Unit 2: Machine Learning for Threat Detection & Intrusion Detection (IDS/IPS)", dest: "23A31702c_Unit_2_AI_Cybersecurity.pdf" },
    { file: "AI_Cybersecurity_Unit_3_Deep_Learning.pdf", mod: "Unit 3: Deep Learning for Malware Analysis & Anomaly Detection", dest: "23A31702c_Unit_3_AI_Cybersecurity.pdf" },
    { file: "AI_Cybersecurity_Unit_4_Security_Domains.pdf", mod: "Unit 4: AI in Network Security, Endpoint Protection & Phishing Detection", dest: "23A31702c_Unit_4_AI_Cybersecurity.pdf" },
    { file: "AI_Cybersecurity_Unit_5_Challenges_Ethics_Future.pdf", mod: "Unit 5: Adversarial Attacks against AI, Privacy & Future Defense Systems", dest: "23A31702c_Unit_5_AI_Cybersecurity.pdf" }
  ];
  const aicsSources = [];
  const aicsUrls = [];
  for (const f of aicsFiles) {
    const src = path.join(aicsDir, f.file);
    aicsSources.push(src);
    aicsUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const aicsMergedUrl = await mergePdfs(aicsSources, "23A31702c_AI_in_Cybersecurity_Complete_Notes.pdf");
  const aicsDoc = await Note.create({
    title: "AI in Cybersecurity",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "AI in Cybersecurity",
    subjectCode: "23A31702c",
    description: "Official R23 AI in Cybersecurity complete study notes covering AI-driven Threat Intelligence, Machine Learning Intrusion Detection Systems (NIDS/HIDS), Automated Malware Classification, Phishing Detection, Adversarial AI Attacks & Defenses, and Zero Trust AI Architecture.",
    credits: "3",
    module1: aicsFiles[0].mod,
    module2: aicsFiles[1].mod,
    module3: aicsFiles[2].mod,
    module4: aicsFiles[3].mod,
    module5: aicsFiles[4].mod,
    module1Pdf: aicsUrls[0],
    module2Pdf: aicsUrls[1],
    module3Pdf: aicsUrls[2],
    module4Pdf: aicsUrls[3],
    module5Pdf: aicsUrls[4],
    pdfUrl: aicsMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created AI in Cybersecurity: ${aicsDoc._id}\n`);

  // =========================================================================
  // 7. 23A31703c Healthcare AI
  // =========================================================================
  console.log("7. Processing Theory: 23A31703c Healthcare AI");
  const hcDir = path.join(SOURCE_BASE, "23A31703c Healthcare AI");
  const hcFiles = [
    { file: "Unit_I_Introduction_to_AI_in_Healthcare.pdf", mod: "Unit 1: Introduction to AI in Healthcare & Clinical Workflows", dest: "23A31703c_Unit_1_Healthcare_AI.pdf" },
    { file: "Unit_II_Medical_Data_Preprocessing_and_Feature_Engineering.pdf", mod: "Unit 2: Medical Data Preprocessing, EHRs & Feature Engineering", dest: "23A31703c_Unit_2_Healthcare_AI.pdf" },
    { file: "Unit_III_Machine_Learning_and_Deep_Learning_in_Healthcare.pdf", mod: "Unit 3: Machine Learning & Deep Learning for Medical Imaging and Diagnostics", dest: "23A31703c_Unit_3_Healthcare_AI.pdf" },
    { file: "Unit_IV_Specialized_Healthcare_AI_Applications.pdf", mod: "Unit 4: Specialized AI Applications in Genomics, Drug Discovery & Disease Prediction", dest: "23A31703c_Unit_4_Healthcare_AI.pdf" },
    { file: "Unit_V_Ethics_Regulation_and_Future_Directions.pdf", mod: "Unit 5: Healthcare AI Ethics, HIPAA Compliance, FDA Regulations & Explainability", dest: "23A31703c_Unit_5_Healthcare_AI.pdf" }
  ];
  const hcSources = [];
  const hcUrls = [];
  for (const f of hcFiles) {
    const src = path.join(hcDir, f.file);
    hcSources.push(src);
    hcUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const hcMergedUrl = await mergePdfs(hcSources, "23A31703c_Healthcare_AI_Complete_Notes.pdf");
  const hcDoc = await Note.create({
    title: "Healthcare AI",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Healthcare AI",
    subjectCode: "23A31703c",
    description: "Official R23 Healthcare AI course notes covering Electronic Health Records (EHR) analytics, Medical Image Processing (CT, MRI, X-ray via CNNs), Clinical Predictive Modeling, AI in Pharmacogenomics & Drug Design, HIPAA compliance, and Medical Ethics.",
    credits: "3",
    module1: hcFiles[0].mod,
    module2: hcFiles[1].mod,
    module3: hcFiles[2].mod,
    module4: hcFiles[3].mod,
    module5: hcFiles[4].mod,
    module1Pdf: hcUrls[0],
    module2Pdf: hcUrls[1],
    module3Pdf: hcUrls[2],
    module4Pdf: hcUrls[3],
    module5Pdf: hcUrls[4],
    pdfUrl: hcMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Healthcare AI: ${hcDoc._id}\n`);

  // =========================================================================
  // 8. 23A39701 AI for Social Good
  // =========================================================================
  console.log("8. Processing Theory: 23A39701 AI for Social Good");
  const aisgDir = path.join(SOURCE_BASE, "23A39701 AI for Social Good");
  const aisgFiles = [
    { file: "Unit1_Foundations_of_AI_for_Social_Good.pdf", mod: "Unit 1: Foundations of AI for Social Good & UN Sustainable Development Goals", dest: "23A39701_Unit_1_AI_for_Social_Good.pdf" },
    { file: "Unit2_AI_in_Healthcare_and_Epidemiology.pdf", mod: "Unit 2: AI in Public Healthcare, Epidemiology & Resource Allocation", dest: "23A39701_Unit_2_AI_for_Social_Good.pdf" },
    { file: "Unit3_AI_for_Environment_and_Disaster_Management.pdf", mod: "Unit 3: AI for Climate Action, Environmental Sustainability & Disaster Management", dest: "23A39701_Unit_3_AI_for_Social_Good.pdf" },
    { file: "Unit4_Ethics_Fairness_and_Accountability_in_AI.pdf", mod: "Unit 4: Algorithmic Fairness, Bias Mitigation & Ethical AI Governance", dest: "23A39701_Unit_4_AI_for_Social_Good.pdf" },
    { file: "Unit5_Building_AI_Projects_for_Social_Impact.pdf", mod: "Unit 5: Designing, Deploying & Evaluating AI Systems for Social Impact", dest: "23A39701_Unit_5_AI_for_Social_Good.pdf" }
  ];
  const aisgSources = [];
  const aisgUrls = [];
  for (const f of aisgFiles) {
    const src = path.join(aisgDir, f.file);
    aisgSources.push(src);
    aisgUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const aisgMergedUrl = await mergePdfs(aisgSources, "23A39701_AI_for_Social_Good_Complete_Notes.pdf");
  const aisgDoc = await Note.create({
    title: "AI for Social Good",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "AI for Social Good",
    subjectCode: "23A39701",
    description: "Official R23 AI for Social Good curriculum notes covering AI applications addressing UN Sustainable Development Goals (SDGs), Climate Change Modeling, Disaster Response Optimization, Poverty & Education analytics, Fairness & Accountability.",
    credits: "3",
    module1: aisgFiles[0].mod,
    module2: aisgFiles[1].mod,
    module3: aisgFiles[2].mod,
    module4: aisgFiles[3].mod,
    module5: aisgFiles[4].mod,
    module1Pdf: aisgUrls[0],
    module2Pdf: aisgUrls[1],
    module3Pdf: aisgUrls[2],
    module4Pdf: aisgUrls[3],
    module5Pdf: aisgUrls[4],
    pdfUrl: aisgMergedUrl,
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created AI for Social Good: ${aisgDoc._id}\n`);

  // =========================================================================
  // 9. 23A39702 Smart Systems
  // =========================================================================
  console.log("9. Processing Theory: 23A39702 Smart Systems");
  const ssDir = path.join(SOURCE_BASE, "23A39702 .Smart Systems");
  const ssFiles = [
    { file: "Smart-Systems_Unit-1_Intro_and_AI_Foundations.pdf", mod: "Unit 1: Introduction to Smart Systems & Embedded AI Foundations", dest: "23A39702_Unit_1_Smart_Systems.pdf" },
    { file: "Smart-Systems_Unit-2_ML_and_Deep_Learning.pdf", mod: "Unit 2: Machine Learning & Deep Learning for Edge and IoT Devices", dest: "23A39702_Unit_2_Smart_Systems.pdf" },
    { file: "Smart-Systems_Unit-3_AI_for_Smart_Cities.pdf", mod: "Unit 3: AI for Smart Cities, Energy Grids & Transportation Systems", dest: "23A39702_Unit_3_Smart_Systems.pdf" },
    { file: "Smart-Systems_Unit-4_Healthcare_and_Agriculture.pdf", mod: "Unit 4: Smart Healthcare, Wearable Devices & Precision Agriculture", dest: "23A39702_Unit_4_Smart_Systems.pdf" },
    { file: "Smart-Systems_Unit-5_Design_and_Deployment.pdf", mod: "Unit 5: System Architecture, Deployment, Reliability & Security in Smart Systems", dest: "23A39702_Unit_5_Smart_Systems.pdf" }
  ];
  const ssSources = [];
  const ssUrls = [];
  for (const f of ssFiles) {
    const src = path.join(ssDir, f.file);
    ssSources.push(src);
    ssUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const ssMergedUrl = await mergePdfs(ssSources, "23A39702_Smart_Systems_Complete_Notes.pdf");
  const ssDoc = await Note.create({
    title: "Smart Systems",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Smart Systems",
    subjectCode: "23A39702",
    description: "Official R23 Smart Systems study notes covering Intelligent IoT Sensors & Actuators, Embedded Edge Computing, Smart City Infrastructure (Traffic, Power Grids, Waste Management), Smart Agriculture, and Resilient System Architectures.",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Smart Systems: ${ssDoc._id}\n`);

  // =========================================================================
  // 10. 23A52701a Business Ethics and Corporate Governance
  // =========================================================================
  console.log("10. Processing Theory: 23A52701a Business Ethics and Corporate Governance");
  const begDir = path.join(SOURCE_BASE, "23A52701a .Business Ethics and Corporate Governance");
  const begFiles = [
    { file: "BEG_Unit_1_Handwritten_Notes.pdf", mod: "Unit 1: Business Ethics Foundations, Theories & Moral Reasoning", dest: "23A52701a_Unit_1_Business_Ethics.pdf" },
    { file: "BEG_Unit_2_Handwritten_Notes.pdf", mod: "Unit 2: Corporate Social Responsibility (CSR) & Stakeholder Management", dest: "23A52701a_Unit_2_Business_Ethics.pdf" },
    { file: "BEG_Unit_3_Handwritten_Notes.pdf", mod: "Unit 3: Corporate Governance Principles, Board Committees & Regulatory Framework", dest: "23A52701a_Unit_3_Business_Ethics.pdf" },
    { file: "BEG_Unit_4_Handwritten_Notes.pdf", mod: "Unit 4: Ethical Decision Making in Marketing, Finance & Human Resources", dest: "23A52701a_Unit_4_Business_Ethics.pdf" },
    { file: "BEG_Unit_5_Handwritten_Notes.pdf", mod: "Unit 5: Global Business Ethics, Cyber Ethics & Environmental Governance", dest: "23A52701a_Unit_5_Business_Ethics.pdf" }
  ];
  const begSources = [];
  const begUrls = [];
  for (const f of begFiles) {
    const src = path.join(begDir, f.file);
    begSources.push(src);
    begUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const begMergedUrl = await mergePdfs(begSources, "23A52701a_Business_Ethics_and_Corporate_Governance_Complete_Notes.pdf");
  const begDoc = await Note.create({
    title: "Business Ethics and Corporate Governance",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Business Ethics and Corporate Governance",
    subjectCode: "23A52701a",
    description: "Official R23 notes covering Philosophical Foundations of Business Ethics, Corporate Social Responsibility (CSR), Board Governance Mechanisms, SEBI & Companies Act Guidelines, Financial & Marketing Ethics, and Global Governance.",
    credits: "2",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Business Ethics: ${begDoc._id}\n`);

  // =========================================================================
  // 11. 23A52701b E-Business
  // =========================================================================
  console.log("11. Processing Theory: 23A52701b E-Business");
  const ebDir = path.join(SOURCE_BASE, "23A52701b .E-Business");
  const ebFiles = [
    { file: "EBusiness_Unit1_Electronic_Business.pdf", mod: "Unit 1: Introduction to Electronic Business & Digital Transformation", dest: "23A52701b_Unit_1_E_Business.pdf" },
    { file: "EBusiness_Unit2_Electronic_Markets_and_Business_Models.pdf", mod: "Unit 2: Electronic Markets, B2B, B2C, C2C Business Models", dest: "23A52701b_Unit_2_E_Business.pdf" },
    { file: "EBusiness_Unit3_Electronic_Payment_Systems.pdf", mod: "Unit 3: Electronic Payment Systems (EPS), Gateways & Digital Wallets", dest: "23A52701b_Unit_3_E_Business.pdf" },
    { file: "EBusiness_Unit4_E-Security.pdf", mod: "Unit 4: E-Security, Encryption Protocols & Legal Compliance", dest: "23A52701b_Unit_4_E_Business.pdf" },
    { file: "EBusiness_Unit5_E-Marketing.pdf", mod: "Unit 5: E-Marketing Strategies, SEO, Analytics & Consumer Behavior", dest: "23A52701b_Unit_5_E_Business.pdf" }
  ];
  const ebSources = [];
  const ebUrls = [];
  for (const f of ebFiles) {
    const src = path.join(ebDir, f.file);
    ebSources.push(src);
    ebUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const ebMergedUrl = await mergePdfs(ebSources, "23A52701b_E_Business_Complete_Notes.pdf");
  const ebDoc = await Note.create({
    title: "E-Business",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "E-Business",
    subjectCode: "23A52701b",
    description: "Official R23 E-Business lecture notes covering E-Commerce vs E-Business architectures, Business Models (B2B, B2C, marketplaces), Digital Payment Infrastructure, SSL/TLS E-Security, E-Supply Chain Management, and Digital Marketing Strategies.",
    credits: "2",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created E-Business: ${ebDoc._id}\n`);

  // =========================================================================
  // 12. 23A52701c Management Science
  // =========================================================================
  console.log("12. Processing Theory: 23A52701c Management Science");
  const msDir = path.join(SOURCE_BASE, "23A52701c Management Science");
  const msFiles = [
    { file: "Unit-1_Introduction_to_Management.pdf", mod: "Unit 1: Introduction to Management & Organization Concepts", dest: "23A52701c_Unit_1_Management_Science.pdf" },
    { file: "Unit-2_Operations_Management.pdf", mod: "Unit 2: Operations Management, Plant Location, Layout & Quality Control", dest: "23A52701c_Unit_2_Management_Science.pdf" },
    { file: "Unit-3_Human_Resources_Management.pdf", mod: "Unit 3: Human Resources Management (HRM) & Industrial Relations", dest: "23A52701c_Unit_3_Management_Science.pdf" },
    { file: "Unit-4_Strategic_and_Project_Management.pdf", mod: "Unit 4: Strategic Management (SWOT, Vision) & Project Management (PERT/CPM)", dest: "23A52701c_Unit_4_Management_Science.pdf" },
    { file: "Unit-5_Contemporary_Issues_in_Management.pdf", mod: "Unit 5: Contemporary Issues in Management, TQM, Six Sigma & Supply Chain", dest: "23A52701c_Unit_5_Management_Science.pdf" }
  ];
  const msSources = [];
  const msUrls = [];
  for (const f of msFiles) {
    const src = path.join(msDir, f.file);
    msSources.push(src);
    msUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const msMergedUrl = await mergePdfs(msSources, "23A52701c_Management_Science_Complete_Notes.pdf");
  const msDoc = await Note.create({
    title: "Management Science",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Management Science",
    subjectCode: "23A52701c",
    description: "Official R23 Management Science curriculum notes covering Principles of Scientific Management, Operations Management (Plant Layout, Statistical Quality Control), Human Resources Management, Project Management with PERT/CPM, TQM, Six Sigma, and Supply Chain Management.",
    credits: "2",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Management Science: ${msDoc._id}\n`);

  // =========================================================================
  // 13. 23A52702 Gender Sensitization
  // =========================================================================
  console.log("13. Processing Theory: 23A52702 Gender Sensitization");
  const gsDir = path.join(SOURCE_BASE, "23A52702 Gender Sensitization");
  const gsFiles = [
    { file: "Unit1_Understanding_Gender.pdf", mod: "Unit 1: Understanding Gender, Biological Sex & Socialization", dest: "23A52702_Unit_1_Gender_Sensitization.pdf" },
    { file: "Unit2_Gender_Roles_and_Relations.pdf", mod: "Unit 2: Gender Roles, Family Relations & Patriarchy", dest: "23A52702_Unit_2_Gender_Sensitization.pdf" },
    { file: "Unit3_Gender_and_Labour.pdf", mod: "Unit 3: Gender and Labour, Division of Work & Economic Inequalities", dest: "23A52702_Unit_3_Gender_Sensitization.pdf" },
    { file: "Unit4_Gender_Based_Violence.pdf", mod: "Unit 4: Gender-Based Violence, Legal Protections & Constitutional Rights", dest: "23A52702_Unit_4_Gender_Sensitization.pdf" },
    { file: "Unit5_Gender_and_Culture.pdf", mod: "Unit 5: Gender in Media, Culture, Language & Inclusive Society", dest: "23A52702_Unit_5_Gender_Sensitization.pdf" }
  ];
  const gsSources = [];
  const gsUrls = [];
  for (const f of gsFiles) {
    const src = path.join(gsDir, f.file);
    gsSources.push(src);
    gsUrls.push(copyFileSafe(src, f.dest));
    copyFileSafe(src, f.file);
  }
  const gsMergedUrl = await mergePdfs(gsSources, "23A52702_Gender_Sensitization_Complete_Notes.pdf");
  const gsDoc = await Note.create({
    title: "Gender Sensitization",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Gender Sensitization",
    subjectCode: "23A52702",
    description: "Official R23 Gender Sensitization course notes covering Concepts of Gender vs Sex, Gender Socialization, Division of Labour, Legal Frameworks & POSH Act, Media Representation of Gender, and Building an Inclusive Society.",
    credits: "2",
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
    imageUrl: "",
    likes: 0,
    views: 0,
    downloads: 0
  });
  console.log(`  [NOTE DB] Created Gender Sensitization: ${gsDoc._id}\n`);

  // Invalidate feed cache
  invalidateFeedCache();

  // Summary Verification
  console.log("==================================================");
  console.log("INGESTION SUMMARY FOR AIML 4-1");
  console.log("==================================================");
  const finalNotes = await Note.find({ branch: "AIML", semester: "4-1" });
  console.log(`Total AIML 4-1 Notes Ingested: ${finalNotes.length}`);
  finalNotes.forEach(n => {
    console.log(`  - [${n.subjectCode}] ${n.title} (Credits: ${n.credits})`);
    console.log(`    Main PDF: ${n.pdfUrl}`);
    console.log(`    Units: M1: ${Boolean(n.module1Pdf)}, M2: ${Boolean(n.module2Pdf)}, M3: ${Boolean(n.module3Pdf)}, M4: ${Boolean(n.module4Pdf)}, M5: ${Boolean(n.module5Pdf)}`);
  });

  const finalLabs = await LabProgram.find({ branch: "AIML", semester: "4-1" });
  console.log(`\nTotal AIML 4-1 Labs Ingested: ${finalLabs.length}`);
  finalLabs.forEach(l => {
    console.log(`  - [${l.subjectCode}] ${l.title}`);
    console.log(`    PDF: ${l.pdfUrl}`);
  });

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("INGESTION COMPLETED SUCCESSFULLY WITH 0 ERRORS!");
  console.log("==================================================");
}

uploadAiml4_1().catch(err => {
  console.error("FATAL ERROR IN INGESTION:", err);
  process.exit(1);
});
