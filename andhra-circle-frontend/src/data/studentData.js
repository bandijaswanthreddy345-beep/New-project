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

// Initial 8-Semester Grade Matrix (Clean Template)
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

// Canonical Stitch verified student avatar (Chinnu)
export const DEFAULT_STUDENT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCh_iva9jSPl2iJE9piEPkD6YvBd1alVmSmd2txJmVJ7yoJ1rUW5snm5XgftETiPm_z30siDrBEWaKjZ4pjsp3jGKfADJvokenmu3nU4y6eRpiyaxYebDy9CcFf55JDQbzjmgAnlXU9hJ9Lcip89XFkvYkXTn-OSsOd3Ti5p04ubIqf605k3vfPL85LRZhvLns80AuBaGzk9bLpD_1xziJyUc_wXagz4D5tryCRCRE";

export const PROFILE_STORAGE_VERSION = "v3_chinnu";

// Helper to clean up branch representation and avoid duplicated codes like (EEE) (EEE)
export function cleanBranch(branch, branchCode = "") {
  if (!branch || typeof branch !== "string") return "";
  let cleaned = branch.trim();
  // Strip duplicate consecutive parentheses like (EEE) (EEE) or (CSE) (CSE)
  cleaned = cleaned.replace(/\s*\(([A-Za-z0-9&+\s]+)\)\s*\(\1\)/gi, " ($1)");
  // If branchCode is provided and already exists in branch as (CODE), avoid double appending
  if (branchCode && cleaned.includes(`(${branchCode})`)) {
    return cleaned;
  }
  return cleaned;
}

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

// Stitch verified student profile default (Executive Edition)
export const DEFAULT_CHINNU_DATA = {
  _version: PROFILE_STORAGE_VERSION,
  name: "Chinnu",
  shortName: "Chinnu",
  role: "Student",
  hallTicket: "21B91A0201",
  college: "JNTU College of Engineering",
  university: "JNT University",
  branch: "Electrical & Electronics Engineering",
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
  profilePhoto: null,
  isConfigured: true,
  savedNotes: [
    { id: 1, branch: "EEE", sem: "Sem 6", title: "Power Systems Operation & Control", units: "Unit 1 - 5 Full Notes", faculty: "Dr. K. Ramesh" },
    { id: 2, branch: "EEE", sem: "Sem 6", title: "Microprocessors & Microcontrollers", units: "Unit 1 - 4 Lecture Notes", faculty: "Prof. S. Rao" },
    { id: 3, branch: "EEE", sem: "Sem 5", title: "Power Electronics", units: "Complete Formula Sheet", faculty: "Dr. M. Lakshmi" },
    { id: 4, branch: "EEE", sem: "Sem 5", title: "Control Systems Engineering", units: "Previous Question Papers", faculty: "Prof. V. Sharma" },
  ],
  semesterGrades: [
    { sem: "Sem 1", sgpa: "8.65", credits: 20, status: "Completed" },
    { sem: "Sem 2", sgpa: "8.90", credits: 20, status: "Completed" },
    { sem: "Sem 3", sgpa: "8.75", credits: 20, status: "Completed" },
    { sem: "Sem 4", sgpa: "9.10", credits: 20, status: "Completed" },
    { sem: "Sem 5", sgpa: "9.00", credits: 20, status: "Completed" },
    { sem: "Sem 6", sgpa: "", credits: 20, status: "In Progress" },
    { sem: "Sem 7", sgpa: "", credits: 20, status: "Not Started" },
    { sem: "Sem 8", sgpa: "", credits: 20, status: "Not Started" },
  ],
};

export const EMPTY_STUDENT_DATA = {
  _version: PROFILE_STORAGE_VERSION,
  name: "",
  shortName: "",
  role: "Student",
  hallTicket: "",
  college: "",
  university: "JNT University",
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
  batch: "",
  mentor: "",
  profilePhoto: null,
  isConfigured: false,
  savedNotes: [],
  semesterGrades: INITIAL_SEMESTERS.map((s) => ({ ...s, sgpa: "" })),
};

