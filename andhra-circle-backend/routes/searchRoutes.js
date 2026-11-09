const express = require("express");
const router = express.Router();
const { searchResources } = require("../controllers/searchController");

// ==========================================
// UNIVERSAL SEARCH AGGREGATION PIPELINE
// GET /api/search?q=...&category=...&branch=...&semester=...&sortBy=...
// ==========================================
router.get("/", searchResources);

module.exports = router;
