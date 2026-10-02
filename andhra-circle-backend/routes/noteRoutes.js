const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");

const {
  createNote,
  getNotes,
  getBranchStats,
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
// GET BRANCH STATS (FOR 3D CARDS & CATALOG)
// ==========================================

router.get("/branch-stats", getBranchStats);

// ==========================================
// GET SINGLE NOTE
// ==========================================

router.get("/:id", getNoteById);

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
  createNote
);

// ==========================================
// UPDATE NOTE
// ==========================================

router.put(
  "/:id",
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
  updateNote
);

// ==========================================
// DELETE NOTE
// ==========================================

router.delete("/:id", auth, deleteNote);

// ==========================================
// LIKE NOTE
// ==========================================

router.put("/:id/like", likeNote);

// ==========================================
// INCREASE VIEWS
// ==========================================

router.put("/:id/view", increaseViews);

// ==========================================
// INCREASE DOWNLOADS
// ==========================================

router.put("/:id/download", increaseDownloads);

module.exports = router;