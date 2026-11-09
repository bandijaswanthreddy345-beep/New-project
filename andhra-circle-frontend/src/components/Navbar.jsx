import { useRef, useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import API from "../api/api";
import { getStoredStudentData, getStudentAvatar, DEFAULT_STUDENT_AVATAR } from "../data/studentData";

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
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  const notifContainerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const [notificationsList, setNotificationsList] = useState(FALLBACK_NOTICES);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToastAlert, setShowToastAlert] = useState(false);
  const [activeAlertItem, setActiveAlertItem] = useState(null);
  const [student, setStudent] = useState(getStoredStudentData());

  // Mobile auto-popping notification states
  const [mobileNotifIndex, setMobileNotifIndex] = useState(0);
  const [showMobileNotifPopup, setShowMobileNotifPopup] = useState(false);
  const mobileNotifRef = useRef(null);

  useEffect(() => {
    const handleProfileSync = () => {
      setStudent(getStoredStudentData());
    };
    window.addEventListener("studentProfileUpdated", handleProfileSync);
    window.addEventListener("storage", handleProfileSync);
    return () => {
      window.removeEventListener("studentProfileUpdated", handleProfileSync);
      window.removeEventListener("storage", handleProfileSync);
    };
  }, []);

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
      if (mobileNotifRef.current && !mobileNotifRef.current.contains(e.target)) {
        setShowMobileNotifPopup(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Automatic mobile notification pop-up every 5 seconds (touch screen fallback for no cursor hover)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let initialTimeout = null;
    let cycleInterval = null;

    const runMobileCycle = () => {
      if (window.innerWidth <= 768 && notificationsList && notificationsList.length > 0) {
        // Initial popup after brief delay
        initialTimeout = setTimeout(() => {
          setShowMobileNotifPopup(true);
        }, 1200);

        // Continuous 5-second automatic popup cycle
        cycleInterval = setInterval(() => {
          if (window.innerWidth <= 768 && notificationsList.length > 0) {
            setShowMobileNotifPopup(false);
            setTimeout(() => {
              setMobileNotifIndex((prev) => (prev + 1) % notificationsList.length);
              setShowMobileNotifPopup(true);
            }, 300);
          }
        }, 5000);
      }
    };

    runMobileCycle();

    const handleMobileResize = () => {
      if (window.innerWidth > 768) {
        setShowMobileNotifPopup(false);
        if (initialTimeout) clearTimeout(initialTimeout);
        if (cycleInterval) clearInterval(cycleInterval);
      }
    };

    window.addEventListener("resize", handleMobileResize);
    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
      if (cycleInterval) clearInterval(cycleInterval);
      window.removeEventListener("resize", handleMobileResize);
    };
  }, [notificationsList]);

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
      name: "CGPA Calculator",
      path: "/cgpa-calculator",
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
      name: "SGPA Calculator",
      path: "/sgpa-calculator",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
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
      name: "Notifications",
      path: "/notifications",
    },
    {
      name: "Student Profile",
      path: "/profile",
      isProfile: true,
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
          MOBILE ACTIONS (VISIBLE <= 768px)
      ========================================== */}
      <div className="nav-mobile-actions">
        <div className="nav-mobile-notif-wrapper" ref={mobileNotifRef}>
          <Link
            to="/notifications"
            className="nav-mobile-action-btn"
            title="Notifications"
            aria-label="View notifications"
            onClick={() => {
              setMobileMenuOpen(false);
              setShowMobileNotifPopup(false);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasNewAlert && <span className="nav-mobile-notif-ping" />}
          </Link>

          {/* Auto-popping mobile notification preview strip (pops up every 5 seconds) */}
          {notificationsList && notificationsList.length > 0 && (
            <div
              className={`nav-mobile-notif-popup ${showMobileNotifPopup ? "is-visible" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileNotifPopup(false);
                handleOpenNotifications();
                const activeNotice = notificationsList[mobileNotifIndex] || latestAlert;
                if (activeNotice?._id) {
                  navigate(`/notifications?view=${encodeURIComponent(activeNotice._id)}`);
                } else {
                  navigate("/notifications");
                }
              }}
              role="alert"
              aria-live="polite"
              title="Click to view full notification"
            >
              <div className="nav-mobile-notif-arrow" />
              <div className="nav-mobile-notif-body">
                <span className="nav-mobile-notif-text">
                  {(notificationsList[mobileNotifIndex] || latestAlert)?.title}
                </span>
              </div>
              <button
                type="button"
                className="nav-mobile-notif-dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileNotifPopup(false);
                }}
                aria-label="Dismiss notification popup"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Mobile Student Profile Quick Avatar */}
        <Link
          to="/student-profile"
          className="nav-mobile-action-btn nav-mobile-profile-btn"
          title={student?.isConfigured && student?.name ? `Student Profile • ${student.name}` : "Student Profile"}
          aria-label="Student Profile"
          onClick={() => {
            setMobileMenuOpen(false);
            setShowMobileNotifPopup(false);
          }}
        >
          <div className="nav-profile-avatar-wrapper nav-mobile-profile-avatar-wrapper">
            {getStudentAvatar(student) ? (
              <img
                src={getStudentAvatar(student)}
                alt={student?.name || "Student"}
                className="nav-profile-avatar-img nav-mobile-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                }}
              />
            ) : (
              <span className="nav-profile-fallback-icon nav-mobile-fallback-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
            )}
            <span className="nav-profile-status-dot" />
          </div>
        </Link>

        <button
          type="button"
          className={`nav-mobile-toggle ${mobileMenuOpen ? "is-open" : ""}`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* ==========================================
          NAVIGATION (DESKTOP & MOBILE DRAWER)
      ========================================== */}

      <nav className={`nav-container ${mobileMenuOpen ? "is-mobile-open" : ""}`}>
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

            if (item.isProfile || item.name === "Student Profile") {
              const isConfigured = Boolean(student?.isConfigured && student?.name);
              const studentName = isConfigured ? student.name : "Student Profile";
              const photoSrc = getStudentAvatar(student);

              return (
                <li key={item.path} className="nav-item-profile">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      isActive
                        ? "nav-link active nav-profile-btn"
                        : "nav-link nav-profile-btn"
                    }
                    title={isConfigured ? `Student Profile • ${studentName}` : "Student Profile"}
                    aria-label={isConfigured ? `Student Profile (${studentName})` : "Student Profile"}
                  >
                    <div className="nav-profile-avatar-wrapper">
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={studentName}
                          className="nav-profile-avatar-img"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                          }}
                        />
                      ) : null}
                      <span
                        className="nav-profile-fallback-icon"
                        style={{ display: photoSrc ? "none" : "flex" }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <span className="nav-profile-status-dot" title="Active Student" />
                    </div>
                  </NavLink>
                </li>
              );
            }

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
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

        </ul>
      </nav>

      {mobileMenuOpen && (
        <div
          className="nav-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

export default Navbar;