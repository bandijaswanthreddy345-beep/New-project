const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\mech notes\\3-1";
const TARGET_UPLOADS = path.join(__dirname, "../uploads");
const ROOT_UPLOADS = path.join(__dirname, "../../uploads");

// Ensure target directories exist
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

async function uploadMech3_1() {
  console.log("==================================================");
  console.log("STARTING MECHANICAL ENGINEERING (ME) 3-1 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Target Uploads:", TARGET_UPLOADS);
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const results = { notes: [], errors: [] };

  const theorySubjects = [
    {
      code: "23A03501",
      title: "Machining Processes",
      subject: "Machining Processes",
      credits: "3",
      folder: "23A03501 Machining Process",
      description: "JNTUA R23 Machining Processes comprehensive lecture notes covering Mechanics of Metal Cutting, Lathe & Shaper/Planer operations, Milling, Drilling & Boring, Grinding & Superfinishing, and Unconventional Machining Processes.",
      units: [
        { name: "Unit 1: Mechanics of Metal Cutting & Tool Geometry", file: "Unit_1_Handwritten_Notes.pdf", unitNum: 1 },
        { name: "Unit 2: Lathe and Capstan/Turret Lathe Operations", file: "Unit_2_Handwritten_Notes.pdf", unitNum: 2 },
        { name: "Unit 3: Shaper, Slotter, Planer, Milling & Drilling Machines", file: "Unit_3_Handwritten_Notes.pdf", unitNum: 3 },
        { name: "Unit 4: Grinding Machines and Abrasive Finishing Processes", file: "Unit_4_Handwritten_Notes.pdf", unitNum: 4 },
        { name: "Unit 5: Unconventional & Advanced Machining Processes", file: "Unit_5_Handwritten_Notes.pdf", unitNum: 5 },
      ]
    },
    {
      code: "23A03502T",
      title: "Thermal Engineering",
      subject: "Thermal Engineering",
      credits: "3",
      folder: "23A03502T Thermal Engineering",
      description: "JNTUA R23 Thermal Engineering complete lecture notes covering Internal Combustion (IC) Engines & Combustion, Air Standard & Gas Power Cycles, Steam Nozzles & Steam Turbines, Gas Turbines & Jet Propulsion, and Reciprocating & Rotary Air Compressors.",
      units: [
        { name: "Unit 1: IC Engines Testing and Performance", file: "Thermal-Engineering_Unit-1_Handwritten-Notes.pdf", unitNum: 1 },
        { name: "Unit 2: Combustion in SI & CI Engines and Air Compressors", file: "Thermal-Engineering_Unit-2_Handwritten-Notes.pdf", unitNum: 2 },
        { name: "Unit 3: Vapour Power Cycles and Steam Nozzles", file: "Thermal-Engineering_Unit-3_Handwritten-Notes.pdf", unitNum: 3 },
        { name: "Unit 4: Steam Turbines (Impulse and Reaction)", file: "Thermal-Engineering_Unit-4_Handwritten-Notes.pdf", unitNum: 4 },
        { name: "Unit 5: Gas Turbines and Jet Propulsion Systems", file: "Thermal-Engineering_Unit-5_Handwritten-Notes.pdf", unitNum: 5 },
      ]
    },
    {
      code: "23A03503",
      title: "Metrology and Measurements",
      subject: "Metrology and Measurements",
      credits: "3",
      folder: "23A03503 Metrology and Measurements",
      description: "JNTUA R23 Metrology and Measurements notes covering Concept of Measurement & Limits/Fits/Tolerances, Linear/Angular Measurement & Surface Roughness, Screw Thread/Gear Metrology & CMM, Measurement of Displacement, Strain & Temperature, and Measurement of Force, Torque & Pressure.",
      units: [
        { name: "Unit 1: Concept of Measurement, Limits, Fits & Tolerances", file: "MM_Unit1_Concept_of_Measurement_Notes.pdf", unitNum: 1 },
        { name: "Unit 2: Linear, Angular Measurement and Surface Roughness", file: "MM_Unit2_Flatness_and_Surface_Roughness_Notes.pdf", unitNum: 2 },
        { name: "Unit 3: Screw Thread, Gear Measurement and CMM", file: "MM_Unit3_Screw_Thread_Gear_CMM_Notes.pdf", unitNum: 3 },
        { name: "Unit 4: Measurement of Displacement, Strain and Temperature", file: "MM_Unit4_Displacement_and_Strain_Notes.pdf", unitNum: 4 },
        { name: "Unit 5: Measurement of Force, Torque and Pressure", file: "MM_Unit5_Force_Torque_Pressure_Notes.pdf", unitNum: 5 },
      ]
    },
    {
      code: "23A03504a",
      title: "Tool Design",
      subject: "Tool Design",
      credits: "3",
      folder: "23A03504a Tool Design",
      description: "JNTUA R23 Professional Elective I: Tool Design lecture notes covering Cutting Tool Materials & Single-Point Tool Design, Design of Jigs and Fixtures, Principles of Clamping & Locating Devices, Press Working Tools & Die Design, and Plastic Moulding Dies & Gauge Design.",
      units: [
        { name: "Unit 1: Tool Materials and Single Point Cutting Tool Design", file: "Tool_Design_23A03504a_Unit_1.pdf", unitNum: 1 },
        { name: "Unit 2: Design of Jigs and Fixtures", file: "Tool_Design_23A03504a_Unit_2.pdf", unitNum: 2 },
        { name: "Unit 3: Locating and Clamping Principles and Systems", file: "Tool_Design_23A03504a_Unit_3.pdf", unitNum: 3 },
        { name: "Unit 4: Press Working and Die Design (Blanking, Piercing)", file: "Tool_Design_23A03504a_Unit_4.pdf", unitNum: 4 },
        { name: "Unit 5: Forming Dies, Bending Dies and Gauges Design", file: "Tool_Design_23A03504a_Unit_5.pdf", unitNum: 5 },
      ]
    },
    {
      code: "23A03504b",
      title: "Automobile Engineering",
      subject: "Automobile Engineering",
      credits: "3",
      folder: "23A03504b Automobile Engineering",
      description: "JNTUA R23 Professional Elective I: Automobile Engineering complete study material covering Vehicle Structure & Engine Components, Fuel Supply & Electrical/Ignition Systems, Transmission, Steering & Suspension Systems, Wheels, Tyres & Braking Systems, and Emission Control & Hybrid/Electric Vehicles.",
      units: [
        { name: "Unit 1: Vehicle Structure, Chassis and Engine Components", file: "23A03504b_Automobile_Engineering_Unit_I_Vehicle_Structure_and_Engine_Components.pdf", unitNum: 1 },
        { name: "Unit 2: Fuel Supply and Electrical Ignition Systems", file: "23A03504b_Automobile_Engineering_Unit_II_Ignition_and_Fuel_Supply_Systems.pdf", unitNum: 2 },
        { name: "Unit 3: Transmission, Steering and Suspension Systems", file: "23A03504b_Automobile_Engineering_Unit_III_Steering_and_Suspension.pdf", unitNum: 3 },
        { name: "Unit 4: Wheels, Tyres and Braking Systems", file: "23A03504b_Automobile_Engineering_Unit_IV_Wheels_Tyres_and_Braking.pdf", unitNum: 4 },
        { name: "Unit 5: Emission Standards, Safety and Electric/Hybrid Vehicles", file: "unit-5.pdf", unitNum: 5 },
      ]
    },
    {
      code: "23A03504c",
      title: "Mechanical Behaviour of Materials",
      subject: "Mechanical Behaviour of Materials",
      credits: "3",
      folder: "23A03504c Mechanical behaviour of Materials",
      description: "JNTUA R23 Professional Elective I: Mechanical Behaviour of Materials study notes covering Elastic & Plastic Deformation & Dislocations, Strengthening Mechanisms in Metals, Fracture & Fracture Mechanics, Fatigue Behaviour & S-N Curves, and High-Temperature Creep Deformation.",
      units: [
        { name: "Unit 1: Elastic and Plastic Behaviour and Dislocations", file: "MBM_Unit_1_Elastic_Plastic_Behaviour_Dislocations.pdf", unitNum: 1 },
        { name: "Unit 2: Strengthening Mechanisms in Metals and Alloys", file: "MBM_Unit_2_Strengthening_Mechanisms.pdf", unitNum: 2 },
        { name: "Unit 3: Fracture and Linear Elastic Fracture Mechanics", file: "MBM_Unit_3_Fracture_and_Fracture_Mechanics.pdf", unitNum: 3 },
        { name: "Unit 4: Fatigue Behaviour, Testing and Life Prediction", file: "MBM_Unit_4_Fatigue_Behaviour_and_Testing.pdf", unitNum: 4 },
        { name: "Unit 5: High Temperature Creep Behaviour and Testing", file: "MBM_Unit_5_Creep_Behaviour_and_Testing.pdf", unitNum: 5 },
      ]
    },
    {
      code: "23A03504d",
      title: "Work Study and Ergonomics",
      subject: "Work Study and Ergonomics",
      credits: "3",
      folder: "23A03504d Work study and Ergonomics",
      description: "JNTUA R23 Professional Elective I: Work Study and Ergonomics notes covering Productivity & Work Study Fundamentals, Method Study & Work Measurement, Time Study & Work Sampling, Fundamentals of Ergonomics & Anthropometry, and Man-Machine Interaction & Environmental Ergonomics.",
      units: [
        { name: "Unit 1: Productivity and Work Study Fundamentals", file: "Unit_1_Productivity_and_Work_Study.pdf", unitNum: 1 },
        { name: "Unit 2: Method Study and Motion Economy Principles", file: "Unit_2_Method_Study_and_Work_Measurement.pdf", unitNum: 2 },
        { name: "Unit 3: Time Study, Rating, Allowances and Work Sampling", file: "Unit_3_Time_Study_Rating_and_Allowances.pdf", unitNum: 3 },
        { name: "Unit 4: Introduction to Ergonomics and Anthropometry", file: "Unit_4_Introduction_to_Ergonomics.pdf", unitNum: 4 },
        { name: "Unit 5: Man-Machine System Interaction and Workspace Design", file: "Unit_5_Man_Machine_Interaction.pdf", unitNum: 5 },
      ]
    },
    {
      code: "23A03504e",
      title: "Nano Technology",
      subject: "Nano Technology",
      credits: "3",
      folder: "23A03504e Nano Technology",
      description: "JNTUA R23 Professional Elective I: Nano Technology lecture notes covering Introduction to Nanomaterials & Quantum Effects, Synthesis of Nanomaterials (Top-down & Bottom-up), Characterization of Nanomaterials (XRD, SEM, TEM, AFM), and Engineering Applications of Nanotechnology.",
      units: [
        { name: "Unit 1: Introduction to Nanomaterials and Quantum Confinement", file: "Nano_Technology_Unit-1_Notes.pdf", unitNum: 1 },
        { name: "Unit 2: Synthesis Methods of Nanomaterials", file: "Nano_Technology_Unit-2_Notes.pdf", unitNum: 2 },
        { name: "Unit 3: Properties and Characterization of Nanomaterials", file: "Nano_Technology_Unit-3_Notes.pdf", unitNum: 3 },
        { name: "Unit 4: Carbon Nanotubes, Graphene and Nanocomposites", file: null, unitNum: 4 },
        { name: "Unit 5: Applications of Nanotechnology in Engineering", file: "Nano_Technology_Unit-5_Notes.pdf", unitNum: 5 },
      ]
    },
    {
      code: "23A05503",
      title: "Introduction to Quantum Technologies and Applications",
      subject: "Introduction to Quantum Technologies and Applications",
      credits: "3",
      folder: "23A05503 Introduction To Quantum Technologies And Applications",
      description: "JNTUA R23 Open Elective I: Quantum Technologies complete handwritten notes covering Principles of Quantum Mechanics & Qubits, Quantum Computing Architecture & Quantum Gates, Quantum Algorithms (Shor's, Grover's), Quantum Cryptography & Key Distribution (QKD), and Real-World Applications in Engineering.",
      units: [
        { name: "Unit 1: Fundamentals of Quantum Physics and Qubits", file: "23A05503_QuantumTechnologies_Unit1_Handwritten_Notes.pdf", unitNum: 1 },
        { name: "Unit 2: Quantum Gates, Circuits and Architecture", file: "23A05503_QuantumTechnologies_Unit2_Handwritten_Notes.pdf", unitNum: 2 },
        { name: "Unit 3: Quantum Algorithms and Complexity", file: "23A05503_QuantumTechnologies_Unit3_Handwritten_Notes.pdf", unitNum: 3 },
        { name: "Unit 4: Quantum Cryptography and Communication (QKD)", file: "23A05503_QuantumTechnologies_Unit4_Handwritten_Notes.pdf", unitNum: 4 },
        { name: "Unit 5: Quantum Sensing, Simulation and Engineering Applications", file: "23A05503_QuantumTechnologies_Unit5_Handwritten_Notes.pdf", unitNum: 5 },
      ]
    },
  ];

  for (const sub of theorySubjects) {
    try {
      console.log(`\n--------------------------------------------------`);
      console.log(`Subject: ${sub.code} - ${sub.title}`);
      console.log(`Folder: ${sub.folder}`);

      const subDir = path.join(SOURCE_BASE, sub.folder);
      const unitPaths = [];
      const unitUrls = {};

      for (const u of sub.units) {
        if (u.file) {
          const srcFile = path.join(subDir, u.file);
          const destName = `${sub.code}_Unit_${u.unitNum}.pdf`;
          const url = copyFileSafe(srcFile, destName);
          unitPaths.push(srcFile);
          unitUrls[`module${u.unitNum}`] = u.name;
          unitUrls[`module${u.unitNum}Pdf`] = url;
        } else {
          unitUrls[`module${u.unitNum}`] = u.name;
          unitUrls[`module${u.unitNum}Pdf`] = "";
        }
      }

      // Merge available units into complete textbook
      const mergedName = `${sub.code}_Complete_Textbook_Notes.pdf`;
      const mergedUrl = await mergePdfs(unitPaths, mergedName);

      const updateData = {
        title: "Notes",
        branch: "ME",
        semester: "3-1",
        regulation: "R23",
        subject: sub.subject,
        subjectCode: sub.code,
        credits: sub.credits,
        description: sub.description,
        module1: unitUrls.module1 || "",
        module1Pdf: unitUrls.module1Pdf || "",
        module2: unitUrls.module2 || "",
        module2Pdf: unitUrls.module2Pdf || "",
        module3: unitUrls.module3 || "",
        module3Pdf: unitUrls.module3Pdf || "",
        module4: unitUrls.module4 || "",
        module4Pdf: unitUrls.module4Pdf || "",
        module5: unitUrls.module5 || "",
        module5Pdf: unitUrls.module5Pdf || "",
        pdfUrl: mergedUrl,
      };

      const noteDoc = await Note.findOneAndUpdate(
        { branch: "ME", semester: "3-1", subjectCode: sub.code },
        updateData,
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
  console.log("INGESTION SUMMARY (ME 3-1)");
  console.log(`Notes Uploaded: ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. ME 3-1 Ingestion Done!");
}

uploadMech3_1().catch(console.error);
