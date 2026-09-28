import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import "./Notes.css";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const search = searchParams.get("search") || "";

  // =========================================================
  // HEART ANIMATION STATE
  // =========================================================

  const [heartParticles, setHeartParticles] = useState([]);
  const [bigHeart, setBigHeart] = useState(null);

  // =========================================================
  // FETCH NOTES
  // =========================================================

  useEffect(() => {
    fetchNotes();
  }, []);

  // =========================================================
  // FILTER NOTES
  // =========================================================

  useEffect(() => {
    const searchText = search.trim().toLowerCase();

    // No search = show every note
    if (!searchText) {
      setFilteredNotes(notes);
      return;
    }

    const filtered = notes.filter((note) => {
      const title = String(note?.title || "").toLowerCase();
      const branch = String(note?.branch || "").toLowerCase();
      const semester = String(note?.semester || "").toLowerCase();
      const subject = String(note?.subject || "").toLowerCase();
      const subjectCode = String(note?.subjectCode || "").toLowerCase();
      const description = String(note?.description || "").toLowerCase();
      const credits = String(note?.credits || "").toLowerCase();

      return (
        title.includes(searchText) ||
        branch.includes(searchText) ||
        semester.includes(searchText) ||
        subject.includes(searchText) ||
        subjectCode.includes(searchText) ||
        description.includes(searchText) ||
        credits.includes(searchText)
      );
    });

    setFilteredNotes(filtered);
  }, [notes, search]);

  // =========================================================
  // GET NOTES
  // =========================================================

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/notes");

      console.log("========== NOTES API RESPONSE ==========");
      console.log("FULL RESPONSE:", response);
      console.log("RESPONSE DATA:", response.data);

      /*
       * Supports both possible backend responses:
       *
       * 1. [note1, note2, ...]
       *
       * 2. {
       *      success: true,
       *      notes: [note1, note2, ...]
       *    }
       */

      let data = [];

      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response.data?.notes)) {
        data = response.data.notes;
      } else if (Array.isArray(response.data?.data)) {
        data = response.data.data;
      }

      console.log("NOTES RECEIVED FROM API:", data);
      console.log("NUMBER OF NOTES:", data.length);

      // Prepare every note safely
      const preparedNotes = data.map((note) => ({
        ...note,

        likeCount: Number(
          note?.likes ??
            note?.likeCount ??
            0
        ),

        liked: Boolean(note?.liked),

        views: Number(
          note?.views ??
            note?.viewCount ??
            0
        ),

        downloads: Number(
          note?.downloads ?? 0
        ),

        credits: String(
          note?.credits ?? ""
        ),
      }));

      console.log(
        "PREPARED NOTES:",
        preparedNotes
      );

      setNotes(preparedNotes);
      setFilteredNotes(preparedNotes);
    } catch (error) {
      console.error(
        "FETCH NOTES ERROR:",
        error
      );

      console.error(
        "FETCH NOTES RESPONSE:",
        error?.response
      );

      setNotes([]);
      setFilteredNotes([]);

      setError(
        error?.response?.data?.message ||
          "Unable to load notes."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CREATE HEART ANIMATION
  // =========================================================

  const startHeartAnimation = (event) => {
    const button = event.currentTarget;

    const rect =
      button.getBoundingClientRect();

    const originX =
      rect.left + rect.width / 2;

    const originY =
      rect.top + rect.height / 2;

    // =======================================================
    // LARGE HEART
    // =======================================================

    const largeHeart = {
      id: Date.now() + Math.random(),
      x: originX,
      y: originY,
    };

    setBigHeart(largeHeart);

    setTimeout(() => {
      setBigHeart(null);
    }, 1100);

    // =======================================================
    // SMALL HEARTS
    // =======================================================

    const particles = [];

    for (let i = 0; i < 55; i++) {
      const id =
        `${Date.now()}-${i}-${Math.random()}`;

      const spreadX =
        originX +
        (Math.random() - 0.5) *
          window.innerWidth *
          1.25;

      const spreadY =
        originY +
        (Math.random() - 0.35) *
          window.innerHeight *
          0.9;

      const size =
        Math.random() * 14 + 10;

      const duration =
        Math.random() * 1.8 + 1.7;

      const delay =
        Math.random() * 0.45;

      const rotation =
        Math.random() * 80 - 40;

      const drift =
        (Math.random() - 0.5) * 180;

      particles.push({
        id,
        x: spreadX,
        y: spreadY,
        size,
        duration,
        delay,
        rotation,
        drift,
        color:
          Math.random() > 0.5
            ? "#e85b70"
            : "#f08a9b",
      });
    }

    setHeartParticles(particles);

    setTimeout(() => {
      setHeartParticles([]);
    }, 4300);
  };

  // =========================================================
  // LIKE NOTE
  // =========================================================

  const handleLike = (event, noteId) => {
    event.stopPropagation();

    const currentNote = notes.find(
      (note) => note._id === noteId
    );

    if (!currentNote) {
      return;
    }

    // =======================================================
    // UNLIKE
    // =======================================================

    if (currentNote.liked) {
      setNotes((current) =>
        current.map((note) =>
          note._id === noteId
            ? {
                ...note,
                liked: false,
                likeCount: Math.max(
                  0,
                  Number(
                    note.likeCount || 0
                  ) - 1
                ),
              }
            : note
        )
      );

      return;
    }

    // =======================================================
    // LIKE
    // =======================================================

    startHeartAnimation(event);

    setNotes((current) =>
      current.map((note) =>
        note._id === noteId
          ? {
              ...note,
              liked: true,
              likeCount:
                Number(
                  note.likeCount || 0
                ) + 1,
            }
          : note
      )
    );
  };

  // =========================================================
  // OPEN NOTE
  // =========================================================

  const openNote = (noteId) => {
    if (!noteId) {
      return;
    }

    navigate(`/notes/${noteId}`);
  };

  // =========================================================
  // FORMAT COUNT
  // =========================================================

  const formatCount = (value) => {
    const number = Number(value) || 0;

    if (number >= 1000000) {
      return (
        (number / 1000000)
          .toFixed(1)
          .replace(".0", "") + "M"
      );
    }

    if (number >= 1000) {
      return (
        (number / 1000)
          .toFixed(1)
          .replace(".0", "") + "K"
      );
    }

    return number;
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (note) => {
    const value =
      note?.createdAt ||
      note?.updatedAt;

    if (!value) {
      return "01-12-2025";
    }

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "01-12-2025";
      }

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const year =
        date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch {
      return "01-12-2025";
    }
  };

  // =========================================================
  // VIEW COUNT
  // =========================================================

  const getViewCount = (note) => {
    return formatCount(
      note?.views ??
        note?.viewCount ??
        0
    );
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="notes-page">
        <div className="notes-empty">
          <div className="notes-empty-icon">
            📚
          </div>

          <h2>
            Loading Notes...
          </h2>

          <p>
            Please wait while we load
            the study materials.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR STATE
  // =========================================================

  if (error) {
    return (
      <div className="notes-page">
        <div className="notes-empty">
          <div className="notes-empty-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load Notes
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchNotes}
            style={{
              marginTop: "16px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // EMPTY STATE
  // =========================================================

  if (filteredNotes.length === 0) {
    return (
      <div className="notes-page">
        <div className="notes-empty">
          <div className="notes-empty-icon">
            📚
          </div>

          <h2>
            No Notes Found
          </h2>

          <p>
            {search
              ? `No study material matches "${search}".`
              : "No study material is available yet."}
          </p>

          {search && (
            <button
              type="button"
              onClick={() =>
                navigate("/notes")
              }
              style={{
                marginTop: "16px",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              View All Notes
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="notes-page">

      {/* ===================================================
          FLOATING HEART ANIMATION
      =================================================== */}

      <div
        className="heart-animation-layer"
        aria-hidden="true"
      >

        {bigHeart && (
          <div
            key={bigHeart.id}
            className="big-heart-animation"
            style={{
              left: `${bigHeart.x}px`,
              top: `${bigHeart.y}px`,
            }}
          >
            ♥
          </div>
        )}

        {heartParticles.map((heart) => (
          <span
            key={heart.id}
            className="heart-particle"
            style={{
              left: `${heart.x}px`,
              top: `${heart.y}px`,
              "--heart-size": `${heart.size}px`,
              "--heart-duration": `${heart.duration}s`,
              "--heart-delay": `${heart.delay}s`,
              "--heart-rotation": `${heart.rotation}deg`,
              "--heart-drift": `${heart.drift}px`,
              "--heart-color": heart.color,
            }}
          >
            ♥
          </span>
        ))}

      </div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="notes-header">

        <div>

          <span className="notes-eyebrow">
            STUDY MATERIAL
          </span>

          <h1>
            All Notes
          </h1>

          <p>
            Explore study materials and
            course notes.
          </p>

        </div>

        <div className="notes-count">

          <strong>
            {filteredNotes.length}
          </strong>

          <span>
            NOTES
          </span>

        </div>

      </section>

      {/* ===================================================
          NOTES GRID
      =================================================== */}

      <section className="notes-grid">

        {filteredNotes.map((note) => {

          const isLiked =
            Boolean(note.liked);

          return (
            <article
              key={note._id}
              className="note-card"
            >

              {/* =========================================
                  IMAGE / TITLE AREA
              ========================================= */}

              <div
                className="note-card-image"
                onClick={() =>
                  openNote(note._id)
                }
              >

                <div className="read-time">

                  <span className="read-time-icon">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="8"
                      />

                      <path d="M12 7v5l3 2" />
                    </svg>
                  </span>

                  <span>
                    1 min read
                  </span>

                </div>

                <div className="note-card-title">
                  {note.title}
                </div>

              </div>

              {/* =========================================
                  CONTENT
              ========================================= */}

              <div className="note-card-content">

                {/* BRANCH */}

                {note.branch && (
                  <div className="note-branch">
                    📁 {note.branch}
                  </div>
                )}

                {/* TITLE */}

                <h2
                  onClick={() =>
                    openNote(note._id)
                  }
                >
                  {note.title}
                </h2>

                {/* SUBJECT */}

                {note.subject && (
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <strong>
                      Subject:
                    </strong>{" "}
                    {note.subject}
                  </div>
                )}

                {/* SUBJECT CODE */}

                {note.subjectCode && (
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "13px",
                    }}
                  >
                    <strong>
                      Code:
                    </strong>{" "}
                    {note.subjectCode}
                  </div>
                )}

                {/* SEMESTER */}

                {note.semester && (
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "13px",
                    }}
                  >
                    <strong>
                      Semester:
                    </strong>{" "}
                    {note.semester}
                  </div>
                )}

                {/* CREDITS */}

                {note.credits && (
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "13px",
                    }}
                  >
                    <strong>
                      Credits:
                    </strong>{" "}
                    {note.credits}
                  </div>
                )}

                {/* DESCRIPTION */}

                {note.description && (
                  <p className="note-description">
                    {note.description}
                  </p>
                )}

                {/* =======================================
                    PROFESSIONAL CARD FOOTER
                ======================================== */}

                <div className="note-stats">

                  {/* LEFT SIDE */}

                  <div className="note-meta-group">

                    {/* DATE */}

                    <div className="note-stat">

                      <span className="stat-icon">
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <rect
                            x="4"
                            y="5"
                            width="16"
                            height="15"
                            rx="2"
                          />

                          <path d="M8 3v4M16 3v4M4 9h16" />
                        </svg>
                      </span>

                      <span className="stat-text">
                        {formatDate(note)}
                      </span>

                    </div>

                    {/* VIEWS */}

                    <div className="note-stat">

                      <span className="stat-icon">
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

                          <circle
                            cx="12"
                            cy="12"
                            r="2.5"
                          />
                        </svg>
                      </span>

                      <span className="stat-text">
                        {getViewCount(note)}
                      </span>

                    </div>

                  </div>

                  {/* RIGHT SIDE - LIKE */}

                  <button
                    type="button"
                    className={`note-like-button ${
                      isLiked
                        ? "liked"
                        : ""
                    }`}
                    onClick={(event) =>
                      handleLike(
                        event,
                        note._id
                      )
                    }
                    aria-label={
                      isLiked
                        ? "Unlike"
                        : "Like"
                    }
                  >

                    <span className="heart-icon">

                      {isLiked ? (
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="heart-svg filled"
                        >
                          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="heart-svg"
                        >
                          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                        </svg>
                      )}

                    </span>

                    <span className="like-number">
                      {formatCount(
                        note.likeCount
                      )}
                    </span>

                  </button>

                </div>

              </div>

            </article>
          );
        })}

      </section>

    </div>
  );
}

export default Notes;