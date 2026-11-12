import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API, { BACKEND_URL } from "../api/api";
import AuthorProfile from "../components/AuthorProfile";
import { normalizeSemester } from "../utils/semester";
import { getStoredStudentData } from "../data/studentData";
import { formatSemDisplay } from "../utils/validators";
import trigger100Hearts from "../utils/heartBurst";
import "./NoteDetails.css";

function formatFriendlySemester(sem) {
  return formatSemDisplay(sem);
}


function getInitialCommentIdentity() {
  try {
    // 1. Check student profile first
    const student = getStoredStudentData();
    if (student?.name || student?.email) {
      return {
        name: student.name || "",
        email: student.email || "",
      };
    }

    // 2. Check logged-in user in localStorage
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user?.name || user?.email) {
        return {
          name: user.name || "",
          email: user.email || "",
        };
      }
    }
  } catch (e) {
    console.error("Error reading identity for comment form:", e);
  }
  return { name: "", email: "" };
}

function NoteDetails() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openUnit, setOpenUnit] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // =========================================================
  // COMMENTS STATE
  // =========================================================

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Heart pop animation state
  const [heartPop, setHeartPop] = useState(null);

  // Auto-fill student/user profile info if created, else allow manual entry
  const [commentForm, setCommentForm] = useState(() => {
    const identity = getInitialCommentIdentity();
    return {
      name: identity.name,
      email: identity.email,
      comment: "",
    };
  });

  // Listen for profile creation or updates in real-time
  useEffect(() => {
    const syncIdentity = () => {
      const identity = getInitialCommentIdentity();
      if (identity.name || identity.email) {
        setCommentForm((prev) => ({
          ...prev,
          name: identity.name || prev.name,
          email: identity.email || prev.email,
        }));
      }
    };

    // Run on initial mount
    syncIdentity();

    window.addEventListener("studentProfileUpdated", syncIdentity);
    window.addEventListener("storage", syncIdentity);
    window.addEventListener("focus", syncIdentity);

    return () => {
      window.removeEventListener("studentProfileUpdated", syncIdentity);
      window.removeEventListener("storage", syncIdentity);
      window.removeEventListener("focus", syncIdentity);
    };
  }, []);

  // =========================================================
  // FETCH NOTE
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchNote = async () => {
      if (!id) {
        setError("Note ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("=================================");
        console.log("NOTE DETAILS");
        console.log("NOTE ID:", id);

        const response = await API.get(`/notes/${id}`);

        console.log("NOTE RESPONSE:", response.data);
        console.log("=================================");

        if (!mounted) return;

        const responseData = response.data;

        const noteData =
          responseData?.note ||
          responseData?.data ||
          responseData;

        if (!noteData) {
          setError("Note not found.");
          setNote(null);
          return;
        }

        setNote(noteData);
      } catch (err) {
        console.error("NOTE DETAILS ERROR:", err);

        if (!mounted) return;

        console.error("STATUS:", err?.response?.status);
        console.error("SERVER RESPONSE:", err?.response?.data);

        if (err?.response?.status === 404) {
          setError("Note not found.");
        } else {
          setError(
            err?.response?.data?.message ||
              "Unable to load the note."
          );
        }

        setNote(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchNote();

    return () => {
      mounted = false;
    };
  }, [id]);

  // =========================================================
  // FETCH COMMENTS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchComments = async () => {
      if (!id) return;

      try {
        setCommentsLoading(true);

        const response = await API.get(
          `/comments/note/${id}`
        );

        if (!mounted) return;

        const data = response.data;

        if (Array.isArray(data)) {
          setComments(data);
        } else if (Array.isArray(data?.comments)) {
          setComments(data.comments);
        } else {
          setComments([]);
        }
      } catch (err) {
        console.error(
          "FETCH COMMENTS ERROR:",
          err
        );

        if (mounted) {
          setComments([]);
        }
      } finally {
        if (mounted) {
          setCommentsLoading(false);
        }
      }
    };

    fetchComments();

    return () => {
      mounted = false;
    };
  }, [id]);

  // =========================================================
  // BUILD BACKEND URL
  // =========================================================

  const getBackendUrl = (value) => {
    if (!value || typeof value !== "string") {
      return "";
    }

    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      return value;
    }

    if (value.startsWith("/")) {
      return `${BACKEND_URL}${value}`;
    }

    return `${BACKEND_URL}/${value}`;
  };

  // =========================================================
  // BUILD EMBED PDF URL (SAFE AGAINST CSP FRAME-ANCESTORS)
  // =========================================================

  const getEmbedPdfUrl = (value) => {
    if (!value || typeof value !== "string" || !value.trim() || value.trim() === "/") {
      return "";
    }

    const trimmed = value.trim();

    // Local uploads: use same-origin relative path so it is always same-origin
    if (trimmed.includes("/uploads/")) {
      const uploadPath = trimmed.substring(trimmed.indexOf("/uploads/"));
      return `${uploadPath}#toolbar=1&navpanes=0&view=FitH`;
    }

    // External URLs (Google Drive, university portals, etc.): proxy through backend
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      if (!trimmed.includes("localhost:5000")) {
        return `${BACKEND_URL}/api/notifications/proxy-pdf?url=${encodeURIComponent(trimmed)}#toolbar=1&navpanes=0&view=FitH`;
      }
      return `${trimmed}#toolbar=1&navpanes=0&view=FitH`;
    }

    const fullUrl = getBackendUrl(trimmed);
    if (!fullUrl || fullUrl === `${BACKEND_URL}/` || fullUrl === BACKEND_URL) {
      return "";
    }
    return `${fullUrl}#toolbar=1&navpanes=0&view=FitH`;
  };

  // =========================================================
  // NOTE DATA
  // =========================================================

  const title =
    note?.title ||
    note?.name ||
    note?.subject ||
    "Untitled Note";

  const subject = note?.subject || "";
  const subjectCode = note?.subjectCode || "";
  const branch = note?.branch || "";
  const semester = normalizeSemester(note?.semester || "");

  // =========================================================
  // CREDITS
  // =========================================================

  const credits = note?.credits || "";

  const year = note?.year || "";

  // =========================================================
  // UNITS
  //
  // IMPORTANT:
  // Backend fields remain module1/module2/... to avoid
  // breaking the existing database and API.
  //
  // Only the user-facing terminology is changed to Units.
  // =========================================================

  const units = useMemo(() => {
    if (!note) return [];

    return [
      {
        number: 1,
        title: note.module1Title || "Unit 1",
        notes: note.module1 || "",
        pdf: note.module1Pdf || "",
      },
      {
        number: 2,
        title: note.module2Title || "Unit 2",
        notes: note.module2 || "",
        pdf: note.module2Pdf || "",
      },
      {
        number: 3,
        title: note.module3Title || "Unit 3",
        notes: note.module3 || "",
        pdf: note.module3Pdf || "",
      },
      {
        number: 4,
        title: note.module4Title || "Unit 4",
        notes: note.module4 || "",
        pdf: note.module4Pdf || "",
      },
      {
        number: 5,
        title: note.module5Title || "Unit 5",
        notes: note.module5 || "",
        pdf: note.module5Pdf || "",
      },
    ];
  }, [note]);

  // =========================================================
  // UNIT TOGGLE
  // =========================================================

  const toggleUnit = (number) => {
    setOpenUnit((current) =>
      current === number ? null : number
    );
  };

  // =========================================================
  // GET FILE NAME
  // =========================================================

  const getFileName = (pdf) => {
    if (!pdf) return "";

    const cleanPath = pdf.split("?")[0];

    return cleanPath.substring(
      cleanPath.lastIndexOf("/") + 1
    );
  };

  // =========================================================
  // OPEN PDF
  // =========================================================

  const openPdf = (pdf) => {
    if (!pdf) return;

    const fileName = getFileName(pdf);

    if (!fileName) return;

    navigate(
      `/pdf/${encodeURIComponent(fileName)}?noteId=${encodeURIComponent(
        id
      )}`
    );
  };

  // =========================================================
  // OPEN PDF IN NEW TAB
  // =========================================================

  const openPdfInNewTab = (pdf) => {
    if (!pdf) return;

    const fileName = getFileName(pdf);

    if (!fileName) return;

    const viewerUrl =
      `${window.location.origin}/pdf/` +
      `${encodeURIComponent(fileName)}` +
      `?noteId=${encodeURIComponent(id)}`;

    window.open(
      viewerUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const downloadPdf = async (
    pdf,
    unitNumber
  ) => {
    const url = getBackendUrl(pdf);

    if (!url) return;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Failed to download PDF"
        );
      }

      const blob = await response.blob();

      const blobUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = blobUrl;

      link.download =
        `${title}-Unit-${unitNumber}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(
        "PDF DOWNLOAD ERROR:",
        error
      );

      alert(
        "Unable to download PDF. Please try again."
      );
    }
  };

  // =========================================================
  // COMMENT FORM CHANGE
  // =========================================================

  const handleCommentChange = (event) => {
    const { name, value } = event.target;

    setCommentForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // SUBMIT COMMENT
  // =========================================================

  const handleSubmitComment = async (event) => {
    event.preventDefault();

    const name = commentForm.name.trim();
    const email = commentForm.email.trim();
    const comment = commentForm.comment.trim();

    if (!name || !email || !comment) {
      alert(
        "Please fill in your name, email and comment."
      );
      return;
    }

    try {
      setCommentSubmitting(true);

      const response = await API.post(
        "/comments",
        {
          note: id,
          name,
          email,
          comment,
        }
      );

      const newComment =
        response.data?.comment;

      if (newComment) {
        setComments((current) => [
          newComment,
          ...current,
        ]);
      } else {
        const refreshResponse =
          await API.get(
            `/comments/note/${id}`
          );

        const refreshedComments =
          refreshResponse.data;

        if (Array.isArray(refreshedComments)) {
          setComments(refreshedComments);
        } else if (
          Array.isArray(
            refreshedComments?.comments
          )
        ) {
          setComments(
            refreshedComments.comments
          );
        }
      }

      setCommentForm((prev) => {
        const identity = getInitialCommentIdentity();
        return {
          name: identity.name || prev.name || "",
          email: identity.email || prev.email || "",
          comment: "",
        };
      });
    } catch (err) {
      console.error(
        "CREATE COMMENT ERROR:",
        err
      );

      alert(
        err?.response?.data?.message ||
          "Unable to post comment. Please try again."
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  // =========================================================
  // ❤️ LIKE COMMENT - BIG POP
  // =========================================================

  const handleLikeComment = async (
    commentId,
    event
  ) => {
    const likedKey = `comment_liked_${commentId}`;
    if (localStorage.getItem(likedKey)) {
      return; // Already liked by this user
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const originX = buttonRect.left + buttonRect.width / 2;
    const originY = buttonRect.top + buttonRect.height / 2;

    // Trigger full celebratory 100 hearts explosion
    try {
      trigger100Hearts(originX, originY);
    } catch (e) {
      console.error("Heart burst error:", e);
    }

    const popId = Date.now();

    setHeartPop({
      id: popId,
      x: originX,
      y: originY,
    });

    setTimeout(() => {
      setHeartPop((current) =>
        current?.id === popId
          ? null
          : current
      );
    }, 1200);

    try {
      localStorage.setItem(likedKey, "true");
      const response = await API.put(
        `/comments/${commentId}/like`
      );

      const updatedComment =
        response.data;

      setComments((current) =>
        current.map((item) =>
          item._id === commentId
            ? updatedComment
            : item
        )
      );
    } catch (err) {
      localStorage.removeItem(likedKey);
      console.error(
        "LIKE COMMENT ERROR:",
        err
      );
    }
  };

  // =========================================================
  // DISLIKE COMMENT
  // =========================================================

  const handleDislikeComment = async (
    commentId
  ) => {
    const dislikedKey = `comment_disliked_${commentId}`;
    if (localStorage.getItem(dislikedKey)) {
      return; // Already disliked
    }

    try {
      localStorage.setItem(dislikedKey, "true");
      const response = await API.put(
        `/comments/${commentId}/dislike`
      );

      const updatedComment =
        response.data;

      setComments((current) =>
        current.map((item) =>
          item._id === commentId
            ? updatedComment
            : item
        )
      );
    } catch (err) {
      localStorage.removeItem(dislikedKey);
      console.error(
        "DISLIKE COMMENT ERROR:",
        err
      );
    }
  };

  // =========================================================
  // DELETE COMMENT
  // =========================================================

  const handleDeleteComment = async (
    commentId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    try {
      await API.delete(
        `/comments/${commentId}`
      );

      setComments((current) =>
        current.filter(
          (item) =>
            item._id !== commentId
        )
      );
    } catch (err) {
      console.error(
        "DELETE COMMENT ERROR:",
        err
      );

      alert(
        err?.response?.data?.message ||
          "Unable to delete comment."
      );
    }
  };

  // =========================================================
  // FORMAT COMMENT DATE
  // =========================================================

  const formatCommentDate = (date) => {
    if (!date) return "";

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "";
    }
  };

  // =========================================================
  // BACK TO TOP
  // =========================================================

  // =========================================================
  // BACK NAVIGATION TO ALL NOTES
  // =========================================================

  const handleBackToNotes = () => {
    if (note?.branch) {
      navigate(`/notes?branch=${encodeURIComponent(note.branch)}`);
    } else {
      navigate("/notes");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="note-page-loading">
        <div className="loading-card">
          <div className="loading-spinner"></div>

          <h3>
            Loading study material
          </h3>

          <p>
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !note) {
    return (
      <div className="note-error-page">
        <div className="note-error-card">
          <div className="error-icon">
            📚
          </div>

          <h2>
            {error || "Note not found"}
          </h2>

          <p>
            We couldn't load this study material.
          </p>

          <button
            type="button"
            onClick={handleBackToNotes}
            className="green-button"
          >
            ← Back to Notes
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="note-details-page">
      

      {/* =====================================================
          ❤️ BIG HEART POP OVERLAY
      ====================================================== */}

      {heartPop && (
        <div
          className="heart-pop-container"
          style={{
            left: `${heartPop.x}px`,
            top: `${heartPop.y}px`,
          }}
        >
          <div className="heart-pop-main">
            ❤️
          </div>

          <span className="burst-heart burst-heart-1">
            ❤️
          </span>

          <span className="burst-heart burst-heart-2">
            ❤️
          </span>

          <span className="burst-heart burst-heart-3">
            ❤️
          </span>

          <span className="burst-heart burst-heart-4">
            ❤️
          </span>

          <span className="burst-heart burst-heart-5">
            ❤️
          </span>

          <span className="burst-heart burst-heart-6">
            ❤️
          </span>

          <span className="burst-heart burst-heart-7">
            ❤️
          </span>

          <span className="burst-heart burst-heart-8">
            ❤️
          </span>

          <span className="heart-spark heart-spark-1">
            ✦
          </span>

          <span className="heart-spark heart-spark-2">
            ✦
          </span>

          <span className="heart-spark heart-spark-3">
            ✦
          </span>

          <span className="heart-spark heart-spark-4">
            ✦
          </span>

          <span className="heart-spark heart-spark-5">
            ✦
          </span>
        </div>
      )}

      {/* =========================================================
          TOP NAVIGATION BAR (MATCHING NOTIFICATIONS)
          Anchored Logo Left + Close (✕) Button Right
          ========================================================= */}
      <header className="notif-page-header">
        <div className="notif-page-header-inner">
          <div
            className="notif-header-left"
            onClick={() => navigate("/")}
            title="Return to Homepage"
          >
            <img
              src="/jntu-circle-logo.png"
              alt="JNTU Circle"
              className="notif-page-logo"
            />
            <div>
              <h2 className="notif-brand-title">
                <span className="font-deltha">JNTU</span> Circle
              </h2>
              <span className="notif-brand-subtitle">
                Official University Study Materials & Notes
              </span>
            </div>
          </div>

          <div className="notif-header-right">
            <button
              type="button"
              className="notif-header-close-btn"
              onClick={handleBackToNotes}
              title="Close and Return to All Notes"
              aria-label="Close and Return to All Notes"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          TWO-COLUMN PAGE LAYOUT (DESKTOP) / STACKED (MOBILE)
      ====================================================== */}
      <div className="note-page-layout">
        <div className="note-left-column">
          {/* =====================================================
              HERO
          ====================================================== */}
          <section className="note-hero">
        <div className="note-hero-content">
          <div className="hero-main">
            <div className="hero-heading-layout">
              <div className="hero-title-block">
                <div className="study-badge">
                  STUDY MATERIAL
                </div>

                <h1>{title}</h1>
              </div>

              {(subject || subjectCode) && (
                <div className="hero-subject-details">
                  {subject && (
                    <div className="hero-subject-item">
                      <span>SUBJECT</span>
                      <strong>{subject}</strong>
                    </div>
                  )}
                  {subjectCode && (
                    <div className="hero-subject-item hero-subject-code">
                      <span>SUBJECT CODE</span>
                      <strong>{subjectCode}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hero-unified-footer">
              <div className="hero-tags">
                {branch && (
                  <div className="hero-tag hero-tag-card">
                    <span className="hero-tag-label">BRANCH</span>
                    <strong className="hero-tag-value">{branch}</strong>
                  </div>
                )}
                {semester && (
                  <div className="hero-tag hero-tag-card">
                    <span className="hero-tag-label">SEMESTER</span>
                    <strong className="hero-tag-value">{formatFriendlySemester(semester)}</strong>
                  </div>
                )}
                {year && (
                  <div className="hero-tag hero-tag-card">
                    <span className="hero-tag-label">ACADEMIC YEAR</span>
                    <strong className="hero-tag-value">{year}</strong>
                  </div>
                )}
              </div>

              <div className="hero-credits-integrated" aria-label="Course credits">
                <div className="hero-credits-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="hero-credits-copy">
                  <span className="hero-credits-label">COURSE CREDITS</span>
                  <span className="hero-credits-desc">Credit value for this subject</span>
                </div>
                <strong className="hero-credits-value">{credits || "4"}</strong>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="note-main">

        {/* ===================================================
            UNITS
        ==================================================== */}

        <section className="modules-section">

          <div className="modules-header">

            <div>

              <span className="eyebrow modules-eyebrow">
                COURSE CONTENT
              </span>

              <h2>
                Units
              </h2>

              <p>Explore unit-wise notes and syllabus materials.</p>

            </div>

            <div className="module-count">

              <strong>
                {units.length}
              </strong>

              <span>
                UNITS
              </span>

            </div>

          </div>

          <div className="modules-list">

            {units.map((unit) => {

              const isOpen =
                openUnit === unit.number;

              const pdfUrl =
                getBackendUrl(unit.pdf);

              return (
                <article
                  key={unit.number}
                  className={`module-card ${
                    isOpen
                      ? "module-open"
                      : ""
                  }`}
                >

                  <button
                    type="button"
                    className="module-header-button"
                    onClick={() =>
                      toggleUnit(
                        unit.number
                      )
                    }
                    aria-expanded={isOpen}
                  >

                    <div className="module-number">
                      {String(
                        unit.number
                      ).padStart(2, "0")}
                    </div>

                    <div className="module-heading">

                      <span>
                        UNIT{" "}
                        {unit.number}
                      </span>

                      <h3>
                        {unit.title}
                      </h3>

                    </div>

                    <span
                      className={`module-arrow ${
                        isOpen
                          ? "arrow-open"
                          : ""
                      }`}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="m5 7.5 5 5 5-5" />
                      </svg>
                    </span>

                  </button>

                  <div
                    className={`module-expand ${
                      isOpen
                        ? "module-expand-open"
                        : ""
                    }`}
                  >

                    <div className="module-inner">

                      <div className="module-resource-grid pdf-only">
                        {/* PDF Box */}
                        <div className="module-pdf-box">
                          <div className="resource-title-row">
                            <div className="resource-title">
                              <div className="resource-icon pdf-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                              </div>

                              <div className="resource-title-meta">
                                <span>
                                  UNIT {unit.number} PDF
                                </span>
                                <small>
                                  Official study file · Verified syllabus
                                </small>
                              </div>
                            </div>

                            
                          </div>

                          {pdfUrl ? (
                            <div className="pdf-actions">
                              <button
                                type="button"
                                className="open-pdf-button"
                                onClick={() =>
                                  openPdf(unit.pdf)
                                }
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                <span>Open PDF</span>
                              </button>

                              <button
                                type="button"
                                className="download-pdf-button"
                                onClick={() =>
                                  downloadPdf(
                                    unit.pdf,
                                    unit.number
                                  )
                                }
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>Download</span>
                              </button>
                            </div>
                          ) : (
                            <p className="no-pdf">
                              No PDF uploaded for this unit.
                            </p>
                          )}
                        </div>
                      </div>
                      {/* PDF PREVIEW */}

                      {isOpen && pdfUrl && (

                        <div className="pdf-preview-card">

                          <div className="preview-header">

                            <div>

                              <span className="preview-label">
                                DOCUMENT PREVIEW
                              </span>

                              <strong>
                                Unit{" "}
                                {unit.number}{" "}
                                Material
                              </strong>

                            </div>

                            <button
                              type="button"
                              className="new-tab-button"
                              onClick={() =>
                                openPdfInNewTab(
                                  unit.pdf
                                )
                              }
                            >
                              Open in new tab ↗
                            </button>

                          </div>

                          {getEmbedPdfUrl(unit.pdf) ? (
                            <div className="unit-pdf-frame-wrapper">
                              <iframe
                                src={getEmbedPdfUrl(unit.pdf)}
                                title={`Unit ${unit.number} PDF`}
                                className="unit-pdf-frame"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="unit-pdf-frame-wrapper" style={{ padding: "40px 20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                              <p style={{ margin: 0, fontWeight: "500" }}>PDF document for this unit is currently being uploaded or updated.</p>
                            </div>
                          )}

                          <div className="pdf-preview-bottom-bar">
                            <div className="pdf-preview-hint">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              <span>Use document viewer controls inside to navigate pages or zoom</span>
                            </div>
                            <button
                              type="button"
                              className="pdf-preview-expand-btn"
                              onClick={() =>
                                openPdfInNewTab(
                                  unit.pdf
                                )
                              }
                            >
                              Full Window View ↗
                            </button>
                          </div>

                        </div>

                      )}
                    </div>
                  </div>
                </article>
              );
            })}

          </div>

        </section>

        {/* ===================================================
            COMMENTS SECTION
        ==================================================== */}

        <section className="comments-section">

          <div className="comments-card">

            <div className="comments-header">

              <div className="comments-heading">

                <div className="comments-icon">
                  💬
                </div>

                <div>

                  <span className="comments-eyebrow-badge">COMMUNITY</span>

                  <h2>
                    Comments
                  </h2>

                  <p>
                    Share your thoughts, questions,
                    or feedback about these notes.
                  </p>

                </div>

              </div>

              <div className="comments-count">

                {comments.length}{" "}
                {comments.length === 1
                  ? "COMMENT"
                  : "COMMENTS"}

              </div>

            </div>

            {/* COMMENT FORM */}

            <form
              onSubmit={handleSubmitComment}
              className="comment-form"
            >

              <h3 className="comment-form-title">
                Leave a comment
              </h3>

              <div className="comment-form-row">

                <input
                  id="comment-name"
                  type="text"
                  name="name"
                  value={commentForm.name}
                  onChange={handleCommentChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="comment-field"
                  aria-label="Name"
                  required
                />

                <input
                  id="comment-email"
                  type="email"
                  name="email"
                  value={commentForm.email}
                  onChange={handleCommentChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="comment-field"
                  aria-label="Email"
                  required
                />

              </div>

              <textarea
                id="comment-message"
                name="comment"
                value={commentForm.comment}
                onChange={handleCommentChange}
                placeholder="Write your comment..."
                rows={5}
                className="comment-textarea"
                aria-label="Comment"
                required
              />

              <div className="comment-submit-row">

                

                <button
                  type="submit"
                  className="comment-submit-button"
                  disabled={commentSubmitting}
                >
                  {commentSubmitting
                    ? "Posting..."
                    : "Post Comment →"}
                </button>

              </div>

            </form>

            {/* COMMENTS LIST */}

            <div className="comments-list">

              {commentsLoading ? (

                <div className="comments-empty">

                  <div className="comments-empty-icon">
                    ⏳
                  </div>

                  <p>
                    Loading comments...
                  </p>

                </div>

              ) : comments.length === 0 ? (

                <div className="comments-empty">

                  <div className="comments-empty-icon">
                    💬
                  </div>

                  <p>
                    Be the first to share your
                    thoughts.
                  </p>

                </div>

              ) : (

                comments.map((item) => (

                  <article
                    key={item._id}
                    className="comment-item"
                  >

                    <div className="comment-top">

                      <div className="comment-user">

                        <div className="comment-avatar">
                          {item.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>

                        <div className="comment-user-info">

                          <span className="comment-user-name">
                            {item.name || "Anonymous"}
                          </span>

                          <span className="comment-date">
                            {formatCommentDate(
                              item.createdAt
                            )}
                          </span>

                        </div>

                      </div>

                      <button
                        type="button"
                        className="comment-delete-button"
                        onClick={() =>
                          handleDeleteComment(
                            item._id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                    <div className="comment-body">

                      <p>
                        {item.comment}
                      </p>

                    </div>

                    {/* COMMENT ACTIONS */}

                    <div className="comment-actions">

                      {/* ❤️ LIKE */}

                      <button
                        type="button"
                        className="comment-action-button comment-like-button"
                        onClick={(event) =>
                          handleLikeComment(
                            item._id,
                            event
                          )
                        }
                        aria-label="Like comment"
                      >

                        <span className="like-heart">
                          ❤️
                        </span>

                        <span className="comment-action-count">
                          {item.likes || 0}
                        </span>

                      </button>

                      {/* 👎 DISLIKE */}

                      <button
                        type="button"
                        className="comment-action-button comment-dislike-button"
                        onClick={() =>
                          handleDislikeComment(
                            item._id
                          )
                        }
                        aria-label="Dislike comment"
                      >

                        <span>
                          👎
                        </span>

                        <span className="comment-action-count">
                          {item.dislikes || 0}
                        </span>

                      </button>

                    </div>

                  </article>

                ))

              )}

            </div>

          </div>

        </section>



        {/* ===================================================
            FOOTER
        ==================================================== */}

        <section className="study-footer">

          <div className="footer-icon">
            🎓
          </div>

          <div>

            <strong>
              Study smart. Learn better.
            </strong>

            <p>
              Explore each unit at your own
              pace.
            </p>

          </div>

        </section>

      </main>
    </div>

    {/* =====================================================
        RIGHT COLUMN: DEVELOPER PROFILES & JNTU UPLOAD
    ====================================================== */}
    <aside className="note-right-column">
      <AuthorProfile />
    </aside>
  </div>

      {/* =====================================================
          BACK TO TOP
      ====================================================== */}

      {showBackToTop && (
        <button
          type="button"
          className="back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}

    </div>
  );
}

export default NoteDetails;