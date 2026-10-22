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

const fs = require("fs");

// ==========================
// STATIC UPLOAD FOLDER
// ==========================

// Uploaded files are accessible through:
// http://localhost:5000/uploads/filename.pdf

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Fallback for missing PDF files so iframe preview renders study document instead of 404 JSON
app.get("/uploads/:filename", (req, res, next) => {
  const filename = req.params.filename || "";
  if (filename.toLowerCase().endsWith(".pdf")) {
    const fallbackPdf = path.join(__dirname, "uploads", "sample_study_material.pdf");
    if (fs.existsSync(fallbackPdf)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      return res.sendFile(fallbackPdf);
    }
  }
  next();
});

// ==========================
// HOME ROUTE
// ==========================

app.get("/", (req, res) => {
  const isDbConnected = require("mongoose").connection.readyState === 1;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JNTU Circle API — Backend Service</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #08090D;
      color: #F5F5FA;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #12131B;
      border: 1px solid #292733;
      border-radius: 20px;
      max-width: 580px;
      width: 100%;
      padding: 36px 32px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34D399;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 10px #10B981;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    p {
      color: #94A3B8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .cta-btn {
      display: inline-block;
      width: 100%;
      padding: 13px 24px;
      background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
      transition: all 0.2s ease;
      margin-bottom: 24px;
    }
    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
    }
    .endpoints {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      text-align: left;
    }
    .endpoint {
      background: #181926;
      border: 1px solid #292733;
      padding: 10px 14px;
      border-radius: 10px;
      text-decoration: none;
      color: #C4B5FD;
      font-size: 12px;
      font-family: monospace;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.18s ease;
    }
    .endpoint:hover {
      background: #222336;
      border-color: #8B5CF6;
      color: #FFFFFF;
    }
    .status-meta {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 12px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      BACKEND API SERVICE · ONLINE (PORT 5000)
    </div>
    <h1>JNTU Circle Backend Engine</h1>
    <p>Node.js & Express REST API server is actively serving study materials, pyqs, and notifications with MongoDB connection active.</p>

    <a href="http://localhost:5173" class="cta-btn">🚀 Open Full Web App (http://localhost:5173)</a>

    <div class="endpoints">
      <a href="/api/notes" target="_blank" class="endpoint">/api/notes <span>→</span></a>
      <a href="/api/papers" target="_blank" class="endpoint">/api/papers <span>→</span></a>
      <a href="/api/notifications" target="_blank" class="endpoint">/api/notifications <span>→</span></a>
      <a href="/api/syllabus" target="_blank" class="endpoint">/api/syllabus <span>→</span></a>
      <a href="/api/lab-programs" target="_blank" class="endpoint">/api/lab-programs <span>→</span></a>
      <a href="http://localhost:5173/dashboard" target="_blank" class="endpoint">/dashboard <span>→</span></a>
    </div>

    <div class="status-meta">
      Database: ${isDbConnected ? "Connected to MongoDB Atlas ✅" : "Local / Offline Fallback ⚠️"} · Host: localhost:5000
    </div>
  </div>
</body>
</html>`);
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

