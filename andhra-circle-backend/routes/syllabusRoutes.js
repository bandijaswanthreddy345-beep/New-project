const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");

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
router.get("/:id", getSyllabusById);

// ==========================================
// CREATE / UPLOAD SYLLABUS
// POST /api/syllabus
// ==========================================
router.post(
  "/",
  auth,
  upload.single("file"),
  createSyllabus
);

// ==========================================
// UPDATE SYLLABUS
// PUT /api/syllabus/:id
// ==========================================
router.put(
  "/:id",
  auth,
  updateSyllabus
);

// ==========================================
// DELETE SYLLABUS
// DELETE /api/syllabus/:id
// ==========================================
router.delete(
  "/:id",
  auth,
  deleteSyllabus
);

// ==========================================
// LIKE SYLLABUS
// PUT /api/syllabus/:id/like
// ==========================================
router.put("/:id/like", likeSyllabus);

// ==========================================
// INCREASE VIEW COUNT
// PUT /api/syllabus/:id/view
// ==========================================
router.put("/:id/view", increaseViews);

// ==========================================
// INCREASE DOWNLOAD COUNT
// PUT /api/syllabus/:id/download
// ==========================================
router.put("/:id/download", increaseDownloads);

module.exports = router;