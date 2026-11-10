import {
  validateName,
  validateEmail,
  validatePhone,
  validateGradePoint,
  validateAttendance,
  validateHallTicket,
  validateYear,
  validateSemester,
  validateBranch,
  validateRegulation,
  normalizeString,
} from "../utils/validators.js";

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

export const PROFILE_STORAGE_VERSION = "v3_student";

// Helper to remove any lingering "(Autonomous)" from college names
export function cleanCollege(col) {
  if (!col || typeof col !== "string") return "JNTU College of Engineering";
  const cleaned = normalizeString(col).replace(/\s*\(Autonomous\)/gi, "").trim();
  return cleaned || "JNTU College of Engineering";
}

// Helper to remove any lingering "(3-2)", "(X-Y)", or year notation from semester names
export function cleanSemester(sem) {
  if (!sem || typeof sem !== "string") return "Semester 6";
  let str = sem.replace(/\b[1-4](?:st|nd|rd|th)?\s*year\b/gi, "").replace(/[|•–—()]/g, " ").trim();
  const validated = validateSemester(str);
  if (validated.ok) {
    const semNumMatch = validated.value.match(/(\d+)/);
    if (semNumMatch) {
      return `Semester ${semNumMatch[1]}`;
    }
    return validated.value;
  }
  const direct = validateSemester(sem);
  if (direct.ok) {
    const semNumMatch = direct.value.match(/(\d+)/);
    if (semNumMatch) {
      return `Semester ${semNumMatch[1]}`;
    }
    return direct.value;
  }
  const rawNumMatch = sem.match(/(\d+)/);
  if (rawNumMatch && Number(rawNumMatch[1]) >= 1 && Number(rawNumMatch[1]) <= 8) {
    return `Semester ${rawNumMatch[1]}`;
  }
  return sem.replace(/\s*\([1-4]-[1-2]\)/gi, "").replace(/\b[1-4]-[1-2]\b/gi, "").trim() || "Semester 6";
}

// Verified student profile default
export const DEFAULT_CHINNU_DATA = {
  _version: PROFILE_STORAGE_VERSION,
  name: "Jaswanth",
  shortName: "Jaswanth",
  role: "Student",
  hallTicket: "21B91A0201",
  college: "JNTU College of Engineering",
  university: "JNT University",
  branch: "Computer Science & Engineering",
  branchCode: "CSE",
  year: "3rd Year",
  semester: "6th Semester",
  regulation: "R23 Regulation",
  cgpa: "8.88",
  credits: "100 / 160",
  attendance: "82%",
  attendancePercentage: 82,
  email: "jaswanth@gmail.com",
  phone: "+91 98765 43210",
  batch: "2021–25",
  mentor: "Head of Dept (CSE)",
  profilePhoto: null, // Clean SVG fallback by default; user uploads their own photo
  isConfigured: true,
  savedNotes: [
    { id: 1, branch: "CSE", sem: "Sem 6", title: "Software Engineering & Architecture", units: "Unit 1 - 5 Full Notes", faculty: "Prof. K. S. Rao" },
    { id: 2, branch: "CSE", sem: "Sem 6", title: "Cloud Computing & Distributed Systems", units: "Unit 1 - 4 Lecture Notes", faculty: "Dr. M. V. Sharma" },
    { id: 3, branch: "CSE", sem: "Sem 5", title: "Database Management Systems", units: "Complete Formula Sheet", faculty: "Dr. A. Lakshmi" },
  ],
  semesterGrades: INITIAL_SEMESTERS,
};

export const SAMPLE_STUDENT_PROFILE = DEFAULT_CHINNU_DATA;
export const DEFAULT_STUDENT_DATA = DEFAULT_CHINNU_DATA;

export const EMPTY_STUDENT_DATA = {
  ...DEFAULT_CHINNU_DATA,
  name: "",
  shortName: "",
  hallTicket: "",
  college: "",
  branch: "",
  branchCode: "",
  year: "",
  semester: "",
  regulation: "R23 Regulation",
  cgpa: "",
  credits: "0 / 160",
  attendance: "0%",
  attendancePercentage: 0,
  email: "",
  phone: "",
  profilePhoto: null,
  isConfigured: false,
  savedNotes: [],
  semesterGrades: INITIAL_SEMESTERS.map((s) => ({ ...s, sgpa: "" })),
};

