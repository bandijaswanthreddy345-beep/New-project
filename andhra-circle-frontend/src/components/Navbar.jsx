import { useRef, useState, useEffect, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
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

/**
 * MagneticNavItem
 * Subtle horizontal magnetic dock interaction for individual navbar text items.
 * Inspires directly from <MagneticDock />: scales up to 1.10 and leans toward cursor within 130px.
 */
function MagneticNavItem({ children, mouseX, reducedMotion }) {
  const itemRef = useRef(null);

  // Distance from cursor to item center X
  const distance = useTransform(mouseX, (val) => {
    if (!itemRef.current || val === Infinity || typeof val !== "number") {
      return 1000;
    }
    const rect = itemRef.current.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    return val - center;
  });

  // Scale: 1.0 when far (>130px), up to 1.10 when directly under cursor
  const scale = useTransform(
    distance,
    [-130, -65, 0, 65, 130],
    [1, 1.04, 1.10, 1.04, 1],
    { clamp: true }
  );

  // Subtle magnetic horizontal pull toward cursor (max 3.5px)
  const x = useTransform(
    distance,
    [-130, -65, 0, 65, 130],
    [0, -3.5, 0, 3.5, 0],
    { clamp: true }
  );

  // Subtle floating upward when hovered (max -2.5px)
  const y = useTransform(
    scale,
    [1, 1.10],
    [0, -2.5],
    { clamp: true }
  );

  // Smooth, critically damped spring physics for an organic, non-bouncy feel
  const springConfig = { damping: 20, stiffness: 260, mass: 0.45 };
  const smoothScale = useSpring(scale, springConfig);
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  return (
    <motion.span
      ref={itemRef}
      className="nav-magnetic-target"
      style={{
        display: "inline-flex",
        alignItems: "center",
        transformOrigin: "center center",
        scale: reducedMotion ? 1 : smoothScale,
        x: reducedMotion ? 0 : smoothX,
        y: reducedMotion ? 0 : smoothY,
        willChange: "transform",
      }}
    >
      {children}
    </motion.span>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const searchMetalRef = useRef(null);
  const notifContainerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Magnetic dock motion tracking across the navbar items
  const mouseX = useMotionValue(Infinity);
  const navLinksRef = useRef(null);
  const reducedMotion = useReducedMotion() ?? false;

  const handleNavMouseMove = useCallback(
    (e) => {
      if (reducedMotion) return;
      if (navLinksRef.current) {
        const rect = navLinksRef.current.getBoundingClientRect();
        if (e.clientY >= rect.top - 15 && e.clientY <= rect.bottom + 25) {
          mouseX.set(e.clientX);
          return;
        }
      }
      mouseX.set(Infinity);
    },
    [mouseX, reducedMotion]
  );

  const handleNavMouseLeave = useCallback(() => {
    mouseX.set(Infinity);
  }, [mouseX]);

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

    return () => {
      isMounted = false;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

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
    // 160ms buffer so moving cursor between button and popup never flickers
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

  const getCategoryBadgeClass = (category) => {
    const c = String(category || "").toUpperCase();
    if (c.includes("EXAM")) return "badge-exam";
    if (c.includes("CIRCULAR")) return "badge-circular";
    if (c.includes("RESULT")) return "badge-results";
    return "badge-general";
  };

  const latestAlert = notificationsList[0] || FALLBACK_NOTICES[0];
  const hasNewNotification = Boolean(notificationsList && notificationsList.length > 0);

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
        <ul 
          className="nav-links"
          ref={navLinksRef}
          onMouseMove={handleNavMouseMove}
          onMouseLeave={handleNavMouseLeave}
        >

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
                          ? "nav-link active"
                          : "nav-link"
                      }
                      onClick={(e) => {
                        // On touch devices without hover support, tap toggles dropdown
                        if (window.matchMedia && window.matchMedia("(hover: none)").matches) {
                          e.preventDefault();
                          setShowDropdown((prev) => !prev);
                        }
                      }}
                    >
                      <MagneticNavItem mouseX={mouseX} reducedMotion={reducedMotion}>
                        <span>{item.name}</span>
                        {hasNewNotification && (
                          <span className="nav-notif-new-tag">new</span>
                        )}
                      </MagneticNavItem>
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
                          setShowDropdown(false);
                          if (latestAlert.link && latestAlert.link.startsWith("http")) {
                            window.open(latestAlert.link, "_blank");
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
                      ? "nav-link active"
                      : "nav-link"
                  }
                >
                  <MagneticNavItem mouseX={mouseX} reducedMotion={reducedMotion}>
                    <span>{item.name}</span>
                  </MagneticNavItem>
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