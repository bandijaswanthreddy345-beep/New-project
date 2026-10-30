import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";
import LikeReactionButton from "../components/LikeReactionButton";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Syllabus.css";

// Branch definitions matching homepage engineering departments
const BRANCH_FILTERS = [
  { key: "ALL", codeBadge: "ALL", label: "All Branches" },
  { key: "CSE", codeBadge: "CSE", label: "Computer Science", matchTerms: ["cse", "computer science"] },
  { key: "ECE", codeBadge: "ECE", label: "Electronics & Comm", matchTerms: ["ece", "electronics"] },
  { key: "ME", codeBadge: "ME", label: "Mechanical Engineering", matchTerms: ["me", "mech", "mechanical"] },
  { key: "CE", codeBadge: "CE", label: "Civil Engineering", matchTerms: ["ce", "civil"] },
  { key: "AIML", codeBadge: "AIML", label: "AI & Machine Learning", matchTerms: ["aiml", "artificial intelligence", "machine learning"] },
  { key: "EEE", codeBadge: "EEE", label: "Electrical & Electronics", matchTerms: ["eee", "electrical", "ee"] },
];

const SEMESTER_OPTIONS = [
  { value: "ALL", label: "All Semesters" },
  { value: "1st Semester", label: "1st Semester" },
  { value: "2nd Semester", label: "2nd Semester" },
  { value: "3rd Semester", label: "3rd Semester" },
  { value: "4th Semester", label: "4th Semester" },
  { value: "5th Semester", label: "5th Semester" },
  { value: "6th Semester", label: "6th Semester" },
  { value: "7th Semester", label: "7th Semester" },
  { value: "8th Semester", label: "8th Semester" },
];

