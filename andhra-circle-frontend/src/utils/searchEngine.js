import API from "../api/api.js";
import { R23_SUBJECTS_BY_BRANCH_SEM } from "../data/r23Subjects.js";

// =========================================================================
// SUBJECT ACRONYM & SYNONYM DICTIONARY
// =========================================================================
export const SUBJECT_ALIASES = {
  ds: "data structures",
  ads: "advanced data structures",
  daa: "design and analysis of algorithms",
  os: "operating systems",
  dbms: "database management systems",
  ai: "artificial intelligence",
  aiml: "artificial intelligence and machine learning",
  ml: "machine learning",
  dl: "deep learning",
  nlp: "natural language processing",
  cv: "computer vision",
  rl: "reinforcement learning",
  genai: "generative ai",
  llm: "large language models",
  mlops: "mlops",
  cn: "computer networks",
  wt: "web technologies",
  flat: "formal languages and automata theory",
  toc: "theory of computation",
  se: "software engineering",
  cd: "compiler design",
  co: "computer organization",
  coa: "computer organization and architecture",
  dld: "digital logic design",
  m1: "linear algebra and calculus",
  "maths 1": "linear algebra and calculus",
  "math 1": "linear algebra and calculus",
  m2: "differential equations and vector calculus",
  "maths 2": "differential equations and vector calculus",
  "math 2": "differential equations and vector calculus",
  m3: "numerical methods and transforms",
  "maths 3": "numerical methods and transforms",
  "math 3": "numerical methods and transforms",
  m4: "probability and statistics",
  ps: "probability and statistics",
  "p&s": "probability and statistics",
  dms: "discrete mathematics",
  mfcs: "mathematical foundations of computer science",
  beee: "basic electrical and electronics engineering",
  bee: "basic electrical and electronics",
  bcme: "basic civil and mechanical engineering",
  ep: "engineering physics",
  ec: "engineering chemistry",
  eg: "engineering graphics and modeling",
  cp: "computer programming",
  py: "python programming",
  python: "python programming",
  c: "programming in c",
  cpp: "c++ programming",
  java: "java programming",
  oops: "object oriented programming",
  edc: "electronic devices and circuits",
  ss: "signals and systems",
  vlsi: "vlsi design",
  dsp: "digital signal processing",
  aec: "analog electronic circuits",
  dec: "digital electronic circuits",
  em: "engineering mechanics",
  thermo: "engineering thermodynamics",
  thermodynamics: "engineering thermodynamics",
  fm: "fluid mechanics and hydraulic machinery",
  fmm: "fluid mechanics and hydraulic machinery",
  som: "strength of materials",
  survey: "surveying and geomatics",
  surveying: "surveying and geomatics",
  eca: "electrical circuit analysis",
  cs: "control systems",
  pe: "power electronics",
  dwdm: "data warehousing and data mining",
  cns: "cryptography and network security",
  iot: "internet of things",
  cloud: "cloud computing",
  cc: "cloud computing",
};

// =========================================================================
// BRANCH DIRECTORY & METADATA
// =========================================================================
export const BRANCH_DIRECTORY = {
  CSE: {
    code: "CSE",
    name: "Computer Science & Engineering",
    icon: "💻",
    description: "Official lecture notes, lab manuals, question papers, and R23/R20 curriculum for Computer Science & Engineering.",
    aliases: ["cse", "computer science", "computer science engineering", "computer science & engineering", "cs", "information science", "ise", "information technology", "it"],
    portalQuery: "CSE",
  },
  AIML: {
    code: "AIML",
    name: "Artificial Intelligence & Machine Learning",
    icon: "🤖",
    description: "Verified Python code, Deep Learning lecture notes, Machine Learning exam papers, and official curriculum for AI & ML.",
    aliases: ["aiml", "cse_aiml", "cse aiml", "cseaiml", "ai", "ml", "artificial intelligence", "machine learning", "ai & ml", "ai and ml", "ai & data science", "data science", "ds"],
    portalQuery: "AIML",
  },
  ECE: {
    code: "ECE",
    name: "Electronics & Communication Engineering",
    icon: "📡",
    description: "Electronic Devices, Digital Logic, Signals & Systems, VLSI notes, laboratory manuals, and semester exam papers.",
    aliases: ["ece", "electronics", "electronics and communication", "electronics & communication", "electronics and communication engineering", "ec"],
    portalQuery: "ECE",
  },
  ME: {
    code: "ME",
    name: "Mechanical Engineering",
    icon: "⚙️",
    description: "Thermodynamics, Fluid Mechanics, Engineering Mechanics, Manufacturing notes, workshop manuals, and papers.",
    aliases: ["me", "mech", "mechanical", "mechanical engineering", "mechanical engg"],
    portalQuery: "ME",
  },
  CE: {
    code: "CE",
    name: "Civil Engineering",
    icon: "🏗️",
    description: "Strength of Materials, Surveying, Structural Analysis, Concrete Technology notes, field work manuals, and papers.",
    aliases: ["ce", "civil", "civil engineering"],
    portalQuery: "CE",
  },
  EEE: {
    code: "EEE",
    name: "Electrical & Electronics Engineering",
    icon: "⚡",
    description: "Circuit Theory, Electrical Machines, Power Systems, Control Systems lecture notes, laboratory manuals, and papers.",
    aliases: ["eee", "electrical", "electrical engineering", "electrical & electronics", "electrical & electronics engineering"],
    portalQuery: "EEE",
  },
};

