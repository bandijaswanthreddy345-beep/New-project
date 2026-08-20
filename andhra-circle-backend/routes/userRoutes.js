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
router.get(
"/",
auth,
getUsers
);

// ==========================================
// UPDATE USER ROLE
// PUT /api/users//role
// ==========================================
router.put(
"//role",
auth,
updateUserRole
);

// ==========================================
// DELETE USER
// DELETE /api/users/
// ==========================================
router.delete(
"/",
auth,
deleteUser
);

module.exports = router;