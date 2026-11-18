import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API, { BACKEND_URL } from "../api/api";
import defaultBanner from "../assets/banner.webp";
import LikeReactionButton from "./LikeReactionButton";
import { formatSemDisplay } from "../utils/validators";
import { normalizeScheme } from "../utils/semester";
import {
  getCachedResource,
  hasCachedResource,
  fetchResourceWithCache,
  updateCachedResourceItem,
} from "../utils/resourceCache";

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

  const [papers, setPapers] = useState(() => getCachedResource("papers") || []);
  const [blinkingPaperId, setBlinkingPaperId] = useState(null);
  const [loading, setLoading] = useState(() => !hasCachedResource("papers"));
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
  // FETCH QUESTION PAPERS (STALE-WHILE-REVALIDATE)
  // ==========================================

  useEffect(() => {
    fetchPapers();

    const handleUpdated = (e) => {
      const fresh = e?.detail?.papers || getCachedResource("papers");
      if (Array.isArray(fresh) && fresh.length > 0) {
        setPapers(fresh);
        setLoading(false);
      }
    };
    window.addEventListener("resourcesUpdated", handleUpdated);
    return () => window.removeEventListener("resourcesUpdated", handleUpdated);
  }, []);

  const fetchPapers = async () => {
    try {
      if (!hasCachedResource("papers")) {
        setLoading(true);
      }
      setError("");

      const data = await fetchResourceWithCache("papers", "/papers");
      if (Array.isArray(data) && data.length > 0) {
        setPapers(data);
      }
    } catch (err) {
      console.error("Fetch Question Papers Error:", err);
      if (!hasCachedResource("papers")) {
        setError(
          err.response?.data?.message || "Unable to load question papers."
        );
        setPapers([]);
      }
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
                {/* Subject Code & Scheme Badges */}
                <div className="card-code-row">
                  <span className="card-scheme-badge" title={`Academic Regulation Scheme: ${normalizeScheme(paper)} Scheme`}>
                    {normalizeScheme(paper).includes("Scheme") ? normalizeScheme(paper) : `${normalizeScheme(paper)} Scheme`}
                  </span>
                  {paper.subjectCode && (
                    <span className="card-code-badge" title={`Subject Code: ${paper.subjectCode}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {paper.subjectCode}
                    </span>
                  )}
                  {paper.branch && (
                    <span className="card-branch-badge" title={`Branch: ${paper.branch}`}>
                      {paper.branch}
                    </span>
                  )}
                  {paper.semester && (
                    <span className="card-sem-badge" title={`Semester: ${formatSemDisplay(paper.semester)}`}>
                      Sem {String(formatSemDisplay(paper.semester)).replace(/^sem\s*/i, "")}
                    </span>
                  )}
                </div>

                {/* Subject Name */}
                <h3 className="resource-title" title={getPaperDisplayTitle(paper)}>
                  {getPaperDisplayTitle(paper)}
                </h3>

                {/* Subject Description in the gap */}
                <p className="card-subject-snippet" title={getPaperSnippet(paper)}>
                  {getPaperSnippet(paper)}
                </p>

                {/* Spacer */}
                <div className="resource-content-spacer" />

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
