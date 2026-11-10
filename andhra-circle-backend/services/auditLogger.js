const AuditLog = require("../models/AuditLog");

/**
 * Record an administrative action in the audit log.
 * Never stores request bodies, passwords, tokens, or emails.
 * Failures to log do not throw or break the request; they log to console.error.
 *
 * @param {Object} entry
 * @param {string|mongoose.Types.ObjectId} entry.adminId
 * @param {'create'|'update'|'delete'|'role change'|'approve'|'reject'} entry.action
 * @param {string} entry.resourceType e.g. "Note", "Paper", "Syllabus", "Notification", "User", "LabProgram", "Comment"
 * @param {string} [entry.resourceId]
 * @param {string} entry.route
 * @param {string} entry.ip
 */
async function recordAuditLog({ adminId, action, resourceType, resourceId, route, ip }) {
  try {
    if (!adminId || !action || !resourceType || !route) {
      console.warn("Audit logger warning: missing required audit fields", {
        hasAdminId: !!adminId,
        action,
        resourceType,
        route,
      });
    }

    await AuditLog.create({
      adminId,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      route,
      ip: ip || "unknown",
      timestamp: new Date(),
    });
  } catch (err) {
    // Audit failures must not break the request, but must be logged to the console
    console.error("AuditLog recording failed:", err.message);
  }
}

module.exports = recordAuditLog;
