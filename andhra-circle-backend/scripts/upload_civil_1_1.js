const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\civil notes\\1-1";
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

async function uploadCivil1_1() {
  console.log("==================================================");
  console.log("STARTING CIVIL ENGINEERING (CE) 1-1 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Target Uploads:", TARGET_UPLOADS);
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const results = { labs: [], notes: [], errors: [] };

  // =========================================================================
  // 1. LAB PROGRAMS (LABS) - EXCLUSIVELY LABPROGRAM COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 1-1 LAB MANUALS ---");

  // 1.1 Computer Programming Lab (23A05101P)
  try {
    const dir = path.join(SOURCE_BASE, "23A05101P(computer programming lab)1.5");
    console.log(`\nProcessing Lab: 23A05101P (Computer Programming Lab)`);
    const pdfSrc = path.join(dir, "C_Programming_Lab_Programs_and_Output.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A05101P_Computer_Programming_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "1-1", subjectCode: "23A05101P" },
      {
        title: "Computer Programming Lab",
        branch: "CE",
        regulation: "R23",
        semester: "1-1",
        subject: "Computer Programming Lab",
        subjectCode: "23A05101P",
        description: "JNTUA R23 Computer Programming Lab manual with complete C programs, algorithms, flowcharts, and sample input/output execution results covering conditionals, loops, arrays, pointers, functions, and files.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 1-1)`);
    results.labs.push(labDoc.subjectCode);
  } catch (err) {
    console.error("  [ERROR LAB 23A05101P]:", err.message);
    results.errors.push({ item: "23A05101P", error: err.message });
  }

  // 1.2 Engineering Physics Lab (23A56101P)
  try {
    const dir = path.join(SOURCE_BASE, "23A56101P(Engineering Physics Lab)1");
    console.log(`\nProcessing Lab: 23A56101P (Engineering Physics Lab)`);
    const pdfSrc = path.join(dir, "Engineering_Physics_Lab_Notes.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A56101P_Engineering_Physics_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "1-1", subjectCode: "23A56101P" },
      {
        title: "Engineering Physics Lab",
        branch: "CE",
        regulation: "R23",
        semester: "1-1",
        subject: "Engineering Physics Lab",
        subjectCode: "23A56101P",
        description: "JNTUA R23 Engineering Physics Laboratory manual covering experimental procedures, observations, formulas, calculations, and viva questions for Newton's Rings, Diffraction Grating, Laser Wavelength, Optical Fiber, Magnetic Hysteresis, and Bandgap Determination.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 1-1)`);
    results.labs.push(labDoc.subjectCode);
  } catch (err) {
    console.error("  [ERROR LAB 23A56101P]:", err.message);
    results.errors.push({ item: "23A56101P", error: err.message });
  }

  // =========================================================================
  // 2. THEORY SUBJECTS (NOTES) - EXCLUSIVELY NOTE COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 1-1 THEORY SUBJECTS (NOTES) ---");

  // 2.1 Basic Electrical & Electronics Engineering (23A02101T) - 6 Units Combined (Part A + Part B)
  try {
    console.log(`\n--------------------------------------------------`);
    console.log(`Subject: 23A02101T - Basic Electrical and Electronics Engineering (Part A + Part B)`);
    const dirPartA = path.join(SOURCE_BASE, "23A02101T(Basic Electrical & Electronics)3 part-A");
    const dirPartB = path.join(SOURCE_BASE, "23A02101T(Electrical & Electronics Engineering)1.5 part_B");

    const partAFiles = [
      { name: "Unit 1: DC and AC Circuits", file: path.join(dirPartA, "BEEE_Unit1_DC_and_AC_Circuits.pdf"), dest: "23A02101T_Unit_1_DC_and_AC_Circuits.pdf" },
      { name: "Unit 2: Machines and Measuring Instruments", file: path.join(dirPartA, "BEEE_Unit2_Machines_and_Measuring_Instruments.pdf"), dest: "23A02101T_Unit_2_Machines_and_Measuring_Instruments.pdf" },
      { name: "Unit 3: Energy Resources, Bill and Safety", file: path.join(dirPartA, "BEEE_Unit3_Energy_Resources_Bill_and_Safety.pdf"), dest: "23A02101T_Unit_3_Energy_Resources_Bill_and_Safety.pdf" },
    ];

    const partBFiles = [
      { name: "Unit 4 (Part B Unit 1): Semiconductor Devices", file: path.join(dirPartB, "Unit_I_Semiconductor_Devices.pdf"), dest: "23A02101T_Unit_4_Semiconductor_Devices.pdf" },
      { name: "Unit 5 (Part B Unit 2): Basic Electronic Circuits and Instrumentation", file: path.join(dirPartB, "Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf"), dest: "23A02101T_Unit_5_Basic_Electronic_Circuits.pdf" },
      { name: "Unit 6 (Part B Unit 3): Digital Electronics", file: path.join(dirPartB, "Unit_III_Digital_Electronics.pdf"), dest: "23A02101T_Unit_6_Digital_Electronics.pdf" },
    ];

    const allBeeeFiles = [...partAFiles, ...partBFiles];
    const beeePaths = [];
    const beeeUrls = [];

    for (const item of allBeeeFiles) {
      const url = copyFileSafe(item.file, item.dest);
      beeePaths.push(item.file);
      beeeUrls.push(url);
    }

    const mergedBeeeUrl = await mergePdfs(beeePaths, "23A02101T_Complete_Textbook_Notes.pdf");

    const beeeDoc = await Note.findOneAndUpdate(
      { branch: "CE", semester: "1-1", subjectCode: "23A02101T" },
      {
        title: "Notes",
        branch: "CE",
        semester: "1-1",
        regulation: "R23",
        subject: "Basic Electrical and Electronics Engineering",
        subjectCode: "23A02101T",
        credits: "3",
        description: "JNTUA R23 Basic Electrical and Electronics Engineering comprehensive study material covering Part A (DC/AC Circuits, Electrical Machines, Energy Resources & Safety) and Part B (Semiconductor Devices, Electronic Circuits, Digital Electronics).",
        module1: beeeFilesDisplay(allBeeeFiles[0].name),
        module1Pdf: beeeUrls[0],
        module2: beeeFilesDisplay(allBeeeFiles[1].name),
        module2Pdf: beeeUrls[1],
        module3: beeeFilesDisplay(allBeeeFiles[2].name),
        module3Pdf: beeeUrls[2],
        module4: beeeFilesDisplay(allBeeeFiles[3].name),
        module4Pdf: beeeUrls[3],
        module5: beeeFilesDisplay(allBeeeFiles[4].name),
        module5Pdf: beeeUrls[4],
        pdfUrl: mergedBeeeUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED NOTE] ID: ${beeeDoc._id} - ${beeeDoc.subject} (Sem: 1-1)`);
    results.notes.push("23A02101T");
  } catch (err) {
    console.error("  [ERROR SUBJECT 23A02101T]:", err.message);
    results.errors.push({ item: "23A02101T", error: err.message });
  }

  function beeeFilesDisplay(str) {
    return str;
  }

  // 2.2 Standard 5-Unit Theory Subjects
  const standardTheorySubjects = [
    {
      code: "23A03101T",
      title: "Engineering Graphics",
      subject: "Engineering Graphics",
      credits: "3",
      folder: "23A03101T(Engineering Graphics)3",
      description: "JNTUA R23 Engineering Graphics lecture notes covering Drawing Basics, Curves & Scales, Orthographic Projections of Points, Lines & Planes, Projections of Solids, Sections & Development of Surfaces, and Conversion of Orthographic to Isometric Views.",
      modules: [
        "Unit 1: Drawing Basics, Curves and Scales",
        "Unit 2: Orthographic Projections of Points, Lines and Planes",
        "Unit 3: Projections of Regular Solids",
        "Unit 4: Sections and Development of Surfaces of Solids",
        "Unit 5: Isometric Views and Conversion of Views",
      ],
      files: [
        "Unit_1_Drawing_Basics_Curves_Scales.pdf",
        "Unit_2_Orthographic_Projections_Points_Lines_Planes.pdf",
        "Unit_3_Projections_of_Solids.pdf",
        "Unit_4_Sections_and_Development_of_Surfaces.pdf",
        "Unit_5_Conversion_of_Views.pdf",
      ],
    },
    {
      code: "23A05101T",
      title: "Introduction to Programming",
      subject: "Introduction to Programming",
      credits: "3",
      folder: "23A05101T(Introduction to Programming)3",
      description: "JNTUA R23 Introduction to Programming (C Language) complete study material covering Introduction to Problem Solving, Control Structures, Arrays & Strings, Pointers & Structures/Unions, and Functions & File Management in C.",
      modules: [
        "Unit 1: Introduction to Programming and Problem Solving",
        "Unit 2: Control Structures (Conditionals and Loops)",
        "Unit 3: Arrays, Strings and Character Handling",
        "Unit 4: Pointers and User Defined Data Types",
        "Unit 5: Functions, Recursion and File Handling",
      ],
      files: [
        "Unit_1_Introduction_to_Programming_and_Problem_Solving.pdf",
        "Unit_2_Control_Structures.pdf",
        "Unit_3_Arrays_and_Strings.pdf",
        "Unit_4_Pointers_and_User_Defined_Data_Types.pdf",
        "Unit_5_Functions_and_File_Handling.pdf",
      ],
    },
    {
      code: "23A54101",
      title: "Linear Algebra and Calculus",
      subject: "Linear Algebra and Calculus",
      credits: "3",
      folder: "23A54101(Linear Algebra & Calculus)3",
      description: "JNTUA R23 Linear Algebra & Calculus handwritten notes covering Matrices & System of Linear Equations, Eigenvalues & Eigenvectors, Mean Value Theorems, Partial Differentiation, and Multiple Integrals (Double and Triple Integrals).",
      modules: [
        "Unit 1: Matrices and System of Linear Equations",
        "Unit 2: Eigenvalues, Eigenvectors and Diagonalization",
        "Unit 3: Mean Value Theorems and Single Variable Calculus",
        "Unit 4: Partial Differentiation and Applications",
        "Unit 5: Multiple Integrals and Change of Variables",
      ],
      files: [
        "LAC_Unit_I_Matrices_Handwritten_Notes.pdf",
        "LAC_Unit_II_Eigenvalues_Handwritten_Notes.pdf",
        "LAC_Unit_III_Mean_Value_Theorems_Handwritten_Notes.pdf",
        "LAC_Unit_IV_Partial_Differentiation_Handwritten_Notes.pdf",
        "LAC_Unit_V_Multiple_Integrals_Handwritten_Notes.pdf",
      ],
    },
    {
      code: "23A56101T",
      title: "Engineering Physics",
      subject: "Engineering Physics",
      credits: "3",
      folder: "23A56101T(Engineering Physics)3",
      description: "JNTUA R23 Engineering Physics comprehensive lecture notes covering Wave Optics (Interference, Diffraction, Polarization), Crystallography & X-Ray Diffraction, Dielectric and Magnetic Materials, Quantum Mechanics & Free Electron Theory, and Semiconductors & Superconductors.",
      modules: [
        "Unit 1: Wave Optics (Interference, Diffraction, Polarization)",
        "Unit 2: Crystallography and X-Ray Diffraction",
        "Unit 3: Dielectric and Magnetic Materials",
        "Unit 4: Quantum Mechanics and Free Electron Theory",
        "Unit 5: Semiconductors and Optoelectronic Devices",
      ],
      files: [
        "Unit_I_Wave_Optics.pdf",
        "Unit_II_Crystallography_XRD.pdf",
        "Unit_III_Dielectric_Magnetic_Materials.pdf",
        "Unit_IV_Quantum_Mechanics_Free_Electron_Theory.pdf",
        "Unit_V_Semiconductors.pdf",
      ],
    },
  ];

  for (const sub of standardTheorySubjects) {
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
        { branch: "CE", semester: "1-1", subjectCode: sub.code },
        {
          title: "Notes",
          branch: "CE",
          semester: "1-1",
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

      console.log(`  [UPSERTED NOTE] ID: ${noteDoc._id} - ${noteDoc.subject} (Sem: 1-1)`);
      results.notes.push(sub.code);
    } catch (err) {
      console.error(`  [ERROR SUBJECT ${sub.code}]:`, err.message);
      results.errors.push({ item: sub.code, error: err.message });
    }
  }

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY (CE 1-1)");
  console.log(`Labs Uploaded (LabProgram collection): ${results.labs.length}`);
  console.log(`Notes Uploaded (Note collection): ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. CE 1-1 Ingestion Done!");
}

uploadCivil1_1().catch(console.error);
