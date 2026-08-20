const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");

// Admin authentication middleware
const auth = require("./middleware/auth");

// ==========================
// LOAD ENVIRONMENT VARIABLES
// ==========================

dotenv.config();

// ==========================
// CONNECT DATABASE
// ==========================

connectDB();

// ==========================
// CREATE EXPRESS APP
// ==========================

const app = express();

// ==========================
// MIDDLEWARE
// ==========================

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Parse URL-encoded requests
app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==========================
// STATIC UPLOAD FOLDER
// ==========================

// Uploaded files are accessible through:
// http://localhost:5000/uploads/filename.pdf

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ==========================
// HOME ROUTE
// ==========================

app.get("/", (req, res) => {
  res.send("🚀 Andhra Circle API Running");
});

// ==========================
// API ROUTES
// ==========================

// ==========================
// AUTHENTICATION
// ==========================

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

// ==========================
// FILE UPLOAD
// ==========================

app.use(
  "/api/upload",
  require("./routes/uploadRoutes")
);

// ==========================
// NOTES
// ==========================

app.use(
  "/api/notes",
  require("./routes/noteRoutes")
);

// ==========================
// QUESTION PAPERS
// ==========================

app.use(
  "/api/papers",
  require("./routes/paperRoutes")
);

// ==========================
// NOTIFICATIONS
// ==========================

app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);

// ==========================
// SYLLABUS
// ==========================

app.use(
  "/api/syllabus",
  require("./routes/syllabusRoutes")
);

// ==========================
// LAB PROGRAMS
// ==========================

app.use(
  "/api/lab-programs",
  require("./routes/labProgramRoutes")
);

// ==========================
// COMMENTS
// ==========================

app.use(
  "/api/comments",
  commentRoutes
);

// ==========================
// ADMIN ONLY ROUTES
// ==========================

// ==========================
// DASHBOARD
// ==========================

app.use(
  "/api/dashboard",
  auth,
  dashboardRoutes
);

// ==========================
// MANAGE USERS
// ==========================

app.use(
  "/api/users",
  auth,
  userRoutes
);

// ==========================
// 404 HANDLER
// ==========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.message || "Internal server error",
  });
});

// ==========================
// SERVER
// ==========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log("=================================");
});

