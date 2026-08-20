const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");

const {
  createLabProgram,
  getLabPrograms,
  getLabProgramById,
  updateLabProgram,
  deleteLabProgram,
} = require("../controllers/labProgramController");

// ==========================================
// GET ALL LAB PROGRAMS
// GET /api/lab-programs
// PUBLIC
// ==========================================
router.get("/", getLabPrograms);

// ==========================================
// GET SINGLE LAB PROGRAM
// GET /api/lab-programs/:id
// PUBLIC
// ==========================================
router.get("/:id", getLabProgramById);

// ==========================================
// CREATE / UPLOAD LAB PROGRAM
// POST /api/lab-programs
// ADMIN ONLY
// ==========================================
router.post(
  "/",
  auth,
  upload.single("file"),
  createLabProgram
);

// ==========================================
// UPDATE LAB PROGRAM
// PUT /api/lab-programs/:id
// ADMIN ONLY
// ==========================================
router.put(
  "/:id",
  auth,
  updateLabProgram
);

// ==========================================
// DELETE LAB PROGRAM
// DELETE /api/lab-programs/:id
// ADMIN ONLY
// ==========================================
router.delete(
  "/:id",
  auth,
  deleteLabProgram
);

module.exports = router;