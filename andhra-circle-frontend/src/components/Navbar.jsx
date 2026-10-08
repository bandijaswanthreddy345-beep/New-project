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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    hoverTimeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 160);
  };

  // Close notification dropdown when tapping outside
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

  const latestAlert = notificationsList[0] || FALLBACK_NOTICES[0];
  const hasNewNotification = Boolean(notificationsList && notificationsList.length > 0);

  const navigationLinks = [
    { name: "Home", path: "/" },
    { name: "CGPA Calculator", path: "/calculator" },
    { name: "JNTU Reports", path: "/reports" },
    { name: "Upload", path: "/upload-materials" },
    { name: "Student Profile", path: "/profile" },
    { name: "Notifications", path: "/notifications" },
  ];

  return (
    <header className="site-header">
      {/* LOGO WITH EMERALD HORIZON CIRCLE MARK */}
      <Link className="logo" to="/" aria-label="JNTU Circle home">
        <span className="logo-mark"></span>
        <span>JNTU<span>CIRCLE</span></span>
      </Link>

      {/* DESKTOP & MOBILE NAVIGATION */}
      <nav
        className={`desktop-nav ${mobileMenuOpen ? "mobile-open" : ""}`}
        aria-label="Main navigation"
      >
        {navigationLinks.map((item) => {
          if (item.name === "Notifications") {
            return (
              <div
                key={item.path}
                className="nav-item-notif"
                ref={notifContainerRef}
                onMouseEnter={handleNotifMouseEnter}
                onMouseLeave={handleNotifMouseLeave}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.name}</span>
                  {hasNewNotification && (
                    <span className="nav-notif-new-tag">new</span>
                  )}
                </NavLink>

                {/* Notification Strip Tooltip */}
                {latestAlert && (
                  <div
                    className={`nav-notif-dropdown ${showDropdown ? "is-open" : ""}`}
                    role="tooltip"
                    aria-label="Notification Preview"
                    onMouseEnter={handleNotifMouseEnter}
                    onMouseLeave={handleNotifMouseLeave}
                    onClick={() => {
                      setShowDropdown(false);
                      setMobileMenuOpen(false);
                      if (latestAlert.link && latestAlert.link.startsWith("http")) {
                        window.open(latestAlert.link, "_blank");
                      } else {
                        navigate("/notifications");
                      }
                    }}
                    title={latestAlert.title}
                  >
                    <div className="notif-dropdown-arrow" />
                    <span className="notif-strip-title">{latestAlert.title}</span>
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* GET STARTED / LOGIN BUTTON */}
      <Link className="header-btn" to="/login">
        Get Started <span>→</span>
      </Link>

      {/* MOBILE MENU TOGGLE */}
      <button
        className="menu-btn"
        aria-label="Open menu"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>
    </header>
  );
}

export default Navbar;