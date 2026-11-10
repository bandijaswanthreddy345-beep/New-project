const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");

const connectDB = require("./config/db");

const securityHeaders = require("./middleware/securityHeaders");
const { rateLimit } = require("./middleware/rateLimit");

const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const auditRoutes = require("./routes/auditRoutes");

// Admin authentication middleware
const auth = require("./middleware/auth");

// ==========================
// LOAD ENVIRONMENT VARIABLES
// ==========================

dotenv.config({ path: path.join(__dirname, ".env") });


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

// Trust proxy setting:
// Behind a reverse proxy (e.g. Nginx, Cloudflare, Render, Railway, Vercel), TRUST_PROXY must be set
// so that rate limiting and HTTPS redirects see the client's real IP instead of the proxy's IP.
if (process.env.TRUST_PROXY) {
  const val = process.env.TRUST_PROXY.trim().toLowerCase();
  if (val === "true") {
    app.set("trust proxy", true);
  } else if (val === "false") {
    app.set("trust proxy", false);
  } else if (!isNaN(Number(val))) {
    app.set("trust proxy", Number(val));
  } else {
    app.set("trust proxy", process.env.TRUST_PROXY.trim());
  }
}

// In production, redirect plain HTTP to HTTPS when x-forwarded-proto says it was HTTP
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"];
    if (proto && proto.toLowerCase() === "http") {
      const host = req.headers.host;
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    next();
  });
}

app.use(securityHeaders);
app.use(compression({ threshold: 1024 }));

// Enable CORS.
// In production set CORS_ORIGINS in .env to your website address(es),
// comma separated, e.g. CORS_ORIGINS=https://jntucircle.com
// When it is not set every origin is allowed (needed for local/phone testing).
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  console.error(
    "FATAL: CORS_ORIGINS is missing or empty. Set your domain(s) in .env in production."
  );
  process.exit(1);
}

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
    maxAge: "7d",
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");

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
// AUDIT LOGS (ADMIN ONLY)
// ==========================

app.use(
  "/api/audit-logs",
  auth,
  auditRoutes
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

  // Mongoose CastError (invalid ObjectId) returns clean 400
  if (err.name === "CastError" || err.kind === "ObjectId") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  const statusCode = err.status || err.statusCode || 500;
  const message =
    isProd && statusCode >= 500
      ? "Internal server error"
      : (err.message || "Internal server error");

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProd ? {} : { stack: err.stack }),
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

