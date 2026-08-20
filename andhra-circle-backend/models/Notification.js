const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Exam",
        "Results",
        "Circular",
        "Placement",
        "Holiday",
        "General",
      ],
      default: "General",
    },

    link: {
      type: String,
      default: "",
    },

    publishedDate: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);