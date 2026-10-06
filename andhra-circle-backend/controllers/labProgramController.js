const LabProgram = require("../models/LabProgram");

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

    const labProgram = await LabProgram.create({
      title: req.body.title,
      branch: req.body.branch,
      semester: req.body.semester,
      subject: req.body.subject,
      subjectCode: req.body.subjectCode,
      description: req.body.description,
      pdfUrl: `/uploads/${req.file.filename}`,
    });

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
    const labPrograms = await LabProgram.find().sort({
      createdAt: -1,
    });

    res.status(200).json(labPrograms);
  } catch (error) {
    console.error("Get Lab Programs Error:", error);

    res.status(500).json({
      message: error.message,
    });
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
    const labProgram =
      await LabProgram.findByIdAndUpdate(
        req.params.id,
        {
          title: req.body.title,
          branch: req.body.branch,
          semester: req.body.semester,
          subject: req.body.subject,
          subjectCode: req.body.subjectCode,
          description: req.body.description,
        },
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
      return res.status(404).json({
        message: "Lab program not found",
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

    const existing = await LabProgram.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Lab program not found",
      });
    }

    const currentLikes =
      typeof existing.likes === "number" && !isNaN(existing.likes)
        ? existing.likes
        : 0;
    const targetLikes = Math.max(0, currentLikes + change);

    const labProgram = await LabProgram.findByIdAndUpdate(
      req.params.id,
      { $set: { likes: targetLikes } },
      { new: true }
    );

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