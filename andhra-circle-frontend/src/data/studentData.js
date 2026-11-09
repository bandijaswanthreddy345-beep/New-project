// Initial 8-Semester Grade Matrix
export const INITIAL_SEMESTERS = [
  { sem: "1-1", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "1-2", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "2-1", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "2-2", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "3-1", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "3-2", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "4-1", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "4-2", sgpa: "", credits: 20, status: "Not Started" },
];

export const EMPTY_STUDENT_DATA = {
  name: "",
  shortName: "",
  role: "Student",
  hallTicket: "", // USN / Roll No
  college: "",
  university: "JNTU (Autonomous & Affiliated Colleges)",
  branch: "",
  branchCode: "",
  year: "1st Year",
  semester: "1-1",
  regulation: "R23 Regulation",
  cgpa: "",
  credits: "0 / 160",
  attendance: "75%",
  attendancePercentage: 75,
  email: "",
  phone: "",
  batch: "2023 - 2027",
  mentor: "",
  profilePhoto: null, // Base64 data URL or image path
  isConfigured: false,
  savedNotes: [],
  semesterGrades: INITIAL_SEMESTERS,
};

// Calculate automatic CGPA from valid semester SGPAs
export function calculateCgpaFromGrades(grades = []) {
  const validScores = grades
    .map((g) => parseFloat(g.sgpa))
    .filter((score) => !isNaN(score) && score > 0 && score <= 10);
  
  if (validScores.length === 0) return "";
  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
  return (sum / validScores.length).toFixed(2);
}

// JNTU official CGPA to Percentage formula: (CGPA - 0.5) * 10
export function calculateEquivalentPercentage(cgpa) {
  const num = parseFloat(cgpa);
  if (isNaN(num) || num <= 0) return "";
  const pct = (num - 0.5) * 10;
  return Math.max(0, Math.min(100, pct)).toFixed(2);
}

// JNTU Academic Class Standing based on CGPA
export function getAcademicClassification(cgpa) {
  const num = parseFloat(cgpa);
  if (isNaN(num) || num <= 0) return "Pending Evaluation";
  if (num >= 7.75) return "First Class with Distinction";
  if (num >= 6.75) return "First Class";
  if (num >= 5.75) return "Second Class";
  if (num >= 5.0) return "Pass Class";
  return "Needs Improvement";
}

// Letter Grade and Standing for Individual Semester SGPA
export function getGradeLetter(sgpa) {
  const num = parseFloat(sgpa);
  if (isNaN(num) || num <= 0) return null;
  if (num >= 9.0) return { grade: "O", label: "Outstanding", color: "#059669" };
  if (num >= 8.0) return { grade: "A+", label: "Excellent", color: "#10b981" };
  if (num >= 7.0) return { grade: "A", label: "Very Good", color: "#2563eb" };
  if (num >= 6.0) return { grade: "B+", label: "Good", color: "#6366f1" };
  if (num >= 5.0) return { grade: "B", label: "Above Average", color: "#d97706" };
  if (num >= 4.0) return { grade: "C", label: "Pass", color: "#64748b" };
  return { grade: "F", label: "Fail / Backlog", color: "#dc2626" };
}

// Safely resolve the student's avatar URL. Returns null if removed, empty, or unset so that the clean SVG fallback is rendered.
export function getStudentAvatarUrl(photo) {
  if (!photo || typeof photo !== "string") return null;
  const trimmed = photo.trim();
  if (
    trimmed === "" ||
    trimmed === "none" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed.includes("jaswanth.png")
  ) {
    return null;
  }
  return trimmed;
}

// Sample Student Profile matching official JNTU prompt values
export const SAMPLE_STUDENT_PROFILE = {
  name: "Jaswanth",
  shortName: "Jaswanth",
  role: "Student",
  hallTicket: "22B91A4201",
  college: "Madanapalle Institute of Technology & Science",
  university: "JNTU (Autonomous & Affiliated Colleges)",
  branch: "Computer Science & Engineering",
  branchCode: "CSE",
  year: "1st Year",
  semester: "1-1",
  regulation: "R23 Regulation",
  cgpa: "8.75",
  credits: "20 / 160",
  attendance: "82%",
  attendancePercentage: 82,
  email: "jaswanth@gmail.com",
  phone: "+91 98765 43210",
  batch: "2023 - 2027",
  mentor: "Head of Dept (CSE)",
  profilePhoto: null, // No photo by default; shows clean SVG fallback
  isConfigured: true,
  savedNotes: [
    {
      id: "cse-101",
      title: "Programming for Problem Solving (C Language)",
      code: "CSE101",
      branch: "CSE",
      sem: "1-1",
      units: "All 5 Units Complete",
      faculty: "Prof. K. S. Rao",
      downloads: "2.4k",
    },
    {
      id: "cse-102",
      title: "Linear Algebra & Calculus",
      code: "BS101",
      branch: "CSE",
      sem: "1-1",
      units: "Formula Sheet + Important Proofs",
      faculty: "Dr. M. V. Sharma",
      downloads: "1.8k",
    },
    {
      id: "cse-103",
      title: "Basic Electrical & Electronics Engineering",
      code: "ES101",
      branch: "CSE",
      sem: "1-1",
      units: "Handwritten Lecture Notes",
      faculty: "Prof. A. Lakshmi",
      downloads: "1.2k",
    },
  ],
  semesterGrades: [
    { sem: "1-1", sgpa: "8.75", credits: 20, status: "Completed" },
    { sem: "1-2", sgpa: "", credits: 20, status: "Not Started" },
    { sem: "2-1", sgpa: "", credits: 20, status: "Not Started" },
    { sem: "2-2", sgpa: "", credits: 20, status: "Not Started" },
    { sem: "3-1", sgpa: "", credits: 20, status: "Not Started" },
    { sem: "3-2", sgpa: "", credits: 20, status: "Not Started" },
    { sem: "4-1", sgpa: "", credits: 20, status: "Not Started" },
    { sem: "4-2", sgpa: "", credits: 20, status: "Not Started" },
  ],
};

