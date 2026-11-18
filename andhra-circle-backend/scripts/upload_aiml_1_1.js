const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");
const { invalidateFeedCache } = require("../controllers/feedController");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes\\1-1";
const BACKEND_UPLOADS = path.join(__dirname, "../uploads");
const ROOT_UPLOADS = path.join(__dirname, "../../uploads");

// Helper to copy a file safely to both uploads directories
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

// Helper to merge multiple PDFs into one
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

async function uploadAiml1_1() {
  console.log("==================================================");
  console.log("STARTING ARTIFICIAL INTELLIGENCE & ML (AIML) 1-1 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Uploads Destination:", BACKEND_UPLOADS);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`Source directory not found: ${SOURCE_BASE}`);
  }

  [BACKEND_UPLOADS, ROOT_UPLOADS].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log("\nConnecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully!\n");

  const results = {
    notes: [],
    labs: [],
    errors: [],
  };

  // Helper for 5-unit theory courses
  async function processTheoryCourse({
    folderName,
    code,
    subjectName,
    credits,
    description,
    modules,
  }) {
    console.log(`\nProcessing Theory: ${code} (${subjectName})`);
    const dir = path.join(SOURCE_BASE, folderName);
    const safeSubj = subjectName.replace(/[^a-zA-Z0-9]/g, "_");

    const unitUrls = [];
    const unitSourcePaths = [];

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const srcFile = path.join(dir, mod.fileName);
      if (!fs.existsSync(srcFile)) {
        throw new Error(`Unit ${i + 1} file not found: ${srcFile}`);
      }
      unitSourcePaths.push(srcFile);

      const destName = `${code}_Unit_${i + 1}_${safeSubj}.pdf`;
      const url = copyFileSafe(srcFile, destName);
      unitUrls.push(url);
    }

    // Merge into complete subject notes
    const mergedName = `${code}_${safeSubj}_Complete_Notes.pdf`;
    const mergedUrl = await mergePdfs(unitSourcePaths, mergedName);

    // Upsert into Note collection
    const noteDoc = await Note.findOneAndUpdate(
      { branch: "AIML", semester: "1-1", subjectCode: code },
      {
        title: "Notes",
        branch: "AIML",
        semester: "1-1",
        regulation: "R23",
        subject: subjectName,
        subjectCode: code,
        credits: String(credits),
        description,
        module1: modules[0].title,
        module1Pdf: unitUrls[0],
        module2: modules[1].title,
        module2Pdf: unitUrls[1],
        module3: modules[2].title,
        module3Pdf: unitUrls[2],
        module4: modules[3].title,
        module4Pdf: unitUrls[3],
        module5: modules[4].title,
        module5Pdf: unitUrls[4],
        pdfUrl: mergedUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    console.log(`  [NOTE DB] Upserted: ${noteDoc._id} - ${noteDoc.subject} (Sem: 1-1, Branch: AIML)`);
    results.notes.push({ code, name: subjectName, units: 5, mergedFile: mergedUrl });
  }

  // =========================================================================
  // 1. THEORY: 23A54101 (Linear Algebra & Calculus)
  // =========================================================================
  try {
    await processTheoryCourse({
      folderName: "23A54101(Linear Algebra & Calculus)3",
      code: "23A54101",
      subjectName: "Linear Algebra & Calculus",
      credits: "3",
      description:
        "Comprehensive JNTU R23 curriculum notes covering Matrices, System of Linear Equations, Eigenvalues & Eigenvectors, Cayley-Hamilton Theorem, Mean Value Theorems, Partial Differentiation, and Multiple Integrals.",
      modules: [
        {
          fileName: "LAC_Unit_I_Matrices_Handwritten_Notes.pdf",
          title: "Unit 1: Matrices, Rank of Matrix and System of Linear Equations",
        },
        {
          fileName: "LAC_Unit_II_Eigenvalues_Handwritten_Notes.pdf",
          title: "Unit 2: Eigenvalues, Eigenvectors, Cayley-Hamilton Theorem and Quadratic Forms",
        },
        {
          fileName: "LAC_Unit_III_Mean_Value_Theorems_Handwritten_Notes.pdf",
          title: "Unit 3: Differential Calculus and Mean Value Theorems (Rolle's, Lagrange's, Cauchy's)",
        },
        {
          fileName: "LAC_Unit_IV_Partial_Differentiation_Handwritten_Notes.pdf",
          title: "Unit 4: Partial Differentiation, Euler's Theorem, Total Derivatives and Maxima & Minima",
        },
        {
          fileName: "LAC_Unit_V_Multiple_Integrals_Handwritten_Notes.pdf",
          title: "Unit 5: Multiple Integrals (Double and Triple Integrals) and Applications to Area and Volume",
        },
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A54101]:", err.message);
    results.errors.push({ code: "23A54101", error: err.message });
  }

  // =========================================================================
  // 2. THEORY: 23A56101T (Engineering Physics)
  // =========================================================================
  try {
    await processTheoryCourse({
      folderName: "23A56101T(Engineering Physics)3",
      code: "23A56101T",
      subjectName: "Engineering Physics",
      credits: "3",
      description:
        "Complete R23 study notes on Wave Optics (Interference, Diffraction, Polarization), Crystallography & X-Ray Diffraction, Dielectric and Magnetic Materials, Quantum Mechanics & Free Electron Theory, and Semiconductors.",
      modules: [
        {
          fileName: "Unit_I_Wave_Optics.pdf",
          title: "Unit 1: Wave Optics — Interference, Diffraction and Polarization of Light",
        },
        {
          fileName: "Unit_II_Crystallography_XRD.pdf",
          title: "Unit 2: Crystallography, Crystal Structures, Miller Indices and X-Ray Diffraction",
        },
        {
          fileName: "Unit_III_Dielectric_Magnetic_Materials.pdf",
          title: "Unit 3: Dielectric Properties, Polarization Mechanisms and Magnetic Materials",
        },
        {
          fileName: "Unit_IV_Quantum_Mechanics_Free_Electron_Theory.pdf",
          title: "Unit 4: Quantum Mechanics, Schrodinger Wave Equation and Classical/Quantum Free Electron Theory",
        },
        {
          fileName: "Unit_V_Semiconductors.pdf",
          title: "Unit 5: Semiconductor Physics, Intrinsic/Extrinsic Semiconductors, Hall Effect & Superconductivity",
        },
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A56101T]:", err.message);
    results.errors.push({ code: "23A56101T", error: err.message });
  }

  // =========================================================================
  // 3. THEORY: 23A05101T (Introduction to Programming)
  // =========================================================================
  try {
    await processTheoryCourse({
      folderName: "23A05101T(Introduction to Programming)3",
      code: "23A05101T",
      subjectName: "Introduction to Programming",
      credits: "3",
      description:
        "Official R23 programming notes covering Problem Solving, Flowcharts, C Language Basics, Decision & Loop Control Structures, 1D & 2D Arrays, Strings, Pointers, Structures & Unions, Functions, and File Handling.",
      modules: [
        {
          fileName: "Unit_1_Introduction_to_Programming_and_Problem_Solving.pdf",
          title: "Unit 1: Introduction to Programming, Algorithms, Flowcharts and C Fundamentals",
        },
        {
          fileName: "Unit_2_Control_Structures.pdf",
          title: "Unit 2: Control Structures — Conditional Statements, Branching and Loops",
        },
        {
          fileName: "Unit_3_Arrays_and_Strings.pdf",
          title: "Unit 3: Arrays (1D, 2D), Matrix Operations and String Manipulation",
        },
        {
          fileName: "Unit_4_Pointers_and_User_Defined_Data_Types.pdf",
          title: "Unit 4: Pointers, Memory Management, Structures, Unions and Enumerations",
        },
        {
          fileName: "Unit_5_Functions_and_File_Handling.pdf",
          title: "Unit 5: User-Defined Functions, Recursion, Parameter Passing and File Operations",
        },
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A05101T]:", err.message);
    results.errors.push({ code: "23A05101T", error: err.message });
  }

  // =========================================================================
  // 4. THEORY: 23A03101T (Engineering Graphics)
  // =========================================================================
  try {
    await processTheoryCourse({
      folderName: "23A03101T(Engineering Graphics)3",
      code: "23A03101T",
      subjectName: "Engineering Graphics",
      credits: "3",
      description:
        "Core engineering graphics notes covering Drawing Standards, Conic Sections, Engineering Scales, Orthographic Projections of Points, Lines, Planes, Regular Solids, Sectional Views, Development of Surfaces, and Isometric Conversions.",
      modules: [
        {
          fileName: "Unit_1_Drawing_Basics_Curves_Scales.pdf",
          title: "Unit 1: Introduction to Engineering Drawing, Conic Sections, Curves and Scales",
        },
        {
          fileName: "Unit_2_Orthographic_Projections_Points_Lines_Planes.pdf",
          title: "Unit 2: Orthographic Projections of Points, Straight Lines and Plane Surfaces",
        },
        {
          fileName: "Unit_3_Projections_of_Solids.pdf",
          title: "Unit 3: Projections of Regular Solids (Prisms, Pyramids, Cylinders and Cones)",
        },
        {
          fileName: "Unit_4_Sections_and_Development_of_Surfaces.pdf",
          title: "Unit 4: Sections of Solids and Development of Lateral Surfaces of Solids",
        },
        {
          fileName: "Unit_5_Conversion_of_Views.pdf",
          title: "Unit 5: Isometric Projections and Conversion of Isometric to Orthographic Views",
        },
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03101T]:", err.message);
    results.errors.push({ code: "23A03101T", error: err.message });
  }

  // =========================================================================
  // 5. THEORY: 23A02101T (Basic Electrical & Electronics Engineering)
  // Part A (Electrical: 3 units) + Part B (Electronics: 3 units)
  // =========================================================================
  try {
    console.log(`\nProcessing Theory: 23A02101T (Basic Electrical & Electronics Engineering)`);
    const partADir = path.join(SOURCE_BASE, "23A02101T(Basic Electrical & Electronics)3 part-A");
    const partBDir = path.join(SOURCE_BASE, "23A02101T(Electrical & Electronics Engineering)part-B");

    const a1 = path.join(partADir, "BEEE_Unit1_DC_and_AC_Circuits.pdf");
    const a2 = path.join(partADir, "BEEE_Unit2_Machines_and_Measuring_Instruments.pdf");
    const a3 = path.join(partADir, "BEEE_Unit3_Energy_Resources_Bill_and_Safety.pdf");

    const b1 = path.join(partBDir, "Unit_I_Semiconductor_Devices.pdf");
    const b2 = path.join(partBDir, "Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf");
    const b3 = path.join(partBDir, "Unit_III_Digital_Electronics.pdf");

    // Copy Unit 1 (Part A Unit 1)
    const u1Url = copyFileSafe(a1, "23A02101T_Unit_1_DC_and_AC_Circuits.pdf");
    // Copy Unit 2 (Part A Unit 2)
    const u2Url = copyFileSafe(a2, "23A02101T_Unit_2_Machines_and_Measuring_Instruments.pdf");
    // Copy Unit 3 (Part A Unit 3)
    const u3Url = copyFileSafe(a3, "23A02101T_Unit_3_Energy_Resources_Bill_and_Safety.pdf");
    // Merge Part B Unit 1 & 2 for Module 4 (Semiconductor Devices & Circuits)
    const u4Url = await mergePdfs([b1, b2], "23A02101T_Unit_4_Semiconductor_Devices_and_Circuits.pdf");
    // Copy Unit 5 (Part B Unit 3: Digital Electronics)
    const u5Url = copyFileSafe(b3, "23A02101T_Unit_5_Digital_Electronics.pdf");

    // Merge all 6 units into complete subject PDF
    const beeeMergedUrl = await mergePdfs([a1, a2, a3, b1, b2, b3], "23A02101T_Basic_Electrical_and_Electronics_Engineering_Complete_Notes.pdf");

    const noteDoc = await Note.findOneAndUpdate(
      { branch: "AIML", semester: "1-1", subjectCode: "23A02101T" },
      {
        title: "Notes",
        branch: "AIML",
        semester: "1-1",
        regulation: "R23",
        subject: "Basic Electrical & Electronics Engineering",
        subjectCode: "23A02101T",
        credits: "3",
        description:
          "Comprehensive R23 notes for Part A (Electrical: DC & AC Circuits, Electrical Machines, Energy Resources, Tariff & Safety) and Part B (Electronics: Semiconductor Diodes, BJT, Op-Amps, Rectifiers, Logic Gates and Digital Electronics).",
        module1: "Part A — Unit 1: DC and AC Circuits Analysis",
        module1Pdf: u1Url,
        module2: "Part A — Unit 2: Electrical Machines and Measuring Instruments",
        module2Pdf: u2Url,
        module3: "Part A — Unit 3: Energy Resources, Electricity Bill Calculation & Electrical Safety",
        module3Pdf: u3Url,
        module4: "Part B — Unit 1 & 2: Semiconductor Devices, Basic Electronic Circuits and Instrumentation",
        module4Pdf: u4Url,
        module5: "Part B — Unit 3: Digital Electronics, Logic Gates and Number Systems",
        module5Pdf: u5Url,
        pdfUrl: beeeMergedUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    console.log(`  [NOTE DB] Upserted: ${noteDoc._id} - ${noteDoc.subject} (Sem: 1-1, Branch: AIML)`);
    results.notes.push({ code: "23A02101T", name: "Basic Electrical & Electronics Engineering", units: 5, mergedFile: beeeMergedUrl });
  } catch (err) {
    console.error("  [ERROR 23A02101T]:", err.message);
    results.errors.push({ code: "23A02101T", error: err.message });
  }

  // =========================================================================
  // 6. LAB PROGRAM: 23A05101P (Computer Programming Lab)
  // =========================================================================
  try {
    console.log(`\nProcessing Lab: 23A05101P (Computer Programming Lab)`);
    const labDir = path.join(SOURCE_BASE, "23A05101P(computer programming lab)1.5");
    const labSrc = path.join(labDir, "C_Programming_Lab_Programs_and_Output.pdf");
    const labUrl = copyFileSafe(labSrc, "23A05101P_Computer_Programming_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "AIML", semester: "1-1", subjectCode: "23A05101P" },
      {
        title: "Computer Programming Lab",
        branch: "AIML",
        regulation: "R23",
        semester: "1-1",
        subject: "Computer Programming Lab",
        subjectCode: "23A05101P",
        credits: "1.5",
        description:
          "Official R23 C Computer Programming Lab manual with source codes, algorithms, flowcharts, compilation steps, and expected outputs for all prescribed university practical experiments.",
        pdfUrl: labUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [LAB DB] Upserted Lab: ${labDoc._id} - ${labDoc.subject}`);
    results.labs.push("23A05101P");

    // Also register in Note collection for complete visibility
    await Note.findOneAndUpdate(
      { branch: "AIML", semester: "1-1", subjectCode: "23A05101P" },
      {
        title: "Notes",
        branch: "AIML",
        semester: "1-1",
        regulation: "R23",
        subject: "Computer Programming Lab",
        subjectCode: "23A05101P",
        credits: "1.5",
        description:
          "Official R23 C Computer Programming Lab manual with source codes, algorithms, flowcharts, compilation steps, and expected outputs for all prescribed university practical experiments.",
        module1: "Computer Programming Practical Experiments and Code Solutions",
        module1Pdf: labUrl,
        pdfUrl: labUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("  [ERROR LAB 23A05101P]:", err.message);
    results.errors.push({ code: "23A05101P", error: err.message });
  }

  // =========================================================================
  // 7. LAB PROGRAM: 23A56101P (Engineering Physics Lab)
  // =========================================================================
  try {
    console.log(`\nProcessing Lab: 23A56101P (Engineering Physics Lab)`);
    const physDir = path.join(SOURCE_BASE, "23A56101P(Engineering Physics Lab)1");
    const physSrc = path.join(physDir, "Engineering_Physics_Lab_Notes.pdf");
    const physUrl = copyFileSafe(physSrc, "23A56101P_Engineering_Physics_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "AIML", semester: "1-1", subjectCode: "23A56101P" },
      {
        title: "Engineering Physics Lab",
        branch: "AIML",
        regulation: "R23",
        semester: "1-1",
        subject: "Engineering Physics Lab",
        subjectCode: "23A56101P",
        credits: "1",
        description:
          "Official R23 Engineering Physics Lab record covering Newton's Rings, Diffraction Grating, Laser wavelength determination, Hall Effect, Energy gap of a semiconductor, and Dielectric constant experiments.",
        pdfUrl: physUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [LAB DB] Upserted Lab: ${labDoc._id} - ${labDoc.subject}`);
    results.labs.push("23A56101P");

    // Also register in Note collection for complete visibility
    await Note.findOneAndUpdate(
      { branch: "AIML", semester: "1-1", subjectCode: "23A56101P" },
      {
        title: "Notes",
        branch: "AIML",
        semester: "1-1",
        regulation: "R23",
        subject: "Engineering Physics Lab",
        subjectCode: "23A56101P",
        credits: "1",
        description:
          "Official R23 Engineering Physics Lab record covering Newton's Rings, Diffraction Grating, Laser wavelength determination, Hall Effect, Energy gap of a semiconductor, and Dielectric constant experiments.",
        module1: "Engineering Physics Laboratory Experiments & Observations",
        module1Pdf: physUrl,
        pdfUrl: physUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("  [ERROR LAB 23A56101P]:", err.message);
    results.errors.push({ code: "23A56101P", error: err.message });
  }

  // Clear in-memory cache so fresh feed is served
  invalidateFeedCache();

  console.log("\n==================================================");
  console.log("AIML 1-1 INGESTION COMPLETE SUMMARY");
  console.log(`Notes Upserted: ${results.notes.length}`);
  console.log(`Labs Upserted: ${results.labs.length}`);
  console.log(`Errors: ${results.errors.length}`);
  if (results.errors.length > 0) {
    console.log("Error details:", JSON.stringify(results.errors, null, 2));
  }
  console.log("==================================================");

  await mongoose.disconnect();
}

uploadAiml1_1().catch((err) => {
  console.error("FATAL ERROR IN INGESTION:", err);
  process.exit(1);
});
