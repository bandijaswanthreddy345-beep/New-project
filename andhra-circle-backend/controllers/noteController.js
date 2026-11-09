const Note = require("../models/note");

// ==========================================
// CREATE NOTE
// ==========================================

exports.createNote = async (req, res) => {
  try {
    // ==========================
    // DEBUGGING
    // ==========================
    console.log("BODY");
    console.log(req.body);

    console.log("FILES");
    console.log(req.files);

    const pdf = req.files?.pdf?.[0];
    const image = req.files?.image?.[0];

    const module1Pdf = req.files?.module1Pdf?.[0];
    const module2Pdf = req.files?.module2Pdf?.[0];
    const module3Pdf = req.files?.module3Pdf?.[0];
    const module4Pdf = req.files?.module4Pdf?.[0];
    const module5Pdf = req.files?.module5Pdf?.[0];

    if (!req.body.branch) {
      return res.status(400).json({
        message: "Branch is required",
      });
    }

    if (!req.body.semester) {
      return res.status(400).json({
        message: "Semester is required",
      });
    }

    const note = await Note.create({
      title: req.body.title || "",
      branch: req.body.branch || "",
      semester: req.body.semester || "",
      subject: req.body.subject || "",
      subjectCode: req.body.subjectCode || "",
      description: req.body.description || "",

      // ==========================
      // CREDITS
      // ==========================
      credits: req.body.credits || "",

      module1: req.body.module1 || "",
      module2: req.body.module2 || "",
      module3: req.body.module3 || "",
      module4: req.body.module4 || "",
      module5: req.body.module5 || "",

      module1Pdf: module1Pdf
        ? `/uploads/${module1Pdf.filename}`
        : "",

      module2Pdf: module2Pdf
        ? `/uploads/${module2Pdf.filename}`
        : "",

      module3Pdf: module3Pdf
        ? `/uploads/${module3Pdf.filename}`
        : "",

      module4Pdf: module4Pdf
        ? `/uploads/${module4Pdf.filename}`
        : "",

      module5Pdf: module5Pdf
        ? `/uploads/${module5Pdf.filename}`
        : "",

      pdfUrl: pdf
        ? `/uploads/${pdf.filename}`
        : "",

      imageUrl: image
        ? `/uploads/${image.filename}`
        : "",

      likes: 0,
      views: 0,
      downloads: 0,
    });

    console.log("NOTE CREATED:");
    console.log(note);

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Create Note Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL NOTES
// ==========================================

exports.getNotes = async (req, res) => {
  try {
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(200).json([]);
    }
    const notes = await Note.find().sort({
      createdAt: -1,
    });

    res.status(200).json(notes);
  } catch (error) {
    console.warn("Get Notes Warning:", error.message);
    res.status(200).json([]);
  }
};

// ==========================================
// GET NOTE BY ID
// ==========================================

exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.status(200).json(note);
  } catch (error) {
    console.error("Get Note By ID Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE NOTE
// ==========================================

exports.updateNote = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title || "",
      branch: req.body.branch || "",
      semester: req.body.semester || "",
      subject: req.body.subject || "",
      subjectCode: req.body.subjectCode || "",
      description: req.body.description || "",

      // ==========================
      // CREDITS
      // ==========================
      credits: req.body.credits || "",

      module1: req.body.module1 || "",
      module2: req.body.module2 || "",
      module3: req.body.module3 || "",
      module4: req.body.module4 || "",
      module5: req.body.module5 || "",
    };

    if (req.files?.pdf?.[0]) {
      updateData.pdfUrl =
        `/uploads/${req.files.pdf[0].filename}`;
    }

    if (req.files?.image?.[0]) {
      updateData.imageUrl =
        `/uploads/${req.files.image[0].filename}`;
    }

    if (req.files?.module1Pdf?.[0]) {
      updateData.module1Pdf =
        `/uploads/${req.files.module1Pdf[0].filename}`;
    }

    if (req.files?.module2Pdf?.[0]) {
      updateData.module2Pdf =
        `/uploads/${req.files.module2Pdf[0].filename}`;
    }

    if (req.files?.module3Pdf?.[0]) {
      updateData.module3Pdf =
        `/uploads/${req.files.module3Pdf[0].filename}`;
    }

    if (req.files?.module4Pdf?.[0]) {
      updateData.module4Pdf =
        `/uploads/${req.files.module4Pdf[0].filename}`;
    }

    if (req.files?.module5Pdf?.[0]) {
      updateData.module5Pdf =
        `/uploads/${req.files.module5Pdf[0].filename}`;
    }

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.status(200).json(note);
  } catch (error) {
    console.error("Update Note Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// DELETE NOTE
// ==========================================

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.status(200).json({
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete Note Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// LIKE NOTE
// ==========================================

exports.likeNote = async (req, res) => {
  try {
    const { action } = req.body || {};
    const change = action === "unlike" ? -1 : 1;

    const existing = await Note.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    const currentLikes =
      typeof existing.likes === "number" && !isNaN(existing.likes)
        ? existing.likes
        : 0;
    const targetLikes = Math.max(0, currentLikes + change);

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: { likes: targetLikes } },
      { returnDocument: "after" }
    );

    res.status(200).json(note);
  } catch (error) {
    console.error("Like Note Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// INCREASE VIEWS
// ==========================================

exports.increaseViews = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.status(200).json(note);
  } catch (error) {
    console.error("Increase Views Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// INCREASE DOWNLOADS
// ==========================================

exports.increaseDownloads = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { returnDocument: "after" }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.status(200).json(note);
  } catch (error) {
    console.error("Increase Downloads Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// GET BRANCH STATS (FOR 3D CARDS & CATALOG) - AGGREGATION PIPELINE
// ==========================================

exports.getBranchStats = async (req, res) => {
  try {
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        stats: {},
        totalNotes: 0,
        totalPapers: 0,
        totalSyllabus: 0,
        totalLabs: 0,
      });
    }

    const Paper = require("../models/paper");
    const Syllabus = require("../models/syllabus");
    const LabProgram = require("../models/LabProgram");

    // High-performance MongoDB Aggregation Pipeline: executes grouping in DB engine
    const branchAggregationPipeline = [
      {
        $match: {
          branch: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: { $trim: { input: "$branch" } },
          count: { $sum: 1 },
          views: { $sum: { $ifNull: ["$views", 0] } },
          downloads: { $sum: { $ifNull: ["$downloads", 0] } },
          likes: { $sum: { $ifNull: ["$likes", 0] } },
        },
      },
      { $sort: { count: -1 } },
    ];

    const [notesAggr, papersAggr, syllabusAggr, labsAggr] = await Promise.all([
      Note.aggregate(branchAggregationPipeline),
      Paper.aggregate(branchAggregationPipeline),
      Syllabus.aggregate(branchAggregationPipeline),
      LabProgram.aggregate(branchAggregationPipeline),
    ]);

    const stats = {};
    let totalNotes = 0;
    let totalPapers = 0;
    let totalSyllabus = 0;
    let totalLabs = 0;

    const mergeStats = (items, type) => {
      items.forEach((item) => {
        const rawBranch = item._id;
        if (!rawBranch) return;

        if (!stats[rawBranch]) {
          stats[rawBranch] = {
            notes: 0,
            papers: 0,
            syllabus: 0,
            labs: 0,
            total: 0,
            views: 0,
            downloads: 0,
            likes: 0,
          };
        }
        stats[rawBranch][type] = item.count;
        stats[rawBranch].total += item.count;
        stats[rawBranch].views += item.views || 0;
        stats[rawBranch].downloads += item.downloads || 0;
        stats[rawBranch].likes += item.likes || 0;

        if (type === "notes") totalNotes += item.count;
        if (type === "papers") totalPapers += item.count;
        if (type === "syllabus") totalSyllabus += item.count;
        if (type === "labs") totalLabs += item.count;
      });
    };

    mergeStats(notesAggr, "notes");
    mergeStats(papersAggr, "papers");
    mergeStats(syllabusAggr, "syllabus");
    mergeStats(labsAggr, "labs");

    res.status(200).json({
      success: true,
      stats,
      totalNotes,
      totalPapers,
      totalSyllabus,
      totalLabs,
      totalResources: totalNotes + totalPapers + totalSyllabus + totalLabs,
    });
  } catch (error) {
    console.warn("Get Branch Stats Warning:", error.message);
    res.status(200).json({
      success: true,
      stats: {},
      totalNotes: 0,
      totalPapers: 0,
      totalSyllabus: 0,
      totalLabs: 0,
    });
  }
};

// ==========================================
// GET RELATED MATERIALS (AGGREGATION PIPELINE WITH $LOOKUP)
// ==========================================

exports.getRelatedMaterials = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const noteId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    const currentNote = await Note.findById(noteId);
    if (!currentNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Pipeline: match branch, compute popularity score, join comments count via $lookup
    const relatedNotes = await Note.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(noteId) },
          branch: currentNote.branch,
          ...(currentNote.semester ? { semester: currentNote.semester } : {}),
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "note",
          as: "comments",
        },
      },
      {
        $addFields: {
          commentCount: { $size: "$comments" },
          popularityScore: {
            $add: [
              { $ifNull: ["$views", 0] },
              { $multiply: [{ $ifNull: ["$downloads", 0] }, 3] },
              { $multiply: [{ $ifNull: ["$likes", 0] }, 5] },
            ],
          },
        },
      },
      {
        $sort: { popularityScore: -1, createdAt: -1 },
      },
      { $limit: 6 },
      {
        $project: {
          comments: 0, // exclude bulky array
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: relatedNotes.length,
      related: relatedNotes,
    });
  } catch (error) {
    console.error("Get Related Materials Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// GET TRENDING MATERIALS (AGGREGATION PIPELINE)
// ==========================================

exports.getTrendingMaterials = async (req, res) => {
  try {
    const { branch, limit = 10 } = req.query;

    const matchStage = {};
    if (branch && branch !== "all") {
      matchStage.branch = { $regex: new RegExp(branch, "i") };
    }

    const trendingPipeline = [
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $ifNull: ["$views", 0] },
              { $multiply: [{ $ifNull: ["$downloads", 0] }, 3] },
              { $multiply: [{ $ifNull: ["$likes", 0] }, 5] },
            ],
          },
        },
      },
      { $sort: { engagementScore: -1, createdAt: -1 } },
      { $limit: parseInt(limit, 10) || 10 },
      {
        $project: {
          title: 1,
          branch: 1,
          semester: 1,
          subject: 1,
          subjectCode: 1,
          pdfUrl: 1,
          imageUrl: 1,
          views: 1,
          downloads: 1,
          likes: 1,
          engagementScore: 1,
          createdAt: 1,
        },
      },
    ];

    const trending = await Note.aggregate(trendingPipeline);

    res.status(200).json({
      success: true,
      count: trending.length,
      trending,
    });
  } catch (error) {
    console.error("Get Trending Materials Error:", error);
    res.status(500).json({ message: error.message });
  }
};