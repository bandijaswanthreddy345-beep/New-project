const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");

const {
  createPaper,
  getPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  likePaper,
  increaseViews,
  increaseDownloads,
} = require("../controllers/paperController");

// ==========================================
// GET ALL PAPERS
// ==========================================
router.get("/", getPapers);

// ==========================================
// GET SINGLE PAPER
// ==========================================
router.get("/:id", getPaperById);

// ==========================================
// CREATE PAPER
// ==========================================
router.post(
  "/",
  auth,
  upload.single("file"),
  createPaper
);

// ==========================================
// UPDATE PAPER
// ==========================================
router.put(
  "/:id",
  auth,
  upload.single("file"),
  updatePaper
);

// ==========================================
// DELETE PAPER
// ==========================================
router.delete(
  "/:id",
  auth,
  deletePaper
);

// ==========================================
// LIKE PAPER
// ==========================================
router.put("/:id/like", likePaper);

// ==========================================
// INCREASE VIEW COUNT
// ==========================================
router.put("/:id/view", increaseViews);

// ==========================================
// INCREASE DOWNLOAD COUNT
// ==========================================
router.put("/:id/download", increaseDownloads);

module.exports = router;

