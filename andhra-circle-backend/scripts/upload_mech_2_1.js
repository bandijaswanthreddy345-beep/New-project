const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\mech notes\\2-1";
const TARGET_UPLOADS = path.join(__dirname, "../uploads");
const ROOT_UPLOADS = path.join(__dirname, "../../uploads");

// Ensure directories exist
if (!fs.existsSync(TARGET_UPLOADS)) fs.mkdirSync(TARGET_UPLOADS, { recursive: true });
if (!fs.existsSync(ROOT_UPLOADS)) fs.mkdirSync(ROOT_UPLOADS, { recursive: true });

// Helper to copy a file safely to both backend/uploads and root uploads
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

// Helper to merge multiple PDFs into one complete book
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

async function uploadMech2_1() {
  console.log("==================================================");
  console.log("STARTING MECHANICAL ENGINEERING (ME) 2-1 INGESTION");
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

  // 1.1 Mechanics of Solids and Materials Science Lab (23A03304)
  try {
    const dir = path.join(SOURCE_BASE, "23A03304 Mechanics of Solids and Materials Science Lab");
    console.log(`\nProcessing Lab: 23A03304 (Mechanics of Solids and Materials Science Lab)`);
    const pdfSrc = path.join(dir, "MoS_and_Material_Science_Lab_Record_Complete.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A03304_Mechanics_of_Solids_and_Materials_Science_Lab_Record.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "2-1", subjectCode: "23A03304" },
      {
        title: "Mechanics of Solids and Materials Science Lab",
        branch: "ME",
        regulation: "R23",
        semester: "2-1",
        subject: "Mechanics of Solids and Materials Science Lab",
        subjectCode: "23A03304",
        description: "Complete R23 Laboratory Record & Manual covering Tension test, Torsion test, Hardness testing (Brinell/Rockwell), Impact testing (Izod/Charpy), Spring testing, and Microstructure study of ferrous & non-ferrous alloys.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 2-1)`);
    results.labs.push(labDoc.subjectCode);
  } catch (err) {
    console.error("  [ERROR LAB 23A03304]:", err.message);
    results.errors.push({ item: "23A03304", error: err.message });
  }

  // 1.2 Computer-Aided Machine Drawing Lab (23A03305)
  try {
    const dir = path.join(SOURCE_BASE, "23A03305 Computer-Aided Machine Drawing lab");
    console.log(`\nProcessing Lab: 23A03305 (Computer-Aided Machine Drawing Lab)`);
    const pdfSrc = path.join(dir, "Computer_Aided_Machine_Drawing_Exercises_with_Answers.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A03305_Computer_Aided_Machine_Drawing_Lab.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "2-1", subjectCode: "23A03305" },
      {
        title: "Computer-Aided Machine Drawing Lab",
        branch: "ME",
        regulation: "R23",
        semester: "2-1",
        subject: "Computer-Aided Machine Drawing Lab",
        subjectCode: "23A03305",
        description: "R23 Computer-Aided Machine Drawing lab manual and solved exercises covering standard machine elements, screwed fasteners, shaft couplings, bearings, stuffing box, and assembly drawings using CAD software.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 2-1)`);
    results.labs.push(labDoc.subjectCode);
  } catch (err) {
    console.error("  [ERROR LAB 23A03305]:", err.message);
    results.errors.push({ item: "23A03305", error: err.message });
  }

  // =========================================================================
  // 2. THEORY SUBJECTS (NOTES) - EXCLUSIVELY NOTE COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 2-1 THEORY SUBJECTS (NOTES) ---");

  const theorySubjects = [
    {
      code: "23A03301",
      title: "Thermodynamics",
      subject: "Thermodynamics",
      credits: "3",
      folder: "23A03301 Thermodynamics",
      description: "JNTUA R23 Thermodynamics comprehensive lecture notes covering Basic Concepts & Zeroth Law, First Law of Thermodynamics, Second Law & Entropy, Properties of Pure Substances & Steam Cycles, and Refrigeration & Air Conditioning Principles.",
      modules: [
        "Unit 1: Basic Concepts and First Law Fundamentals",
        "Unit 2: First Law Applied to Flow Processes & Heat Engines",
        "Unit 3: Second Law of Thermodynamics and Entropy",
        "Unit 4: Pure Substances, Steam Tables & Vapour Power Cycles",
        "Unit 5: Refrigeration Cycles and Psychrometrics",
      ],
      files: [
        "Thermodynamics_Unit1_Basic_Concepts.pdf",
        "Thermodynamics_Unit2_First_Law.pdf",
        "Thermodynamics_Unit3_Second_Law_Entropy.pdf",
        "Thermodynamics_Unit4_Pure_Substances_Steam.pdf",
        "Thermodynamics_Unit5_Refrigeration_AirConditioning.pdf",
      ],
    },
    {
      code: "23A03302",
      title: "Mechanics of Solids",
      subject: "Mechanics of Solids",
      credits: "3",
      folder: "23A03302 Mechanics of Solids",
      description: "JNTUA R23 Mechanics of Solids study material covering Simple Stresses & Strains, Shear Force & Bending Moment Diagrams (SFD & BMD), Flexural & Shear Stresses in Beams, Deflection of Beams & Torsion of Circular Shafts, and Thin & Thick Cylinders & Columns.",
      modules: [
        "Unit 1: Simple Stresses and Strains",
        "Unit 2: Shear Force and Bending Moment Diagrams",
        "Unit 3: Flexural and Shear Stresses in Beams",
        "Unit 4: Deflection of Beams and Torsion of Shafts",
        "Unit 5: Thin and Thick Cylinders, Columns and Struts",
      ],
      files: [
        "Unit-1_Simple_Stresses_and_Strains.pdf",
        "Unit-2_Shear_Force_and_Bending_Moment.pdf",
        "Unit-3_Flexural_and_Shear_Stresses.pdf",
        "Unit-4_Deflection_of_Beams_and_Torsion.pdf",
        "Unit-5_Cylinders_and_Columns.pdf",
      ],
    },
    {
      code: "23A03303",
      title: "Material Science and Metallurgy",
      subject: "Material Science and Metallurgy",
      credits: "3",
      folder: "23A03303 Material Science and Metallurgy",
      description: "JNTUA R23 Material Science and Metallurgy complete handwritten notes covering Crystal Structure & Imperfections, Phase Diagrams & Iron-Iron Carbide Equilibrium, Heat Treatment of Steels & Cast Irons, Non-Ferrous Metals & Alloys, and Ceramics, Polymers & Composite Materials.",
      modules: [
        "Unit 1: Structure of Metals & Constitution of Alloys",
        "Unit 2: Equilibrium Diagrams & Iron-Carbon (Fe-C) Diagram",
        "Unit 3: Heat Treatment of Steels and Cast Irons",
        "Unit 4: Non-Ferrous Metals and Alloys",
        "Unit 5: Ceramic Materials, Polymers and Composites",
      ],
      files: [
        "23A03303_MSM_Unit1_Handwritten_Notes.pdf",
        "23A03303_MSM_Unit2_Handwritten_Notes.pdf",
        "unit-3.pdf",
        "23A03303_MSM_Unit4_Handwritten_Notes.pdf",
        "23A03303_MSM_Unit5_Handwritten_Notes.pdf",
      ],
    },
    {
      code: "23A05304",
      title: "Python Programming",
      subject: "Python Programming",
      credits: "3",
      folder: "23A05304 Python programming",
      description: "JNTUA R23 Python Programming complete handwritten notes covering Python Basics & Control Structures, Functions & Modules, Strings, Lists, Tuples, Dictionaries & Sets, Object-Oriented Programming (OOP) & Exception Handling, and File Handling & Standard Libraries.",
      modules: [
        "Unit 1: Introduction to Python, Variables & Operators",
        "Unit 2: Control Flow, Loops & Functions",
        "Unit 3: Data Structures (Strings, Lists, Tuples, Dictionaries)",
        "Unit 4: Object-Oriented Programming (Classes & Inheritance)",
        "Unit 5: Files, Exceptions, Modules and Standard Libraries",
      ],
      files: [
        "23A05304_Python_Unit1_Handwritten_Notes.pdf",
        "23A05304_Python_Unit2_Handwritten_Notes.pdf",
        "23A05304_Python_Unit3_Handwritten_Notes.pdf",
        "23A05304_Python_Unit4_Handwritten_Notes.pdf",
        "23A05304_Python_Unit5_Handwritten_Notes.pdf",
      ],
    },
    {
      code: "23A54303",
      title: "Numerical Methods and Transform Techniques",
      subject: "Numerical Methods and Transform Techniques",
      credits: "3",
      folder: "23A54303 Numerical Methods &Transform Techniques(3)",
      description: "JNTUA R23 Mathematics foundation notes covering Solutions of Algebraic & Transcendental Equations, Interpolation & Curve Fitting, Numerical Solution of Ordinary Differential Equations (ODEs), Laplace Transforms & Inverse Transforms, and Fourier Series & Fourier Transforms.",
      modules: [
        "Unit 1: Solution of Algebraic and Transcendental Equations",
        "Unit 2: Interpolation, Finite Differences and Curve Fitting",
        "Unit 3: Numerical Solutions of Ordinary Differential Equations",
        "Unit 4: Laplace Transforms and Applications",
        "Unit 5: Fourier Series and Fourier Transforms",
      ],
      files: [
        "Unit1_Solution_of_Algebraic_and_Transcendental_Equations.pdf",
        "Unit2_Interpolation_and_Curve_Fitting.pdf",
        "Unit3_Numerical_Solution_of_ODEs.pdf",
        "Unit4_Laplace_Transforms.pdf",
        "Unit5_Fourier_Series_and_Fourier_Transforms.pdf",
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
        { branch: "ME", semester: "2-1", subjectCode: sub.code },
        {
          title: "Notes",
          branch: "ME",
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

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY");
  console.log(`Labs Uploaded (LabProgram collection): ${results.labs.length}`);
  console.log(`Notes Uploaded (Note collection): ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. ME 2-1 Ingestion Done!");
}

uploadMech2_1().catch(console.error);
