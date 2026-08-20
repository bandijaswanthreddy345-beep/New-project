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
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    paper.likes += 1;

    await paper.save();

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
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    paper.views += 1;

    await paper.save();

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
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        message: "Paper not found",
      });
    }

    paper.downloads += 1;

    await paper.save();

    res.status(200).json(paper);
  } catch (error) {
    console.error("Download Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};