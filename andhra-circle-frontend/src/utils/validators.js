/**
 * validators.js
 * Comprehensive pure-function input validators for JNTU Circle
 * Enforces strict validation for Student Profile, Calculators, and Chatbot Wizard.
 * 
 * All validators return { ok: boolean, value: any, message: string }.
 * User values are normalized (control characters stripped, whitespace collapsed, trimmed).
 * No external dependencies.
 */

// Strip ASCII/Unicode control characters (0x00-0x1F, 0x7F-0x9F)
export function stripControlCharacters(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
}

// Normalize plain text input: strip control chars, collapse spaces, trim
export function normalizeString(val) {
  if (val === null || val === undefined) return "";
  const cleaned = stripControlCharacters(String(val));
  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Validates a student name.
 * Rule: 2–60 characters, letters, spaces, dots and hyphens only.
 */
export function validateName(name) {
  const normalized = normalizeString(name);
  if (!normalized) {
    return { ok: false, value: "", message: "Name is required (2–60 characters)." };
  }
  if (normalized.length < 2 || normalized.length > 60) {
    return {
      ok: false,
      value: normalized,
      message: "Name must be between 2 and 60 characters.",
    };
  }
  // Letters (any case), spaces, dots, hyphens only
  const nameRegex = /^[A-Za-z\s.\-]+$/;
  if (!nameRegex.test(normalized)) {
    return {
      ok: false,
      value: normalized,
      message: "Name can only contain letters, spaces, dots, and hyphens.",
    };
  }
  return { ok: true, value: normalized, message: "" };
}

/**
 * Validates an email address.
 * Rule: standard format check, at most 100 characters.
 */
export function validateEmail(email, { required = false } = {}) {
  const normalized = normalizeString(email).toLowerCase();
  if (!normalized) {
    if (required) {
      return { ok: false, value: "", message: "Email address is required." };
    }
    return { ok: true, value: "", message: "" };
  }
  if (normalized.length > 100) {
    return { ok: false, value: normalized, message: "Email must not exceed 100 characters." };
  }
  // Standard RFC 5322 compatible email pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    return { ok: false, value: normalized, message: "Please enter a valid email address." };
  }
  return { ok: true, value: normalized, message: "" };
}

/**
 * Validates an Indian mobile phone number.
 * Rule: Indian mobile. Accept +91, a space or a dash, then exactly 10 digits starting with 6–9.
 */
export function validatePhone(phone, { required = false } = {}) {
  const normalized = normalizeString(phone);
  if (!normalized) {
    if (required) {
      return { ok: false, value: "", message: "Phone number is required." };
    }
    return { ok: true, value: "", message: "" };
  }

  // Reject invalid characters upfront (only digits, +, spaces, hyphens allowed)
  if (!/^[+\d\s\-]+$/.test(normalized)) {
    return { ok: false, value: normalized, message: "Phone number contains invalid characters." };
  }

  // Remove valid non-digit formatting characters
  let digits = normalized.replace(/[\s\-]/g, "");

  // Handle prefix
  if (digits.startsWith("+91")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  } else if (digits.startsWith("+")) {
    return { ok: false, value: normalized, message: "Please enter a valid Indian mobile (+91)." };
  }

  // Must be exactly 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      ok: false,
      value: normalized,
      message: "Phone number must be a 10-digit Indian mobile starting with 6–9.",
    };
  }

  // Formatted canonical phone
  const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return { ok: true, value: formatted, rawDigits: digits, message: "" };
}

/**
 * Validates SGPA or CGPA.
 * Rule: a number from 0 to 10, at most 2 decimals. Reject text, empty strings and negatives.
 */
export function validateGradePoint(val, label = "Grade point") {
  const normalized = normalizeString(val);
  if (!normalized) {
    return { ok: false, value: "", message: `${label} is required (0.00 – 10.00).` };
  }

  // Strict regex: exactly 0 to 10 with at most 2 decimal places
  // Matches: 0, 0.0, 0.00, 7, 8.5, 8.88, 10, 10.0, 10.00
  // Rejects: -1, 10.001, 10.1, 11, abc, 9.9.9
  const gradeRegex = /^(?:10(?:\.0{1,2})?|[0-9](?:\.\d{1,2})?)$/;
  if (!gradeRegex.test(normalized)) {
    return {
      ok: false,
      value: normalized,
      message: `${label} must be a number between 0.00 and 10.00 (up to 2 decimals).`,
    };
  }

  const num = parseFloat(normalized);
  if (isNaN(num) || num < 0 || num > 10) {
    return {
      ok: false,
      value: normalized,
      message: `${label} must be between 0.00 and 10.00.`,
    };
  }

  return { ok: true, value: num.toFixed(2), numeric: num, message: "" };
}

