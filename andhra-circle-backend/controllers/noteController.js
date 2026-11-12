const Note = require("../models/note");
const recordAuditLog = require("../services/auditLogger");
const { bumpContentVersion } = require("../utils/contentVersion");

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
      title: String(req.body.title || "").trim().slice(0, 300),
      branch: String(req.body.branch || "").trim().slice(0, 100),
      semester: String(req.body.semester || "").trim().slice(0, 50),
      subject: String(req.body.subject || "").trim().slice(0, 200),
      subjectCode: String(req.body.subjectCode || "").trim().slice(0, 50),
      description: String(req.body.description || "").trim().slice(0, 5000),

      credits: String(req.body.credits || "").trim().slice(0, 50),

      module1: String(req.body.module1 || "").trim().slice(0, 300),
      module2: String(req.body.module2 || "").trim().slice(0, 300),
      module3: String(req.body.module3 || "").trim().slice(0, 300),
      module4: String(req.body.module4 || "").trim().slice(0, 300),
      module5: String(req.body.module5 || "").trim().slice(0, 300),

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

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "create",
        resourceType: "Note",
        resourceId: note._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

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

    const { branch, semester, search, page, limit } = req.query;
    const filter = {};
    if (branch && branch !== "ALL") filter.branch = branch;
    if (semester && semester !== "ALL") filter.semester = semester;
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: "i" } },
        { subject: { $regex: term, $options: "i" } },
        { subjectCode: { $regex: term, $options: "i" } },
      ];
    }

    // Exclude heavy module outline text from list view
    const listFields =
      "_id title branch semester subject subjectCode imageUrl pdfUrl views downloads likes createdAt";

    let query = Note.find(filter)
      .select(listFields)
      .sort({ createdAt: -1 })
      .lean();

    res.setHeader(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=120"
    );

    if (limit) {
      const parsedLimit = Math.min(
        Math.max(parseInt(limit, 10) || 20, 1),
        100
      );
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const total = await Note.countDocuments(filter);
      const notes = await query
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit);

      return res.status(200).json({
        notes,
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit),
      });
    }

    const notes = await query;
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
      title: String(req.body.title || "").trim().slice(0, 300),
      branch: String(req.body.branch || "").trim().slice(0, 100),
      semester: String(req.body.semester || "").trim().slice(0, 50),
      subject: String(req.body.subject || "").trim().slice(0, 200),
      subjectCode: String(req.body.subjectCode || "").trim().slice(0, 50),
      description: String(req.body.description || "").trim().slice(0, 5000),

      // ==========================
      // CREDITS
      // ==========================
      credits: String(req.body.credits || "").trim().slice(0, 50),

      module1: String(req.body.module1 || "").trim().slice(0, 300),
      module2: String(req.body.module2 || "").trim().slice(0, 300),
      module3: String(req.body.module3 || "").trim().slice(0, 300),
      module4: String(req.body.module4 || "").trim().slice(0, 300),
      module5: String(req.body.module5 || "").trim().slice(0, 300),
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
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "update",
        resourceType: "Note",
        resourceId: note._id,
        route: req.originalUrl,
        ip: req.ip,
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
    const note = await Note.findById(req.params.id);

    // If already deleted or not found, treat delete as success (idempotent delete)
    if (!note) {
      return res.status(200).json({
        message: "Note already removed or not found",
        alreadyDeleted: true,
      });
    }

    // Soft delete
    await note.softDelete(req.user?._id);
    await bumpContentVersion();

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "soft_delete",
        resourceType: "Note",
        resourceId: req.params.id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: "Note soft-deleted successfully",
    });
  } catch (error) {
    console.error("Delete Note Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// RESTORE NOTE (ADMIN ONLY)
// ==========================================

exports.restoreNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id }, null, { includeDeleted: true });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    await note.restore();
    await bumpContentVersion();

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "restore",
        resourceType: "Note",
        resourceId: req.params.id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: "Note restored successfully",
      note,
    });
  } catch (error) {
    console.error("Restore Note Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// PERMANENT PURGE NOTE (ADMIN ONLY)
// ==========================================

exports.purgeNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    await bumpContentVersion();

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "permanent_purge",
        resourceType: "Note",
        resourceId: req.params.id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: "Note permanently purged",
    });
  } catch (error) {
    console.error("Purge Note Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// LIKE NOTE
// ==========================================

exports.likeNote = async (req, res) => {
  try {
    const { action } = req.body || {};
    const change = action === "unlike" ? -1 : 1;

    // Use atomic $inc to prevent lost updates under race conditions.
    // If unliking, prevent likes from dropping below 0 with query condition.
    let note;
    if (change < 0) {
      note = await Note.findOneAndUpdate(
        { _id: req.params.id, likes: { $gt: 0 } },
        { $inc: { likes: change } },
        { new: true }
      );
      if (!note) {
        note = await Note.findById(req.params.id);
      }
    } else {
      note = await Note.findByIdAndUpdate(
        req.params.id,
        { $inc: { likes: change } },
        { new: true }
      );
    }

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

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
      { new: true }
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
      { new: true }
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
// GET BRANCH STATS (FOR 3D CARDS & CATALOG)
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

    const [notes, papers, syllabus, labs] = await Promise.all([
      Note.find({}, "branch title"),
      Paper.find({}, "branch title"),
      Syllabus.find({}, "branch title"),
      LabProgram.find({}, "branch title"),
    ]);

    // Group stats by branch
    const stats = {};

    const addToStats = (items, type) => {
      items.forEach((item) => {
        const rawBranch = String(item.branch || "").trim();
        if (!rawBranch) return;

        if (!stats[rawBranch]) {
          stats[rawBranch] = { notes: 0, papers: 0, syllabus: 0, labs: 0, total: 0 };
        }
        stats[rawBranch][type] = (stats[rawBranch][type] || 0) + 1;
        stats[rawBranch].total = (stats[rawBranch].total || 0) + 1;
      });
    };

    addToStats(notes, "notes");
    addToStats(papers, "papers");
    addToStats(syllabus, "syllabus");
    addToStats(labs, "labs");

    res.status(200).json({
      success: true,
      stats,
      totalNotes: notes.length,
      totalPapers: papers.length,
      totalSyllabus: syllabus.length,
      totalLabs: labs.length,
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
