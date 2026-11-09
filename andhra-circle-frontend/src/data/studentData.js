// Initial 8-Semester Grade Matrix
export const INITIAL_SEMESTERS = [
  { sem: "Sem 1", sgpa: "8.65", credits: 20, status: "Completed" },
  { sem: "Sem 2", sgpa: "8.90", credits: 20, status: "Completed" },
  { sem: "Sem 3", sgpa: "8.75", credits: 20, status: "Completed" },
  { sem: "Sem 4", sgpa: "9.10", credits: 20, status: "Completed" },
  { sem: "Sem 5", sgpa: "9.00", credits: 20, status: "Completed" },
  { sem: "Sem 6", sgpa: "", credits: 20, status: "In Progress" },
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

// Stitch verified student profile default (Executive Edition)
export const DEFAULT_CHINNU_DATA = {
  name: "Chinnu",
  shortName: "Chinnu",
  role: "Student",
  hallTicket: "STGHJTY",
  college: "JNTU College of Engineering",
  university: "JNT University",
  branch: "Electrical & Electronics Engineering (EEE)",
  branchCode: "EEE",
  year: "3rd Year",
  semester: "6th Semester",
  regulation: "R16 Regulation",
  cgpa: "8.88",
  credits: "100 / 160",
  attendance: "75%",
  attendancePercentage: 75,
  email: "chinnu@gmail.com",
  phone: "+91 98765 43210",
  batch: "2021–25",
  mentor: "Dr. K. Ramesh (HOD - EEE)",
  profilePhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh_iva9jSPl2iJE9piEPkD6YvBd1alVmSmd2txJmVJ7yoJ1rUW5snm5XgftETiPm_z30siDrBEWaKjZ4pjsp3jGKfADJvokenmu3nU4y6eRpiyaxYebDy9CcFf55JDQbzjmgAnlXU9hJ9Lcip89XFkvYkXTn-OSsOd3Ti5p04ubIqf605k3vfPL85LRZhvLns80AuBaGzk9bLpD_1xziJyUc_wXagz4D5tryCRCRE",
  isConfigured: true,
  savedNotes: [
    { id: 1, branch: "EEE", sem: "Sem 6", title: "Power Systems Operation & Control", units: "Unit 1 - 5 Full Notes", faculty: "Dr. K. Ramesh" },
    { id: 2, branch: "EEE", sem: "Sem 6", title: "Microprocessors & Microcontrollers", units: "Unit 1 - 4 Lecture Notes", faculty: "Prof. S. Rao" },
    { id: 3, branch: "EEE", sem: "Sem 5", title: "Power Electronics", units: "Complete Formula Sheet", faculty: "Dr. M. Lakshmi" },
    { id: 4, branch: "EEE", sem: "Sem 5", title: "Control Systems Engineering", units: "Previous Question Papers", faculty: "Prof. V. Sharma" },
  ],
  semesterGrades: INITIAL_SEMESTERS,
};

export const DEFAULT_STUDENT_DATA = DEFAULT_CHINNU_DATA;

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
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.isConfigured && parsed.name?.trim());
  } catch (e) {
    return true;
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
        ...DEFAULT_CHINNU_DATA,
        ...parsed,
        semesterGrades: mergedGrades,
        isConfigured: true,
      };
    }
  } catch (e) {
    console.error("Error reading student profile from localStorage:", e);
  }
  return { ...DEFAULT_CHINNU_DATA, isConfigured: true };
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
