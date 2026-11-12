const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\civil notes\\2-1";
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

async function uploadCivil2_1() {
  console.log("==================================================");
  console.log("STARTING CIVIL ENGINEERING (CE) 2-1 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Target Uploads:", TARGET_UPLOADS);
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const results = { labs: [], notes: [], errors: [] };

  // =========================================================================
  // 1. LAB PROGRAMS (LABS) - EXCLUSIVELY LABPROGRAM COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 2-1 LAB MANUALS ---");

  // 1.1 Strength of Materials Lab (23A01301P-SOM / 23A01302P)
  try {
    const dir = path.join(SOURCE_BASE, "23A01301P Strength of Materials Lab(1.5)");
    console.log(`\nProcessing Lab: Strength of Materials Lab`);
    const pdfSrc = path.join(dir, "Strength_of_Materials_Lab_Record.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01301P_Strength_of_Materials_Lab_Record.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "2-1", subject: "Strength of Materials Lab" },
      {
        title: "Strength of Materials Lab",
        branch: "CE",
        regulation: "R23",
        semester: "2-1",
        subject: "Strength of Materials Lab",
        subjectCode: "23A01301P",
        description: "JNTUA R23 Strength of Materials Lab Record & Manual covering Tension test on mild steel rod, Torsion test, Hardness testing (Brinell & Rockwell), Impact tests (Izod & Charpy), Spring test, and Deflection test on simply supported and cantilever beams.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 2-1)`);
    results.labs.push("Strength of Materials Lab");
  } catch (err) {
    console.error("  [ERROR LAB SOM]:", err.message);
    results.errors.push({ item: "Strength of Materials Lab", error: err.message });
  }

  // 1.2 Surveying Lab (23A01301P)
  try {
    const dir = path.join(SOURCE_BASE, "23A01301P Surveying Lab(1.5)");
    console.log(`\nProcessing Lab: Surveying Lab`);
    const pdfSrc = path.join(dir, "Surveying_Lab_Manual.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01301P_Surveying_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "2-1", subject: "Surveying Lab" },
      {
        title: "Surveying Lab",
        branch: "CE",
        regulation: "R23",
        semester: "2-1",
        subject: "Surveying Lab",
        subjectCode: "23A01301P",
        description: "JNTUA R23 Surveying Laboratory Manual covering Chain surveying (Ranging, Offsetting), Compass surveying, Plane Table surveying, Leveling (Fly leveling, Profile leveling, Contouring), Theodolite surveying, and Total Station field measurements.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 2-1)`);
    results.labs.push("Surveying Lab");
  } catch (err) {
    console.error("  [ERROR LAB Surveying]:", err.message);
    results.errors.push({ item: "Surveying Lab", error: err.message });
  }

  // =========================================================================
  // 2. THEORY SUBJECTS (NOTES) - EXCLUSIVELY NOTE COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 2-1 THEORY SUBJECTS (NOTES) ---");

  // 2.1 Multi-Unit Theory Subjects
  const multiUnitSubjects = [
    {
      code: "23A01301T",
      title: "Surveying",
      subject: "Surveying",
      credits: "3",
      folder: "23A01301T Surveying(3)",
      description: "JNTUA R23 Surveying complete handwritten notes covering Introduction & Chain/Compass Surveying, Plane Table Surveying & Leveling, Contouring & Theodolite Surveying, Computation of Areas & Volumes, and Electronic Distance Measurement (EDM) & Advanced Surveying (Total Station, GPS, GIS).",
      modules: [
        "Unit 1: Introduction and Principles of Surveying, Chain and Compass",
        "Unit 2: Plane Table Surveying and Leveling Principles",
        "Unit 3: Contouring, Theodolite Surveying and Trigonometrical Leveling",
        "Unit 4: Computation of Areas and Earthwork Volumes",
        "Unit 5: Electronic Distance Measurement (EDM), Total Station and GPS",
      ],
      files: [
        "Surveying_23A01301T_Unit1_Handwritten_Notes.pdf",
        "Surveying_23A01301T_Unit2_Handwritten_Notes.pdf",
        "Surveying_23A01301T_Unit3_Handwritten_Notes.pdf",
        "Surveying_23A01301T_Unit4_Handwritten_Notes.pdf",
        "Surveying_23A01301T_Unit5_Handwritten_Notes.pdf",
      ],
    },
    {
      code: "23A01302T",
      title: "Strength of Materials",
      subject: "Strength of Materials",
      credits: "3",
      folder: "23A01302T Strength of Materials(3)",
      description: "JNTUA R23 Strength of Materials study notes covering Simple Stresses & Strains, Shear Force & Bending Moment Diagrams (SFD & BMD), Flexural & Shear Stresses in Beams, Deflection of Beams (Macaulay's Method, Double Integration), and Columns & Cylinders (Thin and Thick Cylinders).",
      modules: [
        "Unit 1: Simple Stresses and Strains, Elastic Constants",
        "Unit 2: Shear Force and Bending Moment in Beams",
        "Unit 3: Flexural and Shear Stresses in Beams",
        "Unit 4: Deflection of Beams and Strain Energy",
        "Unit 5: Columns and Struts, Thin and Thick Cylinders",
      ],
      files: [
        "SOM_Unit-1_Simple_Stresses_and_Strains.pdf",
        "SOM_Unit-2_Shear_Force_and_Bending_Moment.pdf",
        "SOM_Unit-3_Flexural_and_Shear_Stresses.pdf",
        "SOM_Unit-4_Deflection_of_Beams.pdf",
        "SOM_Unit-5_Columns_and_Cylinders.pdf",
      ],
    },
    {
      code: "23A01303",
      title: "Fluid Mechanics",
      subject: "Fluid Mechanics",
      credits: "3",
      folder: "23A01303 Fluid Mechanics(3)",
      description: "JNTUA R23 Fluid Mechanics notes covering Basic Properties of Fluids & Fluid Statics (Pressure Measurement, Buoyancy), Fluid Kinematics & Continuity Equation, Fluid Dynamics (Euler's & Bernoulli's Equations), Flow Measurement (Venturimeter, Orifice), and Closed Conduit Flow & Boundary Layer.",
      modules: [
        "Unit 1: Fluid Properties and Pressure Measurement",
        "Unit 2: Fluid Statics, Hydrostatic Forces and Buoyancy",
        "Unit 3: Fluid Kinematics and Flow Visualization",
        "Unit 4: Fluid Dynamics and Energy Equations",
        "Unit 5: Flow Through Pipes and Boundary Layer Theory",
      ],
      files: [
        "FM_Unit1_Basic_Concepts.pdf",
        "FM_Unit2_Fluid_Statics.pdf",
        "FM_Unit3_Fluid_Kinematics.pdf",
        "FM_Unit4_Fluid_Dynamics.pdf",
        "FM_Unit5_Pipe_Flow.pdf",
      ],
    },
    {
      code: "23A54406",
      title: "Numerical and Statistical Methods",
      subject: "Numerical and Statistical Methods",
      credits: "3",
      folder: "23A54406 Numerical and Statistical Methods(3)",
      description: "JNTUA R23 Mathematics foundation notes for Civil Engineering covering Solution of Algebraic & Transcendental Equations, Interpolation & Curve Fitting, Numerical Integration & ODEs, Probability Distributions (Binomial, Poisson, Normal), and Sampling Theory & Testing of Hypothesis.",
      modules: [
        "Unit 1: Solution of Algebraic and Transcendental Equations",
        "Unit 2: Interpolation, Finite Differences and Curve Fitting",
        "Unit 3: Numerical Integration and Solutions of ODEs",
        "Unit 4: Probability Distributions and Random Variables",
        "Unit 5: Sampling Distributions and Testing of Hypotheses",
      ],
      files: [
        "NSM_23A54406_Unit1_Notes.pdf",
        "NSM_23A54406_Unit2_Notes.pdf",
        "NSM_23A54406_Unit3_Notes.pdf",
        "NSM_23A54406_Unit4_Notes.pdf",
        "NSM_23A54406_Unit5_Notes.pdf",
      ],
    },
  ];

  for (const sub of multiUnitSubjects) {
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
        { branch: "CE", semester: "2-1", subjectCode: sub.code },
        {
          title: "Notes",
          branch: "CE",
          semester: "2-1",
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

      console.log(`  [UPSERTED NOTE] ID: ${noteDoc._id} - ${noteDoc.subject} (Sem: 2-1)`);
      results.notes.push(sub.code);
    } catch (err) {
      console.error(`  [ERROR SUBJECT ${sub.code}]:`, err.message);
      results.errors.push({ item: sub.code, error: err.message });
    }
  }

  // 2.2 Building Planning and Drawing (23A01304)
  try {
    console.log(`\n--------------------------------------------------`);
    console.log(`Subject: 23A01304 - Building Planning and Drawing`);
    const bpdDir = path.join(SOURCE_BASE, "23A01304 Building Planning and Drawing(2)");
    const bpdSrc = path.join(bpdDir, "Building_Planning_and_Drawing_Record-lab.pdf");
    const bpdUrl = copyFileSafe(bpdSrc, "23A01304_Building_Planning_and_Drawing_Complete_Notes.pdf");

    const bpdDoc = await Note.findOneAndUpdate(
      { branch: "CE", semester: "2-1", subjectCode: "23A01304" },
      {
        title: "Notes",
        branch: "CE",
        semester: "2-1",
        regulation: "R23",
        subject: "Building Planning and Drawing",
        subjectCode: "23A01304",
        credits: "2",
        description: "JNTUA R23 Building Planning and Drawing complete notes & drawing plates covering Building Byelaws, Principles of Planning for Residential & Public Buildings, Sign Conventions, Doors & Windows, Roof Trusses, and Plan, Elevation & Section Drawings.",
        module1: "Building Planning Guidelines & Byelaws",
        module1Pdf: bpdUrl,
        module2: "Building Elements (Doors, Windows, Stairs)",
        module2Pdf: bpdUrl,
        module3: "Residential Building Plans & Elevations",
        module3Pdf: bpdUrl,
        module4: "Public Building Planning (Schools, Hospitals)",
        module4Pdf: bpdUrl,
        module5: "CAD Drawings & Structural Details",
        module5Pdf: bpdUrl,
        pdfUrl: bpdUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED NOTE] ID: ${bpdDoc._id} - ${bpdDoc.subject} (Sem: 2-1)`);
    results.notes.push("23A01304");
  } catch (err) {
    console.error(`  [ERROR SUBJECT 23A01304]:`, err.message);
    results.errors.push({ item: "23A01304", error: err.message });
  }

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY (CE 2-1)");
  console.log(`Labs Uploaded (LabProgram collection): ${results.labs.length}`);
  console.log(`Notes Uploaded (Note collection): ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. CE 2-1 Ingestion Done!");
}

uploadCivil2_1().catch(console.error);