// =========================================================================
// STATIC VERIFIED FALLBACK CURRICULUM & CORE RESOURCES
// (Guarantees instant, rich, accurate results even when offline or DB empty)
// =========================================================================
const FALLBACK_CORE_RESOURCES = [
  // -----------------------------------------------------------------------
  // CSE / AIML Notes
  // -----------------------------------------------------------------------
  {
    _id: "core-note-ds-1",
    title: "Data Structures through C - Complete Lecture Notes (Units 1-5)",
    subject: "Data Structures through C",
    subjectCode: "23A05201T",
    branch: "CSE",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Arrays, Linked Lists, Stacks, Queues, Binary Trees, Graphs, Sorting and Searching algorithms with C code examples.",
    author: "Dept of Computer Science & Engineering",
  },
  {
    _id: "core-note-py-1",
    title: "Introduction to Python Programming - Comprehensive Notes",
    subject: "Introduction to Programming (Python)",
    subjectCode: "23A05101T",
    branch: "AIML",
    semester: "1-1",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Python basics, Control Flow, Functions, Strings, Lists, Tuples, Dictionaries, File I/O, OOP and Exception handling.",
    author: "Dept of AI & Machine Learning",
  },
  {
    _id: "core-note-os-1",
    title: "Operating Systems & System Programming - Units 1 to 5",
    subject: "Operating Systems & System Programming",
    subjectCode: "23A05401T",
    branch: "CSE",
    semester: "2-2",
    year: "2nd Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Process management, CPU Scheduling, Deadlocks, Memory Management, Virtual Memory, and File System Implementation.",
    author: "Faculty of CSE & IT",
  },
  {
    _id: "core-note-dbms-1",
    title: "Database Management Systems (DBMS) - Complete Study Notes",
    subject: "Database Management Systems",
    subjectCode: "23A05301T",
    branch: "CSE",
    semester: "2-1",
    year: "2nd Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "ER Modeling, Relational Algebra, SQL Queries, Normalization (1NF to BCNF), Transaction Processing, ACID properties.",
    author: "JNTUA Resource Group",
  },
  {
    _id: "core-note-m1-1",
    title: "Linear Algebra & Calculus (M1) - R23 Complete Unit Notes",
    subject: "Linear Algebra & Calculus",
    subjectCode: "23A54101",
    branch: "COMMON",
    semester: "1-1",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Matrices, Eigenvalues & Eigenvectors, Cayley-Hamilton Theorem, Mean Value Theorems, Multiple Integrals.",
    author: "Dept of Mathematics",
  },
  {
    _id: "core-note-m2-1",
    title: "Differential Equations & Vector Calculus (M2) - Lecture Notes",
    subject: "Differential Equations & Vector Calculus",
    subjectCode: "23A54201",
    branch: "COMMON",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "First & Higher order linear differential equations, Vector Differentiation, Gradient, Curl, Divergence, Green's & Stokes' theorems.",
    author: "Dept of Mathematics",
  },
  {
    _id: "core-note-ml-1",
    title: "Machine Learning Foundations & Algorithms - Verified Notes",
    subject: "Machine Learning Foundations",
    subjectCode: "23A42401T",
    branch: "AIML",
    semester: "2-2",
    year: "2nd Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Supervised Learning, Regression, Decision Trees, SVM, Naive Bayes, Unsupervised Clustering, PCA and Model Evaluation.",
    author: "AIML Research Group",
  },

  // -----------------------------------------------------------------------
  // ECE Notes
  // -----------------------------------------------------------------------
  {
    _id: "core-note-edc-1",
    title: "Electronic Devices & Circuits (EDC) - Comprehensive Notes",
    subject: "Electronic Devices & Circuits",
    subjectCode: "23A04201T",
    branch: "ECE",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Semiconductor diodes, Zener diode, BJT characteristics, JFET, MOSFET, Biasing techniques, and Small signal amplifiers.",
    author: "Dept of ECE",
  },
  {
    _id: "core-note-dld-1",
    title: "Digital Logic Design (DLD) - Complete Unit 1 to 5 Notes",
    subject: "Digital Logic Design",
    subjectCode: "23A04301T",
    branch: "ECE",
    semester: "2-1",
    year: "2nd Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Boolean algebra, K-maps, Combinational logic, Adders, Multiplexers, Flip-Flops, Shift Registers, Counters and FSM design.",
    author: "Dept of ECE",
  },
  {
    _id: "core-note-ss-1",
    title: "Signals & Systems - Full Academic Study Guide",
    subject: "Signals & Systems",
    subjectCode: "23A04302T",
    branch: "ECE",
    semester: "2-1",
    year: "2nd Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Continuous and Discrete time signals, LTI systems, Fourier Series, Fourier Transform, Laplace Transform, Z-Transforms.",
    author: "Dept of ECE",
  },

  // -----------------------------------------------------------------------
  // ME (Mechanical) Notes
  // -----------------------------------------------------------------------
  {
    _id: "core-note-em-1",
    title: "Engineering Mechanics - Comprehensive Lecture Notes",
    subject: "Engineering Mechanics",
    subjectCode: "23A03101T",
    branch: "ME",
    semester: "1-1",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Statics of particles, Equilibrium of rigid bodies, Centroid and Center of Gravity, Moment of Inertia, Friction, Dynamics.",
    author: "Dept of Mechanical Engineering",
  },
  {
    _id: "core-note-thermo-1",
    title: "Engineering Thermodynamics - Complete Unit 1 to 5 Notes",
    subject: "Engineering Thermodynamics",
    subjectCode: "23A03301T",
    branch: "ME",
    semester: "2-1",
    year: "2nd Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Zeroth, First & Second laws of thermodynamics, Entropy, Pure substances, Air standard cycles (Otto, Diesel, Dual), Vapour power cycles.",
    author: "Dept of Mechanical Engineering",
  },
  {
    _id: "core-note-fm-1",
    title: "Fluid Mechanics & Hydraulic Machinery - Verified Notes",
    subject: "Fluid Mechanics & Hydraulic Machinery",
    subjectCode: "23A03401T",
    branch: "ME",
    semester: "2-2",
    year: "2nd Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Fluid properties, Pressure measurement, Fluid kinematics, Bernoulli equation, Boundary layer theory, Turbines & Pumps.",
    author: "Dept of Mechanical Engineering",
  },

  // -----------------------------------------------------------------------
  // CE (Civil) Notes
  // -----------------------------------------------------------------------
  {
    _id: "core-note-som-1",
    title: "Strength of Materials - Complete Academic Notes",
    subject: "Strength of Materials",
    subjectCode: "23A01301T",
    branch: "CE",
    semester: "2-1",
    year: "2nd Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Simple stresses & strains, Shear force and Bending moment diagrams, Flexural & Shear stresses, Torsion of shafts, Deflection of beams.",
    author: "Dept of Civil Engineering",
  },
  {
    _id: "core-note-survey-1",
    title: "Surveying & Geomatics - Lecture Notes (Units 1-5)",
    subject: "Surveying & Geomatics",
    subjectCode: "23A01201T",
    branch: "CE",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Chain & Compass surveying, Leveling & Contouring, Theodolite traversing, Curves, Total Station and GPS principles.",
    author: "Dept of Civil Engineering",
  },

  // -----------------------------------------------------------------------
  // EEE Notes
  // -----------------------------------------------------------------------
  {
    _id: "core-note-beee-1",
    title: "Basic Electrical & Electronics Engineering - Units 1 to 5",
    subject: "Basic Electrical & Electronics Engineering",
    subjectCode: "23A02101T",
    branch: "EEE",
    semester: "1-1",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "DC Circuit analysis, AC fundamentals, Single phase transformers, DC machines, Diodes & Transistors fundamentals.",
    author: "Dept of EEE",
  },
  {
    _id: "core-note-eca-1",
    title: "Electrical Circuit Analysis & Network Theory - Complete Notes",
    subject: "Electrical Circuit Analysis",
    subjectCode: "23A02201T",
    branch: "EEE",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Notes",
    icon: "📘",
    description: "Network theorems (Thevenin, Norton, Superposition), Resonance, Transient analysis, Two-port network parameters.",
    author: "Dept of EEE",
  },

  // -----------------------------------------------------------------------
  // Question Papers
  // -----------------------------------------------------------------------
  {
    _id: "core-paper-ds-1",
    title: "Data Structures through C - Semester End Regular Exam Paper",
    subject: "Data Structures through C",
    subjectCode: "23A05201T",
    branch: "CSE",
    semester: "1-2",
    year: "2024",
    regulation: "R23",
    type: "Question Paper",
    icon: "📄",
    description: "Official JNTUA regular semester examination question paper with full 70-mark split and model solutions.",
  },
  {
    _id: "core-paper-py-1",
    title: "Python Programming - 1-1 Regular & Supplementary Exam Paper",
    subject: "Introduction to Programming (Python)",
    subjectCode: "23A05101T",
    branch: "AIML",
    semester: "1-1",
    year: "2024",
    regulation: "R23",
    type: "Question Paper",
    icon: "📄",
    description: "JNTUA B.Tech 1st Year 1st Semester exam paper including coding problems and theoretical questions.",
  },
  {
    _id: "core-paper-dbms-1",
    title: "Database Management Systems (DBMS) - Mid & Semester End Papers",
    subject: "Database Management Systems",
    subjectCode: "23A05301T",
    branch: "CSE",
    semester: "2-1",
    year: "2024",
    regulation: "R20 / R23",
    type: "Question Paper",
    icon: "📄",
    description: "Collection of previous year questions on SQL queries, normalization, and concurrency control.",
  },
  {
    _id: "core-paper-os-1",
    title: "Operating Systems - JNTUA Regular Exam Question Paper",
    subject: "Operating Systems & System Programming",
    subjectCode: "23A05401T",
    branch: "CSE",
    semester: "2-2",
    year: "2024",
    regulation: "R20 / R23",
    type: "Question Paper",
    icon: "📄",
    description: "Previous question paper covering scheduling algorithms, banker's algorithm, paging and segmentation.",
  },
  {
    _id: "core-paper-edc-1",
    title: "Electronic Devices & Circuits (EDC) - Regular Exam Question Paper",
    subject: "Electronic Devices & Circuits",
    subjectCode: "23A04201T",
    branch: "ECE",
    semester: "1-2",
    year: "2024",
    regulation: "R23",
    type: "Question Paper",
    icon: "📄",
    description: "Official question paper covering PN junctions, BJT amplifiers, JFET characteristics and rectifiers.",
  },
  {
    _id: "core-paper-dld-1",
    title: "Digital Logic Design (DLD) - Semester End Exam Paper",
    subject: "Digital Logic Design",
    subjectCode: "23A04301T",
    branch: "ECE",
    semester: "2-1",
    year: "2024",
    regulation: "R23",
    type: "Question Paper",
    icon: "📄",
    description: "Exam paper covering K-map reduction, synchronous counters, multiplexers and shift registers.",
  },
  {
    _id: "core-paper-em-1",
    title: "Engineering Mechanics - 1st Year Exam Question Paper",
    subject: "Engineering Mechanics",
    subjectCode: "23A03101T",
    branch: "ME",
    semester: "1-1",
    year: "2024",
    regulation: "R23",
    type: "Question Paper",
    icon: "📄",
    description: "JNTUA regular exam paper covering equilibrium of forces, friction, centroid, and work-energy theorem.",
  },
  {
    _id: "core-paper-som-1",
    title: "Strength of Materials - Semester End Examination Paper",
    subject: "Strength of Materials",
    subjectCode: "23A01301T",
    branch: "CE",
    semester: "2-1",
    year: "2024",
    regulation: "R23",
    type: "Question Paper",
    icon: "📄",
    description: "Previous year exam paper with numerical problems on SFD, BMD, bending stress and deflection.",
  },
  {
    _id: "core-paper-eca-1",
    title: "Electrical Circuit Analysis - Previous Year Question Paper",
    subject: "Electrical Circuit Analysis",
    subjectCode: "23A02201T",
    branch: "EEE",
    semester: "1-2",
    year: "2024",
    regulation: "R23",
    type: "Question Paper",
    icon: "📄",
    description: "Question paper covering mesh & nodal analysis, Thevenin theorem, resonance and transient circuits.",
  },

  // -----------------------------------------------------------------------
  // Lab Programs
  // -----------------------------------------------------------------------
  {
    _id: "core-lab-ds-1",
    title: "Data Structures Laboratory - Verified C Programs & Viva Guide",
    subject: "Data Structures Laboratory",
    subjectCode: "23A05201P",
    branch: "CSE",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Lab Program",
    icon: "🧪",
    description: "All weekly lab exercises: Stack using array/linked list, Infix to Postfix, Queue, BST traversal, Quick sort, Dijkstra's algorithm.",
  },
  {
    _id: "core-lab-py-1",
    title: "Python Programming Laboratory - Complete Lab Exercises",
    subject: "Computer Programming Laboratory",
    subjectCode: "23A05101P",
    branch: "AIML",
    semester: "1-1",
    year: "1st Year",
    regulation: "R23",
    type: "Lab Program",
    icon: "🧪",
    description: "Executable Python scripts for all syllabus lab experiments with sample input/output and viva questions.",
  },
  {
    _id: "core-lab-dbms-1",
    title: "DBMS Lab Manual - SQL DDL/DML, Triggers, Procedures & Cursors",
    subject: "Database Management Systems Lab",
    subjectCode: "23A05301P",
    branch: "CSE",
    semester: "2-1",
    year: "2nd Year",
    regulation: "R23",
    type: "Lab Program",
    icon: "🧪",
    description: "Oracle SQL scripts, PL/SQL blocks, procedures, functions, packages and database normalization case studies.",
  },
  {
    _id: "core-lab-edc-1",
    title: "Electronic Devices & Circuits Lab - Verified Experiments Manual",
    subject: "Electronic Devices & Circuits Lab",
    subjectCode: "23A04201P",
    branch: "ECE",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Lab Program",
    icon: "🧪",
    description: "V-I characteristics of PN & Zener diode, Half/Full wave rectifiers, BJT Common Emitter input/output characteristics.",
  },
  {
    _id: "core-lab-me-1",
    title: "Engineering Workshop & Manufacturing Practice Lab Manual",
    subject: "Workshop & Manufacturing Practice",
    subjectCode: "23A03101P",
    branch: "ME",
    semester: "1-1",
    year: "1st Year",
    regulation: "R23",
    type: "Lab Program",
    icon: "🧪",
    description: "Carpentry, Fitting, Tin-Smithy, House wiring, Welding and Blacksmithy trades with detailed sketches and procedures.",
  },
  {
    _id: "core-lab-ce-1",
    title: "Surveying Field Work & Mapping Practical Manual",
    subject: "Surveying Field Work Lab",
    subjectCode: "23A01201P",
    branch: "CE",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Lab Program",
    icon: "🧪",
    description: "Profile leveling, Contouring, Theodolite traversing, Triangulation, Height and distance determination experiments.",
  },
  {
    _id: "core-lab-eee-1",
    title: "Electrical Circuits & Simulation Lab - Verified Experiments",
    subject: "Electrical Circuits Laboratory",
    subjectCode: "23A02201P",
    branch: "EEE",
    semester: "1-2",
    year: "1st Year",
    regulation: "R23",
    type: "Lab Program",
    icon: "🧪",
    description: "Verification of Kirchhoff's Laws, Superposition, Thevenin's, Norton's theorems and series/parallel resonance circuits.",
  },

  // -----------------------------------------------------------------------
  // Official Syllabus Copies
  // -----------------------------------------------------------------------
  {
    _id: "core-syl-r23-cse",
    title: "JNTUA R23 CSE B.Tech Complete Course Structure & Syllabus",
    subject: "Computer Science & Engineering Curriculum",
    branch: "CSE",
    semester: "All Semesters",
    year: "1st - 4th Year",
    regulation: "R23",
    type: "Syllabus",
    icon: "📚",
    description: "Full APSCHE/JNTUA official R23 scheme, credit distribution, course outcomes, textbooks and references.",
  },
  {
    _id: "core-syl-r23-aiml",
    title: "JNTUA R23 AI & Machine Learning Course Structure & Syllabus",
    subject: "Artificial Intelligence & Machine Learning Curriculum",
    branch: "AIML",
    semester: "All Semesters",
    year: "1st - 4th Year",
    regulation: "R23",
    type: "Syllabus",
    icon: "📚",
    description: "Official R23 regulation syllabus for AIML, covering Deep Learning, NLP, Data Science, Vision and Robotics.",
  },
  {
    _id: "core-syl-r23-ece",
    title: "JNTUA R23 ECE B.Tech Complete Course Structure & Syllabus",
    subject: "Electronics & Communication Curriculum",
    branch: "ECE",
    semester: "All Semesters",
    year: "1st - 4th Year",
    regulation: "R23",
    type: "Syllabus",
    icon: "📚",
    description: "Official R23 scheme for ECE: Analog circuits, Digital systems, Antennas, VLSI, DSP and Wireless communications.",
  },
  {
    _id: "core-syl-r23-me",
    title: "JNTUA R23 Mechanical Engineering Complete Syllabus & Scheme",
    subject: "Mechanical Engineering Curriculum",
    branch: "ME",
    semester: "All Semesters",
    year: "1st - 4th Year",
    regulation: "R23",
    type: "Syllabus",
    icon: "📚",
    description: "APSCHE R23 official course structure for Mechanical Engineering covering Thermal, Design, Manufacturing and Robotics.",
  },
  {
    _id: "core-syl-r23-ce",
    title: "JNTUA R23 Civil Engineering Course Structure & Syllabus",
    subject: "Civil Engineering Curriculum",
    branch: "CE",
    semester: "All Semesters",
    year: "1st - 4th Year",
    regulation: "R23",
    type: "Syllabus",
    icon: "📚",
    description: "Official R23 syllabus for Civil Engineering: Structural, Geotechnical, Environmental, Water Resources & Transportation.",
  },
  {
    _id: "core-syl-r23-eee",
    title: "JNTUA R23 Electrical & Electronics Engineering Course Syllabus",
    subject: "Electrical & Electronics Curriculum",
    branch: "EEE",
    semester: "All Semesters",
    year: "1st - 4th Year",
    regulation: "R23",
    type: "Syllabus",
    icon: "📚",
    description: "APSCHE R23 scheme for EEE: Power Systems, Electrical Machines, Control Systems, Power Electronics and Smart Grids.",
  },

  // -----------------------------------------------------------------------
  // Notifications
  // -----------------------------------------------------------------------
  {
    _id: "core-notif-1",
    title: "JNTUA B.Tech R20/R23 Semester End Examination Timetable 2024-25",
    subject: "Examination Timetable",
    branch: "ALL",
    semester: "All Semesters",
    regulation: "R20 / R23",
    type: "Notification",
    icon: "📢",
    description: "Official schedule for regular and supplementary examinations, fee payment deadlines, and hall ticket release dates.",
  },
  {
    _id: "core-notif-2",
    title: "Academic Calendar & Instruction Days for B.Tech 2nd, 3rd & 4th Years",
    subject: "Academic Calendar",
    branch: "ALL",
    semester: "2024-2025",
    regulation: "R20 / R23",
    type: "Notification",
    icon: "📢",
    description: "University circular detailing working Saturdays, mid examinations, preparatory holidays, and semester end dates.",
  },
];

