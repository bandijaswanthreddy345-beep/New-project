const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  getDashboardStats,
  getDashboardAnalytics,
} = require("../controllers/dashboardController");

router.get("/stats", auth, getDashboardStats);
if (typeof getDashboardAnalytics === "function") {
  router.get("/analytics", auth, getDashboardAnalytics);
}

module.exports = router;
