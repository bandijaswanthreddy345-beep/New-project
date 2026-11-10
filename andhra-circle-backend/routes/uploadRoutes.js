const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");
const { verifyMagicBytes } = require("../middleware/validateUpload");
const recordAuditLog = require("../services/auditLogger");

// ==========================================
// ADMIN ONLY FILE UPLOAD
// POST /api/upload
// ==========================================

router.post(
  "/",
  auth,
  upload.single("file"),
  verifyMagicBytes,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded",
        });
      }

      if (req.user) {
        await recordAuditLog({
          adminId: req.user._id,
          action: "create",
          resourceType: "Upload",
          resourceId: req.file.filename,
          route: req.originalUrl,
          ip: req.ip,
        });
      }

      res.status(200).json({
        message: "File uploaded successfully",
        file: req.file,
      });
    } catch (error) {
      console.error("File Upload Error:", error);

      res.status(500).json({
        message: "File upload failed",
      });
    }
  }
);

module.exports = router;