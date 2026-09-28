const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC DETAILS
    // ==========================================

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
      default: "",
      trim: true,
    },

    subjectCode: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // CREDITS
    // ==========================================

    credits: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // MODULE CONTENT
    // ==========================================

    module1: {
      type: String,
      default: "",
      trim: true,
    },

    module2: {
      type: String,
      default: "",
      trim: true,
    },

    module3: {
      type: String,
      default: "",
      trim: true,
    },

    module4: {
      type: String,
      default: "",
      trim: true,
    },

    module5: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // MODULE PDF FILES
    // ==========================================

    module1Pdf: {
      type: String,
      default: "",
    },

    module2Pdf: {
      type: String,
      default: "",
    },

    module3Pdf: {
      type: String,
      default: "",
    },

    module4Pdf: {
      type: String,
      default: "",
    },

    module5Pdf: {
      type: String,
      default: "",
    },

    // ==========================================
    // MAIN FILES
    // ==========================================

    // Main PDF is no longer required.
    // Each module has its own PDF instead.

    pdfUrl: {
      type: String,
      default: "",
    },

    // Banner/image is optional.
    imageUrl: {
      type: String,
      default: "",
    },

    // ==========================================
    // STATISTICS
    // ==========================================

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

module.exports =
  mongoose.models.Note ||
  mongoose.model("Note", noteSchema);