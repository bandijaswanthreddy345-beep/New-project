const express = require("express");
const router = express.Router();
const { getHomeFeed } = require("../controllers/feedController");

// Public consolidated home feed route
router.get("/home", getHomeFeed);

module.exports = router;
