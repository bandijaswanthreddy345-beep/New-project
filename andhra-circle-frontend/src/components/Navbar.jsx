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
  const [showPopover, setShowPopover] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

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

    // Automatically trigger small notification pop-up bubble after 1.4 seconds
    const timer = setTimeout(() => {
      if (isMounted) {
        setShowBubble(true);
      }
    }, 1400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowPopover(false);
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
                        setShowPopover(false);
                        setShowBubble(false);
                      }}
                    >
                      <span>{item.name}</span>
                      <span 
                        className="nav-notif-badge-pill" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowPopover((prev) => !prev);
                          setShowBubble(false);
                        }}
                        title="Click to view live notification alerts"
                        aria-label="Toggle notifications preview"
                      >
                        <span className="nav-badge-pulse" />
                        {notificationsList.length}
                      </span>
                    </NavLink>

                    {/* Compact Pop-up Notification Pill in Header (stays strictly in header) */}
                    {showBubble && latestAlert && (
                      <div 
                        className="nav-notif-bubble"
                        onClick={() => {
                          setShowBubble(false);
                          if (latestAlert.link && latestAlert.link.startsWith("http")) {
                            window.open(latestAlert.link, "_blank");
                          } else {
                            navigate("/notifications");
                          }
                        }}
                        title={`Latest Alert: ${latestAlert.title} (Click to open)`}
                      >
                        <span className="bubble-icon">📢</span>
                        <span className="bubble-text">{latestAlert.title}</span>
                        <span className="bubble-cta">View →</span>
                        <button
                          type="button"
                          className="bubble-close-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBubble(false);
                          }}
                          aria-label="Close notification preview"
                          title="Dismiss notification"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Rich Notification Pop-up Dropdown Card */}
                    {showPopover && (
                      <div className="nav-notif-popover">
                        <div className="popover-arrow" />
                        <div className="popover-header">
                          <div className="popover-title-row">
                            <span className="popover-title">University Notices</span>
                            <span className="popover-count-pill">{notificationsList.length} Active</span>
                          </div>
                          <button
                            type="button"
                            className="popover-close-btn"
                            onClick={() => setShowPopover(false)}
                            aria-label="Close popover"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="popover-items-list">
                          {notificationsList.slice(0, 4).map((notif) => (
                            <div
                              key={notif._id}
                              className="popover-item"
                              onClick={() => {
                                setShowPopover(false);
                                if (notif.link && notif.link.startsWith("http")) {
                                  window.open(notif.link, "_blank");
                                } else {
                                  navigate("/notifications");
                                }
                              }}
                            >
                              <div className="popover-item-top">
                                <span className={`popover-item-badge ${getCategoryBadgeClass(notif.category)}`}>
                                  {notif.category || "GENERAL"}
                                </span>
                                <span className="popover-item-time">{formatTimeAgo(notif.publishedDate)}</span>
                              </div>
                              <h4 className="popover-item-title">{notif.title}</h4>
                              <p className="popover-item-desc">{notif.description}</p>
                            </div>
                          ))}
                        </div>

                        <div className="popover-footer">
                          <button
                            type="button"
                            className="popover-view-all-btn"
                            onClick={() => {
                              setShowPopover(false);
                              navigate("/notifications");
                            }}
                          >
                            View All Notifications & Circulars →
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