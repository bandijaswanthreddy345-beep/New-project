const mongoose = require("mongoose");

const labProgramSchema = new mongoose.Schema(
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

    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
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

labProgramSchema.plugin(require("./plugins/softDelete"));

labProgramSchema.index(
  {
    branch: 1,
    semester: 1,
    deletedAt: 1,
    createdAt: -1,
  },
  { name: "LabProgramBranchSemesterDeletedCreatedIndex" }
);

labProgramSchema.index(
  {
    title: "text",
    subject: "text",
    subjectCode: "text",
    description: "text",
  },
  {
    weights: {
      subjectCode: 10,
      subject: 8,
      title: 6,
      description: 4,
    },
    name: "LabProgramTextIndex",
  }
);

module.exports = mongoose.model(
  "LabProgram",
  labProgramSchema
);