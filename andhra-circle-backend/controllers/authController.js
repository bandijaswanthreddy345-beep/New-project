const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailjs = require("@emailjs/nodejs");

// ==========================================
// Register User
// ==========================================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Registration Successful",
      user,
    });
  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Login User
// ==========================================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    // Generate JWT Token with Role
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Forgot Password
// ==========================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate random reset token
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Hash token before storing in database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token
    user.resetPasswordToken = hashedToken;

    // Token expires after 15 minutes
    user.resetPasswordExpire =
      new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    // Create frontend reset URL
    const resetUrl =
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    console.log("-----------------------------------");
    console.log("PASSWORD RESET REQUEST");
    console.log("User Email:", user.email);
    console.log("Reset URL:", resetUrl);
    console.log("Token:", resetToken);
    console.log("Hashed Token:", hashedToken);
    console.log(
      "Token Expiry:",
      user.resetPasswordExpire
    );
    console.log("-----------------------------------");

    // ==========================================
    // Send Email using EmailJS
    // ==========================================
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        email: user.email,
        link: resetUrl,
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log(
      "Password reset email sent to:",
      user.email
    );

    res.status(200).json({
      message:
        "Password reset link has been sent to your email",
    });
  } catch (error) {
    console.error(
      "Forgot Password Error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to send password reset email",
    });
  }
};

// ==========================================
// Reset Password
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log("-----------------------------------");
    console.log("RESET PASSWORD REQUEST");
    console.log("Token received:", token);
    console.log(
      "Password received:",
      password ? "YES" : "NO"
    );

    // Check token
    if (!token) {
      console.log("❌ Token is missing");

      return res.status(400).json({
        message: "Reset token is missing",
      });
    }

    // Check password
    if (!password) {
      console.log("❌ Password is missing");

      return res.status(400).json({
        message: "Please enter a new password",
      });
    }

    // Hash received token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    console.log(
      "Hashed token received:",
      hashedToken
    );

    // ==========================================
    // Find user using reset token
    // ==========================================
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
    });

    // User not found
    if (!user) {
      console.log(
        "❌ No user found with this reset token"
      );

      return res.status(400).json({
        message: "Invalid reset token",
      });
    }

    console.log(
      "✅ User found:",
      user.email
    );

    console.log(
      "Token expiry:",
      user.resetPasswordExpire
    );

    console.log(
      "Current time:",
      new Date()
    );

    // ==========================================
    // Check Token Expiry
    // ==========================================
    if (
      !user.resetPasswordExpire ||
      user.resetPasswordExpire.getTime() <
        Date.now()
    ) {
      console.log("❌ Reset token has expired");

      return res.status(400).json({
        message: "Reset token has expired",
      });
    }

    console.log("✅ Reset token is valid");

    // ==========================================
    // Hash New Password
    // ==========================================
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    // ==========================================
    // Update Password
    // ==========================================
    user.password = hashedPassword;

    // Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log(
      "✅ Password reset successful for:",
      user.email
    );

    console.log("-----------------------------------");

    res.status(200).json({
      message: "Password Reset Successful",
    });
  } catch (error) {
    console.error(
      "Reset Password Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};