const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const auth = require("../middleware/auth");

const {
  createUserMaterial,
  getUserMaterials,
  deleteUserMaterial,
} = require("../controllers/userMaterialController");

router.get("/", auth, getUserMaterials);
router.post("/", upload.pdf.single("file"), createUserMaterial);
router.delete("/:id", auth, deleteUserMaterial);

module.exports = router;
