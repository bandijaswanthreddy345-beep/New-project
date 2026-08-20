import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";
import "./NoteDetails.css";

function NoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModule, setOpenModule] = useState(null);

  // =========================================================
  // COMMENTS STATE
  // =========================================================

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [commentForm, setCommentForm] = useState({
    name: "",
    email: "",
    comment: "",
  });

  const BACKEND_URL = "http://localhost:5000";

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
      if (!id) {
        return;
      }

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
  const semester = note?.semester || "";
  const year = note?.year || "";
  const description = note?.description || "";

  // =========================================================
  // MODULES
  // =========================================================

  const modules = useMemo(() => {
    if (!note) return [];

    return [
      {
        number: 1,
        title: note.module1Title || "Module 1",
        notes: note.module1 || "",
        pdf: note.module1Pdf || "",
      },
      {
        number: 2,
        title: note.module2Title || "Module 2",
        notes: note.module2 || "",
        pdf: note.module2Pdf || "",
      },
      {
        number: 3,
        title: note.module3Title || "Module 3",
        notes: note.module3 || "",
        pdf: note.module3Pdf || "",
      },
      {
        number: 4,
        title: note.module4Title || "Module 4",
        notes: note.module4 || "",
        pdf: note.module4Pdf || "",
      },
      {
        number: 5,
        title: note.module5Title || "Module 5",
        notes: note.module5 || "",
        pdf: note.module5Pdf || "",
      },
    ];
  }, [note]);

  // =========================================================
  // MODULE TOGGLE
  // =========================================================

  const toggleModule = (number) => {
    setOpenModule((current) =>
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
    if (!pdf) {
      return;
    }

    const fileName = getFileName(pdf);

    if (!fileName) {
      return;
    }

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
    if (!pdf) {
      return;
    }

    const fileName = getFileName(pdf);

    if (!fileName) {
      return;
    }

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
    moduleNumber
  ) => {
    const url = getBackendUrl(pdf);

    if (!url) {
      return;
    }

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
        `${title}-Module-${moduleNumber}.pdf`;

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

      setCommentForm({
        name: "",
        email: "",
        comment: "",
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
  // LIKE COMMENT
  // =========================================================

  const handleLikeComment = async (
    commentId
  ) => {
    try {
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
    try {
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

    if (!confirmed) {
      return;
    }

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
    if (!date) {
      return "";
    }

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
            onClick={() => navigate(-1)}
            className="green-button"
          >
            ← Go Back
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
          HERO
      ====================================================== */}

      <section className="note-hero">

        <div className="note-hero-background">
          <img
            src={defaultBanner}
            alt=""
          />
        </div>

        <div className="note-hero-overlay"></div>

        <div className="note-hero-content">

          <button
            type="button"
            className="hero-back-button"
            onClick={() => navigate(-1)}
          >
            <span>←</span>
            Back to Notes
          </button>

          <div className="hero-main">

            <div className="study-badge">
              <span>▣</span>
              STUDY MATERIAL
            </div>

            <h1>
              {title}
            </h1>

            <div className="hero-subtitle">

              {subject && (
                <span>
                  {subject}
                </span>
              )}

              {subject &&
                subjectCode && (
                  <span className="hero-dot">
                    •
                  </span>
                )}

              {subjectCode && (
                <span>
                  {subjectCode}
                </span>
              )}

            </div>

            <div className="hero-tags">

              {branch && (
                <div className="hero-tag">
                  <span>🎓</span>
                  {branch}
                </div>
              )}

              {semester && (
                <div className="hero-tag">
                  <span>📚</span>
                  {semester}
                </div>
              )}

              {year && (
                <div className="hero-tag">
                  <span>📅</span>
                  {year}
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="note-main">

        {/* ===================================================
            COURSE + ABOUT
        ==================================================== */}

        <section className="info-grid">

          <div className="course-card">

            <div className="card-heading">

              <div className="heading-icon">
                📚
              </div>

              <div>

                <span className="eyebrow">
                  COURSE DETAILS
                </span>

                <h2>
                  {title}
                </h2>

              </div>

            </div>

            <div className="course-details-grid">

              <div className="detail-item">

                <span className="detail-label">
                  Subject
                </span>

                <strong>
                  {subject || "—"}
                </strong>

              </div>

              <div className="detail-item">

                <span className="detail-label">
                  Subject Code
                </span>

                <strong>
                  {subjectCode || "—"}
                </strong>

              </div>

              <div className="detail-item">

                <span className="detail-label">
                  Branch
                </span>

                <strong>
                  {branch || "—"}
                </strong>

              </div>

              <div className="detail-item">

                <span className="detail-label">
                  Semester
                </span>

                <strong>
                  {semester || "—"}
                </strong>

              </div>

            </div>

          </div>

          {/* ABOUT */}

          <div className="about-card">

            <div className="about-heading">

              <div className="about-icon">
                ℹ
              </div>

              <div>

                <span className="eyebrow">
                  ABOUT THIS RESOURCE
                </span>

                <h2>
                  About these notes
                </h2>

              </div>

            </div>

            <div className="about-content">

              <span className="quote-mark">
                “
              </span>

              <p>
                {description ||
                  "Study material for this course."}
              </p>

              <span className="book-decoration">
                📖
              </span>

            </div>

          </div>

        </section>

        {/* ===================================================
            MODULES
        ==================================================== */}

        <section className="modules-section">

          <div className="modules-header">

            <div>

              <span className="eyebrow">
                COURSE CONTENT
              </span>

              <h2>
                Modules
              </h2>

              <p>
                Select a module to view its notes
                and PDF document.
              </p>

            </div>

            <div className="module-count">

              <strong>
                {modules.length}
              </strong>

              <span>
                MODULES
              </span>

            </div>

          </div>

          <div className="modules-list">

            {modules.map((module) => {

              const isOpen =
                openModule === module.number;

              const pdfUrl =
                getBackendUrl(module.pdf);

              return (
                <article
                  key={module.number}
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
                      toggleModule(
                        module.number
                      )
                    }
                    aria-expanded={isOpen}
                  >

                    <div className="module-number">
                      {String(
                        module.number
                      ).padStart(2, "0")}
                    </div>

                    <div className="module-heading">

                      <span>
                        MODULE{" "}
                        {module.number}
                      </span>

                      <h3>
                        {module.title}
                      </h3>

                    </div>

                    <div
                      className={`module-arrow ${
                        isOpen
                          ? "arrow-open"
                          : ""
                      }`}
                    >
                      ↓
                    </div>

                  </button>

                  <div
                    className={`module-expand ${
                      isOpen
                        ? "module-expand-open"
                        : ""
                    }`}
                  >

                    <div className="module-inner">

                      <div className="module-resource-grid">

                        {/* MODULE NOTES */}

                        <div className="module-notes-box">

                          <div className="resource-title">

                            <div className="resource-icon">
                              📝
                            </div>

                            <div>

                              <span>
                                MODULE NOTES
                              </span>

                              <small>
                                Study notes
                              </small>

                            </div>

                          </div>

                          <div className="notes-text">

                            {module.notes ? (
                              <p>
                                {module.notes}
                              </p>
                            ) : (
                              <p className="empty-text">
                                No notes available
                                for this module.
                              </p>
                            )}

                          </div>

                        </div>

                        {/* PDF */}

                        <div className="module-pdf-box">

                          <div className="resource-title">

                            <div className="resource-icon pdf-icon">
                              PDF
                            </div>

                            <div>

                              <span>
                                MODULE{" "}
                                {module.number}{" "}
                                PDF
                              </span>

                              <small>
                                Study material
                                document
                              </small>

                            </div>

                          </div>

                          {pdfUrl ? (

                            <div className="pdf-actions">

                              <button
                                type="button"
                                className="open-pdf-button"
                                onClick={() =>
                                  openPdf(
                                    module.pdf
                                  )
                                }
                              >
                                ↗ Open PDF
                              </button>

                              <button
                                type="button"
                                className="download-pdf-button"
                                onClick={() =>
                                  downloadPdf(
                                    module.pdf,
                                    module.number
                                  )
                                }
                              >
                                ↓ Download
                              </button>

                            </div>

                          ) : (

                            <div className="pdf-unavailable">
                              PDF not available
                            </div>

                          )}

                        </div>

                      </div>

                      {/* PDF PREVIEW */}

                      {pdfUrl && (

                        <div className="pdf-preview-card">

                          <div className="preview-header">

                            <div>

                              <span className="preview-label">
                                PDF PREVIEW
                              </span>

                              <strong>
                                Module{" "}
                                {module.number}{" "}
                                document
                              </strong>

                            </div>

                            <button
                              type="button"
                              className="new-tab-button"
                              onClick={() =>
                                openPdfInNewTab(
                                  module.pdf
                                )
                              }
                            >
                              Open in new tab ↗
                            </button>

                          </div>

                          <div className="pdf-frame-wrapper">

                            <iframe
                              src={pdfUrl}
                              title={`Module ${module.number} PDF`}
                              className="pdf-frame"
                              loading="lazy"
                            />

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

            {/* =================================================
                COMMENTS HEADER
            ================================================== */}

            <div className="comments-header">

              <div className="comments-heading">

                <div className="comments-icon">
                  💬
                </div>

                <div>

                  <span className="eyebrow">
                    COMMUNITY
                  </span>

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

            {/* =================================================
                COMMENT FORM
            ================================================== */}

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

                <span className="comment-private-note">
                  Your email will not be displayed publicly.
                </span>

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

            {/* =================================================
                COMMENTS LIST
            ================================================== */}

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

                    <div className="comment-actions">

                      <button
                        type="button"
                        className="comment-action-button comment-like-button"
                        onClick={() =>
                          handleLikeComment(
                            item._id
                          )
                        }
                      >
                        <span>
                          👍
                        </span>

                        <span className="comment-action-count">
                          {item.likes || 0}
                        </span>

                      </button>

                      <button
                        type="button"
                        className="comment-action-button comment-dislike-button"
                        onClick={() =>
                          handleDislikeComment(
                            item._id
                          )
                        }
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
              Explore each module at your own
              pace.
            </p>

          </div>

          <div className="footer-books">
            📚
          </div>

        </section>

      </main>

      {/* =====================================================
          BACK TO TOP
      ====================================================== */}

      <button
        type="button"
        className="back-to-top"
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        ↑
      </button>

    </div>
  );
}

export default NoteDetails;