const Note = require("../models/Note");

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
  title: req.body.title,
  branch: req.body.branch,
  semester: req.body.semester,
  subject: req.body.subject,
  subjectCode: req.body.subjectCode,
  description: req.body.description,

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
    const notes = await Note.find().sort({
      createdAt: -1,
    });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
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
      title: req.body.title,
      branch: req.body.branch,
      semester: req.body.semester,
      subject: req.body.subject,
      subjectCode: req.body.subjectCode,
      description: req.body.description,

      module1: req.body.module1,
      module2: req.body.module2,
      module3: req.body.module3,
      module4: req.body.module4,
      module5: req.body.module5,
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
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(note);
  } catch (error) {
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
    await Note.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Note deleted successfully",
    });
  } catch (error) {
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
    const note = await Note.findById(req.params.id);

    note.likes += 1;

    await note.save();

    res.status(200).json(note);
  } catch (error) {
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
    const note = await Note.findById(req.params.id);

    note.views += 1;

    await note.save();

    res.status(200).json(note);
  } catch (error) {
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
    const note = await Note.findById(req.params.id);

    note.downloads += 1;

    await note.save();

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};