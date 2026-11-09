/**
 * Admin Session Security Management
 * Provides idle timeout, route exit protection, and session auto-revocation.
 */

// Maximum idle inactivity allowed before automatic logout (10 minutes)
export const ADMIN_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Returns true if the given pathname belongs to the restricted Admin Portal.
 */
export const isAdminPath = (pathname) => {
  if (!pathname) return false;
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/upload-") ||
    pathname.startsWith("/manage-") ||
    pathname.startsWith("/edit-") ||
    pathname === "/user-uploaded-data"
  );
};

/**
 * Start an authenticated admin session with active portal tracking.
 */
export const startAdminSession = (token, user) => {
  const now = Date.now().toString();

  sessionStorage.setItem("token", token);
  sessionStorage.setItem("user", JSON.stringify(user));
  sessionStorage.setItem("admin_last_active", now);
  sessionStorage.setItem("admin_active_portal", "true");

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("admin_last_active", now);
  localStorage.setItem("admin_active_portal", "true");
};

// Throttle timestamp to prevent excessive localStorage/sessionStorage writes on mousemove
let lastAdminTouchTimestamp = 0;

/**
 * Refresh last active timestamp on admin user interaction (throttled to at most once per 15s).
 */
export const touchAdminActivity = () => {
  const now = Date.now();
  if (now - lastAdminTouchTimestamp < 15000) {
    return; // Skip write if touched within the last 15 seconds
  }
  lastAdminTouchTimestamp = now;

  const nowStr = now.toString();
  try {
    sessionStorage.setItem("admin_last_active", nowStr);
    localStorage.setItem("admin_last_active", nowStr);
  } catch {
    // Ignore storage write errors
  }
};

/**
 * Completely wipe admin authentication from both session and local storage.
 */
export const clearAdminSession = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("admin_last_active");
  sessionStorage.removeItem("admin_active_portal");

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("admin_last_active");
  localStorage.removeItem("admin_active_portal");
};

/**
 * Check and validate current admin session.
 * Enforces role checking, presence of token, and inactivity expiration.
 */
export const getAdminAuth = () => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const userData = sessionStorage.getItem("user") || localStorage.getItem("user");
  const lastActiveStr = sessionStorage.getItem("admin_last_active") || localStorage.getItem("admin_last_active");

  if (!token || !userData) {
    clearAdminSession();
    return {
      isAuthenticated: false,
      reason: "no_token",
      message: "Please sign in with your administrator account to access the Admin Dashboard.",
    };
  }

  let user = null;
  try {
    user = JSON.parse(userData);
  } catch {
    clearAdminSession();
    return {
      isAuthenticated: false,
      reason: "invalid_user",
      message: "Invalid session data. Please sign in again.",
    };
  }

  if (!user || user.role !== "admin") {
    clearAdminSession();
    return {
      isAuthenticated: false,
      reason: "not_admin",
      message: "Access restricted. You must be an administrator to access this page.",
    };
  }

  // Check Inactivity Expiration (10 minutes)
  if (lastActiveStr) {
    const elapsed = Date.now() - Number(lastActiveStr);
    if (elapsed > ADMIN_INACTIVITY_TIMEOUT_MS) {
      clearAdminSession();
      return {
        isAuthenticated: false,
        reason: "expired",
        message: "Admin session expired due to inactivity. Please sign in again to continue.",
      };
    }
  }

  // Session is valid — touch activity
  touchAdminActivity();

  return {
    isAuthenticated: true,
    user,
    token,
  };
};
