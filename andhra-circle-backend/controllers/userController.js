const User = require("../models/user");
const recordAuditLog = require("../services/auditLogger");

// ==========================================
// Get All Users
// ==========================================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Get Users Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Update User Role
// ==========================================
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Safety: an admin cannot change their own role (prevents locking
    // the site out of its last admin by accident)
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({
        message: "You cannot change your own role.",
      });
    }

    // Check valid role
    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Role must be student or admin.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).select(
      "-password -resetPasswordToken -resetPasswordExpire"
    );

    // User not found
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "role change",
        resourceType: "User",
        resourceId: user._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: "Role Updated Successfully",
      user,
    });
  } catch (error) {
    console.error(
      "Update User Role Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Delete User
// ==========================================
exports.deleteUser = async (req, res) => {
  try {
    // Safety: an admin cannot delete their own account
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({
        message: "You cannot delete your own account.",
      });
    }

    const user = await User.findById(
      req.params.id
    );

    // User not found
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(
      req.params.id
    );

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "delete",
        resourceType: "User",
        resourceId: req.params.id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: "User Deleted Successfully",
    });
  } catch (error) {
    console.error(
      "Delete User Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};