// Helper to safely resolve the avatar URL for a student object or photo string.
// Returns null if unset, "none", or default bundled asset so that clean SVG fallback is rendered.
export function getStudentAvatar(student) {
  if (!student) return null;
  const photo = typeof student === "string" ? student : student?.profilePhoto;
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

export function getStudentAvatarUrl(photo) {
  return getStudentAvatar(photo);
}

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

// Check if a profile is already configured in this browser
export function hasStoredStudentProfile() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("jntu_student_logged_out") === "true") {
      return false;
    }
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("jntu_student_profile") : null;
    if (!raw) return true;
    if (raw === "logged_out") return false;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.isConfigured === false) return false;
    return Boolean(parsed && parsed.name?.trim());
  } catch (e) {
    return false;
  }
}

// Retrieve stored student data with automatic schema synchronization and sanitization
export function getStoredStudentData() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("jntu_student_logged_out") === "true") {
      return { ...EMPTY_STUDENT_DATA, isConfigured: false, name: "" };
    }
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("jntu_student_profile") : null;
    if (raw) {
      if (raw === "logged_out") {
        return { ...EMPTY_STUDENT_DATA, isConfigured: false };
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isConfigured === false) {
        return { ...EMPTY_STUDENT_DATA, isConfigured: false, name: "" };
      }

      // Validate core fields defensively
      const nameCheck = validateName(parsed.name);
      const validName = nameCheck.ok ? nameCheck.value : DEFAULT_CHINNU_DATA.name;

      const htCheck = validateHallTicket(parsed.hallTicket);
      const validHallTicket = htCheck.ok ? htCheck.value : DEFAULT_CHINNU_DATA.hallTicket;

      const branchCheck = validateBranch(parsed.branch || parsed.branchCode);
      const validBranch = branchCheck.ok ? branchCheck.value : DEFAULT_CHINNU_DATA.branch;
      const validBranchCode = branchCheck.ok ? branchCheck.code : DEFAULT_CHINNU_DATA.branchCode;

      const yearCheck = validateYear(parsed.year);
      const validYear = yearCheck.ok ? yearCheck.value : DEFAULT_CHINNU_DATA.year;

      const semCheck = validateSemester(parsed.semester);
      const validSemester = semCheck.ok ? semCheck.value : cleanSemester(parsed.semester);

      const regCheck = validateRegulation(parsed.regulation);
      const validRegulation = regCheck.ok ? regCheck.value : DEFAULT_CHINNU_DATA.regulation;

      const cgpaCheck = validateGradePoint(parsed.cgpa);
      const attCheck = validateAttendance(parsed.attendance || parsed.attendancePercentage);

      // Sanitize profile photo
      const normalizedPhoto =
        parsed.profilePhoto === "none"
          ? "none"
          : getStudentAvatarUrl(parsed.profilePhoto);

      // Merge grades
      const mergedGrades = INITIAL_SEMESTERS.map((initSem, idx) => {
        const found = parsed.semesterGrades?.[idx];
        if (!found) return initSem;
        const gradeCheck = validateGradePoint(found.sgpa);
        return {
          ...initSem,
          ...found,
          sgpa: gradeCheck.ok ? gradeCheck.value : "",
          status: gradeCheck.ok ? "Completed" : found.status || initSem.status,
        };
      });

      const healedProfile = {
        ...DEFAULT_CHINNU_DATA,
        ...parsed,
        _version: PROFILE_STORAGE_VERSION,
        name: validName,
        shortName: validName.split(" ")[0] || DEFAULT_CHINNU_DATA.name,
        hallTicket: validHallTicket,
        branch: validBranch,
        branchCode: validBranchCode,
        year: validYear,
        semester: validSemester,
        regulation: validRegulation,
        college: cleanCollege(parsed.college),
        email: validateEmail(parsed.email).ok ? parsed.email.trim() : "",
        phone: validatePhone(parsed.phone).ok ? validatePhone(parsed.phone).value : "",
        cgpa: cgpaCheck.ok ? cgpaCheck.value : DEFAULT_CHINNU_DATA.cgpa,
        attendance: attCheck.ok ? attCheck.formatted : DEFAULT_CHINNU_DATA.attendance,
        attendancePercentage: attCheck.ok ? attCheck.value : DEFAULT_CHINNU_DATA.attendancePercentage,
        profilePhoto: normalizedPhoto,
        semesterGrades: mergedGrades,
        isConfigured: true,
      };

      return healedProfile;
    }
  } catch (e) {
    console.error("Error reading student profile from localStorage:", e);
  }
  return { ...DEFAULT_CHINNU_DATA, isConfigured: true };
}

