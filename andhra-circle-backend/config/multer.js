const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// CREATE UPLOAD DIRECTORY
// ==========================================

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ==========================================
// STORAGE CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extension;

    cb(null, uniqueName);
  },
});

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",

    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, JPG, JPEG, PNG, and WEBP files are allowed."
      ),
      false
    );
  }
};

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = upload;