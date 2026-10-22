import API from "../api/api";
import { R23_SUBJECTS_BY_BRANCH_SEM } from "../data/r23Subjects";

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
  m2: "differential equations and vector calculus",
  m3: "numerical methods and transforms",
  ps: "probability and statistics",
  dms: "discrete mathematics",
  beee: "basic electrical and electronics engineering",
  bee: "basic electrical and electronics",
  bcme: "basic civil and mechanical engineering",
  ep: "engineering physics",
  ec: "engineering chemistry",
  eg: "engineering graphics and modeling",
  cp: "computer programming",
  py: "python programming",
};

// =========================================================================
// BRANCH DIRECTORY & METADATA
// =========================================================================
export const BRANCH_DIRECTORY = {
  CSE: {
    code: "CSE",
    name: "Computer Science & Engineering",
    icon: "terminal",
    description: "Official lecture notes, lab manuals, question papers, and R23/R20 curriculum for Computer Science & Engineering.",
    aliases: ["cse", "computer science", "computer science engineering", "computer science & engineering", "cs", "information science", "ise", "information technology", "it"],
    portalQuery: "CSE",
  },
  AIML: {
    code: "AIML",
    name: "Artificial Intelligence & Machine Learning",
    icon: "smart_toy",
    description: "Verified Python code, Deep Learning lecture notes, Machine Learning exam papers, and official curriculum for AI & ML.",
    aliases: ["aiml", "ai", "ml", "artificial intelligence", "machine learning", "ai & ml", "ai and ml", "ai & data science", "data science", "ds"],
    portalQuery: "AIML",
  },
  ECE: {
    code: "ECE",
    name: "Electronics & Communication Engineering",
    icon: "memory",
    description: "Electronic Devices, Digital Logic, Signals & Systems, VLSI notes, laboratory manuals, and semester exam papers.",
    aliases: ["ece", "electronics", "electronics and communication", "electronics & communication", "electronics and communication engineering", "ec"],
    portalQuery: "ECE",
  },
  ME: {
    code: "ME",
    name: "Mechanical Engineering",
    icon: "settings",
    description: "Thermodynamics, Fluid Mechanics, Engineering Mechanics, Manufacturing notes, workshop manuals, and papers.",
    aliases: ["me", "mech", "mechanical", "mechanical engineering", "mechanical engg"],
    portalQuery: "ME",
  },
  CE: {
    code: "CE",
    name: "Civil Engineering",
    icon: "apartment",
    description: "Strength of Materials, Surveying, Structural Analysis, Concrete Technology notes, field work manuals, and papers.",
    aliases: ["ce", "civil", "civil engineering"],
    portalQuery: "CE",
  },
  EEE: {
    code: "EEE",
    name: "Electrical & Electronics Engineering",
    icon: "bolt",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "description",
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
    icon: "science",
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
    icon: "science",
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
    icon: "science",
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
    icon: "science",
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
    icon: "science",
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
    icon: "science",
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
    icon: "science",
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
    icon: "library_books",
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
    icon: "library_books",
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
    icon: "library_books",
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
    icon: "library_books",
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
    icon: "library_books",
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
    icon: "library_books",
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
    icon: "campaign",
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
    icon: "campaign",
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
        icon: isLab ? "science" : "library_books",
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

    const notes = extractArray(notesRes).map((i) => ({ ...i, type: "Notes", icon: "description" }));
    const papers = extractArray(papersRes).map((i) => ({ ...i, type: "Question Paper", icon: "description" }));
    const syllabus = extractArray(syllabusRes).map((i) => ({ ...i, type: "Syllabus", icon: "library_books" }));
    const notifs = extractArray(notifsRes).map((i) => ({ ...i, type: "Notification", icon: "campaign" }));
    const labs = extractArray(labsRes).map((i) => ({ ...i, type: "Lab Program", icon: "science" }));

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

/**
 * Intelligent Query Tokenizer & Intent Extractor
 */
export function analyzeQuery(rawQuery) {
  if (!rawQuery) return { cleanQuery: "", tokens: [], targetType: null, branch: null, semester: null, regulation: null };

  let q = rawQuery.toLowerCase().trim();

  // Replace common punctuation with space
  q = q.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");
  // Compress multiple spaces
  q = q.replace(/\s+/g, " ").trim();

  // Identify resource type intent
  let targetType = null;
  if (/note|material|lecture|pdf|unit|module|textbook/i.test(q)) {
    targetType = "Notes";
  } else if (/paper|pyq|question|mid|sem end|previous/i.test(q)) {
    targetType = "Question Paper";
  } else if (/syllabus|curriculum|credit|regulation|course structure/i.test(q)) {
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
  else if (/\bmech\b|\bme\b|mechanical/i.test(q)) branch = "ME";
  else if (/\bcivil\b|\bce\b/i.test(q)) branch = "CE";

  // Identify semester intent
  let semester = null;
  const semMatch = q.match(/\b([1-4])-([1-2])\b/);
  if (semMatch) {
    semester = `${semMatch[1]}-${semMatch[2]}`;
  } else if (/1st year|first year|1-1|1-2/i.test(q)) {
    semester = "1st Year";
  } else if (/2nd year|second year|2-1|2-2/i.test(q)) {
    semester = "2nd Year";
  } else if (/3rd year|third year|3-1|3-2/i.test(q)) {
    semester = "3rd Year";
  } else if (/4th year|fourth year|4-1|4-2/i.test(q)) {
    semester = "4th Year";
  }

  // Identify regulation
  let regulation = null;
  if (/r23/i.test(q)) regulation = "R23";
  else if (/r20/i.test(q)) regulation = "R20";
  else if (/r19/i.test(q)) regulation = "R19";

  // Expand aliases and acronyms
  const words = q.split(" ").filter(Boolean);
  const expandedTokens = new Set();
  words.forEach((w) => {
    expandedTokens.add(w);
    if (SUBJECT_ALIASES[w]) {
      SUBJECT_ALIASES[w].split(" ").forEach((exp) => expandedTokens.add(exp));
    }
  });

  return {
    cleanQuery: q,
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
  const { cleanQuery, tokens, targetType, branch, semester, regulation } = analysis;
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

  // 1. Exact phrase matches (highest priority)
  if (title.includes(cleanQuery)) score += 120;
  if (subject.includes(cleanQuery)) score += 100;
  if (cleanQuery.length > 2 && subjectCode.includes(cleanQuery)) score += 90;

  // 2. Token Matching
  let matchedTokenCount = 0;
  tokens.forEach((token) => {
    if (token.length < 2) return;

    if (title.includes(token)) {
      score += 25;
      matchedTokenCount++;
    } else if (subject.includes(token)) {
      score += 20;
      matchedTokenCount++;
    } else if (subjectCode.includes(token)) {
      score += 25;
      matchedTokenCount++;
    } else if (searchableText.includes(token)) {
      score += 10;
      matchedTokenCount++;
    }
  });

  // 3. All query words matched bonus
  if (analysis.rawTokens.length > 1 && analysis.rawTokens.every((t) => searchableText.includes(t))) {
    score += 60;
  }

  // 4. Target Type Boost
  if (targetType) {
    if (item.type && item.type.toLowerCase() === targetType.toLowerCase()) {
      score += 35;
    }
  }

  // 5. Branch Match Boost
  if (branch && itemBranch.includes(branch.toLowerCase())) {
    score += 30;
  }

  // 6. Semester Match Boost
  if (semester && (itemSem.includes(semester.toLowerCase()) || (item.year && item.year.toLowerCase().includes(semester.toLowerCase())))) {
    score += 25;
  }

  // 7. Regulation Match Boost
  if (regulation && itemReg.includes(regulation.toLowerCase())) {
    score += 20;
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
    `bar_chart ${code} CGPA Calculator`,
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