function Syllabus({ search: propSearch = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isStandalonePage = location.pathname.startsWith("/syllabus") || location.pathname !== "/";

  const [syllabusList, setSyllabusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const urlSearch = searchParams.get("search") || searchParams.get("branch") || "";
  const [searchQuery, setSearchQuery] = useState(propSearch || urlSearch || "");
  const [activeBranch, setActiveBranch] = useState("ALL");
  const [activeSemester, setActiveSemester] = useState("ALL");

  // Synchronize URL param changes
  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("branch");
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Resilient Like Reaction State
  const [likedSyllabusIds, setLikedSyllabusIds] = useState(() => {
    try {
      const saved = localStorage.getItem("andhra_liked_syllabus");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  // ==========================================
  // FETCH SYLLABUS DATA
  // ==========================================
  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("/syllabus");
      const data = Array.isArray(response.data) ? response.data : [];
      setSyllabusList(data);
    } catch (err) {
      console.error("Fetch Syllabus Error:", err);
      setError(
        err.response?.data?.message || "Unable to load curriculum syllabus."
      );
      setSyllabusList([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH & FILTER LOGIC
  // ==========================================
  const filteredSyllabus = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return syllabusList.filter((item) => {
      // 1. Text Search Filter
      if (query) {
        const matchesQuery =
          String(item.title || "").toLowerCase().includes(query) ||
          String(item.branch || "").toLowerCase().includes(query) ||
          String(item.semester || "").toLowerCase().includes(query) ||
          String(item.subject || "").toLowerCase().includes(query) ||
          String(item.subjectCode || "").toLowerCase().includes(query) ||
          String(item.description || "").toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Branch Filter
      if (activeBranch !== "ALL") {
        const filterDef = BRANCH_FILTERS.find((b) => b.key === activeBranch);
        const itemBranch = String(item.branch || "").toLowerCase();
        if (filterDef && filterDef.matchTerms) {
          const match = filterDef.matchTerms.some((term) =>
            itemBranch.includes(term)
          );
          if (!match && !itemBranch.includes(filterDef.label.toLowerCase())) {
            return false;
          }
        } else if (!itemBranch.includes(activeBranch.toLowerCase())) {
          return false;
        }
      }

      // 3. Semester Filter
      if (activeSemester !== "ALL") {
        const itemSem = String(item.semester || "").toLowerCase();
        const targetSem = activeSemester.toLowerCase();
        if (!itemSem.includes(targetSem)) {
          return false;
        }
      }

      return true;
    });
  }, [syllabusList, searchQuery, activeBranch, activeSemester]);

  // ==========================================
  // TITLE & CONTEXT HELPERS
  // ==========================================
  const getSyllabusDisplayTitle = (item) => {
    if (!item || !item.title) return "Syllabus";
    const raw = String(item.title).trim();
    if (!raw) return "Syllabus";
    const words = raw.split(/\s+/).map((w) => {
      if (w.length <= 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
    return words.join(" ");
  };

  const getSyllabusContext = (item) => {
    if (item && item.description && item.description.trim()) {
      const desc = item.description.trim();
      if (!desc.startsWith("Official university course structure")) {
        return desc;
      }
    }
    return "";
  };

  const getBackendBaseUrl = () => {
    const apiBaseUrl = API.defaults?.baseURL || "http://localhost:5000/api";
    return apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  };

  const getPdfUrl = (pdfUrl) => {
    if (!pdfUrl) return "";
    let value = String(pdfUrl).trim();
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    if (!value.startsWith("/")) {
      value = `/${value}`;
    }
    const backendBaseUrl = getBackendBaseUrl();
    return `${backendBaseUrl}${value}`;
  };

  const getPdfFileName = (pdfUrl) => {
    if (!pdfUrl) return "";
    try {
      const pathname = new URL(getPdfUrl(pdfUrl)).pathname;
      return decodeURIComponent(pathname.split("/").pop() || "");
    } catch (error) {
      console.error("Unable to determine syllabus file name:", error);
      return "";
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // ==========================================
  // LIKE REACTION TOGGLE
  // ==========================================
  const handleToggleLike = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const syllabusId = item._id;
    if (!syllabusId) return;

    const isLiked = likedSyllabusIds.has(syllabusId);
    const action = isLiked ? "unlike" : "like";

    // 1. Optimistic Local State
    setLikedSyllabusIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(syllabusId);
      } else {
        next.add(syllabusId);
      }
      try {
        localStorage.setItem("andhra_liked_syllabus", JSON.stringify([...next]));
      } catch (err) {
        console.error("Error saving liked syllabus:", err);
      }
      return next;
    });

    // 2. Optimistic Counter
    setSyllabusList((prevList) =>
      prevList.map((s) => {
        if (s._id === syllabusId) {
          const cur = typeof s.likes === "number" && !isNaN(s.likes) ? s.likes : 0;
          return {
            ...s,
            likes: Math.max(0, cur + (isLiked ? -1 : 1)),
          };
        }
        return s;
      })
    );

    // 3. Persist to Backend API
    try {
      const res = await API.put(`/syllabus/${syllabusId}/like`, { action });
      if (res.data && typeof res.data.likes === "number") {
        setSyllabusList((prevList) =>
          prevList.map((s) =>
            s._id === syllabusId ? { ...s, likes: res.data.likes } : s
          )
        );
      }
    } catch (error) {
      console.error("Error updating like reaction:", error);
      // Revert optimistic state on failure
      setLikedSyllabusIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(syllabusId);
        } else {
          next.delete(syllabusId);
        }
        try {
          localStorage.setItem("andhra_liked_syllabus", JSON.stringify([...next]));
        } catch {}
        return next;
      });

      setSyllabusList((prevList) =>
        prevList.map((s) => {
          if (s._id === syllabusId) {
            const cur = typeof s.likes === "number" && !isNaN(s.likes) ? s.likes : 0;
            return {
              ...s,
              likes: Math.max(0, cur + (isLiked ? 1 : -1)),
            };
          }
          return s;
        })
      );
    }
  };

  // ==========================================
  // VIEW PDF
  // ==========================================
  const handleView = async (item) => {
    const fileName = getPdfFileName(item.pdfUrl);

    try {
      await API.put(`/syllabus/${item._id}/view`);
      setSyllabusList((prev) =>
        prev.map((s) =>
          s._id === item._id ? { ...s, views: (s.views || 0) + 1 } : s
        )
      );
    } catch (error) {
      console.error("View count update error:", error);
    }

    if (fileName) {
      navigate(`/pdf/${encodeURIComponent(fileName)}`);
    } else if (item.pdfUrl) {
      window.open(getPdfUrl(item.pdfUrl), "_blank");
    }
  };

  // ==========================================
  // DOWNLOAD PDF
  // ==========================================
  const handleDownload = async (item) => {
    try {
      await API.put(`/syllabus/${item._id}/download`);
      setSyllabusList((prev) =>
        prev.map((s) =>
          s._id === item._id
            ? { ...s, downloads: (s.downloads || 0) + 1 }
            : s
        )
      );

      const url = getPdfUrl(item.pdfUrl);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Unable to download PDF");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const downloadName = (item.title || "syllabus")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      link.download = `${downloadName}-syllabus.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download Error:", error);
      if (item.pdfUrl) {
        window.open(getPdfUrl(item.pdfUrl), "_blank");
      }
    }
  };

  // ==========================================
  // TOP BAR (Back Button + Breadcrumbs)
  // ==========================================
  const renderTopBar = () => {
    if (!isStandalonePage) return null;

    return (
      <div className="papers-page-topbar">
        <button
          type="button"
          className="papers-back-btn"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
          title="Go back to previous page"
        >
          <span className="papers-back-icon-wrap" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </span>
          <span>Back</span>
        </button>

        <div className="papers-topbar-breadcrumb">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="papers-breadcrumb-link"
          >
            Home
          </button>
          <span className="papers-breadcrumb-slash">/</span>
          <span className="papers-breadcrumb-current">
            <span className="papers-breadcrumb-dot" aria-hidden="true" />
            Syllabus
          </span>
        </div>
      </div>
    );
  };

  // Active Branch Object for Context
  const activeBranchObj =
    BRANCH_FILTERS.find((b) => b.key === activeBranch) || BRANCH_FILTERS[0];

  // ==========================================
  // MAIN BODY RENDERER
  // ==========================================
  const content = (
    <section className="papers-section syllabus-section-container">
      {renderTopBar()}

      {/* Header Heading */}
      <div className="section-heading">
        <span className="section-tag">CURRICULUM & REGULATIONS</span>
        <h2>Syllabus</h2>
      </div>

      {/* 2-Column Split: Left Branch Sidebar + Right Content Column */}
      <div className="syllabus-workspace-layout">
        {/* Left Column: Branches Navigation Sidebar */}
        <aside className="syllabus-branch-sidebar" aria-label="Department Filter">
          <div className="branch-sidebar-card">
            <div className="branch-sidebar-header">
              <div className="branch-sidebar-title">
                <span className="branch-sidebar-icon" aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </span>
                <span>DEPARTMENTS</span>
              </div>
              <span className="branch-sidebar-badge">
                {syllabusList.length} Total
              </span>
            </div>

            <p className="branch-sidebar-caption">
              Select engineering branch to filter regulations and curriculum syllabus copies.
            </p>

            <nav className="branch-nav-list" aria-label="Branch list">
              {BRANCH_FILTERS.map((branch) => {
                const isActive = activeBranch === branch.key;
                const count =
                  branch.key === "ALL"
                    ? syllabusList.length
                    : syllabusList.filter((item) => {
                        const itemBranch = String(item.branch || "").toLowerCase();
                        return (
                          branch.matchTerms?.some((term) =>
                            itemBranch.includes(term)
                          ) || itemBranch.includes(branch.label.toLowerCase())
                        );
                      }).length;

                return (
                  <button
                    key={branch.key}
                    type="button"
                    className={`branch-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => setActiveBranch(branch.key)}
                  >
                    <div className="branch-nav-info">
                      <span className="branch-nav-code">
                        {branch.codeBadge || branch.key}
                      </span>
                      <span className="branch-nav-label" title={branch.label}>
                        {branch.label}
                      </span>
                    </div>
                    <span
                      className={`branch-nav-count ${count > 0 ? "has-count" : ""}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Column: Search Toolbar, Active Filters & Cards Grid */}
        <div className="syllabus-content-area">
          <div className="syllabus-controls-bar">
            <div className="syllabus-search-row">
              <div className="syllabus-search-box">
                <span className="syllabus-search-icon" aria-hidden="true">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="syllabus-search-input"
                  placeholder="Search syllabus by title, subject, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="syllabus-search-clear"
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="syllabus-sem-filter-wrap">
                <label htmlFor="syllabus-sem-select" className="syllabus-sem-label">
                  SEMESTER:
                </label>
                <select
                  id="syllabus-sem-select"
                  className="syllabus-sem-select"
                  value={activeSemester}
                  onChange={(e) => setActiveSemester(e.target.value)}
                >
                  {SEMESTER_OPTIONS.map((sem) => (
                    <option key={sem.value} value={sem.value}>
                      {sem.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Context Header with Active Filter Tags */}
            <div className="syllabus-feed-header">
              <div className="feed-title-wrap">
                <h3 className="feed-current-branch">
                  {activeBranch === "ALL"
                    ? "All Engineering Branches"
                    : activeBranchObj.label}
                </h3>
                <span className="feed-results-tag">
                  {filteredSyllabus.length}{" "}
                  {filteredSyllabus.length === 1 ? "Syllabus" : "Syllabi"} Found
                </span>
              </div>

              {(activeBranch !== "ALL" ||
                activeSemester !== "ALL" ||
                searchQuery) && (
                <div className="syllabus-active-tags-row">
                  <span className="active-tags-label">Active:</span>
                  {activeBranch !== "ALL" && (
                    <button
                      type="button"
                      className="active-filter-tag"
                      onClick={() => setActiveBranch("ALL")}
                      title="Clear branch filter"
                    >
                      <span>Branch: {activeBranchObj.label}</span>
                      <span className="tag-remove-x" aria-hidden="true">✕</span>
                    </button>
                  )}
                  {activeSemester !== "ALL" && (
                    <button
                      type="button"
                      className="active-filter-tag"
                      onClick={() => setActiveSemester("ALL")}
                      title="Clear semester filter"
                    >
                      <span>Semester: {activeSemester}</span>
                      <span className="tag-remove-x" aria-hidden="true">✕</span>
                    </button>
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      className="active-filter-tag"
                      onClick={() => setSearchQuery("")}
                      title="Clear search query"
                    >
                      <span>Search: "{searchQuery}"</span>
                      <span className="tag-remove-x" aria-hidden="true">✕</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="clear-all-filters-btn"
                    onClick={() => {
                      setActiveBranch("ALL");
                      setActiveSemester("ALL");
                      setSearchQuery("");
                    }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="papers-loading">Loading curriculum syllabus copies...</div>
          ) : error ? (
            <div className="error-state">
              <span>⚠️</span>
              <h3>Unable to Load Syllabus</h3>
              <p>{error}</p>
              <button type="button" onClick={fetchSyllabus}>
                Try Again
              </button>
            </div>
          ) : filteredSyllabus.length === 0 ? (
            <div className="empty-state">
              <span>📚</span>
              <h3>
                {searchQuery || activeBranch !== "ALL" || activeSemester !== "ALL"
                  ? "No syllabus found matching your filters"
                  : "No syllabus copies available"}
              </h3>
              <p>Try searching with another keyword or select another department.</p>
              {(searchQuery || activeBranch !== "ALL" || activeSemester !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveBranch("ALL");
                    setActiveSemester("ALL");
                  }}
                  style={{
                    marginTop: "14px",
                    padding: "8px 18px",
                    borderRadius: "999px",
                    background: "#013e37",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
      ) : (
        /* Cards Grid Matching Previous Question Papers Exactly */
        <div className="papers-grid">
          {filteredSyllabus.map((item) => (
            <article className="resource-card" key={item._id}>
              {/* Cover Banner with Badge */}
              <div className="resource-image">
                <img
                  src={defaultBanner}
                  alt={getSyllabusDisplayTitle(item)}
                />
                <div className="resource-image-overlay" />
                <span className="read-time">
                  Syllabus
                </span>
              </div>

              {/* Card Body */}
              <div className="resource-content">
                {/* Department Badge Row */}
                <div className="resource-badge-row">
                  <span className="resource-badge">
                    <span className="resource-badge-dot" />
                    {item.branch || "Engineering Curriculum"}
                  </span>
                </div>

                {/* Resource Title */}
                <h3
                  className="resource-title"
                  title={getSyllabusDisplayTitle(item)}
                >
                  {getSyllabusDisplayTitle(item)}
                </h3>

                {/* Resource Description (Only if provided) */}
                {getSyllabusContext(item) ? (
                  <p className="resource-desc">
                    {getSyllabusContext(item)}
                  </p>
                ) : null}

                {/* Metadata Chips */}
                <div className="resource-meta-chips">
                  {item.subject && (
                    <span
                      className="meta-chip meta-chip-subject"
                      title={`Subject: ${item.subject}`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      {item.subject}
                    </span>
                  )}

                  {item.semester && (
                    <span
                      className="meta-chip meta-chip-semester"
                      title="Academic Semester"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      {item.semester}
                    </span>
                  )}

                  {item.branch && (
                    <span
                      className="meta-chip meta-chip-code"
                      title={`Branch: ${item.branch}`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {item.branch}
                    </span>
                  )}

                  <span
                    className="meta-chip meta-chip-date"
                    title="Upload Date"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(item.createdAt) || "Recently Added"}
                  </span>
                </div>

                {/* Metrics Bar & Like Reaction */}
                <div className="resource-stats">
                  <div className="resource-stats-left">
                    <span
                      className="stat-chip stat-chip-views"
                      title={`${item.views || 0} Total Views`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="stat-count">{item.views || 0}</span>
                      <span className="stat-unit">views</span>
                    </span>

                    <span
                      className="stat-chip stat-chip-downloads"
                      title={`${item.downloads || 0} Total Downloads`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span className="stat-count">{item.downloads || 0}</span>
                      <span className="stat-unit">dls</span>
                    </span>
                  </div>

                  <LikeReactionButton
                    isLiked={likedSyllabusIds.has(item._id)}
                    count={item.likes || 0}
                    onToggle={(e) => handleToggleLike(item, e)}
                    title={
                      likedSyllabusIds.has(item._id)
                        ? "Liked"
                        : "Like syllabus copy"
                    }
                  />
                </div>

                {/* Action Buttons: View PDF & Download */}
                <div className="resource-buttons">
                  <button
                    type="button"
                    className="view-pdf-button"
                    onClick={() => handleView(item)}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View PDF
                  </button>

                  <button
                    type="button"
                    className="download-pdf-button"
                    onClick={() => handleDownload(item)}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
        </div>
      </div>
    </section>
  );

  if (isStandalonePage) {
    return (
      <div className="syllabus-page-wrapper">
        <Navbar />
        <main className="syllabus-page-main">{content}</main>
        <Footer />
      </div>
    );
  }

  return content;
}

export default Syllabus;