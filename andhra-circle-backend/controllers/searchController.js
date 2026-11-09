const Note = require("../models/note");
const Paper = require("../models/paper");
const Syllabus = require("../models/syllabus");
const LabProgram = require("../models/LabProgram");
const Notification = require("../models/Notification");

// Escape special regex characters safely
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Universal Academic Search Aggregation Pipeline
 * Performs full-text / multi-field indexing and relevance scoring across all collections
 */
exports.searchResources = async (req, res) => {
  try {
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        query: req.query.q || "",
        total: 0,
        categoryCounts: { all: 0, notes: 0, papers: 0, syllabus: 0, labs: 0, notifications: 0 },
        results: [],
      });
    }

    const {
      q = "",
      category = "all",
      branch,
      semester,
      sortBy = "relevance",
      page = 1,
      limit = 30,
    } = req.query;

    const trimmed = String(q).trim();
    const safeRegex = trimmed ? new RegExp(escapeRegex(trimmed), "i") : null;

    // Helper to generate search aggregation pipeline for any academic resource model
    const buildSearchPipeline = (typeKey, typeLabel, icon, extraFields = {}) => {
      const matchConditions = [];

      if (safeRegex) {
        matchConditions.push({
          $or: [
            { title: safeRegex },
            { subject: safeRegex },
            { subjectCode: safeRegex },
            { description: safeRegex },
            { branch: safeRegex },
          ],
        });
      }

      if (branch && branch !== "all") {
        matchConditions.push({ branch: new RegExp(escapeRegex(branch), "i") });
      }

      if (semester && semester !== "all") {
        matchConditions.push({ semester: new RegExp(escapeRegex(semester), "i") });
      }

      const pipeline = [];

      if (matchConditions.length > 0) {
        pipeline.push({ $match: { $and: matchConditions } });
      }

      // Standardize output shape
      pipeline.push({
        $project: {
          _id: 1,
          title: 1,
          subject: { $ifNull: ["$subject", "$title"] },
          subjectCode: { $ifNull: ["$subjectCode", ""] },
          branch: { $ifNull: ["$branch", ""] },
          semester: { $ifNull: ["$semester", ""] },
          description: { $ifNull: ["$description", ""] },
          pdfUrl: { $ifNull: ["$pdfUrl", ""] },
          imageUrl: { $ifNull: ["$imageUrl", ""] },
          views: { $ifNull: ["$views", 0] },
          downloads: { $ifNull: ["$downloads", 0] },
          likes: { $ifNull: ["$likes", 0] },
          createdAt: 1,
          type: { $literal: typeLabel },
          resourceType: { $literal: typeKey },
          icon: { $literal: icon },
          ...extraFields,
        },
      });

      // Compute dynamic relevance score
      if (trimmed) {
        pipeline.push({
          $addFields: {
            relevanceScore: {
              $add: [
                {
                  $cond: [
                    { $regexMatch: { input: { $ifNull: ["$title", ""] }, regex: safeRegex } },
                    35,
                    0,
                  ],
                },
                {
                  $cond: [
                    { $regexMatch: { input: { $ifNull: ["$subject", ""] }, regex: safeRegex } },
                    25,
                    0,
                  ],
                },
                {
                  $cond: [
                    { $regexMatch: { input: { $ifNull: ["$subjectCode", ""] }, regex: safeRegex } },
                    30,
                    0,
                  ],
                },
                { $multiply: [{ $ifNull: ["$downloads", 0] }, 1.5] },
                { $ifNull: ["$views", 0] },
              ],
            },
          },
        });
      } else {
        pipeline.push({
          $addFields: {
            relevanceScore: {
              $add: [
                { $multiply: [{ $ifNull: ["$downloads", 0] }, 1.5] },
                { $ifNull: ["$views", 0] },
              ],
            },
          },
        });
      }

      return pipeline;
    };

    // Execute aggregation pipelines across collections in parallel
    const [notesResults, papersResults, syllabusResults, labsResults, notifsResults] =
      await Promise.all([
        Note.aggregate(
          buildSearchPipeline("notes", "Notes", "📘", {
            regulation: { $ifNull: ["$regulation", "R23"] },
          })
        ),
        Paper.aggregate(
          buildSearchPipeline("papers", "Question Paper", "📄", {
            year: { $ifNull: ["$year", ""] },
            examType: { $ifNull: ["$examType", "Semester"] },
            regulation: { $ifNull: ["$regulation", "R23"] },
          })
        ),
        Syllabus.aggregate(
          buildSearchPipeline("syllabus", "Syllabus", "📚", {
            regulation: { $ifNull: ["$regulation", "R23"] },
          })
        ),
        LabProgram.aggregate(
          buildSearchPipeline("labs", "Lab Program", "🧪", {
            regulation: { $ifNull: ["$regulation", "R23"] },
          })
        ),
        Notification.aggregate(
          buildSearchPipeline("notifications", "Notification", "📢", {
            category: { $ifNull: ["$category", "General"] },
            link: { $ifNull: ["$link", ""] },
            publishedDate: { $ifNull: ["$publishedDate", "$createdAt"] },
          })
        ),
      ]);

    const categoryCounts = {
      all:
        notesResults.length +
        papersResults.length +
        syllabusResults.length +
        labsResults.length +
        notifsResults.length,
      notes: notesResults.length,
      papers: papersResults.length,
      syllabus: syllabusResults.length,
      labs: labsResults.length,
      notifications: notifsResults.length,
    };

    // Filter by selected category if specified
    let combined = [];
    const catLower = String(category).toLowerCase();

    if (catLower === "notes") combined = notesResults;
    else if (catLower === "papers" || catLower === "question paper" || catLower === "question papers")
      combined = papersResults;
    else if (catLower === "syllabus") combined = syllabusResults;
    else if (catLower === "labs" || catLower === "lab program" || catLower === "lab programs")
      combined = labsResults;
    else if (catLower === "notifications" || catLower === "notification") combined = notifsResults;
    else {
      combined = [
        ...notesResults,
        ...papersResults,
        ...syllabusResults,
        ...labsResults,
        ...notifsResults,
      ];
    }

    // Apply sorting
    if (sortBy === "views") {
      combined.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === "downloads") {
      combined.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sortBy === "newest") {
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "likes") {
      combined.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      // Default: relevance score + engagement
      combined.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 30));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedResults = combined.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      success: true,
      query: trimmed,
      category: catLower,
      total: combined.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(combined.length / limitNum) || 1,
      categoryCounts,
      results: paginatedResults,
    });
  } catch (error) {
    console.error("Search Aggregation Pipeline Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
