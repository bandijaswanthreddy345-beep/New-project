const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// Register User
router.post("/register", registerUser);

// Login User
router.post("/login", loginUser);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password/:token", resetPassword);

module.exports = router;