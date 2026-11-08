const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const auth = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");

const {
  createUserMaterial,
  getUserMaterials,
  deleteUserMaterial,
} = require("../controllers/userMaterialController");

router.get("/", auth, getUserMaterials);

// Public upload: limited per IP so nobody can fill the disk
router.post(
  "/",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Upload limit reached. Please try again in an hour.",
  }),
  upload.pdf.single("file"),
  createUserMaterial
);

router.delete("/:id", auth, deleteUserMaterial);

module.exports = router;
