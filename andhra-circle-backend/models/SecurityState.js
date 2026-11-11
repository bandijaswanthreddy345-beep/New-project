const mongoose = require("mongoose");

const SecurityStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["login_attempt", "captcha_nonce", "ai_daily_cap", "idempotency_key"],
      required: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["in_flight", "completed", "failed"],
      default: undefined,
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// TTL index to automatically purge records once expiresAt has passed
SecurityStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("SecurityState", SecurityStateSchema);
