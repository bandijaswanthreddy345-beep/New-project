
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";

function LatestNotes({ search = "" }) {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // FETCH NOTES
  // ==========================================

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);

      const res = await API.get("/notes");

      const data = Array.isArray(res.data)
        ? res.data
        : [];

      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const searchText = String(search || "")
    .trim()
    .toLowerCase();

  const filteredNotes = notes.filter((note) => {
    if (!searchText) return true;

    return (
      String(note.title || "")
        .toLowerCase()
        .includes(searchText) ||
      String(note.branch || "")
        .toLowerCase()
        .includes(searchText) ||
      String(note.semester || "")
        .toLowerCase()
        .includes(searchText) ||
      String(note.subject || "")
        .toLowerCase()
        .includes(searchText) ||
      String(note.description || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // ==========================================
  // IMAGE URL
  // ==========================================

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return defaultBanner;
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    return `http://localhost:5000${imageUrl}`;
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // VIEW COMPLETE NOTE
  // ==========================================

  const handleView = async (note) => {
    try {
      // Increase view count
      await API.put(`/notes/${note._id}/view`);

      setNotes((prev) =>
        prev.map((item) =>
          item._id === note._id
            ? {
                ...item,
                views: (item.views || 0) + 1,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Error updating view count:",
        error
      );
    }

    // Open the complete note page
    navigate(`/notes/${note._id}`);
  };

  // ==========================================
  // DOWNLOAD MODULE PDF
  // ==========================================

  const handleModuleDownload = async (
    note,
    moduleNumber
  ) => {
    try {
      const pdfPath =
        note[`module${moduleNumber}Pdf`];

      if (!pdfPath) {
        alert(
          `Module ${moduleNumber} PDF is not available.`
        );
        return;
      }

      const pdfUrl =
        pdfPath.startsWith("http://") ||
        pdfPath.startsWith("https://")
          ? pdfPath
          : `http://localhost:5000${pdfPath}`;

      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error("PDF download failed");
      }

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `${note.title || "note"}-module-${moduleNumber}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      // Increase download count
      await API.put(
        `/notes/${note._id}/download`
      );

      setNotes((prev) =>
        prev.map((item) =>
          item._id === note._id
            ? {
                ...item,
                downloads:
                  (item.downloads || 0) + 1,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Module PDF download error:",
        error
      );

      alert(
        "Unable to download this module PDF."
      );
    }
  };

  // ==========================================
  // SMART DISPLAY TITLE & SUBJECT FORMATTER
  // ==========================================

  const formatWord = (word) => {
    const w = word.trim();
    if (!w) return "";
    if (w.length <= 4) return w.toUpperCase(); // DSA, BDA, DSAP, CSE, ECE, etc.
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  };

  const formatSubject = (subj) => {
    if (!subj) return "";
    return subj.split(/\s+/).map(formatWord).join(" ");
  };

  const getDisplayTitle = (note) => {
    const raw = (note.title || "").trim();
    const subj = (note.subject || "").trim();
    if (!raw || raw.toLowerCase() === "notes" || raw.toLowerCase() === "untitled notes") {
      if (subj) {
        return `${formatSubject(subj)} Notes`;
      }
      return "Academic Study Notes";
    }
    return raw.split(/\s+/).map(formatWord).join(" ");
  };

  // ==========================================
  // LOADING UI
  // ==========================================

  if (loading) {
    return (
      <section className="notes-section">
        <div className="section-heading">
          <span className="section-tag">
            STUDY MATERIALS
          </span>
          <h2>Latest Notes</h2>
        </div>

        <div className="notes-loading">
          Loading Notes...
        </div>
      </section>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <section className="notes-section">
      {/* ==========================================
          SECTION HEADING
      ========================================== */}
      <div className="section-heading">
        <span className="section-tag">
          STUDY MATERIALS
        </span>
        <h2>Latest Notes</h2>
      </div>

      {/* ==========================================
          NO NOTES
      ========================================== */}
      {filteredNotes.length === 0 ? (
        <div className="empty-state">
          <h3>No Notes Found</h3>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <article
              className="resource-card"
              key={note._id}
            >
              {/* ==========================================
                  BANNER / COVER
              ========================================== */}
              <div className="resource-image">
                <img
                  src={getImageUrl(note.imageUrl)}
                  alt={getDisplayTitle(note)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultBanner;
                  }}
                />
                <div className="resource-image-overlay" />

                <span className="read-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  Verified Notes
                </span>

                <span className="resource-format-pill">
                  R20 / R23
                </span>
              </div>

              {/* ==========================================
                  CONTENT
              ========================================== */}
              <div className="resource-content">
                <div className="resource-badge-row">
                  <span className="resource-badge">
                    <span className="resource-badge-dot" />
                    {note.branch || "Engineering"}
                  </span>
                </div>

                <h3 className="resource-title" title={getDisplayTitle(note)}>
                  {getDisplayTitle(note)}
                </h3>

                <p className="resource-desc">
                  {note.description || "Official JNTU academic study notes, syllabus units, and curated exam preparation material."}
                </p>

                {/* ==========================================
                    METADATA CHIPS
                ========================================== */}
                <div className="resource-meta-chips">
                  {note.subject && (
                    <span className="meta-chip meta-chip-subject" title={`Subject: ${note.subject}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      {formatSubject(note.subject)}
                    </span>
                  )}

                  {note.semester && (
                    <span className="meta-chip" title="Academic Semester">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      {note.semester}
                    </span>
                  )}

                  <span className="meta-chip" title="Date Added">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(note.createdAt) || "Recently Added"}
                  </span>
                </div>

                {/* ==========================================
                    STATS
                ========================================== */}
                <div className="resource-stats">
                  <div className="resource-stats-left">
                    <span className="stat-item" title="Views">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {note.views || 0}
                    </span>

                    <span className="stat-item" title="Downloads">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {note.downloads || 0}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="like-button"
                    title="Like note"
                    aria-label="Like note"
                    onClick={async () => {
                      try {
                        await API.put(`/notes/${note._id}/like`);
                        setNotes((prev) =>
                          prev.map((item) =>
                            item._id === note._id
                              ? {
                                  ...item,
                                  likes: (item.likes || 0) + 1,
                                }
                              : item
                          )
                        );
                      } catch (error) {
                        console.error("Error liking note:", error);
                      }
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{note.likes || 0}</span>
                  </button>
                </div>

                {/* ==========================================
                    BUTTONS
                ========================================== */}
                <div className="resource-buttons">
                  <button
                    type="button"
                    className="view-pdf-button"
                    onClick={() => handleView(note)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View Notes
                  </button>

                  <button
                    type="button"
                    className="download-pdf-button"
                    onClick={() => handleModuleDownload(note, 1)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

export default LatestNotes;
