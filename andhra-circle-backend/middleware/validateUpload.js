const fs = require("fs");

/**
 * Check if a file's initial magic bytes match its declared MIME type.
 * Supported types: PDF, PNG, JPEG, WebP.
 *
 * @param {string} filePath Path to the saved file
 * @param {string} mimetype Declared mimetype from multer
 * @returns {boolean} True if magic bytes match declared mimetype
 */
function checkMagicBytes(filePath, mimetype) {
  let fd;
  try {
    const buffer = Buffer.alloc(16);
    fd = fs.openSync(filePath, "r");
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    if (bytesRead < 4) return false;

    // PDF: %PDF-
    if (mimetype === "application/pdf") {
      return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (mimetype === "image/png") {
      return (
        bytesRead >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    }

    // JPEG: FF D8 FF
    if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
      return (
        bytesRead >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );
    }

    // WebP: RIFF .... WEBP
    if (mimetype === "image/webp") {
      return (
        bytesRead >= 12 &&
        buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
        buffer.subarray(8, 12).toString("latin1") === "WEBP"
      );
    }

    return false;
  } catch (err) {
    console.error("Magic byte check error:", err.message);
    return false;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {}
    }
  }
}

/**
 * Middleware that validates magic bytes of all uploaded files.
 * If any file fails, all uploaded files in the request are deleted,
 * and a 400 response is returned.
 */
function verifyMagicBytes(req, res, next) {
  const filesToVerify = [];

  if (req.file) {
    filesToVerify.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      filesToVerify.push(...req.files);
    } else {
      for (const field of Object.values(req.files)) {
        if (Array.isArray(field)) {
          filesToVerify.push(...field);
        }
      }
    }
  }

  if (filesToVerify.length === 0) {
    return next();
  }

  const cleanupAll = () => {
    for (const f of filesToVerify) {
      if (f.path && fs.existsSync(f.path)) {
        try {
          fs.unlinkSync(f.path);
        } catch (err) {
          console.error("Failed to delete invalid file:", f.path, err.message);
        }
      }
    }
  };

  for (const f of filesToVerify) {
    const isValid = checkMagicBytes(f.path, f.mimetype);
    if (!isValid) {
      cleanupAll();
      return res.status(400).json({
        success: false,
        message: "Invalid file content. The file contents do not match the declared type.",
      });
    }
  }

  next();
}

module.exports = {
  checkMagicBytes,
  verifyMagicBytes,
};
