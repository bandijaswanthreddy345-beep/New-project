// Dynamic examination schedules synchronized by engineering branch
export const EXAM_SCHEDULES_BY_BRANCH = {
  AIML: [
    { code: "AI601PC", title: "Deep Learning & Neural Networks", time: "10:00 AM - 01:00 PM", date: "Nov 04, 2026" },
    { code: "AI602PC", title: "Natural Language Processing (NLP)", time: "10:00 AM - 01:00 PM", date: "Nov 07, 2026" },
    { code: "AI603PC", title: "Big Data Analytics & Cloud Storage", time: "10:00 AM - 01:00 PM", date: "Nov 10, 2026" },
  ],
  CSE: [
    { code: "CS701PC", title: "Cloud Computing Architecture", time: "10:00 AM - 01:00 PM", date: "Nov 04, 2026" },
    { code: "CS702PE", title: "Deep Reinforcement Learning", time: "10:00 AM - 01:00 PM", date: "Nov 07, 2026" },
    { code: "CS703PC", title: "Information Security Systems", time: "10:00 AM - 01:00 PM", date: "Nov 10, 2026" },
  ],
  ECE: [
    { code: "EC601PC", title: "VLSI Design & Technology", time: "10:00 AM - 01:00 PM", date: "Nov 04, 2026" },
    { code: "EC602PC", title: "Microcontrollers & Embedded Systems", time: "10:00 AM - 01:00 PM", date: "Nov 07, 2026" },
    { code: "EC603PC", title: "Digital Signal Processing", time: "10:00 AM - 01:00 PM", date: "Nov 10, 2026" },
  ],
  ME: [
    { code: "ME601PC", title: "Heat Transfer & Thermal Systems", time: "10:00 AM - 01:00 PM", date: "Nov 04, 2026" },
    { code: "ME602PC", title: "Design of Machine Elements", time: "10:00 AM - 01:00 PM", date: "Nov 07, 2026" },
    { code: "ME603PC", title: "CAD / CAM & Automation", time: "10:00 AM - 01:00 PM", date: "Nov 10, 2026" },
  ],
  CE: [
    { code: "CE601PC", title: "Design of Reinforced Concrete Structures", time: "10:00 AM - 01:00 PM", date: "Nov 04, 2026" },
    { code: "CE602PC", title: "Geotechnical Engineering", time: "10:00 AM - 01:00 PM", date: "Nov 07, 2026" },
    { code: "CE603PC", title: "Transportation & Highway Engineering", time: "10:00 AM - 01:00 PM", date: "Nov 10, 2026" },
  ],
  EEE: [
    { code: "EE601PC", title: "Power System Operation & Control", time: "10:00 AM - 01:00 PM", date: "Nov 04, 2026" },
    { code: "EE602PC", title: "Power Electronics & Drives", time: "10:00 AM - 01:00 PM", date: "Nov 07, 2026" },
    { code: "EE603PC", title: "Microprocessors & Microcontrollers", time: "10:00 AM - 01:00 PM", date: "Nov 10, 2026" },
  ],
};

export function getBranchExamSchedule(branchCodeOrName) {
  const norm = String(branchCodeOrName || "").toUpperCase();
  if (norm.includes("AIML") || norm.includes("ARTIFICIAL")) return EXAM_SCHEDULES_BY_BRANCH.AIML;
  if (norm.includes("ECE") || norm.includes("ELECTRONIC")) return EXAM_SCHEDULES_BY_BRANCH.ECE;
  if (norm.includes("MECH") || norm.includes("MECHANICAL") || norm === "ME") return EXAM_SCHEDULES_BY_BRANCH.ME;
  if (norm.includes("CIVIL") || norm === "CE") return EXAM_SCHEDULES_BY_BRANCH.CE;
  if (norm.includes("EEE") || norm.includes("ELECTRICAL")) return EXAM_SCHEDULES_BY_BRANCH.EEE;
  return EXAM_SCHEDULES_BY_BRANCH.CSE;
}

export function computeLiveCountdown(firstExamDateStr = "Nov 04, 2026 10:00:00") {
  try {
    const target = new Date(firstExamDateStr).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return "EXAMS COMMENCED";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `STARTS IN ${String(days).padStart(2, "0")}D : ${String(hours).padStart(2, "0")}H`;
  } catch {
    return "STARTS IN 12D : 20H";
  }
}

