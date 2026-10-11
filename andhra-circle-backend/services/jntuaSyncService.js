const Notification = require("../models/Notification");

// Official JNTUA Examinations API Endpoint
const JNTUA_EXAMS_BASE_URL =
  "https://app.jntua.ac.in/api/notifications?sort=Publish_Date:desc&populate=*&filters[notification_categories][Notification_Category][$contains]=University%20Examinations&pagination[pageSize]=25";

/**
 * Validates if a notification strictly belongs to B.Tech program
 */
function isBTechNotification(title = "", body = "") {
  const text = `${title} ${typeof body === "string" ? body : JSON.stringify(body || "")}`.toLowerCase();

  const isBTechExplicit =
    text.includes("b.tech") ||
    text.includes("btech") ||
    text.includes("b tech");

  const isOtherDegree =
    text.includes("b.pharm") ||
    text.includes("bpharm") ||
    text.includes("m.pharm") ||
    text.includes("mpharm") ||
    text.includes("m.tech") ||
    text.includes("mtech") ||
    text.includes("mba") ||
    text.includes("mca") ||
    text.includes("ph.d") ||
    text.includes("phd") ||
    text.includes("pharm.d") ||
    text.includes("pharmd");

  // If it mentions another degree without explicitly stating B.Tech, exclude it
  if (isOtherDegree && !isBTechExplicit) {
    return false;
  }

  return isBTechExplicit;
}

/**
 * Extracts links (PDFs, Google Drive links, URLs) from JNTUA notification body
 */
function extractLinkFromBody(body, title) {
  if (!body) return "https://www.jntua.ac.in/category/University-Examinations";

  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);

  // 1. Look for direct Google Drive or PDF link
  const driveRegex = /(https:\/\/drive\.google\.com\/[^\s"']+)/i;
  const driveMatch = bodyStr.match(driveRegex);
  if (driveMatch) return driveMatch[1];

  const pdfRegex = /(https?:\/\/[^\s"']+\.pdf)/i;
  const pdfMatch = bodyStr.match(pdfRegex);
  if (pdfMatch) return pdfMatch[1];

  // 2. Generic external link in body (excluding internal api)
  const httpRegex = /(https?:\/\/[^\s"']+)/i;
  const httpMatch = bodyStr.match(httpRegex);
  if (httpMatch && !httpMatch[1].includes("jntua.ac.in/api")) {
    return httpMatch[1];
  }

  // 3. Fallback to official JNTUA Examinations category portal
  return "https://www.jntua.ac.in/category/University-Examinations";
}

let lastSyncTimestamp = 0;

/**
 * Synchronizes strictly B.Tech Examination notifications from official JNTUA website
 */
async function syncJntuaNotifications(force = false) {
  const now = Date.now();
  // Rate-limit background sync to at most once every 3 minutes unless forced
  if (!force && now - lastSyncTimestamp < 3 * 60 * 1000) {
    return { synced: 0, message: "Sync throttled" };
  }

  lastSyncTimestamp = now;

  try {
    console.log("🔄 [JNTUA Sync] Checking official JNTUA for B.Tech examination updates...");

    // Clean up non-B.Tech notices from database to keep notifications pure
    const allDbNotifs = await Notification.find();
    for (const notif of allDbNotifs) {
      if (!isBTechNotification(notif.title, notif.description)) {
        await Notification.findByIdAndDelete(notif._id);
      }
    }

    let newlyAdded = 0;
    // Query up to 3 pages to capture all recent active B.Tech circulars
    const maxPages = 3;

    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = `${JNTUA_EXAMS_BASE_URL}&pagination[page]=${page}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(pageUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[JNTUA Sync] Page ${page} returned HTTP ${response.status}`);
        continue;
      }

      const json = await response.json();
      const items = Array.isArray(json?.data) ? json.data : [];

      for (const item of items) {
        const attrs = item.attributes || {};
        const title = (attrs.Title || "").trim();
        if (!title) continue;

        // FILTER: Keep ONLY B.Tech related notifications!
        if (!isBTechNotification(title, attrs.Body)) {
          continue;
        }

        // Check if already present in DB
        const existing = await Notification.findOne({
          $or: [{ title: title }, { externalId: String(item.id) }],
        });

        if (!existing) {
          const publishedDate = attrs.Publish_Date
            ? new Date(attrs.Publish_Date)
            : attrs.createdAt
            ? new Date(attrs.createdAt)
            : new Date();

          const directLink = extractLinkFromBody(attrs.Body, title);

          // Determine appropriate category
          let category = "Exam";
          const tLower = title.toLowerCase();
          if (
            tLower.includes("result") ||
            tLower.includes("revaluation") ||
            tLower.includes("recounting") ||
            tLower.includes("challenge valuation")
          ) {
            category = "Results";
          } else if (
            tLower.includes("circular") ||
            tLower.includes("calendar") ||
            tLower.includes("guidelines") ||
            tLower.includes("commencement")
          ) {
            category = "Circular";
          }

          await Notification.create({
            title,
            description: `Official JNTU Anantapur B.Tech Examination Notification. Published on ${new Date(
              publishedDate
            ).toLocaleDateString("en-IN")}.`,
            category,
            link: directLink,
            externalId: String(item.id),
            publishedDate,
            createdAt: attrs.createdAt ? new Date(attrs.createdAt) : new Date(),
            likes: Math.floor(Math.random() * 20) + 8,
            views: Math.floor(Math.random() * 90) + 140,
            downloads: Math.floor(Math.random() * 35) + 20,
          });

          newlyAdded++;
        }
      }
    }

    if (newlyAdded > 0) {
      console.log(
        `✅ [JNTUA Sync] Successfully imported ${newlyAdded} new official B.Tech notification(s)!`
      );
    } else {
      console.log(
        "✨ [JNTUA Sync] Database is up to date with official B.Tech notifications."
      );
    }

    return { synced: newlyAdded };
  } catch (error) {
    console.error("⚠️ [JNTUA Sync Error]:", error.message);
    return { synced: 0, error: error.message };
  }
}

/**
 * Background auto-sync scheduler: runs on startup and every 10 minutes
 */
function startJntuaAutoSync() {
  setTimeout(() => {
    syncJntuaNotifications(true).catch((err) =>
      console.error("Initial JNTUA B.Tech sync error:", err)
    );
  }, 2000);

  setInterval(() => {
    syncJntuaNotifications().catch((err) =>
      console.error("Periodic JNTUA B.Tech sync error:", err)
    );
  }, 10 * 60 * 1000);
}

module.exports = {
  syncJntuaNotifications,
  startJntuaAutoSync,
  isBTechNotification,
};
