const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    branch: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    examType: {
      type: String,
      enum: [
        "Mid-1",
        "Mid-2",
        "Semester",
        "Supply",
      ],
      default: "Semester",
    },

    pdfUrl: {
      type: String,
      required: true,
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

module.exports = mongoose.model(
  "Paper",
  paperSchema
);