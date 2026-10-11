const fs = require("fs/promises");
const path = require("path");
const UserMaterial = require("../models/userMaterial");

exports.createUserMaterial = async (req, res) => {
  try {
    const { materialType, comment, name, email } = req.body;

    if (!materialType) {
      return res.status(400).json({
        message: "Material type is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (materialType === "notes" && !req.file) {
      return res.status(400).json({
        message: "A PDF file is required when submitting notes",
      });
    }

    const userMaterial = await UserMaterial.create({
      materialType,
      comment: comment || "",
      name: name.trim(),
      email: email.trim(),
      fileUrl: req.file ? `/uploads/${req.file.filename}` : "",
      fileName: req.file ? req.file.originalname : "",
    });

    res.status(201).json({
      success: true,
      message: "Material submitted successfully",
      data: userMaterial,
    });
  } catch (error) {
    console.error("Create User Material Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "This material already exists.",
      });
    }

    res.status(500).json({
      message: error.message || "Unable to save submitted material",
    });
  }
};

exports.getUserMaterials = async (req, res) => {
  try {
    const materials = await UserMaterial.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error("Get User Materials Error:", error);

    res.status(500).json({
      message: error.message || "Unable to fetch submitted materials",
    });
  }
};

exports.deleteUserMaterial = async (req, res) => {
  try {
    const userMaterial = await UserMaterial.findByIdAndDelete(req.params.id);

    if (!userMaterial) {
      return res.status(404).json({
        message: "User submission not found",
      });
    }

    let cleanupWarning = "";

    if (userMaterial.fileUrl) {
      const filename = path.basename(userMaterial.fileUrl);
      const filePath = path.resolve(process.cwd(), "uploads", filename);

      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Delete user submission file error:", error);
          cleanupWarning = "The submission was deleted, but its uploaded file could not be removed.";
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "User submission deleted successfully",
      cleanupWarning,
    });
  } catch (error) {
    console.error("Delete User Material Error:", error);

    res.status(500).json({
      message: error.message || "Unable to delete user submission",
    });
  }
};
