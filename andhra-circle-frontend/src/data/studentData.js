// Initial 8-Semester Grade Matrix
export const INITIAL_SEMESTERS = [
  { sem: "Sem 1", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "Sem 2", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "Sem 3", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "Sem 4", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "Sem 5", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "Sem 6", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "Sem 7", sgpa: "", credits: 20, status: "Not Started" },
  { sem: "Sem 8", sgpa: "", credits: 20, status: "Not Started" },
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
  semester: "1st Semester",
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

export const DEFAULT_STUDENT_DATA = EMPTY_STUDENT_DATA;

// Calculate automatic CGPA from valid semester SGPAs
export function calculateCgpaFromGrades(grades = []) {
  const validScores = grades
    .map((g) => parseFloat(g.sgpa))
    .filter((score) => !isNaN(score) && score > 0 && score <= 10);
  
  if (validScores.length === 0) return "";
  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
  return (sum / validScores.length).toFixed(2);
}

// Check if a profile is already configured in this browser
export function hasStoredStudentProfile() {
  try {
    const raw = localStorage.getItem("jntu_student_profile");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.isConfigured && parsed.name?.trim());
  } catch (e) {
    return false;
  }
}

// Retrieve stored student data, or return clean template if not configured
export function getStoredStudentData() {
  try {
    const raw = localStorage.getItem("jntu_student_profile");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all 8 semesters exist
      const mergedGrades = INITIAL_SEMESTERS.map((initSem, idx) => {
        const found = parsed.semesterGrades?.[idx];
        return found ? { ...initSem, ...found } : initSem;
      });

      return {
        ...EMPTY_STUDENT_DATA,
        ...parsed,
        semesterGrades: mergedGrades,
        isConfigured: Boolean(parsed.name?.trim()),
      };
    }
  } catch (e) {
    console.error("Error reading student profile from localStorage:", e);
  }
  return { ...EMPTY_STUDENT_DATA, isConfigured: false };
}

// Persist student profile data to local storage
export function saveStoredStudentData(data) {
  try {
    const updated = {
      ...data,
      isConfigured: true,
      shortName: data.name ? data.name.trim().split(" ")[0] : "Student",
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
    localStorage.removeItem("jntu_student_profile");
    window.dispatchEvent(new Event("studentProfileUpdated"));
  } catch (e) {
    console.error("Error logging out student profile:", e);
  }
}

// Alias for convenience
export const logoutStudentProfile = clearStoredStudentData;

