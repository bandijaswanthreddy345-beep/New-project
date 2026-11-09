/* ==============================================================================
   JNTU Circle - Retrieval Service (RAG over MongoDB)
   
   - Searches 5 collections: Note, Paper, Syllabus, LabProgram, Notification
   - Uses MongoDB text indexes ($text with textScore)
   - Parses and boosts exact matches on subjectCode, branch, and semester
   - Returns top 5 sanitized items (type, _id, title, subject, branch, semester, snippet <= 400 chars)
   - Never returns user, email, or file URLs
   - Coerces all inputs to strings to prevent NoSQL injection
   ============================================================================== */

const mongoose = require("mongoose");
const Note = require("../models/note");
const Paper = require("../models/paper");
const Syllabus = require("../models/syllabus");
const LabProgram = require("../models/LabProgram");
const Notification = require("../models/Notification");

// Common branch abbreviations and full names
const BRANCH_PATTERNS = [
  { code: "AIML", regex: /\b(aiml|ai\s*(?:&|and)\s*ml|artificial intelligence|machine learning)\b/i },
  { code: "CSE", regex: /\b(cse|computer science|computer science & engineering|information technology|it)\b/i },
  { code: "ECE", regex: /\b(ece|electronics|electronics & communication|electronics and communication)\b/i },
  { code: "EEE", regex: /\b(eee|electrical|electrical & electronics|electrical and electronics)\b/i },
  { code: "MECH", regex: /\b(mech|mechanical|mechanical engineering|me)\b/i },
  { code: "CIVIL", regex: /\b(civil|civil engineering|ce)\b/i },
];

/**
 * Coerces input to safe string and extracts metadata.
 */
function parseQueryMetadata(rawInput) {
  const query = typeof rawInput === "string" ? rawInput.trim() : "";
  if (!query) {
    return { query: "", cleanText: "", subjectCode: null, branch: null, semester: null };
  }

  // 1. Detect JNTUA Subject Code: e.g., 23A56101T, 20A05301T, 23A02101P, 19A05401
  const codeMatch = query.match(/\b([0-9]{2}[A-Za-z][0-9A-Za-z]{4,6})\b/);
  const subjectCode = codeMatch ? codeMatch[1].toUpperCase() : null;

  // 2. Detect Branch
  let branch = null;
  for (const b of BRANCH_PATTERNS) {
    if (b.regex.test(query)) {
      branch = b.code;
      break;
    }
  }

  // 3. Detect Semester: e.g., "3-2", "2-1", "sem 4", "6th semester"
  let semester = null;
  const directSemMatch = query.match(/\b([1-4])\s*[-–]\s*([1-2])\b/);
  if (directSemMatch) {
    semester = `${directSemMatch[1]}-${directSemMatch[2]}`;
  } else {
    const wordSemMatch = query.match(/(?:sem|semester)\s*([1-8])\b|\b([1-8])(?:st|nd|rd|th)?\s*(?:sem|semester)\b/i);
    if (wordSemMatch) {
      const num = parseInt(wordSemMatch[1] || wordSemMatch[2], 10);
      if (num >= 1 && num <= 8) {
        const yr = Math.ceil(num / 2);
        const sm = ((num - 1) % 2) + 1;
        semester = `${yr}-${sm}`;
      }
    }
  }

  // 4. Clean text search string: remove regex symbols and quotes
  const cleanText = query
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);

  return { query, cleanText, subjectCode, branch, semester };
}

/**
 * Truncates and cleans snippet string to at most 400 characters.
 */
