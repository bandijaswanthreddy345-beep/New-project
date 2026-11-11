const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    // Session hardening: timestamp and version of the last password modification
    // Used to invalidate JWTs issued prior to password reset
    passwordChangedAt: {
      type: Date,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    // Admin Two-Factor Authentication (TOTP)
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      default: null,
    },

    twoFactorRecoveryCodes: {
      type: [String],
      default: [],
    },

    // Forgot Password
    resetPasswordToken: {
      type: String,
    },

    // Reset Token Expiry
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
