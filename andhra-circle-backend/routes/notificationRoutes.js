const express = require("express");
const router = express.Router();

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

router.get("/proxy-pdf", proxyPdf);
router.get("/sync", syncJntua);
router.post("/sync", syncJntua);

router.get("/", getNotifications);
router.get("/:id", getNotificationById);

router.post("/", createNotification);

router.put("/:id", updateNotification);

router.delete("/:id", deleteNotification);

router.put("/:id/like", likeNotification);
router.put("/:id/view", increaseViews);
router.put("/:id/download", increaseDownloads);

module.exports = router;