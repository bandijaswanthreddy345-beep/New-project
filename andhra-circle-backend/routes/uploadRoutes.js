const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const auth = require("../middleware/auth");

// ==========================================
// ADMIN ONLY FILE UPLOAD
// POST /api/upload
// ==========================================

router.post(
"/",
auth,
upload.single("file"),
(req, res) => {
try {
if (!req.file) {
return res.status(400).json({
message: "No file uploaded",
});
}

  res.status(200).json({
    message: "File uploaded successfully",
    file: req.file,
  });
} catch (error) {
  console.error("File Upload Error:", error);

  res.status(500).json({
    message: "File upload failed",
  });
}

}
);

module.exports = router;