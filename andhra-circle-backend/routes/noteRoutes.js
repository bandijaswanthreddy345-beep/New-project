const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const { verifyMagicBytes } = require("../middleware/validateUpload");

const {
  createNote,
  getNotes,
  getBranchStats,
  getTrendingMaterials,
  getRelatedMaterials,
  getNoteById,
  updateNote,
  deleteNote,
  likeNote,
  increaseViews,
  increaseDownloads,
} = require("../controllers/noteController");

// ==========================================
// GET ALL NOTES
// ==========================================

router.get("/", getNotes);

// ==========================================
// GET BRANCH STATS (FOR 3D CARDS & CATALOG) - AGGREGATION PIPELINE
// ==========================================

router.get("/branch-stats", getBranchStats);

// ==========================================
// GET TRENDING MATERIALS - AGGREGATION PIPELINE
// ==========================================

router.get("/trending", getTrendingMaterials);

// ==========================================
// GET RELATED MATERIALS - AGGREGATION PIPELINE WITH $LOOKUP
// ==========================================

router.get("/:id/related", getRelatedMaterials);

// ==========================================
// GET SINGLE NOTE
// ==========================================

router.get("/:id", validateObjectId("id"), getNoteById);

// ==========================================
// CREATE NOTE
// ==========================================

router.post(
  "/",
  auth,
  upload.fields([
    {
      name: "pdf",
      maxCount: 1,
    },

    {
      name: "module1Pdf",
      maxCount: 1,
    },

    {
      name: "module2Pdf",
      maxCount: 1,
    },

    {
      name: "module3Pdf",
      maxCount: 1,
    },

    {
      name: "module4Pdf",
      maxCount: 1,
    },

    {
      name: "module5Pdf",
      maxCount: 1,
    },

    {
      name: "image",
      maxCount: 1,
    },
  ]),
  verifyMagicBytes,
  createNote
);

// ==========================================
// UPDATE NOTE
// ==========================================

router.put(
  "/:id",
  auth,
  validateObjectId("id"),
  upload.fields([
    {
      name: "pdf",
      maxCount: 1,
    },

    {
      name: "module1Pdf",
      maxCount: 1,
    },

    {
      name: "module2Pdf",
      maxCount: 1,
    },

    {
      name: "module3Pdf",
      maxCount: 1,
    },

    {
      name: "module4Pdf",
      maxCount: 1,
    },

    {
      name: "module5Pdf",
      maxCount: 1,
    },

    {
      name: "image",
      maxCount: 1,
    },
  ]),
  verifyMagicBytes,
  updateNote
);

// ==========================================
// DELETE NOTE
// ==========================================

router.delete("/:id", auth, validateObjectId("id"), deleteNote);

// ==========================================
// LIKE NOTE
// ==========================================

router.put("/:id/like", validateObjectId("id"), likeNote);

// ==========================================
// INCREASE VIEWS
// ==========================================

router.put("/:id/view", validateObjectId("id"), increaseViews);

// ==========================================
// INCREASE DOWNLOADS
// ==========================================

router.put("/:id/download", validateObjectId("id"), increaseDownloads);

module.exports = router;