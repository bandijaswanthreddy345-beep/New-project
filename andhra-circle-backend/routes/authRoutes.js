const express = require("express");

const router = express.Router();

const { rateLimit } = require("../middleware/rateLimit");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCaptcha,
} = require("../controllers/authController");

// Brute-force protection: 10 FAILED logins per IP per 15 minutes
// (successful logins do not count, so shared campus Wi-Fi is not locked out)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessful: true,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

// Registration and password-reset emails are limited to stop abuse / spam
const accountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many requests. Please try again in an hour.",
});

// Captcha challenge requests (30 requests per minute per IP)
const captchaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many verification requests. Please wait a moment.",
});

// Generate Security CAPTCHA Challenge
router.get("/captcha", captchaLimiter, getCaptcha);

// Register User
router.post("/register", accountLimiter, registerUser);

// Login User
router.post("/login", loginLimiter, loginUser);

// Forgot Password
router.post("/forgot-password", accountLimiter, forgotPassword);

// Reset Password
router.post("/reset-password/:token", accountLimiter, resetPassword);

module.exports = router;
