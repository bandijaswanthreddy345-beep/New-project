/**
 * Standard JNTU Semester Utility
 * Standardizes semester representation to: 1-1, 1-2, 2-1, 2-2, 3-1, 3-2, 4-1, 4-2
 */

export const SEMESTERS = [
  "1-1",
  "1-2",
  "2-1",
  "2-2",
  "3-1",
  "3-2",
  "4-1",
  "4-2",
];

export const SCHEMES = ["R23", "R20", "R19", "R16"];

export const normalizeSemester = (sem) => {
  if (!sem) return "";
  const s = String(sem).toLowerCase().trim();
  if (s === "1-1" || s.includes("1st sem") || s === "1st" || s === "sem 1" || s === "semester 1" || s === "1") return "1-1";
  if (s === "1-2" || s.includes("2nd sem") || s === "2nd" || s === "sem 2" || s === "semester 2" || s === "2") return "1-2";
  if (s === "2-1" || s.includes("3rd sem") || s === "3rd" || s === "sem 3" || s === "semester 3" || s === "3") return "2-1";
  if (s === "2-2" || s.includes("4th sem") || s === "4th" || s === "sem 4" || s === "semester 4" || s === "4") return "2-2";
  if (s === "3-1" || s.includes("5th sem") || s === "5th" || s === "sem 5" || s === "semester 5" || s === "5") return "3-1";
  if (s === "3-2" || s.includes("6th sem") || s === "6th" || s === "sem 6" || s === "semester 6" || s === "6") return "3-2";
  if (s === "4-1" || s.includes("7th sem") || s === "7th" || s === "sem 7" || s === "semester 7" || s === "7") return "4-1";
  if (s === "4-2" || s.includes("8th sem") || s === "8th" || s === "sem 8" || s === "semester 8" || s === "8") return "4-2";
  return sem;
};

/**
 * Standard JNTU Regulation / Scheme Utility
 * Resolves scheme (e.g. R23, R20, R19, R16) from item properties,
 * subject codes (e.g. 23A... -> R23, 20A... -> R20), titles, or fallback.
 */
export const normalizeScheme = (item) => {
  if (!item) return "R23";

  // If passed directly as a string (e.g. normalizeScheme("R23"))
  if (typeof item === "string") {
    const s = item.trim();
    const match = s.match(/R\s*(\d{2})/i);
    if (match) return `R${match[1]}`;
    if (/^\d{2}$/.test(s)) return `R${s}`;
    return s || "R23";
  }

  // 1. Direct explicit property: regulation, scheme, or reg
  const direct = item.regulation || item.scheme || item.reg;
  if (direct && typeof direct === "string" && direct.trim()) {
    const match = direct.match(/R\s*(\d{2})/i);
    if (match) return `R${match[1]}`;
    return direct.trim();
  }

  // 2. From subjectCode: e.g. "23A01607" -> "R23", "20A05401" -> "R20", "19A05301" -> "R19"
  const code = item.subjectCode || "";
  const codeMatch = String(code).trim().match(/^(\d{2})[A-Z0-9]/i);
  if (codeMatch) {
    return `R${codeMatch[1]}`;
  }

  // 3. From title, description, or pdfUrl: e.g. "R23", "R20", "R19", "R16"
  const combined = `${item.title || ""} ${item.description || ""} ${item.pdfUrl || ""}`;
  const regMatch = combined.match(/\b(R23|R20|R19|R16)\b/i);
  if (regMatch) {
    return regMatch[1].toUpperCase();
  }

  // 4. Default to current JNTU university curriculum regulation (R23)
  return "R23";
};
