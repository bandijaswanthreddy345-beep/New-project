const LabProgram = require("../models/LabProgram");
const recordAuditLog = require("../services/auditLogger");

// ==========================================
// CREATE LAB PROGRAM
// ==========================================
exports.createLabProgram = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file",
      });
    }

    const title = String(req.body.title || "").trim().slice(0, 300);
    const branch = String(req.body.branch || "").trim().slice(0, 100);
    const semester = String(req.body.semester || "").trim().slice(0, 50);
    const subject = String(req.body.subject || "").trim().slice(0, 200);
    const subjectCode = String(req.body.subjectCode || "").trim().slice(0, 50);
    const description = String(req.body.description || "").trim().slice(0, 5000);

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const labProgram = await LabProgram.create({
      title,
      branch,
      semester,
      subject,
      subjectCode,
      description,
      pdfUrl: `/uploads/${req.file.filename}`,
    });

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "create",
        resourceType: "LabProgram",
        resourceId: labProgram._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(201).json(labProgram);
  } catch (error) {
    console.error("Create Lab Program Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL LAB PROGRAMS
// ==========================================
exports.getLabPrograms = async (req, res) => {
  try {
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(200).json([]);
    }
    const labPrograms = await LabProgram.find().sort({
      createdAt: -1,
    });

    res.status(200).json(labPrograms);
  } catch (error) {
    console.warn("Get Lab Programs Warning:", error.message);
    res.status(200).json([]);
  }
};

// ==========================================
// GET SINGLE LAB PROGRAM
// ==========================================
exports.getLabProgramById = async (req, res) => {
  try {
    const labProgram = await LabProgram.findById(
      req.params.id
    );

    if (!labProgram) {
      return res.status(404).json({
        message: "Lab program not found",
      });
    }

    res.status(200).json(labProgram);
  } catch (error) {
    console.error(
      "Get Lab Program By ID Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE LAB PROGRAM
// ==========================================
exports.updateLabProgram = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = String(req.body.title).trim().slice(0, 300);
    if (req.body.branch !== undefined) updateData.branch = String(req.body.branch).trim().slice(0, 100);
    if (req.body.semester !== undefined) updateData.semester = String(req.body.semester).trim().slice(0, 50);
    if (req.body.subject !== undefined) updateData.subject = String(req.body.subject).trim().slice(0, 200);
    if (req.body.subjectCode !== undefined) updateData.subjectCode = String(req.body.subjectCode).trim().slice(0, 50);
    if (req.body.description !== undefined) updateData.description = String(req.body.description).trim().slice(0, 5000);

    if (req.file) {
      updateData.pdfUrl = `/uploads/${req.file.filename}`;
    }

    const labProgram =
      await LabProgram.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!labProgram) {
      return res.status(404).json({
        message: "Lab program not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "update",
        resourceType: "LabProgram",
        resourceId: labProgram._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: "Lab program updated successfully",
      labProgram,
    });
  } catch (error) {
    console.error(
      "Update Lab Program Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// DELETE LAB PROGRAM
// ==========================================
exports.deleteLabProgram = async (req, res) => {
  try {
    const labProgram =
      await LabProgram.findByIdAndDelete(
        req.params.id
      );

    if (!labProgram) {
      return res.status(200).json({
        message: "Lab program already removed or not found",
        alreadyDeleted: true,
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "delete",
        resourceType: "LabProgram",
        resourceId: req.params.id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: "Lab program deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Lab Program Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// LIKE LAB PROGRAM
// ==========================================
exports.likeLabProgram = async (req, res) => {
  try {
    const { action } = req.body || {};
    const change = action === "unlike" ? -1 : 1;

    let labProgram;
    if (change < 0) {
      labProgram = await LabProgram.findOneAndUpdate(
        { _id: req.params.id, likes: { $gt: 0 } },
        { $inc: { likes: change } },
        { new: true }
      );
      if (!labProgram) {
        labProgram = await LabProgram.findById(req.params.id);
      }
    } else {
      labProgram = await LabProgram.findByIdAndUpdate(
        req.params.id,
        { $inc: { likes: change } },
        { new: true }
      );
    }

    if (!labProgram) {
      return res.status(404).json({
        message: "Lab program not found",
      });
    }

    res.status(200).json(labProgram);
  } catch (error) {
    console.error("Like Lab Program Error:", error);
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
    const labProgram = await LabProgram.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!labProgram) {
      return res.status(404).json({
        message: "Lab program not found",
      });
    }

    res.status(200).json(labProgram);
  } catch (error) {
    console.error("View Lab Program Error:", error);
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
    const labProgram = await LabProgram.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!labProgram) {
      return res.status(404).json({
        message: "Lab program not found",
      });
    }

    res.status(200).json(labProgram);
  } catch (error) {
    console.error("Download Lab Program Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};