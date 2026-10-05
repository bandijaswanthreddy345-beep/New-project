import { useEffect, useState } from "react";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";
import LikeReactionButton from "../components/LikeReactionButton";

function LabPrograms({ search = "" }) {
  const [labPrograms, setLabPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingPdf, setOpeningPdf] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  // Instant resilient like reaction state
  const [likedProgramIds, setLikedProgramIds] = useState(() => {
    try {
      const saved = localStorage.getItem("andhra_liked_programs");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  // =========================================================
  // FETCH LAB PROGRAMS
  // =========================================================

  useEffect(() => {
    fetchLabPrograms();
  }, []);

  const fetchLabPrograms = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/lab-programs");
      const data = Array.isArray(response.data) ? response.data : [];
      setLabPrograms(data);
    } catch (err) {
      console.error("Lab Program Fetch Error:", err);
      setError(
        err.response?.data?.message || "Unable to load lab programs."
      );
      setLabPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEARCH FILTER
  // =========================================================

  const searchText = String(search || "").trim().toLowerCase();

  const filteredPrograms = labPrograms.filter((program) => {
    if (!searchText) return true;

    return (
      String(program.title || "").toLowerCase().includes(searchText) ||
      String(program.subject || "").toLowerCase().includes(searchText) ||
      String(program.subjectCode || "").toLowerCase().includes(searchText) ||
      String(program.branch || "").toLowerCase().includes(searchText) ||
      String(program.semester || "").toLowerCase().includes(searchText) ||
      String(program.description || "").toLowerCase().includes(searchText)
    );
  });

  // =========================================================
  // TITLE FORMATTER & CONTEXT
  // =========================================================

  const getLabDisplayTitle = (program) => {
    if (!program || !program.title) return "Lab Program";
    const raw = String(program.title).trim();
    if (!raw) return "Lab Program";
    // Capitalize first letters properly
    const words = raw.split(/\s+/).map((w) => {
      if (w.length <= 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
    const formatted = words.join(" ");
    if (!formatted.toLowerCase().includes("lab") && !formatted.toLowerCase().includes("manual")) {
      return `${formatted} Lab Manual`;
    }
    return formatted;
  };

  const getLabContext = (program) => {
    if (program.description && program.description.trim()) {
      return program.description;
    }
    return `Laboratory experiments, practical source codes, algorithms and record materials for ${program.branch || "engineering students"}.`;
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

  // =========================================================
  // BACKEND BASE URL & PDF URL
  // =========================================================

  const getBackendBaseUrl = () => {
    const apiBaseUrl = API.defaults?.baseURL || "http://localhost:5000/api";
    return apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  };

  const getPdfUrl = (pdfUrl) => {
    if (!pdfUrl) return "";
    let value = String(pdfUrl).trim();

    if (value.startsWith("http://") || value.startsWith("https://")) {
      try {
        const url = new URL(value);
        url.pathname = url.pathname.replace(/^\/api\/uploads\//, "/uploads/");
        return url.toString();
      } catch {
        return value;
      }
    }

    value = value.replace(/^\/?api\/uploads\//, "/uploads/");
    if (!value.startsWith("/")) {
      value = `/${value}`;
    }

    const backendBaseUrl = getBackendBaseUrl();
    return `${backendBaseUrl}${value}`;
  };

  // =========================================================
  // LIKE REACTION TOGGLE
  // =========================================================

  const handleToggleLike = async (program, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const programId = program._id;
    if (!programId) return;

    const isLiked = likedProgramIds.has(programId);
    const action = isLiked ? "unlike" : "like";

    // 1. Optimistic Local Set
    setLikedProgramIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(programId);
      } else {
        next.add(programId);
      }
      try {
        localStorage.setItem("andhra_liked_programs", JSON.stringify([...next]));
      } catch (err) {
        console.error("Error saving liked programs:", err);
      }
      return next;
    });

    // 2. Optimistic Counter
    setLabPrograms((prevPrograms) =>
      prevPrograms.map((p) => {
        if (p._id === programId) {
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
      const res = await API.put(`/lab-programs/${programId}/like`, { action });
      if (res.data && typeof res.data.likes === "number") {
        setLabPrograms((prevPrograms) =>
          prevPrograms.map((p) =>
            p._id === programId ? { ...p, likes: res.data.likes } : p
          )
        );
      }
    } catch (error) {
      console.error("Error updating lab program like:", error);
      // Revert on error
      setLikedProgramIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(programId);
        } else {
          next.delete(programId);
        }
        try {
          localStorage.setItem("andhra_liked_programs", JSON.stringify([...next]));
        } catch {}
        return next;
      });

      setLabPrograms((prevPrograms) =>
        prevPrograms.map((p) => {
          if (p._id === programId) {
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

  // =========================================================
  // VIEW PDF
  // =========================================================

  const handleViewPdf = async (program) => {
    if (!program.pdfUrl) {
      alert("PDF file is not available.");
      return;
    }

    try {
      setOpeningPdf(program._id);

      // Track view count
      try {
        await API.put(`/lab-programs/${program._id}/view`);
        setLabPrograms((prev) =>
          prev.map((p) =>
            p._id === program._id ? { ...p, views: (p.views || 0) + 1 } : p
          )
        );
      } catch (err) {
        console.error("View count error:", err);
      }

      const finalUrl = getPdfUrl(program.pdfUrl);
      if (!finalUrl) {
        throw new Error("Invalid PDF URL");
      }

      const pdfWindow = window.open(finalUrl, "_blank", "noopener,noreferrer");
      if (!pdfWindow) {
        alert("Popup was blocked. Please allow popups for this website.");
      }
    } catch (err) {
      console.error("View PDF Error:", err);
      alert("Unable to open the PDF. Please check that the PDF file exists.");
    } finally {
      setOpeningPdf(null);
    }
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const handleDownload = async (program) => {
    if (!program.pdfUrl) {
      alert("PDF file is not available.");
      return;
    }

    try {
      setDownloadingPdf(program._id);

      // Track download count
      try {
        await API.put(`/lab-programs/${program._id}/download`);
        setLabPrograms((prev) =>
          prev.map((p) =>
            p._id === program._id ? { ...p, downloads: (p.downloads || 0) + 1 } : p
          )
        );
      } catch (err) {
        console.error("Download count error:", err);
      }

      const finalUrl = getPdfUrl(program.pdfUrl);
      const response = await fetch(finalUrl);

      if (!response.ok) {
        throw new Error(`PDF request failed: ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error("PDF file is empty.");
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const fileName = `${program.title || "lab-program"}-lab-program.pdf`
        .replace(/[^a-z0-9.-]/gi, "_")
        .toLowerCase();

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      console.error("Lab Program Download Error:", err);
      alert("Unable to download the PDF. Please check that the PDF file exists on the server.");
    } finally {
      setDownloadingPdf(null);
    }
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <section className="papers-section">
        <div className="section-heading">
          <span className="section-tag">LAB RESOURCES</span>
          <h2>Lab Programs</h2>
        </div>
        <div className="papers-loading">Loading lab programs...</div>
      </section>
    );
  }

  // =========================================================
  // ERROR STATE
  // =========================================================

  if (error) {
    return (
      <section className="papers-section">
        <div className="section-heading">
          <span className="section-tag">LAB RESOURCES</span>
          <h2>Lab Programs</h2>
        </div>
        <div className="error-state">
          <h3>Unable to Load Lab Programs</h3>
          <p>{error}</p>
          <button type="button" onClick={fetchLabPrograms}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <section className="papers-section">
      <div className="section-heading">
        <span className="section-tag">LAB RESOURCES</span>
        <h2>Lab Programs</h2>
      </div>

      {filteredPrograms.length === 0 ? (
        <div className="empty-state">
          <h3>
            {searchText
              ? `No lab programs found for "${search}"`
              : "No lab programs available"}
          </h3>
          <p>Try searching with another keyword or check again later.</p>
        </div>
      ) : (
        <div className="papers-grid">
          {filteredPrograms.map((program) => (
            <article className="resource-card" key={program._id}>
              {/* Cover Banner */}
              <div className="resource-image">
                <img
                  src={defaultBanner}
                  alt={getLabDisplayTitle(program)}
                />
                <span className="read-time">Lab Program</span>
              </div>

              {/* Card Body */}
              <div className="resource-content">
                <div className="resource-badge-row">
                  <span className="resource-badge">
                    <span className="resource-badge-dot" />
                    {program.branch || "Laboratory"}
                  </span>
                </div>

                <h3 className="resource-title" title={getLabDisplayTitle(program)}>
                  {getLabDisplayTitle(program)}
                </h3>

                <p className="resource-desc">
                  {getLabContext(program)}
                </p>

                {/* Metadata Chips */}
                <div className="resource-meta-chips">
                  {program.subject && (
                    <span className="meta-chip meta-chip-subject" title={`Subject: ${program.subject}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      {program.subject}
                    </span>
                  )}

                  {program.semester && (
                    <span className="meta-chip meta-chip-semester" title="Academic Semester">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      {program.semester}
                    </span>
                  )}

                  {program.subjectCode && (
                    <span className="meta-chip meta-chip-code" title={`Subject Code: ${program.subjectCode}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {program.subjectCode}
                    </span>
                  )}

                  <span className="meta-chip meta-chip-date" title="Upload Date">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(program.createdAt) || "Recently Added"}
                  </span>
                </div>

                {/* Professional Metrics & Like Section */}
                <div className="resource-stats">
                  <div className="resource-stats-left">
                    <span className="stat-chip stat-chip-views" title={`${program.views || 0} Total Views`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="stat-count">{program.views || 0}</span>
                      <span className="stat-unit">views</span>
                    </span>

                    <span className="stat-chip stat-chip-downloads" title={`${program.downloads || 0} Total Downloads`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span className="stat-count">{program.downloads || 0}</span>
                      <span className="stat-unit">dls</span>
                    </span>
                  </div>

                  <LikeReactionButton
                    isLiked={likedProgramIds.has(program._id)}
                    count={program.likes || 0}
                    onToggle={(e) => handleToggleLike(program, e)}
                    title={likedProgramIds.has(program._id) ? "Liked" : "Like lab program"}
                  />
                </div>

                {/* Action Buttons */}
                <div className="resource-buttons">
                  {program.pdfUrl ? (
                    <>
                      <button
                        type="button"
                        className="view-pdf-button"
                        disabled={openingPdf === program._id}
                        onClick={() => handleViewPdf(program)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {openingPdf === program._id ? "Opening..." : "View PDF"}
                      </button>

                      <button
                        type="button"
                        className="download-pdf-button"
                        disabled={downloadingPdf === program._id}
                        onClick={() => handleDownload(program)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {downloadingPdf === program._id ? "Downloading..." : "Download"}
                      </button>
                    </>
                  ) : (
                    <div className="pdf-not-available">PDF not available</div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default LabPrograms;
