const Notification = require("../models/Notification");
const { syncJntuaNotifications, isBTechNotification } = require("../services/jntuaSyncService");
const { safeFetch } = require("../services/safeFetch");
const recordAuditLog = require("../services/auditLogger");

// ==========================================
// SYNC NOTIFICATIONS FROM JNTUA OFFICIAL
//
// GET  /sync  public (the Notifications page calls it) and throttled:
//             the service only runs it once every 3 minutes.
// POST /sync  admin only, forces an immediate sync.
// ==========================================

exports.syncJntua = async (req, res) => {
  try {
    const forced = req.method === "POST";
    const result = await syncJntuaNotifications(forced);
    res.status(200).json({
      success: true,
      message: "Synced with official JNTUA examinations portal",
      ...result,
    });
  } catch (error) {
    console.error("Manual JNTUA Sync Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to sync notifications right now",
    });
  }
};

// ==========================================
// CREATE NOTIFICATION (admin only, see routes)
// ==========================================

exports.createNotification = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim().slice(0, 500);
    const description = String(req.body.description || "").trim().slice(0, 5000);
    const link = String(req.body.link || "").trim().slice(0, 2048);
    const category = String(req.body.category || "").trim().slice(0, 100);
    const date = String(req.body.date || "").trim().slice(0, 100);
    const isImportant = Boolean(req.body.isImportant);

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const notification = await Notification.create({
      title,
      description,
      link,
      category,
      date,
      isImportant,
      likes: 0,
      views: 0,
      downloads: 0,
    });

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "create",
        resourceType: "Notification",
        resourceId: notification._id,
        route: req.originalUrl,
        ip: req.ip,
      });
    }

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

    res.setHeader(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=120"
    );

    const notifications = await Notification.find()
      .sort({
        createdAt: -1,
      })
      .lean();

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
    const notification = await Notification.findById(req.params.id);

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
// UPDATE NOTIFICATION (admin only, see routes)
// ==========================================

exports.updateNotification = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = String(req.body.title).trim().slice(0, 500);
    if (req.body.description !== undefined) updateData.description = String(req.body.description).trim().slice(0, 5000);
    if (req.body.link !== undefined) updateData.link = String(req.body.link).trim().slice(0, 2048);
    if (req.body.category !== undefined) updateData.category = String(req.body.category).trim().slice(0, 100);
    if (req.body.date !== undefined) updateData.date = String(req.body.date).trim().slice(0, 100);
    if (req.body.isImportant !== undefined) updateData.isImportant = Boolean(req.body.isImportant);

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "update",
        resourceType: "Notification",
        resourceId: notification._id,
        route: req.originalUrl,
        ip: req.ip,
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
// DELETE NOTIFICATION (admin only, see routes)
// ==========================================

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (req.user) {
      await recordAuditLog({
        adminId: req.user._id,
        action: "delete",
        resourceType: "Notification",
        resourceId: req.params.id,
        route: req.originalUrl,
        ip: req.ip,
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
//
// Public on purpose (students open notification PDFs through it), so it is
// hardened against SSRF: see services/safeFetch.js.
// ==========================================

exports.proxyPdf = async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
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

    const { response, buffer } = await safeFetch(targetUrl, {
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
    res.setHeader("X-Content-Type-Options", "nosniff");

    res.send(buffer);
  } catch (error) {
    console.warn("Proxy PDF blocked/failed:", error.message);

    const blocked =
      /not allowed|Invalid URL|Only http|Only standard|credentials|too large|redirect/i.test(
        error.message
      );

    res
      .status(blocked ? 400 : 502)
      .send(blocked ? "This document link cannot be loaded" : "Error streaming PDF document");
  }
};
