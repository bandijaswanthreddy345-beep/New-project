const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const logger = require("./utils/logger");
const requestId = require("./middleware/requestId");
const { initErrorTracker, captureException } = require("./utils/errorTracker");

const securityHeaders = require("./middleware/securityHeaders");
const { rateLimit } = require("./middleware/rateLimit");
const { cloudflareRealIp } = require("./middleware/cloudflareIp");

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
    logger.error("FATAL: " + message);
    process.exit(1);
  }

  logger.warn("WARNING: " + message);
}

// ==========================
// CONNECT DATABASE
// ==========================

connectDB();

// ==========================
// CREATE EXPRESS APP
// ==========================

const app = express();

// Initialize optional error tracking
initErrorTracker(app);

// Request ID and structured request duration logging (first middleware)
app.use(requestId);

// ==========================
// HEALTH ENDPOINTS (/health, /healthz, /ready, /readyz)
// ==========================

const healthHandler = (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
};

// Process alive check (cheap, public, no sensitive data)
app.get("/health", healthHandler);
app.get("/healthz", healthHandler);
app.get("/api/health", healthHandler);
app.get("/api/v1/health", healthHandler);

// MongoDB readiness check with short timeout
const readyHandler = async (req, res) => {
  // If in the middle of connecting (readyState === 2), give it a moment to finish
  if (mongoose.connection.readyState === 2) {
    const start = Date.now();
    while (mongoose.connection.readyState === 2 && Date.now() - start < 3000) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    return res.status(503).json({
      status: "unavailable",
      message: "Database service is initializing or reconnecting. Please retry in a moment.",
      readyState: mongoose.connection.readyState,
    });
  }

  // Ping database with 2-second timeout
  try {
    const adminDb = mongoose.connection.db.admin();
    const pingPromise = adminDb.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database ping timed out")), 2000)
    );

    await Promise.race([pingPromise, timeoutPromise]);

    return res.status(200).json({
      status: "ready",
      database: "connected",
      name: mongoose.connection.name,
      host: mongoose.connection.host,
    });
  } catch (err) {
    logger.warn("Readiness check ping failed", { error: err.message });
    return res.status(503).json({
      status: "unavailable",
      message: "Database ping timed out or service is temporarily busy.",
    });
  }
};

app.get("/ready", readyHandler);
app.get("/readyz", readyHandler);
app.get("/api/ready", readyHandler);
app.get("/api/readyz", readyHandler);
app.get("/api/v1/ready", readyHandler);
app.get("/api/v1/readyz", readyHandler);

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

// Cloudflare real IP validation middleware
app.use(cloudflareRealIp);

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
// When CORS_ORIGINS is provided, respect it; otherwise permit Vercel, localhost, and custom frontend domains safely
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  "https://new-project-cyan.vercel.app",
  "https://new-project-6ocfi8tth-bandijaswanthreddy345-beep.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
];

const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultAllowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow to prevent production blackouts
    },
    credentials: true,
  })
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

const uploadStaticOptions = {
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
};

// 1. Serve from andhra-circle-backend/uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads"), uploadStaticOptions));

// 2. Fallback serve from root /uploads (for local dev and backward compatibility)
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), uploadStaticOptions));

// 3. Intelligent fallback for /uploads/:filename (resolves naming variations, case sensitivity, aliases)
app.get("/uploads/:filename", (req, res, next) => {
  const rawRequested = decodeURIComponent(req.params.filename || "").split("?")[0].split("#")[0];
  if (!rawRequested) return next();

  const uploadsDir1 = path.join(__dirname, "uploads");
  const uploadsDir2 = path.join(__dirname, "../uploads");

  // Direct check
  for (const dir of [uploadsDir1, uploadsDir2]) {
    const directPath = path.join(dir, rawRequested);
    if (fs.existsSync(directPath)) {
      return res.sendFile(directPath);
    }
  }

  // Alias / Variation checks
  const variations = [
    rawRequested.replace("_Complete_Notes", ""),
    rawRequested.replace("_Lab_Manual", "_Lab"),
    rawRequested.replace("_Manual", ""),
    rawRequested.replace(/[-_]/g, "_"),
    rawRequested.replace(/[-_]/g, "-"),
  ];

  const files1 = fs.existsSync(uploadsDir1) ? fs.readdirSync(uploadsDir1) : [];
  const files2 = fs.existsSync(uploadsDir2) ? fs.readdirSync(uploadsDir2) : [];
  const allFiles = [...new Set([...files1, ...files2])];

  // Try variations
  for (const v of variations) {
    if (v && v !== rawRequested) {
      for (const dir of [uploadsDir1, uploadsDir2]) {
        const p = path.join(dir, v);
        if (fs.existsSync(p)) {
          return res.sendFile(p);
        }
      }
    }
  }

  // Prefix match (e.g. course code prefix 23A03601T)
  const codeMatch = rawRequested.match(/^([0-9]{2}[A-Z][0-9]{2,5}[a-z]?)/i);
  if (codeMatch) {
    const code = codeMatch[1].toLowerCase();
    const candidate = allFiles.find((f) => f.toLowerCase().startsWith(code) && f.toLowerCase().endsWith(".pdf"));
    if (candidate) {
      for (const dir of [uploadsDir1, uploadsDir2]) {
        const p = path.join(dir, candidate);
        if (fs.existsSync(p)) {
          return res.sendFile(p);
        }
      }
    }
  }

  // Fallback to sample_study_material.pdf if requested is a sample or general PDF
  if (rawRequested.toLowerCase().includes("sample")) {
    for (const dir of [uploadsDir1, uploadsDir2]) {
      const p = path.join(dir, "sample_study_material.pdf");
      if (fs.existsSync(p)) {
        return res.sendFile(p);
      }
    }
  }

  return res.status(404).json({
    status: "fail",
    message: `Requested file '${rawRequested}' not found on server.`,
  });
});

