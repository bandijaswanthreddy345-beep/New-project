import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  getAdminAuth,
  touchAdminActivity,
  clearAdminSession,
  ADMIN_INACTIVITY_TIMEOUT_MS,
} from "../utils/adminSession";

function AdminRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState(() => getAdminAuth());

  // Listen to user interactions inside the Admin area to refresh active status
  useEffect(() => {
    if (!authStatus.isAuthenticated) return;

    const handleUserActivity = () => {
      touchAdminActivity();
    };

    // User interaction listeners
    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("click", handleUserActivity, { passive: true });
    window.addEventListener("scroll", handleUserActivity, { passive: true });

    // Periodic check for inactivity timeout (checks every 10 seconds)
    const intervalId = window.setInterval(() => {
      const current = getAdminAuth();
      if (!current.isAuthenticated) {
        clearAdminSession();
        setAuthStatus(current);
        navigate("/login", {
          replace: true,
          state: {
            adminPrompt: true,
            message: current.message || "Admin session expired. Please sign in again.",
            from: location.pathname,
          },
        });
      }
    }, 10000);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.clearInterval(intervalId);
    };
  }, [authStatus.isAuthenticated, location.pathname, navigate]);

  // If unauthenticated or expired, redirect to login
  if (!authStatus.isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          adminPrompt: true,
          message:
            authStatus.message ||
            "Please sign in with your administrator account to access the Admin Dashboard.",
          from: location.pathname,
        }}
      />
    );
  }

  // Admin authenticated and active
  return children;
}

export default AdminRoute;