const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const { verifyMagicBytes } = require("../middleware/validateUpload");

const {
  createSyllabus,
  getSyllabus,
  getSyllabusById,
  updateSyllabus,
  deleteSyllabus,
  likeSyllabus,
  increaseViews,
  increaseDownloads,
} = require("../controllers/syllabusController");

// ==========================================
// GET ALL SYLLABUS
// GET /api/syllabus
// ==========================================
router.get("/", getSyllabus);

// ==========================================
// GET SINGLE SYLLABUS
// GET /api/syllabus/:id
// ==========================================
router.get("/:id", validateObjectId("id"), getSyllabusById);

// ==========================================
// CREATE / UPLOAD SYLLABUS
// POST /api/syllabus
// ==========================================
router.post(
  "/",
  auth,
  upload.single("file"),
  verifyMagicBytes,
  createSyllabus
);

// ==========================================
// UPDATE SYLLABUS
// PUT /api/syllabus/:id
// ==========================================
router.put(
  "/:id",
  auth,
  validateObjectId("id"),
  upload.single("file"),
  verifyMagicBytes,
  updateSyllabus
);

// ==========================================
// DELETE SYLLABUS
// DELETE /api/syllabus/:id
// ==========================================
router.delete(
  "/:id",
  auth,
  validateObjectId("id"),
  deleteSyllabus
);

// ==========================================
// LIKE SYLLABUS
// PUT /api/syllabus/:id/like
// ==========================================
router.put("/:id/like", validateObjectId("id"), likeSyllabus);

// ==========================================
// INCREASE VIEW COUNT
// PUT /api/syllabus/:id/view
// ==========================================
router.put("/:id/view", validateObjectId("id"), increaseViews);

// ==========================================
// INCREASE DOWNLOAD COUNT
// PUT /api/syllabus/:id/download
// ==========================================
router.put("/:id/download", validateObjectId("id"), increaseDownloads);

module.exports = router;