export const DEFAULT_STUDENT_DATA = {
  name: "Chinnu",
  shortName: "Chinnu",
  role: "Student",
  hallTicket: "22B91A4201",
  college: "JNTU College of Engineering (Autonomous)",
  university: "Jawaharlal Nehru Technological University",
  branch: "Artificial Intelligence & Machine Learning",
  branchCode: "AIML",
  year: "3rd Year",
  semester: "6th Semester",
  regulation: "R20 Regulation",
  cgpa: "9.18",
  sgpa: "9.42",
  credits: "142 / 160",
  attendance: "89.4%",
  backlogs: "0 Backlogs",
  email: "chinnu@student.jntu.ac.in",
  phone: "+91 98765 43210",
  batch: "2022 - 2026",
  examCountdown: computeLiveCountdown("Nov 04, 2026 10:00:00"),
  examSchedule: EXAM_SCHEDULES_BY_BRANCH.AIML,
  savedNotes: [
    {
      id: "aiml-601",
      title: "Deep Learning & Neural Networks",
      code: "AIML601",
      branch: "AIML",
      sem: "6th Sem",
      units: "5 Units Complete",
      faculty: "Prof. K. S. Rao",
      downloads: "1.4k",
    },
    {
      id: "aiml-602",
      title: "Natural Language Processing (NLP)",
      code: "AIML602",
      branch: "AIML",
      sem: "6th Sem",
      units: "4 Units + Labs",
      faculty: "Dr. M. V. Sharma",
      downloads: "980",
    },
    {
      id: "aiml-501",
      title: "Machine Learning Fundamentals",
      code: "AIML501",
      branch: "AIML",
      sem: "5th Sem",
      units: "Complete Handwritten Notes",
      faculty: "Prof. A. Lakshmi",
      downloads: "2.1k",
    },
    {
      id: "aiml-403",
      title: "Big Data Analytics & Cloud Storage",
      code: "AIML403",
      branch: "AIML",
      sem: "4th Sem",
      units: "Exam Question Bank Included",
      faculty: "Dr. P. Suresh",
      downloads: "1.1k",
    },
  ],
  semesterGrades: [
    { sem: "Sem 1", sgpa: "8.60", credits: 21, status: "Distinction" },
    { sem: "Sem 2", sgpa: "8.90", credits: 21, status: "Distinction" },
    { sem: "Sem 3", sgpa: "9.10", credits: 22, status: "Top 3 Rank" },
    { sem: "Sem 4", sgpa: "8.75", credits: 22, status: "Distinction" },
    { sem: "Sem 5", sgpa: "9.05", credits: 23, status: "Top 5 Rank" },
    { sem: "Sem 6", sgpa: "In Progress", credits: 23, status: "Active Sem" },
  ],
};

export function getStoredStudentData() {
  try {
    const raw = localStorage.getItem("jntu_student_profile");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Automatically migrate any previous default names to Chinnu
      if (parsed.name === "Bandi Jaswanth Reddy" || parsed.shortName === "Jaswanth") {
        parsed.name = "Chinnu";
        parsed.shortName = "Chinnu";
        if (parsed.email === "jaswanth.bandi@student.jntu.ac.in") {
          parsed.email = "chinnu@student.jntu.ac.in";
        }
      }

      // Synchronize outdated examSchedule if it contains old hardcoded Dec 04 dates or doesn't match branch
      const isOutdated =
        !parsed.examSchedule ||
        parsed.examSchedule.some((e) => e.date?.includes("Dec 04") || e.date?.includes("2024")) ||
        (parsed.branchCode === "AIML" && parsed.examSchedule.some((e) => e.code?.startsWith("CS701")));

      if (isOutdated) {
        parsed.examSchedule = getBranchExamSchedule(parsed.branchCode || parsed.branch);
        parsed.examCountdown = computeLiveCountdown(parsed.examSchedule[0]?.date || "Nov 04, 2026 10:00:00");
      }

      localStorage.setItem("jntu_student_profile", JSON.stringify(parsed));
      return { ...DEFAULT_STUDENT_DATA, ...parsed };
    }
  } catch (e) {
    console.error("Error reading student profile from localStorage:", e);
  }
  return DEFAULT_STUDENT_DATA;
}

export function saveStoredStudentData(data) {
  try {
    localStorage.setItem("jntu_student_profile", JSON.stringify(data));
    window.dispatchEvent(new Event("studentProfileUpdated"));
  } catch (e) {
    console.error("Error saving student profile to localStorage:", e);
  }
}
