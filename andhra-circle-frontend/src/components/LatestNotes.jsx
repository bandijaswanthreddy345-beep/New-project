
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { BACKEND_URL } from "../api/api";
import defaultBanner from "../assets/banner.webp";
import LikeReactionButton from "./LikeReactionButton";
import { normalizeSemester, normalizeScheme } from "../utils/semester";
import { formatSemDisplay } from "../utils/validators";

const getSubjectSnippet = (item) => {
  if (item.description && item.description.trim().length > 10) {
    return item.description.trim();
  }
  const branchText = item.branch ? `${item.branch} · ` : "";
  const semText = item.semester ? `${formatSemDisplay(item.semester)} · ` : "";
  const subName = item.subject || item.title || "Subject";
  return `Comprehensive study notes, module-wise topics, derivations & question banks for ${subName} (${branchText}${semText}JNTU Curriculum).`;
};

function LatestNotes({ search = "" }) {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blinkingNoteId, setBlinkingNoteId] = useState(null);

  // Liked notes tracked per client browser
  const [likedNoteIds, setLikedNoteIds] = useState(() => {
    try {
      const stored = localStorage.getItem("andhra_liked_notes");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

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
  // INSTANT & RESILIENT LIKE REACTION HANDLER
  // ==========================================

  const handleToggleLike = async (note, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const noteId = note._id;
    if (!noteId) return;

    const isLiked = likedNoteIds.has(noteId);
    const action = isLiked ? "unlike" : "like";

    // 1. Optimistic Local Liked State
    setLikedNoteIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      try {
        localStorage.setItem("andhra_liked_notes", JSON.stringify([...next]));
      } catch (err) {
        console.error("Error saving liked notes:", err);
      }
      return next;
    });

    // 2. Optimistic Counter Update (Instant 0ms feedback)
    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (n._id === noteId) {
          const current =
            typeof n.likes === "number" && !isNaN(n.likes) ? n.likes : 0;
          return {
            ...n,
            likes: Math.max(0, current + (isLiked ? -1 : 1)),
          };
        }
        return n;
      })
    );

    // 3. Persist to Backend API
    try {
      const res = await API.put(`/notes/${noteId}/like`, { action });
      if (res.data && typeof res.data.likes === "number") {
        setNotes((prevNotes) =>
          prevNotes.map((n) =>
            n._id === noteId ? { ...n, likes: res.data.likes } : n
          )
        );
      }
    } catch (error) {
      console.error("Error updating like reaction:", error);
      // Revert optimistic updates on network error
      setLikedNoteIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(noteId);
        } else {
          next.delete(noteId);
        }
        try {
          localStorage.setItem("andhra_liked_notes", JSON.stringify([...next]));
        } catch {
          // ignore
        }
        return next;
      });

      setNotes((prevNotes) =>
        prevNotes.map((n) => {
          if (n._id === noteId) {
            const current =
              typeof n.likes === "number" && !isNaN(n.likes) ? n.likes : 0;
            return {
              ...n,
              likes: Math.max(0, current + (isLiked ? 1 : -1)),
            };
          }
          return n;
        })
      );
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
      normalizeScheme(note)
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

    return `${BACKEND_URL}${imageUrl}`;
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
    setBlinkingNoteId(note._id);
    try {
      API.put(`/notes/${note._id}/view`).catch(() => { });
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
      console.error("Error updating view count:", error);
    }

    setTimeout(() => {
      setBlinkingNoteId(null);
      navigate(`/notes/${note._id}`);
    }, 650);
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
          : `${BACKEND_URL}${pdfPath}`;

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

  const getSubjectName = (note) => {
    const subj = (note.subject || "").trim();
    if (subj) {
      return formatSubject(subj);
    }
    const raw = (note.title || "").trim();
    if (raw && raw.toLowerCase() !== "notes" && raw.toLowerCase() !== "untitled notes") {
      const cleaned = raw.replace(/\s+notes$/i, "").trim();
      return formatSubject(cleaned || raw);
    }
    return "Academic Study Notes";
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
          <span className="section-tag">STUDY MATERIALS</span>
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
        <span className="section-tag">STUDY MATERIALS</span>
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
              </div>

              {/* ==========================================
                  CONTENT
              ========================================== */}
              <div className="resource-content">
                {/* Subject Code Badge */}
                {note.subjectCode && (
                  <div className="card-code-row">
                    <span className="card-code-badge" title={`Subject Code: ${note.subjectCode}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {note.subjectCode}
                    </span>
                  </div>
                )}

                {/* Subject Name */}
                <h3 className="resource-title" title={getSubjectName(note)}>
                  {getSubjectName(note)}
                </h3>

                {/* Subject Semester & Scheme */}
                <p className="card-subject-snippet" title={`Semester: ${normalizeSemester(note.semester) || "1-1"} • Scheme: ${normalizeScheme(note)}`}>
                  <span className="card-sem-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    Semester: {normalizeSemester(note.semester) || "1-1"}
                  </span>
                  <span className="card-scheme-badge">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    {normalizeScheme(note)} Scheme
                  </span>
                </p>

                {/* Spacer to push stats to bottom */}
                <div className="resource-content-spacer" />

                {/* ==========================================
                    PROFESSIONAL METRICS & LIKE STATS BAR
                ========================================== */}
                <div className="resource-stats">
                  <div className="resource-stats-left">
                    <span className="stat-chip stat-chip-views" title={`${note.views || 0} Total Views`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="stat-count">{note.views || 0}</span>
                    </span>

                    <span className="stat-chip stat-chip-downloads" title={`${note.downloads || 0} Total Downloads`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span className="stat-count">{note.downloads || 0}</span>
                    </span>
                  </div>

                  <LikeReactionButton
                    isLiked={likedNoteIds.has(note._id)}
                    count={note.likes || 0}
                    onToggle={(e) => handleToggleLike(note, e)}
                    title={likedNoteIds.has(note._id) ? "Liked" : "Like note"}
                  />
                </div>

                {/* ==========================================
                    ACTION BUTTONS
                ========================================== */}
                <div className="resource-buttons">
                  <button
                    type="button"
                    className="view-pdf-button"
                    onClick={() => handleView(note)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={blinkingNoteId === note._id ? "eye-blink-anim" : ""}>
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

export default LatestNotes;
