const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Note = require("../models/note");

const SOURCE_BASE = "C:\\Users\\B Keerthi\\Downloads\\mech notes\\4-1";
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

async function uploadMech4_1() {
  console.log("==================================================");
  console.log("STARTING MECHANICAL ENGINEERING (ME) 4-1 INGESTION");
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
    errors: [],
  };

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

    // Upsert into Note collection (semester: "4-1")
    const noteDoc = await Note.findOneAndUpdate(
      { branch: "ME", semester: "4-1", subjectCode: code },
      {
        title: "Notes",
        branch: "ME",
        semester: "4-1",
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
    console.log(`  [NOTE DB] Upserted Note: ${noteDoc._id} - ${noteDoc.subject} (Sem: 4-1)`);
    results.notes.push({ code, name: subjectName, units: 5, mergedFile: mergedUrl });
  }

  // 1. Automation and Robotics (23A03606)
  try {
    await processTheory5Units({
      folderName: "23A03606 Automation And Robotics",
      code: "23A03606",
      subjectName: "Automation and Robotics",
      credits: "3",
      description:
        "Comprehensive lecture notes for Automation and Robotics covering automation types, automated flow lines, industrial robotics, actuators, sensors, kinematics, and robot programming.",
      moduleNames: [
        "Introduction to Automation",
        "Automated Flow Lines & Line Balancing",
        "Industrial Robotics, Actuators and Sensors",
        "Manipulator Kinematics & Dynamics",
        "Robot Programming and Industrial Applications",
      ],
      filePatterns: [
        /unit1.*introduction.*\.pdf/i,
        /unit2.*automated.*\.pdf/i,
        /unit3.*robotics.*\.pdf/i,
        /unit4.*kinematics.*\.pdf/i,
        /unit5.*robot_programming.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03606]:", err.message);
    results.errors.push({ code: "23A03606", error: err.message });
  }

  // 2. AI & ML for Mechanical Engineering (23A03701)
  try {
    await processTheory5Units({
      folderName: "23A03701 AI & ML for Mechanical Engineering",
      code: "23A03701",
      subjectName: "AI & ML for Mechanical Engineering",
      credits: "3",
      description:
        "Course notes for Artificial Intelligence & Machine Learning applied to Mechanical Engineering: predictive maintenance, design optimization, smart manufacturing, and automated quality control.",
      moduleNames: [
        "Foundations of AI & Machine Learning in Engineering",
        "Supervised Learning & Regression for Thermal/Structural Data",
        "Unsupervised Learning, Clustering & Dimensionality Reduction",
        "Deep Learning & Neural Networks for Mechanical Systems",
        "AI/ML Industrial Applications, Predictive Maintenance & Digital Twins",
      ],
      filePatterns: [
        /unit1-1\.pdf/i,
        /unit2-1\.pdf/i,
        /unit3-1\.pdf/i,
        /unit4-1\.pdf/i,
        /unit5-1\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03701]:", err.message);
    results.errors.push({ code: "23A03701", error: err.message });
  }

  // 3. Mechanical Vibrations (23A03702a)
  try {
    await processTheory5Units({
      folderName: "23A03702a Mechanical Vibrations",
      code: "23A03702a",
      subjectName: "Mechanical Vibrations",
      credits: "3",
      description:
        "Professional Elective - IV notes on single/two/multi degree of freedom vibration systems, forced vibration resonance, damping, critical speeds of shafts, and vibration instrumentation.",
      moduleNames: [
        "Single Degree of Freedom (SDOF) Free Undamped & Damped Systems",
        "Forced Vibrations of SDOF Systems and Transmissibility",
        "Two Degree of Freedom Systems and Vibration Absorbers",
        "Multi-Degree of Freedom (MDOF) Systems and Numerical Methods",
        "Vibration Measurement, Sensors, and Condition Monitoring",
      ],
      filePatterns: [
        /unit1_single_dof.*\.pdf/i,
        /unit2_forced_vibrations.*\.pdf/i,
        /unit3_two_dof.*\.pdf/i,
        /unit4_multi_dof.*\.pdf/i,
        /unit5_vibration_measurement.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03702a]:", err.message);
    results.errors.push({ code: "23A03702a", error: err.message });
  }

  // 4. Finite Element Methods (23A03702b)
  try {
    await processTheory5Units({
      folderName: "23A03702b Finite Element Methods",
      code: "23A03702b",
      subjectName: "Finite Element Methods",
      credits: "3",
      description:
        "Professional Elective - IV notes on finite element formulation, 1D bar and truss elements, beam deflection, 2D CST & LST elements, quadrilateral elements, axisymmetric problems, and steady-state thermal analysis.",
      moduleNames: [
        "Introduction to FEM, Rayleigh-Ritz & Galerkin Formulations",
        "1D Bar Elements, Trusses and Beams Analysis",
        "2D Solid Elements (CST, LST) and Plane Stress / Strain",
        "Quadrilateral Elements, Isoparametric Formulations and Thermal FEA",
        "Dynamic Analysis, Eigenvalues, Natural Frequencies and Modal Analysis",
      ],
      filePatterns: [
        /fem_unit1.*\.pdf/i,
        /fem_unit2.*\.pdf/i,
        /fem_unit3.*\.pdf/i,
        /fem_unit4.*\.pdf/i,
        /fem_unit5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03702b]:", err.message);
    results.errors.push({ code: "23A03702b", error: err.message });
  }

  // 5. Refrigeration & Air Conditioning (23A03702c)
  try {
    await processTheory5Units({
      folderName: "23A03702c Refrigeration & Air Conditioning",
      code: "23A03702c",
      subjectName: "Refrigeration & Air Conditioning",
      credits: "3",
      description:
        "Professional Elective - IV notes on VCR and VAR thermodynamic cycles, eco-friendly refrigerants, psychrometric processes, cooling load estimations, and commercial AC equipment.",
      moduleNames: [
        "Introduction to Refrigeration & Air Refrigeration Cycles",
        "Vapour Compression Refrigeration (VCR) Systems and Analysis",
        "Absorption, Steam Jet and Non-Conventional Refrigeration Systems",
        "Psychrometry and Principles of Air Conditioning",
        "Air Conditioning Equipment, Human Comfort and System Design",
      ],
      filePatterns: [
        /unit1_introduction_to_refrigeration.*\.pdf/i,
        /unit2_vapour_compression.*\.pdf/i,
        /unit3_absorption.*\.pdf/i,
        /unit4_introduction_to_air_conditioning.*\.pdf/i,
        /unit5_air_conditioning.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03702c]:", err.message);
    results.errors.push({ code: "23A03702c", error: err.message });
  }

  // 6. Mechatronics & MEMS (23A03702d)
  try {
    await processTheory5Units({
      folderName: "23A03702d Mechotronics & MEMS",
      code: "23A03702d",
      subjectName: "Mechatronics & MEMS",
      credits: "3",
      description:
        "Professional Elective - IV notes on mechatronics architecture, sensors, solid-state actuators, microcontrollers, PLCs, MEMS fabrication, micro-sensors, and micro-actuators.",
      moduleNames: [
        "Introduction to Mechatronics Systems & Design Philosophy",
        "Sensors, Transducers and Signal Conditioning",
        "Actuation Systems - Mechanical, Electrical and Fluid Power",
        "Microprocessors, Microcontrollers and PLC Programming",
        "MEMS Architecture, Micro-Fabrication, Sensors and Actuators",
      ],
      filePatterns: [
        /.*unit1_introduction.*\.pdf/i,
        /.*unit2_sensors.*\.pdf/i,
        /.*unit3_actuators.*\.pdf/i,
        /.*unit4_microprocessors.*\.pdf/i,
        /.*unit5_mems.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03702d]:", err.message);
    results.errors.push({ code: "23A03702d", error: err.message });
  }

  // 7. Power Plant Engineering (23A03702e)
  try {
    await processTheory5Units({
      folderName: "23A03702e Power Plant Engineering",
      code: "23A03702e",
      subjectName: "Power Plant Engineering",
      credits: "3",
      description:
        "Professional Elective - IV notes on steam thermal power plants, diesel and gas turbine power stations, hydroelectric power, nuclear reactors, and power plant economics with environmental considerations.",
      moduleNames: [
        "Thermal Power Plants, Steam Generators and Coal Handling",
        "Diesel and Gas Turbine Power Stations",
        "Hydroelectric Power Plants, Dams and Turbines",
        "Nuclear Power Plants, Fission Reactors and Radiation Safety",
        "Power Plant Economics, Load Curves and Environmental Pollution Control",
      ],
      filePatterns: [
        /unit_?1.*\.pdf/i,
        /unit-?2.*\.pdf/i,
        /unit_?3.*\.pdf/i,
        /unit_?4.*\.pdf/i,
        /unit_?5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03702e]:", err.message);
    results.errors.push({ code: "23A03702e", error: err.message });
  }

  // 8. Non Conventional Energy Sources (23A03703a)
  try {
    await processTheory5Units({
      folderName: "23A03703a Non Conventional Energy Sources",
      code: "23A03703a",
      subjectName: "Non Conventional Energy Sources",
      credits: "3",
      description:
        "Professional Elective - V notes on solar radiation geometry, solar collectors and PV cells, wind turbines, biomass and biogas digestion, geothermal energy, tidal power, and fuel cells.",
      moduleNames: [
        "Solar Energy Principles, Radiation Geometry and Solar Collectors",
        "Solar Thermal Applications, Photovoltaic Systems and Energy Storage",
        "Wind Energy Conversion Systems (WECS), Aerodynamics and Wind Farms",
        "Biomass, Biogas Plants, Biofuels and Waste-to-Energy",
        "Geothermal, Ocean Thermal Energy Conversion (OTEC), Tidal & Fuel Cells",
      ],
      filePatterns: [
        /unit_?1.*\.pdf/i,
        /unit_?2.*\.pdf/i,
        /unit_?3.*\.pdf/i,
        /unit_?4.*\.pdf/i,
        /unit_?5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03703a]:", err.message);
    results.errors.push({ code: "23A03703a", error: err.message });
  }

  // 9. Non-Destructive Testing (23A03703b)
  try {
    await processTheory5Units({
      folderName: "23A03703b Non-Destructive Testing",
      code: "23A03703b",
      subjectName: "Non-Destructive Testing",
      credits: "3",
      description:
        "Professional Elective - V notes on radiographic inspection, ultrasonic testing, liquid penetrant testing (LPT), magnetic particle testing (MPT), eddy current testing (ECT), infrared thermography, and industrial quality assurance.",
      moduleNames: [
        "Radiographic Testing (RT) Principles, X-ray & Gamma Ray Sources",
        "Ultrasonic Testing (UT), Wave Propagation, Transducers and Flaw Detection",
        "Liquid Penetrant (LPT), Magnetic Particle (MPT) and Eddy Current (ECT) Testing",
        "Infrared Thermography, Acoustic Emission and Leak Testing",
        "Codes, Standards, Industrial Quality Assurance and Safety Protocols",
      ],
      filePatterns: [
        /ndt_unit_?1.*\.pdf/i,
        /ndt_unit_?2.*\.pdf/i,
        /ndt_unit_?3.*\.pdf/i,
        /ndt_unit_?4.*\.pdf/i,
        /ndt_unit_?5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03703b]:", err.message);
    results.errors.push({ code: "23A03703b", error: err.message });
  }

  // 10. Total Quality Management (23A03703c)
  try {
    await processTheory5Units({
      folderName: "23A03703c Total Quality Management",
      code: "23A03703c",
      subjectName: "Total Quality Management",
      credits: "3",
      description:
        "Professional Elective - V notes on quality gurus (Deming, Juran, Crosby), customer satisfaction, continuous improvement (Kaizen), Six Sigma, 5S, benchmarking, QFD, FMEA, and ISO 9000 certification.",
      moduleNames: [
        "Introduction to TQM, Quality Definitions and Customer Focus",
        "Historical Review, Contributions of Deming, Juran and Crosby",
        "TQM Leadership, Employee Empowerment, Kaizen and Continuous Improvement",
        "TQM Tools, 7 QC Tools, Six Sigma, Benchmarking, FMEA and QFD",
        "Quality Management Systems, ISO 9000 / ISO 14000 and Quality Auditing",
      ],
      filePatterns: [
        /tqm_unit_?1.*\.pdf/i,
        /tqm_unit_?2.*\.pdf/i,
        /tqm_unit_?3.*\.pdf/i,
        /tqm_unit_?4.*\.pdf/i,
        /tqm_unit_?5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03703c]:", err.message);
    results.errors.push({ code: "23A03703c", error: err.message });
  }

  // 11. Smart Manufacturing (23A03703d)
  try {
    await processTheory5Units({
      folderName: "23A03703d Smart Manufacturing",
      code: "23A03703d",
      subjectName: "Smart Manufacturing",
      credits: "3",
      description:
        "Professional Elective - V notes on Industry 4.0, industrial IoT, big data analytics, edge computing, digital twins, cybersecurity in manufacturing, and sustainable smart factories.",
      moduleNames: [
        "Introduction to Smart Manufacturing and Industry 4.0 Pillars",
        "Industrial Data Analytics, AI and Shop-Floor Automation",
        "Cloud Computing, Edge Devices, Industrial IoT, RFID and Blockchain",
        "Digital Twin Modeling, Multi-Physics Simulation and Cybersecurity",
        "Sustainable Smart Manufacturing, Circular Economy and Future Trends",
      ],
      filePatterns: [
        /unit1.*introduction.*\.pdf/i,
        /unit2.*data_analytics.*\.pdf/i,
        /unit3.*cloud.*\.pdf/i,
        /unit4.*digital_twin.*\.pdf/i,
        /unit5.*sustainable.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A03703d]:", err.message);
    results.errors.push({ code: "23A03703d", error: err.message });
  }

  // 12. Business Ethics and Corporate Governance (23A52701a)
  try {
    await processTheory5Units({
      folderName: "23A52701a Business Ethics and Corporate Governance",
      code: "23A52701a",
      subjectName: "Business Ethics and Corporate Governance",
      credits: "2",
      description:
        "Humanities elective lecture notes on moral philosophy, ethical decision-making, corporate social responsibility (CSR), board structure, regulatory compliance, and corporate governance frameworks.",
      moduleNames: [
        "Introduction to Business Ethics, Morality and Value Systems",
        "Ethical Decision Making, Theories and Ethical Dilemmas",
        "Corporate Social Responsibility (CSR) and Stakeholder Management",
        "Corporate Governance Frameworks, Board Structure and Committees",
        "Corporate Scandals, Regulatory Compliance, Whistleblowing and Best Practices",
      ],
      filePatterns: [
        /beg_unit_?1.*\.pdf/i,
        /beg_unit_?2.*\.pdf/i,
        /beg_unit_?3.*\.pdf/i,
        /beg_unit_?4.*\.pdf/i,
        /beg_unit_?5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A52701a]:", err.message);
    results.errors.push({ code: "23A52701a", error: err.message });
  }

  // 13. E-Business (23A52701b)
  try {
    await processTheory5Units({
      folderName: "23A52701b E-Business",
      code: "23A52701b",
      subjectName: "E-Business",
      credits: "2",
      description:
        "Interdisciplinary elective notes covering e-business architecture, B2B/B2C/C2C business models, electronic payment gateways, e-security, cryptography, and digital marketing strategies.",
      moduleNames: [
        "Fundamentals of Electronic Business & Digital Economy",
        "Electronic Markets, Value Chains and E-Business Revenue Models",
        "Electronic Payment Systems, Digital Wallets and Fintech",
        "E-Security, Encryption, Digital Signatures and Cyber Law",
        "E-Marketing, Social Media Strategies and Customer Relationship Management",
      ],
      filePatterns: [
        /ebusiness_unit1.*\.pdf/i,
        /ebusiness_unit2.*\.pdf/i,
        /ebusiness_unit3.*\.pdf/i,
        /ebusiness_unit4.*\.pdf/i,
        /ebusiness_unit5.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A52701b]:", err.message);
    results.errors.push({ code: "23A52701b", error: err.message });
  }

  // 14. Management Science (23A52701c)
  try {
    await processTheory5Units({
      folderName: "23A52701c Management Science",
      code: "23A52701c",
      subjectName: "Management Science",
      credits: "2",
      description:
        "Comprehensive notes covering principles of scientific management, operations management, HR planning and development, strategic planning, project management (PERT/CPM), and contemporary management issues.",
      moduleNames: [
        "Introduction to Management Concepts & Organizational Structures",
        "Operations Management, Plant Location, Layout and Work Study",
        "Human Resources Management (HRM), Recruitment and Performance Appraisal",
        "Strategic Management, SWOT Analysis and Project Management (PERT/CPM)",
        "Contemporary Issues in Management, Supply Chain and ERP",
      ],
      filePatterns: [
        /unit-?1.*introduction.*\.pdf/i,
        /unit-?2.*operations.*\.pdf/i,
        /unit-?3.*human.*\.pdf/i,
        /unit-?4.*strategic.*\.pdf/i,
        /unit-?5.*contemporary.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A52701c]:", err.message);
    results.errors.push({ code: "23A52701c", error: err.message });
  }

  // 15. Gender Sensitization (23A52702)
  try {
    await processTheory5Units({
      folderName: "23A52702 Gender Sensitization",
      code: "23A52702",
      subjectName: "Gender Sensitization",
      credits: "0",
      description:
        "Mandatory course notes covering gender vs sex, social construction of gender, gender roles and relations, labor and wage disparity, gender-based violence, POSH laws, and gender inclusivity.",
      moduleNames: [
        "Understanding Gender: Social Construction of Gender and Biology vs Society",
        "Gender Roles, Family Relations and Socialization Processes",
        "Gender and Labour: Division of Work, Unpaid Care Work and Pay Gaps",
        "Gender-Based Violence, Legal Safeguards, POSH and Domestic Violence Acts",
        "Gender, Media and Cultural Inclusivity for an Equitable Society",
      ],
      filePatterns: [
        /unit1.*understanding.*\.pdf/i,
        /unit2.*gender_roles.*\.pdf/i,
        /unit3.*gender_and_labour.*\.pdf/i,
        /unit4.*gender_based_violence.*\.pdf/i,
        /unit5.*gender_and_culture.*\.pdf/i,
      ],
    });
  } catch (err) {
    console.error("  [ERROR 23A52702]:", err.message);
    results.errors.push({ code: "23A52702", error: err.message });
  }

  console.log("\n==================================================");
  console.log("INGESTION SUMMARY:");
  console.log(`Total Theory Notes Processed: ${results.notes.length}`);
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

uploadMech4_1().catch((err) => {
  console.error("FATAL ERROR during upload:", err);
  process.exit(1);
});
