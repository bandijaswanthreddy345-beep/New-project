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

    description: {
      type: String,
      default: "",
    },

    pdfUrl: {
      type: String,
      required: true,
    },

    regulation: {
      type: String,
      default: "R23",
    },

    subject: {
      type: String,
      default: "",
    },

    subjectCode: {
      type: String,
      default: "",
    },

    likes: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Syllabus", syllabusSchema);