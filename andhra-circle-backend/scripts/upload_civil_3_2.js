const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\civil notes\\3-2";
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

async function uploadCivil3_2() {
  console.log("==================================================");
  console.log("STARTING CIVIL ENGINEERING (CE) 3-2 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Target Uploads:", TARGET_UPLOADS);
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const results = { labs: [], notes: [], errors: [] };

  // =========================================================================
  // 1. LAB PROGRAMS (LABS) - EXCLUSIVELY LABPROGRAM COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 3-2 LAB MANUALS ---");

  // 1.1 Highway Engineering Lab (23A01602P)
  try {
    const dir = path.join(SOURCE_BASE, "23A01602P Highway Engineering Lab(1.5)");
    console.log(`\nProcessing Lab: Highway Engineering Lab`);
    const pdfSrc = path.join(dir, "Highway_Engineering_Lab_23A01602P.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01602P_Highway_Engineering_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "3-2", subjectCode: "23A01602P" },
      {
        title: "Highway Engineering Lab",
        branch: "CE",
        regulation: "R23",
        semester: "3-2",
        subject: "Highway Engineering Lab",
        subjectCode: "23A01602P",
        description: "JNTUA R23 Highway Engineering Laboratory Manual covering Aggregate crushing value test, Aggregate impact test, Los Angeles abrasion test, Shape tests (Flakiness and Elongation index), Penetration test on bitumen, Ductility test, Softening point test, Flash and fire point test, and Marshall stability test.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 3-2)`);
    results.labs.push("23A01602P");
  } catch (err) {
    console.error("  [ERROR LAB 23A01602P]:", err.message);
    results.errors.push({ item: "23A01602P", error: err.message });
  }

  // 1.2 Environmental Engineering Lab (23A01603P)
  try {
    const dir = path.join(SOURCE_BASE, "23A01603P Environmental Engineering Lab(1.5)");
    console.log(`\nProcessing Lab: Environmental Engineering Lab`);
    const pdfSrc = path.join(dir, "Environmental_Engineering_Lab_Manual_23A01603P.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01603P_Environmental_Engineering_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "3-2", subjectCode: "23A01603P" },
      {
        title: "Environmental Engineering Lab",
        branch: "CE",
        regulation: "R23",
        semester: "3-2",
        subject: "Environmental Engineering Lab",
        subjectCode: "23A01603P",
        description: "JNTUA R23 Environmental Engineering Laboratory Manual covering Determination of pH, Electrical Conductivity, Turbidity, Total Hardness, Alkalinity, Chlorides, Residual Chlorine, Dissolved Oxygen (DO), Biochemical Oxygen Demand (BOD), Chemical Oxygen Demand (COD), and Optimum Coagulant Dosage using Jar Test Apparatus.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 3-2)`);
    results.labs.push("23A01603P");
  } catch (err) {
    console.error("  [ERROR LAB 23A01603P]:", err.message);
    results.errors.push({ item: "23A01603P", error: err.message });
  }

  // 1.3 Building Information Modelling (23A01607)
  try {
    const dir = path.join(SOURCE_BASE, "23A01607 Building Information Modelling(2)");
    console.log(`\nProcessing Lab/Skill Course: Building Information Modelling`);
    const pdfSrc = path.join(dir, "BIM_Lab_Inputs_and_Outputs.pdf");
    const pdfUrl = copyFileSafe(pdfSrc, "23A01607_Building_Information_Modelling_Lab_Manual.pdf");

    const labDoc = await LabProgram.findOneAndUpdate(
      { branch: "CE", semester: "3-2", subjectCode: "23A01607" },
      {
        title: "Building Information Modelling",
        branch: "CE",
        regulation: "R23",
        semester: "3-2",
        subject: "Building Information Modelling",
        subjectCode: "23A01607",
        description: "JNTUA R23 Practical Skill Course on Building Information Modelling (BIM) covering 3D architectural modeling, parametric component creation (walls, doors, windows, stairs, roofs), structural framing, MEP coordination, 4D construction scheduling, quantity take-off, clash detection, and BIM documentation using Revit/Navisworks.",
        pdfUrl: pdfUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`  [UPSERTED LAB] ID: ${labDoc._id} - ${labDoc.title} (Sem: 3-2)`);
    results.labs.push("23A01607");
  } catch (err) {
    console.error("  [ERROR LAB 23A01607]:", err.message);
    results.errors.push({ item: "23A01607", error: err.message });
  }

  // =========================================================================
  // 2. THEORY SUBJECTS (NOTES) - EXCLUSIVELY NOTE COLLECTION
  // =========================================================================
  console.log("\n--- PROCESSING 3-2 THEORY SUBJECTS (NOTES) ---");

  const theorySubjects = [
    {
      code: "23A01601",
      title: "Design of Steel Structures",
      subject: "Design of Steel Structures",
      credits: "3",
      folder: "23A01601 Design of Steel Structures(3)",
      description: "JNTUA R23 Design of Steel Structures (Limit State Method IS 800:2007) comprehensive lecture notes covering Introduction & Bolted/Welded Connections, Design of Tension Members & Compression Members (Columns, Lacing, Battening), Design of Flexural Members (Laterally Supported & Unsupported Beams), Industrial Roof Trusses & Gantry Girders, and Plastic Analysis & Collapse Load Evaluation.",
      modules: [
        "Unit 1: Introduction to Steel Design and Bolted & Welded Connections",
        "Unit 2: Design of Tension Members and Compression Members (Built-up Columns)",
        "Unit 3: Design of Laterally Supported and Unsupported Beams",
        "Unit 4: Design of Industrial Roof Trusses and Gantry Girders",
        "Unit 5: Plastic Analysis and Design of Steel Structures",
      ],
      files: [
        "Unit-1_Intro_to_Steel_and_Connections.pdf",
        "Unit-2_Tension_and_Compression_Members.pdf",
        "Unit-3_Design_of_Beams.pdf",
        "Unit-4_Industrial_Structures.pdf",
        "Unit-5_Plastic_Analysis_and_Design.pdf",
      ],
    },
    {
      code: "23A01603T",
      title: "Environmental Engineering",
      subject: "Environmental Engineering",
      credits: "3",
      folder: "23A01603T Environmental Engineering(3)",
      description: "JNTUA R23 Environmental Engineering notes covering Water Demand Forecasting, Quality Standards & Intakes, Water Treatment Processes (Sedimentation, Coagulation, Filtration, Disinfection), Water Storage Reservoirs & Distribution Networks, Sewerage Planning, Dry & Wet Weather Flow & Sewer Appurtenances, and Primary, Secondary & Biological Sewage Treatment & Effluent Disposal.",
      modules: [
        "Unit 1: Water Supply, Population Forecasting and Water Quality Standards",
        "Unit 2: Water Treatment Processes (Aeration, Coagulation, Filtration, Disinfection)",
        "Unit 3: Water Storage Reservoirs, Pumping and Distribution Networks",
        "Unit 4: Sewerage Systems, Sewer Design and Appurtenances",
        "Unit 5: Sewage Treatment Processes, Sludge Digestion and Effluent Disposal",
      ],
      files: [
        "Unit1_Water_Supply.pdf",
        "Unit2_Water_Treatment.pdf",
        "Unit3_Water_Storage_and_Distribution.pdf",
        "Unit4_Sewerage_Planning_and_Design.pdf",
        "Unit5_Sewage_Treatment_and_Disposal.pdf",
      ],
    },
    {
      code: "23A01604a",
      title: "Design of Earthquake Resistant Structures",
      subject: "Design of Earthquake Resistant Structures",
      credits: "3",
      folder: "23A01604a Design of Earthquake Resistant Structures(3)",
      description: "JNTUA R23 Professional Elective II: Earthquake Resistant Design of Structures notes covering Engineering Seismology & Structural Dynamics (SDOF Vibrations), Conceptual Seismic Design Principles (IS 1893:2016 Equivalent Static & Response Spectrum Methods), Seismic Evaluation & Ductile Detailing of RC Buildings (IS 13920:2016), Earthquake Resistant Masonry Buildings, and Structural Shear Walls & Non-Structural Component Protection.",
      modules: [
        "Unit 1: Engineering Seismology and Structural Dynamics (SDOF Systems)",
        "Unit 2: Conceptual Design and Introduction to Earthquake Resistant Design",
        "Unit 3: Seismic Design and Ductile Detailing of Reinforced Concrete Buildings",
        "Unit 4: Earthquake Resistant Design of Masonry Buildings",
        "Unit 5: Design of Structural Shear Walls and Ductility Requirements",
      ],
      files: [
        "Unit1_Engineering_Seismology_and_Vibrations.pdf",
        "Unit2_Conceptual_Design_and_Intro_to_EQ_Resistant_Design.pdf",
        "Unit3_Reinforced_Concrete_Buildings.pdf",
        "Unit4_Masonry_Buildings.pdf",
        "Unit5_Structural_Walls_NonStructural_and_Ductility.pdf",
      ],
    },
    {
      code: "23A01604b",
      title: "Open Channel Flow",
      subject: "Open Channel Flow",
      credits: "3",
      folder: "23A01604b Open Channel Flow(3)",
      description: "JNTUA R23 Professional Elective II: Open Channel Flow advanced notes covering Hydraulics of Pipe Networks & Transients (Surge Tanks & Water Hammer), Steady Gradually Varied Flow (GVF) Computation & Surface Water Profiles, Unsteady Flow & Positive/Negative Surges, Sediment Transport Mechanics (Bed Load, Suspended Load, Shields Parameter), and Flow Measurements & Physical Hydraulic Model Similitude.",
      modules: [
        "Unit 1: Hydraulics of Pipelines, Pipe Networks and Water Hammer",
        "Unit 2: Steady Gradually Varied Flows in Open Channels and Surface Profiles",
        "Unit 3: Unsteady Flows and Wave Propagation in Open Channels",
        "Unit 4: Sediment Transport Mechanics and Incipient Motion",
        "Unit 5: Open Channel Flow Measurements and Hydraulic Similitude Modeling",
      ],
      files: [
        "Unit1_Hydraulics_of_Pipelines_and_Pipe_Networks.pdf",
        "Unit2_Steady_Varied_Flows_in_Open_Channels.pdf",
        "Unit3_Unsteady_Flows_in_Open_Channels.pdf",
        "Unit4_Sediment_Transport.pdf",
        "Unit5_Flow_Measurements_and_Hydraulic_Modeling.pdf",
      ],
    },
    {
      code: "23A01604c",
      title: "Foundation Engineering",
      subject: "Foundation Engineering",
      credits: "3",
      folder: "23A01604c Foundation Engineering(3)",
      description: "JNTUA R23 Professional Elective II: Foundation Engineering complete handwritten notes covering Subsoil Exploration & Geophysical Investigation, Stability of Earth Slopes (Fellenius, Bishop Methods), Lateral Earth Pressure Theories (Rankine, Coulomb) & Retaining Wall Design, Bearing Capacity of Shallow Foundations (Terzaghi, Meyerhof, IS Code) & Settlement Analysis, and Deep Foundations (Single & Group Pile Capacity, Settlement, Negative Skin Friction, Well Foundations).",
      modules: [
        "Unit 1: Subsoil Exploration, Sampling Methods and In-situ Testing",
        "Unit 2: Earth Slope Stability Analysis (Method of Slices, Taylor's Stability Number)",
        "Unit 3: Lateral Earth Pressure and Stability Design of Retaining Walls",
        "Unit 4: Bearing Capacity and Settlement Analysis of Shallow Foundations",
        "Unit 5: Deep Foundations (Pile Capacity, Group Efficiency and Well Foundations)",
      ],
      files: [
        "Unit-1_Soil_Exploration.pdf",
        "Unit-2_Earth_Slope_Stability.pdf",
        "Unit-3_Earth_Pressure_and_Retaining_Walls.pdf",
        "Unit-4_Shallow_Foundations.pdf",
        "Unit-5_Pile_and_Well_Foundations.pdf",
      ],
    },
    {
      code: "23A01605a",
      title: "Cost Effective Housing Techniques",
      subject: "Cost Effective Housing Techniques",
      credits: "3",
      folder: "23A01605a Cost effective Housing Techniques(3)",
      description: "JNTUA R23 Professional Elective III: Cost Effective Housing Techniques notes covering Indian Housing Scenario, Policies & Finance, Low-Cost Resilient Housing Technologies (Laurie Baker Principles, Rat-Trap Bond, Filler Slabs), Alternative & Eco-Friendly Building Materials (Fly Ash, Stabilized Mud Blocks, Bamboo), Rural Housing Technologies & Sanitation, and Disaster Resilient Housing in Cyclone & Earthquake Prone Regions.",
      modules: [
        "Unit 1: Housing Scenario, National Housing Policies, Finance and Planning",
        "Unit 2: Low-Cost Resilient Housing Construction Technologies",
        "Unit 3: Alternative Building Materials and Green Infrastructure",
        "Unit 4: Rural Housing Principles, Upgradation and Eco-Sanitation",
        "Unit 5: Housing Construction in Disaster-Prone and Coastal Areas",
      ],
      files: [
        "CEH_Unit1_Housing_Scenario_Finance_Planning.pdf",
        "CEH_Unit2_Low_Cost_Resilient_Housing_Technology.pdf",
        "CEH_Unit3_Alternative_Materials_and_Infrastructure.pdf",
        "CEH_Unit4_Rural_Housing.pdf",
        "CEH_Unit5_Housing_in_Disaster_Prone_Areas.pdf",
      ],
    },
    {
      code: "23A01605b",
      title: "Watershed Management",
      subject: "Watershed Management",
      credits: "3",
      folder: "23A01605b Watershed Management(3)",
      description: "JNTUA R23 Professional Elective III: Watershed Management lecture notes covering Concept of Watershed, Characteristics & Delineation, Soil Erosion Principles, Estimation (USLE) & Conservation Measures, Rainwater Harvesting Structures (Check Dams, Percolation Tanks, Farm Ponds), Integrated Watershed Management Planning & Agroforestry, and Role of Remote Sensing, GIS & People's Participation in Watershed Development.",
      modules: [
        "Unit 1: Introduction, Concepts and Morphometric Characteristics of Watersheds",
        "Unit 2: Soil Erosion Processes, Estimation and Agronomic Conservation Measures",
        "Unit 3: Water Harvesting Principles and Artificial Ground Water Recharge Structures",
        "Unit 4: Watershed Management Planning, Land Use Capability and Agroforestry",
        "Unit 5: Application of Remote Sensing and GIS in Watershed Management",
      ],
      files: [
        "Unit1_Watershed_Management_Notes.pdf",
        "Unit2_Watershed_Management_Notes.pdf",
        "Unit3_Watershed_Management_Notes.pdf",
        "Unit4_Watershed_Management_Notes.pdf",
        "Unit5_Watershed_Management_Notes.pdf",
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
        { branch: "CE", semester: "3-2", subjectCode: sub.code },
        {
          title: "Notes",
          branch: "CE",
          semester: "3-2",
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

      console.log(`  [UPSERTED NOTE] ID: ${noteDoc._id} - ${noteDoc.subject} (Sem: 3-2)`);
      results.notes.push(sub.code);
    } catch (err) {
      console.error(`  [ERROR SUBJECT ${sub.code}]:`, err.message);
      results.errors.push({ item: sub.code, error: err.message });
    }
  }

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY (CE 3-2)");
  console.log(`Labs Uploaded (LabProgram collection): ${results.labs.length}`);
  console.log(`Notes Uploaded (Note collection): ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. CE 3-2 Ingestion Done!");
}

uploadCivil3_2().catch(console.error);