// In-memory cache for portal resources
let cachedResources = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Build curriculum resource entries from R23 subject matrix
 */
function buildCurriculumResources() {
  const list = [];
  if (!R23_SUBJECTS_BY_BRANCH_SEM) return list;

  for (const [key, subjects] of Object.entries(R23_SUBJECTS_BY_BRANCH_SEM)) {
    const [branch, semNum] = key.split("-");
    const semester = semNum ? `${Math.ceil(Number(semNum) / 2)}-${((Number(semNum) - 1) % 2) + 1}` : "R23";

    subjects.forEach((sub, idx) => {
      const isLab = sub.name.toLowerCase().includes("lab") || sub.name.toLowerCase().includes("laboratory");
      list.push({
        _id: `r23-${key}-${idx}`,
        title: `${sub.name} (${sub.credits} Credits, R23 ${branch})`,
        subject: sub.name,
        branch: branch,
        semester: semester,
        year: semNum <= 2 ? "1st Year" : semNum <= 4 ? "2nd Year" : semNum <= 6 ? "3rd Year" : "4th Year",
        regulation: "R23",
        credits: sub.credits,
        type: isLab ? "Lab Program" : "Syllabus",
        icon: isLab ? "🧪" : "📚",
        description: `Official R23 JNTUA Curriculum Course for ${branch} Semester ${semester}. Credits: ${sub.credits}. Standard Target Grade: ${sub.grade || "A+"}.`,
        isCurriculum: true,
      });
    });
  }
  return list;
}

const CURRICULUM_RESOURCES = buildCurriculumResources();

/**
 * Fetch and consolidate all portal resources
 */
export async function getAllResources(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedResources && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedResources;
  }

  let dbResources = [];
  try {
    const [notesRes, papersRes, syllabusRes, notifsRes, labsRes] = await Promise.allSettled([
      API.get("/notes"),
      API.get("/papers"),
      API.get("/syllabus"),
      API.get("/notifications"),
      API.get("/lab-programs"),
    ]);

    const extractArray = (res) => {
      if (res.status !== "fulfilled" || !res.value) return [];
      const data = res.value.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.results)) return data.results;
      if (Array.isArray(data?.notes)) return data.notes;
      if (Array.isArray(data?.items)) return data.items;
      return [];
    };

    const notes = extractArray(notesRes).map((i) => ({ ...i, type: "Notes", icon: "📘" }));
    const papers = extractArray(papersRes).map((i) => ({ ...i, type: "Question Paper", icon: "📄" }));
    const syllabus = extractArray(syllabusRes).map((i) => ({ ...i, type: "Syllabus", icon: "📚" }));
    const notifs = extractArray(notifsRes).map((i) => ({ ...i, type: "Notification", icon: "📢" }));
    const labs = extractArray(labsRes).map((i) => ({ ...i, type: "Lab Program", icon: "🧪" }));

    dbResources = [...notes, ...papers, ...syllabus, ...notifs, ...labs];
  } catch (err) {
    console.warn("API resource fetch partial error, using fallbacks:", err?.message);
  }

  // Combine DB resources + fallback verified core materials + verified R23 curriculum subjects
  // Deduplicate by ID
  const map = new Map();
  dbResources.forEach((item) => {
    if (item._id) map.set(String(item._id), item);
  });
  FALLBACK_CORE_RESOURCES.forEach((item) => {
    if (!map.has(item._id)) map.set(item._id, item);
  });
  CURRICULUM_RESOURCES.forEach((item) => {
    if (!map.has(item._id)) map.set(item._id, item);
  });

  cachedResources = Array.from(map.values());
  lastFetchTime = now;
  return cachedResources;
}

