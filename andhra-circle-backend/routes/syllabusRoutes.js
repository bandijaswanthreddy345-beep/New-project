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
} = require("../controllers/syllabusController");

// ==========================================
// GET ALL SYLLABUS
// GET /api/syllabus
// ==========================================
router.get("/", getSyllabus);

// ==========================================
// GET SINGLE SYLLABUS
// GET /api/syllabus/
// ==========================================
router.get("/:id", getSyllabusById);

// ==========================================
// CREATE / UPLOAD SYLLABUS
// POST /api/syllabus
// ==========================================
router.post(
"/:id",
auth,
upload.single("file"),
createSyllabus
);

// ==========================================
// UPDATE SYLLABUS
// PUT /api/syllabus/
// ==========================================
router.put(
"/:id",
auth,
updateSyllabus
);

// ==========================================
// DELETE SYLLABUS
// DELETE /api/syllabus/
// ==========================================
router.delete(
"/:id",
auth,
deleteSyllabus
);

module.exports = router;