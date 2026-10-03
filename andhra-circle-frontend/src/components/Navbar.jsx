import { useRef, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { MetalFx, useMetalBend } from "metal-fx";
import API from "../api/api";
import logo from "../assets/jntu-circle-logo.png.png";

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
  const searchMetalRef = useRef(null);
  const notifContainerRef = useRef(null);

  const [notificationsList, setNotificationsList] = useState(FALLBACK_NOTICES);
  const [showDropdown, setShowDropdown] = useState(false);

  // Hook for cursor-driven liquid metal bend interaction
  useMetalBend(searchMetalRef);

  // Fetch real notifications from backend on mount
  useEffect(() => {
    let isMounted = true;
    API.get("/notifications")
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          setNotificationsList(res.data);
        }
      })
      .catch(() => {});

    // Automatically trigger notification dropdown under the tab after 1.2 seconds
    const timer = setTimeout(() => {
      if (isMounted) {
        setShowDropdown(true);
      }
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
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

  const getCategoryBadgeClass = (category) => {
    const c = String(category || "").toUpperCase();
    if (c.includes("EXAM")) return "badge-exam";
    if (c.includes("CIRCULAR")) return "badge-circular";
    if (c.includes("RESULT")) return "badge-results";
    return "badge-general";
  };

  const latestAlert = notificationsList[0] || FALLBACK_NOTICES[0];

  const navigationLinks = [
    {
      name: "Home",
      path: "/",
    },
    {
      name: "Notes",
      path: "/notes",
    },
    {
      name: "Question Papers",
      path: "/papers",
    },
    {
      name: "Syllabus",
      path: "/syllabus",
    },
    {
      name: "Lab Programs",
      path: "/lab-programs",
    },
    {
      name: "Notifications",
      path: "/notifications",
    },
  ];

  // ==========================================
  // OPEN SEARCH
  // ==========================================

  const handleSearchClick = (e) => {
    e.preventDefault();
    navigate(`/search?open=${Date.now()}`);
  };

  return (
    <header className="navbar">

      {/* ==========================================
          LOGO
      ========================================== */}

      <div className="logo">
        <Link to="/">
          <img
            src={logo}
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
                <li key={item.path} className="nav-item-notif" ref={notifContainerRef}>
                  <div className="nav-notif-link-container">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        isActive
                          ? "nav-link active"
                          : "nav-link"
                      }
                      onClick={() => {
                        setShowDropdown(false);
                      }}
                    >
                      <span>{item.name}</span>
                      <span 
                        className="nav-notif-badge-pill" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowDropdown((prev) => !prev);
                        }}
                        title="Click to toggle notifications preview"
                        aria-label="Toggle notifications preview"
                      >
                        <span className="nav-badge-pulse" />
                        {notificationsList.length}
                      </span>
                    </NavLink>

                    {/* Modern Notification Dropdown: Positioned directly UNDER the Notifications tab */}
                    {showDropdown && latestAlert && (
                      <div className="nav-notif-dropdown" role="dialog" aria-label="Notifications Dropdown">
                        <div className="notif-dropdown-arrow" />

                        {/* Top Header */}
                        <div className="notif-dropdown-header">
                          <div className="notif-header-left">
                            <span className="notif-live-dot" />
                            <span className="notif-header-title">University Notice</span>
                            {latestAlert.category && (
                              <span className={`notif-category-chip ${getCategoryBadgeClass(latestAlert.category)}`}>
                                {latestAlert.category}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="notif-dropdown-close"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(false);
                            }}
                            aria-label="Close notification dropdown"
                            title="Close"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Clean Notification Card Layout (Requirement 4) */}
                        <div 
                          className="notif-dropdown-card"
                          onClick={() => {
                            setShowDropdown(false);
                            if (latestAlert.link && latestAlert.link.startsWith("http")) {
                              window.open(latestAlert.link, "_blank");
                            } else {
                              navigate("/notifications");
                            }
                          }}
                        >
                          {/* Small notification icon on the left */}
                          <div className="notif-card-icon-col">
                            <div className="notif-icon-circle">
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                            </div>
                          </div>

                          {/* Center notification message + subtle time */}
                          <div className="notif-card-content-col">
                            <h4 className="notif-card-title">{latestAlert.title}</h4>
                            {latestAlert.description && (
                              <p className="notif-card-desc">{latestAlert.description}</p>
                            )}
                            <div className="notif-card-meta">
                              <span className="notif-card-time">{formatTimeAgo(latestAlert.publishedDate)}</span>
                              <span className="notif-card-divider">•</span>
                              <span className="notif-card-author">Official Circular</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="notif-dropdown-footer">
                          <button
                            type="button"
                            className="notif-btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(false);
                              if (latestAlert.link && latestAlert.link.startsWith("http")) {
                                window.open(latestAlert.link, "_blank");
                              } else {
                                navigate("/notifications");
                              }
                            }}
                          >
                            <span>View →</span>
                          </button>

                          <button
                            type="button"
                            className="notif-btn-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(false);
                              navigate("/notifications");
                            }}
                          >
                            All Circulars ({notificationsList.length})
                          </button>
                        </div>
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
                      ? "nav-link active"
                      : "nav-link"
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            );
          })}

          {/* ==========================================
              3D METAL SEARCH BUTTON
          ========================================== */}

          <li className="nav-metal-search-item">
            <MetalFx
              ref={searchMetalRef}
              preset="chromatic"
              variant="circle"
              strength={1}
              innerShadow
              className="metal-search-wrapper"
            >
              <button
                type="button"
                className="metal-search-btn"
                aria-label="Search"
                title="Search"
                onClick={handleSearchClick}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="metal-search-icon"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
                </svg>
              </button>
            </MetalFx>
          </li>



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

    </header>
  );
}

export default Navbar;