const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const securityHeaders = require("./middleware/securityHeaders");
const { rateLimit } = require("./middleware/rateLimit");

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
// SECURITY: REFUSE TO RUN WITH A WEAK JWT SECRET
// A guessable secret lets anyone forge an admin login token.
// Generate one with:
//   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
// ==========================

const jwtSecret = process.env.JWT_SECRET || "";
const weakSecret =
  jwtSecret.length < 32 || /my_super_secret|changeme|secret_key/i.test(jwtSecret);

if (weakSecret) {
  const message =
    "JWT_SECRET is missing or weak. Set a random value of at least 32 characters in .env";

  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: " + message);
    process.exit(1);
  }

  console.warn("WARNING: " + message);
}

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

// Do not advertise the framework to scanners
app.disable("x-powered-by");

// If this runs behind a reverse proxy (Nginx, Render, Railway...), uncomment
// so rate limits see each visitor's real IP instead of the proxy's:
// app.set("trust proxy", 1);

app.use(securityHeaders);

// Enable CORS.
// In production set CORS_ORIGINS in .env to your website address(es),
// comma separated, e.g. CORS_ORIGINS=https://jntucircle.com
// When it is not set every origin is allowed (needed for local/phone testing).
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors(
    allowedOrigins.length
      ? { origin: allowedOrigins }
      : undefined
  )
);

// Overall limit per IP (stops simple floods). Generous on purpose: many
// students can share one campus Wi-Fi address. Image/PDF files are exempt.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 600,
    skip: (req) => req.path.startsWith("/uploads"),
  })
);

// Parse JSON requests (small body limit; uploads use multer, not JSON)
app.use(express.json({ limit: "1mb" }));

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

const SAFE_UPLOAD_TYPES = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    dotfiles: "deny",
    index: false,
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");

      // Anything that is not a plain PDF/image (e.g. an old .html upload)
      // is forced to download so it can never run as a web page.
      if (!SAFE_UPLOAD_TYPES.has(path.extname(filePath).toLowerCase())) {
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  })
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
// USER POSTED MATERIALS
// ==========================

app.use(
  "/api/user-materials",
  require("./routes/userMaterialRoutes")
);

// ==========================
// AI CHAT (Gemini)
// ==========================

app.use(
  "/api/chat",
  require("./routes/chatRoutes")
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

  // Start background auto-sync for official JNTUA examination updates
  const { startJntuaAutoSync } = require("./services/jntuaSyncService");
  startJntuaAutoSync();
});

