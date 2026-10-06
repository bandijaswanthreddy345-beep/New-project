import { useState, useEffect, useRef, useCallback } from "react";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";
import "./Resource3DModal.css";

function Resource3DModal({
  note,
  isOpen,
  onClose,
  onViewFull,
  onDownload,
  formatDate,
  formatSubject,
  getDisplayTitle,
  getNoteContext,
  getImageUrl,
}) {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatedOpen, setIsAnimatedOpen] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, ix: 0, iy: 0 });
  const [isTracking, setIsTracking] = useState(false);

  const backdropRef = useRef(null);
  const cardRef = useRef(null);
  const rafId = useRef(null);

  // =========================================================
  // SMOOTH OPEN / CLOSE LIFECYCLE
  // =========================================================

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Next tick triggers CSS open transition
      const timer = requestAnimationFrame(() => {
        setIsAnimatedOpen(true);
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsAnimatedOpen(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 460);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent background scrolling while modal is open, without layout shift
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Graceful close with animation
  const handleInitiateClose = useCallback(() => {
    setIsAnimatedOpen(false);
    setTimeout(() => {
      onClose();
    }, 450);
  }, [onClose]);

  // ESC Key Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleInitiateClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleInitiateClose]);

  // =========================================================
  // SMOOTH MOUSE PARALLAX TRACKING (requestAnimationFrame)
  // Max rotateX: ±2.5deg, Max rotateY: ±3deg
  // =========================================================

  const handlePointerMove = (e) => {
    if (!cardRef.current) return;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      const normX = Math.max(-1, Math.min(1, (clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
      const normY = Math.max(-1, Math.min(1, (clientY - (rect.top + rect.height / 2)) / (rect.height / 2)));

      // Subtle rotation: rotateX ±2.5deg, rotateY ±3deg
      const rx = Number((-normY * 2.5).toFixed(2));
      const ry = Number((normX * 3.0).toFixed(2));

      // Internal image parallax: moves in reverse to depth
      const ix = Number((normX * -8).toFixed(1));
      const iy = Number((normY * -6).toFixed(1));

      setIsTracking(true);
      setTilt({ rx, ry, ix, iy });
    });
  };

  const handlePointerLeave = () => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    setIsTracking(false);
    setTilt({ rx: 0, ry: 0, ix: 0, iy: 0 });
  };

  if (!isRendered || !note) {
    return null;
  }

  // Fallbacks
  const displayTitle = getDisplayTitle ? getDisplayTitle(note) : note.title || "Academic Notes";
  const displayContext = getNoteContext ? getNoteContext(note) : note.description || "Comprehensive syllabus and lecture materials.";
  const displaySubject = formatSubject ? formatSubject(note.subject) : note.subject || "Academic";
  const displayDate = formatDate ? formatDate(note.createdAt) : "Recently Added";
  const displayImage = getImageUrl ? getImageUrl(note.imageUrl) : defaultBanner;

  return (
    <div
      ref={backdropRef}
      className={`modal-3d-backdrop ${isAnimatedOpen ? "is-open" : "is-closing"}`}
      onClick={(e) => {
        if (e.target === backdropRef.current) {
          handleInitiateClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-3d-title-id"
    >
      <div className="modal-3d-stage">
        <div
          ref={cardRef}
          className={`modal-3d-card ${isAnimatedOpen ? "is-open" : "is-closing"} ${isTracking ? "is-tracking" : "is-resetting"}`}
          style={{
            transform: isAnimatedOpen
              ? `scale(1) translateY(0) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
              : undefined,
          }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {/* Ambient Specular Glass Top Light */}
          <div className="modal-3d-specular-edge" />

          {/* Close Button X */}
          <button
            type="button"
            className="modal-3d-close-btn"
            onClick={handleInitiateClose}
            aria-label="Close Preview"
            title="Close (Esc)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* 3D Image Banner Area with Subtle Parallax */}
          <div className="modal-3d-image-wrap">
            <img
              src={displayImage}
              alt={displayTitle}
              className="modal-3d-image"
              style={{
                transform: `scale(1.05) translate3d(${tilt.ix}px, ${tilt.iy}px, 0)`,
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultBanner;
              }}
            />
            <div className="modal-3d-image-fade" />

            <div className="modal-3d-image-badge">
              <span className="modal-3d-badge-pulse-dot" />
              <span>Study Notes Preview</span>
            </div>
          </div>

          {/* Modal Content */}
          <div className="modal-3d-content">
            {/* Branch Identification Pill */}
            <div className="modal-3d-branch-row">
              <span className="modal-3d-branch-chip">
                <span className="modal-3d-branch-chip-dot" />
                {note.branch || "Computer Science Engineering"}
              </span>
            </div>

            {/* Note Title */}
            <h2 id="modal-3d-title-id" className="modal-3d-title">
              {displayTitle}
            </h2>

            {/* Note Description */}
            <p className="modal-3d-desc">
              {displayContext}
            </p>

            {/* Floating Metadata Chips Row */}
            <div className="modal-3d-chips-row">
              {displaySubject && (
                <span className="modal-3d-chip modal-3d-chip-subject" title={`Subject: ${displaySubject}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  {displaySubject}
                </span>
              )}

              {note.semester && (
                <span className="modal-3d-chip modal-3d-chip-semester" title="Academic Semester">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  {note.semester}
                </span>
              )}

              {note.subjectCode && (
                <span className="modal-3d-chip modal-3d-chip-code" title={`Subject Code: ${note.subjectCode}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  {note.subjectCode}
                </span>
              )}

              <span className="modal-3d-chip modal-3d-chip-date" title="Publish Date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {displayDate}
              </span>
            </div>

            {/* Glass Divider Line */}
            <div className="modal-3d-divider" />

            {/* Statistics Bar */}
            <div className="modal-3d-stats-row">
              <div className="modal-3d-stats-left">
                <span className="modal-3d-stat-item modal-3d-stat-views">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="modal-3d-stat-value">{note.views || 0}</span>
                  <span className="modal-3d-stat-label">Views</span>
                </span>

                <span className="modal-3d-stat-item modal-3d-stat-downloads">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span className="modal-3d-stat-value">{note.downloads || 0}</span>
                  <span className="modal-3d-stat-label">Downloads</span>
                </span>
              </div>

              <span className="modal-3d-verified-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Verified Syllabus
              </span>
            </div>

            {/* Actions Grid */}
            <div className="modal-3d-actions">
              <button
                type="button"
                className="modal-3d-btn-primary"
                onClick={() => {
                  handleInitiateClose();
                  if (onViewFull) onViewFull(note);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                View Notes
              </button>

              <button
                type="button"
                className="modal-3d-btn-secondary"
                onClick={() => {
                  if (onDownload) onDownload(note);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resource3DModal;
