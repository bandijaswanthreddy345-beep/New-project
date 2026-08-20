const Syllabus = require("../models/Syllabus");

// Create Syllabus
exports.createSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.create({
      title: req.body.title,
      branch: req.body.branch,
      semester: req.body.semester,
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
    const syllabus = await Syllabus.find().sort({ createdAt: -1 });

    res.json(syllabus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
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