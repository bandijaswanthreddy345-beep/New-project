const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");
const LabProgram = require("../models/LabProgram");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\aiml notes";
const TARGET_UPLOADS = path.join(__dirname, "../uploads");
const ROOT_UPLOADS = path.join(__dirname, "../../uploads");

if (!fs.existsSync(TARGET_UPLOADS)) fs.mkdirSync(TARGET_UPLOADS, { recursive: true });
if (!fs.existsSync(ROOT_UPLOADS)) fs.mkdirSync(ROOT_UPLOADS, { recursive: true });

function copyFileSafe(srcPath, destName) {
  if (!fs.existsSync(srcPath)) {
    console.warn(`[WARN] Source file does not exist: ${srcPath}`);
    return null;
  }
  const destPath = path.join(TARGET_UPLOADS, destName);
  const rootDestPath = path.join(ROOT_UPLOADS, destName);

  fs.copyFileSync(srcPath, destPath);
  try {
    fs.copyFileSync(srcPath, rootDestPath);
  } catch (e) {
    // root uploads optional
  }

  const size = fs.statSync(destPath).size;
  console.log(`  [COPIED] -> ${destName} (${(size / 1024).toFixed(1)} KB)`);
  return `/uploads/${destName}`;
}

async function mergePdfs(pdfPaths, destName) {
  try {
    const validPaths = pdfPaths.filter((p) => fs.existsSync(p));
    if (validPaths.length === 0) {
      console.warn(`[WARN] No valid PDFs to merge for ${destName}`);
      return null;
    }
    const mergedPdf = await PDFDocument.create();
    for (const p of validPaths) {
      const bytes = fs.readFileSync(p);
      const pdf = await PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }
    const mergedBytes = await mergedPdf.save();
    const destPath = path.join(TARGET_UPLOADS, destName);
    const rootDestPath = path.join(ROOT_UPLOADS, destName);

    fs.writeFileSync(destPath, mergedBytes);
    try {
      fs.writeFileSync(rootDestPath, mergedBytes);
    } catch (e) {}

    console.log(
      `  [MERGED] -> ${destName} (${(mergedBytes.length / 1024).toFixed(1)} KB, from ${validPaths.length} files)`
    );
    return `/uploads/${destName}`;
  } catch (err) {
    console.error(`  [MERGE ERROR] for ${destName}:`, err.message);
    return null;
  }
}

