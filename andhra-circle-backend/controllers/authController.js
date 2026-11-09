const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailjs = require("@emailjs/nodejs");
const { createCaptcha, verifyCaptcha } = require("../services/captchaService");
const {
  isCaptchaRequired,
  recordFailedAttempt,
  clearFailedAttempts,
} = require("../services/loginAttemptService");

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SECURITY: request fields must be plain strings. If someone sends
// {"email": {"$ne": null}} MongoDB would treat it as a query operator
// (NoSQL injection), so everything is coerced/validated first.
const asString = (value) => (typeof value === "string" ? value.trim() : "");

// ==========================================
// CAPTCHA Generation
// ==========================================
exports.getCaptcha = (req, res) => {
  try {
    const captcha = createCaptcha();
    return res.status(200).json({
      success: true,
      captchaToken: captcha.captchaToken,
      captchaSvg: captcha.captchaSvg,
    });
  } catch (error) {
    console.error("CAPTCHA Generation Error:", error);
    return res.status(500).json({
      message: "Failed to generate security verification challenge",
    });
  }
};

// ==========================================
// Register User
// ==========================================
exports.registerUser = async (req, res) => {
  try {
    const name = asString(req.body?.name);
    const email = asString(req.body?.email);
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const captchaToken = asString(req.body?.captchaToken);
    const captchaAnswer = asString(req.body?.captchaAnswer);

    // Verify security CAPTCHA
    const captchaCheck = verifyCaptcha(captchaToken, captchaAnswer);
    if (!captchaCheck.ok) {
      return res.status(400).json({
        message: captchaCheck.message,
      });
    }

    if (!name || name.length > 100) {
      return res.status(400).json({
        message: "Please enter a valid name",
      });
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
      return res.status(400).json({
        message: `Password must be ${MIN_PASSWORD_LENGTH}-128 characters long`,
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // role is NOT taken from the request: everyone registers as a student
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // SECURITY: never send the password hash back to the browser
    res.status(201).json({
      message: "Registration Successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
};

// ==========================================
// Login User
// ==========================================
exports.loginUser = async (req, res) => {
  try {
    const email = asString(req.body?.email);
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const captchaToken = asString(req.body?.captchaToken);
    const captchaAnswer = asString(req.body?.captchaAnswer);

    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";

    // SECURITY: one generic answer for "no such user" and "wrong password"
    // so attackers cannot discover which emails are registered.
    const invalid = (requireCaptcha = false) =>
      res.status(401).json({
        message: "Invalid email or password",
        requireCaptcha,
      });

    // Determine if CAPTCHA challenge is currently required for this client or email
    const captchaRequired = isCaptchaRequired(clientIp, email);

    if (captchaRequired) {
      // Must submit both captcha token and answer
      if (!captchaToken || !captchaAnswer) {
        return invalid(true);
      }

      // Verify CAPTCHA
      const captchaCheck = verifyCaptcha(captchaToken, captchaAnswer);
      if (!captchaCheck.ok) {
        return res.status(400).json({
          message: captchaCheck.message,
          requireCaptcha: true,
        });
      }
    }

    if (!email || !password) {
      const nowRequired = recordFailedAttempt(clientIp, email);
      return invalid(nowRequired);
    }

    const user = await User.findOne({ email });

    if (!user) {
      const nowRequired = recordFailedAttempt(clientIp, email);
      return invalid(nowRequired);
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      const nowRequired = recordFailedAttempt(clientIp, email);
      return invalid(nowRequired);
    }

    // Login successful: reset failed attempt counters for this client and email
    clearFailedAttempts(clientIp, email);

    // Generate JWT Token with Role, passwordChangedAt and tokenVersion
    const tokenPayload = {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    };
    if (user.passwordChangedAt) {
      tokenPayload.passwordChangedAt = user.passwordChangedAt.getTime();
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

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
      message: "Login failed. Please try again.",
    });
  }
};

// ==========================================
// Forgot Password
// ==========================================
exports.forgotPassword = async (req, res) => {
  // Same answer whether or not the email exists (no account enumeration)
  const genericResponse = () =>
    res.status(200).json({
      message:
        "If this email is registered, a password reset link has been sent to it",
    });

  try {
    const email = asString(req.body?.email);

    if (!email) {
      return genericResponse();
    }

    const user = await User.findOne({ email });

    if (!user) {
      return genericResponse();
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before storing in database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    // Token expires after 15 minutes
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // SECURITY: the reset link/token is deliberately NOT logged anymore.
    // Anyone who can read the server logs could otherwise take over accounts.

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

    return genericResponse();
  } catch (error) {
    console.error("Forgot Password Error:", error);

    res.status(500).json({
      message: "Unable to send password reset email",
    });
  }
};

// ==========================================
// Reset Password
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    const token = asString(req.params?.token);
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!token) {
      return res.status(400).json({
        message: "Reset token is missing",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Please enter a new password",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
      return res.status(400).json({
        message: `Password must be ${MIN_PASSWORD_LENGTH}-128 characters long`,
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Token must match AND still be inside its 15 minute window
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Invalidate previously issued login tokens
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    // One-time use: clear the reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Reset failed login attempt counter for this user's email
    clearFailedAttempts("", user.email);

    res.status(200).json({
      message: "Password Reset Successful",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    res.status(500).json({
      message: "Unable to reset password. Please try again.",
    });
  }
};
