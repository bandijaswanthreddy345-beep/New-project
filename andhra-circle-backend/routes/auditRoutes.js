const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");

/**
 * GET /api/audit-logs
 * Admin-only paginated list of audit logs
 */
router.get("/", auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("adminId", "name role")
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch audit logs",
    });
  }
});

module.exports = router;
