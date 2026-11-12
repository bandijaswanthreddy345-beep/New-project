const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\civil notes\\3-1";
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

async function uploadCivil3_1() {
  console.log("==================================================");
  console.log("STARTING CIVIL ENGINEERING (CE) 3-1 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Target Uploads:", TARGET_UPLOADS);
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const results = { labs: [], notes: [], errors: [] };

  // =========================================================================
  // 1. LAB PROGRAMS (LABS) - EXCLUSIVELY LABPROGRAM COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 3-1 LAB MANUALS ---");

  // 1.1 Geotechnical Engineering Lab (23A01503P)
  try {
    const dir = path.join(SOURCE_BASE, "23A01503P Geotechnical Engineering Lab");
    console.log(`\nProcessing Lab: Geotechnical Engineering Lab`);
    const pdfSrc = path.join(dir, "Geotechnical_Engineering_Lab_23A01503P_Manual.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01503P_Geotechnical_Engineering_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "3-1", subjectCode: "23A01503P" },
      {
        title: "Geotechnical Engineering Lab",
        branch: "CE",
        regulation: "R23",
        semester: "3-1",
        subject: "Geotechnical Engineering Lab",
        subjectCode: "23A01503P",
        description: "JNTUA R23 Geotechnical Engineering Laboratory Manual covering Atterberg Limits (Liquid & Plastic limits), Field Density determination (Core cutter & Sand replacement), Grain Size Distribution (Sieve Analysis), Permeability tests (Constant & Falling Head), Compaction test (Standard Proctor), and Direct Shear & Unconfined Compression tests.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 3-1)`);
    results.labs.push("23A01503P");
  } catch (err) {
    console.error("  [ERROR LAB 23A01503P]:", err.message);
    results.errors.push({ item: "23A01503P", error: err.message });
  }

  // 1.2 Fluid Mechanics and Hydraulic Machines Lab (23A01506)
  try {
    const dir = path.join(SOURCE_BASE, "23A01506 Fluid Mechanics Hydraulic Machines Lab(1.5)");
    console.log(`\nProcessing Lab: Fluid Mechanics and Hydraulic Machines Lab`);
    const pdfSrc = path.join(dir, "Fluid_Mechanics_Hydraulic_Machines_Lab_23A01506_Manual.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01506_Fluid_Mechanics_Hydraulic_Machines_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "3-1", subjectCode: "23A01506" },
      {
        title: "Fluid Mechanics and Hydraulic Machines Lab",
        branch: "CE",
        regulation: "R23",
        semester: "3-1",
        subject: "Fluid Mechanics and Hydraulic Machines Lab",
        subjectCode: "23A01506",
        description: "JNTUA R23 Fluid Mechanics and Hydraulic Machinery Laboratory manual covering Calibration of Venturimeter & Orifice meter, Determination of friction factor in pipes, Loss of head in pipe fittings, Impact of jet on vanes, and Performance characteristics of Pelton wheel, Francis turbine, Centrifugal pump and Reciprocating pump.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 3-1)`);
    results.labs.push("23A01506");
  } catch (err) {
    console.error("  [ERROR LAB 23A01506]:", err.message);
    results.errors.push({ item: "23A01506", error: err.message });
  }

  // 1.3 Estimation, Specifications, Costing & Valuation (23A01507)
  try {
    const dir = path.join(SOURCE_BASE, "23A01507 Estimation, Specifications, Costing & Valuation(2)");
    console.log(`\nProcessing Lab/Practice: Estimation, Specifications, Costing & Valuation`);
    const pdfSrc = path.join(dir, "Estimation_Specifications_Costing_Valuation_Lab_23A01507_Manual.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01507_Estimation_Specifications_Costing_Valuation_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "3-1", subjectCode: "23A01507" },
      {
        title: "Estimation, Specifications, Costing and Valuation",
        branch: "CE",
        regulation: "R23",
        semester: "3-1",
        subject: "Estimation, Specifications, Costing and Valuation",
        subjectCode: "23A01507",
        description: "JNTUA R23 Practical Laboratory and Studio Manual covering General and Detailed Specifications of Civil Engineering Works, Rate Analysis for standard items, Detailed Quantity Estimation of Residential Buildings (Individual Wall & Center Line Methods), Culverts & Retaining Walls, and Valuation of Real Properties.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 3-1)`);
    results.labs.push("23A01507");
  } catch (err) {
    console.error("  [ERROR LAB 23A01507]:", err.message);
    results.errors.push({ item: "23A01507", error: err.message });
  }

  // =========================================================================
  // 2. THEORY SUBJECTS (NOTES) - EXCLUSIVELY NOTE COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 3-1 THEORY SUBJECTS (NOTES) ---");

  const theorySubjects = [
    {
      code: "23A01501",
      title: "Water Resources Engineering",
      subject: "Water Resources Engineering",
      credits: "3",
      folder: "23A01501 Water Resources Engineering(3)",
      description: "JNTUA R23 Water Resources Engineering lecture notes covering Hydrology & Hydrologic Cycle, Hydrograph Analysis & Groundwater Hydraulics, Irrigation & Water Requirements of Crops, Unlined & Lined Canal Design (Kennedy's & Lacey's Theories), and Diversion Headworks & Gravity Dams.",
      modules: [
        "Unit 1: Introduction to Hydrology, Precipitation and Infiltration",
        "Unit 2: Hydrograph Analysis, Unit Hydrograph and Ground Water",
        "Unit 3: Irrigation and Water Requirement of Crops",
        "Unit 4: Canal Design, Silt Theories, Waterlogging and Lining",
        "Unit 5: Diversion Head Works and Weir/Barrage Design",
      ],
      files: [
        "Unit_1_Introduction_to_Hydrology.pdf",
        "Unit_2_Hydrograph_Analysis_and_Ground_Water.pdf",
        "Unit_3_Irrigation_and_Water_Requirement_of_Crops.pdf",
        "Unit_4_Channels_Silt_Theories_Waterlogging_Canal_Lining.pdf",
        "Unit_5_Diversion_Head_Works.pdf",
      ],
    },
    {
      code: "23A01502",
      title: "Design of Reinforced Concrete Structures",
      subject: "Design of Reinforced Concrete Structures",
      credits: "3",
      folder: "23A01502 Design Of Reinforced Concrete Structures(3)",
      description: "JNTUA R23 Design of Reinforced Concrete Structures (Limit State Method IS 456:2000) notes covering Design Philosophy & Flexure of Singly/Doubly Reinforced Beams, Flanged Beams (T & L Beams) & Shear/Torsion Design, One-Way & Two-Way Slabs, Short & Slender Axially Loaded Columns & Footings, and Serviceability Limit States & Staircase Design.",
      modules: [
        "Unit 1: Limit State Method, Working Stress vs LSM, Singly & Doubly Beams",
        "Unit 2: Flanged Beams, Shear Reinforcement and Torsion Design",
        "Unit 3: Design of One-Way and Two-Way Slabs",
        "Unit 4: Axially Loaded Short Columns and Isolated Footings",
        "Unit 5: Limit State of Serviceability (Deflection & Cracking) and Staircases",
      ],
      files: [
        "RC_Unit1_Methods_of_Design.pdf",
        "RC_Unit2_Flanged_Beams_Shear_Torsion.pdf",
        "RC_Unit3_Slabs.pdf",
        "RC_Unit4_Columns_and_Footings.pdf",
        "RC_Unit5_Serviceability_Staircases.pdf",
      ],
    },
    {
      code: "23A01503T",
      title: "Geotechnical Engineering",
      subject: "Geotechnical Engineering",
      credits: "3",
      folder: "23A01503T Geotechnical Engineering(3)",
      description: "JNTUA R23 Geotechnical Engineering notes covering Soil Origin & Index Properties (Phase Relationships, Classification), Soil Water Permeability & Seepage (Flow Nets), Stress Distribution (Boussinesq & Westergaard) & Soil Compaction, 1D Consolidation Theory & Settlement, and Shear Strength of Soils (Mohr-Coulomb Failure Criteria).",
      modules: [
        "Unit 1: Origin of Soils, Phase Relationships and Soil Classification",
        "Unit 2: Permeability, Seepage Analysis and Flow Nets",
        "Unit 3: Stress Distribution in Soils and Soil Compaction",
        "Unit 4: One-Dimensional Consolidation and Settlement",
        "Unit 5: Shear Strength of Soils and Laboratory Testing",
      ],
      files: [
        "Unit_1_Introduction_and_Index_Properties.pdf",
        "Unit_2_Permeability_and_Seepage.pdf",
        "Unit_3_Stress_Distribution_and_Compaction.pdf",
        "Unit_4_Consolidation.pdf",
        "Unit_5_Shear_Strength_of_Soils.pdf",
      ],
    },
    {
      code: "23A01504a",
      title: "Pre-stressed Concrete",
      subject: "Pre-stressed Concrete",
      credits: "3",
      folder: "23A01504a Pre-stressed Concrete(3)",
      description: "JNTUA R23 Professional Elective I: Pre-stressed Concrete notes covering Principles of Pre-stressing & High Strength Materials, Pre-tensioning & Post-tensioning Systems & Losses of Prestress, Analysis & Design for Flexure and Shear, Deflection Analysis of Pre-stressed Beams, and Composite Pre-stressed Concrete Beams.",
      modules: [
        "Unit 1: Introduction, Historic Development, Systems and Materials",
        "Unit 2: Losses of Pre-stress (Elastic, Creep, Shrinkage, Relaxation)",
        "Unit 3: Flexure Analysis, Permissible Stresses and Shear Design",
        "Unit 4: Deflections of Pre-stressed Concrete Members",
        "Unit 5: Analysis and Design of Composite Structural Sections",
      ],
      files: [
        "Unit1_Introduction.pdf",
        "Unit2_Losses_of_Prestress.pdf",
        "Unit3_Flexure_and_Shear.pdf",
        "Unit4_Deflections.pdf",
        "Unit5_Composite_Beams.pdf",
      ],
    },
    {
      code: "23A01504b",
      title: "Air Pollution and Control",
      subject: "Air Pollution and Control",
      credits: "3",
      folder: "23A01504b Air Pollution and Control(3)",
      description: "JNTUA R23 Professional Elective I: Air Pollution and Control study material covering Sources & Classification of Air Pollutants & Effects, Meteorology & Plume Dispersion (Lapse Rates, Inversions), Particulate Control Technologies (Cyclones, ESP, Baghouses), Gaseous Pollutant Control (Absorption, Adsorption, Catalytic Converters), and Automobile & Indoor Air Pollution & Legislation.",
      modules: [
        "Unit 1: Sources, Classification and Health Effects of Air Pollutants",
        "Unit 2: Meteorology, Atmospheric Stability and Plume Behaviour",
        "Unit 3: Control Technologies for Particulate Pollutants",
        "Unit 4: Control Equipment for Gaseous Emissions (SOx, NOx, VOCs)",
        "Unit 5: Vehicular Emissions, Indoor Air Quality and Environmental Acts",
      ],
      files: [
        "Unit1_Air_Pollution.pdf",
        "Unit2_Meteorology_and_Air_Pollution.pdf",
        "Unit3_Control_of_Particulate_Pollutants.pdf",
        "Unit4_Control_of_Gaseous_Pollutants.pdf",
        "Unit5_Automobile_and_Indoor_Pollution.pdf",
      ],
    },
    {
      code: "23A01504c",
      title: "Environmental Impact Assessment",
      subject: "Environmental Impact Assessment",
      credits: "3",
      folder: "23A01504c Environmental Impact Assessment(3)",
      description: "JNTUA R23 Professional Elective I: Environmental Impact Assessment notes covering EIA Concepts & Methodologies (Checklists, Matrices, Networks), Environmental Setting & Impact Prediction on Soil, Water, Air & Noise, Assessment of Impacts on Vegetation & Wildlife and Risk Assessment, Environmental Auditing & Post Project Monitoring, and Environmental Protection Acts & Clearance Procedures in India.",
      modules: [
        "Unit 1: Concepts and Methodologies of Environmental Impact Assessment",
        "Unit 2: Impact of Developmental Activities on Soil, Water, Air and Land Use",
        "Unit 3: Assessment on Biological Environment, Vegetation, Wildlife and Risk",
        "Unit 4: Environmental Audit, Life Cycle Assessment and Monitoring Plans",
        "Unit 5: Environmental Legislation, EPA 1986 and EIA Notifications in India",
      ],
      files: [
        "EIA_23A01504c_Unit_I_Concepts_and_Methodologies_of_EIA.pdf",
        "EIA_23A01504c_Unit_II_Impact_of_Developmental_Activities_and_Land_Use.pdf",
        "EIA_23A01504c_Unit_III_Vegetation_Wildlife_and_Risk_Assessment.pdf",
        "EIA_23A01504c_Unit_IV_Environmental_Audit.pdf",
        "EIA_23A01504c_Unit_V_Environmental_Acts_and_Notifications.pdf",
      ],
    },
    {
      code: "23A05503",
      title: "Introduction to Quantum Technologies and Applications",
      subject: "Introduction to Quantum Technologies and Applications",
      credits: "3",
      folder: "23A05503 Introduction To Quantum Technologies And applications(3)",
      description: "JNTUA R23 Open Elective I: Introduction to Quantum Technologies complete notes covering Quantum States & Superposition/Entanglement, Quantum Architecture & Qubit Gates, Quantum Algorithms (Shor's, Grover's), Quantum Key Distribution (QKD) & Quantum Cryptography, and Applications in Modern Computational & Physical Engineering.",
      modules: [
        "Unit 1: Fundamentals of Quantum Physics and Qubits",
        "Unit 2: Quantum Gates, Circuits and Architecture",
        "Unit 3: Quantum Algorithms and Computational Complexity",
        "Unit 4: Quantum Cryptography and Quantum Key Distribution (QKD)",
        "Unit 5: Quantum Sensing, Simulation and Engineering Applications",
      ],
      files: [
        "Unit1_Notes.pdf",
        "Unit2_Notes.pdf",
        "Unit3_Notes.pdf",
        "Unit4_Notes.pdf",
        "Unit5_Notes.pdf",
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
        { branch: "CE", semester: "3-1", subjectCode: sub.code },
        {
          title: "Notes",
          branch: "CE",
          semester: "3-1",
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

      console.log(`  [UPSERTED NOTE] ID: ${noteDoc._id} - ${noteDoc.subject} (Sem: 3-1)`);
      results.notes.push(sub.code);
    } catch (err) {
      console.error(`  [ERROR SUBJECT ${sub.code}]:`, err.message);
      results.errors.push({ item: sub.code, error: err.message });
    }
  }

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY (CE 3-1)");
  console.log(`Labs Uploaded (LabProgram collection): ${results.labs.length}`);
  console.log(`Notes Uploaded (Note collection): ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. CE 3-1 Ingestion Done!");
}

uploadCivil3_1().catch(console.error);