// Persist student profile data to local storage and broadcast to all listeners
export function saveStoredStudentData(data) {
  try {
    const current = getStoredStudentData();
    const incoming = { ...current, ...data };

    // Validate fields as the last line of defense
    const nameCheck = validateName(incoming.name);
    const validName = nameCheck.ok ? nameCheck.value : current.name;

    const htCheck = validateHallTicket(incoming.hallTicket);
    const validHallTicket = htCheck.ok ? htCheck.value : current.hallTicket;

    const branchCheck = validateBranch(incoming.branch || incoming.branchCode);
    const validBranch = branchCheck.ok ? branchCheck.value : current.branch;
    const validBranchCode = branchCheck.ok ? branchCheck.code : (incoming.branchCode || current.branchCode);

    const yearCheck = validateYear(incoming.year);
    const validYear = yearCheck.ok ? yearCheck.value : current.year;

    const semCheck = validateSemester(incoming.semester);
    const validSemester = semCheck.ok ? semCheck.value : cleanSemester(incoming.semester);

    const regCheck = validateRegulation(incoming.regulation);
    const validRegulation = regCheck.ok ? regCheck.value : current.regulation;

    const emailCheck = validateEmail(incoming.email);
    const validEmail = emailCheck.ok ? emailCheck.value : (incoming.email ? current.email : "");

    const phoneCheck = validatePhone(incoming.phone);
    const validPhone = phoneCheck.ok ? phoneCheck.value : (incoming.phone ? current.phone : "");

    const attCheck = validateAttendance(incoming.attendance || incoming.attendancePercentage);
    const validAttendance = attCheck.ok ? attCheck.formatted : current.attendance;
    const validAttPct = attCheck.ok ? attCheck.value : current.attendancePercentage;

    const normalizedPhoto =
      incoming.profilePhoto === "none"
        ? "none"
        : getStudentAvatarUrl(incoming.profilePhoto);

    // Validate and sanitize semester grades
    let validGrades = current.semesterGrades;
    if (Array.isArray(incoming.semesterGrades) && incoming.semesterGrades.length > 0) {
      validGrades = INITIAL_SEMESTERS.map((initSem, idx) => {
        const found = incoming.semesterGrades[idx];
        if (!found) return initSem;
        const gCheck = validateGradePoint(found.sgpa);
        return {
          ...initSem,
          ...found,
          sgpa: gCheck.ok ? gCheck.value : "",
          status: gCheck.ok ? "Completed" : found.status || initSem.status,
        };
      });
    }

    const calculatedCgpa = calculateCgpaFromGrades(validGrades);
    const cgpaCheck = validateGradePoint(incoming.cgpa);
    const validCgpa = calculatedCgpa || (cgpaCheck.ok ? cgpaCheck.value : current.cgpa);

    const updated = {
      ...DEFAULT_CHINNU_DATA,
      ...incoming,
      _version: PROFILE_STORAGE_VERSION,
      name: validName,
      shortName: validName.split(" ")[0] || "Student",
      hallTicket: validHallTicket,
      branch: validBranch,
      branchCode: validBranchCode,
      year: validYear,
      semester: validSemester,
      regulation: validRegulation,
      college: cleanCollege(incoming.college || DEFAULT_CHINNU_DATA.college),
      email: validEmail,
      phone: validPhone,
      attendance: validAttendance,
      attendancePercentage: validAttPct,
      cgpa: validCgpa,
      profilePhoto: normalizedPhoto,
      semesterGrades: validGrades,
      isConfigured: true,
    };

    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("jntu_student_logged_out");
      localStorage.setItem("jntu_student_profile", JSON.stringify(updated));
    }
    if (typeof window !== "undefined") {
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new CustomEvent("studentProfileUpdated", { detail: updated }));
        window.dispatchEvent(new Event("studentProfileUpdated"));
      }
    }
    return updated;
  } catch (e) {
    console.error("Error saving student profile to localStorage:", e);
    return data;
  }
}

// Clear / Logout student profile from this device
export function clearStoredStudentData() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("jntu_student_logged_out", "true");
      localStorage.removeItem("jntu_student_profile");
    }
    const emptyProfile = { ...EMPTY_STUDENT_DATA, isConfigured: false, name: "" };
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("studentProfileUpdated", { detail: emptyProfile }));
      window.dispatchEvent(new Event("studentProfileUpdated"));
    }
  } catch (e) {
    console.error("Error logging out student profile:", e);
  }
}

// Restore default profile
export function restoreDefaultStudentData() {
  return saveStoredStudentData(DEFAULT_CHINNU_DATA);
}

// Alias for convenience
export const logoutStudentProfile = clearStoredStudentData;
