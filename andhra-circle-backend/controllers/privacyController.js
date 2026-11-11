/**
 * India Digital Personal Data Protection (DPDP) Act Compliance Routes
 * - Data portability / export: GET /api/v1/users/me/export
 * - Right to erasure / account deletion: DELETE /api/v1/users/me
 */

const User = require("../models/user");
const Comment = require("../models/Comment");
const UserMaterial = require("../models/userMaterial");
const logger = require("../utils/logger");

exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpire -twoFactorSecret").lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch user-associated interactions
    const [comments, materials] = await Promise.all([
      Comment.find({ email: user.email }).lean(),
      UserMaterial.find({ email: user.email }).lean(),
    ]);

    const exportBundle = {
      notice: "JNTU Circle Data Export generated under India DPDP Act",
      exportedAt: new Date().toISOString(),
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      activity: {
        commentsCount: comments.length,
        comments: comments.map((c) => ({ comment: c.comment, createdAt: c.createdAt })),
        userMaterialsCount: materials.length,
        userMaterials: materials.map((m) => ({ title: m.title, branch: m.branch, createdAt: m.createdAt })),
      },
    };

    logger.info("DPDP Data export executed", { userId: String(user._id) });
    res.setHeader("Content-Disposition", `attachment; filename="jntu_circle_export_${user._id}.json"`);
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(exportBundle);
  } catch (err) {
    logger.error("DPDP Export Error", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to generate data export" });
  }
};

exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Anonymize or clean comments
    await Comment.deleteMany({ email: user.email });

    // Remove user account
    await User.findByIdAndDelete(userId);

    logger.info("DPDP Account Erasure completed", { userId: String(userId) });
    return res.status(200).json({
      success: true,
      message: "Account and associated personal records successfully deleted under DPDP Act",
    });
  } catch (err) {
    logger.error("DPDP Erasure Error", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to delete account" });
  }
};

