const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\mech notes\\3-2";
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

async function uploadMech3_2() {
  console.log("==================================================");
  console.log("STARTING MECHANICAL ENGINEERING (ME) 3-2 INGESTION");
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

  // 1.1 Heat Transfer Lab (23A03601P)
  try {
    const dir = path.join(SOURCE_BASE, "23A03601P Heat Transfer Lab");
    console.log(`\nProcessing: 23A03601P (Heat Transfer Lab)`);
    const src = path.join(dir, "Heat_Transfer_Lab_Manual.pdf");
    const url = copyFileSafe(src, "23A03601P_Heat_Transfer_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "3-2", subjectCode: "23A03601P" },
      {
        title: "Heat Transfer Lab",
        branch: "ME",
        semester: "3-2",
        regulation: "R23",
        subject: "Heat Transfer Lab",
        subjectCode: "23A03601P",
        description:
          "Official Heat Transfer laboratory manual covering experiments on conduction, natural & forced convection, boiling, condensation, radiation, and heat exchangers.",
        pdfUrl: url,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [LAB DB] Upserted LabProgram: ${labDoc._id} - ${labDoc.title}`);
    results.labs.push({ code: "23A03601P", name: labDoc.title, file: url });

    // Also cross-link in Note collection
    await Note.findOneAndUpdate(
      { branch: "ME", semester: "3-2", subjectCode: "23A03601P" },
      {
        title: "Notes",
        branch: "ME",
        semester: "3-2",
        regulation: "R23",
        subject: "Heat Transfer Lab",
        subjectCode: "23A03601P",
        credits: "1.5",
        description: "Official Heat Transfer laboratory manual covering comprehensive experimental procedures.",
        module1: "Heat Transfer Lab Manual & Experiments",
        module1Pdf: url,
        module2: "",
        module2Pdf: "",
        module3: "",
        module3Pdf: "",
        module4: "",
        module4Pdf: "",
        module5: "",
        module5Pdf: "",
        pdfUrl: url,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("  [ERROR 23A03601P]:", err.message);
    results.errors.push({ code: "23A03601P", error: err.message });
  }

  // 1.2 CAD-CAM Lab (23A03602P)
  try {
    const dir = path.join(SOURCE_BASE, "23A03602P CADCAM Lab");
    console.log(`\nProcessing: 23A03602P (CAD-CAM Lab)`);
    const src = path.join(dir, "CAD_CAM_Lab_Manual.pdf");
    const url = copyFileSafe(src, "23A03602P_CAD_CAM_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "3-2", subjectCode: "23A03602P" },
      {
        title: "CAD-CAM Lab",
        branch: "ME",
        semester: "3-2",
        regulation: "R23",
        subject: "CAD-CAM Lab",
        subjectCode: "23A03602P",
        description:
          "Computer Aided Design and Manufacturing (CAD/CAM) lab manual featuring 2D drafting, 3D parametric part modeling, assembly, and CNC part programming with simulation.",
        pdfUrl: url,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [LAB DB] Upserted LabProgram: ${labDoc._id} - ${labDoc.title}`);
    results.labs.push({ code: "23A03602P", name: labDoc.title, file: url });

    await Note.findOneAndUpdate(
      { branch: "ME", semester: "3-2", subjectCode: "23A03602P" },
      {
        title: "Notes",
        branch: "ME",
        semester: "3-2",
        regulation: "R23",
        subject: "CAD-CAM Lab",
        subjectCode: "23A03602P",
        credits: "1.5",
        description: "Official CAD-CAM laboratory manual covering 3D modeling and CNC programming.",
        module1: "CAD/CAM Lab Manual & Experiments",
        module1Pdf: url,
        module2: "",
        module2Pdf: "",
        module3: "",
        module3Pdf: "",
        module4: "",
        module4Pdf: "",
        module5: "",
        module5Pdf: "",
        pdfUrl: url,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("  [ERROR 23A03602P]:", err.message);
    results.errors.push({ code: "23A03602P", error: err.message });
  }

  // 1.3 3D Printing Lab (23A03607)
  try {
    const dir = path.join(SOURCE_BASE, "23A03607 3 D Printing Lab");
    console.log(`\nProcessing: 23A03607 (3D Printing Lab)`);
    const src = path.join(dir, "3D_Printing_Lab_Manual.pdf");
    const url = copyFileSafe(src, "23A03607_3D_Printing_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "ME", semester: "3-2", subjectCode: "23A03607" },
      {
        title: "3D Printing Lab",
        branch: "ME",
        semester: "3-2",
        regulation: "R23",
        subject: "3D Printing Lab",
        subjectCode: "23A03607",
        description:
          "Skill-oriented additive manufacturing laboratory manual covering 3D CAD modeling, STL slicing software (Cura, PrusaSlicer), FDM 3D printer calibration, support structures, and post-processing.",
        pdfUrl: url,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [LAB DB] Upserted LabProgram: ${labDoc._id} - ${labDoc.title}`);
    results.labs.push({ code: "23A03607", name: labDoc.title, file: url });

    await Note.findOneAndUpdate(
      { branch: "ME", semester: "3-2", subjectCode: "23A03607" },
      {
        title: "Notes",
        branch: "ME",
        semester: "3-2",
        regulation: "R23",
        subject: "3D Printing Lab",
        subjectCode: "23A03607",
        credits: "2",
        description: "Official 3D Printing additive manufacturing laboratory manual and practical exercises.",
        module1: "3D Printing Lab Manual & Slicing Experiments",
        module1Pdf: url,
        module2: "",
        module2Pdf: "",
        module3: "",
        module3Pdf: "",
        module4: "",
        module4Pdf: "",
        module5: "",
        module5Pdf: "",
        pdfUrl: url,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("  [ERROR 23A03607]:", err.message);
    results.errors.push({ code: "23A03607", error: err.message });
  }

  // =========================================================================
  // 2. THEORY NOTES
  // =========================================================================
  console.log("\n--- PROCESSING THEORY NOTES ---");

  // Helper for 5-unit theory notes
  async function processTheory5Units({
    folderName,
    code,
    subjectName,
    credits = "3",
    description,
    moduleNames,
    filePatterns,
  }) {
    console.log(`\nProcessing: ${code} (${subjectName})`);
    const dir = path.join(SOURCE_BASE, folderName);
    const files = fs.readdirSync(dir);

    // Resolve 5 unit files
    const unitPaths = [];
    for (let i = 0; i < 5; i++) {
      const pattern = filePatterns[i];
      let match = null;
      if (typeof pattern === "string") {
        match = files.find((f) => f.toLowerCase() === pattern.toLowerCase());
      } else if (pattern instanceof RegExp) {
        match = files.find((f) => pattern.test(f));
      }
      if (!match) {
        throw new Error(`Unit ${i + 1} file not found matching ${pattern} in ${folderName}`);
      }
      unitPaths.push(path.join(dir, match));
    }

    // Copy individual unit PDFs
    const safeSubj = subjectName.replace(/[^a-zA-Z0-9]/g, "_");
    const unitUrls = [];
    for (let i = 0; i < 5; i++) {
      const destName = `${code}_Unit_${i + 1}_${safeSubj}.pdf`;
      const url = copyFileSafe(unitPaths[i], destName);
      unitUrls.push(url);
    }

    // Merge into complete subject notes
    const mergedName = `${code}_${safeSubj}_Complete_Notes.pdf`;
    const mergedUrl = await mergePdfs(unitPaths, mergedName);

    // Upsert into Note collection
    const noteDoc = await Note.findOneAndUpdate(
      { branch: "ME", semester: "3-2", subjectCode: code },
      {
        title: "Notes",
        branch: "ME",
        semester: "3-2",
        regulation: "R23",
        subject: subjectName,
        subjectCode: code,
        credits: String(credits),
        description,
        module1: moduleNames[0],
        module1Pdf: unitUrls[0],
        module2: moduleNames[1],
        module2Pdf: unitUrls[1],
        module3: moduleNames[2],
        module3Pdf: unitUrls[2],
        module4: moduleNames[3],
        module4Pdf: unitUrls[3],
        module5: moduleNames[4],
        module5Pdf: unitUrls[4],
        pdfUrl: mergedUrl,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  [NOTE DB] Upserted Note: ${noteDoc._id} - ${noteDoc.subject}`);
    results.notes.push({ code, name: subjectName, units: 5, mergedFile: mergedUrl });
  }

  // 2.1 Heat Transfer (23A03601T)
  try {
    await processTheory5Units({
      folderName: "23A03601T Heat Transfer",
      code: "23A03601T",
      subjectName: "Heat Transfer",
      credits: "3",
      description:
        "Comprehensive lecture notes for Heat Transfer covering steady & unsteady conduction, convection, boiling & condensation, heat exchangers, radiation, and mass transfer.",
      moduleNames: [
        "Introduction & Conduction Heat Transfer",
        "Convective Heat Transfer",
        "Boiling and Condensation",
        "Heat Exchangers Analysis and Design",
        "Radiation and Mass Transfer",
      ],
      filePatterns: [
        /unit1.*notes\.pdf/i,
        /unit2.*notes\.pdf/i,
        /unit3.*notes\.pdf/i,
        /unit4.*notes\.pdf/i,
        /unit5.*notes\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03601T]:", err.message);
    results.errors.push({ code: "23A03601T", error: err.message });
  }

  // 2.2 CAD-CAM (23A03602T)
  try {
    await processTheory5Units({
      folderName: "23A03602T CADCAM",
      code: "23A03602T",
      subjectName: "CAD-CAM",
      credits: "3",
      description:
        "Complete course notes covering CAD/CAM hardware/software, geometric curves and modeling, NC/CNC machine tools, CNC part programming, robotics, group technology, FMS, and CIM.",
      moduleNames: [
        "Fundamentals of CAD and Computer Graphics",
        "Geometric Modeling and Curves Representation",
        "NC, CNC, and DNC Machine Tools",
        "CNC Part Programming and Industrial Robotics",
        "Group Technology, FMS, and CIM",
      ],
      filePatterns: [
        /unit1.*notes\.pdf/i,
        /unit2.*notes\.pdf/i,
        /unit3.*notes\.pdf/i,
        /unit4.*notes\.pdf/i,
        /unit5.*notes\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03602T]:", err.message);
    results.errors.push({ code: "23A03602T", error: err.message });
  }

  // 2.3 Design of Machine Members (23A03603)
  try {
    await processTheory5Units({
      folderName: "23A03603 Design of Machine Members",
      code: "23A03603",
      subjectName: "Design of Machine Members",
      credits: "3",
      description:
        "Complete study notes for Design of Machine Members covering theories of failure, fatigue design, fasteners, welded & riveted joints, power shafts, keys, couplings, springs, and bearings.",
      moduleNames: [
        "Design for Static and Variable Loads",
        "Design of Fasteners, Riveted and Welded Joints",
        "Design of Keys, Cotters, Knuckle Joints, and Shafts",
        "Design of Shaft Couplings and Mechanical Springs",
        "Design of Bearings, Power Screws, and Engine Components",
      ],
      filePatterns: [
        /unit-?i_dmm.*\.pdf/i,
        /unit-?ii_dmm.*\.pdf/i,
        /unit-?iii_dmm.*\.pdf/i,
        /unit-?iv_dmm.*\.pdf/i,
        /unit-?v_dmm.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03603]:", err.message);
    results.errors.push({ code: "23A03603", error: err.message });
  }

  // 2.4 Engineering Fracture Mechanics (23A03604a)
  try {
    await processTheory5Units({
      folderName: "23A03604a Engineering Fracture Mechanics",
      code: "23A03604a",
      subjectName: "Engineering Fracture Mechanics",
      credits: "3",
      description:
        "Professional Elective - II notes covering linear elastic fracture mechanics (LEFM), elastoplastic fracture mechanics (EPFM), energy release rate, Westergaard stress functions, mixed-mode crack tip fields, fatigue crack growth, and fracture toughness testing.",
      moduleNames: [
        "Introduction to Failures, LEFM, EPFM and Fatigue",
        "Fracture Mechanisms, Griffith Criterion and Energy Release Rate",
        "Theory of Elasticity, Westergaard Approach and K-G Relation",
        "Multi-Parameter Stress Fields, Mixed Mode SIF and Plastic Zone",
        "Fracture Toughness Testing, Paris Law, J-Integral, FAD and Repair",
      ],
      filePatterns: [
        /efm_unit1.*\.pdf/i,
        /efm_unit2.*\.pdf/i,
        /efm_unit3.*\.pdf/i,
        /efm_unit4.*\.pdf/i,
        /efm_unit5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03604a]:", err.message);
    results.errors.push({ code: "23A03604a", error: err.message });
  }

  // 2.5 Introduction of Turbo Machinery (23A03604b)
  try {
    await processTheory5Units({
      folderName: "23A03604b Introduction of Turbo Machinery",
      code: "23A03604b",
      subjectName: "Introduction of Turbo Machinery",
      credits: "3",
      description:
        "Professional Elective - II notes on turbomachinery classification, gas turbine thermodynamic cycles, dimensional analysis, compressor & turbine blade cascades, and computational fluid dynamics applications.",
      moduleNames: [
        "Introduction and Classification of Turbomachines",
        "Gas Turbine Cycles and Thermodynamics",
        "Dimensional Analysis, Similarity Laws and Cascade Aerodynamics",
        "Axial Flow Compressors and Centrifugal Machines",
        "Axial Turbines and CFD Applications in Turbomachinery",
      ],
      filePatterns: [
        /unit1_introduction.*\.pdf/i,
        /unit2_gas_turbine.*\.pdf/i,
        /unit3_similarity.*\.pdf/i,
        /unit4_axial_compressor.*\.pdf/i,
        /unit5_axial_turbine.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03604b]:", err.message);
    results.errors.push({ code: "23A03604b", error: err.message });
  }

  // 2.6 Control Systems (23A03604c)
  try {
    await processTheory5Units({
      folderName: "23A03604c Control Systems",
      code: "23A03604c",
      subjectName: "Control Systems",
      credits: "3",
      description:
        "Professional Elective - II notes covering mechanical systems mathematical modeling, transfer functions, transient/steady-state time response, Routh-Hurwitz stability, Bode plots, and state-space representation.",
      moduleNames: [
        "Control System Basics and Transfer Function Modeling",
        "Block Diagram Reduction, Signal Flow Graphs and Compensators",
        "Time Domain Response and Stability Criteria",
        "Frequency Domain Analysis, Bode and Nyquist Plots",
        "State Space Analysis and Controller Design",
      ],
      filePatterns: [
        /unit1_basics.*\.pdf/i,
        /unit2_block_diagram.*\.pdf/i,
        /unit3_time_response.*\.pdf/i,
        /unit4_frequency_response.*\.pdf/i,
        /unit5_state_space.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03604c]:", err.message);
    results.errors.push({ code: "23A03604c", error: err.message });
  }

  // 2.7 Operations Research (23A03604d)
  try {
    await processTheory5Units({
      folderName: "23A03604d Operations Research",
      code: "23A03604d",
      subjectName: "Operations Research",
      credits: "3",
      description:
        "Professional Elective - II handwritten notes covering linear programming (Simplex, Two-Phase, Big-M), transportation & assignment algorithms, job sequencing, replacement policy, game theory, and inventory optimization.",
      moduleNames: [
        "Linear Programming Problem (LPP) and Simplex Methods",
        "Transportation and Assignment Problems",
        "Sequencing and Replacement Models",
        "Game Theory and Waiting Line / Queuing Models",
        "Inventory Control and Dynamic Programming",
      ],
      filePatterns: [
        /or_unit_?1.*\.pdf/i,
        /or_unit_?2.*\.pdf/i,
        /or_unit_?3.*\.pdf/i,
        /or_unit_?4.*\.pdf/i,
        /or_unit_?5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03604d]:", err.message);
    results.errors.push({ code: "23A03604d", error: err.message });
  }

  // 2.8 Smart Materials (23A03604e)
  try {
    await processTheory5Units({
      folderName: "23A03604e Smart Materials",
      code: "23A03604e",
      subjectName: "Smart Materials",
      credits: "3",
      description:
        "Professional Elective - II notes covering piezoelectrics, shape memory alloys (SMA), magnetostrictive materials, electro-rheological fluids, smart sensors, actuators, and structural health monitoring.",
      moduleNames: [
        "Introduction to Smart Materials and Intelligent Systems",
        "Classification and Types of Smart Materials",
        "Processing and Fabrication of Smart Materials",
        "Smart Sensors and Transducers",
        "Smart Actuators and Engineering Applications",
      ],
      filePatterns: [
        /unit1_introduction.*\.pdf/i,
        /unit2_smart_materials.*\.pdf/i,
        /unit3_processing.*\.pdf/i,
        /unit4_sensors.*\.pdf/i,
        /unit5_actuators.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03604e]:", err.message);
    results.errors.push({ code: "23A03604e", error: err.message });
  }

  // 2.9 Applications of Computational Fluid Dynamics (23A03605a)
  try {
    await processTheory5Units({
      folderName: "23A03605a Applications of Computational Fluid dynamics",
      code: "23A03605a",
      subjectName: "Applications of Computational Fluid Dynamics",
      credits: "3",
      description:
        "Professional Elective - III notes covering Navier-Stokes equations, discretization techniques, finite volume method (FVM), SIMPLE algorithm, boundary conditions, turbulence modeling, and CFD simulation workflows.",
      moduleNames: [
        "Governing Equations of CFD and Numerical Discretization",
        "Hyperbolic Equations, Wave Propagation and Shock Capturing",
        "Incompressible Viscous and Compressible Flow Formulations",
        "Finite Volume Method (FVM) for Diffusion and Convection",
        "Standard Variational Methods and Finite Element Approaches",
      ],
      filePatterns: [
        /unit1_introduction.*\.pdf/i,
        /unit2_hyperbolic.*\.pdf/i,
        /unit3_incompressible.*\.pdf/i,
        /unit4_finite_volume.*\.pdf/i,
        /unit5_standard_variational.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03605a]:", err.message);
    results.errors.push({ code: "23A03605a", error: err.message });
  }

  // 2.10 Industrial Safety (23A03605b)
  try {
    await processTheory5Units({
      folderName: "23A03605b Industrial Safety",
      code: "23A03605b",
      subjectName: "Industrial Safety",
      credits: "3",
      description:
        "Professional Elective - III notes covering industrial safety management, hazard identification, risk assessment, factory acts, OSHA guidelines, fire protection engineering, and workplace accident prevention.",
      moduleNames: [
        "Introduction to Industrial Safety and Safety Management",
        "Accident Prevention and Personal Protective Equipment (PPE)",
        "Industrial Safety Acts and Regulatory Compliance",
        "Fire Prevention, Protection, and Hazard Mitigation",
        "Building Fire Safety, Emergency Planning and Evacuation",
      ],
      filePatterns: [
        /unit_?1.*industrial_safety.*\.pdf/i,
        /unit_?2.*accident_prevention.*\.pdf/i,
        /unit_?3.*safety_acts.*\.pdf/i,
        /unit_?4.*fire_prevention.*\.pdf/i,
        /unit_?5.*building_fire_safety.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03605b]:", err.message);
    results.errors.push({ code: "23A03605b", error: err.message });
  }

  // 2.11 Design of Automobile Transmission Systems (23A03605c)
  try {
    await processTheory5Units({
      folderName: "23A03605c Design of Automobile Transmission Systems",
      code: "23A03605c",
      subjectName: "Design of Automobile Transmission Systems",
      credits: "3",
      description:
        "Professional Elective - III notes covering automotive powertrain design, multi-speed transmission gearboxes, epicyclic gear trains, clutches, torque converters, and driveline components.",
      moduleNames: [
        "Flexible Drives, Belts, Chains and Rolling Bearings",
        "Design of Spur Gears for Automotive Applications",
        "Design of Helical, Bevel, and Worm Gearing",
        "Design of Automotive Gearboxes and Speed Reducers",
        "Elements of Motion Control, Clutches, and Braking Systems",
      ],
      filePatterns: [
        /dats_unit_?1.*\.pdf/i,
        /dats_unit_?2.*\.pdf/i,
        /dats_unit_?3.*\.pdf/i,
        /dats_unit_?4.*\.pdf/i,
        /dats_unit_?5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03605c]:", err.message);
    results.errors.push({ code: "23A03605c", error: err.message });
  }

  // 2.12 Mechanics and Manufacturing of Composite Materials (23A03605d)
  try {
    await processTheory5Units({
      folderName: "23A03605d Mechanics & Manufacturing of Composite Materials",
      code: "23A03605d",
      subjectName: "Mechanics and Manufacturing of Composite Materials",
      credits: "3",
      description:
        "Professional Elective - III notes on fiber-reinforced polymers, manufacturing processes (hand lay-up, filament winding, pultrusion), orthotropic elasticity, laminate mechanics, and failure criteria (Tsai-Hill, Tsai-Wu).",
      moduleNames: [
        "Introduction to Composites and Polymer Matrix (FRP) Processing",
        "Micro and Macro Mechanics of Composite Lamina",
        "Classical Laminate Plate Theory (CLPT) and Stress Analysis",
        "Metal Matrix and Ceramic Matrix Composites (MMC / CMC)",
        "Failure Theories, Delamination, and Testing Standards",
      ],
      filePatterns: [
        /unit1_introduction.*\.pdf/i,
        /unit2_micro.*\.pdf/i,
        /unit3_strength.*\.pdf/i,
        /unit4_metal_matrix.*\.pdf/i,
        /unit5_failure.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03605d]:", err.message);
    results.errors.push({ code: "23A03605d", error: err.message });
  }

  // 2.13 Introduction to Hybrid and Electric Vehicles (23A03605e)
  try {
    await processTheory5Units({
      folderName: "23A03605e Introduction to hybrid and electric vehicles",
      code: "23A03605e",
      subjectName: "Introduction to Hybrid and Electric Vehicles",
      credits: "3",
      description:
        "Professional Elective - III notes covering EV/HEV architectures (series, parallel, series-parallel), battery chemistry & BMS, regenerative braking, electric motor drives (BLDC, PMSM, Induction), and vehicle dynamics.",
      moduleNames: [
        "EV Propulsion Architecture and Energy Storage Systems",
        "Electric Motors, Power Electronics and Drive Trains",
        "Hybrid Electric Vehicle (HEV) Drive Train Configurations",
        "EV and HEV Automotive Case Studies and Control Strategies",
        "Vehicle Sizing, Component Matching and Performance Modeling",
      ],
      filePatterns: [
        /unit-?i_.*\.pdf/i,
        /unit-?ii_.*\.pdf/i,
        /unit-?iii_.*\.pdf/i,
        /unit-?iv_.*\.pdf/i,
        /unit-?v_.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03605e]:", err.message);
    results.errors.push({ code: "23A03605e", error: err.message });
  }

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY:");
  console.log(`Total Theory Notes Processed: ${results.notes.length}`);
  console.log(`Total Lab Programs Processed: ${results.labs.length}`);
  console.log(`Total Errors Encountered: ${results.errors.length}`);
  if (results.errors.length > 0) {
    console.log("Errors:", results.errors);
  }
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Database connection closed cleanly.");

  if (results.errors.length > 0) {
    process.exit(1);
  }
}

uploadMech3_2().catch((err) => {
  console.error("FATAL ERROR during upload:", err);
  process.exit(1);
});
