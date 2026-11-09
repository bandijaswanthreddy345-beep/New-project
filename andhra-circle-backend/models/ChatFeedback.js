const mongoose = require("mongoose");

const chatFeedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: String,
      enum: ["up", "down"],
      required: true,
    },
    questionHash: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.ChatFeedback ||
  mongoose.model("ChatFeedback", chatFeedbackSchema);
