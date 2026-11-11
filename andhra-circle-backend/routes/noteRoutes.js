const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const { verifyMagicBytes } = require("../middleware/validateUpload");
const idempotency = require("../middleware/idempotency");

const {
  createNote,
  getNotes,
  getBranchStats,
  getNoteById,
  updateNote,
  deleteNote,
  restoreNote,
  purgeNote,
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

router.get("/:id", validateObjectId("id"), getNoteById);

// ==========================================
// CREATE NOTE
// ==========================================

router.post(
  "/",
  auth,
  idempotency(),
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
// RESTORE NOTE (ADMIN ONLY)
// ==========================================

router.patch("/:id/restore", auth, validateObjectId("id"), restoreNote);

// ==========================================
// PURGE NOTE (ADMIN ONLY)
// ==========================================

router.delete("/:id/purge", auth, validateObjectId("id"), purgeNote);

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