// Conversational stop words that shouldn't pollute resource subject matching
const CONVERSATIONAL_STOP_WORDS = new Set([
  "can", "you", "give", "me", "i", "need", "want", "find", "show", "get", "please",
  "help", "tell", "what", "is", "are", "the", "of", "in", "for", "to", "a", "an",
  "some", "any", "where", "how", "do", "does", "with", "about", "provide", "share",
  "all", "looking", "search", "material", "materials", "giveme", "ineed"
]);

/**
 * Intelligent Query Tokenizer & Intent Extractor
 */
export function analyzeQuery(rawQuery) {
  if (!rawQuery) {
    return {
      cleanQuery: "",
      coreSubject: "",
      tokens: [],
      rawTokens: [],
      targetType: null,
      branch: null,
      semester: null,
      regulation: null,
    };
  }

  let q = rawQuery.toLowerCase().trim();

  // Replace common punctuation with space
  q = q.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, " ");
  // Compress multiple spaces
  q = q.replace(/\s+/g, " ").trim();

  // Identify resource type intent
  let targetType = null;
  if (/note|lecture|pdf|unit|module|textbook/i.test(q)) {
    targetType = "Notes";
  } else if (/paper|pyq|question|mid|sem end|previous/i.test(q)) {
    targetType = "Question Paper";
  } else if (/syllabus|curriculum|credit|regulation|course structure|scheme/i.test(q)) {
    targetType = "Syllabus";
  } else if (/lab|program|code|manual|viva|practical/i.test(q)) {
    targetType = "Lab Program";
  } else if (/notification|circular|timetable|exam date|result|alert/i.test(q)) {
    targetType = "Notification";
  }

  // Identify branch intent
  let branch = null;
  if (/\baiml\b|\bai\b|\bml\b|artificial intelligence/i.test(q)) branch = "AIML";
  else if (/\bcse\b|computer science/i.test(q)) branch = "CSE";
  else if (/\bece\b|electronics/i.test(q)) branch = "ECE";
  else if (/\beee\b|electrical/i.test(q)) branch = "EEE";
  else if (/\bcivil\b|\bce\b/i.test(q)) branch = "CE";
  else if (
    /\bmech\b|\bmechanical\b|\bme branch\b|\bme dept\b|\bdept of me\b|\bme engineering\b|\bme\s+[1-4]-[1-2]\b/i.test(q) ||
    q === "me"
  ) {
    branch = "ME";
  }

  // Identify semester intent
  let semester = null;
  const semMatch = q.match(/\b([1-4])-([1-2])\b/);
  if (semMatch) {
    semester = `${semMatch[1]}-${semMatch[2]}`;
  } else if (/1st sem|sem 1|semester 1\b/i.test(q)) {
    semester = "1-1";
  } else if (/2nd sem|sem 2|semester 2\b/i.test(q)) {
    semester = "1-2";
  } else if (/3rd sem|sem 3|semester 3\b/i.test(q)) {
    semester = "2-1";
  } else if (/4th sem|sem 4|semester 4\b/i.test(q)) {
    semester = "2-2";
  } else if (/5th sem|sem 5|semester 5\b/i.test(q)) {
    semester = "3-1";
  } else if (/6th sem|sem 6|semester 6\b/i.test(q)) {
    semester = "3-2";
  } else if (/7th sem|sem 7|semester 7\b/i.test(q)) {
    semester = "4-1";
  } else if (/8th sem|sem 8|semester 8\b/i.test(q)) {
    semester = "4-2";
  } else if (/1st year|first year/i.test(q)) {
    semester = "1st Year";
  } else if (/2nd year|second year/i.test(q)) {
    semester = "2nd Year";
  } else if (/3rd year|third year/i.test(q)) {
    semester = "3rd Year";
  } else if (/4th year|fourth year/i.test(q)) {
    semester = "4th Year";
  }

  // Identify regulation
  let regulation = null;
  if (/r23/i.test(q)) regulation = "R23";
  else if (/r20/i.test(q)) regulation = "R20";
  else if (/r19/i.test(q)) regulation = "R19";
  else if (/r16/i.test(q)) regulation = "R16";

  // Raw words from query
  const words = q.split(" ").filter(Boolean);

  // Extract core subject words by removing conversational words, resource types, branch, semester & regulation
  const typeWords = new Set(["note", "notes", "paper", "papers", "pyq", "pyqs", "question", "questions", "syllabus", "lab", "labs", "program", "programs", "manual", "manuals", "code", "material", "materials", "lecture"]);
  const branchWords = new Set(["cse", "aiml", "ece", "eee", "me", "mech", "civil", "ce", "cs", "it"]);
  const semWords = new Set(["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2", "1st", "2nd", "3rd", "4th", "sem", "semester", "year"]);
  const regWords = new Set(["r23", "r20", "r19", "r16", "regulation"]);

  const coreWords = words.filter(
    (w) =>
      !CONVERSATIONAL_STOP_WORDS.has(w) &&
      !typeWords.has(w) &&
      !branchWords.has(w) &&
      !semWords.has(w) &&
      !regWords.has(w)
  );
  let coreSubject = coreWords.join(" ").trim();

  // If coreSubject is an acronym in SUBJECT_ALIASES, resolve it
  let aliasExpanded = "";
  if (coreSubject && SUBJECT_ALIASES[coreSubject]) {
    aliasExpanded = SUBJECT_ALIASES[coreSubject];
  }

  // Expand aliases and acronyms into tokens
  const expandedTokens = new Set();
  words.forEach((w) => {
    expandedTokens.add(w);
    if (SUBJECT_ALIASES[w]) {
      SUBJECT_ALIASES[w].split(" ").forEach((exp) => expandedTokens.add(exp));
    }
  });

  if (aliasExpanded) {
    aliasExpanded.split(" ").forEach((exp) => expandedTokens.add(exp));
  }

  return {
    cleanQuery: q,
    coreSubject,
    aliasExpanded,
    tokens: Array.from(expandedTokens),
    rawTokens: words,
    targetType,
    branch,
    semester,
    regulation,
  };
}

/**
 * Score a single item against the query analysis
 */
export function scoreItem(item, analysis) {
  const { cleanQuery, coreSubject, aliasExpanded, tokens, targetType, branch, semester, regulation } = analysis;
  if (!cleanQuery) return 0;

  let score = 0;

  const title = (item.title || item.name || item.paperName || "").toLowerCase();
  const subject = (item.subject || "").toLowerCase();
  const subjectCode = (item.subjectCode || "").toLowerCase();
  const itemBranch = (item.branch || item.department || "").toLowerCase();
  const itemSem = (item.semester || "").toLowerCase();
  const itemReg = (item.regulation || "").toLowerCase();
  const itemType = (item.type || "").toLowerCase();
  const desc = (item.description || "").toLowerCase();

  const searchableText = `${title} ${subject} ${subjectCode} ${itemBranch} ${itemSem} ${itemReg} ${itemType} ${desc}`;

  // 1. Core Subject Matches (Highest precision)
  if (coreSubject && coreSubject.length >= 2) {
    if (subject.includes(coreSubject)) score += 160;
    else if (title.includes(coreSubject)) score += 140;
    else if (searchableText.includes(coreSubject)) score += 50;
  }

  // 2. Alias Expansion Matches (e.g. "os" -> "operating systems")
  if (aliasExpanded) {
    if (subject.includes(aliasExpanded)) score += 150;
    else if (title.includes(aliasExpanded)) score += 130;
  }

  // 3. Exact clean query phrase matches
  if (title.includes(cleanQuery)) score += 120;
  if (subject.includes(cleanQuery)) score += 100;
  if (cleanQuery.length > 2 && subjectCode.includes(cleanQuery)) score += 95;

  // 4. Token Matching
  tokens.forEach((token) => {
    if (token.length < 2) return;
    if (CONVERSATIONAL_STOP_WORDS.has(token)) return;

    if (subject.includes(token)) {
      score += 25;
    } else if (title.includes(token)) {
      score += 20;
    } else if (subjectCode.includes(token)) {
      score += 25;
    } else if (searchableText.includes(token)) {
      score += 10;
    }
  });

  // 5. Target Resource Type Boost (Notes, Question Paper, Syllabus, Lab Program)
  if (targetType) {
    if (itemType === targetType.toLowerCase()) {
      score += 65;
    } else {
      score -= 15; // penalty for wrong type when explicit type was requested
    }
  }

  // 6. Branch Match Boost
  if (branch) {
    if (itemBranch.includes(branch.toLowerCase()) || itemBranch === "common" || itemBranch === "all") {
      score += 45;
    }
  }

  // 7. Semester Match Boost
  if (semester) {
    if (itemSem.includes(semester.toLowerCase()) || (item.year && item.year.toLowerCase().includes(semester.toLowerCase()))) {
      score += 40;
    }
  }

  // 8. Regulation Match Boost
  if (regulation && itemReg.includes(regulation.toLowerCase())) {
    score += 30;
  }

  return score;
}

/**
 * Main Search & Related Content Engine
 */
