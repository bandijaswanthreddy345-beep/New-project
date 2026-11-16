import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API, { BACKEND_URL } from "../api/api";
import AuthorProfile from "../components/AuthorProfile";
import { normalizeSemester, normalizeScheme } from "../utils/semester";
import { getStoredStudentData } from "../data/studentData";
import { formatSemDisplay } from "../utils/validators";
import trigger100Hearts from "../utils/heartBurst";
import { updateCachedResourceItem } from "../utils/resourceCache";
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

  // Comments menu & edit state
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentUpdating, setCommentUpdating] = useState(false);

  // Close comments dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".comment-menu-wrapper")) {
        setActiveMenuCommentId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Starred / Bookmarked Note State (stored locally)
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    if (!id) return;
    try {
      const stored = localStorage.getItem("andhra_starred_notes");
      const list = stored ? JSON.parse(stored) : [];
      setIsStarred(Array.isArray(list) && list.includes(id));
    } catch {
      setIsStarred(false);
    }
  }, [id]);

  const handleToggleStar = (e) => {
    e.stopPropagation();
    if (!id) return;
    try {
      const stored = localStorage.getItem("andhra_starred_notes");
      const list = stored ? JSON.parse(stored) : [];
      let updated;
      if (list.includes(id)) {
        updated = list.filter((item) => item !== id);
        setIsStarred(false);
      } else {
        updated = [...list, id];
        setIsStarred(true);
      }
      localStorage.setItem("andhra_starred_notes", JSON.stringify(updated));
    } catch {
      setIsStarred((prev) => !prev);
    }
  };

  // Note like state tracked per client browser
  const [isNoteLiked, setIsNoteLiked] = useState(() => {
    try {
      const keys = ["andhra_liked_notes", "andhra_liked_resources"];
      for (const k of keys) {
        const stored = localStorage.getItem(k);
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr) && arr.includes(id)) return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  const handleToggleLikeNote = async (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (!id) return;

    const nextLiked = !isNoteLiked;
    setIsNoteLiked(nextLiked);
    const action = nextLiked ? "like" : "unlike";

    if (nextLiked) {
      const rect = e?.currentTarget?.getBoundingClientRect();
      if (rect) {
        setHeartPop({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setTimeout(() => setHeartPop(null), 950);
      }
    }

    // Persist to local storage across shared keys
    try {
      ["andhra_liked_notes", "andhra_liked_resources"].forEach((k) => {
        const raw = localStorage.getItem(k);
        const set = new Set(raw ? JSON.parse(raw) : []);
        if (nextLiked) set.add(id);
        else set.delete(id);
        localStorage.setItem(k, JSON.stringify([...set]));
      });
    } catch (err) {
      console.error("Storage error for note like:", err);
    }

    // Optimistic state and cache update
    setNote((prev) => {
      if (!prev) return prev;
      const current = typeof prev.likes === "number" && !isNaN(prev.likes) ? prev.likes : 0;
      const target = Math.max(0, current + (nextLiked ? 1 : -1));
      updateCachedResourceItem("notes", id, { likes: target });
      return { ...prev, likes: target };
    });

    try {
      const res = await API.put(`/notes/${id}/like`, { action });
      if (res.data && typeof res.data.likes === "number") {
        setNote((prev) => (prev ? { ...prev, likes: res.data.likes } : prev));
        updateCachedResourceItem("notes", id, { likes: res.data.likes });
      }
    } catch (err) {
      console.error("Error updating like on note:", err);
    }
  };

  // Double-tap to like on hero banner
  const heroLastTapRef = useRef(0);
  const handleHeroClick = (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    const now = Date.now();
    if (now - heroLastTapRef.current < 350) {
      heroLastTapRef.current = 0;
      handleToggleLikeNote(e);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([40, 30, 60]);
        } catch {}
      }
      trigger100Hearts(
        e.clientX || window.innerWidth / 2,
        e.clientY || window.innerHeight / 2
      );
    } else {
      heroLastTapRef.current = now;
    }
  };

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

        // Register view count on backend
        API.put(`/notes/${id}/view`)
          .then((res) => {
            if (res.data && typeof res.data.views === "number") {
              setNote((prev) => (prev ? { ...prev, views: res.data.views } : prev));
              updateCachedResourceItem("notes", id, { views: res.data.views });
            }
          })
          .catch(() => { });

        const response = await API.get(`/notes/${id}`);

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
        updateCachedResourceItem("notes", id, {
          views: noteData.views,
          likes: noteData.likes,
          downloads: noteData.downloads,
        });
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

    // External URLs (Google Drive, university portals, etc.): proxy through backend
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      if (!trimmed.includes("localhost:5000") && !trimmed.includes(BACKEND_URL)) {
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

    const defaultPdf = note.pdfUrl || "";

    return [
      {
        number: 1,
        title: note.module1Title || note.module1 || "Unit 1",
        notes: note.module1 || "",
        pdf: note.module1Pdf || note.pdfUrl || "",
      },
      {
        number: 2,
        title: note.module2Title || note.module2 || "Unit 2",
        notes: note.module2 || "",
        pdf: note.module2Pdf || note.pdfUrl || "",
      },
      {
        number: 3,
        title: note.module3Title || note.module3 || "Unit 3",
        notes: note.module3 || "",
        pdf: note.module3Pdf || note.pdfUrl || "",
      },
      {
        number: 4,
        title: note.module4Title || note.module4 || "Unit 4",
        notes: note.module4 || "",
        pdf: note.module4Pdf || note.pdfUrl || "",
      },
      {
        number: 5,
        title: note.module5Title || note.module5 || "Unit 5",
        notes: note.module5 || "",
        pdf: note.module5Pdf || note.pdfUrl || "",
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

    if (id) {
      API.put(`/notes/${id}/download`).catch(() => { });
      setNote((prev) => {
        if (!prev) return prev;
        const newDl = (prev.downloads || 0) + 1;
        updateCachedResourceItem("notes", id, { downloads: newDl });
        return { ...prev, downloads: newDl };
      });
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
  // EDIT COMMENT
  // =========================================================

  const handleStartEditComment = (item) => {
    setEditingCommentId(item._id);
    setEditingCommentText(item.comment || "");
    setActiveMenuCommentId(null);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleSaveEditComment = async (commentId) => {
    const text = editingCommentText.trim();
    if (!text) {
      alert("Comment cannot be empty.");
      return;
    }

    try {
      setCommentUpdating(true);
      const res = await API.put(`/comments/${commentId}`, { comment: text });
      const updated = res.data?.comment || { comment: text };

      setComments((current) =>
        current.map((item) =>
          item._id === commentId ? { ...item, comment: updated.comment || text } : item
        )
      );
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (err) {
      console.error("EDIT COMMENT ERROR:", err);
      alert(err?.response?.data?.message || "Unable to update comment.");
    } finally {
      setCommentUpdating(false);
    }
  };

  // =========================================================
  // DELETE COMMENT
  // =========================================================

  const handleDeleteComment = async (
    commentId
  ) => {
    setActiveMenuCommentId(null);
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
                Academic Resource Hub
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
          <section
            className="note-hero"
            onClick={handleHeroClick}
            onDoubleClick={(e) => {
              handleToggleLikeNote(e);
              trigger100Hearts(
                e.clientX || window.innerWidth / 2,
                e.clientY || window.innerHeight / 2
              );
            }}
          >
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
                <div className="hero-tag hero-tag-card hero-tag-scheme" title="Curriculum Regulation Scheme">
                  <span className="hero-tag-label">SCHEME</span>
                  <strong className="hero-tag-value">
                    {normalizeScheme(note).includes("Scheme") ? normalizeScheme(note) : `${normalizeScheme(note)} Scheme`}
                  </strong>
                </div>
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
                <div className="hero-tag hero-tag-card hero-tag-views" title={`${note?.views || 0} Total Views`}>
                  <span className="hero-tag-label">VIEWS</span>
                  <strong className="hero-tag-value">👁 {note?.views || 0}</strong>
                </div>
                <div className="hero-tag hero-tag-card hero-tag-downloads" title={`${note?.downloads || 0} Total Downloads`}>
                  <span className="hero-tag-label">DOWNLOADS</span>
                  <strong className="hero-tag-value">📥 {note?.downloads || 0}</strong>
                </div>
              </div>

              <div className="hero-action-buttons-group">
                <div
                  className={`hero-credits-integrated ${isStarred ? "is-starred" : ""}`}
                  aria-label="Course credits & bookmark"
                  onClick={handleToggleStar}
                  title={isStarred ? "Starred note! Click to unstar" : "Click star to bookmark this note"}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleStar(e);
                    }
                  }}
                >
                  <button
                    type="button"
                    className={`hero-credits-icon hero-credits-star-btn ${isStarred ? "starred" : ""}`}
                    aria-label={isStarred ? "Starred note" : "Star this note"}
                    onClick={handleToggleStar}
                  >
                    <svg viewBox="0 0 24 24" fill={isStarred ? "#d9a726" : "none"} stroke={isStarred ? "#d9a726" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                  <div className="hero-credits-copy">
                    <span className="hero-credits-label">COURSE CREDITS</span>
                    <span className="hero-credits-desc">{isStarred ? "Starred in your favorites" : "Credit value for this subject"}</span>
                  </div>
                  <strong className="hero-credits-value">{credits || "4"}</strong>
                </div>

                <div
                  className={`hero-credits-integrated hero-likes-integrated ${isNoteLiked ? "is-liked" : ""}`}
                  aria-label="Like this study material"
                  onClick={handleToggleLikeNote}
                  title={isNoteLiked ? "Liked! Click to unlike" : "Click heart to like this note"}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleLikeNote(e);
                    }
                  }}
                >
                  <button
                    type="button"
                    className={`hero-credits-icon hero-likes-icon ${isNoteLiked ? "liked" : ""}`}
                    aria-label={isNoteLiked ? "Liked note" : "Like this note"}
                    onClick={handleToggleLikeNote}
                  >
                    <svg viewBox="0 0 24 24" fill={isNoteLiked ? "#e11d48" : "none"} stroke={isNoteLiked ? "#e11d48" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <div className="hero-credits-copy">
                    <span className="hero-credits-label">LIKES</span>
                    <span className="hero-credits-desc">{isNoteLiked ? "You liked this note" : "Tap heart to like"}</span>
                  </div>
                  <strong className="hero-credits-value hero-likes-value">{note?.likes || 0}</strong>
                </div>
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

                      {unit.notes && unit.notes.trim() !== "" && (
                        <div
                          className="module-notes-box"
                          style={{
                            marginBottom: "16px",
                            padding: "16px 20px",
                            background: "linear-gradient(145deg, #ffffff 0%, #f4f8f6 100%)",
                            borderRadius: "12px",
                            border: "1.5px solid rgba(16, 185, 129, 0.25)",
                            boxShadow: "0 2px 8px rgba(0, 36, 31, 0.04)"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.08em", color: "#00796b", textTransform: "uppercase" }}>
                              Unit Syllabus & Topics Outline
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.92rem", color: "#1e293b", lineHeight: "1.65", whiteSpace: "pre-wrap", fontWeight: "500" }}>
                            {unit.notes}
                          </p>
                        </div>
                      )}

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
                            <div className="unit-pdf-frame-wrapper pdf-frame-wrapper">
                              <iframe
                                src={getEmbedPdfUrl(unit.pdf)}
                                title={`Unit ${unit.number} PDF`}
                                className="unit-pdf-frame pdf-frame"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="unit-pdf-frame-wrapper pdf-frame-wrapper" style={{ padding: "40px 20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
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

                      {/* 3-DOTS ACTION MENU */}
                      <div className="comment-menu-wrapper">
                        <button
                          type="button"
                          className="comment-menu-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuCommentId((prev) => (prev === item._id ? null : item._id));
                          }}
                          aria-label="Comment options"
                          title="More options"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>

                        {activeMenuCommentId === item._id && (
                          <div className="comment-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="comment-menu-item comment-menu-edit"
                              onClick={() => handleStartEditComment(item)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="comment-menu-item comment-menu-delete"
                              onClick={() => handleDeleteComment(item._id)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="comment-body">

                      {editingCommentId === item._id ? (
                        <div className="comment-edit-inline-wrap">
                          <textarea
                            className="comment-edit-textarea"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            rows="3"
                            autoFocus
                            placeholder="Edit your comment..."
                          />
                          <div className="comment-edit-actions">
                            <button
                              type="button"
                              className="comment-edit-btn-cancel"
                              onClick={handleCancelEditComment}
                              disabled={commentUpdating}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="comment-edit-btn-save"
                              onClick={() => handleSaveEditComment(item._id)}
                              disabled={commentUpdating}
                            >
                              {commentUpdating ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>
                          {item.comment}
                        </p>
                      )}

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