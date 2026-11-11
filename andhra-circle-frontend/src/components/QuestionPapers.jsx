import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API, { BACKEND_URL } from "../api/api";
import defaultBanner from "../assets/banner.webp";
import LikeReactionButton from "./LikeReactionButton";
import { normalizeSemester, normalizeScheme } from "../utils/semester";
import { formatSemDisplay } from "../utils/validators";

const getPaperSnippet = (paper) => {
  if (paper.description && paper.description.trim().length > 10) {
    return paper.description.trim();
  }
  const branchText = paper.branch ? `${paper.branch} · ` : "";
  const semText = paper.semester ? `${formatSemDisplay(paper.semester)} · ` : "";
  const subName = paper.subject || paper.title || "University Subject";
  return `Previous university examination question papers, mid-term tests & solution keys for ${subName} (${branchText}${semText}JNTU Exams).`;
};

function QuestionPapers({ search = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isStandalonePage = location.pathname.startsWith("/papers") || location.pathname !== "/";

  const [papers, setPapers] = useState([]);
  const [blinkingPaperId, setBlinkingPaperId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Instant resilient like reaction state
  const [likedPaperIds, setLikedPaperIds] = useState(() => {
    try {
      const saved = localStorage.getItem("andhra_liked_papers");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  // ==========================================
  // FETCH QUESTION PAPERS
  // ==========================================

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/papers");
      const data = Array.isArray(response.data) ? response.data : [];
      setPapers(data);
    } catch (err) {
      console.error("Fetch Question Papers Error:", err);
      setError(
        err.response?.data?.message || "Unable to load question papers."
      );
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const searchText = String(search || "").trim().toLowerCase();

  const filteredPapers = papers.filter((paper) => {
    if (!searchText) return true;
    return (
      String(paper.title || "").toLowerCase().includes(searchText) ||
      String(paper.branch || "").toLowerCase().includes(searchText) ||
      String(paper.semester || "").toLowerCase().includes(searchText) ||
      normalizeScheme(paper).toLowerCase().includes(searchText) ||
      String(paper.year || "").toLowerCase().includes(searchText) ||
      String(paper.examType || "").toLowerCase().includes(searchText) ||
      String(paper.subject || "").toLowerCase().includes(searchText) ||
      String(paper.subjectCode || "").toLowerCase().includes(searchText)
    );
  });

  // ==========================================
  // TITLE & CONTEXT HELPERS
  // ==========================================

  const getPaperDisplayTitle = (paper) => {
    if (!paper || !paper.title) return "Question Paper";
    const raw = String(paper.title).trim();
    if (!raw) return "Question Paper";
    const words = raw.split(/\s+/).map((w) => {
      if (w.length <= 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
    const formatted = words.join(" ");
    if (!formatted.toLowerCase().includes("paper") && !formatted.toLowerCase().includes("question")) {
      return `${formatted} Question Paper`;
    }
    return formatted;
  };

  const getPaperContext = (paper) => {
    if (paper && paper.description && paper.description.trim()) {
      const desc = paper.description.trim();
      if (!desc.toLowerCase().startsWith("previous university examination")) {
        return desc;
      }
    }
    return "";
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
    return `${BACKEND_URL}${value}`;
  };

  const getPdfFileName = (pdfUrl) => {
    if (!pdfUrl) return "";

    try {
      const pathname = new URL(getPdfUrl(pdfUrl)).pathname;
      return decodeURIComponent(pathname.split("/").pop() || "");
    } catch (error) {
      console.error("Unable to determine question paper file name:", error);
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

  const handleToggleLike = async (paper, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const paperId = paper._id;
    if (!paperId) return;

    const isLiked = likedPaperIds.has(paperId);
    const action = isLiked ? "unlike" : "like";

    // 1. Optimistic Local State
    setLikedPaperIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      try {
        localStorage.setItem("andhra_liked_papers", JSON.stringify([...next]));
      } catch (err) {
        console.error("Error saving liked papers:", err);
      }
      return next;
    });

    // 2. Optimistic Counter
    setPapers((prevPapers) =>
      prevPapers.map((p) => {
        if (p._id === paperId) {
          const cur = typeof p.likes === "number" && !isNaN(p.likes) ? p.likes : 0;
          return {
            ...p,
            likes: Math.max(0, cur + (isLiked ? -1 : 1)),
          };
        }
        return p;
      })
    );

    // 3. Persist to API
    try {
      const res = await API.put(`/papers/${paperId}/like`, { action });
      if (res.data && typeof res.data.likes === "number") {
        setPapers((prevPapers) =>
          prevPapers.map((p) =>
            p._id === paperId ? { ...p, likes: res.data.likes } : p
          )
        );
      }
    } catch (error) {
      console.error("Error updating like reaction:", error);
      // Revert on error
      setLikedPaperIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(paperId);
        } else {
          next.delete(paperId);
        }
        try {
          localStorage.setItem("andhra_liked_papers", JSON.stringify([...next]));
        } catch { }
        return next;
      });

      setPapers((prevPapers) =>
        prevPapers.map((p) => {
          if (p._id === paperId) {
            const cur = typeof p.likes === "number" && !isNaN(p.likes) ? p.likes : 0;
            return {
              ...p,
              likes: Math.max(0, cur + (isLiked ? 1 : -1)),
            };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // VIEW PDF
  // ==========================================

  const handleView = async (paper) => {
    const fileName = getPdfFileName(paper.pdfUrl);
    if (!fileName) {
      console.error("Question paper PDF file name is missing.");
      return;
    }

    try {
      await API.put(`/papers/${paper._id}/view`);
      setPapers((prev) =>
        prev.map((item) =>
          item._id === paper._id
            ? { ...item, views: (item.views || 0) + 1 }
            : item
        )
      );
    } catch (error) {
      console.error("View error:", error);
    }

    setBlinkingPaperId(paper._id);
    setTimeout(() => {
      navigate(`/pdf/${encodeURIComponent(fileName)}`);
      setBlinkingPaperId(null);
    }, 600);
  };

  // ==========================================
  // DOWNLOAD PDF
  // ==========================================

  const handleDownload = async (paper) => {
    try {
      await API.put(`/papers/${paper._id}/download`);
      setPapers((prev) =>
        prev.map((item) =>
          item._id === paper._id
            ? { ...item, downloads: (item.downloads || 0) + 1 }
            : item
        )
      );

      const response = await fetch(getPdfUrl(paper.pdfUrl));
      if (!response.ok) {
        throw new Error("Unable to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${paper.title || "question-paper"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
    }
  };

  // Render Top Navigation Bar with Back Button in the Left Corner
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </span>
          <span>Back</span>
        </button>

        <div className="papers-topbar-breadcrumb">
          <button type="button" onClick={() => navigate("/")} className="papers-breadcrumb-link">
            Home
          </button>
          <span className="papers-breadcrumb-slash">/</span>
          <span className="papers-breadcrumb-current">
            Question Papers
          </span>
        </div>
      </div>
    );
  };

  // ==========================================
  // LOADING UI
  // ==========================================

  if (loading) {
    return (
      <section className="papers-section">
        {renderTopBar()}
        <div className="section-heading">
          <span className="section-tag">EXAM RESOURCES</span>
          <h2>Previous Question Papers</h2>
          <p>Practice with previous examination question papers.</p>
        </div>
        <div className="papers-loading">Loading question papers...</div>
      </section>
    );
  }

  // ==========================================
  // ERROR UI
  // ==========================================

  if (error) {
    return (
      <section className="papers-section">
        {renderTopBar()}
        <div className="section-heading">
          <span className="section-tag">EXAM RESOURCES</span>
          <h2>Previous Question Papers</h2>
          <p>Practice with previous examination question papers.</p>
        </div>
        <div className="error-state">
          <span>⚠️</span>
          <h3>Unable to Load Question Papers</h3>
          <p>{error}</p>
          <button type="button" onClick={fetchPapers}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <section className="papers-section">
      {renderTopBar()}
      <div className="section-heading">
        <span className="section-tag">EXAM RESOURCES</span>
        <h2>Previous Question Papers</h2>
        <p>Practice with previous examination question papers.</p>
      </div>

      {filteredPapers.length === 0 ? (
        <div className="empty-state">
          <span>📄</span>
          <h3>
            {searchText
              ? `No question papers found for "${search}"`
              : "No question papers available"}
          </h3>
          <p>Try searching with another keyword or check again later.</p>
        </div>
      ) : (
        <div className="papers-grid">
          {filteredPapers.map((paper) => (
            <article className="resource-card" key={paper._id}>
              {/* Cover Banner */}
              <div className="resource-image">
                <img
                  src={defaultBanner}
                  alt={getPaperDisplayTitle(paper)}
                />
                <span className="read-time">
                  {paper.examType || "Question Paper"}
                </span>
              </div>

              {/* Content Body */}
              <div className="resource-content">
                {/* Subject Code Badge */}
                {paper.subjectCode && (
                  <div className="card-code-row">
                    <span className="card-code-badge" title={`Subject Code: ${paper.subjectCode}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {paper.subjectCode}
                    </span>
                  </div>
                )}

                {/* Subject Name */}
                <h3 className="resource-title" title={getPaperDisplayTitle(paper)}>
                  {getPaperDisplayTitle(paper)}
                </h3>

                {/* Subject Semester & Scheme */}
                <p className="card-subject-snippet" title={`Semester: ${normalizeSemester(paper.semester) || "1-1"} • Scheme: ${normalizeScheme(paper)}`}>
                  <span className="card-sem-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    Semester: {normalizeSemester(paper.semester) || "1-1"}
                  </span>
                  <span className="card-scheme-badge">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    {normalizeScheme(paper)} Scheme
                  </span>
                </p>

                {/* Spacer */}
                <div className="resource-content-spacer" />

                {/* Professional Metrics Bar & Like Section */}
                <div className="resource-stats">
                  <div className="resource-stats-left">
                    <span className="stat-chip stat-chip-views" title={`${paper.views || 0} Total Views`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="stat-count">{paper.views || 0}</span>
                    </span>

                    <span className="stat-chip stat-chip-downloads" title={`${paper.downloads || 0} Total Downloads`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span className="stat-count">{paper.downloads || 0}</span>
                    </span>
                  </div>

                  <LikeReactionButton
                    isLiked={likedPaperIds.has(paper._id)}
                    count={paper.likes || 0}
                    onToggle={(e) => handleToggleLike(paper, e)}
                    title={likedPaperIds.has(paper._id) ? "Liked" : "Like question paper"}
                  />
                </div>

                {/* Action Buttons */}
                <div className="resource-buttons">
                  <button
                    type="button"
                    className="view-pdf-button"
                    onClick={() => handleView(paper)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={blinkingPaperId === paper._id ? "eye-blink-anim" : ""}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View PDF
                  </button>

                  <button
                    type="button"
                    className="download-pdf-button"
                    onClick={() => handleDownload(paper)}
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

export default QuestionPapers;
