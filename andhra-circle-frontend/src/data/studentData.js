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
  cgpa: "8.85",
  credits: "132 / 160",
  attendance: "89.4%",
  email: "chinnu@student.jntu.ac.in",
  phone: "+91 98765 43210",
  batch: "2022 - 2026",
  mentor: "Dr. K. S. Rao, Professor (Dept. of AIML)",
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
        localStorage.setItem("jntu_student_profile", JSON.stringify(parsed));
      }
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
