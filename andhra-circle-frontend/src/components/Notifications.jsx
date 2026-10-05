import { useEffect, useState, useMemo } from "react";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";
import LikeReactionButton from "./LikeReactionButton";

// Curated official JNTU academic notices as standard fallback
const CURATED_NOTICES = [
  {
    _id: "notice-jntu-01",
    title: "JNTU B.Tech R20/R23 Semester End Examination Timetable 2024-25",
    description: "Official schedule for regular and supplementary examinations commencing next month. Hall tickets will be issued one week prior to commencement.",
    category: "EXAM",
    publishedDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    views: 1420,
    downloads: 512,
    likes: 145,
    link: "https://jntuk.edu.in",
  },
  {
    _id: "notice-jntu-02",
    title: "Revised Academic Calendar & Instruction Days for 2nd, 3rd & 4th Years",
    description: "University circular detailing working Saturdays, mid-term assessment schedules, and practical examination guidelines.",
    category: "CIRCULAR",
    publishedDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    views: 980,
    downloads: 340,
    likes: 98,
    link: "https://jntua.ac.in",
  },
  {
    _id: "notice-jntu-03",
    title: "Revaluation & Recounting Results for 2-1 and 3-1 Regular Examinations",
    description: "Results portal is now active for verification. Students may check updated grades and request duplicate scorecards.",
    category: "RESULTS",
    publishedDate: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    views: 1890,
    downloads: 720,
    likes: 230,
    link: "https://jntukresults.edu.in",
  },
  {
    _id: "notice-jntu-04",
    title: "AICTE & JNTU Internship Guidelines & Credit Transfer Notification",
    description: "Mandatory industrial internship rules for 6th and 7th semester engineering students with list of accredited portal partners.",
    category: "GENERAL",
    publishedDate: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    views: 820,
    downloads: 310,
    likes: 74,
    link: "https://jntuk.edu.in",
  },
];