export const DEFAULT_STUDENT_DATA = EMPTY_STUDENT_DATA;

// Helper to resolve the correct photo URL for a student object
export function getStudentAvatar(student) {
  if (!student) return null;
  if (student.profilePhoto && student.profilePhoto !== "none" && typeof student.profilePhoto === "string" && student.profilePhoto.trim()) {
    return student.profilePhoto;
  }
  return null;
}

export function getStudentAvatarUrl(photo) {
  if (!photo || photo === "none" || typeof photo !== "string" || !photo.trim()) return null;
  return photo;
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

// Check if a profile is already configured in this browser
export function hasStoredStudentProfile() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("jntu_student_logged_out") === "true") {
      return false;
    }
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("jntu_student_profile") : null;
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.isConfigured === false) return false;
    return Boolean(parsed && parsed.name?.trim() && parsed.hallTicket?.trim());
  } catch (e) {
    return false;
  }
}

// Retrieve stored student data with automatic schema synchronization and sanitization
export function getStoredStudentData() {
  try {
    let authUser = null;
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem("jntu_student_logged_out") === "true") {
        return { ...EMPTY_STUDENT_DATA, isConfigured: false, name: "", email: "" };
      }
      try {
        const u = localStorage.getItem("user");
        if (u) {
          authUser = JSON.parse(u);
        }
      } catch (e) {
        authUser = null;
      }
    }

    const authName = (authUser && (authUser.name || authUser.fullName)) ? (authUser.name || authUser.fullName).trim() : "";
    const authEmail = (authUser && authUser.email) ? authUser.email.trim() : "";

    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("jntu_student_profile") : null;

    // If no profile in localStorage:
    if (!raw) {
      if (authName || authEmail) {
        return {
          ...EMPTY_STUDENT_DATA,
          name: authName,
          shortName: authName.split(" ")[0] || "Student",
          email: authEmail,
          isConfigured: false,
        };
      }
      return { ...EMPTY_STUDENT_DATA, isConfigured: false };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      if (authName || authEmail) {
        return {
          ...EMPTY_STUDENT_DATA,
          name: authName,
          shortName: authName.split(" ")[0] || "Student",
          email: authEmail,
          isConfigured: false,
        };
      }
      return { ...EMPTY_STUDENT_DATA, isConfigured: false };
    }

    // Check if the stored profile belongs to the mock Chinnu account while the current user is someone else
    const isChinnuMock = (parsed.name === "Chinnu" || parsed.email === "chinnu@gmail.com" || parsed.hallTicket === "21B91A0201");
    if (authUser && (authEmail !== "chinnu@gmail.com" || authName !== "Chinnu") && isChinnuMock) {
      return {
        ...EMPTY_STUDENT_DATA,
        name: authName,
        shortName: authName.split(" ")[0] || "Student",
        email: authEmail,
        isConfigured: false,
      };
    }

    // Determine effective name and email (prefer authUser if signed in)
    const effectiveName = authName || (validateName(parsed.name).ok ? parsed.name.trim() : (parsed.name || ""));
    const effectiveEmail = authEmail || (validateEmail(parsed.email).ok ? parsed.email.trim() : (parsed.email || ""));

    // If profile is explicitly unconfigured (fresh signup state):
    if (parsed.isConfigured === false) {
      return {
        ...EMPTY_STUDENT_DATA,
        ...parsed,
        _version: PROFILE_STORAGE_VERSION,
        name: effectiveName,
        shortName: effectiveName.split(" ")[0] || "Student",
        email: effectiveEmail,
        isConfigured: false,
        hallTicket: parsed.hallTicket && validateHallTicket(parsed.hallTicket).ok ? parsed.hallTicket.trim().toUpperCase() : "",
        branch: parsed.branch && validateBranch(parsed.branch).ok ? validateBranch(parsed.branch).value : (parsed.branch || ""),
        branchCode: parsed.branchCode || "",
        college: cleanCollege(parsed.college || ""),
        cgpa: parsed.cgpa && validateGradePoint(parsed.cgpa).ok ? validateGradePoint(parsed.cgpa).value : "",
        attendance: parsed.attendance && validateAttendance(parsed.attendance).ok ? validateAttendance(parsed.attendance).formatted : "0%",
        attendancePercentage: parsed.attendancePercentage ? Number(parsed.attendancePercentage) : 0,
        savedNotes: Array.isArray(parsed.savedNotes) ? parsed.savedNotes : [],
        semesterGrades: Array.isArray(parsed.semesterGrades) ? parsed.semesterGrades : INITIAL_SEMESTERS.map((s) => ({ ...s, sgpa: "" })),
      };
    }

    // For a configured profile, heal/validate fields WITHOUT falling back to DEFAULT_CHINNU_DATA!
    const validName = validateName(parsed.name).ok ? parsed.name.trim() : effectiveName;
    const validHallTicket = validateHallTicket(parsed.hallTicket).ok
      ? parsed.hallTicket.trim().toUpperCase()
      : (parsed.hallTicket?.trim() || "");
    const branchRes = validateBranch(parsed.branch);
    const validBranch = branchRes.ok ? branchRes.value : (parsed.branch?.trim() || "");
    const validBranchCode = branchRes.ok ? branchRes.code : (parsed.branchCode || "");
    const yearRes = validateYear(parsed.year);
    const validYear = yearRes.ok ? yearRes.value : (parsed.year?.trim() || "");
    const semRes = validateSemester(parsed.semester);
    const validSemester = semRes.ok ? semRes.value : cleanSemester(parsed.semester || "");
    const regRes = validateRegulation(parsed.regulation);
    const validRegulation = regRes.ok ? regRes.value : (parsed.regulation || "R23 Regulation");

    const mergedGrades = INITIAL_SEMESTERS.map((initSem, idx) => {
      const found = parsed.semesterGrades?.[idx];
      if (!found) return { ...initSem, sgpa: "" };
      const gradeCheck = validateGradePoint(found.sgpa);
      return {
        ...initSem,
        ...found,
        sgpa: gradeCheck.ok ? gradeCheck.value : "",
        status: gradeCheck.ok ? "Completed" : found.status || "Not Started",
      };
    });

    const photo = parsed.profilePhoto && parsed.profilePhoto !== "none" && typeof parsed.profilePhoto === "string" && parsed.profilePhoto.trim()
      ? parsed.profilePhoto
      : null;

    const cgpaCheck = validateGradePoint(parsed.cgpa);
    const attCheck = validateAttendance(parsed.attendance || parsed.attendancePercentage);

    const healedProfile = {
      ...EMPTY_STUDENT_DATA,
      ...parsed,
      _version: PROFILE_STORAGE_VERSION,
      name: validName,
      shortName: validName.split(" ")[0] || "Student",
      hallTicket: validHallTicket,
      branch: validBranch,
      branchCode: validBranchCode,
      year: validYear,
      semester: validSemester,
      regulation: validRegulation,
      college: cleanCollege(parsed.college || ""),
      email: effectiveEmail || (validateEmail(parsed.email).ok ? parsed.email.trim() : ""),
      phone: validatePhone(parsed.phone).ok ? validatePhone(parsed.phone).value : (parsed.phone?.trim() || ""),
      cgpa: cgpaCheck.ok ? cgpaCheck.value : (parsed.cgpa || ""),
      attendance: attCheck.ok ? attCheck.formatted : (parsed.attendance || "0%"),
      attendancePercentage: attCheck.ok ? attCheck.value : (parsed.attendancePercentage ? Number(parsed.attendancePercentage) : 0),
      credits: parsed.credits || "0 / 160",
      profilePhoto: photo,
      savedNotes: Array.isArray(parsed.savedNotes) ? parsed.savedNotes : [],
      semesterGrades: mergedGrades,
      isConfigured: Boolean(parsed.isConfigured),
    };

    return healedProfile;
  } catch (e) {
    console.error("Error reading student profile from localStorage:", e);
    return { ...EMPTY_STUDENT_DATA, isConfigured: false };
  }
}

