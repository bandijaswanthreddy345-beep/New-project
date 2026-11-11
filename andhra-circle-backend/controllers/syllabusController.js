const Syllabus = require("../models/syllabus");
const recordAuditLog = require("../services/auditLogger");

// Create Syllabus
exports.createSyllabus = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    const title = String(req.body.title || "").trim().slice(0, 300);
    const branch = String(req.body.branch || "").trim().slice(0, 100);
    const semester = String(req.body.semester || "").trim().slice(0, 50);
    const description = String(req.body.description || "").trim().slice(0, 5000);

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const syllabus = await Syllabus.create({
      title,
      branch,
      semester,
      description,
      pdfUrl: `/uploads/${req.file.filename}`,
    });

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "create",
        resourceType: "Syllabus",
        resourceId: syllabus._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(201).json(syllabus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Syllabus
exports.getSyllabus = async (req, res) => {
  try {
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(200).json([]);
    }

    const { branch, semester, regulation, page, limit } = req.query;
    const filter = {};
    if (branch && branch !== "ALL") filter.branch = branch;
    if (semester && semester !== "ALL") filter.semester = semester;
    if (regulation && regulation !== "ALL") filter.regulation = regulation;

    let query = Syllabus.find(filter)
      .select("_id title branch semester regulation subject subjectCode pdfUrl views downloads likes createdAt")
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
      const total = await Syllabus.countDocuments(filter);
      const syllabus = await query
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit);

      return res.status(200).json({
        syllabus,
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit),
      });
    }

    const syllabus = await query;
    res.status(200).json(syllabus);
  } catch (error) {
    console.warn("Get Syllabus Warning:", error.message);
    res.status(200).json([]);
  }
};

// Get Single Syllabus
exports.getSyllabusById = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    res.json(syllabus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Syllabus
exports.updateSyllabus = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = String(req.body.title).trim().slice(0, 300);
    if (req.body.branch !== undefined) updateData.branch = String(req.body.branch).trim().slice(0, 100);
    if (req.body.semester !== undefined) updateData.semester = String(req.body.semester).trim().slice(0, 50);
    if (req.body.description !== undefined) updateData.description = String(req.body.description).trim().slice(0, 5000);

    if (req.file) {
      updateData.pdfUrl = `/uploads/${req.file.filename}`;
    }

    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    );

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "update",
        resourceType: "Syllabus",
        resourceId: syllabus._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.json(syllabus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Syllabus
exports.deleteSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findByIdAndDelete(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "delete",
        resourceType: "Syllabus",
        resourceId: req.params.id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.json({
      message: "Syllabus Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// LIKE SYLLABUS
// ==========================================
exports.likeSyllabus = async (req, res) => {
  try {
    const { action } = req.body || {};
    const change = action === "unlike" ? -1 : 1;

    const existing = await Syllabus.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    const currentLikes =
      typeof existing.likes === "number" && !isNaN(existing.likes)
        ? existing.likes
        : 0;
    const targetLikes = Math.max(0, currentLikes + change);

    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      { $set: { likes: targetLikes } },
      { returnDocument: "after" }
    );

    res.status(200).json(syllabus);
  } catch (error) {
    console.error("Like Syllabus Error:", error);
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
    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    res.status(200).json(syllabus);
  } catch (error) {
    console.error("View Syllabus Error:", error);
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
    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { returnDocument: "after" }
    );

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    res.status(200).json(syllabus);
  } catch (error) {
    console.error("Download Syllabus Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};
