const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const validateObjectId = require("../middleware/validateObjectId");

const {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  likeNotification,
  increaseViews,
  increaseDownloads,
  syncJntua,
  proxyPdf,
} = require("../controllers/notificationController");

// PDF proxy fetches remote files for the visitor: keep it on a tight leash
router.get(
  "/proxy-pdf",
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  proxyPdf
);

// GET /sync is public (throttled inside the service); POST /sync is admin-only
router.get("/sync", rateLimit({ windowMs: 60 * 1000, max: 10 }), syncJntua);
router.post("/sync", auth, syncJntua);

router.get("/", getNotifications);
router.get("/:id", validateObjectId("id"), getNotificationById);

// ADMIN ONLY: create / edit / delete
router.post("/", auth, createNotification);
router.put("/:id", auth, validateObjectId("id"), updateNotification);
router.delete("/:id", auth, validateObjectId("id"), deleteNotification);

// PUBLIC counters
router.put("/:id/like", validateObjectId("id"), likeNotification);
router.put("/:id/view", validateObjectId("id"), increaseViews);
router.put("/:id/download", validateObjectId("id"), increaseDownloads);

module.exports = router;