export async function performSearch(query, options = {}) {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    return {
      query: "",
      results: [],
      relatedResources: [],
      relatedSubjects: [],
      suggestedQueries: [],
      categoryCounts: { all: 0, notes: 0, papers: 0, syllabus: 0, labs: 0, notifications: 0 },
    };
  }

  // 1. Attempt High-Performance Server-side MongoDB Aggregation Pipeline Search
  try {
    const res = await API.get("/search", {
      params: { q: trimmed, limit: 100 },
    });
    if (res?.data?.success && Array.isArray(res.data.results) && res.data.results.length > 0) {
      const serverResults = res.data.results;
      const categoryCounts = res.data.categoryCounts || {
        all: serverResults.length,
        notes: serverResults.filter((i) => i.type === "Notes").length,
        papers: serverResults.filter((i) => i.type === "Question Paper").length,
        syllabus: serverResults.filter((i) => i.type === "Syllabus").length,
        labs: serverResults.filter((i) => i.type === "Lab Program").length,
        notifications: serverResults.filter((i) => i.type === "Notification").length,
      };

      const topItem = serverResults[0];
      const relatedResources = serverResults.slice(1, 7);
      const suggestedQueries = [
        `${topItem.branch || "CSE"} ${topItem.semester || "1-1"} Notes`,
        `${topItem.subject || topItem.title} Question Papers`,
        "JNTUA Exam Notifications",
      ];

      return {
        query: trimmed,
        analysis: analyzeQuery(trimmed),
        results: serverResults,
        relatedResources,
        relatedSubjects: [],
        suggestedQueries,
        categoryCounts,
      };
    }
  } catch (apiErr) {
    // Graceful fallback to client-side search engine if backend search pipeline is unavailable
  }

  const allResources = await getAllResources(options.forceRefresh);
  const analysis = analyzeQuery(trimmed);

  // Score each item
  const scored = [];
  allResources.forEach((item) => {
    const score = scoreItem(item, analysis);
    if (score > 12) {
      scored.push({ item, score });
    }
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const matchedItems = scored.map((s) => s.item);

  // Category counts
  const categoryCounts = {
    all: matchedItems.length,
    notes: matchedItems.filter((i) => i.type === "Notes").length,
    papers: matchedItems.filter((i) => i.type === "Question Paper").length,
    syllabus: matchedItems.filter((i) => i.type === "Syllabus").length,
    labs: matchedItems.filter((i) => i.type === "Lab Program").length,
    notifications: matchedItems.filter((i) => i.type === "Notification").length,
  };

  // Find related companion resources for the top matched subject
  const topItem = matchedItems[0];
  let relatedResources = [];
  let relatedSubjects = [];
  let suggestedQueries = [];

  if (topItem) {
    const topSubject = (topItem.subject || topItem.title || "").toLowerCase();

    // Sibling resources of different type for the same subject
    relatedResources = allResources
      .filter((other) => {
        if (other._id === topItem._id) return false;
        const otherSub = (other.subject || other.title || "").toLowerCase();
        const sameSubject = otherSub && (topSubject.includes(otherSub) || otherSub.includes(topSubject));
        return sameSubject;
      })
      .slice(0, 4);

    // Identify related curriculum subjects from same branch / semester
    if (topItem.branch && topItem.semester && R23_SUBJECTS_BY_BRANCH_SEM) {
      const semNumMatch = topItem.semester.match(/([1-4])-([1-2])/);
      if (semNumMatch) {
        const semIndex = (parseInt(semNumMatch[1]) - 1) * 2 + parseInt(semNumMatch[2]);
        const key = `${topItem.branch}-${semIndex}`;
        const curList = R23_SUBJECTS_BY_BRANCH_SEM[key] || [];
        relatedSubjects = curList
          .filter((s) => !topSubject.includes(s.name.toLowerCase()))
          .slice(0, 5)
          .map((s) => ({
            name: s.name,
            credits: s.credits,
            branch: topItem.branch,
            semester: topItem.semester,
          }));
      }
    }

    // Build intelligent query suggestions
    const primaryName = topItem.subject || topItem.title.split("-")[0].trim();
    suggestedQueries = [
      `${primaryName} Notes`,
      `${primaryName} Question Paper`,
      `${primaryName} Lab Program`,
      `R23 ${topItem.branch || "CSE"} Syllabus`,
    ].filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  } else {
    // If no direct matches, give smart curriculum suggestions
    suggestedQueries = [
      "Data Structures Notes",
      "Python Programming Lab",
      "Operating Systems Papers",
      "R23 AIML Syllabus",
      "Linear Algebra Calculus M1",
      "JNTUA Exam Notifications",
    ];
  }

  return {
    query: trimmed,
    analysis,
    results: matchedItems,
    relatedResources,
    relatedSubjects,
    suggestedQueries,
    categoryCounts,
  };
}

/**
 * Detect if a user query corresponds to an engineering branch
 */
export function detectBranchFromQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "string") return null;

  const q = rawQuery.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ").replace(/\s+/g, " ");
  const words = q.split(" ").filter(Boolean);

  for (const branch of Object.values(BRANCH_DIRECTORY)) {
    // Exact code match
    if (words.includes(branch.code.toLowerCase()) || q === branch.code.toLowerCase()) {
      return branch;
    }

    // Alias matches
    for (const alias of branch.aliases) {
      const aliasClean = alias.toLowerCase().trim();
      if (q === aliasClean || words.includes(aliasClean)) {
        return branch;
      }
      // Substring check for multi-word aliases like "computer science"
      if (aliasClean.includes(" ") && q.includes(aliasClean)) {
        return branch;
      }
    }
  }

  return null;
}

/**
 * Retrieve comprehensive academic hub data for an engineering branch
 * Gathers notes, question papers, syllabus, lab programs, and 8-semester curriculum
 */
export async function getBranchHubData(branchCodeOrQuery) {
  const branchObj =
    typeof branchCodeOrQuery === "object" && branchCodeOrQuery.code
      ? branchCodeOrQuery
      : detectBranchFromQuery(branchCodeOrQuery) || BRANCH_DIRECTORY[String(branchCodeOrQuery).toUpperCase()] || BRANCH_DIRECTORY.CSE;

  const code = branchObj.code;
  const allResources = await getAllResources();

  // Normalize matching helper
  const matchesBranch = (item) => {
    const itemBranch = String(item.branch || item.department || "").toUpperCase();
    if (!itemBranch) return false;
    if (itemBranch === code) return true;
    if (code === "ME" && (itemBranch === "MECH" || itemBranch === "MECHANICAL")) return true;
    if (code === "CE" && (itemBranch === "CIVIL")) return true;
    if (code === "CSE" && (itemBranch === "CS" || itemBranch === "IT")) return true;
    // Common 1st year subjects apply to all branches
    if (itemBranch === "COMMON" || itemBranch === "ALL") return true;
    return false;
  };

  const branchResources = allResources.filter(matchesBranch);

  const notes = branchResources.filter((r) => r.type === "Notes");
  const papers = branchResources.filter((r) => r.type === "Question Paper");
  const syllabus = branchResources.filter((r) => r.type === "Syllabus");
  const labs = branchResources.filter((r) => r.type === "Lab Program");

  // Construct 8 semester curriculum from R23_SUBJECTS_BY_BRANCH_SEM
  const semesters = [];
  for (let semNum = 1; semNum <= 8; semNum++) {
    const key = `${code}-${semNum}`;
    const subjects = (R23_SUBJECTS_BY_BRANCH_SEM && R23_SUBJECTS_BY_BRANCH_SEM[key]) || [];
    const yearLabel = semNum <= 2 ? "1st Year" : semNum <= 4 ? "2nd Year" : semNum <= 6 ? "3rd Year" : "4th Year";
    const semName = `${yearLabel}, Sem ${((semNum - 1) % 2) + 1} (${Math.ceil(semNum / 2)}-${((semNum - 1) % 2) + 1})`;

    semesters.push({
      semNum,
      semName,
      subjects: subjects.map((s) => ({
        name: s.name,
        credits: s.credits,
        isLab: s.name.toLowerCase().includes("lab") || s.name.toLowerCase().includes("laboratory"),
      })),
    });
  }

  // Follow-up query recommendations
  const suggestions = [
    `${code} 1st Year Notes`,
    `${code} Question Papers`,
    `${code} Lab Manuals`,
    `R23 ${code} Syllabus`,
    `📊 ${code} CGPA Calculator`,
  ];

  return {
    branch: branchObj,
    totalCount: branchResources.length,
    counts: {
      notes: notes.length,
      papers: papers.length,
      syllabus: syllabus.length,
      labs: labs.length,
    },
    notes,
    papers,
    syllabus,
    labs,
    allResources: branchResources,
    semesters,
    suggestions,
  };
}

/**
 * Format a resource into a unified display card item
 */
export function formatResourceAction(item) {
  if (!item) return { path: "/search", label: "View in Portal" };

  if (item.type === "Notes") {
    if (item._id && !item.isCurriculum) {
      return { path: `/notes/${item._id}`, label: "Read Notes →" };
    }
    return { path: `/notes?search=${encodeURIComponent(item.subject || item.title)}`, label: "Browse Notes →" };
  }

  if (item.type === "Question Paper") {
    return { path: `/papers?search=${encodeURIComponent(item.subject || item.title)}`, label: "View Question Paper →" };
  }

  if (item.type === "Syllabus") {
    return { path: `/syllabus?search=${encodeURIComponent(item.subject || item.title)}`, label: "View Syllabus →" };
  }

  if (item.type === "Lab Program") {
    return { path: `/lab-programs?search=${encodeURIComponent(item.subject || item.title)}`, label: "Open Lab Manual →" };
  }

  if (item.type === "Notification") {
    return {
      path: item._id ? `/notifications?view=${encodeURIComponent(item._id)}` : `/notifications`,
      label: "View Notification →",
    };
  }

  return { path: `/search?query=${encodeURIComponent(item.title || "")}`, label: "View Resource →" };
}

