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

// Canonical Stitch verified student avatar (Chinnu)
export const DEFAULT_STUDENT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCh_iva9jSPl2iJE9piEPkD6YvBd1alVmSmd2txJmVJ7yoJ1rUW5snm5XgftETiPm_z30siDrBEWaKjZ4pjsp3jGKfADJvokenmu3nU4y6eRpiyaxYebDy9CcFf55JDQbzjmgAnlXU9hJ9Lcip89XFkvYkXTn-OSsOd3Ti5p04ubIqf605k3vfPL85LRZhvLns80AuBaGzk9bLpD_1xziJyUc_wXagz4D5tryCRCRE";

export const PROFILE_STORAGE_VERSION = "v3_chinnu";

// Helper to remove any lingering "(Autonomous)" from college names
export function cleanCollege(col) {
  if (!col || typeof col !== "string") return "JNTU College of Engineering";
  const cleaned = normalizeString(col).replace(/\s*\(Autonomous\)/gi, "").trim();
  return cleaned || "JNTU College of Engineering";
}

// Helper to remove any lingering "(3-2)", "(X-Y)", or year notation from semester names
export function cleanSemester(sem) {
  if (!sem || typeof sem !== "string") return "6th Semester";
  let str = sem.replace(/\b[1-4](?:st|nd|rd|th)?\s*year\b/gi, "").replace(/[|•–—()]/g, " ").trim();
  const validated = validateSemester(str);
  if (validated.ok) return validated.value;
  const direct = validateSemester(sem);
  if (direct.ok) return direct.value;
  return sem.replace(/\s*\([1-4]-[1-2]\)/gi, "").replace(/\b[1-4]-[1-2]\b/gi, "").trim() || "6th Semester";
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
  profilePhoto: DEFAULT_STUDENT_AVATAR,
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

// Helper to resolve the correct photo URL for a student object
export function getStudentAvatar(student) {
  if (!student || !student.isConfigured || !student.name?.trim()) return null;
  if (student.profilePhoto && student.profilePhoto !== "none" && typeof student.profilePhoto === "string" && student.profilePhoto.trim()) {
    return student.profilePhoto;
  }
  if (student.profilePhoto === "none") {
    return null;
  }
  return DEFAULT_STUDENT_AVATAR;
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
    if (!raw) return true;
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
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isConfigured === false) {
        return { ...EMPTY_STUDENT_DATA, isConfigured: false, name: "" };
      }

      // Validate core fields defensively so corrupt or stale data is safely healed
      const validName = validateName(parsed.name).ok ? parsed.name.trim() : DEFAULT_CHINNU_DATA.name;
      const validHallTicket = validateHallTicket(parsed.hallTicket).ok
        ? parsed.hallTicket.trim().toUpperCase()
        : DEFAULT_CHINNU_DATA.hallTicket;
      const branchRes = validateBranch(parsed.branch);
      const validBranch = branchRes.ok ? branchRes.value : DEFAULT_CHINNU_DATA.branch;
      const validBranchCode = branchRes.ok ? branchRes.code : (parsed.branchCode || DEFAULT_CHINNU_DATA.branchCode);
      const yearRes = validateYear(parsed.year);
      const validYear = yearRes.ok ? yearRes.value : DEFAULT_CHINNU_DATA.year;
      const semRes = validateSemester(parsed.semester);
      const validSemester = semRes.ok ? semRes.value : cleanSemester(parsed.semester);
      const regRes = validateRegulation(parsed.regulation);
      const validRegulation = regRes.ok ? regRes.value : DEFAULT_CHINNU_DATA.regulation;

      // Sanitize semester grades matrix
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

      const photo = parsed.profilePhoto && parsed.profilePhoto !== "none"
        ? parsed.profilePhoto
        : (parsed.profilePhoto === "none" ? "none" : DEFAULT_STUDENT_AVATAR);

      const cgpaCheck = validateGradePoint(parsed.cgpa);
      const attCheck = validateAttendance(parsed.attendance || parsed.attendancePercentage);

      const healedProfile = {
        ...DEFAULT_CHINNU_DATA,
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
        college: cleanCollege(parsed.college),
        email: validateEmail(parsed.email).ok ? parsed.email.trim() : "",
        phone: validatePhone(parsed.phone).ok ? validatePhone(parsed.phone).value : "",
        cgpa: cgpaCheck.ok ? cgpaCheck.value : DEFAULT_CHINNU_DATA.cgpa,
        attendance: attCheck.ok ? attCheck.formatted : DEFAULT_CHINNU_DATA.attendance,
        attendancePercentage: attCheck.ok ? attCheck.value : DEFAULT_CHINNU_DATA.attendancePercentage,
        profilePhoto: photo,
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
    }
  } catch (e) {
    console.error("Error logging out student profile:", e);
  }
}

// Alias for convenience
export const logoutStudentProfile = clearStoredStudentData;