// Default profile for the application is Jaswanth's configured professional profile
export const DEFAULT_STUDENT_DATA = SAMPLE_STUDENT_PROFILE;

// Check if a profile is already configured in this browser
export function hasStoredStudentProfile() {
  try {
    const raw = localStorage.getItem("jntu_student_profile");
    if (!raw) return true; // Defaults to configured sample profile
    if (raw === "logged_out") return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.isConfigured !== false && parsed.name?.trim());
  } catch (e) {
    return true;
  }
}

// Retrieve stored student data, or return Jaswanth profile by default
export function getStoredStudentData() {
  try {
    const raw = localStorage.getItem("jntu_student_profile");
    if (raw) {
      if (raw === "logged_out") {
        return { ...EMPTY_STUDENT_DATA, isConfigured: false };
      }
      const parsed = JSON.parse(raw);
      // If profile was empty or legacy test name, return full Jaswanth profile
      if (!parsed.name || parsed.name === "Chinnu") {
        return { ...SAMPLE_STUDENT_PROFILE, isConfigured: true };
      }

      // Ensure all 8 semesters exist
      const mergedGrades = INITIAL_SEMESTERS.map((initSem, idx) => {
        const found = parsed.semesterGrades?.[idx];
        return found ? { ...initSem, ...found } : initSem;
      });

      const normalizedPhoto =
        parsed.profilePhoto === "none"
          ? "none"
          : getStudentAvatarUrl(parsed.profilePhoto)
          ? parsed.profilePhoto
          : null;

      return {
        ...SAMPLE_STUDENT_PROFILE,
        ...parsed,
        profilePhoto: normalizedPhoto,
        semesterGrades: mergedGrades,
        isConfigured: parsed.isConfigured !== false && Boolean(parsed.name?.trim()),
      };
    }
  } catch (e) {
    console.error("Error reading student profile from localStorage:", e);
  }
  // Return neat, professional Jaswanth profile by default
  return { ...SAMPLE_STUDENT_PROFILE, isConfigured: true };
}

// Persist student profile data to local storage
export function saveStoredStudentData(data) {
  try {
    const normalizedPhoto =
      data.profilePhoto === "none"
        ? "none"
        : getStudentAvatarUrl(data.profilePhoto)
        ? data.profilePhoto
        : null;

    const updated = {
      ...data,
      isConfigured: true,
      profilePhoto: normalizedPhoto,
      shortName: data.name ? data.name.trim().split(" ")[0] : "Jaswanth",
    };

    // Auto-update CGPA if semester grades are provided and not manually overridden
    if (Array.isArray(updated.semesterGrades) && updated.semesterGrades.length > 0) {
      const calculated = calculateCgpaFromGrades(updated.semesterGrades);
      if (calculated && (!updated.cgpa || updated.cgpa === "0.00" || updated.cgpa === "")) {
        updated.cgpa = calculated;
      }
    }

    localStorage.setItem("jntu_student_profile", JSON.stringify(updated));
    window.dispatchEvent(new Event("studentProfileUpdated"));
    return updated;
  } catch (e) {
    console.error("Error saving student profile to localStorage:", e);
    return data;
  }
}

// Clear / Logout student profile from this device
export function clearStoredStudentData() {
  try {
    localStorage.setItem("jntu_student_profile", "logged_out");
    window.dispatchEvent(new Event("studentProfileUpdated"));
  } catch (e) {
    console.error("Error logging out student profile:", e);
  }
}

// Restore default Jaswanth profile
export function restoreDefaultStudentData() {
  try {
    localStorage.setItem("jntu_student_profile", JSON.stringify(SAMPLE_STUDENT_PROFILE));
    window.dispatchEvent(new Event("studentProfileUpdated"));
    return SAMPLE_STUDENT_PROFILE;
  } catch (e) {
    console.error("Error restoring default student profile:", e);
    return SAMPLE_STUDENT_PROFILE;
  }
}

// Alias for convenience
export const logoutStudentProfile = clearStoredStudentData;
