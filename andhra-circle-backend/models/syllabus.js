const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    branch: {
      type: String,
      required: true,
    },

    semester: {
      type: String,
      required: true,
    },

    pdfUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Syllabus", syllabusSchema);