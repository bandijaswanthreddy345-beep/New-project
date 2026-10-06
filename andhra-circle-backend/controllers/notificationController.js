const Notification = require("../models/Notification");

// ==========================================
// CREATE NOTIFICATION
// ==========================================

exports.createNotification = async (req, res) => {
try {
const notification = await Notification.create({
...req.body,
likes: 0,
views: 0,
downloads: 0,
});


res.status(201).json(notification);


} catch (error) {
console.error("Create Notification Error:", error);


res.status(500).json({
  message: error.message,
});


}
};

// ==========================================
// GET ALL NOTIFICATIONS
// ==========================================

exports.getNotifications = async (req, res) => {
try {
const notifications = await Notification.find().sort({
createdAt: -1,
});


res.status(200).json(notifications);

} catch (error) {
console.error("Get Notifications Error:", error);


res.status(500).json({
  message: error.message,
});


}
};

// ==========================================
// GET NOTIFICATION BY ID
// ==========================================

exports.getNotificationById = async (req, res) => {
try {
const notification = await Notification.findById(
req.params.id
);


if (!notification) {
  return res.status(404).json({
    message: "Notification not found",
  });
}

res.status(200).json(notification);


} catch (error) {
console.error("Get Notification Error:", error);


res.status(500).json({
  message: error.message,
});


}
};

// ==========================================
// UPDATE NOTIFICATION
// ==========================================

exports.updateNotification = async (req, res) => {
try {
const notification =
await Notification.findByIdAndUpdate(
req.params.id,
req.body,
{
new: true,
}
);


if (!notification) {
  return res.status(404).json({
    message: "Notification not found",
  });
}

res.status(200).json(notification);


} catch (error) {
console.error("Update Notification Error:", error);


res.status(500).json({
  message: error.message,
});


}
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================

exports.deleteNotification = async (req, res) => {
try {
const notification =
await Notification.findByIdAndDelete(
req.params.id
);


if (!notification) {
  return res.status(404).json({
    message: "Notification not found",
  });
}

res.status(200).json({
  message: "Notification deleted successfully",
});


} catch (error) {
console.error("Delete Notification Error:", error);


res.status(500).json({
  message: error.message,
});


}
};

// ==========================================
// LIKE NOTIFICATION
// ==========================================

exports.likeNotification = async (req, res) => {
  try {
    const { action } = req.body || {};
    const change = action === "unlike" ? -1 : 1;

    const existing = await Notification.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const currentLikes =
      typeof existing.likes === "number" && !isNaN(existing.likes)
        ? existing.likes
        : 0;
    const targetLikes = Math.max(0, currentLikes + change);

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { likes: targetLikes } },
      { new: true }
    );

    res.status(200).json(notification);
  } catch (error) {
    console.error("Like Notification Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// INCREASE VIEWS
// ==========================================

exports.increaseViews = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("View Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// INCREASE DOWNLOADS
// ==========================================

exports.increaseDownloads = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("Download Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
