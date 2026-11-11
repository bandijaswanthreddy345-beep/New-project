const Paper = require("../models/paper");
const recordAuditLog = require("../services/auditLogger");

// ==========================================
// CREATE PAPER
// ==========================================

exports.createPaper = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim().slice(0, 300);
    const branch = String(req.body.branch || "").trim().slice(0, 100);
    const semester = String(req.body.semester || "").trim().slice(0, 50);
    const subject = String(req.body.subject || "").trim().slice(0, 200);
    const year = String(req.body.year || "").trim().slice(0, 50);
    const examType = String(req.body.examType || "").trim().slice(0, 50);

    if (!title || !req.file) {
      return res.status(400).json({
        message: "Title and PDF file are required",
      });
    }

    const paper = await Paper.create({
      title,
      branch,
      semester,
      subject,
      year,
      examType,
      pdfUrl: `/uploads/${req.file.filename}`,

      likes: 0,
      views: 0,
      downloads: 0,
    });

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "create",
        resourceType: "Paper",
        resourceId: paper._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(201).json(paper);
  } catch (error) {
    console.error("Create Paper Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL PAPERS
// ==========================================

exports.getPapers = async (req, res) => {
  try {
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(200).json([]);
    }

    const { branch, semester, year, examType, page, limit } = req.query;
    const filter = {};
    if (branch && branch !== "ALL") filter.branch = branch;
    if (semester && semester !== "ALL") filter.semester = semester;
    if (year && year !== "ALL") filter.year = Number(year);
    if (examType && examType !== "ALL") filter.examType = examType;

    let query = Paper.find(filter)
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
      const total = await Paper.countDocuments(filter);
      const papers = await query
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit);

      return res.status(200).json({
        papers,
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit),
      });
    }

    const papers = await query;
    res.status(200).json(papers);
  } catch (error) {
    console.warn("Get Papers Warning:", error.message);
    res.status(200).json([]);
  }
};

// ==========================================
// GET SINGLE PAPER
// ==========================================

exports.getPaperById = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    res.status(200).json(paper);
  } catch (error) {
    console.error("Get Paper Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE PAPER
// ==========================================

exports.updatePaper = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = String(req.body.title).trim().slice(0, 300);
    if (req.body.branch !== undefined) updateData.branch = String(req.body.branch).trim().slice(0, 100);
    if (req.body.semester !== undefined) updateData.semester = String(req.body.semester).trim().slice(0, 50);
    if (req.body.subject !== undefined) updateData.subject = String(req.body.subject).trim().slice(0, 200);
    if (req.body.year !== undefined) updateData.year = String(req.body.year).trim().slice(0, 50);
    if (req.body.examType !== undefined) updateData.examType = String(req.body.examType).trim().slice(0, 50);

    if (req.file) {
      updateData.pdfUrl = `/uploads/${req.file.filename}`;
    }

    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "update",
        resourceType: "Paper",
        resourceId: paper._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json(paper);
  } catch (error) {
    console.error("Update Paper Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// DELETE PAPER
// ==========================================

exports.deletePaper = async (req, res) => {
  try {
    const paper = await Paper.findByIdAndDelete(
      req.params.id
    );

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "delete",
        resourceType: "Paper",
        resourceId: req.params.id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: "Paper deleted successfully",
    });
  } catch (error) {
    console.error("Delete Paper Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// LIKE PAPER
// ==========================================

exports.likePaper = async (req, res) => {
  try {
    const { action } = req.body || {};
    const change = action === "unlike" ? -1 : 1;

    const existing = await Paper.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    const currentLikes =
      typeof existing.likes === "number" && !isNaN(existing.likes)
        ? existing.likes
        : 0;
    const targetLikes = Math.max(0, currentLikes + change);

    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      { $set: { likes: targetLikes } },
      { returnDocument: "after" }
    );

    res.status(200).json(paper);
  } catch (error) {
    console.error("Like Paper Error:", error);

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
    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    res.status(200).json(paper);
  } catch (error) {
    console.error("View Error:", error);

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
    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { returnDocument: "after" }
    );

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    res.status(200).json(paper);
  } catch (error) {
    console.error("Download Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};