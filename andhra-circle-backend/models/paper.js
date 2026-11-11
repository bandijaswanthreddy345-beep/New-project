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

paperSchema.plugin(require("./plugins/softDelete"));

paperSchema.index(
  {
    branch: 1,
    semester: 1,
    deletedAt: 1,
    createdAt: -1,
  },
  { name: "PaperBranchSemesterDeletedCreatedIndex" }
);

paperSchema.index(
  {
    title: "text",
    subject: "text",
    examType: "text",
  },
  {
    weights: {
      subject: 10,
      title: 8,
      examType: 3,
    },
    name: "PaperTextIndex",
  }
);

module.exports = mongoose.model(
  "Paper",
  paperSchema
);