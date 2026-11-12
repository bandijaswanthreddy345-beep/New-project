const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\civil notes\\2-2";
const TARGET_UPLOADS = path.join(__dirname, "../uploads");
const ROOT_UPLOADS = path.join(__dirname, "../../uploads");

// Ensure upload folders exist
if (!fs.existsSync(TARGET_UPLOADS)) fs.mkdirSync(TARGET_UPLOADS, { recursive: true });
if (!fs.existsSync(ROOT_UPLOADS)) fs.mkdirSync(ROOT_UPLOADS, { recursive: true });

function copyFileSafe(srcPath, destName) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file does not exist: ${srcPath}`);
  }
  const destPath = path.join(TARGET_UPLOADS, destName);
  const rootDestPath = path.join(ROOT_UPLOADS, destName);

  fs.copyFileSync(srcPath, destPath);
  fs.copyFileSync(srcPath, rootDestPath);

  const size = fs.statSync(destPath).size;
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
  const destPath = path.join(TARGET_UPLOADS, destName);
  const rootDestPath = path.join(ROOT_UPLOADS, destName);

  fs.writeFileSync(destPath, mergedBytes);
  fs.writeFileSync(rootDestPath, mergedBytes);

  console.log(
    `  [MERGED] -> ${destName} (${(mergedBytes.length / 1024).toFixed(1)} KB, from ${pdfPaths.length} files)`
  );
  return `/uploads/${destName}`;
}

async function uploadCivil2_2() {
  console.log("==================================================");
  console.log("STARTING CIVIL ENGINEERING (CE) 2-2 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Target Uploads:", TARGET_UPLOADS);
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const results = { labs: [], notes: [], errors: [] };

  // =========================================================================
  // 1. LAB PROGRAMS (LABS) - EXCLUSIVELY LABPROGRAM COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 2-2 LAB MANUALS ---");

  // 1.1 Engineering Geology Lab (23A01401P)
  try {
    const dir = path.join(SOURCE_BASE, "23A01401P Engineering Geology lab(1.5)");
    console.log(`\nProcessing Lab: Engineering Geology Lab`);
    const pdfSrc = path.join(dir, "Engineering_Geology_Lab_Answers.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01401P_Engineering_Geology_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "2-2", subjectCode: "23A01401P" },
      {
        title: "Engineering Geology Lab",
        branch: "CE",
        regulation: "R23",
        semester: "2-2",
        subject: "Engineering Geology Lab",
        subjectCode: "23A01401P",
        description: "JNTUA R23 Engineering Geology Lab Manual covering Physical properties and identification of Rock Forming Minerals & Ore Minerals, Megascopic identification of Igneous, Sedimentary & Metamorphic rocks, and Interpretation of Geological Maps & Structural Geological problems (Dip & Strike).",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 2-2)`);
    results.labs.push("23A01401P");
  } catch (err) {
    console.error("  [ERROR LAB 23A01401P]:", err.message);
    results.errors.push({ item: "23A01401P", error: err.message });
  }

  // 1.2 Concrete Technology Lab (23A01402P)
  try {
    const dir = path.join(SOURCE_BASE, "23A01402P Concrete Technology Lab(1.5)");
    console.log(`\nProcessing Lab: Concrete Technology Lab`);
    const pdfSrc = path.join(dir, "Concrete_Technology_Lab_Manual_23A01402P.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01402P_Concrete_Technology_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "2-2", subjectCode: "23A01402P" },
      {
        title: "Concrete Technology Lab",
        branch: "CE",
        regulation: "R23",
        semester: "2-2",
        subject: "Concrete Technology Lab",
        subjectCode: "23A01402P",
        description: "JNTUA R23 Concrete Technology Laboratory Manual covering Normal Consistency, Setting Times & Compressive Strength of Cement, Specific Gravity & Fineness Modulus of Fine & Coarse Aggregates, Workability of Concrete (Slump Cone, Compacting Factor, Vee-Bee), and Compressive & Split Tensile Strength of Concrete.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 2-2)`);
    results.labs.push("23A01402P");
  } catch (err) {
    console.error("  [ERROR LAB 23A01402P]:", err.message);
    results.errors.push({ item: "23A01402P", error: err.message });
  }

  // =========================================================================
  // 2. THEORY SUBJECTS (NOTES) - EXCLUSIVELY NOTE COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 2-2 THEORY SUBJECTS (NOTES) ---");

  const theorySubjects = [
    {
      code: "23A01401T",
      title: "Engineering Geology",
      subject: "Engineering Geology",
      credits: "3",
      folder: "23A01401T Engineering Geology(3)",
      description: "JNTUA R23 Engineering Geology lecture notes covering Introduction to Geology & Weathering, Mineralogy & Petrology (Igneous, Sedimentary, Metamorphic), Structural Geology (Folds, Faults, Joints, Unconformities), Groundwater, Earthquakes, Landslides & Geophysical Studies, and Geological Considerations for Dams, Reservoirs & Tunnels.",
      modules: [
        "Unit 1: Introduction and Weathering of Rocks",
        "Unit 2: Mineralogy and Petrology",
        "Unit 3: Structural Geology (Folds, Faults, Joints)",
        "Unit 4: Groundwater, Earthquakes, Landslides and Geophysical Studies",
        "Unit 5: Geology of Dams, Reservoirs and Tunnels",
      ],
      files: [
        "Unit_1_Introduction.pdf",
        "Unit_2_Mineralogy_and_Petrology.pdf",
        "Unit_3_Structural_Geology.pdf",
        "Unit_4_Groundwater_Earthquakes_Landslides_Geophysics.pdf",
        "Unit_5_Dams_Reservoirs_Tunnels.pdf",
      ],
    },
    {
      code: "23A01402T",
      title: "Concrete Technology",
      subject: "Concrete Technology",
      credits: "3",
      folder: "23A01402T Concrete Technology(3)",
      description: "JNTUA R23 Concrete Technology complete lecture notes covering Cements & Aggregates, Fresh Concrete & Workability/Admixtures, Hardened Concrete & Strength Properties, Elasticity, Creep & Shrinkage of Concrete, and IS Method Concrete Mix Design & Special Concretes.",
      modules: [
        "Unit 1: Cements and Aggregates",
        "Unit 2: Fresh Concrete, Workability and Chemical Admixtures",
        "Unit 3: Hardened Concrete and Strength Properties",
        "Unit 4: Elasticity, Creep and Shrinkage of Concrete",
        "Unit 5: Concrete Mix Design (IS Method) and Special Concretes",
      ],
      files: [
        "Unit1_Cements_and_Aggregates.pdf",
        "Unit2_Fresh_Concrete.pdf",
        "Unit3_Hardened_Concrete.pdf",
        "Unit4_Elasticity_Creep_and_Shrinkage.pdf",
        "Unit5_Mix_Design_and_Special_Concretes.pdf",
      ],
    },
    {
      code: "23A01403",
      title: "Structural Analysis",
      subject: "Structural Analysis",
      credits: "3",
      folder: "23A01403 Structural Analysis(3)",
      description: "JNTUA R23 Structural Analysis complete notes covering Energy Theorems & Castigliano's Theorems, Indeterminate Structures & Propped Cantilevers, Fixed Beams & Continuous Beams (Theorem of Three Moments), Slope Deflection Method, and Moment Distribution Method (Hardy Cross Method).",
      modules: [
        "Unit 1: Energy Theorems and Strain Energy Methods",
        "Unit 2: Indeterminate Structures and Propped Cantilevers",
        "Unit 3: Fixed and Continuous Beams (Clapeyron's Theorem)",
        "Unit 4: Slope Deflection Method of Analysis",
        "Unit 5: Moment Distribution Method (Hardy Cross Method)",
      ],
      files: [
        "SA_Unit_1_Energy_Theorems.pdf",
        "SA_Unit_2_Indeterminate_Structures.pdf",
        "SA_Unit_3_Fixed_and_Continuous_Beams.pdf",
        "SA_Unit_4_Slope_Deflection_Method.pdf",
        "SA_Unit_5_Moment_Distribution_Method.pdf",
      ],
    },
    {
      code: "23A01404",
      title: "Hydraulics and Hydraulic Machinery",
      subject: "Hydraulics and Hydraulic Machinery",
      credits: "3",
      folder: "23A01404 Hydraulics & Hydraulic Machinery(3)",
      description: "JNTUA R23 Hydraulics and Hydraulic Machinery study material covering Laminar & Turbulent Flow in Pipes & Water Hammer, Uniform Flow in Open Channels (Chezy & Manning Formulas), Non-Uniform Flow in Open Channels (Hydraulic Jump), Impact of Jets & Hydraulic Turbines (Pelton, Francis, Kaplan), and Centrifugal & Reciprocating Pumps.",
      modules: [
        "Unit 1: Laminar and Turbulent Flow in Pipes and Water Hammer",
        "Unit 2: Uniform Flow in Open Channels (Most Economical Sections)",
        "Unit 3: Non-Uniform Flow in Open Channels and Hydraulic Jump",
        "Unit 4: Impact of Jets and Hydraulic Turbines (Pelton, Francis, Kaplan)",
        "Unit 5: Performance of Turbines and Centrifugal Pumps",
      ],
      files: [
        "HHM_Unit1_Laminar_and_Turbulent_Flow_in_Pipes.pdf",
        "HHM_Unit2_Uniform_Flow_in_Open_Channels.pdf",
        "HHM_Unit3_NonUniform_Flow_in_Open_Channels.pdf",
        "HHM_Unit4_Impact_of_Jets_and_Hydraulic_Turbines.pdf",
        "HHM_Unit5_Centrifugal_Pumps.pdf",
      ],
    },
    {
      code: "23A52402a",
      title: "Managerial Economics and Financial Analysis",
      subject: "Managerial Economics and Financial Analysis",
      credits: "2",
      folder: "23A52402a Managerial Economics and Financial (2)",
      description: "JNTUA R23 Humanities elective notes covering Introduction to Managerial Economics & Demand Analysis, Production Function & Cost Analysis, Market Structures & Pricing Strategies, Capital Budgeting Techniques, and Financial Accounting & Ratio Analysis.",
      modules: [
        "Unit 1: Introduction to Managerial Economics and Demand Analysis",
        "Unit 2: Production Function, Cost Analysis and Break-Even Analysis",
        "Unit 3: Business Organizations and Market Structures",
        "Unit 4: Capital Budgeting and Investment Evaluation",
        "Unit 5: Financial Accounting, Statements and Ratio Analysis",
      ],
      files: [
        "Unit1_Managerial_Economics.pdf",
        "Unit2_Production_and_Cost_Analysis.pdf",
        "Unit3_Business_Organizations_and_Markets.pdf",
        "Unit4_Capital_Budgeting.pdf",
        "Unit5_Financial_Accounting_and_Analysis.pdf",
      ],
    },
    {
      code: "23A52402b",
      title: "Organisational Behaviour",
      subject: "Organisational Behaviour",
      credits: "2",
      folder: "23A52402b Organizational Behavior(2)",
      description: "JNTUA R23 Humanities elective lecture notes covering Introduction to Organizational Behavior & Personality/Perception, Motivation Theories & Leadership Styles, Organizational Culture & Climate, Group Dynamics & Conflict Management, and Organizational Change & Development.",
      modules: [
        "Unit 1: Introduction to Organizational Behaviour and Individual Differences",
        "Unit 2: Motivation Theories and Leadership Styles",
        "Unit 3: Organizational Culture, Climate and Work Values",
        "Unit 4: Group Dynamics, Teams and Conflict Management",
        "Unit 5: Organizational Change, Stress and Development",
      ],
      files: [
        "Unit_1_Introduction_to_OB.pdf",
        "Unit_2_Motivation_and_Leading.pdf",
        "Unit_3_Organizational_Culture.pdf",
        "Unit_4_Group_Dynamics.pdf",
        "Unit_5_Organizational_Change_and_Development.pdf",
      ],
    },
    {
      code: "23A52402c",
      title: "Business Environment",
      subject: "Business Environment",
      credits: "2",
      folder: "23A52402c Business Environment(2)",
      description: "JNTUA R23 Humanities elective study material covering Overview of Business Environment & Economic Systems, Fiscal Policy, Monetary Policy & Industrial Policies, India's Foreign Trade Policy & Balance of Payments, World Trade Organization (WTO) & Globalization, and Money & Capital Markets in India.",
      modules: [
        "Unit 1: Overview of Business Environment and Macroeconomic Concepts",
        "Unit 2: Fiscal Policy, Monetary Policy and Industrial Policies in India",
        "Unit 3: India's Foreign Trade Policy and Balance of Payments (BOP)",
        "Unit 4: World Trade Organization (WTO), EXIM Policy and Globalization",
        "Unit 5: Indian Money Market, Capital Market and Financial Institutions",
      ],
      files: [
        "Unit_1_Overview_of_Business_Environment.pdf",
        "Unit_2_Fiscal_and_Monetary_Policy.pdf",
        "Unit_3_Indias_Trade_Policy.pdf",
        "Unit_4_World_Trade_Organization.pdf",
        "Unit_5_Money_and_Capital_Markets.pdf",
      ],
    },
  ];

  for (const sub of theorySubjects) {
    try {
      console.log(`\n--------------------------------------------------`);
      console.log(`Subject: ${sub.code} - ${sub.title}`);
      console.log(`Folder: ${sub.folder}`);

      const subDir = path.join(SOURCE_BASE, sub.folder);
      const unitPaths = [];
      const unitUrls = [];

      for (let i = 0; i < sub.files.length; i++) {
        const uFile = sub.files[i];
        const srcFile = path.join(subDir, uFile);
        const destName = `${sub.code}_Unit_${i + 1}.pdf`;
        const url = copyFileSafe(srcFile, destName);
        unitPaths.push(srcFile);
        unitUrls.push(url);
      }

      // Merge all 5 units into complete textbook
      const mergedName = `${sub.code}_Complete_Textbook_Notes.pdf`;
      const mergedUrl = await mergePdfs(unitPaths, mergedName);

      const noteDoc = await Note.findOneAndUpdate(
        { branch: "CE", semester: "2-2", subjectCode: sub.code },
        {
          title: "Notes",
          branch: "CE",
          semester: "2-2",
          regulation: "R23",
          subject: sub.subject,
          subjectCode: sub.code,
          credits: sub.credits,
          description: sub.description,
          module1: sub.modules[0],
          module1Pdf: unitUrls[0],
          module2: sub.modules[1],
          module2Pdf: unitUrls[1],
          module3: sub.modules[2],
          module3Pdf: unitUrls[2],
          module4: sub.modules[3],
          module4Pdf: unitUrls[3],
          module5: sub.modules[4],
          module5Pdf: unitUrls[4],
          pdfUrl: mergedUrl,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );

      console.log(`  [UPSERTED NOTE] ID: ${noteDoc._id} - ${noteDoc.subject} (Sem: 2-2)`);
      results.notes.push(sub.code);
    } catch (err) {
      console.error(`  [ERROR SUBJECT ${sub.code}]:`, err.message);
      results.errors.push({ item: sub.code, error: err.message });
    }
  }

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY (CE 2-2)");
  console.log(`Labs Uploaded (LabProgram collection): ${results.labs.length}`);
  console.log(`Notes Uploaded (Note collection): ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. CE 2-2 Ingestion Done!");
}

uploadCivil2_2().catch(console.error);