// Aliases for grade point validation
export const validateSgpa = (val) => validateGradePoint(val, "SGPA");
export const validateCgpa = (val) => validateGradePoint(val, "CGPA");

/**
 * Validates attendance percentage.
 * Rule: a number from 0 to 100.
 */
export function validateAttendance(val) {
  const normalized = normalizeString(val).replace(/%/g, "").trim();
  if (!normalized) {
    return { ok: false, value: "", message: "Attendance percentage is required (0–100%)." };
  }

  // Number from 0 to 100, up to 2 decimal places
  const attRegex = /^(?:100(?:\.0{1,2})?|[0-9]{1,2}(?:\.\d{1,2})?)$/;
  if (!attRegex.test(normalized)) {
    return {
      ok: false,
      value: normalized,
      message: "Attendance must be a valid percentage between 0 and 100.",
    };
  }

  const num = parseFloat(normalized);
  if (isNaN(num) || num < 0 || num > 100) {
    return {
      ok: false,
      value: normalized,
      message: "Attendance must be between 0 and 100.",
    };
  }

  return {
    ok: true,
    value: num,
    formatted: `${num}%`,
    message: "",
  };
}

/**
 * Validates course or degree credits.
 * Rule: a whole number from 0 up to the allowed total.
 */
export function validateCredits(val, maxCredits = 160) {
  const normalized = normalizeString(val);
  if (!normalized) {
    return { ok: false, value: "", message: `Credits are required (0–${maxCredits}).` };
  }

  // Whole number only (digits only, no decimal point)
  if (!/^\d+$/.test(normalized)) {
    return {
      ok: false,
      value: normalized,
      message: `Credits must be a whole number between 0 and ${maxCredits}.`,
    };
  }

  const num = parseInt(normalized, 10);
  if (isNaN(num) || num < 0 || num > maxCredits) {
    return {
      ok: false,
      value: normalized,
      message: `Credits must be between 0 and ${maxCredits}.`,
    };
  }

  return { ok: true, value: num, message: "" };
}

/**
 * Validates subject credits for calculator rows (e.g. 0.5 to 16 credits).
 */
export function validateSubjectCredits(val, min = 0.5, max = 16) {
  const normalized = normalizeString(val);
  if (!normalized) {
    return { ok: false, value: "", message: `Subject credits required (${min}–${max}).` };
  }

  const num = parseFloat(normalized);
  if (isNaN(num) || num < min || num > max) {
    return {
      ok: false,
      value: normalized,
      message: `Credits must be between ${min} and ${max}.`,
    };
  }

  return { ok: true, value: num, message: "" };
}

/**
 * Validates subject marks for SGPA calculator.
 * Rule: number from 0 to 100.
 */
export function validateSubjectMarks(val) {
  const normalized = normalizeString(val);
  if (normalized === "" || normalized === null || normalized === undefined) {
    return { ok: false, value: "", message: "Marks are required (0–100)." };
  }

  const num = parseFloat(normalized);
  if (isNaN(num) || num < 0 || num > 100) {
    return {
      ok: false,
      value: normalized,
      message: "Marks must be a number between 0 and 100.",
    };
  }

  return { ok: true, value: num, message: "" };
}

/**
 * Validates a Hall Ticket / Roll Number / USN.
 * Rule: letters and digits only, 6–15 characters, uppercased.
 * (Does NOT enforce a specific JNTUA pattern because formats vary across colleges/schemes).
 */
export function validateHallTicket(val) {
  const normalized = normalizeString(val).toUpperCase();
  if (!normalized) {
    return { ok: false, value: "", message: "Hall Ticket / USN is required." };
  }

  if (normalized.length < 6 || normalized.length > 15) {
    return {
      ok: false,
      value: normalized,
      message: "Hall Ticket must be between 6 and 15 alphanumeric characters.",
    };
  }

  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return {
      ok: false,
      value: normalized,
      message: "Hall Ticket can only contain letters and numbers (no symbols or spaces).",
    };
  }

  return { ok: true, value: normalized, message: "" };
}