function Notifications({ search = "" }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedNotifIds, setLikedNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem("andhra_liked_notifications");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/notifications");
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Combine backend notices with curated defaults
  const combinedNotices = useMemo(() => {
    const list = [...notifications];
    CURATED_NOTICES.forEach((c) => {
      if (!list.some((n) => (n.title || "").toLowerCase() === c.title.toLowerCase())) {
        list.push(c);
      }
    });
    return list;
  }, [notifications]);

  // Compute live metrics for the counter portion
  const metrics = useMemo(() => {
    const total = combinedNotices.length;
    const exams = combinedNotices.filter((n) => {
      const cat = (n.category || "").toUpperCase();
      const t = (n.title || "").toLowerCase();
      return cat.includes("EXAM") || t.includes("exam") || t.includes("timetable");
    }).length;

    const circulars = combinedNotices.filter((n) => {
      const cat = (n.category || "").toUpperCase();
      const t = (n.title || "").toLowerCase();
      return cat.includes("CIRCULAR") || t.includes("circular") || t.includes("calendar");
    }).length;

    const totalViews = combinedNotices.reduce((acc, n) => acc + (n.views || 0), 0);

    return { total, exams, circulars, totalViews };
  }, [combinedNotices]);

  // Latest notice for the breaking bulletin ticker
  const latestNotice = useMemo(() => {
    if (combinedNotices.length === 0) return null;
    return combinedNotices[0];
  }, [combinedNotices]);

  // Filtered list based on search and selected category
  const searchText = String(search).trim().toLowerCase();

  const displayedNotifications = useMemo(() => {
    return combinedNotices.filter((notification) => {
      // 1. Text Search matching
      if (searchText) {
        const matchesSearch =
          notification.title?.toLowerCase().includes(searchText) ||
          notification.description?.toLowerCase().includes(searchText) ||
          notification.category?.toLowerCase().includes(searchText);
        if (!matchesSearch) return false;
      }

      // 2. Category Pill Filter
      if (activeCategory !== "ALL") {
        const cat = (notification.category || "GENERAL").toUpperCase();
        const titleText = (notification.title || "").toLowerCase();

        if (activeCategory === "EXAM") {
          return cat.includes("EXAM") || titleText.includes("exam") || titleText.includes("timetable");
        }
        if (activeCategory === "CIRCULAR") {
          return cat.includes("CIRCULAR") || titleText.includes("calendar");
        }
        if (activeCategory === "RESULTS") {
          return cat.includes("RESULTS") || titleText.includes("result");
        }
        if (activeCategory === "GENERAL") {
          return cat.includes("GENERAL") || (!cat.includes("EXAM") && !cat.includes("CIRCULAR") && !cat.includes("RESULTS"));
        }
      }

      return true;
    });
  }, [combinedNotices, searchText, activeCategory]);

  const formatDate = (date) => {
    if (!date) return "Recent";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const handleDownload = async (notification) => {
    try {
      if (notification._id && !notification._id.startsWith("notice-")) {
        await API.put(`/notifications/${notification._id}/download`);
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, downloads: (item.downloads || 0) + 1 }
            : item
        )
      );

      if (!notification.link) {
        alert("No file attached to this circular.");
        return;
      }

      window.open(notification.link, "_blank");
    } catch (error) {
      console.error(error);
    }
  };

    const handleToggleLike = async (notification, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const notifId = notification._id;
    if (!notifId) return;

    const isLiked = likedNotifIds.has(notifId);
    const action = isLiked ? "unlike" : "like";

    // 1. Optimistic Local Set
    setLikedNotifIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(notifId);
      } else {
        next.add(notifId);
      }
      try {
        localStorage.setItem("andhra_liked_notifications", JSON.stringify([...next]));
      } catch (err) {
        console.error("Error saving liked notifications:", err);
      }
      return next;
    });

    // 2. Optimistic Counter
    setNotifications((prevNotifs) =>
      prevNotifs.map((n) => {
        if (n._id === notifId) {
          const cur = typeof n.likes === "number" && !isNaN(n.likes) ? n.likes : 0;
          return {
            ...n,
            likes: Math.max(0, cur + (isLiked ? -1 : 1)),
          };
        }
        return n;
      })
    );

    // 3. Persist to API
    try {
      if (!notifId.startsWith("notice-")) {
        const res = await API.put(`/notifications/${notifId}/like`, { action });
        if (res.data && typeof res.data.likes === "number") {
          setNotifications((prevNotifs) =>
            prevNotifs.map((n) =>
              n._id === notifId ? { ...n, likes: res.data.likes } : n
            )
          );
        }
      }
    } catch (error) {
      console.error("Error updating notification like:", error);
      // Revert on error
      setLikedNotifIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(notifId);
        } else {
          next.delete(notifId);
        }
        try {
          localStorage.setItem("andhra_liked_notifications", JSON.stringify([...next]));
        } catch {}
        return next;
      });

      setNotifications((prevNotifs) =>
        prevNotifs.map((n) => {
          if (n._id === notifId) {
            const cur = typeof n.likes === "number" && !isNaN(n.likes) ? n.likes : 0;
            return {
              ...n,
              likes: Math.max(0, cur + (isLiked ? 1 : -1)),
            };
          }
          return n;
        })
      );
    }
  };

  const handleView = async (notification) => {
    try {
      if (notification._id && !notification._id.startsWith("notice-")) {
        await API.put(`/notifications/${notification._id}/view`);
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, views: (item.views || 0) + 1 }
            : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Category filter list
  const categoryFilters = [
    { key: "ALL", label: "All Notices", count: combinedNotices.length },
    { key: "EXAM", label: "Exams & Timetables", count: metrics.exams },
    { key: "CIRCULAR", label: "Academic Circulars", count: metrics.circulars },
    { key: "RESULTS", label: "Results", count: combinedNotices.filter((n) => (n.category || "").toUpperCase().includes("RESULT") || (n.title || "").toLowerCase().includes("result")).length },
    { key: "GENERAL", label: "General Updates", count: combinedNotices.filter((n) => (n.category || "").toUpperCase() === "GENERAL").length },
  ];

  return (
    <section id="notifications-section" className="notification-section">
      {/* Standard Section Heading */}
      <div className="section-heading">
        <span className="section-tag">UNIVERSITY ANNOUNCEMENTS</span>
        <h2>Notifications & Circulars</h2>
        <p>Stay updated with official JNTU university notices, examination circulars, and academic bulletins.</p>
      </div>

      {/* =========================================================
          NEW PORTION: QUICK NOTICE SUMMARY / LIVE UPDATES COUNTER
          ========================================================= */}
      <div className="notifications-summary-hub">
        <div className="summary-hub-header">
          <div className="summary-hub-title-group">
            <span className="live-status-pill">
              <span className="live-pulse-dot" />
              LIVE JNTU CIRCULARS
            </span>
            <h3 className="summary-hub-heading">Quick Notice Summary & Live Updates Counter</h3>
            <p className="summary-hub-sub">
              Real-time feed of board decisions, exam timetables, academic calendars, and university circulars.
            </p>
          </div>

          <div className="summary-hub-refresh">
            <button
              type="button"
              className={`summary-refresh-btn ${isRefreshing ? "refreshing" : ""}`}
              onClick={handleManualRefresh}
              title="Sync with live university announcements"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="refresh-icon">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{isRefreshing ? "Syncing..." : "Live Sync"}</span>
            </button>
            <span className="live-timestamp">Updated {formatTimeAgo(lastUpdated)}</span>
          </div>
        </div>

        {/* 4 Responsive Stat Counter Cards */}
        <div className="summary-metrics-grid">
          {/* Stat 1: Total Active Notices */}
          <div className="summary-stat-card">
            <div className="stat-card-icon stat-icon-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="stat-card-data">
              <span className="stat-card-number">{metrics.total}</span>
              <span className="stat-card-label">Active Notices</span>
            </div>
          </div>

          {/* Stat 2: Exam Circulars & Timetables */}
          <div className="summary-stat-card">
            <div className="stat-card-icon stat-icon-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-card-data">
              <span className="stat-card-number">{metrics.exams}</span>
              <span className="stat-card-label">Exam Circulars</span>
            </div>
          </div>

          {/* Stat 3: University Academic Circulars */}
          <div className="summary-stat-card">
            <div className="stat-card-icon stat-icon-cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="stat-card-data">
              <span className="stat-card-number">{metrics.circulars}</span>
              <span className="stat-card-label">Academic Circulars</span>
            </div>
          </div>

          {/* Stat 4: Total Student Reads / Engagements */}
          <div className="summary-stat-card">
            <div className="stat-card-icon stat-icon-gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="stat-card-data">
              <span className="stat-card-number">
                {metrics.totalViews > 999 ? `${(metrics.totalViews / 1000).toFixed(1)}k` : metrics.totalViews}
              </span>
              <span className="stat-card-label">Student Reads</span>
            </div>
          </div>
        </div>

        {/* Breaking / Latest Bulletin Ticker */}
        {latestNotice && (
          <div className="summary-latest-ticker">
            <div className="ticker-badge">
              <span className="ticker-badge-pulse" />
              LATEST BULLETIN
            </div>
            <div className="ticker-content">
              <span className="ticker-title">{latestNotice.title}</span>
              <span className="ticker-date">• Published {formatDate(latestNotice.publishedDate)}</span>
            </div>
            {latestNotice.link && (
              <a
                href={latestNotice.link}
                target="_blank"
                rel="noreferrer"
                className="ticker-action-link"
              >
                View Circular →
              </a>
            )}
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="summary-filter-pills">
          {categoryFilters.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`summary-pill-btn ${activeCategory === cat.key ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              <span>{cat.label}</span>
              <span className="pill-badge">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          NOTIFICATIONS GRID
          ========================================================= */}
      {loading ? (
        <div className="papers-loading">Loading live notifications...</div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchNotifications}>Try Again</button>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="empty-state">No notifications found matching your selection.</div>
      ) : (
        <div className="papers-grid">
          {displayedNotifications.map((notification) => (
            <article className="resource-card" key={notification._id}>
              <div className="resource-image">
                <img src={defaultBanner} alt={notification.title} />
                <span className="read-time">
                  {notification.category || "Notification"}
                </span>
              </div>

              <div className="resource-content">
                <div className="resource-badge-row">
                  <span className="resource-badge">
                    <span className="resource-badge-dot" />
                    {notification.category || "GENERAL"}
                  </span>
                </div>

                <h3 className="resource-title" title={notification.title}>
                  {notification.title}
                </h3>

                <p className="resource-desc">
                  {notification.description || "Official circular published by JNTU administrative board."}
                </p>

                <div className="resource-meta-chips">
                  <span className="meta-chip meta-chip-date" title="Publish Date">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(notification.publishedDate)}
                  </span>

                  <span className="meta-chip meta-chip-category" title="Circular Category">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    {notification.category || "General"}
                  </span>
                </div>

                <div className="resource-stats">
                  <div className="resource-stats-left">
                    <span className="stat-chip stat-chip-views" title={`${notification.views || 0} Total Views`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="stat-count">{notification.views || 0}</span>
                      <span className="stat-unit">views</span>
                    </span>

                    <span className="stat-chip stat-chip-downloads" title={`${notification.downloads || 0} Total Downloads`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span className="stat-count">{notification.downloads || 0}</span>
                      <span className="stat-unit">dls</span>
                    </span>
                  </div>

                  <LikeReactionButton
                    isLiked={likedNotifIds.has(notification._id)}
                    count={notification.likes || 0}
                    onToggle={(e) => handleToggleLike(notification, e)}
                    title={likedNotifIds.has(notification._id) ? "Liked" : "Like notification"}
                  />
                </div>

                <div className="resource-buttons">
                  <a
                    href={notification.link || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="view-pdf-button"
                    onClick={() => handleView(notification)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View Details
                  </a>

                  <button
                    type="button"
                    className="download-pdf-button"
                    onClick={() => handleDownload(notification)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Notifications;