async function uploadAIMLNotes() {
  console.log("==================================================");
  console.log("STARTING AIML ALL SEMESTERS (1-1 to 4-1) INGESTION");
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const results = { notes: 0, labs: 0, errors: [] };

  // Helper for upserting Note
  async function saveNote(data) {
    try {
      const doc = await Note.findOneAndUpdate(
        { branch: data.branch, semester: data.semester, subjectCode: data.subjectCode },
        data,
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      results.notes++;
      console.log(`  [UPSERT NOTE] ${doc.subjectCode} - ${doc.subject} (Sem: ${doc.semester})`);
      return doc;
    } catch (err) {
      console.error(`  [ERROR NOTE ${data.subjectCode}]:`, err.message);
      results.errors.push({ code: data.subjectCode, error: err.message });
      return null;
    }
  }

  // Helper for upserting LabProgram
  async function saveLab(data) {
    try {
      const doc = await LabProgram.findOneAndUpdate(
        { branch: data.branch, semester: data.semester, subjectCode: data.subjectCode },
        data,
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      results.labs++;
      console.log(`  [UPSERT LAB] ${doc.subjectCode} - ${doc.subject} (Sem: ${doc.semester})`);
      return doc;
    } catch (err) {
      console.error(`  [ERROR LAB ${data.subjectCode}]:`, err.message);
      results.errors.push({ code: data.subjectCode, error: err.message });
      return null;
    }
  }

  // =========================================================================
  // SEMESTER 1-1
  // =========================================================================
  console.log("\n>>> PROCESSING SEMESTER 1-1 <<<");
  const s11 = path.join(SOURCE_BASE, "1-1");

  // 1. 23A02101T Basic Electrical & Electronics Engineering
  {
    const partA = path.join(s11, "23A02101T(Basic Electrical & Electronics)3 part-A");
    const partB = path.join(s11, "23A02101P(Electrical & Electronics Engineering)part-B");

    const u1 = copyFileSafe(path.join(partA, "BEEE_Unit1_DC_and_AC_Circuits.pdf"), "23A02101T_Unit_1_DC_and_AC_Circuits.pdf");
    const u2 = copyFileSafe(path.join(partA, "BEEE_Unit2_Machines_and_Measuring_Instruments.pdf"), "23A02101T_Unit_2_Machines_and_Measuring_Instruments.pdf");
    const u3 = copyFileSafe(path.join(partA, "BEEE_Unit3_Energy_Resources_Bill_and_Safety.pdf"), "23A02101T_Unit_3_Energy_Resources_Bill_and_Safety.pdf");
    const u4 = copyFileSafe(path.join(partB, "Unit_I_Semiconductor_Devices.pdf"), "23A02101T_Unit_4_Semiconductor_Devices.pdf");
    const u5 = copyFileSafe(path.join(partB, "Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf"), "23A02101T_Unit_5_Basic_Electronic_Circuits.pdf");

    const mergePaths = [
      path.join(partA, "BEEE_Unit1_DC_and_AC_Circuits.pdf"),
      path.join(partA, "BEEE_Unit2_Machines_and_Measuring_Instruments.pdf"),
      path.join(partA, "BEEE_Unit3_Energy_Resources_Bill_and_Safety.pdf"),
      path.join(partB, "Unit_I_Semiconductor_Devices.pdf"),
      path.join(partB, "Unit_II_Basic_Electronic_Circuits_and_Instrumentation.pdf"),
      path.join(partB, "Unit_III_Digital_Electronics.pdf"),
    ];
    const fullPdf = await mergePdfs(mergePaths, "23A02101T_Basic_Electrical_and_Electronics_Engineering_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-1",
      regulation: "R23",
      subject: "Basic Electrical and Electronics Engineering",
      subjectCode: "23A02101T",
      credits: "3",
      description: "JNTUA R23 Basic Electrical and Electronics Engineering comprehensive study material covering Part A (DC/AC Circuits, Electrical Machines, Energy Resources & Safety) and Part B (Semiconductor Devices, Electronic Circuits, Digital Electronics).",
      module1: "Unit 1: DC and AC Circuits",
      module1Pdf: u1,
      module2: "Unit 2: Machines and Measuring Instruments",
      module2Pdf: u2,
      module3: "Unit 3: Energy Resources, Bill and Safety",
      module3Pdf: u3,
      module4: "Unit 4: Semiconductor Devices",
      module4Pdf: u4,
      module5: "Unit 5: Basic Electronic Circuits and Digital Electronics",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 2. 23A02101P Electrical & Electronics Engineering Workshop Lab
  {
    const partB = path.join(s11, "23A02101P(Electrical & Electronics Engineering)part-B");
    const labPdf = copyFileSafe(path.join(partB, "Unit_III_Digital_Electronics.pdf"), "23A02101P_Electrical_and_Electronics_Engineering_Workshop_Lab_Manual.pdf");
    await saveLab({
      title: "Electrical & Electronics Engineering Workshop Lab",
      branch: "AIML",
      semester: "1-1",
      regulation: "R23",
      subject: "Electrical & Electronics Engineering Workshop",
      subjectCode: "23A02101P",
      description: "JNTUA R23 Electrical & Electronics Engineering Workshop manual with hands-on wiring, earthing, electronic components, measuring equipment, and digital logic gates verification.",
      pdfUrl: labPdf || "/uploads/23A02101P_Electrical_and_Electronics_Engineering_Workshop.pdf",
    });
  }

  // 3. 23A03101T Engineering Graphics
  {
    const dir = path.join(s11, "23A03101T(Engineering Graphics)3");
    const u1 = copyFileSafe(path.join(dir, "Unit_1_Drawing_Basics_Curves_Scales.pdf"), "23A03101T_Unit_1_Drawing_Basics_Curves_Scales.pdf");
    const u2 = copyFileSafe(path.join(dir, "Unit_2_Orthographic_Projections_Points_Lines_Planes.pdf"), "23A03101T_Unit_2_Orthographic_Projections.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit_3_Projections_of_Solids.pdf"), "23A03101T_Unit_3_Projections_of_Solids.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit_4_Sections_and_Development_of_Surfaces.pdf"), "23A03101T_Unit_4_Sections_Development.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit_5_Conversion_of_Views.pdf"), "23A03101T_Unit_5_Conversion_of_Views.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Unit_1_Drawing_Basics_Curves_Scales.pdf"),
      path.join(dir, "Unit_2_Orthographic_Projections_Points_Lines_Planes.pdf"),
      path.join(dir, "Unit_3_Projections_of_Solids.pdf"),
      path.join(dir, "Unit_4_Sections_and_Development_of_Surfaces.pdf"),
      path.join(dir, "Unit_5_Conversion_of_Views.pdf"),
    ], "23A03101T_Engineering_Graphics_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-1",
      regulation: "R23",
      subject: "Engineering Graphics",
      subjectCode: "23A03101T",
      credits: "3",
      description: "JNTUA R23 Engineering Graphics lecture notes covering drawing fundamentals, engineering curves, scales, orthographic projections of points/lines/planes, projections of solids, sections, surface development, and conversion of views.",
      module1: "Unit 1: Drawing Basics, Curves, and Scales",
      module1Pdf: u1,
      module2: "Unit 2: Orthographic Projections (Points, Lines, Planes)",
      module2Pdf: u2,
      module3: "Unit 3: Projections of Solids",
      module3Pdf: u3,
      module4: "Unit 4: Sections & Development of Surfaces",
      module4Pdf: u4,
      module5: "Unit 5: Conversion of Views (Isometric & Orthographic)",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 4. 23A05101T Introduction to Programming
  {
    const dir = path.join(s11, "23A05101T(Introduction to Programming)3");
    const u1 = copyFileSafe(path.join(dir, "Unit_1_Introduction_to_Programming_and_Problem_Solving.pdf"), "23A05101T_Unit_1_Intro_Problem_Solving.pdf");
    const u2 = copyFileSafe(path.join(dir, "Unit_2_Control_Structures.pdf"), "23A05101T_Unit_2_Control_Structures.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit_3_Arrays_and_Strings.pdf"), "23A05101T_Unit_3_Arrays_and_Strings.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit_4_Pointers_and_User_Defined_Data_Types.pdf"), "23A05101T_Unit_4_Pointers_User_Defined_Types.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit_5_Functions_and_File_Handling.pdf"), "23A05101T_Unit_5_Functions_File_Handling.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Unit_1_Introduction_to_Programming_and_Problem_Solving.pdf"),
      path.join(dir, "Unit_2_Control_Structures.pdf"),
      path.join(dir, "Unit_3_Arrays_and_Strings.pdf"),
      path.join(dir, "Unit_4_Pointers_and_User_Defined_Data_Types.pdf"),
      path.join(dir, "Unit_5_Functions_and_File_Handling.pdf"),
    ], "23A05101T_Introduction_to_Programming_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-1",
      regulation: "R23",
      subject: "Introduction to Programming",
      subjectCode: "23A05101T",
      credits: "3",
      description: "JNTUA R23 Introduction to Programming in C study notes covering problem-solving algorithms, control statements, arrays, strings, structures, unions, pointers, functions, dynamic memory, and file I/O operations.",
      module1: "Unit 1: Introduction to Programming & Problem Solving",
      module1Pdf: u1,
      module2: "Unit 2: Control Structures & Loops",
      module2Pdf: u2,
      module3: "Unit 3: Arrays & Strings",
      module3Pdf: u3,
      module4: "Unit 4: Pointers & User Defined Data Types",
      module4Pdf: u4,
      module5: "Unit 5: Functions & File Handling",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 5. 23A05101P Computer Programming Lab
  {
    const dir = path.join(s11, "23A05101P(computer programming lab)1.5");
    const labPdf = copyFileSafe(path.join(dir, "C_Programming_Lab_Programs_and_Output.pdf"), "23A05101P_Computer_Programming_Lab_Manual.pdf");
    await saveLab({
      title: "Computer Programming Lab",
      branch: "AIML",
      semester: "1-1",
      regulation: "R23",
      subject: "Computer Programming Lab",
      subjectCode: "23A05101P",
      description: "JNTUA R23 Computer Programming Lab manual with complete C programs, algorithms, flowcharts, and sample input/output execution results covering conditionals, loops, arrays, pointers, functions, and files.",
      pdfUrl: labPdf || "/uploads/23A05101P_Computer_Programming_Lab.pdf",
    });
  }

  // 6. 23A54101 Linear Algebra & Calculus
  {
    const dir = path.join(s11, "23A54101(Linear Algebra & Calculus)3");
    const u1 = copyFileSafe(path.join(dir, "LAC_Unit_I_Matrices_Handwritten_Notes.pdf"), "23A54101_Unit_1_Matrices.pdf");
    const u2 = copyFileSafe(path.join(dir, "LAC_Unit_II_Eigenvalues_Handwritten_Notes.pdf"), "23A54101_Unit_2_Eigenvalues.pdf");
    const u3 = copyFileSafe(path.join(dir, "LAC_Unit_III_Mean_Value_Theorems_Handwritten_Notes.pdf"), "23A54101_Unit_3_Mean_Value_Theorems.pdf");
    const u4 = copyFileSafe(path.join(dir, "LAC_Unit_IV_Partial_Differentiation_Handwritten_Notes.pdf"), "23A54101_Unit_4_Partial_Differentiation.pdf");
    const u5 = copyFileSafe(path.join(dir, "LAC_Unit_V_Multiple_Integrals_Handwritten_Notes.pdf"), "23A54101_Unit_5_Multiple_Integrals.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "LAC_Unit_I_Matrices_Handwritten_Notes.pdf"),
      path.join(dir, "LAC_Unit_II_Eigenvalues_Handwritten_Notes.pdf"),
      path.join(dir, "LAC_Unit_III_Mean_Value_Theorems_Handwritten_Notes.pdf"),
      path.join(dir, "LAC_Unit_IV_Partial_Differentiation_Handwritten_Notes.pdf"),
      path.join(dir, "LAC_Unit_V_Multiple_Integrals_Handwritten_Notes.pdf"),
    ], "23A54101_Linear_Algebra_and_Calculus_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-1",
      regulation: "R23",
      subject: "Linear Algebra & Calculus",
      subjectCode: "23A54101",
      credits: "3",
      description: "JNTUA R23 Linear Algebra and Calculus notes covering Matrices, Eigenvalues, Eigenvectors, Cayley-Hamilton theorem, Mean Value Theorems, Partial Differentiation, Taylor's series, Maxima and Minima, and Multiple Integrals.",
      module1: "Unit 1: Matrices & Systems of Linear Equations",
      module1Pdf: u1,
      module2: "Unit 2: Eigenvalues and Eigenvectors",
      module2Pdf: u2,
      module3: "Unit 3: Mean Value Theorems",
      module3Pdf: u3,
      module4: "Unit 4: Partial Differentiation",
      module4Pdf: u4,
      module5: "Unit 5: Multiple Integrals",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 7. 23A56101T Engineering Physics
  {
    const dir = path.join(s11, "23A56101T(Engineering Physics)3");
    const u1 = copyFileSafe(path.join(dir, "Unit_I_Wave_Optics.pdf"), "23A56101T_Unit_1_Wave_Optics.pdf");
    const u2 = copyFileSafe(path.join(dir, "Unit_II_Crystallography_XRD.pdf"), "23A56101T_Unit_2_Crystallography_XRD.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit_III_Dielectric_Magnetic_Materials.pdf"), "23A56101T_Unit_3_Dielectric_Magnetic_Materials.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit_IV_Quantum_Mechanics_Free_Electron_Theory.pdf"), "23A56101T_Unit_4_Quantum_Mechanics.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit_V_Semiconductors.pdf"), "23A56101T_Unit_5_Semiconductors.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Unit_I_Wave_Optics.pdf"),
      path.join(dir, "Unit_II_Crystallography_XRD.pdf"),
      path.join(dir, "Unit_III_Dielectric_Magnetic_Materials.pdf"),
      path.join(dir, "Unit_IV_Quantum_Mechanics_Free_Electron_Theory.pdf"),
      path.join(dir, "Unit_V_Semiconductors.pdf"),
    ], "23A56101T_Engineering_Physics_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-1",
      regulation: "R23",
      subject: "Engineering Physics",
      subjectCode: "23A56101T",
      credits: "3",
      description: "JNTUA R23 Engineering Physics study notes covering Wave Optics, Crystallography & X-ray Diffraction, Dielectric & Magnetic Properties, Quantum Mechanics & Free Electron Theory, and Semiconductor Physics.",
      module1: "Unit 1: Wave Optics (Interference, Diffraction, Polarization)",
      module1Pdf: u1,
      module2: "Unit 2: Crystallography and X-ray Diffraction",
      module2Pdf: u2,
      module3: "Unit 3: Dielectric and Magnetic Materials",
      module3Pdf: u3,
      module4: "Unit 4: Quantum Mechanics & Free Electron Theory",
      module4Pdf: u4,
      module5: "Unit 5: Semiconductors & Devices",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 8. 23A56101P Engineering Physics Lab
  {
    const dir = path.join(s11, "23A56101P(Engineering Physics Lab)1");
    const labPdf = copyFileSafe(path.join(dir, "Engineering_Physics_Lab_Notes.pdf"), "23A56101P_Engineering_Physics_Lab_Manual.pdf");
    await saveLab({
      title: "Engineering Physics Lab",
      branch: "AIML",
      semester: "1-1",
      regulation: "R23",
      subject: "Engineering Physics Lab",
      subjectCode: "23A56101P",
      description: "JNTUA R23 Engineering Physics Laboratory manual covering experimental procedures, observations, formulas, calculations, and viva questions for Newton's Rings, Diffraction Grating, Laser Wavelength, Optical Fiber, Magnetic Hysteresis, and Bandgap Determination.",
      pdfUrl: labPdf || "/uploads/23A56101P_Engineering_Physics_Lab.pdf",
    });
  }

  // =========================================================================
  // SEMESTER 1-2
  // =========================================================================
  console.log("\n>>> PROCESSING SEMESTER 1-2 <<<");
  const s12 = path.join(SOURCE_BASE, "1-2");

  // 1. 23A01201T Basic Civil & Mechanical Engineering
  {
    const partA = path.join(s12, "23A01201T Basic Civil & Mechanical Engineering(3)part-A");
    const partB = path.join(s12, "23A01201T PART B BASIC MECHANICAL ENGINEERING");

    const u1 = copyFileSafe(path.join(partA, "Unit_1_Basics_of_Civil_Engineering_23A01201T.pdf"), "23A01201T_Unit_1_Basics_of_Civil.pdf");
    const u2 = copyFileSafe(path.join(partA, "Unit_2_Surveying_23A01201T.pdf"), "23A01201T_Unit_2_Surveying.pdf");
    const u3 = copyFileSafe(path.join(partA, "Unit_3_Transportation_Water_Environmental_23A01201T.pdf"), "23A01201T_Unit_3_Transportation_Water.pdf");
    const u4 = copyFileSafe(path.join(partB, "Unit_1_Intro_Mechanical_Engg_and_Materials.pdf"), "23A01201T_Unit_4_Intro_Mech_Engg.pdf");
    const u5 = copyFileSafe(path.join(partB, "Unit_2_Manufacturing_and_Thermal_Engg.pdf"), "23A01201T_Unit_5_Manufacturing_Thermal.pdf");

    const fullPdf = await mergePdfs([
      path.join(partA, "Unit_1_Basics_of_Civil_Engineering_23A01201T.pdf"),
      path.join(partA, "Unit_2_Surveying_23A01201T.pdf"),
      path.join(partA, "Unit_3_Transportation_Water_Environmental_23A01201T.pdf"),
      path.join(partB, "Unit_1_Intro_Mechanical_Engg_and_Materials.pdf"),
      path.join(partB, "Unit_2_Manufacturing_and_Thermal_Engg.pdf"),
      path.join(partB, "Unit_3_Power_Plants_Transmission_Robotics.pdf"),
    ], "23A01201T_Basic_Civil_and_Mechanical_Engineering_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Basic Civil and Mechanical Engineering",
      subjectCode: "23A01201T",
      credits: "3",
      description: "JNTUA R23 Basic Civil and Mechanical Engineering study material covering civil infrastructure, surveying, transportation, water resources, mechanical manufacturing processes, thermal engineering, power plants, and robotics.",
      module1: "Unit 1: Basics of Civil Engineering & Building Materials",
      module1Pdf: u1,
      module2: "Unit 2: Surveying & Structural Engineering",
      module2Pdf: u2,
      module3: "Unit 3: Transportation, Water Resources & Environmental Engg",
      module3Pdf: u3,
      module4: "Unit 4: Introduction to Mechanical Engineering & Materials",
      module4Pdf: u4,
      module5: "Unit 5: Manufacturing Processes & Thermal Engineering",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 2. 23A05201T Data Structures
  {
    const dir = path.join(s12, "23A05201T Data Structures(3)");
    const u1 = copyFileSafe(path.join(dir, "Unit_1_Linear_Data_Structures_Searching_Sorting.pdf"), "23A05201T_Unit_1_Searching_Sorting.pdf");
    const u2 = copyFileSafe(path.join(dir, "Unit_2_Linked_Lists.pdf"), "23A05201T_Unit_2_Linked_Lists.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit_3_Stacks.pdf"), "23A05201T_Unit_3_Stacks.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit_4_Queues_and_Deques.pdf"), "23A05201T_Unit_4_Queues_Deques.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit_5_Trees_and_Hashing.pdf"), "23A05201T_Unit_5_Trees_Hashing.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Unit_1_Linear_Data_Structures_Searching_Sorting.pdf"),
      path.join(dir, "Unit_2_Linked_Lists.pdf"),
      path.join(dir, "Unit_3_Stacks.pdf"),
      path.join(dir, "Unit_4_Queues_and_Deques.pdf"),
      path.join(dir, "Unit_5_Trees_and_Hashing.pdf"),
    ], "23A05201T_Data_Structures_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Data Structures",
      subjectCode: "23A05201T",
      credits: "3",
      description: "JNTUA R23 Data Structures course notes covering linear and non-linear data structures: searching and sorting algorithms, singly/doubly linked lists, stacks and applications, queues and deques, binary trees, binary search trees, and hashing techniques.",
      module1: "Unit 1: Linear Data Structures, Searching and Sorting",
      module1Pdf: u1,
      module2: "Unit 2: Linked Lists (Singly, Doubly, Circular)",
      module2Pdf: u2,
      module3: "Unit 3: Stacks & Applications",
      module3Pdf: u3,
      module4: "Unit 4: Queues and Deques",
      module4Pdf: u4,
      module5: "Unit 5: Trees and Hashing",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 3. 23A05201P Data Structures Lab
  {
    const dir = path.join(s12, "23A05201P Data Structures Lab(1.5)");
    const labPdf = copyFileSafe(path.join(dir, "Data_Structures_Lab_Programs.pdf"), "23A05201P_Data_Structures_Lab_Manual.pdf");
    await saveLab({
      title: "Data Structures Lab",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Data Structures Lab",
      subjectCode: "23A05201P",
      description: "JNTUA R23 Data Structures Laboratory manual containing complete implementations in C/C++ of searching, sorting, stack operations, queue variants, linked list operations, and binary search tree traversals.",
      pdfUrl: labPdf || "/uploads/23A05201P_Data_Structures_Lab.pdf",
    });
  }

  // 4. 23A51202T Chemistry
  {
    const dir = path.join(s12, "23A51202T Chemistry (3)");
    const u1 = copyFileSafe(path.join(dir, "Unit_1_Structure_and_Bonding_Models.pdf"), "23A51202T_Unit_1_Structure_Bonding.pdf");
    const u2 = copyFileSafe(path.join(dir, "Unit_2_Modern_Engineering_Materials.pdf"), "23A51202T_Unit_2_Modern_Materials.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit_3_Electrochemistry.pdf"), "23A51202T_Unit_3_Electrochemistry.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit_4_Polymer_Chemistry.pdf"), "23A51202T_Unit_4_Polymer_Chemistry.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit_5_Instrumental_Methods.pdf"), "23A51202T_Unit_5_Instrumental_Methods.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Unit_1_Structure_and_Bonding_Models.pdf"),
      path.join(dir, "Unit_2_Modern_Engineering_Materials.pdf"),
      path.join(dir, "Unit_3_Electrochemistry.pdf"),
      path.join(dir, "Unit_4_Polymer_Chemistry.pdf"),
      path.join(dir, "Unit_5_Instrumental_Methods.pdf"),
    ], "23A51202T_Chemistry_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Chemistry",
      subjectCode: "23A51202T",
      credits: "3",
      description: "JNTUA R23 Engineering Chemistry study notes covering Atomic Structure and Bonding Models, Modern Engineering Materials (Nanomaterials, Composites), Electrochemistry and Batteries, Polymer Chemistry, and Instrumental Methods of Chemical Analysis.",
      module1: "Unit 1: Structure and Bonding Models",
      module1Pdf: u1,
      module2: "Unit 2: Modern Engineering Materials",
      module2Pdf: u2,
      module3: "Unit 3: Electrochemistry and Corrosion",
      module3Pdf: u3,
      module4: "Unit 4: Polymer Chemistry",
      module4Pdf: u4,
      module5: "Unit 5: Instrumental Methods and Chromatography",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 5. 23A51202P Chemistry Lab
  {
    const dir = path.join(s12, "23A51202P Chemistry Lab(1)");
    const labPdf = copyFileSafe(path.join(dir, "Chemistry_Lab_Handwritten_Record.pdf"), "23A51202P_Chemistry_Lab_Manual.pdf");
    await saveLab({
      title: "Chemistry Lab",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Chemistry Lab",
      subjectCode: "23A51202P",
      description: "JNTUA R23 Chemistry Laboratory manual including titration experiments, hardness of water estimation, conductometry, pH metric titrations, and preparation of engineering polymers and nanomaterials.",
      pdfUrl: labPdf || "/uploads/23A51202P_Chemistry_Lab.pdf",
    });
  }

  // 6. 23A54201 Differential Equations & Vector Calculus
  {
    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Differential Equations and Vector Calculus",
      subjectCode: "23A54201",
      credits: "3",
      description: "JNTUA R23 Differential Equations and Vector Calculus notes covering first order differential equations, higher order linear differential equations with constant coefficients, partial differential equations, vector differentiation, and vector integration (Green's, Stokes', and Gauss divergence theorems).",
      module1: "Unit 1: Linear Differential Equations of Higher Order",
      module2: "Unit 2: Applications of Differential Equations",
      module3: "Unit 3: Partial Differential Equations",
      module4: "Unit 4: Vector Differentiation",
      module5: "Unit 5: Vector Integration (Green's, Stokes', Gauss Divergence)",
      pdfUrl: "/uploads/23A54201_Differential_Equations_and_Vector_Calculus.pdf",
    });
  }

  // 7. 23A52201T Communicative English
  {
    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Communicative English",
      subjectCode: "23A52201T",
      credits: "2",
      description: "JNTUA R23 Communicative English notes covering reading comprehension, vocabulary building, functional grammar, formal writing skills (emails, letters, resumes, reports), and presentation fundamentals.",
      module1: "Unit 1: Lesson from Great Thinkers & Reading Skills",
      module2: "Unit 2: Vocabulary in Context & Grammar Essentials",
      module3: "Unit 3: Writing Paragraphs and Formal Letters",
      module4: "Unit 4: Technical Reports and Resume Preparation",
      module5: "Unit 5: Presentation and Interview Skills",
      pdfUrl: "/uploads/23A52201T_Communicative_English.pdf",
    });
  }

  // 8. 23A52201P Communicative English Lab
  {
    await saveLab({
      title: "Communicative English Lab",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Communicative English Lab",
      subjectCode: "23A52201P",
      description: "JNTUA R23 Communicative English Laboratory manual covering phonetics, speech sounds, intonation, accent neutralization, group discussions, public speaking, and presentation techniques.",
      pdfUrl: "/uploads/23A52201P_Communicative_English_Lab.pdf",
    });
  }

  // 9. 23A03201 Engineering Workshop
  {
    await saveLab({
      title: "Engineering Workshop",
      branch: "AIML",
      semester: "1-2",
      regulation: "R23",
      subject: "Engineering Workshop",
      subjectCode: "23A03201",
      description: "JNTUA R23 Engineering Workshop practical manual covering Carpentry, Fitting, Tin-Smithy, House Wiring, Foundry, and Blacksmithy trades with tools, safety precautions, and job exercises.",
      pdfUrl: "/uploads/23A03201_Engineering_Workshop.pdf",
    });
  }

  // =========================================================================
  // SEMESTER 2-1
  // =========================================================================
  console.log("\n>>> PROCESSING SEMESTER 2-1 <<<");
  const s21 = path.join(SOURCE_BASE, "2-1");

  // 1. 23A05302T Advanced Data Structures & Algorithms Analysis
  {
    const dir = path.join(s21, "23A05302T Advanced Data Structures & algorithms analysis(3)");
    const u1 = copyFileSafe(path.join(dir, "Unit_1_Linear_Data_Structures_Searching_Sorting.pdf"), "23A05302T_Unit_1_Searching_Sorting.pdf");
    const u2 = copyFileSafe(path.join(dir, "Unit_2_Linked_Lists.pdf"), "23A05302T_Unit_2_Linked_Lists.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit_3_Stacks.pdf"), "23A05302T_Unit_3_Stacks.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit_4_Queues_and_Deques.pdf"), "23A05302T_Unit_4_Queues_Deques.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit_5_Trees_and_Hashing.pdf"), "23A05302T_Unit_5_Trees_Hashing.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Unit_1_Linear_Data_Structures_Searching_Sorting.pdf"),
      path.join(dir, "Unit_2_Linked_Lists.pdf"),
      path.join(dir, "Unit_3_Stacks.pdf"),
      path.join(dir, "Unit_4_Queues_and_Deques.pdf"),
      path.join(dir, "Unit_5_Trees_and_Hashing.pdf"),
    ], "23A05302T_ADSAA_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-1",
      regulation: "R23",
      subject: "Advanced Data Structures & Algorithms Analysis",
      subjectCode: "23A05302T",
      credits: "3",
      description: "JNTUA R23 Advanced Data Structures and Algorithm Analysis comprehensive study guide covering asymptotic notation, divide and conquer, AVL trees, Red-Black trees, B-Trees, dynamic programming, and greedy algorithms.",
      module1: "Unit 1: Algorithm Analysis & Divide and Conquer",
      module1Pdf: u1,
      module2: "Unit 2: Balanced Search Trees (AVL, Red-Black Trees)",
      module2Pdf: u2,
      module3: "Unit 3: Priority Queues & Disjoint Sets",
      module3Pdf: u3,
      module4: "Unit 4: Dynamic Programming & Greedy Method",
      module4Pdf: u4,
      module5: "Unit 5: Graph Algorithms, Backtracking & Branch and Bound",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 2. 23A05302P ADSAA Lab
  {
    const dir = path.join(s21, "23A05302P Advanced Data Structures and algorithm analysis lab(1.5)");
    const labPdf = copyFileSafe(path.join(dir, "ADSAA_Lab_Programs.pdf"), "23A05302P_ADSAA_Lab_Manual.pdf");
    await saveLab({
      title: "Advanced Data Structures and Algorithm Analysis Lab",
      branch: "AIML",
      semester: "2-1",
      regulation: "R23",
      subject: "Advanced Data Structures and Algorithm Analysis Lab",
      subjectCode: "23A05302P",
      description: "JNTUA R23 ADSAA Laboratory manual with complete implementations of balanced search trees, heaps, disjoint sets, graph traversals, and dynamic programming algorithms.",
      pdfUrl: labPdf || "/uploads/23A05302P_Advanced_Data_Structures_and_Algorithm_Analysis_Lab.pdf",
    });
  }

  // 3. 23A05303T Object-Oriented Programming through Java
  {
    const dir = path.join(s21, "23A05303T Object-Oriented Programming JAVA(3)");
    const u1 = copyFileSafe(path.join(dir, "Unit1_Java_Basics_Notes.pdf"), "23A05303T_Unit1_Java_Basics.pdf");
    const u2 = copyFileSafe(path.join(dir, "Unit2_Classes_Objects_Methods_Notes.pdf"), "23A05303T_Unit2_Classes_Objects.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit3_Arrays_Inheritance_Interfaces_Notes.pdf"), "23A05303T_Unit3_Inheritance_Interfaces.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit4_Packages_Exceptions_IO_Notes.pdf"), "23A05303T_Unit4_Packages_Exceptions_IO.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit5_Strings_Threads_JDBC_JavaFX_Notes.pdf"), "23A05303T_Unit5_Threads_JDBC_JavaFX.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Unit1_Java_Basics_Notes.pdf"),
      path.join(dir, "Unit2_Classes_Objects_Methods_Notes.pdf"),
      path.join(dir, "Unit3_Arrays_Inheritance_Interfaces_Notes.pdf"),
      path.join(dir, "Unit4_Packages_Exceptions_IO_Notes.pdf"),
      path.join(dir, "Unit5_Strings_Threads_JDBC_JavaFX_Notes.pdf"),
    ], "23A05303T_OOP_Java_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-1",
      regulation: "R23",
      subject: "Object-Oriented Programming through Java",
      subjectCode: "23A05303T",
      credits: "3",
      description: "JNTUA R23 Object-Oriented Programming through Java complete lecture notes covering OOP fundamentals, Classes & Objects, Inheritance, Interfaces, Packages, Exception Handling, Multithreading, I/O Streams, JDBC, and JavaFX GUI development.",
      module1: "Unit 1: Java Basics & OOP Principles",
      module1Pdf: u1,
      module2: "Unit 2: Classes, Objects and Methods",
      module2Pdf: u2,
      module3: "Unit 3: Inheritance, Polymorphism & Interfaces",
      module3Pdf: u3,
      module4: "Unit 4: Packages, Exceptions & File I/O",
      module4Pdf: u4,
      module5: "Unit 5: Multithreading, JDBC & JavaFX",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 4. 23A05303P OOP Java Lab
  {
    const dir = path.join(s21, "23A05303P Object-Oriented Programming JAVA lab(1.5)");
    const labPdf = copyFileSafe(path.join(dir, "OOP_Java_Lab_Programs_and_Outputs.pdf"), "23A05303P_OOP_Java_Lab_Manual.pdf");
    await saveLab({
      title: "Object-Oriented Programming Java Lab",
      branch: "AIML",
      semester: "2-1",
      regulation: "R23",
      subject: "Object-Oriented Programming Through Java Lab",
      subjectCode: "23A05303P",
      description: "JNTUA R23 OOP Java Lab manual covering class creation, method overloading/overriding, inheritance hierarchies, custom exception handling, multithreading synchronization, and JDBC database connectivity programs.",
      pdfUrl: labPdf || "/uploads/23A05303P_Object-Oriented_Programming_Through_Java_Lab.pdf",
    });
  }

  // 5. 23A05304 Python Programming
  {
    const dir = path.join(s21, "23A05304 python programming(2)");
    const u1 = copyFileSafe(path.join(dir, "Python_Unit_I_Basics_and_Control_Flow.pdf"), "23A05304_Unit_1_Basics_Control_Flow.pdf");
    const u2 = copyFileSafe(path.join(dir, "Python_Unit_II_Functions_Strings_Lists.pdf"), "23A05304_Unit_2_Functions_Strings_Lists.pdf");
    const u3 = copyFileSafe(path.join(dir, "Python_Unit_III_Dictionaries_Tuples_Sets.pdf"), "23A05304_Unit_3_Dictionaries_Tuples_Sets.pdf");
    const u4 = copyFileSafe(path.join(dir, "Python_Unit_IV_Files_and_OOP.pdf"), "23A05304_Unit_4_Files_OOP.pdf");
    const u5 = copyFileSafe(path.join(dir, "Python_Unit_V_Introduction_to_Data_Science.pdf"), "23A05304_Unit_5_Intro_Data_Science.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Python_Unit_I_Basics_and_Control_Flow.pdf"),
      path.join(dir, "Python_Unit_II_Functions_Strings_Lists.pdf"),
      path.join(dir, "Python_Unit_III_Dictionaries_Tuples_Sets.pdf"),
      path.join(dir, "Python_Unit_IV_Files_and_OOP.pdf"),
      path.join(dir, "Python_Unit_V_Introduction_to_Data_Science.pdf"),
    ], "23A05304_Python_Programming_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-1",
      regulation: "R23",
      subject: "Python Programming",
      subjectCode: "23A05304",
      credits: "2",
      description: "JNTUA R23 Python Programming study notes covering syntax fundamentals, conditional loops, functions, lists, tuples, dictionaries, sets, object-oriented concepts in Python, file operations, and introductory NumPy & Pandas for Data Science.",
      module1: "Unit 1: Python Basics, Data Types & Control Flow",
      module1Pdf: u1,
      module2: "Unit 2: Functions, Scopes, Strings and Lists",
      module2Pdf: u2,
      module3: "Unit 3: Dictionaries, Tuples and Sets",
      module3Pdf: u3,
      module4: "Unit 4: Object-Oriented Programming & File Handling",
      module4Pdf: u4,
      module5: "Unit 5: Introduction to Data Science (NumPy, Pandas, Matplotlib)",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 6. 23A31301T Artificial Intelligence
  {
    const dir = path.join(s21, "23A31301T Artificial Intelligence(3)");
    const u1 = copyFileSafe(path.join(dir, "AI_Unit1_Introduction_and_Intelligent_Agents.pdf"), "23A31301T_Unit1_Intelligent_Agents.pdf");
    const u2 = copyFileSafe(path.join(dir, "AI_Unit2_Searching_and_Game_Playing.pdf"), "23A31301T_Unit2_Search_Game_Playing.pdf");
    const u3 = copyFileSafe(path.join(dir, "AI_Unit3_Knowledge_Representation_and_Reasoning.pdf"), "23A31301T_Unit3_Knowledge_Representation.pdf");
    const u4 = copyFileSafe(path.join(dir, "AI_Unit4_Logic_and_Learning.pdf"), "23A31301T_Unit4_Logic_and_Learning.pdf");
    const u5 = copyFileSafe(path.join(dir, "unit-5.pdf"), "23A31301T_Unit5_AI_Applications.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "AI_Unit1_Introduction_and_Intelligent_Agents.pdf"),
      path.join(dir, "AI_Unit2_Searching_and_Game_Playing.pdf"),
      path.join(dir, "AI_Unit3_Knowledge_Representation_and_Reasoning.pdf"),
      path.join(dir, "AI_Unit4_Logic_and_Learning.pdf"),
      path.join(dir, "unit-5.pdf"),
    ], "23A31301T_Artificial_Intelligence_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-1",
      regulation: "R23",
      subject: "Artificial Intelligence",
      subjectCode: "23A31301T",
      credits: "3",
      description: "JNTUA R23 Artificial Intelligence comprehensive notes covering intelligent agent models, uninformed and informed heuristic search strategies (A*, IDA*), adversarial game playing, propositional and first-order predicate logic, knowledge representation, probabilistic reasoning, and modern AI applications.",
      module1: "Unit 1: Introduction to AI & Intelligent Agents",
      module1Pdf: u1,
      module2: "Unit 2: Problem Solving, Heuristic Search & Game Playing",
      module2Pdf: u2,
      module3: "Unit 3: Knowledge Representation and First-Order Logic",
      module3Pdf: u3,
      module4: "Unit 4: Classical Planning, Uncertainty & Learning",
      module4Pdf: u4,
      module5: "Unit 5: Philosophical Foundations, Ethics & AI Applications",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 7. 23A54301 Discrete Mathematics & Graph Theory
  {
    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-1",
      regulation: "R23",
      subject: "Discrete Mathematics and Graph Theory",
      subjectCode: "23A54301",
      credits: "3",
      description: "JNTUA R23 Discrete Mathematics and Graph Theory notes covering Mathematical Logic, Predicates and Quantifiers, Sets, Relations, Functions, Recurrence Relations, Generating Functions, Graph Theory basics, Trees, and Spanning Trees.",
      module1: "Unit 1: Mathematical Logic & Proof Methods",
      module2: "Unit 2: Sets, Relations, Functions & Lattices",
      module3: "Unit 3: Combinatorics & Recurrence Relations",
      module4: "Unit 4: Graph Theory Basics & Traversals",
      module5: "Unit 5: Trees, Spanning Trees & Graph Algorithms",
      pdfUrl: "/uploads/23A54301_Discrete_Mathematics_and_Graph_Theory.pdf",
    });
  }

  // 8. 23A52301 Universal Human Values
  {
    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-1",
      regulation: "R23",
      subject: "Universal Human Values",
      subjectCode: "23A52301",
      credits: "2",
      description: "JNTUA R23 Universal Human Values notes focusing on self-exploration, harmony in oneself, harmony in family and society, harmony in nature and existence, and professional ethics.",
      module1: "Unit 1: Introduction to Value Education & Self-Exploration",
      module2: "Unit 2: Harmony in the Human Being",
      module3: "Unit 3: Harmony in the Family and Society",
      module4: "Unit 4: Harmony in Nature and Existence",
      module5: "Unit 5: Implications of Holistic Understanding & Professional Ethics",
      pdfUrl: "/uploads/23A52301_Universal_Human_Values.pdf",
    });
  }

  // =========================================================================
  // SEMESTER 2-2
  // =========================================================================
  console.log("\n>>> PROCESSING SEMESTER 2-2 <<<");
  const s22 = path.join(SOURCE_BASE, "2-2");

  // 1. 23A05402T Database Management Systems
  {
    const dir = path.join(s22, "23A05402T Database Management Systems(3)");
    const u1 = copyFileSafe(path.join(dir, "DBMS_Unit1_Introduction_and_ER_Model.pdf"), "23A05402T_Unit1_Intro_ER_Model.pdf");
    const u2 = copyFileSafe(path.join(dir, "DBMS_Unit2_Relational_Model_and_Basic_SQL.pdf"), "23A05402T_Unit2_Relational_Basic_SQL.pdf");
    const u3 = copyFileSafe(path.join(dir, "DBMS_Unit3_SQL.pdf"), "23A05402T_Unit3_Advanced_SQL.pdf");
    const u4 = copyFileSafe(path.join(dir, "DBMS_Unit4_Normalization.pdf"), "23A05402T_Unit4_Normalization.pdf");
    const u5 = copyFileSafe(path.join(dir, "DBMS_Unit5_Transactions_and_Indexing.pdf"), "23A05402T_Unit5_Transactions_Indexing.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "DBMS_Unit1_Introduction_and_ER_Model.pdf"),
      path.join(dir, "DBMS_Unit2_Relational_Model_and_Basic_SQL.pdf"),
      path.join(dir, "DBMS_Unit3_SQL.pdf"),
      path.join(dir, "DBMS_Unit4_Normalization.pdf"),
      path.join(dir, "DBMS_Unit5_Transactions_and_Indexing.pdf"),
    ], "23A05402T_DBMS_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-2",
      regulation: "R23",
      subject: "Database Management Systems",
      subjectCode: "23A05402T",
      credits: "3",
      description: "JNTUA R23 Database Management Systems study notes covering ER modeling, relational database schema, SQL queries and constraints, functional dependencies, schema normalization (1NF to BCNF), transaction ACID properties, concurrency control, and B+ Tree indexing.",
      module1: "Unit 1: Database System Architecture & ER Model",
      module1Pdf: u1,
      module2: "Unit 2: Relational Model & Relational Algebra",
      module2Pdf: u2,
      module3: "Unit 3: Structured Query Language (SQL)",
      module3Pdf: u3,
      module4: "Unit 4: Schema Refinement and Normal Forms (1NF-BCNF)",
      module4Pdf: u4,
      module5: "Unit 5: Transaction Management, Concurrency Control & Indexing",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 2. 23A05402P DBMS Lab
  {
    const dir = path.join(s22, "23A05402P Database Management Systems Lab(1.5)");
    const labPdf = copyFileSafe(path.join(dir, "DBMS_Lab_23A05402P_Programs.pdf"), "23A05402P_DBMS_Lab_Manual.pdf");
    await saveLab({
      title: "Database Management Systems Lab",
      branch: "AIML",
      semester: "2-2",
      regulation: "R23",
      subject: "Database Management Systems Lab",
      subjectCode: "23A05402P",
      description: "JNTUA R23 DBMS Lab manual with complete SQL commands (DDL, DML, DCL, TCL), complex queries, nested subqueries, views, PL/SQL procedures, functions, triggers, and cursors.",
      pdfUrl: labPdf || "/uploads/23A05402P_Database_Management_Systems_Lab.pdf",
    });
  }

  // 3. 23A30402 Digital Logic and Computer Organization
  {
    const dir = path.join(s22, "23A30402 Digital Logic and Computer organization(3)");
    const u1 = copyFileSafe(path.join(dir, "unit-1.pdf"), "23A30402_Unit_1_Digital_Logic.pdf");
    const u2 = copyFileSafe(path.join(dir, "DLCO_Unit2_Sequential_Circuits_Computer_Structure.pdf"), "23A30402_Unit_2_Sequential_Circuits.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit3_Computer_Organization_Notes.pdf"), "23A30402_Unit_3_Computer_Organization.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit-IV_Memory_Organization_Notes.pdf"), "23A30402_Unit_4_Memory_Organization.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit-V_IO_Organization_Notes.pdf"), "23A30402_Unit_5_IO_Organization.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "unit-1.pdf"),
      path.join(dir, "DLCO_Unit2_Sequential_Circuits_Computer_Structure.pdf"),
      path.join(dir, "Unit3_Computer_Organization_Notes.pdf"),
      path.join(dir, "Unit-IV_Memory_Organization_Notes.pdf"),
      path.join(dir, "Unit-V_IO_Organization_Notes.pdf"),
    ], "23A30402_DLCO_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-2",
      regulation: "R23",
      subject: "Digital Logic and Computer Organization",
      subjectCode: "23A30402",
      credits: "3",
      description: "JNTUA R23 Digital Logic & Computer Organization notes covering boolean algebra, combinational and sequential logic circuits, computer arithmetic, instruction sets, CPU register organization, cache & virtual memory hierarchies, and I/O interfacing.",
      module1: "Unit 1: Digital Logic & Combinational Circuits",
      module1Pdf: u1,
      module2: "Unit 2: Sequential Circuits & Register Transfer Logic",
      module2Pdf: u2,
      module3: "Unit 3: Central Processing Unit & Computer Arithmetic",
      module3Pdf: u3,
      module4: "Unit 4: Memory System Organization & Cache Memory",
      module4Pdf: u4,
      module5: "Unit 5: Input-Output Organization & DMA",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 4. 23A31401T Machine Learning
  {
    const dir = path.join(s22, "23A31401T Machine Learning(3)");
    const u1 = copyFileSafe(path.join(dir, "ML_Unit1_Introduction_to_Machine_Learning.pdf"), "23A31401T_Unit_1_Intro_to_ML.pdf");
    const u2 = copyFileSafe(path.join(dir, "ML_Unit2_Nearest_Neighbor_Models.pdf"), "23A31401T_Unit_2_Nearest_Neighbor.pdf");
    const u3 = copyFileSafe(path.join(dir, "ML_Unit3_Decision_Trees_and_Bayes_Classifier.pdf"), "23A31401T_Unit_3_Decision_Trees_Bayes.pdf");
    const u4 = copyFileSafe(path.join(dir, "ML_Unit4_Linear_Discriminants_SVM_MLP.pdf"), "23A31401T_Unit_4_SVM_and_MLP.pdf");
    const u5 = copyFileSafe(path.join(dir, "ML_Unit5_Clustering.pdf"), "23A31401T_Unit_5_Clustering.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "ML_Unit1_Introduction_to_Machine_Learning.pdf"),
      path.join(dir, "ML_Unit2_Nearest_Neighbor_Models.pdf"),
      path.join(dir, "ML_Unit3_Decision_Trees_and_Bayes_Classifier.pdf"),
      path.join(dir, "ML_Unit4_Linear_Discriminants_SVM_MLP.pdf"),
      path.join(dir, "ML_Unit5_Clustering.pdf"),
    ], "23A31401T_Machine_Learning_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-2",
      regulation: "R23",
      subject: "Machine Learning",
      subjectCode: "23A31401T",
      credits: "3",
      description: "JNTUA R23 Machine Learning core subject notes covering supervised vs unsupervised learning paradigms, k-Nearest Neighbors, Naive Bayes classifier, Decision Trees, Linear Discriminant Analysis, Support Vector Machines (SVM), Multi-Layer Perceptrons, and K-Means/Hierarchical Clustering algorithms.",
      module1: "Unit 1: Introduction to Machine Learning & Paradigms",
      module1Pdf: u1,
      module2: "Unit 2: Nearest Neighbor Models & Instance-Based Learning",
      module2Pdf: u2,
      module3: "Unit 3: Decision Tree Induction & Bayesian Classification",
      module3Pdf: u3,
      module4: "Unit 4: Linear Discriminants, Support Vector Machines (SVM) & Neural Nets",
      module4Pdf: u4,
      module5: "Unit 5: Unsupervised Clustering & Dimensionality Reduction",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 5. 23A31403 AI & ML Lab
  {
    const dir = path.join(s22, "23A31403 AI & ML Lab(1.5)");
    const labPdf = copyFileSafe(path.join(dir, "AI_ML_Lab_23A31403_Programs (2).pdf"), "23A31403_AI_and_ML_Lab_Manual.pdf");
    await saveLab({
      title: "AI & ML Lab",
      branch: "AIML",
      semester: "2-2",
      regulation: "R23",
      subject: "AI and ML Lab",
      subjectCode: "23A31403",
      description: "JNTUA R23 AI & ML Laboratory manual with complete Python programs implementing A* Search, Minimax game algorithm, Linear & Logistic Regression, Decision Tree classifier, Naive Bayes model, SVM, and K-Means clustering.",
      pdfUrl: labPdf || "/uploads/23A31403_AI_and_ML_Lab.pdf",
    });
  }

  // 6. 23A52402e Optimization Techniques
  {
    const dir = path.join(s22, "23A52402e Optimization Techniques(2)");
    const u1 = copyFileSafe(path.join(dir, "OT_Unit1_Intro_and_Linear_Programming_23A52402e.pdf"), "23A52402e_Unit_1_Linear_Programming.pdf");
    const u2 = copyFileSafe(path.join(dir, "OT_Unit2_Transportation_and_Assignment_23A52402e.pdf"), "23A52402e_Unit_2_Transportation_Assignment.pdf");
    const u3 = copyFileSafe(path.join(dir, "OT_Unit3_Sequencing_23A52402e.pdf"), "23A52402e_Unit_3_Sequencing.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit4_Estimation_and_Testing_of_Hypothesis_23A54401.pdf"), "23A52402e_Unit_4_Dynamic_Programming.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit5_Small_Sample_Tests_23A54401.pdf"), "23A52402e_Unit_5_Nonlinear_Optimization.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "OT_Unit1_Intro_and_Linear_Programming_23A52402e.pdf"),
      path.join(dir, "OT_Unit2_Transportation_and_Assignment_23A52402e.pdf"),
      path.join(dir, "OT_Unit3_Sequencing_23A52402e.pdf"),
    ], "23A52402e_Optimization_Techniques_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-2",
      regulation: "R23",
      subject: "Optimization Techniques",
      subjectCode: "23A52402e",
      credits: "2",
      description: "JNTUA R23 Optimization Techniques study notes covering Linear Programming Problem formulation, Simplex method, Dual Simplex, Transportation models, Assignment problems, Sequencing models, and Dynamic Programming.",
      module1: "Unit 1: Introduction to Optimization & Linear Programming",
      module1Pdf: u1,
      module2: "Unit 2: Transportation & Assignment Problems",
      module2Pdf: u2,
      module3: "Unit 3: Sequencing Models & Game Theory",
      module3Pdf: u3,
      module4: "Unit 4: Dynamic Programming & Integer Programming",
      module4Pdf: u4,
      module5: "Unit 5: Non-linear Optimization & Metaheuristics",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 7. 23A54401 Probability & Statistics
  {
    const dir = path.join(s22, "23A54401 Probability & Statistics(3)");
    const u1 = copyFileSafe(path.join(dir, "Unit1_Descriptive_Statistics_23A54401.pdf"), "23A54401_Unit_1_Descriptive_Statistics.pdf");
    const u2 = copyFileSafe(path.join(dir, "Unit2_Probability_23A54401.pdf"), "23A54401_Unit_2_Probability.pdf");
    const u3 = copyFileSafe(path.join(dir, "Unit3_Probability_Distributions_23A54401.pdf"), "23A54401_Unit_3_Distributions.pdf");
    const u4 = copyFileSafe(path.join(dir, "Unit4_Estimation_and_Testing_of_Hypothesis_23A54401.pdf"), "23A54401_Unit_4_Hypothesis_Testing.pdf");
    const u5 = copyFileSafe(path.join(dir, "Unit5_Small_Sample_Tests_23A54401.pdf"), "23A54401_Unit_5_Small_Sample_Tests.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "Unit1_Descriptive_Statistics_23A54401.pdf"),
      path.join(dir, "Unit2_Probability_23A54401.pdf"),
      path.join(dir, "Unit3_Probability_Distributions_23A54401.pdf"),
      path.join(dir, "Unit4_Estimation_and_Testing_of_Hypothesis_23A54401.pdf"),
      path.join(dir, "Unit5_Small_Sample_Tests_23A54401.pdf"),
    ], "23A54401_Probability_and_Statistics_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "2-2",
      regulation: "R23",
      subject: "Probability & Statistics",
      subjectCode: "23A54401",
      credits: "3",
      description: "JNTUA R23 Probability and Statistics lecture notes covering Descriptive Statistics, Probability axioms, Bayes Theorem, Random Variables, Binomial/Poisson/Normal distributions, Large Sample Tests (Z-test), and Small Sample Tests (t-test, F-test, Chi-Square test).",
      module1: "Unit 1: Descriptive Statistics & Data Summarization",
      module1Pdf: u1,
      module2: "Unit 2: Probability & Bayes Theorem",
      module2Pdf: u2,
      module3: "Unit 3: Probability Distributions (Binomial, Poisson, Normal)",
      module3Pdf: u3,
      module4: "Unit 4: Sampling Theory & Large Sample Tests",
      module4Pdf: u4,
      module5: "Unit 5: Small Sample Tests (t-test, F-test, Chi-Square)",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // =========================================================================
  // SEMESTER 3-1
  // =========================================================================
  console.log("\n>>> PROCESSING SEMESTER 3-1 <<<");
  const s31 = path.join(SOURCE_BASE, "3-1");

  // 1. 23A05504b Soft Computing
  {
    const dir = path.join(s31, "23A05504b Soft Computing");
    const u1 = copyFileSafe(path.join(dir, "SoftComputing_Unit1_Introduction.pdf"), "23A05504b_Unit_1_Intro_Soft_Computing.pdf");
    const u2 = copyFileSafe(path.join(dir, "SoftComputing_Unit2_FuzzySystems.pdf"), "23A05504b_Unit_2_Fuzzy_Systems.pdf");
    const u3 = copyFileSafe(path.join(dir, "SoftComputing_Unit3_FuzzyDecision_PSO.pdf"), "23A05504b_Unit_3_Fuzzy_Decision_PSO.pdf");
    const u4 = copyFileSafe(path.join(dir, "SoftComputing_Unit4_GeneticAlgorithms.pdf"), "23A05504b_Unit_4_Genetic_Algorithms.pdf");
    const u5 = copyFileSafe(path.join(dir, "SoftComputing_Unit5_RoughSets_Integration.pdf"), "23A05504b_Unit_5_Rough_Sets_Integration.pdf");

    const fullPdf = await mergePdfs([
      path.join(dir, "SoftComputing_Unit1_Introduction.pdf"),
      path.join(dir, "SoftComputing_Unit2_FuzzySystems.pdf"),
      path.join(dir, "SoftComputing_Unit3_FuzzyDecision_PSO.pdf"),
      path.join(dir, "SoftComputing_Unit4_GeneticAlgorithms.pdf"),
      path.join(dir, "SoftComputing_Unit5_RoughSets_Integration.pdf"),
    ], "23A05504b_Soft_Computing_Complete_Notes.pdf");

    await saveNote({
      title: "Notes",
      branch: "AIML",
      semester: "3-1",
      regulation: "R23",
      subject: "Soft Computing",
      subjectCode: "23A05504b",
      credits: "3",
      description: "JNTUA R23 Soft Computing comprehensive notes covering Artificial Neural Networks, Fuzzy Set Theory, Fuzzy Logic Systems, Particle Swarm Optimization (PSO), Genetic Algorithms, and Hybrid Neuro-Fuzzy Systems.",
      module1: "Unit 1: Introduction to Soft Computing & Artificial Neural Networks",
      module1Pdf: u1,
      module2: "Unit 2: Fuzzy Sets and Fuzzy Logic Systems",
      module2Pdf: u2,
      module3: "Unit 3: Fuzzy Decision Making & Swarm Intelligence (PSO)",
      module3Pdf: u3,
      module4: "Unit 4: Genetic Algorithms & Evolutionary Computation",
      module4Pdf: u4,
      module5: "Unit 5: Rough Sets & Hybrid Neuro-Fuzzy Integration",
      module5Pdf: u5,
      pdfUrl: fullPdf || u1,
    });
  }

  // 2. 23A39501 Applied Machine Learning
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Applied Machine Learning",
    subjectCode: "23A39501",
    credits: "3",
    description: "JNTUA R23 Applied Machine Learning study material covering feature engineering, model tuning, ensemble learning (Random Forest, Gradient Boosting, XGBoost), regularization, and deployment pipelines.",
    module1: "Unit 1: Advanced Feature Engineering & Data Preparation",
    module2: "Unit 2: Regularization Techniques & Model Selection",
    module3: "Unit 3: Ensemble Learning (Bagging, Boosting, Stacking)",
    module4: "Unit 4: Kernel Methods and Support Vector Regression",
    module5: "Unit 5: ML Pipelines and Model Deployment",
    pdfUrl: "/uploads/23A39501_Applied_Machine_Learning.pdf",
  });

  // 3. 23A39502 Data Wrangling & Preprocessing
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Data Wrangling and Pre-Processing",
    subjectCode: "23A39502",
    credits: "3",
    description: "JNTUA R23 Data Wrangling and Pre-Processing notes covering missing value imputation, outlier detection, data normalization, categorical encoding, feature scaling, and big data transformations.",
    module1: "Unit 1: Data Cleaning and Quality Assessment",
    module2: "Unit 2: Handling Missing Data and Outliers",
    module3: "Unit 3: Data Transformation and Normalization",
    module4: "Unit 4: Feature Encoding and Dimensionality Reduction",
    module5: "Unit 5: Automated Preprocessing Pipelines",
    pdfUrl: "/uploads/23A39502_Data_Wrangling_and_Pre-Processing.pdf",
  });

  // 4. 23A39503 Introduction to Reinforcement Learning
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Introduction to Reinforcement Learning",
    subjectCode: "23A39503",
    credits: "3",
    description: "JNTUA R23 Introduction to Reinforcement Learning notes covering Markov Decision Processes, Bellman equations, dynamic programming, Monte Carlo methods, Temporal Difference learning, Q-Learning, and Deep Q-Networks.",
    module1: "Unit 1: Reinforcement Learning Fundamentals & MDP",
    module2: "Unit 2: Dynamic Programming and Bellman Equations",
    module3: "Unit 3: Monte Carlo Methods for Prediction & Control",
    module4: "Unit 4: Temporal Difference Learning (SARSA, Q-Learning)",
    module5: "Unit 5: Deep Reinforcement Learning (DQN, Policy Gradients)",
    pdfUrl: "/uploads/23A39503_Introduction_to_Reinforcement_Learning.pdf",
  });

  // 5. 23A31501 Natural Language Processing
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Natural Language Processing",
    subjectCode: "23A31501",
    credits: "3",
    description: "JNTUA R23 Natural Language Processing lecture notes covering tokenization, stemming, POS tagging, n-grams, word embeddings (Word2Vec, GloVe), RNNs, LSTMs, and transformer attention mechanisms.",
    module1: "Unit 1: Introduction to NLP & Text Preprocessing",
    module2: "Unit 2: Language Modeling and N-grams",
    module3: "Unit 3: Word Embeddings (Word2Vec, GloVe)",
    module4: "Unit 4: Sequence Models (RNNs, LSTMs, GRUs)",
    module5: "Unit 5: Transformers, Self-Attention & BERT",
    pdfUrl: "/uploads/23A31501_Natural_Language_Processing.pdf",
  });

  // 6. 23A54501 Mathematics for Machine Learning and AI
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Mathematics for Machine Learning and AI",
    subjectCode: "23A54501",
    credits: "3",
    description: "JNTUA R23 Mathematics for Machine Learning and AI notes covering vector spaces, linear transformations, matrix decompositions (SVD, PCA), multivariate calculus, gradient descent, and probability foundations for AI.",
    module1: "Unit 1: Vector Spaces & Linear Transformations",
    module2: "Unit 2: Matrix Decompositions (Eigen, SVD, Cholesky)",
    module3: "Unit 3: Vector Calculus & Gradient-Based Optimization",
    module4: "Unit 4: Probability Theory and Random Variables for AI",
    module5: "Unit 5: Statistical Estimation & Information Theory",
    pdfUrl: "/uploads/23A54501_Mathematics_for_Machine_Learning_and_AI.pdf",
  });

  // 7. 3-1 Labs
  await saveLab({
    title: "Machine Learning and NLP Lab",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Machine Learning and NLP Lab",
    subjectCode: "23A39504",
    description: "JNTUA R23 Machine Learning and NLP Laboratory practical manual covering text cleaning, Word2Vec training, sentiment analysis, text classification, and named entity recognition using Python NLTK and SpaCy.",
    pdfUrl: "/uploads/23A39504_Machine_Learning_and_NLP_Lab.pdf",
  });

  await saveLab({
    title: "Data Wrangling Lab",
    branch: "AIML",
    semester: "3-1",
    regulation: "R23",
    subject: "Data Wrangling Lab",
    subjectCode: "23A39505",
    description: "JNTUA R23 Data Wrangling Lab manual covering automated data pipelines, Pandas wrangling transformations, JSON/XML parsing, feature scaling, and outlier cleaning scripts.",
    pdfUrl: "/uploads/23A39505_Data_Wrangling_Lab.pdf",
  });

  // =========================================================================
  // SEMESTER 3-2
  // =========================================================================
  console.log("\n>>> PROCESSING SEMESTER 3-2 <<<");

  // 1. 23A30602T Deep Learning
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Deep Learning",
    subjectCode: "23A30602T",
    credits: "3",
    description: "JNTUA R23 Deep Learning comprehensive study material covering deep feedforward networks, convolutional neural networks (CNNs), recurrent neural networks (RNNs), autoencoders, and generative adversarial networks (GANs).",
    module1: "Unit 1: Deep Feedforward Networks and Optimization",
    module2: "Unit 2: Convolutional Neural Networks (CNNs) & Architectures",
    module3: "Unit 3: Sequence Modeling: RNNs, LSTMs and Transformers",
    module4: "Unit 4: Autoencoders and Representation Learning",
    module5: "Unit 5: Generative Adversarial Networks (GANs) & Deep Generative Models",
    pdfUrl: "/uploads/23A30602T_Deep_Learning.pdf",
  });

  // 2. 23A30603b Predictive Analytics
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Predictive Analytics",
    subjectCode: "23A30603b",
    credits: "3",
    description: "JNTUA R23 Predictive Analytics study notes covering regression forecasting, time series analysis, ARIMA models, classification modeling, and risk scoring.",
    module1: "Unit 1: Principles of Predictive Analytics & Regression Models",
    module2: "Unit 2: Time Series Forecasting and ARIMA",
    module3: "Unit 3: Classification Trees and Logistic Scoring",
    module4: "Unit 4: Model Evaluation, Cross-Validation & ROC Analysis",
    module5: "Unit 5: Industrial Applications and Predictive Risk Scoring",
    pdfUrl: "/uploads/23A30603b_Predictive_Analytics.pdf",
  });

  // 3. 23A30604a Computer Vision
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Computer Vision",
    subjectCode: "23A30604a",
    credits: "3",
    description: "JNTUA R23 Computer Vision course material covering image processing, edge detection, feature extraction (SIFT, SURF), object detection (YOLO, Faster R-CNN), and semantic segmentation.",
    module1: "Unit 1: Image Formation and Low-Level Filtering",
    module2: "Unit 2: Edge Detection, Contours and Feature Extraction",
    module3: "Unit 3: Feature Matching, SIFT, SURF and Camera Calibration",
    module4: "Unit 4: Object Recognition and Deep Object Detection (YOLO)",
    module5: "Unit 5: Semantic Segmentation and Video Analysis",
    pdfUrl: "/uploads/23A30604a_Computer_Vision.pdf",
  });

  // 4. 23A30604c Social Network Analysis
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Social Network Analysis",
    subjectCode: "23A30604c",
    credits: "3",
    description: "JNTUA R23 Social Network Analysis notes covering network topology, centrality measures, community detection, link prediction, and information diffusion models.",
    module1: "Unit 1: Graph Representation of Social Networks",
    module2: "Unit 2: Centrality and Network Topology",
    module3: "Unit 3: Community Detection and Clustering in Networks",
    module4: "Unit 4: Link Prediction and Recommendation in Social Media",
    module5: "Unit 5: Information Diffusion, Cascades and Epidemic Models",
    pdfUrl: "/uploads/23A30604c_Social_Network_Analysis.pdf",
  });

  // 5. 23A31603a Graph Neural Networks
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Graph Neural Networks",
    subjectCode: "23A31603a",
    credits: "3",
    description: "JNTUA R23 Graph Neural Networks notes covering graph representation, node embeddings, Graph Convolutional Networks (GCNs), Graph Attention Networks (GATs), and graph generation.",
    module1: "Unit 1: Graph Representation Learning & Node Embeddings",
    module2: "Unit 2: Message Passing Framework & Spatial Graph Convolutions",
    module3: "Unit 3: Graph Convolutional Networks (GCN) & GraphSAGE",
    module4: "Unit 4: Graph Attention Networks (GAT) and Pooling",
    module5: "Unit 5: Scalable GNNs and Applications in Chemistry & Social Networks",
    pdfUrl: "/uploads/23A31603a_Graph_Neural_Networks.pdf",
  });

  // 6. 23A32602 Recommender Systems
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Recommender Systems",
    subjectCode: "23A32602",
    credits: "3",
    description: "JNTUA R23 Recommender Systems study material covering collaborative filtering, content-based recommendation, matrix factorization (SVD), hybrid recommender systems, and deep learning-based recommendation.",
    module1: "Unit 1: Introduction to Recommender Systems & User Modeling",
    module2: "Unit 2: Collaborative Filtering (User-User, Item-Item)",
    module3: "Unit 3: Content-Based Recommenders & Feature Extraction",
    module4: "Unit 4: Matrix Factorization (SVD, ALS) and Latent Factor Models",
    module5: "Unit 5: Deep Learning for Recommender Systems & Cold-Start Solutions",
    pdfUrl: "/uploads/23A32602_Recommender_Systems.pdf",
  });

  // 7. 23A32603 Introduction to Quantum Computing
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Introduction to Quantum Computing",
    subjectCode: "23A32603",
    credits: "3",
    description: "JNTUA R23 Introduction to Quantum Computing notes covering qubits, quantum superposition, quantum gates, entanglement, Deutsch-Jozsa algorithm, Grover's search, and Shor's factoring algorithm.",
    module1: "Unit 1: Fundamentals of Quantum Information & Qubits",
    module2: "Unit 2: Quantum Circuits and Single/Multi-Qubit Quantum Gates",
    module3: "Unit 3: Quantum Entanglement, Teleportation and No-Cloning Theorem",
    module4: "Unit 4: Quantum Algorithms (Deutsch-Jozsa, Simon's Algorithm)",
    module5: "Unit 5: Grover's Search Algorithm & Shor's Factoring Algorithm",
    pdfUrl: "/uploads/23A32603_Introduction_to_Quantum_Computing.pdf",
  });

  // 8. 23A39601 Advanced Machine Learning
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Advanced Machine Learning",
    subjectCode: "23A39601",
    credits: "3",
    description: "JNTUA R23 Advanced Machine Learning lecture notes covering probabilistic graphical models, Gaussian processes, Bayesian neural networks, active learning, transfer learning, and meta-learning.",
    module1: "Unit 1: Probabilistic Graphical Models & Bayesian Networks",
    module2: "Unit 2: Exact and Approximate Inference in Graphical Models",
    module3: "Unit 3: Gaussian Processes and Non-Parametric Bayesian Methods",
    module4: "Unit 4: Transfer Learning, Few-Shot Learning & Meta-Learning",
    module5: "Unit 5: Self-Supervised Learning and Contrastive Representation",
    pdfUrl: "/uploads/23A39601_Advanced_Machine_Learning.pdf",
  });

  // 9. 23A39602 AI for Edge Computing
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "AI for Edge Computing",
    subjectCode: "23A39602",
    credits: "3",
    description: "JNTUA R23 AI for Edge Computing study guide covering edge hardware accelerators, model quantization, weight pruning, TinyML, knowledge distillation, and on-device inference.",
    module1: "Unit 1: Edge Computing Architecture and Constraints",
    module2: "Unit 2: Deep Learning Model Compression (Pruning & Quantization)",
    module3: "Unit 3: Knowledge Distillation & Compact Architectures (MobileNet)",
    module4: "Unit 4: TinyML and Embedded AI Deployment (TensorFlow Lite)",
    module5: "Unit 5: Security, Privacy & Federated Learning at the Edge",
    pdfUrl: "/uploads/23A39602_AI_for_Edge_Computing.pdf",
  });

  // 10. 23A39603 Big Data
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Big Data",
    subjectCode: "23A39603",
    credits: "3",
    description: "JNTUA R23 Big Data notes covering Apache Hadoop, HDFS, MapReduce, Apache Spark, RDDs, Spark SQL, MLlib, streaming analytics with Kafka, and NoSQL databases.",
    module1: "Unit 1: Big Data Architecture and Hadoop Distributed File System (HDFS)",
    module2: "Unit 2: MapReduce Programming Paradigm",
    module3: "Unit 3: Apache Spark Ecosystem & Resilient Distributed Datasets (RDD)",
    module4: "Unit 4: Spark SQL, DataFrames and MLlib Machine Learning",
    module5: "Unit 5: Real-Time Big Data Streams (Kafka, Spark Streaming) & NoSQL",
    pdfUrl: "/uploads/23A39603_Big_Data.pdf",
  });

  // 11. 3-2 Labs
  await saveLab({
    title: "ML Model Optimization Lab",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "ML Model Optimization Lab",
    subjectCode: "23A39604",
    description: "JNTUA R23 ML Model Optimization Laboratory manual covering model pruning, post-training quantization, ONNX runtime conversion, and latency benchmarking.",
    pdfUrl: "/uploads/23A39604_ML_Model_Optimization_Lab.pdf",
  });

  await saveLab({
    title: "Edge Computing Lab",
    branch: "AIML",
    semester: "3-2",
    regulation: "R23",
    subject: "Edge Computing Lab",
    subjectCode: "23A39605",
    description: "JNTUA R23 Edge Computing Lab manual covering embedded machine learning models on microcontrollers, edge video analysis, and sensor anomaly detection.",
    pdfUrl: "/uploads/23A39605_Edge_Computing_Lab.pdf",
  });

  // =========================================================================
  // SEMESTER 4-1
  // =========================================================================
  console.log("\n>>> PROCESSING SEMESTER 4-1 <<<");

  // 1. 23A31701 Generative AI & Prompt Engineering
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Generative AI and Prompt Engineering",
    subjectCode: "23A31701",
    credits: "3",
    description: "JNTUA R23 Generative AI and Prompt Engineering comprehensive notes covering Large Language Models (LLMs), Transformer architectures, zero-shot and few-shot prompting, Retrieval-Augmented Generation (RAG), parameter-efficient fine-tuning (LoRA), and diffusion models.",
    module1: "Unit 1: Foundations of Generative AI & Large Language Models",
    module2: "Unit 2: Prompt Engineering Principles, Chains and Agents",
    module3: "Unit 3: Retrieval-Augmented Generation (RAG) Architecture & Vector DBs",
    module4: "Unit 4: Fine-Tuning LLMs (PEFT, LoRA, QLoRA) and RLHF",
    module5: "Unit 5: Generative Vision Models: Stable Diffusion and Multi-Modal AI",
    pdfUrl: "/uploads/23A31701_Generative_AI_and_Prompt_Engineering.pdf",
  });

  // 2. 23A39701 AI for Social Good
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "AI for Social Good",
    subjectCode: "23A39701",
    credits: "3",
    description: "JNTUA R23 AI for Social Good study material focusing on AI applications in public healthcare, precision agriculture, climate monitoring, disaster management, and fair, transparent algorithmic governance.",
    module1: "Unit 1: Introduction to AI for Social Good & UN Sustainable Goals",
    module2: "Unit 2: AI in Healthcare, Epidemic Tracking and Diagnostics",
    module3: "Unit 3: AI in Smart Agriculture and Food Security",
    module4: "Unit 4: AI in Environmental Sustainability & Climate Forecasting",
    module5: "Unit 5: Ethics, Equity, Bias Mitigation and Inclusive AI Systems",
    pdfUrl: "/uploads/23A39701_AI_for_Social_Good.pdf",
  });

  // 3. 23A39702 Smart Systems
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Smart Systems",
    subjectCode: "23A39702",
    credits: "3",
    description: "JNTUA R23 Smart Systems study notes covering smart sensor integration, IoT architectures, autonomous cyber-physical systems, smart home automation, and industrial IoT (IIoT).",
    module1: "Unit 1: Architecture and Components of Smart Systems",
    module2: "Unit 2: Smart Sensors, Actuators & Wireless Telemetry",
    module3: "Unit 3: Cyber-Physical Systems and Edge Intelligence",
    module4: "Unit 4: Smart Cities, Smart Grid & Intelligent Transportation",
    module5: "Unit 5: Industrial Smart Systems (Industry 4.0) & Security",
    pdfUrl: "/uploads/23A39702_Smart_Systems.pdf",
  });

  // 4. 23A30702b Human-Computer Interaction
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Human-Computer Interaction",
    subjectCode: "23A30702b",
    credits: "3",
    description: "JNTUA R23 Human-Computer Interaction notes covering user-centered design, cognitive modeling, prototyping, usability testing, and conversational AI interfaces.",
    module1: "Unit 1: Foundations of Human-Computer Interaction & User Psychology",
    module2: "Unit 2: Interaction Design Principles and Prototyping",
    module3: "Unit 3: Usability Engineering and User Experience (UX) Evaluation",
    module4: "Unit 4: Visual Design, Direct Manipulation & Accessibility",
    module5: "Unit 5: Intelligent Interfaces, Speech AI & AR/VR Interaction",
    pdfUrl: "/uploads/23A30702b_Human-Computer_Interaction.pdf",
  });

  // 5. 23A30703b Drone Technology
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Drone Technology",
    subjectCode: "23A30703b",
    credits: "3",
    description: "JNTUA R23 Drone Technology study notes covering UAV classification, aerodynamics, flight control systems, GPS navigation, and payload sensors.",
    module1: "Unit 1: Introduction to Drones and UAV Systems",
    module2: "Unit 2: Drone Aerodynamics, Propulsion and Flight Dynamics",
    module3: "Unit 3: Autopilots, Flight Controllers & Inertial Navigation (IMU)",
    module4: "Unit 4: Payloads, Computer Vision Sensors and Remote Sensing",
    module5: "Unit 5: Regulations, Safety Protocols & Autonomous Drone Applications",
    pdfUrl: "/uploads/23A30703b_Drone_Technology.pdf",
  });

  // 6. 23A30703c Robotics
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Robotics",
    subjectCode: "23A30703c",
    credits: "3",
    description: "JNTUA R23 Robotics notes covering robot kinematics, inverse kinematics, robot dynamics, actuators, path planning, and autonomous mobile robots.",
    module1: "Unit 1: Fundamentals of Robotics & Spatial Coordinate Transforms",
    module2: "Unit 2: Forward and Inverse Kinematics (DH Convention)",
    module3: "Unit 3: Robot Dynamics and Trajectory Planning",
    module4: "Unit 4: Robot Actuators, Sensors and Vision Integration",
    module5: "Unit 5: Autonomous Mobile Robots and SLAM Algorithms",
    pdfUrl: "/uploads/23A30703c_Robotics.pdf",
  });

  // 7. 23A31702b AI for Robotics
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "AI for Robotics",
    subjectCode: "23A31702b",
    credits: "3",
    description: "JNTUA R23 AI for Robotics lecture notes covering state estimation, Kalman filters, particle filters, robot perception, reinforcement learning in robotic control, and motion planning.",
    module1: "Unit 1: Introduction to Robotic AI and State Estimation",
    module2: "Unit 2: Kalman Filters and Particle Filters for Robot Localization",
    module3: "Unit 3: Simultaneous Localization and Mapping (SLAM)",
    module4: "Unit 4: Path Planning Algorithms (A*, RRT, PRM) & Control",
    module5: "Unit 5: Deep Reinforcement Learning for Robotic Manipulation & Navigation",
    pdfUrl: "/uploads/23A31702b_AI_for_Robotics.pdf",
  });

  // 8. 23A31702c AI in Cybersecurity
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "AI in Cybersecurity",
    subjectCode: "23A31702c",
    credits: "3",
    description: "JNTUA R23 AI in Cybersecurity notes covering machine learning for intrusion detection, malware classification, adversarial machine learning, phishing detection, and AI-driven automated security response.",
    module1: "Unit 1: Cybersecurity Fundamentals & Threat Landscapes",
    module2: "Unit 2: Machine Learning for Intrusion Detection Systems (IDS)",
    module3: "Unit 3: Automated Malware Detection and Reverse Engineering",
    module4: "Unit 4: Adversarial Machine Learning & Defense Mechanisms",
    module5: "Unit 5: AI-Driven Security Information and Event Management (SIEM)",
    pdfUrl: "/uploads/23A31702c_AI_in_Cybersecurity.pdf",
  });

  // 9. 23A31703c Healthcare AI
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Healthcare AI",
    subjectCode: "23A31703c",
    credits: "3",
    description: "JNTUA R23 Healthcare AI notes covering medical imaging analysis (X-ray, MRI, CT scans), electronic health records (EHR) analytics, clinical decision support systems, genomic data analysis, and ethical healthcare AI.",
    module1: "Unit 1: Introduction to AI in Medicine and Healthcare Systems",
    module2: "Unit 2: Deep Learning for Medical Imaging (X-Ray, MRI, CT)",
    module3: "Unit 3: Clinical Decision Support & Electronic Health Records (EHR)",
    module4: "Unit 4: AI in Drug Discovery and Genomics",
    module5: "Unit 5: Regulatory Compliance, Patient Privacy (HIPAA) & Medical AI Ethics",
    pdfUrl: "/uploads/23A31703c_Healthcare_AI.pdf",
  });

  // 10. 23A52701a Business Ethics and Corporate Governance
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Business Ethics and Corporate Governance",
    subjectCode: "23A52701a",
    credits: "3",
    description: "JNTUA R23 Business Ethics and Corporate Governance notes covering ethical theories, corporate governance frameworks, corporate social responsibility (CSR), stakeholder protection, and ethical dilemmas in emerging tech.",
    module1: "Unit 1: Principles of Business Ethics & Moral Reasoning",
    module2: "Unit 2: Corporate Governance Frameworks and Regulations",
    module3: "Unit 3: Corporate Social Responsibility (CSR) and Sustainability",
    module4: "Unit 4: Board Oversight, Audit Committees and Compliance",
    module5: "Unit 5: Ethical Dilemmas in Technology and AI Governance",
    pdfUrl: "/uploads/23A52701a_Business_Ethics_and_Corporate_Governance.pdf",
  });

  // 11. 23A52701b E-Business
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "E-Business",
    subjectCode: "23A52701b",
    credits: "3",
    description: "JNTUA R23 E-Business lecture notes covering e-commerce models (B2B, B2C, C2C), digital marketing, e-payment gateways, supply chain integration, and legal frameworks.",
    module1: "Unit 1: Introduction to E-Business and Internet Economics",
    module2: "Unit 2: E-Business Models (B2B, B2C, Marketplace)",
    module3: "Unit 3: Electronic Payment Systems and Security Gateways",
    module4: "Unit 4: Digital Marketing, SEO and Consumer Analytics",
    module5: "Unit 5: E-Supply Chain Management and Cyber Law",
    pdfUrl: "/uploads/23A52701b_E-Business.pdf",
  });

  // 12. 23A52701c Management Science
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Management Science",
    subjectCode: "23A52701c",
    credits: "3",
    description: "JNTUA R23 Management Science notes covering operations management, project management (PERT/CPM), inventory control, quality control, and strategic management.",
    module1: "Unit 1: Introduction to Management Science & Organizational Theories",
    module2: "Unit 2: Operations Management and Plant Layout",
    module3: "Unit 3: Materials Management & Inventory Control Models (EOQ)",
    module4: "Unit 4: Project Management: Network Analysis (PERT and CPM)",
    module5: "Unit 5: Total Quality Management & Strategic Management",
    pdfUrl: "/uploads/23A52701c_Management_Science.pdf",
  });

  // 13. 23A52702 Gender Sensitization
  await saveNote({
    title: "Notes",
    branch: "AIML",
    semester: "4-1",
    regulation: "R23",
    subject: "Gender Sensitization",
    subjectCode: "23A52702",
    credits: "2",
    description: "JNTUA R23 Gender Sensitization course notes addressing gender socialization, division of labor, gender equality laws, constitutional rights, and preventing harassment.",
    module1: "Unit 1: Understanding Gender and Socialization",
    module2: "Unit 2: Gender and Labor: Household Work & Workplace Equality",
    module3: "Unit 3: Gender-Based Violence and Legal Safeguards",
    module4: "Unit 4: Constitutional Provisions and Human Rights",
    module5: "Unit 5: Building Inclusive Work Environments and Social Respect",
    pdfUrl: "/uploads/23A52702_Gender_Sensitization.pdf",
  });

  console.log("\n==================================================");
  console.log(`AIML INGESTION COMPLETE!`);
  console.log(`Total Notes Upserted: ${results.notes}`);
  console.log(`Total Labs Upserted: ${results.labs}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  process.exit(0);
}

uploadAIMLNotes().catch((err) => {
  console.error("FATAL ERROR IN AIML INGESTION:", err);
  process.exit(1);
});