// Canonical app years
export const VALID_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

/**
 * Validates the academic year.
 * Rule: must be one of the app's existing options ("1st Year", "2nd Year", "3rd Year", "4th Year").
 */
export function validateYear(year) {
  const normalized = normalizeString(year);
  if (!normalized) {
    return { ok: false, value: "", message: "Academic year is required." };
  }

  // Direct match
  const exact = VALID_YEARS.find((y) => y.toLowerCase() === normalized.toLowerCase());
  if (exact) {
    return { ok: true, value: exact, message: "" };
  }

  // Flexible match (e.g. "1", "1st", "Year 1", "3")
  const numMatch = normalized.match(/^[1-4](?:st|nd|rd|th)?(?:\s*year)?$/i);
  if (numMatch) {
    const digit = normalized[0];
    const map = { "1": "1st Year", "2": "2nd Year", "3": "3rd Year", "4": "4th Year" };
    return { ok: true, value: map[digit], message: "" };
  }

  return {
    ok: false,
    value: normalized,
    message: "Year must be 1st Year, 2nd Year, 3rd Year, or 4th Year.",
  };
}

// Canonical app semesters
export const VALID_SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
];

// Map of semester codes (e.g. "3-2") to canonical Semester and Year
export const SEMESTER_CODE_MAP = {
  "1-1": { semester: "1st Semester", year: "1st Year", semCode: "1-1", semNum: 1 },
  "1-2": { semester: "2nd Semester", year: "1st Year", semCode: "1-2", semNum: 2 },
  "2-1": { semester: "3rd Semester", year: "2nd Year", semCode: "2-1", semNum: 3 },
  "2-2": { semester: "4th Semester", year: "2nd Year", semCode: "2-2", semNum: 4 },
  "3-1": { semester: "5th Semester", year: "3rd Year", semCode: "3-1", semNum: 5 },
  "3-2": { semester: "6th Semester", year: "3rd Year", semCode: "3-2", semNum: 6 },
  "4-1": { semester: "7th Semester", year: "4th Year", semCode: "4-1", semNum: 7 },
  "4-2": { semester: "8th Semester", year: "4th Year", semCode: "4-2", semNum: 8 },
};

/**
 * Validates the academic semester.
 * Rule: must be one of the app's existing options or standard JNTU code (1-1 to 4-2).
 */
export function validateSemester(semester) {
  const normalized = normalizeString(semester);
  if (!normalized) {
    return { ok: false, value: "", message: "Semester is required." };
  }

  // Check code notation like "3-2", "3.2", "3 - 2"
  const codeMatch = normalized.match(/\b([1-4])\s*[-.]\s*([1-2])\b/);
  if (codeMatch) {
    const code = `${codeMatch[1]}-${codeMatch[2]}`;
    const info = SEMESTER_CODE_MAP[code];
    if (info) {
      return { ok: true, value: info.semester, year: info.year, semCode: info.semCode, message: "" };
    }
  }

  // Check ordinal match (e.g. "6th Semester", "6th Sem", "Sem 6", "6")
  const exact = VALID_SEMESTERS.find((s) => s.toLowerCase() === normalized.toLowerCase());
  if (exact) {
    const idx = VALID_SEMESTERS.indexOf(exact) + 1;
    const yr = Math.ceil(idx / 2);
    const sm = ((idx - 1) % 2) + 1;
    const yearLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    return { ok: true, value: exact, year: yearLabels[yr - 1], semCode: `${yr}-${sm}`, message: "" };
  }

  const semNumMatch = normalized.match(/^(?:sem(?:ester)?\s*)?([1-8])(?:st|nd|rd|th)?(?:\s*sem(?:ester)?)?$/i);
  if (semNumMatch) {
    const semNum = parseInt(semNumMatch[1], 10);
    const semName = VALID_SEMESTERS[semNum - 1];
    const yr = Math.ceil(semNum / 2);
    const sm = ((semNum - 1) % 2) + 1;
    const yearLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    return { ok: true, value: semName, year: yearLabels[yr - 1], semCode: `${yr}-${sm}`, message: "" };
  }

  return {
    ok: false,
    value: normalized,
    message: "Semester must be one of the 8 semesters (e.g. 1st Semester, 3-2, or Sem 6).",
  };
}

