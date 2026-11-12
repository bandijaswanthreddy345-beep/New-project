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
// HEALTH ENDPOINTS (/healthz & /readyz)
// ==========================

// Process alive check (cheap, public, no sensitive data)
app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// MongoDB readiness check with short 2s timeout
app.get("/readyz", async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    return res.status(503).json({
      status: "unavailable",
      message: "Database connection not ready",
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
    });
  } catch (err) {
    logger.warn("Readiness check ping failed", { error: err.message });
    return res.status(503).json({
      status: "unavailable",
      message: "Database ping failed",
    });
  }
});

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
// In production set CORS_ORIGINS in .env to your website address(es),
// comma separated, e.g. CORS_ORIGINS=https://jntucircle.com
// When it is not set every origin is allowed (needed for local/phone testing).
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  logger.error(
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
// API ROUTES (v1 & Backward-Compatible /api)
// ==========================

const apiRouter = express.Router();

apiRouter.use("/auth", require("./routes/authRoutes"));
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

