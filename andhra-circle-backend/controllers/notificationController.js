const Notification = require("../models/Notification");
const { syncJntuaNotifications, isBTechNotification } = require("../services/jntuaSyncService");

// ==========================================
// SYNC NOTIFICATIONS FROM JNTUA OFFICIAL
// ==========================================

exports.syncJntua = async (req, res) => {
  try {
    const result = await syncJntuaNotifications(true);
    res.status(200).json({
      success: true,
      message: "Synced with official JNTUA examinations portal",
      ...result,
    });
  } catch (error) {
    console.error("Manual JNTUA Sync Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
  if (require("mongoose").connection.readyState !== 1) {
    return res.status(200).json([]);
  }

  // Non-blocking background sync with official JNTUA updates
  syncJntuaNotifications(false).catch((err) => {
    console.warn("Background JNTUA sync warning:", err.message);
  });

  const notifications = await Notification.find().sort({
    createdAt: -1,
  });

  const btechNotifications = notifications.filter((n) =>
    isBTechNotification(n.title, n.description)
  );

  res.status(200).json(btechNotifications);
} catch (error) {
  console.warn("Get Notifications Warning:", error.message);
  res.status(200).json([]);
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
returnDocument: "after",
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
      { returnDocument: "after" }
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
      { returnDocument: "after" }
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
      { returnDocument: "after" }
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

// ==========================================
// STREAM / PROXY PDF FROM GOOGLE DRIVE / DIRECT URLS
// ==========================================

exports.proxyPdf = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send("No document URL provided");
  }

  try {
    let targetUrl = url;

    // Handle Google Drive links
    const driveMatch =
      url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (driveMatch) {
      const fileId = driveMatch[1];
      targetUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send("Failed to stream document");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="document.pdf"');
    res.setHeader("Access-Control-Allow-Origin", "*");

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("Proxy PDF Error:", error);
    res.status(500).send("Error streaming PDF document");
  }
};

