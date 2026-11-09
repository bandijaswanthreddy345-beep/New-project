const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getDashboardAnalytics,
} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);
router.get("/analytics", getDashboardAnalytics);

module.exports = router;
