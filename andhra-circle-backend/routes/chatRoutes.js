const express = require("express");
const router = express.Router();

const { rateLimit } = require("../middleware/rateLimit");
const auth = require("../middleware/auth");
const {
  chat,
  submitFeedback,
  getFeedbackStats,
} = require("../controllers/chatController");

// Public (students ask without logging in), but limited per visitor.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: "You are asking too fast. Please wait a minute.",
});

// Feedback limiter to prevent spamming votes
const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many feedback submissions. Please slow down.",
});

// Main chat query (Public)
router.post("/", chatLimiter, chat);

// Thumbs up / down feedback submission (Public)
router.post("/feedback", feedbackLimiter, submitFeedback);

// Admin feedback statistics (Admin only)
router.get("/feedback", auth, getFeedbackStats);

module.exports = router;
