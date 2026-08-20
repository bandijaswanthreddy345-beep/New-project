const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
try {
// Get token from Authorization header
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({
    message: "No token provided. Please login.",
  });
}

// Extract token
const token = authHeader.split(" ")[1];

// Verify JWT
const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET
);

// Find user in database
const user = await User.findById(decoded.id).select(
  "-password -resetPasswordToken -resetPasswordExpire"
);

if (!user) {
  return res.status(401).json({
    message: "User not found.",
  });
}

// Only allow admin users
if (user.role !== "admin") {
  return res.status(403).json({
    message: "Access denied. Admin only.",
  });
}

// Attach user to request
req.user = user;

next();

} catch (error) {
console.error("Auth Middleware Error:", error);

return res.status(401).json({
  message: "Invalid or expired token.",
});

}
};

module.exports = auth;