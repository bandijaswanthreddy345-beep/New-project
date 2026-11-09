import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import { clearAdminSession } from "../utils/adminSession";
import "./Dashboard.css";

const ADMIN_ACTIONS = [
  {
    id: "upload-note",
    title: "Upload Study Notes",
    desc: "Publish branch & semester-wise lecture notes, summaries, and revision guides.",
    icon: "📝",
    to: "/upload-note",
    category: "uploads",
    badge: "Notes Engine",
    color: "#fed866",
  },
  {
    id: "upload-paper",
    title: "Upload Question Papers",
    desc: "Add mid-term, end-semester, and previous year university examination papers.",
    icon: "📄",
    to: "/upload-paper",
    category: "uploads",
    badge: "Exam Papers",
    color: "#38bdf8",
  },
  {
    id: "upload-syllabus",
    title: "Upload Syllabus",
    desc: "Update official curriculum structures, unit-wise course outlines, and regulations.",
    icon: "📚",
    to: "/upload-syllabus",
    category: "uploads",
    badge: "Curriculum",
    color: "#a78bfa",
  },
  {
    id: "upload-notification",
    title: "Upload Notifications",
    desc: "Publish official university circulars, exam notifications, and key alerts.",
    icon: "🔔",
    to: "/upload-notification",
    category: "uploads",
    badge: "Announcements",
    color: "#f59e0b",
  },
  {
    id: "upload-lab-program",
    title: "Upload Lab Programs",
    desc: "Post source code, lab manuals, and step-by-step practical experiment write-ups.",
    icon: "💻",
    to: "/upload-lab-program",
    category: "uploads",
    badge: "Laboratories",
    color: "#34d399",
  },
  {
    id: "manage-resources",
    title: "Manage All Resources",
    desc: "Inspect, edit, download, or delete existing notes, question papers, syllabus, and labs.",
    icon: "⚙️",
    to: "/manage-resources",
    category: "management",
    badge: "Central Control",
    color: "#ffefb3",
  },
  {
    id: "manage-users",
    title: "Manage Users & Roles",
    desc: "View registered students, elevate trusted administrators, or manage platform permissions.",
    icon: "👥",
    to: "/manage-users",
    category: "users",
    badge: "Access Control",
    color: "#60a5fa",
  },
  {
    id: "user-uploaded-data",
    title: "Review Student Uploads",
    desc: "Moderate, verify, approve, or reject student-submitted academic contributions.",
    icon: "📥",
    to: "/user-uploaded-data",
    category: "management",
    badge: "Submissions Hub",
    color: "#f472b6",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    notes: 0,
    papers: 0,
    syllabus: 0,
    notifications: 0,
    labPrograms: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Retrieve authenticated admin user profile
  const adminUser = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      return {
        name: stored?.name || "Jaswanth",
        email: stored?.email || "bandijaswanthreddy345@gmail.com",
        role: stored?.role || "admin",
      };
    } catch {
      return {
        name: "Jaswanth",
        email: "bandijaswanthreddy345@gmail.com",
        role: "admin",
      };
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsRefreshing(true);
      const res = await API.get("/dashboard/stats");
      setStats({
        users: res.data.users || 0,
        notes: res.data.notes || 0,
        papers: res.data.papers || 0,
        syllabus: res.data.syllabus || 0,
        notifications: res.data.notifications || 0,
        labPrograms: res.data.labPrograms || 0,
      });
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out from the Admin Portal?")) {
      clearAdminSession();
      navigate("/login");
    }
  };

  const handleExitToHome = () => {
    // Automatically revoke the admin session when leaving to the public homepage
    clearAdminSession();
    navigate("/");
  };

  // Filter actions based on tab and search
  const filteredActions = useMemo(() => {
    return ADMIN_ACTIONS.filter((action) => {
      const matchesTab = activeTab === "all" || action.category === activeTab;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        action.title.toLowerCase().includes(q) ||
        action.desc.toLowerCase().includes(q) ||
        action.badge.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="admin-portal-wrapper">
      {/* =========================================================
          TOP EXECUTIVE NAVIGATION BAR (Matching Project Forest Theme)
          ========================================================= */}
      <header className="admin-portal-navbar">
        <div className="admin-portal-navbar-inner">
          <div className="admin-brand-group" onClick={handleExitToHome} title="Go to JNTU Circle Homepage (Exits Admin Session)">
            <img
              src="/jntu-circle-logo.png"
              alt="JNTU Circle"
              className="admin-portal-logo"
            />
            <div className="admin-brand-text">
              <h1 className="admin-brand-heading">
                <span className="font-deltha">JNTU</span> Circle
              </h1>
              <span className="admin-portal-badge">Admin Command Center</span>
            </div>
          </div>

          <div className="admin-nav-actions">
            <div className="admin-status-pill" title="Signed in as Master Administrator">
              <span className="admin-pulse-dot" />
              <span className="admin-user-email">{adminUser.email}</span>
            </div>

            <button
              onClick={handleExitToHome}
              className="admin-nav-btn admin-view-site-btn"
              title="Return to public homepage (Ends admin session)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Live Site</span>
            </button>

            <button
              onClick={handleLogout}
              className="admin-nav-btn admin-logout-btn"
              title="Sign out of Admin Portal"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO BANNER (Obsidian Forest & Sunbeam Gold Gradient)
          ========================================================= */}
      <section className="admin-hero-banner">
        <div className="admin-hero-content">
          <div className="admin-hero-tag">
            <span className="admin-tag-sparkle">✦</span>
            <span>Academic Portal Governance & Content Pipeline</span>
          </div>

          <h2 className="admin-hero-title">
            Welcome back, <span className="admin-name-highlight">{adminUser.name}</span>
          </h2>

          <p className="admin-hero-subtitle">
            Manage engineering study materials, university question papers, semester curriculum,
            academic announcements, and verified student contributions in real time.
          </p>

          <div className="admin-quick-pills">
            <button
              onClick={fetchStats}
              className={`admin-pill-btn ${isRefreshing ? "refreshing" : ""}`}
              title="Refresh live counts from database"
            >
              <span className="admin-btn-icon">🔄</span>
              <span>{isRefreshing ? "Syncing..." : "Sync Database"}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("uploads");
                const el = document.getElementById("admin-actions-anchor");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="admin-pill-btn"
            >
              <span className="admin-btn-icon">⚡</span>
              <span>Upload Content</span>
            </button>

            <button
              onClick={() => navigate("/manage-resources")}
              className="admin-pill-btn"
            >
              <span className="admin-btn-icon">⚙️</span>
              <span>Manage Materials</span>
            </button>

            <button
              onClick={() => navigate("/user-uploaded-data")}
              className="admin-pill-btn"
            >
              <span className="admin-btn-icon">📥</span>
              <span>Review Submissions</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN DASHBOARD CONTAINER
          ========================================================= */}
      <main className="admin-main-container">
        {/* =========================================================
            SECTION 1: LIVE METRICS & PLATFORM HEALTH (CHATBOT CARDS)
            ========================================================= */}
        <section className="admin-section">
          <div className="admin-section-header">
            <div>
              <div className="admin-section-eyebrow">
                <span className="eyebrow-dot" />
                <span>REAL-TIME PLATFORM METRICS</span>
              </div>
              <h3 className="admin-section-title">Academic Repository Statistics</h3>
            </div>

            <span className="admin-meta-time">
              Live from MongoDB Atlas • Auto-synchronized
            </span>
          </div>

          <div className="admin-stats-grid">
            {/* Users Stat */}
            <div
              className="admin-stat-card theme-emerald"
              onClick={() => navigate("/manage-users")}
              title="View and manage registered users"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">
                  <span>👥</span>
                </div>
                <span className="stat-badge-tag">Registered</span>
              </div>
              <div className="stat-card-body">
                <h4 className="stat-number">{loading ? "..." : stats.users}</h4>
                <p className="stat-label">Total Users</p>
              </div>
              <div className="stat-card-footer">
                <span className="stat-jump-text">Manage accounts</span>
                <span className="stat-arrow">→</span>
              </div>
            </div>

            {/* Notes Stat */}
            <div
              className="admin-stat-card theme-gold"
              onClick={() => navigate("/manage-resources")}
              title="Inspect uploaded study notes"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">
                  <span>📝</span>
                </div>
                <span className="stat-badge-tag">Study Guides</span>
              </div>
              <div className="stat-card-body">
                <h4 className="stat-number">{loading ? "..." : stats.notes}</h4>
                <p className="stat-label">Subject Notes</p>
              </div>
              <div className="stat-card-footer">
                <span className="stat-jump-text">View repository</span>
                <span className="stat-arrow">→</span>
              </div>
            </div>

            {/* Question Papers Stat */}
            <div
              className="admin-stat-card theme-sky"
              onClick={() => navigate("/manage-resources")}
              title="Inspect university question papers"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">
                  <span>📄</span>
                </div>
                <span className="stat-badge-tag">Previous Years</span>
              </div>
              <div className="stat-card-body">
                <h4 className="stat-number">{loading ? "..." : stats.papers}</h4>
                <p className="stat-label">Question Papers</p>
              </div>
              <div className="stat-card-footer">
                <span className="stat-jump-text">View repository</span>
                <span className="stat-arrow">→</span>
              </div>
            </div>

            {/* Syllabus Stat */}
            <div
              className="admin-stat-card theme-purple"
              onClick={() => navigate("/manage-resources")}
              title="Inspect regulation syllabus"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">
                  <span>📚</span>
                </div>
                <span className="stat-badge-tag">R23 / R20</span>
              </div>
              <div className="stat-card-body">
                <h4 className="stat-number">{loading ? "..." : stats.syllabus}</h4>
                <p className="stat-label">Syllabus Outlines</p>
              </div>
              <div className="stat-card-footer">
                <span className="stat-jump-text">View repository</span>
                <span className="stat-arrow">→</span>
              </div>
            </div>

            {/* Notifications Stat */}
            <div
              className="admin-stat-card theme-amber"
              onClick={() => navigate("/upload-notification")}
              title="Publish or manage notifications"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">
                  <span>🔔</span>
                </div>
                <span className="stat-badge-tag">Official Circulars</span>
              </div>
              <div className="stat-card-body">
                <h4 className="stat-number">{loading ? "..." : stats.notifications}</h4>
                <p className="stat-label">Notifications</p>
              </div>
              <div className="stat-card-footer">
                <span className="stat-jump-text">Manage notices</span>
                <span className="stat-arrow">→</span>
              </div>
            </div>

            {/* Lab Programs Stat */}
            <div
              className="admin-stat-card theme-cyan"
              onClick={() => navigate("/manage-resources")}
              title="Inspect uploaded lab program codes"
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">
                  <span>💻</span>
                </div>
                <span className="stat-badge-tag">Practicals</span>
              </div>
              <div className="stat-card-body">
                <h4 className="stat-number">{loading ? "..." : stats.labPrograms}</h4>
                <p className="stat-label">Lab Programs</p>
              </div>
              <div className="stat-card-footer">
                <span className="stat-jump-text">View repository</span>
                <span className="stat-arrow">→</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 2: ADMIN OPERATIONS HUB (CHATBOT FILTER STYLE)
            ========================================================= */}
        <section className="admin-section" id="admin-actions-anchor">
          <div className="admin-section-header">
            <div>
              <div className="admin-section-eyebrow">
                <span className="eyebrow-dot" />
                <span>COMMAND CENTER & ACTIONS</span>
              </div>
              <h3 className="admin-section-title">Administrative Operations</h3>
            </div>
            <p className="admin-section-desc">
              Select an action card below to publish content, configure curriculum, or manage records.
            </p>
          </div>

          {/* Interactive Chatbot-Styled Filter Toolbar */}
          <div className="admin-filter-bar">
            {/* Search Input */}
            <div className="admin-search-wrapper">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, uploads, resources, or users..."
                className="admin-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="admin-clear-search-btn"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="admin-category-tabs">
              <button
                onClick={() => setActiveTab("all")}
                className={`admin-tab-btn ${activeTab === "all" ? "active" : ""}`}
              >
                <span>All Operations</span>
                <span className="tab-count-badge">{ADMIN_ACTIONS.length}</span>
              </button>

              <button
                onClick={() => setActiveTab("uploads")}
                className={`admin-tab-btn ${activeTab === "uploads" ? "active" : ""}`}
              >
                <span>Upload Materials</span>
                <span className="tab-count-badge">5</span>
              </button>

              <button
                onClick={() => setActiveTab("management")}
                className={`admin-tab-btn ${activeTab === "management" ? "active" : ""}`}
              >
                <span>Repository Control</span>
                <span className="tab-count-badge">2</span>
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
              >
                <span>User Governance</span>
                <span className="tab-count-badge">1</span>
              </button>
            </div>
          </div>

          {/* Operations Grid */}
          <div className="admin-actions-grid">
            {filteredActions.length > 0 ? (
              filteredActions.map((action) => (
                <Link
                  key={action.id}
                  to={action.to}
                  className="admin-action-card"
                  style={{ "--action-color": action.color }}
                >
                  <div className="action-card-top">
                    <div className="action-icon-pill">
                      <span>{action.icon}</span>
                    </div>
                    <span className="action-badge-chip">{action.badge}</span>
                  </div>

                  <div className="action-card-content">
                    <h4 className="action-title">{action.title}</h4>
                    <p className="action-desc">{action.desc}</p>
                  </div>

                  <div className="action-card-footer">
                    <span className="action-launch-text">Launch Tool</span>
                    <div className="action-arrow-bubble">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="admin-no-results">
                <span className="no-results-icon">🔎</span>
                <h4>No matching admin actions found</h4>
                <p>Try searching for a different keyword like "note", "paper", "syllabus", or "user".</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                  className="admin-reset-filter-btn"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            SECTION 3: SYSTEM INTEGRITY & FOOTER STATUS
            ========================================================= */}
        <section className="admin-system-footer">
          <div className="system-footer-left">
            <span className="system-shield-icon">🛡️</span>
            <div>
              <p className="system-status-title">JNTU Circle Academic Infrastructure</p>
              <p className="system-status-meta">
                Protected by JWT Admin Middleware • MongoDB Atlas Cluster active • Node.js API
              </p>
            </div>
          </div>

          <div className="system-footer-right">
            <button
              onClick={handleExitToHome}
              className="system-home-btn"
              title="Return to homepage (Secures and ends admin session)"
            >
              ← Back to Homepage
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