// Canonical Branch list aligned with BRANCH_DIRECTORY in searchEngine.js
export const CANONICAL_BRANCHES = [
  {
    code: "CSE",
    name: "Computer Science & Engineering",
    aliases: ["cse", "computer science", "computer science engineering", "computer science & engineering", "cs", "it", "information technology"],
  },
  {
    code: "AIML",
    name: "Artificial Intelligence & Machine Learning",
    aliases: ["aiml", "ai", "ml", "artificial intelligence", "machine learning", "ai & ml", "ai and ml", "ai & ds", "data science"],
  },
  {
    code: "ECE",
    name: "Electronics & Communication Engineering",
    aliases: ["ece", "electronics", "electronics and communication", "electronics & communication", "electronics and communication engineering", "ec"],
  },
  {
    code: "ME",
    name: "Mechanical Engineering",
    aliases: ["me", "mech", "mechanical", "mechanical engineering", "mechanical engg"],
  },
  {
    code: "CE",
    name: "Civil Engineering",
    aliases: ["ce", "civil", "civil engineering"],
  },
  {
    code: "EEE",
    name: "Electrical & Electronics Engineering",
    aliases: ["eee", "electrical", "electrical engineering", "electrical & electronics", "electrical & electronics engineering"],
  },
];

/**
 * Validates an engineering branch.
 * Rule: must be one of the existing branch list (BRANCH_DIRECTORY in utils/searchEngine.js).
 */
export function validateBranch(branch) {
  const normalized = normalizeString(branch);
  if (!normalized) {
    return { ok: false, value: "", message: "Engineering branch is required." };
  }

  const lower = normalized.toLowerCase();

  // Match against canonical branches
  for (const b of CANONICAL_BRANCHES) {
    if (
      b.code.toLowerCase() === lower ||
      b.name.toLowerCase() === lower ||
      b.aliases.some((alias) => alias.toLowerCase() === lower)
    ) {
      return {
        ok: true,
        value: b.name,
        code: b.code,
        branch: b.name,
        message: "",
      };
    }
  }

  // Match exact token/word boundaries or full phrase
  for (const b of CANONICAL_BRANCHES) {
    for (const alias of b.aliases) {
      if (alias === lower) {
        return {
          ok: true,
          value: b.name,
          code: b.code,
          branch: b.name,
          message: "",
        };
      }
      // Check word boundary only if alias is at least 3 letters
      if (alias.length >= 3) {
        const regex = new RegExp(`(^|\\s)${alias}($|\\s)`, "i");
        if (regex.test(lower)) {
          return {
            ok: true,
            value: b.name,
            code: b.code,
            branch: b.name,
            message: "",
          };
        }
      }
    }
  }

  return {
    ok: false,
    value: normalized,
    message: "Branch must be one of: CSE, AIML, ECE, EEE, ME (Mechanical), or CE (Civil).",
  };
}

/**
 * Validates an uploaded profile photo.
 * Rule: image types only (jpg, png, webp), at most 2 MB.
 */
export function validateProfilePhoto(file) {
  if (!file) {
    return { ok: false, message: "No photo file provided." };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  const fileName = file.name ? file.name.toLowerCase() : "";
  const hasValidExt = /\.(jpe?g|png|webp)$/i.test(fileName);
  const hasValidMime = validTypes.includes(file.type);

  if (!hasValidMime && !hasValidExt) {
    return {
      ok: false,
      message: "Profile photo must be a JPG, PNG, or WEBP image file.",
    };
  }

  const maxBytes = 2 * 1024 * 1024; // 2 MB
  if (file.size > maxBytes) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      message: `Photo size (${sizeInMb} MB) exceeds the 2 MB maximum limit.`,
    };
  }

  return { ok: true, message: "" };
}

/**
 * Validates academic regulation.
 * Rule: R23, R20, R19, R16.
 */
export function validateRegulation(reg) {
  const normalized = normalizeString(reg).toUpperCase();
  if (!normalized) {
    return { ok: false, value: "", message: "Regulation is required (e.g. R23 Regulation)." };
  }

  const validRegs = ["R23", "R20", "R19", "R16"];
  const match = validRegs.find((r) => normalized.includes(r));
  if (match) {
    return { ok: true, value: `${match} Regulation`, code: match, message: "" };
  }

  return {
    ok: false,
    value: normalized,
    message: "Regulation must be R23, R20, R19, or R16.",
  };
}
