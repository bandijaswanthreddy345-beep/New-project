const Paper = require("../models/Paper");

// ==========================================
// CREATE PAPER
// ==========================================

exports.createPaper = async (req, res) => {
  try {
    const paper = await Paper.create({
      title: req.body.title,
      branch: req.body.branch,
      semester: req.body.semester,
      subject: req.body.subject,
      year: req.body.year,
      examType: req.body.examType,
      pdfUrl: `/uploads/${req.file.filename}`,

      likes: 0,
      views: 0,
      downloads: 0,
    });

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
    const papers = await Paper.find().sort({
      createdAt: -1,
    });

    res.status(200).json(papers);
  } catch (error) {
    console.error("Get Papers Error:", error);

    res.status(500).json({
      message: error.message,
    });
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
    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
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
      { new: true }
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
      { new: true }
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
      { new: true }
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