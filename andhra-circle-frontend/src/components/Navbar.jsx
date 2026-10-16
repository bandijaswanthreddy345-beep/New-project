import { useRef, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import API from "../api/api";

// Standard fallback notices for the pop-up preview
const FALLBACK_NOTICES = [
  {
    _id: "notif-pop-1",
    title: "JNTU B.Tech R20/R23 Semester End Exam Timetable 2024-25",
    description: "Official schedule for regular and supplementary examinations commencing next month.",
    category: "EXAM",
    publishedDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    link: "/notifications",
  },
  {
    _id: "notif-pop-2",
    title: "Revised Academic Calendar & Instruction Days for 2nd, 3rd & 4th Years",
    description: "University circular detailing working Saturdays and assessment schedules.",
    category: "CIRCULAR",
    publishedDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    link: "/notifications",
  },
  {
    _id: "notif-pop-3",
    title: "Revaluation & Recounting Results for 2-1 and 3-1 Regular Examinations",
    description: "Results portal is now active for online verification.",
    category: "RESULTS",
    publishedDate: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    link: "/notifications",
  },
];

function Navbar() {
  const navigate = useNavigate();
  const notifContainerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const [notificationsList, setNotificationsList] = useState(FALLBACK_NOTICES);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToastAlert, setShowToastAlert] = useState(false);
  const [activeAlertItem, setActiveAlertItem] = useState(null);

  const isBTechNotice = (n) => {
    if (!n) return false;
    const text = `${n.title || ""} ${n.description || ""}`.toLowerCase();
    const isBTech = text.includes("b.tech") || text.includes("btech") || text.includes("b tech");
    const isOther =
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
    if (isOther && !isBTech) return false;
    return isBTech;
  };

  // Fetch real notifications and check for unseen B.Tech alerts
  const checkNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      if (Array.isArray(res.data) && res.data.length > 0) {
        const btechOnly = res.data.filter(isBTechNotice);
        setNotificationsList(btechOnly);

        const latest = btechOnly[0];
        if (!latest) return;

        const lastSeenId = localStorage.getItem("jntu_last_viewed_notif_id");
        const lastSeenTime = localStorage.getItem("jntu_last_viewed_notif_time");

        // If never viewed or latest is newer than last seen
        const isNew = !lastSeenId || latest._id !== lastSeenId;

        if (isNew) {
          let count = 1;
          if (lastSeenTime) {
            const newer = btechOnly.filter(
              (n) => new Date(n.createdAt || n.publishedDate) > new Date(lastSeenTime)
            );
            count = Math.max(1, newer.length);
          }

          setHasNewAlert(true);
          setUnreadCount(count);
          setActiveAlertItem(latest);

          const dismissed = sessionStorage.getItem(`dismissed_notif_${latest._id}`);
          if (!dismissed) {
            setShowToastAlert(true);
          }
        } else {
          setHasNewAlert(false);
          setUnreadCount(0);
          setShowToastAlert(false);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 20000); // 20s polling for new notifications

    return () => {
      clearInterval(interval);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Auto-dismiss toast alert after 9 seconds so it is unobtrusive
  useEffect(() => {
    if (showToastAlert) {
      const timer = setTimeout(() => {
        setShowToastAlert(false);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [showToastAlert]);

  const handleOpenNotifications = () => {
    if (notificationsList && notificationsList.length > 0) {
      const latest = notificationsList[0];
      localStorage.setItem("jntu_last_viewed_notif_id", latest._id);
      localStorage.setItem("jntu_last_viewed_notif_time", new Date().toISOString());
    }
    setHasNewAlert(false);
    setUnreadCount(0);
    setShowToastAlert(false);
  };

  const handleDismissToast = (e) => {
    e.stopPropagation();
    setShowToastAlert(false);
    if (activeAlertItem) {
      sessionStorage.setItem(`dismissed_notif_${activeAlertItem._id}`, "true");
    }
  };

  // Hover handlers for smooth hover dropdown behavior
  const handleNotifMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowDropdown(true);
  };

  const handleNotifMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 160);
  };

  // Close notification dropdown when tapping outside (for touch/mobile)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Recent";
    const diffMin = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const latestAlert = notificationsList[0] || FALLBACK_NOTICES[0];

  const navigationLinks = [
    {
      name: "Home",
      path: "/",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      name: "Notes",
      path: "/notes",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      ),
    },
    {
      name: "CGPA & SGPA Calculator",
      path: "/calculator",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" />
          <line x1="8" x2="16" y1="6" y2="6" />
          <line x1="16" x2="16" y1="14" y2="18" />
          <path d="M16 10h.01" />
          <path d="M12 10h.01" />
          <path d="M8 10h.01" />
          <path d="M12 14h.01" />
          <path d="M8 14h.01" />
          <path d="M12 18h.01" />
          <path d="M8 18h.01" />
        </svg>
      ),
    },
    {
      name: "Upload Materials",
      path: "/upload-materials",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
      ),
    },
    {
      name: "Student Profile",
      path: "/profile",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
      ),
    },
    {
      name: "Notifications",
      path: "/notifications",
    },
  ];

  return (
    <header className="navbar">

      {/* ==========================================
          LOGO
      ========================================== */}

      <div className="logo">
        <Link to="/">
          <img
            src="/jntu-circle-logo.png"
            alt="JNTU Circle Logo"
            className="logo-image"
          />

          <div className="logo-text">
            <h2><span className="font-deltha">JNTU</span> Circle</h2>
            <span>Academic Resource Hub</span>
          </div>
        </Link>
      </div>

      {/* ==========================================
          NAVIGATION
      ========================================== */}

      <nav>
        <ul className="nav-links">

          {navigationLinks.map((item) => {
            if (item.name === "Notifications") {
              return (
                <li 
                  key={item.path} 
                  className="nav-item-notif" 
                  ref={notifContainerRef}
                  onMouseEnter={handleNotifMouseEnter}
                  onMouseLeave={handleNotifMouseLeave}
                >
                  <div className="nav-notif-link-container">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        isActive
                          ? "nav-link active nav-notif-btn"
                          : "nav-link nav-notif-btn"
                      }
                      title="Notifications"
                      aria-label="Notifications"
                      onClick={() => {
                        handleOpenNotifications();
                        if (window.matchMedia && window.matchMedia("(hover: none)").matches) {
                          setShowDropdown((prev) => !prev);
                        }
                      }}
                    >
                      <span className="nav-notif-bell-icon-wrapper" aria-hidden="true">
                        <svg
                          className={`nav-notif-svg-bell ${hasNewAlert ? "is-ringing" : ""}`}
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </span>

                      {hasNewAlert ? (
                        <span 
                          className="nav-notif-alert-badge" 
                          title={`${unreadCount} New Notification${unreadCount > 1 ? "s" : ""} Available`}
                        >
                          <span className="pulse-beacon-ring" />
                          <span className="pulse-beacon-dot" />
                          <span>{unreadCount > 1 ? `${unreadCount} NEW` : "NEW"}</span>
                        </span>
                      ) : (
                        <span className="nav-notif-new-tag">new</span>
                      )}
                    </NavLink>

                    {/* Small Black Glass Notification Strip Tooltip */}
                    {latestAlert && (
                      <div 
                        className={`nav-notif-dropdown ${showDropdown ? "is-open" : ""}`} 
                        role="tooltip" 
                        aria-label="Notification Preview"
                        onMouseEnter={handleNotifMouseEnter}
                        onMouseLeave={handleNotifMouseLeave}
                        onClick={() => {
                          handleOpenNotifications();
                          setShowDropdown(false);
                          if (latestAlert._id) {
                            navigate(`/notifications?view=${encodeURIComponent(latestAlert._id)}`);
                          } else {
                            navigate("/notifications");
                          }
                        }}
                        title={latestAlert.title}
                      >
                        <div className="notif-dropdown-arrow" />
                        <span className="notif-strip-title">
                          {latestAlert.title}
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              );
            }

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? "nav-link active nav-link-with-icon"
                      : "nav-link nav-link-with-icon"
                  }
                >
                  {item.icon && <span className="nav-item-icon">{item.icon}</span>}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}

          {/* ==========================================
              LOGIN BUTTON
          ========================================== */}

          <li>
            <Link
              to="/login"
              className="nav-login-button"
            >
              <span>Login</span>
              <span className="login-arrow">→</span>
            </Link>
          </li>

        </ul>
      </nav>

      {/* ==========================================
          REAL-TIME NEW B.TECH NOTIFICATION TOAST ALERT
      ========================================== */}
      {showToastAlert && activeAlertItem && (
        <div 
          className="notif-toast-alert"
          onClick={() => {
            handleOpenNotifications();
            if (activeAlertItem._id) {
              navigate(`/notifications?view=${encodeURIComponent(activeAlertItem._id)}`);
            } else {
              navigate("/notifications");
            }
          }}
          role="alert"
          aria-live="polite"
        >
          <div className="notif-toast-icon">
            🔔
          </div>
          <div className="notif-toast-body">
            <div className="notif-toast-header">
              <span className="notif-toast-tag">
                B.TECH {activeAlertItem.category || "EXAM"}
              </span>
              <span className="notif-toast-time">
                {formatTimeAgo(activeAlertItem.publishedDate || activeAlertItem.createdAt)}
              </span>
            </div>
            <div className="notif-toast-title">
              {activeAlertItem.title}
            </div>
            <div className="notif-toast-action">
              View Notice Details →
            </div>
          </div>
          <button 
            type="button" 
            className="notif-toast-close"
            onClick={handleDismissToast}
            title="Dismiss alert"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

    </header>
  );
}

export default Navbar;