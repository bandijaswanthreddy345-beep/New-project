const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\mech notes\\2-2";
const TARGET_UPLOADS = path.join(__dirname, "../uploads");

// Helper to copy a file safely
function copyFileSafe(srcPath, destName) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file does not exist: ${srcPath}`);
  }
  const destPath = path.join(TARGET_UPLOADS, destName);
  fs.copyFileSync(srcPath, destPath);
  const size = fs.statSync(destPath).size;
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
  const destPath = path.join(TARGET_UPLOADS, destName);
  fs.writeFileSync(destPath, mergedBytes);
  console.log(
    `  [MERGED] -> ${destName} (${(mergedBytes.length / 1024).toFixed(1)} KB, from ${pdfPaths.length} files)`
  );
  return `/uploads/${destName}`;
}

async function uploadMech2_2() {
  console.log("==================================================");
  console.log("STARTING MECHANICAL ENGINEERING (ME) 2-2 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Uploads Destination:", TARGET_UPLOADS);
  console.log("==================================================");

  if (!fs.existsSync(SOURCE_BASE)) {
    throw new Error(`Source directory not found: ${SOURCE_BASE}`);
  }

  if (!fs.existsSync(TARGET_UPLOADS)) {
    fs.mkdirSync(TARGET_UPLOADS, { recursive: true });
  }

  console.log("\nConnecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully!\n");

  const results = {
    notes: [],
    labs: [],
    errors: [],
  };

  // =========================================================================
  // 1. LAB PROGRAMS
  // =========================================================================
  console.log("\n--- PROCESSING LAB PROGRAMS ---");

  // 1.1 Manufacturing Processes Lab (23A03401P)
  try {
    const dir = path.join(SOURCE_BASE, "23A03401P Manufacturing processes Lab");
    console.log(`\nProcessing: 23A03401P (Manufacturing Processes Lab)`);
    const pdfSrc = path.join(dir, "Manufacturing_Processes_Lab_23A03401P.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A03401P_Manufacturing_Processes_Lab.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "2-2", subjectCode: "23A03401P" },
      {
        title: "Manufacturing Processes Lab",
        branch: "ME",
        regulation: "R23",
        semester: "2-2",
        subject: "Manufacturing Processes Lab",
        subjectCode: "23A03401P",
        description: "Comprehensive R23 Lab Manual covering Pattern Making, Foundry, Welding (Arc & Gas), Sheet Metal and Plastic Molding Experiments.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.subject}`);
    results.labs.push(labDoc.subjectCode);

    // Also register in Note collection for complete visibility in Notes tab
    await Note.findOneAndUpdate(
      { branch: "ME", semester: "2-2", subjectCode: "23A03401P" },
      {
        title: "Notes",
        branch: "ME",
        semester: "2-2",
        regulation: "R23",
        subject: "Manufacturing Processes Lab",
        subjectCode: "23A03401P",
        credits: "1.5",
        description: "Comprehensive R23 Lab Manual covering Pattern Making, Foundry, Welding (Arc & Gas), Sheet Metal and Plastic Molding Experiments.",
        module1: "Manufacturing Processes Lab Manual",
        module1Pdf: pdfUrl,
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("  [ERROR LAB 23A03401P]:", err.message);
    results.errors.push({ item: "23A03401P", error: err.message });
  }

  // 1.2 Fluid Mechanics & Hydraulic Machines Lab (23A03402P)
  try {
    const dir = path.join(SOURCE_BASE, "23A03402P Fluid Mechanics & Hydraulic Machines Lab");
    console.log(`\nProcessing: 23A03402P (Fluid Mechanics & Hydraulic Machines Lab)`);
    const pdfSrc = path.join(dir, "Fluid_Mechanics_Hydraulic_Machinery_Lab_23A03402P.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A03402P_Fluid_Mechanics_Hydraulic_Machinery_Lab.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "2-2", subjectCode: "23A03402P" },
      {
        title: "Fluid Mechanics and Hydraulic Machinery Lab",
        branch: "ME",
        regulation: "R23",
        semester: "2-2",
        subject: "Fluid Mechanics and Hydraulic Machinery Lab",
        subjectCode: "23A03402P",
        description: "Comprehensive R23 Lab Manual covering Venturimeter, Orifice meter, Pipe Friction, Pelton Wheel, Francis Turbine, and Centrifugal & Reciprocating Pumps.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.subject}`);
    results.labs.push(labDoc.subjectCode);

    // Also register in Note collection
    await Note.findOneAndUpdate(
      { branch: "ME", semester: "2-2", subjectCode: "23A03402P" },
      {
        title: "Notes",
        branch: "ME",
        semester: "2-2",
        regulation: "R23",
        subject: "Fluid Mechanics and Hydraulic Machinery Lab",
        subjectCode: "23A03402P",
        credits: "1.5",
        description: "Comprehensive R23 Lab Manual covering Venturimeter, Orifice meter, Pipe Friction, Pelton Wheel, Francis Turbine, and Centrifugal & Reciprocating Pumps.",
        module1: "Fluid Mechanics & Hydraulic Machines Lab Manual",
        module1Pdf: pdfUrl,
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("  [ERROR LAB 23A03402P]:", err.message);
    results.errors.push({ item: "23A03402P", error: err.message });
  }

  // =========================================================================
  // 2. THEORY SUBJECTS (NOTES)
  // =========================================================================
  console.log("\n--- PROCESSING THEORY SUBJECTS ---");

  const theorySubjects = [
    {
      code: "23A03401T",
      title: "Manufacturing Processes",
      subject: "Manufacturing Processes",
      credits: "3",
      folder: "23A03401T Manufacturing processes",
      description: "JNTUA R23 Manufacturing Processes complete course notes covering Casting, Welding, Bulk Forming, Sheet Metal Working, HERF and Additive Manufacturing.",
      modules: [
        "Unit 1: Casting Processes & Pattern Making",
        "Unit 2: Welding & Joining Technologies",
        "Unit 3: Bulk Forming Processes",
        "Unit 4: Sheet Metal Forming & HERF",
        "Unit 5: Additive Manufacturing & 3D Printing",
      ],
      files: [
        "Unit1_Casting_Notes.pdf",
        "Unit2_Welding_Notes.pdf",
        "Unit3_Bulk_Forming_Notes.pdf",
        "Unit4_Sheet_Metal_HERF_Notes.pdf",
        "Unit5_Additive_Manufacturing_Notes.pdf",
      ],
    },
    {
      code: "23A03402T",
      title: "Fluid Mechanics & Hydraulic Machines",
      subject: "Fluid Mechanics and Hydraulic Machines",
      credits: "3",
      folder: "23A03402T Fluid Mechanics & Hydraulic Machines",
      description: "JNTUA R23 Fluid Mechanics and Hydraulic Machines complete study material covering Fluid Statics, Kinematics, Dynamics, Boundary Layer, Turbines, Pumps and Hydraulic Systems.",
      modules: [
        "Unit 1: Fluid Statics & Buoyancy",
        "Unit 2: Fluid Kinematics, Dynamics & Pipe Flow",
        "Unit 3: Boundary Layer & Dimensional Analysis",
        "Unit 4: Jets on Vanes & Hydraulic Turbines",
        "Unit 5: Turbine Performance, Pumps & Hydraulic Systems",
      ],
      files: [
        "Unit_1_Fluid_Statics_and_Buoyancy.pdf",
        "Unit_2_Fluid_Kinematics_Dynamics_and_Pipe_Flow.pdf",
        "Unit_3_Boundary_Layer_and_Dimensional_Analysis.pdf",
        "Unit_4_Jets_on_Vanes_and_Hydraulic_Turbines.pdf",
        "Unit_5_Turbine_Performance_Pumps_and_Hydraulic_Systems.pdf",
      ],
    },
    {
      code: "23A03403",
      title: "Theory of Machines",
      subject: "Theory of Machines",
      credits: "3",
      folder: "23A03403 Theory of Machines",
      description: "JNTUA R23 Theory of Machines complete lecture notes covering Simple Mechanisms, Plane Motion Analysis, Gyroscope & Gears, Balancing & Cams, and Vibrations & Flywheels.",
      modules: [
        "Unit 1: Simple Mechanisms",
        "Unit 2: Plane Motion Analysis",
        "Unit 3: Gyroscopes & Gear Trains",
        "Unit 4: Balancing of Masses & Cams",
        "Unit 5: Mechanical Vibrations & Flywheels",
      ],
      files: [
        "TOM_Unit_1_Simple_Mechanisms.pdf",
        "TOM_Unit_2_Plane_Motion_Analysis.pdf",
        "TOM_Unit_3_Gyroscope_and_Gears.pdf",
        "TOM_Unit_4_Balancing_and_Cams.pdf",
        "TOM_Unit_5_Vibrations_and_Flywheels.pdf",
      ],
    },
    {
      code: "23A52402d",
      title: "Industrial Management",
      subject: "Industrial Management",
      credits: "3",
      folder: "23A52402d Industrial Management",
      description: "JNTUA R23 Humanities & Social Science elective complete handwritten notes on Management Concepts, Plant Layout, Work Study, Operations Management and Project Network Analysis.",
      modules: [
        "Unit 1: Introduction to Management & Organization",
        "Unit 2: Plant Location & Plant Layout",
        "Unit 3: Work Study & Method Study",
        "Unit 4: Materials Management & Quality Control",
        "Unit 5: Project Management (PERT & CPM)",
      ],
      files: [
        "23A52402d_IndustrialManagement_Unit1_Handwritten_Notes.pdf",
        "23A52402d_IndustrialManagement_Unit2_Handwritten_Notes.pdf",
        "23A52402d_IndustrialManagement_Unit3_Handwritten_Notes.pdf",
        "23A52402d_IndustrialManagement_Unit4_Handwritten_Notes.pdf",
        "23A52402d_IndustrialManagement_Unit5_Handwritten_Notes.pdf",
      ],
    },
    {
      code: "23A54403",
      title: "Complex Variables, Probability and Statistics",
      subject: "Complex Variables Probability and Statistics",
      credits: "3",
      folder: "23A54403 Complex Variables, Probability and Statistics",
      description: "JNTUA R23 Mathematics foundation notes covering Analytic Functions, Complex Integration & Residues, Probability Distributions, Sampling Theory and Tests of Hypotheses.",
      modules: [
        "Unit 1: Functions of a Complex Variable",
        "Unit 2: Complex Integration, Taylor & Laurent Series",
        "Unit 3: Calculus of Residues & Contour Integration",
        "Unit 4: Probability Distributions",
        "Unit 5: Sampling Distributions & Hypothesis Testing",
      ],
      files: [
        "unit-1.pdf",
        "Unit2_CVPS_23A54403.pdf",
        "Unit3_CVPS_23A54403.pdf",
        "Unit4_CVPS_23A54403.pdf",
        "Unit5_CVPS_23A54403.pdf",
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
        { branch: "ME", semester: "2-2", subjectCode: sub.code },
        {
          title: "Notes",
          branch: "ME",
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
  console.log("INGESTION SUMMARY");
  console.log(`Labs Uploaded: ${results.labs.length}`);
  console.log(`Notes Uploaded: ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. Done!");
}

uploadMech2_2().catch((err) => {
  console.error("FATAL ERROR in uploadMech2_2:", err);
  process.exit(1);
});
