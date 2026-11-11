const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\mech notes\\1-1";
const TARGET_UPLOADS = path.join(__dirname, "../uploads");

// Helper to copy a file safely
function copyFileSafe(srcPath, destName) {
  const destPath = path.join(TARGET_UPLOADS, destName);
  fs.copyFileSync(srcPath, destPath);
  console.log(`  [COPIED] -> ${destName} (${fs.statSync(destPath).size} bytes)`);
  return `/uploads/${destName}`;
}

// Helper to merge multiple PDFs into one
async function mergePdfs(pdfPaths, destName) {
  const mergedPdf = await PDFDocument.create();
  for (const p of pdfPaths) {
    const bytes = fs.readFileSync(p);
    const pdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  const mergedBytes = await mergedPdf.save();
  const destPath = path.join(TARGET_UPLOADS, destName);
  fs.writeFileSync(destPath, mergedBytes);
  console.log(`  [MERGED] -> ${destName} (${mergedBytes.length} bytes, from ${pdfPaths.length} files)`);
  return `/uploads/${destName}`;
}

async function uploadMech1_1() {
  console.log("==================================================");
  console.log("STARTING MECHANICAL ENGINEERING (ME) 1-1 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Uploads Destination:", TARGET_UPLOADS);
  console.log("==================================================");

  if (!fs.existsSync(TARGET_UPLOADS)) {
    fs.mkdirSync(TARGET_UPLOADS, { recursive: true });
  }

  console.log("\nConnecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully!\n");

  const results = {
    notes: [],
    labs: [],
    empty: [],
  };

  // =========================================================================
  // 1. LAB PROGRAMS (Upload to `labprograms` collection)
  // =========================================================================
  console.log("--- PROCESSING LAB PROGRAMS ---");

  // 1.1 Electrical & Electronics Engineering Workshop (23A02101P)
  const eeeLabDir = path.join(SOURCE_BASE, "23A02101P(Electrical & Electronics Engineering)1.5");
  if (fs.existsSync(eeeLabDir)) {
    console.log(`\nProcessing: 23A02101P (Electrical & Electronics Engineering Lab)`);
    const u1Src = path.join(eeeLabDir, "Unit_I_Semiconductor_Devices.pdf");
    const u2Src = path.join(eeeLabDir, "Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf");
    const u3Src = path.join(eeeLabDir, "Unit_III_Digital_Electronics.pdf");

    const u1Url = copyFileSafe(u1Src, "23A02101P_Unit_I_Semiconductor_Devices.pdf");
    const u2Url = copyFileSafe(u2Src, "23A02101P_Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf");
    const u3Url = copyFileSafe(u3Src, "23A02101P_Unit_III_Digital_Electronics.pdf");

    // Merge into full lab manual
    const mergedLabUrl = await mergePdfs(
      [u1Src, u2Src, u3Src],
      "23A02101P_Electrical_and_Electronics_Engineering_Workshop_Lab_Manual.pdf"
    );

    // Upsert in LabProgram
    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "1-1", subjectCode: "23A02101P" },
      {
        title: "Electrical & Electronics Engineering Lab",
        branch: "ME",
        semester: "1-1",
        regulation: "R23",
        subject: "Electrical & Electronics Engineering Workshop",
        subjectCode: "23A02101P",
        description:
          "Practical experiments manual covering Semiconductor Devices, Basic Electronic Circuits & Instrumentation, and Digital Electronics.",
        pdfUrl: mergedLabUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [LAB DB] Upserted LabProgram: ${labDoc._id} - ${labDoc.title}`);
    results.labs.push({ code: "23A02101P", name: labDoc.title, file: mergedLabUrl });

    // Also upsert in Note collection (so students browsing Notes can access unit-by-unit)
    const noteDoc = await Note.findOneAndUpdate(
      { branch: "ME", semester: "1-1", subjectCode: "23A02101P" },
      {
        title: "Notes",
        branch: "ME",
        semester: "1-1",
        regulation: "R23",
        subject: "Electrical & Electronics Engineering",
        subjectCode: "23A02101P",
        credits: "1.5",
        module1: "Semiconductor Devices",
        module1Pdf: u1Url,
        module2: "Basic Electronic Circuits and Instrumentation",
        module2Pdf: u2Url,
        module3: "Digital Electronics",
        module3Pdf: u3Url,
        module4: "",
        module4Pdf: "",
        module5: "",
        module5Pdf: "",
        pdfUrl: mergedLabUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [NOTE DB] Also cross-linked in Notes: ${noteDoc._id} - ${noteDoc.subject}`);
  }

  // 1.2 Computer Programming Lab (23A05101P)
  const cLabDir = path.join(SOURCE_BASE, "23A05101P(computer programming lab)1.5");
  if (fs.existsSync(cLabDir)) {
    console.log(`\nProcessing: 23A05101P (Computer Programming Lab)`);
    const cLabSrc = path.join(cLabDir, "C_Programming_Lab_Programs_and_Output.pdf");
    const cLabUrl = copyFileSafe(cLabSrc, "23A05101P_Computer_Programming_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "1-1", subjectCode: "23A05101P" },
      {
        title: "Computer Programming Lab",
        branch: "ME",
        semester: "1-1",
        regulation: "R23",
        subject: "Computer Programming Lab",
        subjectCode: "23A05101P",
        description:
          "C Programming Lab experiments, algorithm walkthroughs, programs, and execution output references.",
        pdfUrl: cLabUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [LAB DB] Upserted LabProgram: ${labDoc._id} - ${labDoc.title}`);
    results.labs.push({ code: "23A05101P", name: labDoc.title, file: cLabUrl });
  }

  // 1.3 Engineering Physics Lab (23A56101P)
  const physLabDir = path.join(SOURCE_BASE, "23A56101P(Engineering Physics Lab)1");
  if (fs.existsSync(physLabDir)) {
    console.log(`\nProcessing: 23A56101P (Engineering Physics Lab)`);
    const physLabSrc = path.join(physLabDir, "Engineering_Physics_Lab_Notes.pdf");
    const physLabUrl = copyFileSafe(physLabSrc, "23A56101P_Engineering_Physics_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "1-1", subjectCode: "23A56101P" },
      {
        title: "Engineering Physics Lab",
        branch: "ME",
        semester: "1-1",
        regulation: "R23",
        subject: "Engineering Physics Lab",
        subjectCode: "23A56101P",
        description:
          "Official Engineering Physics laboratory experiment records, formulas, calculations, and viva questions.",
        pdfUrl: physLabUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [LAB DB] Upserted LabProgram: ${labDoc._id} - ${labDoc.title}`);
    results.labs.push({ code: "23A56101P", name: labDoc.title, file: physLabUrl });
  }

  // =========================================================================
  // 2. THEORY NOTES (Upload to `notes` collection)
  // =========================================================================
  console.log("\n--- PROCESSING THEORY NOTES ---");

  // 2.1 Basic Electrical & Electronics Engineering (23A02101T)
  const beeeDir = path.join(SOURCE_BASE, "23A02101T(Basic Electrical & Electronics)3");
  if (fs.existsSync(beeeDir)) {
    console.log(`\nProcessing: 23A02101T (Basic Electrical & Electronics Engineering)`);
    const u1Src = path.join(beeeDir, "BEEE_Unit1_DC_and_AC_Circuits.pdf");
    const u2Src = path.join(beeeDir, "BEEE_Unit2_Machines_and_Measuring_Instruments.pdf");
    const u3Src = path.join(beeeDir, "BEEE_Unit3_Energy_Resources_Bill_and_Safety.pdf");

    const u1Url = copyFileSafe(u1Src, "23A02101T_Unit_1_DC_and_AC_Circuits.pdf");
    const u2Url = copyFileSafe(u2Src, "23A02101T_Unit_2_Machines_and_Measuring_Instruments.pdf");
    const u3Url = copyFileSafe(u3Src, "23A02101T_Unit_3_Energy_Resources_Bill_and_Safety.pdf");

    const mergedUrl = await mergePdfs(
      [u1Src, u2Src, u3Src],
      "23A02101T_Basic_Electrical_and_Electronics_Engineering_Complete_Notes.pdf"
    );

    const noteDoc = await Note.findOneAndUpdate(
      { branch: "ME", semester: "1-1", subjectCode: "23A02101T" },
      {
        title: "Notes",
        branch: "ME",
        semester: "1-1",
        regulation: "R23",
        subject: "Basic Electrical & Electronics",
        subjectCode: "23A02101T",
        credits: "3",
        description: "Comprehensive lecture notes for Basic Electrical & Electronics Engineering.",
        module1: "DC and AC Circuits",
        module1Pdf: u1Url,
        module2: "Machines and Measuring Instruments",
        module2Pdf: u2Url,
        module3: "Energy Resources, Bill and Safety",
        module3Pdf: u3Url,
        module4: "",
        module4Pdf: "",
        module5: "",
        module5Pdf: "",
        pdfUrl: mergedUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [NOTE DB] Upserted Note: ${noteDoc._id} - ${noteDoc.subject}`);
    results.notes.push({ code: "23A02101T", name: noteDoc.subject, units: 3 });
  }

  // 2.2 Engineering Graphics (23A03101T)
  const egDir = path.join(SOURCE_BASE, "23A03101T(Engineering Graphics)3");
  if (fs.existsSync(egDir)) {
    console.log(`\nProcessing: 23A03101T (Engineering Graphics)`);
    const u1Src = path.join(egDir, "Unit_1_Drawing_Basics_Curves_Scales.pdf");
    const u2Src = path.join(egDir, "Unit_2_Orthographic_Projections_Points_Lines_Planes.pdf");
    const u3Src = path.join(egDir, "Unit_3_Projections_of_Solids.pdf");
    const u4Src = path.join(egDir, "Unit_4_Sections_and_Development_of_Surfaces.pdf");
    const u5Src = path.join(egDir, "Unit_5_Conversion_of_Views.pdf");

    const u1Url = copyFileSafe(u1Src, "23A03101T_Unit_1_Drawing_Basics_Curves_Scales.pdf");
    const u2Url = copyFileSafe(u2Src, "23A03101T_Unit_2_Orthographic_Projections_Points_Lines_Planes.pdf");
    const u3Url = copyFileSafe(u3Src, "23A03101T_Unit_3_Projections_of_Solids.pdf");
    const u4Url = copyFileSafe(u4Src, "23A03101T_Unit_4_Sections_and_Development_of_Surfaces.pdf");
    const u5Url = copyFileSafe(u5Src, "23A03101T_Unit_5_Conversion_of_Views.pdf");

    const mergedUrl = await mergePdfs(
      [u1Src, u2Src, u3Src, u4Src, u5Src],
      "23A03101T_Engineering_Graphics_Complete_Notes.pdf"
    );

    const noteDoc = await Note.findOneAndUpdate(
      { branch: "ME", semester: "1-1", subjectCode: "23A03101T" },
      {
        title: "Notes",
        branch: "ME",
        semester: "1-1",
        regulation: "R23",
        subject: "Engineering Graphics",
        subjectCode: "23A03101T",
        credits: "3",
        description: "Official notes and step-by-step constructions for Engineering Graphics.",
        module1: "Drawing Basics, Curves and Scales",
        module1Pdf: u1Url,
        module2: "Orthographic Projections - Points, Lines, Planes",
        module2Pdf: u2Url,
        module3: "Projections of Solids",
        module3Pdf: u3Url,
        module4: "Sections and Development of Surfaces",
        module4Pdf: u4Url,
        module5: "Conversion of Views",
        module5Pdf: u5Url,
        pdfUrl: mergedUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [NOTE DB] Upserted Note: ${noteDoc._id} - ${noteDoc.subject}`);
    results.notes.push({ code: "23A03101T", name: noteDoc.subject, units: 5 });
  }

  // 2.3 Introduction to Programming (23A05101T)
  const cProgDir = path.join(SOURCE_BASE, "23A05101T(Introduction to Programming)3");
  if (fs.existsSync(cProgDir)) {
    console.log(`\nProcessing: 23A05101T (Introduction to Programming)`);
    const u1Src = path.join(cProgDir, "Unit_1_Introduction_to_Programming_and_Problem_Solving.pdf");
    const u2Src = path.join(cProgDir, "Unit_2_Control_Structures.pdf");
    const u3Src = path.join(cProgDir, "Unit_3_Arrays_and_Strings.pdf");
    const u4Src = path.join(cProgDir, "Unit_4_Pointers_and_User_Defined_Data_Types.pdf");
    const u5Src = path.join(cProgDir, "Unit_5_Functions_and_File_Handling.pdf");

    const u1Url = copyFileSafe(u1Src, "23A05101T_Unit_1_Introduction_to_Programming_and_Problem_Solving.pdf");
    const u2Url = copyFileSafe(u2Src, "23A05101T_Unit_2_Control_Structures.pdf");
    const u3Url = copyFileSafe(u3Src, "23A05101T_Unit_3_Arrays_and_Strings.pdf");
    const u4Url = copyFileSafe(u4Src, "23A05101T_Unit_4_Pointers_and_User_Defined_Data_Types.pdf");
    const u5Url = copyFileSafe(u5Src, "23A05101T_Unit_5_Functions_and_File_Handling.pdf");

    const mergedUrl = await mergePdfs(
      [u1Src, u2Src, u3Src, u4Src, u5Src],
      "23A05101T_Introduction_to_Programming_Complete_Notes.pdf"
    );

    const noteDoc = await Note.findOneAndUpdate(
      { branch: "ME", semester: "1-1", subjectCode: "23A05101T" },
      {
        title: "Notes",
        branch: "ME",
        semester: "1-1",
        regulation: "R23",
        subject: "Introduction to Programming",
        subjectCode: "23A05101T",
        credits: "3",
        description: "Complete module-wise notes for C Programming and Problem Solving.",
        module1: "Introduction to Programming and Problem Solving",
        module1Pdf: u1Url,
        module2: "Control Structures",
        module2Pdf: u2Url,
        module3: "Arrays and Strings",
        module3Pdf: u3Url,
        module4: "Pointers and User Defined Data Types",
        module4Pdf: u4Url,
        module5: "Functions and File Handling",
        module5Pdf: u5Url,
        pdfUrl: mergedUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [NOTE DB] Upserted Note: ${noteDoc._id} - ${noteDoc.subject}`);
    results.notes.push({ code: "23A05101T", name: noteDoc.subject, units: 5 });
  }

  // 2.4 Engineering Physics (23A56101T)
  const physDir = path.join(SOURCE_BASE, "23A56101T(Engineering Physics)3");
  if (fs.existsSync(physDir)) {
    console.log(`\nProcessing: 23A56101T (Engineering Physics)`);
    const u1Src = path.join(physDir, "Unit_I_Wave_Optics.pdf");
    const u2Src = path.join(physDir, "Unit_II_Crystallography_XRD.pdf");
    const u3Src = path.join(physDir, "Unit_III_Dielectric_Magnetic_Materials.pdf");
    const u4Src = path.join(physDir, "Unit_IV_Quantum_Mechanics_Free_Electron_Theory.pdf");
    const u5Src = path.join(physDir, "Unit_V_Semiconductors.pdf");

    const u1Url = copyFileSafe(u1Src, "23A56101T_Unit_1_Wave_Optics.pdf");
    const u2Url = copyFileSafe(u2Src, "23A56101T_Unit_2_Crystallography_XRD.pdf");
    const u3Url = copyFileSafe(u3Src, "23A56101T_Unit_3_Dielectric_Magnetic_Materials.pdf");
    const u4Url = copyFileSafe(u4Src, "23A56101T_Unit_4_Quantum_Mechanics_Free_Electron_Theory.pdf");
    const u5Url = copyFileSafe(u5Src, "23A56101T_Unit_5_Semiconductors.pdf");

    const mergedUrl = await mergePdfs(
      [u1Src, u2Src, u3Src, u4Src, u5Src],
      "23A56101T_Engineering_Physics_Complete_Notes.pdf"
    );

    const noteDoc = await Note.findOneAndUpdate(
      { branch: "ME", semester: "1-1", subjectCode: "23A56101T" },
      {
        title: "Notes",
        branch: "ME",
        semester: "1-1",
        regulation: "R23",
        subject: "Engineering Physics",
        subjectCode: "23A56101T",
        credits: "3",
        description: "Official lecture notes for Engineering Physics covering all 5 syllabus units.",
        module1: "Wave Optics",
        module1Pdf: u1Url,
        module2: "Crystallography & XRD",
        module2Pdf: u2Url,
        module3: "Dielectric & Magnetic Materials",
        module3Pdf: u3Url,
        module4: "Quantum Mechanics & Free Electron Theory",
        module4Pdf: u4Url,
        module5: "Semiconductors",
        module5Pdf: u5Url,
        pdfUrl: mergedUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [NOTE DB] Upserted Note: ${noteDoc._id} - ${noteDoc.subject}`);
    results.notes.push({ code: "23A56101T", name: noteDoc.subject, units: 5 });
  }

  // 2.5 Empty folder check: 23A54101 (Linear Algebra & Calculus)
  const laDir = path.join(SOURCE_BASE, "23A54101(Linear Algebra & Calculus)3");
  if (fs.existsSync(laDir)) {
    const files = fs.readdirSync(laDir);
    if (files.length === 0) {
      console.log(`\nNote: Directory 23A54101(Linear Algebra & Calculus)3 exists but contains 0 files.`);
      results.empty.push("23A54101 (Linear Algebra & Calculus)");
    }
  }

  console.log("\n==================================================");
  console.log("INGESTION COMPLETED SUCCESSFULLY!");
  console.log(`Total Theory Notes Added: ${results.notes.length}`);
  console.log(`Total Lab Programs Added: ${results.labs.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
}

uploadMech1_1().catch((err) => {
  console.error("FATAL ERROR during upload:", err);
  process.exit(1);
});