function sanitizeSnippet(rawText) {
  if (!rawText || typeof rawText !== "string") return "";
  return rawText
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

/**
 * Searches the 5 collections using text indexes and parses metadata.
 * Returns top 5 items and 3 suggested follow-up questions.
 */
async function retrieveContext(rawInput) {
  const parsed = parseQueryMetadata(rawInput);
  if (!parsed.cleanText && !parsed.subjectCode) {
    return { items: [], suggestedQuestions: [] };
  }

  // Guard against unready DB connection
  if (mongoose.connection.readyState !== 1) {
    return { items: [], suggestedQuestions: [] };
  }

  const textQuery = parsed.cleanText || parsed.subjectCode || "";
  const candidates = [];

  // Helper to run query safely
  async function queryCollection(model, type, projectFields, makeSnippet) {
    try {
      let results = [];
      // 1. Primary: MongoDB Text Index Search
      if (textQuery) {
        results = await model
          .find(
            { $text: { $search: textQuery } },
            { score: { $meta: "textScore" }, ...projectFields }
          )
          .sort({ score: { $meta: "textScore" } })
          .limit(10)
          .lean();
      }

      // 2. Secondary: If subjectCode parsed or text gave few results, match exact fields
      if (parsed.subjectCode && projectFields.subjectCode) {
        const codeMatches = await model
          .find({ subjectCode: parsed.subjectCode }, projectFields)
          .limit(5)
          .lean();

        for (const item of codeMatches) {
          if (!results.some((r) => String(r._id) === String(item._id))) {
            item.score = 2.0; // Base score for exact field match
            results.push(item);
          }
        }
      }

      for (const item of results) {
        candidates.push({
          type,
          _id: String(item._id),
          title: String(item.title || "").trim(),
          subject: String(item.subject || "").trim(),
          subjectCode: String(item.subjectCode || "").trim(),
          branch: String(item.branch || "").trim(),
          semester: String(item.semester || "").trim(),
          snippet: sanitizeSnippet(makeSnippet(item)),
          textScore: item.score || 1.0,
        });
      }
    } catch (err) {
      // Graceful fallback if text index is rebuilding or unexpected syntax
      console.warn(`Retrieval notice for ${type}:`, err.message);
    }
  }

  // Run all 5 collection queries in parallel
  await Promise.all([
    // Note: title, subject, subjectCode, branch, semester, description, module1..5
    queryCollection(
      Note,
      "Notes",
      { title: 1, subject: 1, subjectCode: 1, branch: 1, semester: 1, description: 1, module1: 1, module2: 1, module3: 1 },
      (item) => {
        if (item.description && item.description.trim()) return item.description;
        const moduleText = [item.module1, item.module2, item.module3].filter(Boolean).join(" ");
        if (moduleText.trim()) return moduleText;
        return `Official lecture notes for ${item.subject || item.title} (${item.branch || ""} ${item.semester || ""})`;
      }
    ),

    // Paper: title, subject, branch, semester, examType, year
    queryCollection(
      Paper,
      "Question Paper",
      { title: 1, subject: 1, branch: 1, semester: 1, examType: 1, year: 1 },
      (item) =>
        `${item.examType || "Semester"} Exam Question Paper (${item.year || ""}) for ${item.subject || item.title} - ${item.branch || ""} ${item.semester || ""}`
    ),

    // Syllabus: title, subject, subjectCode, branch, semester, description, regulation
    queryCollection(
      Syllabus,
      "Syllabus",
      { title: 1, subject: 1, subjectCode: 1, branch: 1, semester: 1, description: 1, regulation: 1 },
      (item) =>
        item.description ||
        `${item.regulation || "R23"} Official Course Syllabus: ${item.subject || item.title} (${item.subjectCode || ""}) for ${item.branch || ""} Semester ${item.semester || ""}`
    ),

    // LabProgram: title, subject, subjectCode, branch, semester, description
    queryCollection(
      LabProgram,
      "Lab Program",
      { title: 1, subject: 1, subjectCode: 1, branch: 1, semester: 1, description: 1 },
      (item) =>
        item.description ||
        `Verified Laboratory experiments and code implementation for ${item.subject || item.title} (${item.subjectCode || ""})`
    ),

    // Notification: title, description, category, publishedDate
    queryCollection(
      Notification,
      "Notification",
      { title: 1, description: 1, category: 1, publishedDate: 1 },
      (item) =>
        `[Category: ${item.category || "General"}] ${item.description || item.title}`
    ),
  ]);

  // Exact Match Boosting
  for (const c of candidates) {
    let finalScore = c.textScore;

    // 1. Boost exact subjectCode match (+25)
    if (parsed.subjectCode && c.subjectCode) {
      if (c.subjectCode.toUpperCase() === parsed.subjectCode.toUpperCase()) {
        finalScore += 25.0;
      }
    }

    // 2. Boost exact branch match (+8)
    if (parsed.branch && c.branch) {
      const bNorm = c.branch.toUpperCase();
      const pNorm = parsed.branch.toUpperCase();
      if (bNorm.includes(pNorm) || pNorm.includes(bNorm)) {
        finalScore += 8.0;
      }
    }

    // 3. Boost exact semester match (+6)
    if (parsed.semester && c.semester) {
      if (c.semester.includes(parsed.semester)) {
        finalScore += 6.0;
      }
    }

    // 4. Boost if subject or title exact matches keywords (+5)
    const qLower = parsed.query.toLowerCase();
    if (c.subject && qLower.includes(c.subject.toLowerCase())) {
      finalScore += 5.0;
    } else if (c.title && qLower.includes(c.title.toLowerCase())) {
      finalScore += 3.0;
    }

    c.finalScore = finalScore;
  }

  // Sort by finalScore descending
  candidates.sort((a, b) => b.finalScore - a.finalScore);

  // Deduplicate by type and _id
  const seen = new Set();
  const topItems = [];
  for (const item of candidates) {
    const key = `${item.type}:${item._id}`;
    if (!seen.has(key)) {
      seen.add(key);
      topItems.push({
        type: item.type,
        _id: item._id,
        title: item.title,
        subject: item.subject,
        branch: item.branch,
        semester: item.semester,
        snippet: item.snippet,
      });
    }
    if (topItems.length >= 5) break;
  }

  // Generate 3 suggested follow-up questions from real data
  const suggestedQuestions = buildSuggestedQuestions(topItems, parsed);

  return { items: topItems, suggestedQuestions };
}

/**
 * Generates 3 contextual follow-up questions from retrieved portal items.
 */
function buildSuggestedQuestions(items, parsed) {
  const suggestions = [];

  if (items.length > 0) {
    const first = items[0];
    if (first.type === "Notification") {
      suggestions.push("Check upcoming JNTUA exam schedules");
      suggestions.push("How to apply for supplementary exams?");
      suggestions.push("View latest official results & circulars");
    } else {
      const subj = first.subject || first.title;
      if (subj) {
        suggestions.push(`What are the key topics in ${subj}?`);
        suggestions.push(`Show syllabus and marking for ${subj}`);
        suggestions.push(`Previous question papers for ${subj}`);
      }
    }
  }

  // Defaults if fewer than 3 suggestions
  const defaults = [
    "What are JNTUA R23 passing marks and grading rules?",
    "How to prepare for semester exams and score 9+ CGPA?",
    "Where can I find recent university exam notifications?",
  ];

  for (const def of defaults) {
    if (suggestions.length < 3 && !suggestions.includes(def)) {
      suggestions.push(def);
    }
  }

  return suggestions.slice(0, 3);
}

module.exports = {
  retrieveContext,
  parseQueryMetadata,
};
