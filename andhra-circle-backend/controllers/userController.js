const User = require("../models/User");

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
        new: true,
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