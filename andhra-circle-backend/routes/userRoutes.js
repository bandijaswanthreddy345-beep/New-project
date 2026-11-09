const express = require("express");

const router = express.Router();

const {
  getUsers,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");

const auth = require("../middleware/auth");

// ==========================================
// GET ALL USERS
// GET /api/users
// ==========================================
router.get("/", auth, getUsers);

// ==========================================
// UPDATE USER ROLE
// PUT /api/users/:id/role
// ==========================================
router.put("/:id/role", auth, updateUserRole);

// ==========================================
// DELETE USER
// DELETE /api/users/:id
// ==========================================
router.delete("/:id", auth, deleteUser);

module.exports = router;
