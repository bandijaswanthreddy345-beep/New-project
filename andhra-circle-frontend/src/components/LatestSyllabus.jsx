import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { BACKEND_URL } from "../api/api";
import defaultBanner from "../assets/banner.webp";
import LikeReactionButton from "./LikeReactionButton";
import { formatSemDisplay } from "../utils/validators";

const getSyllabusSnippet = (item) => {
  if (item.description && item.description.trim().length > 10) {
    return item.description.trim();
  }
  const branchText = item.branch ? `${item.branch} · ` : "";
  const semText = item.semester ? `${formatSemDisplay(item.semester)} · ` : "";
  const subName = item.subject || item.title || "Curriculum";
  return `Official course curriculum, unit breakdown, learning objectives & prescribed references for ${subName} (${branchText}${semText}Academic Regulations).`;
};

function LatestSyllabus({ search = "" }) {
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [likedSyllabusIds, setLikedSyllabusIds] = useState(() => {
    try {
      const saved = localStorage.getItem("andhra_liked_syllabus");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  // ==========================================
  // FETCH SYLLABUS
  // ==========================================
  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/syllabus");
      const data = Array.isArray(res.data) ? res.data : [];
      setSyllabus(data);
    } catch (err) {
      console.error("Error fetching syllabus:", err);
      setError("Unable to load latest syllabus.");
      setSyllabus([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH FILTER
  // ==========================================
  const searchText = String(search || "").trim().toLowerCase();

  const filteredSyllabus = syllabus.filter((item) => {
    if (!searchText) return true;
    return (
      String(item.title || "").toLowerCase().includes(searchText) ||
      String(item.branch || "").toLowerCase().includes(searchText) ||
      String(item.semester || "").toLowerCase().includes(searchText) ||
      String(item.subject || "").toLowerCase().includes(searchText) ||
      String(item.subjectCode || "").toLowerCase().includes(searchText) ||
      String(item.description || "").toLowerCase().includes(searchText)
    );
  });

  // ==========================================
  // HELPERS
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
    setSyllabus((prevList) =>
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
        setSyllabus((prevList) =>
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
        } catch { }
        return next;
      });

      setSyllabus((prevList) =>
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
      setSyllabus((prev) =>
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
      setSyllabus((prev) =>
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
  // LOADING / ERROR
  // ==========================================
  if (loading) {
    return (
      <section className="papers-section">
        <div className="section-heading">
          <span className="section-tag">CURRICULUM & REGULATIONS</span>
          <h2>Syllabus</h2>
        </div>
        <div className="papers-loading">Loading syllabus...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="papers-section">
        <div className="section-heading">
          <span className="section-tag">CURRICULUM & REGULATIONS</span>
          <h2>Syllabus</h2>
        </div>
        <div className="error-state">
          <span>⚠️</span>
          <h3>Unable to Load Syllabus</h3>
          <p>{error}</p>
          <button type="button" onClick={fetchSyllabus}>
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
      <div className="section-heading">
        <span className="section-tag">CURRICULUM & REGULATIONS</span>
        <h2>Syllabus</h2>
      </div>

      {filteredSyllabus.length === 0 ? (
        <div className="empty-state">
          <span>📚</span>
          <h3>
            {searchText
              ? `No syllabus found for "${search}"`
              : "No syllabus available"}
          </h3>
          <p>Try searching with another keyword or check again later.</p>
        </div>
      ) : (
        <div className="papers-grid">
          {filteredSyllabus.map((item) => (
            <article className="resource-card" key={item._id}>
              {/* Cover Banner */}
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
                {/* Subject Code Badge */}
                {item.subjectCode && (
                  <div className="card-code-row">
                    <span className="card-code-badge" title={`Subject Code: ${item.subjectCode}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {item.subjectCode}
                    </span>
                  </div>
                )}

                {/* Subject Name */}
                <h3 className="resource-title" title={getSyllabusDisplayTitle(item)}>
                  {getSyllabusDisplayTitle(item)}
                </h3>

                {/* Subject Description in the gap */}
                <p className="card-subject-snippet" title={getSyllabusSnippet(item)}>
                  {getSyllabusSnippet(item)}
                </p>

                {/* Spacer */}
                <div className="resource-content-spacer" />

                {/* Professional Metrics Bar & Like Section */}
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

                {/* Action Buttons */}
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
    </section>
  );
}

export default LatestSyllabus;