// =========================================================================
// JNTUA ACADEMIC REGULATIONS KNOWLEDGE ENGINE & FAQ HANDLER
// Accurately answers university rules, CGPA formulas, attendance, passing marks,
// credit systems, and promotion guidelines instantly without false misses.
// =========================================================================

export function getAcademicKnowledgeAnswer(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "string") return null;
  const q = rawQuery.toLowerCase().trim();

  // 1. CGPA TO PERCENTAGE FORMULA & NUMERIC CONVERTER
  const hasCgpa = /cgpa|gpa/.test(q);
  const hasPercent = /percent|percentage|%/.test(q);
  const hasFormula = /formula|convert|conversion|calculate|how to/.test(q);

  if ((hasCgpa && hasPercent) || (hasPercent && hasFormula) || (hasCgpa && /to percentage|in percentage/.test(q))) {
    // Check if user gave an exact number like "8.5 cgpa to percentage"
    const numMatch = q.match(/([0-9]+\.?[0-9]*)/);
    let numericCalcText = "";
    if (numMatch) {
      const numVal = parseFloat(numMatch[1]);
      if (numVal <= 10.0 && numVal >= 0.5) {
        const calculatedPct = ((numVal - 0.5) * 10).toFixed(1);
        numericCalcText = `\n\n🎯 **Calculation for ${numVal.toFixed(2)} CGPA:**\n• **Equivalent Percentage:** (${numVal.toFixed(2)} - 0.5) × 10 = **${calculatedPct}%**`;
      }
    }

    return {
      isKnowledge: true,
      title: "JNTUA CGPA to Percentage Conversion",
      formula: "Equivalent Percentage (%) = (CGPA - 0.5) × 10",
      text:
        `Under official JNTUA academic regulations (R23, R20, and R19), the standard formula for converting Cumulative Grade Point Average (CGPA) into equivalent percentage of marks is:\n\n` +
        `**Formula:**\n` +
        `• **R23 / R20 / R19 Regulations:** \`(CGPA - 0.5) × 10\`\n` +
        `• **R16 & Earlier Regulations:** \`(CGPA - 0.75) × 10\`\n\n` +
        `**Reference Grade Benchmarks:**\n` +
        `• **9.00 CGPA** = **85.0%** (First Class with Distinction)\n` +
        `• **8.50 CGPA** = **80.0%** (First Class with Distinction)\n` +
        `• **8.00 CGPA** = **75.0%** (First Class with Distinction)\n` +
        `• **7.50 CGPA** = **70.0%** (First Class)\n` +
        `• **6.50 CGPA** = **60.0%** (First Class)\n` +
        `• **5.50 CGPA** = **50.0%** (Second Class)` +
        numericCalcText,
      action: { label: "Open CGPA & SGPA Calculator →", path: "/calculator" },
      suggestions: ["📊 SGPA Calculator", "📜 10-Point Grading Scale", "📋 Attendance Rules"],
    };
  }

  // 2. CREDIT DETENTION & PROMOTION RULES (Must check before general attendance detention)
  if (/credit detention|promotion rule|promotion criteria|year promotion|promoted to|how many credits to enter/.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Promotion & Credit Detention Guidelines",
      formula: "Must secure minimum 40% prescribed credits for year-to-year promotion",
      text:
        `Official credit progression requirements for promotion to subsequent academic years:\n\n` +
        `• **Promotion from 1st Year to 2nd Year:** A student must secure at least **40% of the total credits** prescribed for the 1st Year (semesters 1-1 and 1-2).\n` +
        `• **Promotion from 2nd Year to 3rd Year:** A student must secure at least **40% of total credits** prescribed up to the end of semester 2-2.\n` +
        `• **Promotion from 3rd Year to 4th Year:** A student must secure at least **40% of total credits** prescribed up to semester 3-2.\n` +
        `• Students who do not meet the minimum credit threshold are detained until the requisite backlog credits are cleared.`,
      action: { label: "Check Academic Notifications →", path: "/notifications" },
      suggestions: ["📋 Attendance Rules", "📝 Internal Marks Criteria", "📊 CGPA Calculator"],
    };
  }

  // 3. ATTENDANCE, CONDONATION & DETENTION POLICIES
  if (/attendance|condonation|shortage of attendance|medical leave|detention|detained/.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Attendance & Condonation Rules",
      formula: "Minimum Regular: 75% | Condonation: 65% - 74.9% | Detention: < 65%",
      text:
        `Official JNTUA attendance requirements and eligibility guidelines for semester end examinations:\n\n` +
        `• **Regular Eligibility:** A student must secure a minimum aggregate attendance of **75%** across all theory and laboratory subjects.\n` +
        `• **Condonation of Shortage:** Attendance between **65% and 74.9%** may be condoned by the Academic Committee on genuine medical grounds upon submission of an authorized hospital certificate and payment of the prescribed university condonation fee.\n` +
        `• **Academic Detention:** Students securing **less than 65% aggregate attendance** are strictly detained. They are not permitted to appear for the semester end examinations and must re-register for that semester in the next academic year.`,
      action: { label: "View Official Notifications →", path: "/notifications" },
      suggestions: ["📝 Internal Marks Criteria", "📊 10-Point Grade Scale", "🚀 Build Student Profile"],
    };
  }

  // 3. MID-TERM EXAMS (CIE) EVALUATION & 80:20 WEIGHTAGE RULE
  if (/80[:\s]*20|mid.*(?:mark|exam|rule|split|weight|calc|internal)|how.*mid.*calculated|mid 1.*mid 2/i.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Mid-Term Examination 80:20 Calculation Rule",
      formula: "Internal Marks = (0.80 × Best Mid) + (0.20 × Other Mid) + Assignment/Quiz (10M)",
      text:
        `Under official JNTUA academic regulations (R23 & R20), Continuous Internal Evaluation (CIE) for theory courses is awarded based on two mid-term examinations with an **80:20 weightage rule**:\n\n` +
        `• **Weightage Scheme:** **80% weightage** is awarded to the best-performing mid examination, and **20% weightage** is given to the other mid examination.\n` +
        `• **Component Breakdown:**\n` +
        `  - Each Mid exam has descriptive questions (20 marks) + objective/quiz (10 marks).\n` +
        `  - Total Scaled Mid Weightage: **20 Marks** (80% best mid + 20% second mid).\n` +
        `  - Continuous assessment (assignments, seminar/quiz, micro-projects, active participation): **10 Marks**.\n` +
        `  - **Total Internal Marks (CIE):** **30 Marks**.\n\n` +
        `🎯 **Example Calculation:**\n` +
        `• Mid-1 score: **28 / 30**, Mid-2 score: **20 / 30**\n` +
        `• Calculation: \`(0.8 × 28) + (0.2 × 20) = 22.4 + 4.0 = 26.4\` → **27 Marks** out of 30!`,
      action: { label: "Open CGPA & SGPA Calculator →", path: "/calculator" },
      suggestions: ["📝 Passing Marks Criteria", "📊 10-Point Grade Scale", "📋 Attendance Rules"],
    };
  }

  // 4. INTERNAL (CIE) & EXTERNAL (SEE) MARKS SPLIT & PASSING CRITERIA
  if (/pass mark|passing mark|internal mark|external mark|cie|see|minimum mark|how many mark to pass|exam pattern|marks split/.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Internal & External Evaluation System",
      formula: "Total: 100M | Internal (CIE): 30M | External (SEE): 70M | Min to Pass: 35% External & 40% Aggregate",
      text:
        `Official JNTUA examination scheme and minimum qualifying marks under R23 and R20 regulations:\n\n` +
        `**Theory Courses (100 Marks Total):**\n` +
        `• **Continuous Internal Evaluation (CIE):** **30 Marks** (conducted through 2 mid-term examinations of 20 marks each + 10 marks for assignments, quizzes, and continuous class assessment).\n` +
        `• **Semester End Examination (SEE):** **70 Marks** (3-hour university external examination).\n` +
        `• **Passing Minimum:** Minimum **35% (25 marks out of 70)** in the semester-end external exam, and minimum **40% (40 marks out of 100)** in aggregate (Internal + External combined).\n\n` +
        `**Laboratory Courses (100 Marks Total):**\n` +
        `• **30 Marks** Internal continuous day-to-day work & internal lab test.\n` +
        `• **70 Marks** External laboratory examination and viva-voce.\n` +
        `• Minimum 35% in external lab and 40% combined aggregate to pass.`,
      action: { label: "Browse Question Papers →", path: "/papers" },
      suggestions: ["📊 CGPA Calculator", "📜 10-Point Grade Scale", "📚 Official Syllabus"],
    };
  }

  // 4. 10-POINT GRADING SYSTEM & SGPA / CGPA FORMULA
  if (/grading system|grade scale|grade point|letter grade|how is sgpa calculated|how is cgpa calculated|sgpa formula|cgpa formula|o grade|a\+ grade/.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA 10-Point Letter Grading Scale",
      formula: "SGPA = Σ(Credits × Grade Points) / Σ(Credits)",
      text:
        `JNTUA evaluates semester academic performance using a 10-point relative/absolute grading scale:\n\n` +
        `• **O (Outstanding):** 90% to 100% → **Grade Point: 10**\n` +
        `• **A+ (Excellent):** 80% to 89% → **Grade Point: 9**\n` +
        `• **A (Very Good):** 70% to 79% → **Grade Point: 8**\n` +
        `• **B (Good):** 60% to 69% → **Grade Point: 7**\n` +
        `• **C (Fair / Above Average):** 50% to 59% → **Grade Point: 6**\n` +
        `• **D (Pass / Satisfactory):** 40% to 49% → **Grade Point: 5**\n` +
        `• **F (Fail):** Below 40% → **Grade Point: 0**\n` +
        `• **Ab (Absent):** → **Grade Point: 0**\n\n` +
        `**SGPA Calculation:** Sum of (Course Credits × Grade Points) divided by Total Semester Credits.\n` +
        `**CGPA Calculation:** Cumulative sum of (Credits × Grade Points) across all completed semesters divided by Total Cumulative Credits.`,
      action: { label: "Open CGPA & SGPA Calculator →", path: "/calculator" },
      suggestions: ["📊 CGPA to Percentage", "📋 Attendance Rules", "📚 R23 Curriculum"],
    };
  }

  // 5. CREDIT REQUIREMENTS, HONOURS & MINORS
  if (/credit requirement|how many credit|total credit|graduation credit|honours|minor degree|lateral entry credit/.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Credit Requirements & Degree Eligibility",
      formula: "Regular: 160 Credits | Lateral Entry: 120 Credits | Honours/Minors: +18-20 Credits",
      text:
        `Official degree credit requirements under APSCHE and JNTUA R23/R20 regulations:\n\n` +
        `• **Regular 4-Year B.Tech:** A candidate must secure **160 Credits** across 8 semesters with zero backlogs to be awarded the B.Tech degree.\n` +
        `• **Lateral Entry (FDH - 3 Years):** Students admitted directly into the 2nd year (3rd semester) must secure **120 Credits** across 6 semesters.\n` +
        `• **B.Tech (Honours / Minor Degree):** Eligible students with CGPA ≥ 7.5/8.0 and no history of backlogs can earn an additional **18 to 20 Credits** via specialized SWAYAM/NPTEL MOOCs or university-approved tracks.\n` +
        `• **Mandatory Non-Credit Courses:** Induction program, Environmental Science, Constitution of India, and Community Service Projects must be satisfactorily completed.`,
      action: { label: "View R23 Course Structure →", path: "/syllabus" },
      suggestions: ["📊 CGPA Calculator", "🚀 Build Student Profile", "📜 Promotion Rules"],
    };
  }

  // 7. REVALUATION, RECOUNTING & CHALLENGE VALUATION
  if (/revaluation|recounting|challenge valuation|result verification|paper recheck/.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Revaluation, Recounting & Challenge Valuation",
      formula: "Apply via college exam branch within 10-15 days of online results",
      text:
        `Following the announcement of semester-end exam results on the JNTUA exam portal, students can apply for:\n\n` +
        `• **Recounting:** Re-verifies that marks on all answer scripts are totaled and entered correctly without missing any answer.\n` +
        `• **Revaluation:** Complete reassessment of the answer book by an independent second examiner.\n` +
        `• **Challenge Valuation:** For students confident in a significant grade increase. If the marks increase by the prescribed threshold (typically ≥ 15%), the challenge fee is refunded.\n` +
        `• Notifications with fee details and deadlines are published on the college and university examination portals.`,
      action: { label: "View Latest Exam Circulars →", path: "/notifications" },
      suggestions: ["📝 Question Papers", "📊 CGPA Calculator", "📚 Syllabus"],
    };
  }

  // 8. BACKLOG & SUPPLEMENTARY EXAMINATION REGULATIONS
  if (/backlog|supplementary|supply exam|clear backlog|clearing backlog|arrears|failed in subject|supplementary rule|supply attempt/i.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Backlog & Supplementary Examination Rules",
      formula: "Passing Threshold: Min 35% in SEE (25/70) & 40% Aggregate | CIE Internals Carried Forward",
      text:
        `Official rules regarding backlog clearance and supplementary examinations under JNTUA regulations:\n\n` +
        `• **Concurrent Examinations:** Supplementary exams are conducted alongside regular semester-end examinations twice a year.\n` +
        `• **Internal Marks Retention:** Continuous Internal Evaluation (CIE) marks secured during regular semester attendance are **permanently carried forward**; students do not need to rewrite internal or mid-term examinations.\n` +
        `• **Passing Threshold in Supply:** Student must score at least **25 marks out of 70 (35%)** in the semester external examination, and the total of (CIE + SEE) must be at least **40 marks out of 100 (40%)**.\n` +
        `• **Grade Award:** Grade points for cleared backlogs are calculated based on the new total without penalty, and the backlog flag is cleared on subsequent grade sheets.\n` +
        `• **No Attempt Limit:** There is no restriction on the number of attempts within the maximum permitted duration (N+2 rule).`,
      action: { label: "Browse Question Papers for Practice →", path: "/papers" },
      suggestions: ["📝 Internal Marks Criteria", "📊 SGPA Calculator", "📜 Promotion Rules"],
    };
  }

  // 9. GRACE MARKS & SUBJECT EXEMPTION (0.15% RULE)
  if (/grace mark|subject exemption|exemption rule|0\.15%?|can i drop subject|leave two subjects|grace marks rule|exemption in r20|exemption in r23/i.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Grace Marks & Subject Exemption Guidelines",
      formula: "R23/R20: All 160 Credits Mandatory (Zero Exemption) | Grace Marks: Up to 0.15% Aggregate",
      text:
        `Official policy regarding grace marks and subject exemptions across JNTUA regulations:\n\n` +
        `• **R23 and R20 Regulations (Mandatory 160 Credits):**\n` +
        `  - **Subject Exemption is DISCONTINUED.** A student must pass all prescribed subjects and secure all **160 credits** (120 credits for Lateral Entry) to receive the B.Tech Degree.\n` +
        `  - Students cannot drop or leave any core, elective, or lab courses.\n` +
        `• **Grace Marks (0.15% University Provision):**\n` +
        `  - JNTUA permits granting up to **0.15% of total maximum marks** of the course (typically 8 to 10 marks total) to enable a candidate to pass in one or two subjects, provided the student has passed all remaining subjects.\n` +
        `• **R16 & Earlier Regulations (Legacy):**\n` +
        `  - Allowed exemption of up to 2 theory subjects with a maximum of 8 credits, provided the candidate secured at least 172 out of 180 credits.`,
      action: { label: "View Official Notifications →", path: "/notifications" },
      suggestions: ["📊 CGPA Calculator", "📝 80:20 Mid Marks Rule", "📚 R23 Curriculum"],
    };
  }

  // 10. MAXIMUM DURATION FOR DEGREE COMPLETION (N+2 RULE)
  if (/maximum duration|maximum year|n\+2|n \+ 2|time limit to complete|how many years to complete btech|course completion limit|double duration/i.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Maximum Time Limit for Degree Completion (N+2 Rule)",
      formula: "Regular 4-Year B.Tech: Max 8 Academic Years | Lateral Entry: Max 6 Academic Years",
      text:
        `Under official UGC and JNTUA academic guidelines, students must complete all academic requirements within a double duration limit:\n\n` +
        `• **Regular 4-Year B.Tech Students:** Must complete all 8 semesters, clear all backlogs, and secure 160 credits within a maximum period of **8 consecutive academic years** from the year of initial admission.\n` +
        `• **Lateral Entry (FDH) Students:** Must complete all 6 semesters and secure 120 credits within a maximum of **6 consecutive academic years** from admission into the 2nd year.\n` +
        `• **Consequences of Expiry:** A student failing to fulfill all requirements within the stipulated timeframe forfeits their seat, and registration is automatically cancelled.`,
      action: { label: "Open Student Profile →", path: "/profile" },
      suggestions: ["📜 Promotion Rules", "📊 CGPA Calculator", "📝 Backlog Rules"],
    };
  }

  // 11. JNTUA RESULTS CHECKING & OFFICIAL DEGREE CERTIFICATES
  if (/check result|results portal|how to check result|jntuaresults|result link|marks memo|provisional certificate|pc and cmm|original degree|od application|tatkal/i.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Results Portal & Degree Certificates (PC / CMM / OD)",
      formula: "Results: jntuaresults.ac.in | Student Services: jntuassp.ac.in",
      text:
        `Procedures for checking semester results and applying for official degree credentials:\n\n` +
        `• **Official Results Web Portal:** Results are announced online at **\`jntuaresults.ac.in\`** and **\`jntua.ac.in\`**. Enter your 10-digit Hall Ticket Number (e.g. \`22B91A4201\`) to view grade cards.\n` +
        `• **Recounting / Revaluation Window:** Open within **10 to 15 days** of the result publication date.\n` +
        `• **Provisional Certificate (PC) & Consolidated Marks Memo (CMM):** Issued automatically through your college examination branch upon passing all 8 semesters.\n` +
        `• **Original Degree (OD):** Applied via the JNTUA Student Services Portal (**\`jntuassp.ac.in\`**) for Convocation or under Tatkal mode for urgent dispatch.`,
      action: { label: "Check University Circulars →", path: "/notifications" },
      suggestions: ["📊 CGPA Calculator", "📝 Revaluation Procedure", "🚀 Build Student Profile"],
    };
  }

  // 12. CAMPUS PLACEMENT ELIGIBILITY & CGPA CUTOFFS
  if (/placement|campus drive|placement criteria|minimum cgpa for placement|placement eligibility|can backlog student sit for placement|company cutoff|tcs criteria|infosys criteria/i.test(q)) {
    return {
      isKnowledge: true,
      title: "Campus Placements Eligibility & Industry CGPA Benchmarks",
      formula: "Product Tier: 7.5+ CGPA | IT Services (TCS, Infosys, Wipro): 60% / 6.5 CGPA with 0 Standing Arrears",
      text:
        `General industry recruitment criteria for engineering graduates at JNTU affiliated colleges:\n\n` +
        `• **Top Tech / Product Companies (Google, Microsoft, Amazon, Cisco):**\n` +
        `  - Minimum CGPA: **7.5 to 8.5+** with zero active backlogs.\n` +
        `  - High emphasis on Data Structures & Algorithms (DSA), System Design, and projects.\n` +
        `• **Mass IT Recruiters (TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini):**\n` +
        `  - Minimum **60% or 6.5 CGPA** across 10th, 12th/Diploma, and B.Tech.\n` +
        `  - Strictly **0 active / standing backlogs** at the time of the recruitment drive.\n` +
        `• **Standing vs. Cleared Backlogs:** History of cleared backlogs is accepted by most companies, provided all arrears are cleared before commencement of the final year (4-1).`,
      action: { label: "Open CGPA & SGPA Calculator →", path: "/calculator" },
      suggestions: ["📊 Target CGPA Planner", "📘 Data Structures Notes", "📝 10-Point Grade Scale"],
    };
  }

  // 13. B.TECH FIRST YEAR (1-1 & 1-2) COMMON CURRICULUM
  if (/1st year subject|first year subject|1-1 subject|1-2 subject|common subjects|first year syllabus|btech 1st year/i.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA B.Tech 1st Year (1-1 & 1-2) Common Core Curriculum",
      formula: "Common Group-A & Group-B Foundation across All Engineering Disciplines",
      text:
        `Under official R23 regulations, the 1st year B.Tech curriculum is structured into core foundational groups:\n\n` +
        `**Semester 1-1 Common Courses:**\n` +
        `• Linear Algebra & Calculus (Mathematics-1)\n` +
        `• Engineering Chemistry / Engineering Physics\n` +
        `• Basic Electrical & Electronics Engineering (BEEE)\n` +
        `• Introduction to Programming with Python / C\n` +
        `• Communicative English\n` +
        `• Respective Laboratories & IT Workshop\n\n` +
        `**Semester 1-2 Common Courses:**\n` +
        `• Differential Equations & Vector Calculus (Mathematics-2)\n` +
        `• Engineering Physics / Engineering Chemistry\n` +
        `• Basic Civil & Mechanical Engineering (BCME)\n` +
        `• Data Structures / Engineering Graphics & CAD\n` +
        `• Health & Wellness / Community Service Project`,
      action: { label: "Browse 1st Year Curriculum in Syllabus →", path: "/syllabus" },
      suggestions: ["📘 Linear Algebra Notes", "📘 Differential Equations Notes", "📊 CGPA Calculator"],
    };
  }

  // 14. LABORATORY EVALUATION & PRACTICAL EXAM PATTERN
  if (/lab mark|lab exam|practical exam|internal lab|external lab|viva|how lab marks are calculated/i.test(q)) {
    return {
      isKnowledge: true,
      title: "JNTUA Practical & Laboratory Examination Evaluation Scheme",
      formula: "Total: 100M | Day-to-Day Continuous (CIE): 30M | Semester End Practical (SEE): 70M",
      text:
        `Evaluation scheme for laboratory courses under JNTUA R23 and R20 regulations:\n\n` +
        `• **Continuous Day-to-Day Internal Work (30 Marks):**\n` +
        `  - Regular observation record, execution of programs, and viva: **15 Marks**.\n` +
        `  - Internal practical test conducted by subject faculty: **15 Marks**.\n` +
        `• **Semester End Laboratory Examination (70 Marks):**\n` +
        `  - Conducted jointly by an internal teacher and an appointed external examiner.\n` +
        `  - Experiment write-up & procedure: **20 Marks**.\n` +
        `  - Program execution, output verification & viva-voce: **50 Marks**.\n` +
        `• **Passing Minimum:** Minimum **35% (25/70)** in the external lab exam and **40% (40/100)** in aggregate.`,
      action: { label: "Browse Lab Programs Catalog →", path: "/search?query=lab" },
      suggestions: ["💻 Python Lab Programs", "💻 DS Lab Programs", "📊 Grade Scale"],
    };
  }

  return null;
}