// Persist student profile data to local storage and broadcast to all listeners
export function saveStoredStudentData(data) {
  try {
    const current = getStoredStudentData();
    const incoming = { ...current, ...data };

    // Validate fields as the last line of defense
    const nameCheck = validateName(incoming.name);
    const validName = nameCheck.ok ? nameCheck.value : (incoming.name || current.name || "");

    const htCheck = validateHallTicket(incoming.hallTicket);
    const validHallTicket = htCheck.ok ? htCheck.value : (incoming.hallTicket || current.hallTicket || "");

    const branchCheck = validateBranch(incoming.branch || incoming.branchCode);
    const validBranch = branchCheck.ok ? branchCheck.value : (incoming.branch || current.branch || "");
    const validBranchCode = branchCheck.ok ? branchCheck.code : (incoming.branchCode || current.branchCode || "");

    const yearCheck = validateYear(incoming.year);
    const validYear = yearCheck.ok ? yearCheck.value : (incoming.year || current.year || "");

    const semCheck = validateSemester(incoming.semester);
    const validSemester = semCheck.ok ? semCheck.value : cleanSemester(incoming.semester || current.semester || "");

    const regCheck = validateRegulation(incoming.regulation);
    const validRegulation = regCheck.ok ? regCheck.value : (incoming.regulation || current.regulation || "R23 Regulation");

    const emailCheck = validateEmail(incoming.email);
    const validEmail = emailCheck.ok ? emailCheck.value : (incoming.email || current.email || "");

    const phoneCheck = validatePhone(incoming.phone);
    const validPhone = phoneCheck.ok ? phoneCheck.value : (incoming.phone || current.phone || "");

    const attCheck = validateAttendance(incoming.attendance || incoming.attendancePercentage);
    const validAttendance = attCheck.ok ? attCheck.formatted : (incoming.attendance || current.attendance || "0%");
    const validAttPct = attCheck.ok ? attCheck.value : (incoming.attendancePercentage !== undefined ? Number(incoming.attendancePercentage) : (current.attendancePercentage || 0));

    // Validate and sanitize semester grades
    let validGrades = current.semesterGrades;
    if (Array.isArray(incoming.semesterGrades) && incoming.semesterGrades.length > 0) {
      validGrades = INITIAL_SEMESTERS.map((initSem, idx) => {
        const found = incoming.semesterGrades[idx];
        if (!found) return { ...initSem, sgpa: "" };
        const gCheck = validateGradePoint(found.sgpa);
        return {
          ...initSem,
          ...found,
          sgpa: gCheck.ok ? gCheck.value : "",
          status: gCheck.ok ? "Completed" : found.status || "Not Started",
        };
      });
    }

    const calculatedCgpa = calculateCgpaFromGrades(validGrades);
    const cgpaCheck = validateGradePoint(incoming.cgpa);
    const validCgpa = calculatedCgpa || (cgpaCheck.ok ? cgpaCheck.value : (incoming.cgpa || current.cgpa || ""));

    const updated = {
      ...EMPTY_STUDENT_DATA,
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
      college: cleanCollege(incoming.college || current.college || ""),
      email: validEmail,
      phone: validPhone,
      attendance: validAttendance,
      attendancePercentage: validAttPct,
      cgpa: validCgpa,
      semesterGrades: validGrades,
      isConfigured: true,
    };

    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("jntu_student_logged_out");
      localStorage.setItem("jntu_student_profile", JSON.stringify(updated));
    }
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("studentProfileUpdated", { detail: updated }));
    }
    return updated;
  } catch (e) {
    console.error("Error saving student profile to localStorage:", e);
    return data;
  }
}

// Clear / Logout student profile and auth session from this device
export function clearStoredStudentData() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("jntu_student_logged_out", "true");
      localStorage.removeItem("jntu_student_profile");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    const emptyProfile = { ...EMPTY_STUDENT_DATA, isConfigured: false, name: "" };
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("studentProfileUpdated", { detail: emptyProfile }));
      window.dispatchEvent(new Event("authChanged"));
    }
  } catch (e) {
    console.error("Error logging out student profile:", e);
  }
}

// Alias for convenience
export const logoutStudentProfile = clearStoredStudentData;