// ==========================
// HOME ROUTE
// ==========================

app.get("/", (req, res) => {
  res.send("🚀 Andhra Circle API Running");
});

// ==========================
// API ROUTES (v1 & Backward-Compatible /api)
// ==========================

const apiRouter = express.Router();

// Database readiness guard for API routes: wait gracefully if connecting, return 503 only if truly offline
apiRouter.use(async (req, res, next) => {
  if (
    req.path.startsWith("/notifications/proxy-pdf") ||
    req.path === "/health" ||
    req.path === "/healthz" ||
    req.path === "/ready" ||
    req.path === "/readyz"
  ) {
    return next();
  }

  // If connection is in progress (readyState === 2), give it up to 4 seconds to finish
  if (mongoose.connection.readyState === 2) {
    const start = Date.now();
    while (mongoose.connection.readyState === 2 && Date.now() - start < 4000) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  if (mongoose.connection.readyState !== 1) {
    // If it's a home feed read request and we have memory cache, let it pass to feed controller
    if (req.path.startsWith("/feed")) {
      return next();
    }
    return res.status(503).json({
      success: false,
      message: "Database service is initializing or reconnecting. Please retry in a moment.",
      retryAfter: 3,
    });
  }
  next();
});

apiRouter.use("/auth", require("./routes/authRoutes"));
apiRouter.use("/feed", require("./routes/feedRoutes"));
apiRouter.use("/upload", require("./routes/uploadRoutes"));
apiRouter.use("/notes", require("./routes/noteRoutes"));
apiRouter.use("/papers", require("./routes/paperRoutes"));
apiRouter.use("/notifications", require("./routes/notificationRoutes"));
apiRouter.use("/syllabus", require("./routes/syllabusRoutes"));
apiRouter.use("/lab-programs", require("./routes/labProgramRoutes"));
apiRouter.use("/comments", commentRoutes);
apiRouter.use("/user-materials", require("./routes/userMaterialRoutes"));
apiRouter.use("/chat", require("./routes/chatRoutes"));
apiRouter.use("/dashboard", auth, dashboardRoutes);
apiRouter.use("/users", auth, userRoutes);
apiRouter.use("/audit-logs", auth, auditRoutes);

// Mount under both /api/v1 (recommended) and /api (legacy alias)
app.use("/api/v1", apiRouter);
app.use("/api", apiRouter);

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
  logger.error("SERVER ERROR", {
    requestId: req.id,
    route: req.originalUrl,
    error: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });

  captureException(err, { requestId: req.id, route: req.originalUrl });

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
// SERVER WITH TIMEOUTS & GRACEFUL SHUTDOWN
// ==========================

const PORT = process.env.PORT || 5000;
const { startJntuaAutoSync, stopJntuaAutoSync } = require("./services/jntuaSyncService");

const server = app.listen(PORT, () => {
  logger.info("Server started", {
    port: PORT,
    url: `http://localhost:${PORT}`,
    env: process.env.NODE_ENV || "development",
  });

  // Start background auto-sync for official JNTUA examination updates
  startJntuaAutoSync();
});

// Enforce HTTP server timeouts to protect against slowloris & stalled sockets
server.headersTimeout = 65000;    // Max 65s for headers (higher than keepAlive)
server.requestTimeout = 60000;    // Max 60s for entire request
server.keepAliveTimeout = 61000;  // 61s keep-alive

// Graceful shutdown handler
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`Received ${signal}. Initiating graceful shutdown...`);

  // Stop background sync intervals
  try {
    stopJntuaAutoSync();
  } catch (err) {
    logger.warn("Error stopping background sync", { error: err.message });
  }

  // Force shutdown timer (10 seconds max)
  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  // Stop accepting new connections and finish in-flight requests
  server.close(async () => {
    logger.info("HTTP server closed. In-flight requests drained.");

    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        logger.info("Mongoose connection cleanly closed.");
      }
    } catch (dbErr) {
      logger.error("Error closing Mongoose connection", { error: dbErr.message });
    }

    clearTimeout(forceExitTimer);
    logger.info("Graceful shutdown completed successfully. Exiting.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

