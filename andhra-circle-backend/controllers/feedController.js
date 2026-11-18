const Note = require("../models/note");
const Paper = require("../models/paper");
const Notification = require("../models/Notification");
const Syllabus = require("../models/syllabus");
const LabProgram = require("../models/LabProgram");
const mongoose = require("mongoose");

// High-speed in-memory cache with 90s TTL to prevent database hammering
let feedCache = null;
let feedCacheExpiry = 0;
const CACHE_TTL_MS = 90 * 1000;

/**
 * Invalidate in-memory feed cache when new resources are uploaded/updated
 */
exports.invalidateFeedCache = () => {
  feedCache = null;
  feedCacheExpiry = 0;
};

/**
 * Consolidated Home Feed Controller
 * Fetches all essential academic resources in 1 single optimized parallel query.
 * Delivers responses in <5ms when cached.
 */
exports.getHomeFeed = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (feedCache) {
        res.setHeader("X-Cache", "STALE-FALLBACK");
        return res.status(200).json(feedCache);
      }
      return res.status(200).json({
        notes: [],
        papers: [],
        syllabus: [],
        labPrograms: [],
        notifications: [],
      });
    }

    const now = Date.now();
    if (feedCache && now < feedCacheExpiry) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(feedCache);
    }

    const [notes, papers, syllabus, labPrograms, notifications] = await Promise.all([
      Note.find({})
        .select("_id title branch semester subject subjectCode regulation imageUrl pdfUrl views downloads likes createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Paper.find({})
        .select("_id title branch semester year examType subject subjectCode regulation pdfUrl views downloads likes createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Syllabus.find({})
        .select("_id title branch semester subject subjectCode regulation pdfUrl views downloads likes createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      LabProgram.find({})
        .select("_id title branch semester subject subjectCode regulation pdfUrl views downloads likes createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Notification.find({})
        .select("_id title description link date isBTech createdAt")
        .sort({ date: -1, createdAt: -1 })
        .limit(30)
        .lean(),
    ]);

    const result = {
      notes: notes || [],
      papers: papers || [],
      syllabus: syllabus || [],
      labPrograms: labPrograms || [],
      notifications: notifications || [],
    };

    feedCache = result;
    feedCacheExpiry = now + CACHE_TTL_MS;

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Home feed fetch error:", error.message);
    if (feedCache) {
      return res.status(200).json(feedCache);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to load home feed",
      notes: [],
      papers: [],
      syllabus: [],
      labPrograms: [],
      notifications: [],
    });
  }
};
