const mongoose = require("mongoose");

const userMaterialSchema = new mongoose.Schema(
  {
    materialType: {
      type: String,
      enum: [
        "notes",
        "syllabus",
        "question-papers",
        "academic-report",
        "lab-manual",
      ],
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    capturedFrom: {
      type: String,
      default: "upload-materials-modal",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.UserMaterial ||
  mongoose.model("UserMaterial", userMaterialSchema);
