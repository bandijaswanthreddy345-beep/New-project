const Syllabus = require("../models/syllabus");

// Create Syllabus
exports.createSyllabus = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    const syllabus = await Syllabus.create({
      title: req.body.title,
      branch: req.body.branch,
      semester: req.body.semester,
      description: req.body.description || "",
      pdfUrl: `/uploads/${req.file.filename}`,
    });

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
    const syllabus = await Syllabus.find().sort({ createdAt: -1 });

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
    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

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

// Delete Syllabus
exports.deleteSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findByIdAndDelete(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
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
      { new: true }
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
      { new: true }
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
      { new: true }
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