// =========================================================================
// JNTUA SEMESTER CURRICULUM QUERY ENGINE
// If user asks for branch and semester subjects (e.g. "CSE 2-1 subjects"),
// extracts the exact course list with credits and instant study links.
// =========================================================================

export function getSemesterCurriculumAnswer(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "string") return null;
  const q = rawQuery.toLowerCase().trim();

  // Check if query is asking for curriculum/subjects
  const isSubjectEnquiry = /subject|subjects|curriculum|course|courses|syllabus/.test(q);
  if (!isSubjectEnquiry) return null;

  // Detect branch
  let branch = null;
  if (/\baiml\b|\bai\b|\bml\b|artificial intelligence/i.test(q)) branch = "AIML";
  else if (/\bcse\b|computer science/i.test(q)) branch = "CSE";
  else if (/\bece\b|electronics/i.test(q)) branch = "ECE";
  else if (/\beee\b|electrical/i.test(q)) branch = "EEE";
  else if (/\bmech\b|\bme\b|mechanical/i.test(q)) branch = "ME";
  else if (/\bcivil\b|\bce\b/i.test(q)) branch = "CE";

  if (!branch) return null;

  // Detect semester index (1 to 8)
  let semIndex = null;
  const directMatch = q.match(/\b([1-4])-([1-2])\b/);
  if (directMatch) {
    const year = parseInt(directMatch[1]);
    const sem = parseInt(directMatch[2]);
    semIndex = (year - 1) * 2 + sem;
  } else if (/1-1|1st sem|sem 1\b/i.test(q)) {
    semIndex = 1;
  } else if (/1-2|2nd sem|sem 2\b/i.test(q)) {
    semIndex = 2;
  } else if (/2-1|3rd sem|sem 3\b/i.test(q)) {
    semIndex = 3;
  } else if (/2-2|4th sem|sem 4\b/i.test(q)) {
    semIndex = 4;
  } else if (/3-1|5th sem|sem 5\b/i.test(q)) {
    semIndex = 5;
  } else if (/3-2|6th sem|sem 6\b/i.test(q)) {
    semIndex = 6;
  } else if (/4-1|7th sem|sem 7\b/i.test(q)) {
    semIndex = 7;
  } else if (/4-2|8th sem|sem 8\b/i.test(q)) {
    semIndex = 8;
  }

  if (!semIndex || semIndex < 1 || semIndex > 8) return null;

  const key = `${branch}-${semIndex}`;
  const subjectsList = (R23_SUBJECTS_BY_BRANCH_SEM && R23_SUBJECTS_BY_BRANCH_SEM[key]) || [];
  if (subjectsList.length === 0) return null;

  const yearNum = Math.ceil(semIndex / 2);
  const semInYear = ((semIndex - 1) % 2) + 1;
  const semCode = `${yearNum}-${semInYear}`;
  const yearLabel = yearNum === 1 ? "1st Year" : yearNum === 2 ? "2nd Year" : yearNum === 3 ? "3rd Year" : "4th Year";
  const semesterTitle = `${branch} • ${yearLabel}, Semester ${semInYear} (${semCode}) Curriculum`;

  const totalCredits = subjectsList.reduce((acc, curr) => acc + (parseFloat(curr.credits) || 0), 0);
  const theorySubjects = subjectsList.filter(
    (s) => !s.name.toLowerCase().includes("lab") && !s.name.toLowerCase().includes("laboratory")
  );
  const labSubjects = subjectsList.filter(
    (s) => s.name.toLowerCase().includes("lab") || s.name.toLowerCase().includes("laboratory")
  );

  const formattedSubjects = subjectsList.map((s) => ({
    name: s.name,
    credits: s.credits,
    isLab: s.name.toLowerCase().includes("lab") || s.name.toLowerCase().includes("laboratory"),
    branch,
    semester: semCode,
  }));

  const textLines = [
    `Here is the official **R23 Course Structure** for **${branch} ${semCode}** (${subjectsList.length} Courses, ${totalCredits} Total Credits):`,
    "",
    "**📚 Theory Courses:**",
    ...theorySubjects.map((s) => `• **${s.name}** (${s.credits} Credits)`),
    "",
    "**💻 Practical / Laboratories:**",
    ...labSubjects.map((s) => `• **${s.name}** (${s.credits} Credits)`),
  ];

  return {
    isSemesterCurriculum: true,
    branchCode: branch,
    semesterCode: semCode,
    semesterTitle,
    totalCredits,
    subjects: formattedSubjects,
    text: textLines.join("\n"),
    action: {
      label: `Browse Full ${branch} Syllabus Portal →`,
      path: `/syllabus?branch=${branch}`,
    },
    suggestions: formattedSubjects.slice(0, 4).map((s) => `${s.name} notes`),
  };
}
