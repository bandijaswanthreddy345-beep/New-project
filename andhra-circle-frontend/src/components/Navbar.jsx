import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";
import brandLogo from "../assets/jntu-brand-logo-v2.png";

function Navbar({ onOpenProfile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [latestAlert, setLatestAlert] = useState(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifContainerRef = useRef(null);
  const notifHoverTimeoutRef = useRef(null);

  // Fetch notifications and initialize auto-popup
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.notifications)
          ? res.data.notifications
          : [];
        if (list.length > 0 && isMounted) {
          setUnreadCount(list.length);
          setLatestAlert(list[0]);
        } else if (isMounted) {
          setLatestAlert({
            title: "B.Tech R20/R23 Semester Exam Notifications Released",
            category: "EXAM",
          });
        }
      } catch {
        if (isMounted) {
          setUnreadCount(1);
          setLatestAlert({
            title: "B.Tech R20/R23 Semester Exam Notifications Released",
            category: "EXAM",
          });
        }
      }
    };
    fetchNotifications();

    // Automatically trigger notification popup under the tab after 1.2s as previously implemented
    const timer = setTimeout(() => {
      if (isMounted) {
        setShowNotifDropdown(true);
      }
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (notifHoverTimeoutRef.current) clearTimeout(notifHoverTimeoutRef.current);
    };
  }, []);

  // Hover handlers for smooth hover dropdown behavior
  const handleNotifMouseEnter = () => {
    if (notifHoverTimeoutRef.current) {
      clearTimeout(notifHoverTimeoutRef.current);
      notifHoverTimeoutRef.current = null;
    }
    setShowNotifDropdown(true);
  };

  const handleNotifMouseLeave = () => {
    if (notifHoverTimeoutRef.current) {
      clearTimeout(notifHoverTimeoutRef.current);
    }
    notifHoverTimeoutRef.current = setTimeout(() => {
      setShowNotifDropdown(false);
    }, 200);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const handleProfileClick = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      navigate("/profile");
    }
  };

  const navLinks = [
    {
      name: "HOME",
      path: "/",
      icon: (
        <svg className="w-4 h-4 shrink-0 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      name: "CGPA",
      path: "/cgpa-calculator",
      icon: (
        <svg className="w-4 h-4 shrink-0 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" />
          <line x1="8" x2="16" y1="6" y2="6" />
          <line x1="16" x2="16" y1="14" />
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
      name: "SGPA",
      path: "/sgpa-calculator",
      icon: (
        <svg className="w-4 h-4 shrink-0 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      name: "UPLOAD",
      path: "/upload-materials",
      icon: (
        <svg className="w-4 h-4 shrink-0 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="m16 16-4-4-4 4" />
        </svg>
      ),
    },
    {
      name: "NOTIFICATIONS",
      path: "/notifications",
      hasBadge: true,
      icon: (
        <svg className="w-4 h-4 shrink-0 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      ),
    },
  ];

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-[#12131B]/95 backdrop-blur-xl border-b border-[#292733] shadow-md">
      <div className="h-16 max-w-[1440px] mx-auto px-margin-mobile md:px-margin flex items-center justify-between gap-space-md">
        
        {/* Brand Crest & Logo */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img
              alt="JNTU Circle Crest"
              className="h-9 w-9 rounded-full object-cover shadow-sm select-none"
              src={brandLogo}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/jntu-brand-logo-v2.png";
              }}
            />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-brand-serif text-[22px] font-bold tracking-tight text-[#F5F5FA] flex items-center">
                  JNTU&nbsp;
                  <span
                    className="jntu-logo-circle font-bold"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "#C4B5FD",
                      display: "inline-block",
                    }}
                  >
                    Circle
                  </span>
                </span>
              </div>
              <span className="font-label-mono-sm text-[11px] font-medium tracking-wider uppercase text-[#A3A3B5]">
                Academic Resource hub
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-space-sm shrink-0">
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3 text-[12px] font-semibold text-[#A3A3B5] mr-2">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path === "/cgpa-calculator" && (location.pathname === "/cgpa-calculator" || (location.pathname === "/calculator" && location.search.includes("cgpa")))) ||
                (link.path === "/sgpa-calculator" && (location.pathname === "/sgpa-calculator" || (location.pathname === "/calculator" && !location.search.includes("cgpa"))));

              if (link.name === "NOTIFICATIONS") {
                return (
                  <div
                    key={link.path}
                    ref={notifContainerRef}
                    className="relative nav-item-notif flex items-center"
                    onMouseEnter={handleNotifMouseEnter}
                    onMouseLeave={handleNotifMouseLeave}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setShowNotifDropdown(false)}
                      className={`flex items-center gap-1.5 transition-all py-1 px-3 rounded-full uppercase tracking-wider font-semibold relative ${
                        isActive
                          ? "text-[#C4B5FD] bg-[#27213B] border border-[#8B5CF6]/30 shadow-sm"
                          : "hover:text-[#F5F5FA] hover:bg-[#27213B]/40"
                      }`}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                      {link.hasBadge && unreadCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8F268] absolute top-1 right-1 shadow-[0_0_6px_#B8F268]" />
                      )}
                    </Link>

                    {/* Notification Popup Tooltip Strip */}
                    {latestAlert && (
                      <div
                        className={`nav-notif-dropdown ${showNotifDropdown ? "is-open" : ""}`}
                        role="tooltip"
                        aria-label="Notification Preview"
                        onClick={() => {
                          setShowNotifDropdown(false);
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
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 transition-all py-1 px-3 rounded-full uppercase tracking-wider font-semibold relative ${
                    isActive
                      ? "text-[#C4B5FD] bg-[#27213B] border border-[#8B5CF6]/30 shadow-sm"
                      : "hover:text-[#F5F5FA] hover:bg-[#27213B]/40"
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                  {link.hasBadge && unreadCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8F268] absolute top-1 right-1 shadow-[0_0_6px_#B8F268]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Student Portal Button (Header Order: Left, Behind Action: Opens Student Profile / Portal Modal) */}
          <button
            type="button"
            onClick={handleProfileClick}
            className="px-4 py-1.5 rounded-full bg-[#d0bcff] text-[#23005c] font-body-sm text-[13px] font-bold hover:bg-[#c4b5fd] transition-all shadow-[0_0_16px_rgba(208,188,255,0.3)] cursor-pointer"
            title="Student Portal Profile"
            aria-label="Student Portal"
          >
            Student Portal
          </button>

          {/* User Account / Login Avatar Button (Header Order: Right, Behind Action: Normal Sign In / Account) */}
          <Link
            to="/login"
            className="w-8 h-8 rounded-full bg-[#12131B] border border-[#8B5CF6]/50 flex items-center justify-center cursor-pointer hover:bg-[#27213B] hover:border-[#8B5CF6] transition-all shadow-sm"
            title="Sign In / Account"
            aria-label="Sign In / Account"
          >
            <svg
              className="w-4 h-4 text-[#C4B5FD] stroke-current fill-none stroke-[2]"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="lg:hidden p-2 text-[#A3A3B5] hover:text-[#F5F5FA] focus:outline-none ml-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#12131B] border-b border-[#292733] px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2 text-[#A3A3B5] hover:text-[#C4B5FD] font-medium"
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
          <div className="pt-2 border-t border-[#292733] flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleProfileClick();
              }}
              className="text-[#C4B5FD] text-sm font-semibold"
            >
              Student Portal →
            </button>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-[#A3A3B5] hover:text-[#F5F5FA]"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;