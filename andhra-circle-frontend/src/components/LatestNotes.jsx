
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API, { BACKEND_URL } from "../api/api";
import defaultBanner from "../assets/banner.webp";
import LikeReactionButton from "./LikeReactionButton";
import { formatSemDisplay } from "../utils/validators";
import { normalizeScheme } from "../utils/semester";
import trigger100Hearts from "../utils/heartBurst";
import {
  getCachedResource,
  hasCachedResource,
  fetchResourceWithCache,
  updateCachedResourceItem,
} from "../utils/resourceCache";

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

  const [notes, setNotes] = useState(() => getCachedResource("notes") || []);
  const [loading, setLoading] = useState(() => !hasCachedResource("notes"));
  const [blinkingNoteId, setBlinkingNoteId] = useState(null);

  // Double-tap heart pop animations & tap timer references
  const [cardHeartPops, setCardHeartPops] = useState({});
  const lastTapTimeRef = useRef({});

  // Liked notes tracked per client browser
  const [likedNoteIds, setLikedNoteIds] = useState(() => {
    try {
      const set = new Set();
      ["andhra_liked_notes", "andhra_liked_resources"].forEach((k) => {
        const stored = localStorage.getItem(k);
        if (stored) {
          try {
            const arr = JSON.parse(stored);
            if (Array.isArray(arr)) arr.forEach((id) => set.add(id));
          } catch {}
        }
      });
      return set;
    } catch {
      return new Set();
    }
  });

  // ==========================================
  // FETCH NOTES (STALE-WHILE-REVALIDATE)
  // ==========================================

  useEffect(() => {
    fetchNotes();

    const handleUpdated = (e) => {
      const fresh = e?.detail?.notes || getCachedResource("notes");
      if (Array.isArray(fresh) && fresh.length > 0) {
        setNotes(fresh);
        setLoading(false);
      }
    };
    window.addEventListener("resourcesUpdated", handleUpdated);
    return () => window.removeEventListener("resourcesUpdated", handleUpdated);
  }, []);

  const fetchNotes = async () => {
    try {
      if (!hasCachedResource("notes")) {
        setLoading(true);
      }

      const data = await fetchResourceWithCache("notes", "/notes");

      if (Array.isArray(data) && data.length > 0) {
        setNotes(data);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      if (!hasCachedResource("notes")) {
        setNotes([]);
      }
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

    // 1. Optimistic Local Liked State across client storage
    setLikedNoteIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      try {
        localStorage.setItem("andhra_liked_notes", JSON.stringify([...next]));
        const resSet = new Set(
          JSON.parse(localStorage.getItem("andhra_liked_resources") || "[]")
        );
        if (isLiked) resSet.delete(noteId);
        else resSet.add(noteId);
        localStorage.setItem("andhra_liked_resources", JSON.stringify([...resSet]));
      } catch (err) {
        console.error("Error saving liked notes:", err);
      }
      return next;
    });

    // 2. Optimistic Counter Update (Instant 0ms feedback)
    const targetLikes = Math.max(0, (note.likes || 0) + (isLiked ? -1 : 1));
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

    updateCachedResourceItem("notes", noteId, { likes: targetLikes });

    // 3. Persist to Backend API
    try {
      const res = await API.put(`/notes/${noteId}/like`, { action });
      if (res.data && typeof res.data.likes === "number") {
        setNotes((prevNotes) =>
          prevNotes.map((n) =>
            n._id === noteId ? { ...n, likes: res.data.likes } : n
          )
        );
        updateCachedResourceItem("notes", noteId, { likes: res.data.likes });
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
  // DOUBLE-TAP TO LIKE INTERACTION
  // ==========================================

  const triggerDoubleTapLike = (note, e) => {
    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;
    if (e) {
      if (e.clientX && e.clientY) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    }

    // 1. Haptic vibration
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 60]);
      } catch {}
    }

    // 2. 100-Hearts Canvas Fountain
    trigger100Hearts(clientX, clientY);

    // 3. Card-level pop heart overlay
    const noteId = note._id;
    setCardHeartPops((prev) => ({
      ...prev,
      [noteId]: Date.now(),
    }));
    setTimeout(() => {
      setCardHeartPops((prev) => {
        const next = { ...prev };
        delete next[noteId];
        return next;
      });
    }, 900);

    // 4. Register like if not already liked
    if (!likedNoteIds.has(noteId)) {
      handleToggleLike(note, e);
    }
  };

  const handleCardClick = (note, e) => {
    // If click originated from view or download buttons or like button, do not intercept
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    const noteId = note._id;
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[noteId] || 0;

    if (now - lastTap < 400 && now - lastTap > 40) {
      lastTapTimeRef.current[noteId] = 0;
      triggerDoubleTapLike(note, e);
    } else {
      lastTapTimeRef.current[noteId] = now;
    }
  };

  // ==========================================
  // SEARCH FILTER (MEMOIZED & OPTIMIZED)
  // ==========================================

  const searchText = String(search || "")
    .trim()
    .toLowerCase();

  const filteredNotes = useMemo(() => {
    if (!searchText) return notes;
    return notes.filter((note) =>
      String(note.title || "").toLowerCase().includes(searchText) ||
      String(note.branch || "").toLowerCase().includes(searchText) ||
      String(note.semester || "").toLowerCase().includes(searchText) ||
      String(note.subject || "").toLowerCase().includes(searchText) ||
      String(note.description || "").toLowerCase().includes(searchText)
    );
  }, [notes, searchText]);

  const displayedNotes = useMemo(() => {
    return filteredNotes.slice(0, 12);
  }, [filteredNotes]);

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
          {displayedNotes.map((note) => (
            <article
              className="resource-card"
              key={note._id}
              onClick={(e) => handleCardClick(note, e)}
              onDoubleClick={(e) => triggerDoubleTapLike(note, e)}
            >
              {/* Double-tap Floating Heart Pop */}
              {cardHeartPops[note._id] && (
                <div className="card-double-tap-heart" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="#e11d48">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              )}

              {/* ==========================================
                  BANNER / COVER
              ========================================== */}
              <div className="resource-image">
                <img
                  src={getImageUrl(note.imageUrl)}
                  alt={getDisplayTitle(note)}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultBanner;
                  }}
                />
                <div className="resource-image-overlay" />
                <span className="read-time">
                  Notes
                </span>
              </div>

              {/* ==========================================
                  CONTENT
              ========================================== */}
              <div className="resource-content">
                {/* Subject Code & Scheme Badges */}
                <div className="card-code-row">
                  <span className="card-scheme-badge" title={`Academic Regulation Scheme: ${normalizeScheme(note)} Scheme`}>
                    {normalizeScheme(note).includes("Scheme") ? normalizeScheme(note) : `${normalizeScheme(note)} Scheme`}
                  </span>
                  {note.subjectCode && (
                    <span className="card-code-badge" title={`Subject Code: ${note.subjectCode}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {note.subjectCode}
                    </span>
                  )}
                  {note.branch && (
                    <span className="card-branch-badge" title={`Branch: ${note.branch}`}>
                      {note.branch}
                    </span>
                  )}
                  {note.semester && (
                    <span className="card-sem-badge" title={`Semester: ${formatSemDisplay(note.semester)}`}>
                      Sem {String(formatSemDisplay(note.semester)).replace(/^sem\s*/i, "")}
                    </span>
                  )}
                  {(note.hasHandwritten || note.handwrittenPdfUrl) && (
                    <span
                      className="card-code-badge"
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        borderColor: "#fde68a",
                        fontWeight: 600,
                      }}
                      title="Handwritten notes available"
                    >
                      ✍️ Handwritten
                    </span>
                  )}
                </div>

                {/* Subject Name */}
                <h3 className="resource-title" title={getSubjectName(note)}>
                  {getSubjectName(note)}
                </h3>

                {/* Subject Description in the gap */}
                <p className="card-subject-snippet" title={getSubjectSnippet(note)}>
                  {getSubjectSnippet(note)}
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

      {filteredNotes.length > 12 && (
        <div className="view-more-container">
          <button
            type="button"
            className="view-all-resources-btn"
            onClick={() => navigate("/notes")}
          >
            View All Notes ({filteredNotes.length}) →
          </button>
        </div>
      )}
    </section>
  );
}

export default LatestNotes;
