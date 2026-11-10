const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const { verifyMagicBytes } = require("../middleware/validateUpload");

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
router.get("/:id", validateObjectId("id"), getPaperById);

// ==========================================
// CREATE PAPER
// ==========================================
router.post(
  "/",
  auth,
  upload.single("file"),
  verifyMagicBytes,
  createPaper
);

// ==========================================
// UPDATE PAPER
// ==========================================
router.put(
  "/:id",
  auth,
  validateObjectId("id"),
  upload.single("file"),
  verifyMagicBytes,
  updatePaper
);

// ==========================================
// DELETE PAPER
// ==========================================
router.delete(
  "/:id",
  auth,
  validateObjectId("id"),
  deletePaper
);

// ==========================================
// LIKE PAPER
// ==========================================
router.put("/:id/like", validateObjectId("id"), likePaper);

// ==========================================
// INCREASE VIEW COUNT
// ==========================================
router.put("/:id/view", validateObjectId("id"), increaseViews);

// ==========================================
// INCREASE DOWNLOAD COUNT
// ==========================================
router.put("/:id/download", validateObjectId("id"), increaseDownloads);

module.exports = router;

