const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\civil notes\\4-1";
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

async function uploadCivil4_1() {
  console.log("==================================================");
  console.log("STARTING CIVIL ENGINEERING (CE) 4-1 INGESTION");
  console.log("Source:", SOURCE_BASE);
  console.log("Target Uploads:", TARGET_UPLOADS);
  console.log("==================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const results = { notes: [], errors: [] };

  const theorySubjects = [
    {
      code: "23A01701",
      title: "Finite Element Methods",
      subject: "Finite Element Methods",
      credits: "3",
      folder: "23A01701 Finite Element Methods",
      description: "JNTUA R23 Finite Element Methods (FEM) in Civil Engineering lecture notes covering Introduction to FEM & Rayleigh-Ritz/Galerkin Methods, One-Dimensional Bar Elements & Trusses, Beam Elements & Frame Analysis, Two-Dimensional Plane Stress/Strain & CST Elements, and Isoparametric Formulations & Numerical Integration (Gauss Quadrature).",
      modules: [
        "Unit 1: Introduction to FEM, Variational Approaches and Rayleigh-Ritz Method",
        "Unit 2: One-Dimensional Bar Elements, Shape Functions and Truss Analysis",
        "Unit 3: Beam Elements, Flexural Stiffness Matrix and 2D Frames",
        "Unit 4: Two-Dimensional Elements (Plane Stress, Plane Strain, CST & LST)",
        "Unit 5: Isoparametric Elements, Numerical Integration and Structural Modeling",
      ],
      files: [
        "FEM_23A01701_Unit_1.pdf",
        "FEM_23A01701_Unit_2.pdf",
        "FEM_23A01701_Unit_3.pdf",
        "FEM_23A01701_Unit_4.pdf",
        "FEM_23A01701_Unit_5.pdf",
      ],
    },
    {
      code: "23A01702a",
      title: "Geo-synthetics and Reinforced Earth Structures",
      subject: "Geo-synthetics and Reinforced Earth Structures",
      credits: "3",
      folder: "23A01702a Geo-synthetics and Reinforced Earth Structures",
      description: "JNTUA R23 Professional Elective IV: Geosynthetics and Reinforced Earth Structures notes covering Concepts of Reinforced Earth & Mechanism of Soil-Inclusion Interaction, Geosynthetic Polymers & Types (Geotextiles, Geogrids, Geomembranes, Geonets), Design of Reinforced Earth Retaining Walls, Reinforced Soil Embankments & Slopes, and Geosynthetics in Pavements, Soil Beds & Drainage Systems.",
      modules: [
        "Unit 1: Introduction to Reinforced Earth Principles and Components",
        "Unit 2: Geosynthetics: Types, Manufacturing and Engineering Properties",
        "Unit 3: Design and Stability Analysis of Reinforced Earth Retaining Walls",
        "Unit 4: Reinforced Embankments over Soft Soils and Slope Stabilization",
        "Unit 5: Geosynthetics in Highway Pavements, Foundations and Drainage Systems",
      ],
      files: [
        "23A01702a_Unit1_Reinforced_Earth.pdf",
        "23A01702a_Unit2_Geosynthetics.pdf",
        "23A01702a_Unit3_Reinforced_Earth_Retaining_Walls.pdf",
        "23A01702a_Unit4_Reinforced_Embankments.pdf",
        "23A01702a_Unit5_Reinforced_Soil_Beds_and_Pavements.pdf",
      ],
    },
    {
      code: "23A01702b",
      title: "Railways, Airports, Docks and Harbour Engineering",
      subject: "Railways, Airports, Docks and Harbour Engineering",
      credits: "3",
      folder: "23A01702b.Railways, Airports, Docks and Harbour Engineering",
      description: "JNTUA R23 Professional Elective IV: Railways, Airports, Docks & Harbour Engineering notes covering Railway Alignment, Gauges & Permanent Way Components (Rails, Sleepers, Ballast), Geometric Design of Railway Tracks, Turnouts & Points/Crossings, Airport Planning, Wind Rose Diagram & Runway Orientation, Geometric Design of Runways/Taxiways & Airport Markings/Lighting, and Port Planning, Docks, Harbours, Breakwaters, Jetties & Wharves.",
      modules: [
        "Unit 1: Railway Engineering: Permanent Way, Rails, Sleepers and Fasteners",
        "Unit 2: Geometric Design of Railway Track, Points and Crossings, Signaling",
        "Unit 3: Airport Planning, Aircraft Characteristics and Site Selection",
        "Unit 4: Geometric Design of Runways, Taxiways, Aprons and Airport Lighting",
        "Unit 5: Docks, Harbours, Breakwaters, Jetties, Quays and Coastal Facilities",
      ],
      files: [
        "Unit1_Railway_Engineering_23A01702b.pdf",
        "Unit2_Geometric_Design_of_Railway_Track_23A01702b.pdf",
        "Unit3_Airport_Engineering_23A01702b.pdf",
        "Unit4_Geometric_Design_of_Runways_and_Taxiways_23A01702b.pdf",
        "Unit5_Ports_and_Harbours_23A01702b.pdf",
      ],
    },
    {
      code: "23A01702c",
      title: "Experimental Stress Analysis",
      subject: "Experimental Stress Analysis",
      credits: "3",
      folder: "23A01702c Experimental Stress Analysis",
      description: "JNTUA R23 Professional Elective IV: Experimental Stress Analysis lecture notes covering Strain Measurement Principles & Electrical Resistance Strain Gauges, Strain Rosettes Analysis & Wheatstone Bridge Circuits, Photoelasticity Principles (Polariscopes, Isochromatics, Isoclinics), 3D Photoelasticity & Birefringent Coatings, and Brittle Coating Techniques & Moire Fringe Methods.",
      modules: [
        "Unit 1: Introduction to Stress Analysis and Electrical Resistance Strain Gauges",
        "Unit 2: Strain Rosettes, Measurement Circuits and Recording Instruments",
        "Unit 3: Theory of Photoelasticity and Plane/Circular Polariscopes",
        "Unit 4: Three-Dimensional Photoelasticity and Birefringent Coating Methods",
        "Unit 5: Brittle Coating Methods and Moire Fringe Techniques",
      ],
      files: [
        "ESA_UnitI_Handwritten_Notes.pdf",
        "ESA_UnitII_Handwritten_Notes.pdf",
        "ESA_UnitIII_Handwritten_Notes.pdf",
        "ESA_UnitIV_Handwritten_Notes.pdf",
        "ESA_UnitV_Handwritten_Notes.pdf",
      ],
    },
    {
      code: "23A01703a",
      title: "Ground Improvement Techniques",
      subject: "Ground Improvement Techniques",
      credits: "3",
      folder: "23A01703a Ground Improvement Techniques",
      description: "JNTUA R23 Professional Elective V: Ground Improvement Techniques study material covering De-watering & Drainage Systems (Well Point Systems, Deep Wells), Mechanical Stabilization & Dynamic Compaction/Compaction Piles, Chemical Stabilization (Lime, Cement, Bitumen & Chemical Grouts), Grouting Techniques & Jet Grouting/Hydraulic Fracturing, and Soil Reinforcement (Geotextiles, Stone Columns, Soil Nailing).",
      modules: [
        "Unit 1: Need for Ground Improvement and Dewatering Methods",
        "Unit 2: Mechanical Compaction, Dynamic Compaction and Vibro-Replacement",
        "Unit 3: Chemical Soil Stabilization (Lime, Fly Ash, Cement and Bitumen)",
        "Unit 4: Grouting Methods, Grout Materials, Equipment and Quality Control",
        "Unit 5: Soil Nailing, Stone Columns and Geosynthetic Reinforced Ground",
      ],
      files: [
        "Ground_Improvement_Techniques_Unit_I_Notes.pdf",
        "Ground_Improvement_Techniques_Unit_II_Notes.pdf",
        "Ground_Improvement_Techniques_Unit_III_Notes.pdf",
        "Ground_Improvement_Techniques_Unit_IV_Notes.pdf",
        "Ground_Improvement_Techniques_Unit_V_Notes.pdf",
      ],
    },
    {
      code: "23A01703b",
      title: "Subsurface Investigation and Instrumentation",
      subject: "Subsurface Investigation and Instrumentation",
      credits: "3",
      folder: "23A01703b .Subsurface Investigation and Instrumentation",
      description: "JNTUA R23 Professional Elective V: Subsurface Investigation and Instrumentation notes covering Objectives & Planning of Soil Exploration Programs, Boring & Drilling Methods (Auger, Wash, Rotary Drilling), Soil Sampling & Core Recovery (Disturbed, Undisturbed Samplers), Field In-Situ Testing (SPT, CPT, Plate Load Test, Vane Shear, Pressuremeter), and Geotechnical Instrumentation & Monitoring (Piezometers, Inclinometers, Settlement Gauges).",
      modules: [
        "Unit 1: Scope, Planning and Execution of Subsurface Soil Exploration",
        "Unit 2: Boring and Drilling Methods in Soils and Rocks",
        "Unit 3: Soil Sampling Techniques, Samplers and Core Logging",
        "Unit 4: In-situ Field Testing Methods (SPT, CPT, DCPT, Pressuremeter)",
        "Unit 5: Geotechnical Instrumentation, Field Monitoring and Report Writing",
      ],
      files: [
        "Unit1_Introduction_Notes.pdf",
        "Unit2_Soil_Exploration_Notes.pdf",
        "Unit3_Borehole_Logging_Notes.pdf",
        "Unit4_Field_Testing_Notes.pdf",
        "Unit5_Report_Writing_and_Instrumentation_Notes.pdf",
      ],
    },
    {
      code: "23A52701a",
      title: "Business Ethics and Corporate Governance",
      subject: "Business Ethics and Corporate Governance",
      credits: "2",
      folder: "23A52701a .Business Ethics and Corporate Governance",
      description: "JNTUA R23 Management elective lecture notes covering Introduction to Business Ethics & Moral Reasoning, Ethical Leadership & Workplace Ethics, Corporate Social Responsibility (CSR) Frameworks, Corporate Governance Theories & Codes, and Corporate Scandals, Whistleblowing & Board Room Best Practices.",
      modules: [
        "Unit 1: Introduction to Business Ethics, Values and Moral Reasoning",
        "Unit 2: Ethical Decision Making, Culture and Leadership in Business",
        "Unit 3: Corporate Social Responsibility (CSR) and Stakeholder Management",
        "Unit 4: Corporate Governance: Principles, Frameworks and Regulatory Codes",
        "Unit 5: Board Room Practices, Corporate Governance Committees and Whistleblowing",
      ],
      files: [
        "BEG_Unit_1_Handwritten_Notes.pdf",
        "BEG_Unit_2_Handwritten_Notes.pdf",
        "BEG_Unit_3_Handwritten_Notes.pdf",
        "BEG_Unit_4_Handwritten_Notes.pdf",
        "BEG_Unit_5_Handwritten_Notes.pdf",
      ],
    },
    {
      code: "23A52701b",
      title: "E-Business",
      subject: "E-Business",
      credits: "2",
      folder: "23A52701b .E-Business",
      description: "JNTUA R23 Management elective notes covering Introduction to E-Business & Digital Economy, E-Business Models (B2B, B2C, C2C) & Marketplaces, Electronic Payment Systems (UPI, Cards, Crypto, Wallets), E-Business Security, Privacy, Encryption & Cyber Laws, and E-Marketing, Customer Relationship Management (CRM) & Supply Chain Integration.",
      modules: [
        "Unit 1: Overview of E-Business and E-Commerce Architecture",
        "Unit 2: E-Business Models, Electronic Markets and Strategies",
        "Unit 3: Electronic Payment Systems, Gateways and Digital Wallets",
        "Unit 4: E-Business Security, Cryptography and Cyber Laws",
        "Unit 5: E-Marketing, SEO, Social Commerce and Digital CRM",
      ],
      files: [
        "EBusiness_Unit1_Electronic_Business.pdf",
        "EBusiness_Unit2_Electronic_Markets_and_Business_Models.pdf",
        "EBusiness_Unit3_Electronic_Payment_Systems.pdf",
        "EBusiness_Unit4_E-Security.pdf",
        "EBusiness_Unit5_E-Marketing.pdf",
      ],
    },
    {
      code: "23A52701c",
      title: "Management Science",
      subject: "Management Science",
      credits: "2",
      folder: "23A52701c Management Science",
      description: "JNTUA R23 Management elective notes covering Introduction to Management & Organization Theories (Taylor, Fayol, Weber), Operations Management (Work Study, Inventory Control - EOQ, ABC), Human Resource Management (Job Analysis, Recruitment, Performance Appraisal), Strategic Management & Project Network Analysis (PERT/CPM), and Contemporary Issues in Modern Management.",
      modules: [
        "Unit 1: Introduction to Management Principles and Organizational Theories",
        "Unit 2: Operations Management, Work Study and Inventory Management",
        "Unit 3: Human Resource Management, Recruitment and Appraisals",
        "Unit 4: Strategic Management and Project Management (PERT & CPM)",
        "Unit 5: Contemporary Management Issues: TQM, Six Sigma, Supply Chain",
      ],
      files: [
        "Unit-1_Introduction_to_Management.pdf",
        "Unit-2_Operations_Management.pdf",
        "Unit-3_Human_Resources_Management.pdf",
        "Unit-4_Strategic_and_Project_Management.pdf",
        "Unit-5_Contemporary_Issues_in_Management.pdf",
      ],
    },
    {
      code: "23A52702",
      title: "Gender Sensitization",
      subject: "Gender Sensitization",
      credits: "0",
      folder: "23A52702 Gender Sensitization",
      description: "JNTUA R23 Mandatory Course: Gender Sensitization lecture notes covering Understanding Gender, Sex vs Gender & Socialization, Gender Roles, Relations & Work Division, Gender, Labour & Economy (Formal & Informal sectors), Gender-Based Violence, Prevention of Sexual Harassment (PoSH Act), and Gender, Culture, Rights, Legal Protection & Constitutional Guarantees.",
      modules: [
        "Unit 1: Understanding Gender: Biological Sex vs Social Construct",
        "Unit 2: Gender Roles, Socialization and Patriarchal Structures",
        "Unit 3: Gender, Unpaid Care Work and Labour Markets",
        "Unit 4: Gender-Based Violence and Legal Frameworks (PoSH Act, DV Act)",
        "Unit 5: Gender, Culture, Constitutional Rights and Inclusivity",
      ],
      files: [
        "Unit1_Understanding_Gender.pdf",
        "Unit2_Gender_Roles_and_Relations.pdf",
        "Unit3_Gender_and_Labour.pdf",
        "Unit4_Gender_Based_Violence.pdf",
        "Unit5_Gender_and_Culture.pdf",
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
        { branch: "CE", semester: "4-1", subjectCode: sub.code },
        {
          title: "Notes",
          branch: "CE",
          semester: "4-1",
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

      console.log(`  [UPSERTED NOTE] ID: ${noteDoc._id} - ${noteDoc.subject} (Sem: 4-1)`);
      results.notes.push(sub.code);
    } catch (err) {
      console.error(`  [ERROR SUBJECT ${sub.code}]:`, err.message);
      results.errors.push({ item: sub.code, error: err.message });
    }
  }

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY (CE 4-1)");
  console.log(`Notes Uploaded (Note collection): ${results.notes.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. CE 4-1 Ingestion Done!");
}

uploadCivil4_1().catch(console.error);
