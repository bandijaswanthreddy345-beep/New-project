import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";

function NoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH SINGLE NOTE
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchNote = async () => {
      if (!id) {
        if (mounted) {
          setError("Note ID is missing.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("=================================");
        console.log("NOTE DETAILS");
        console.log("NOTE ID:", id);

        // Fetch the individual note
        const response = await API.get(`/notes/${id}`);

        console.log("NOTE RESPONSE:", response.data);
        console.log("=================================");

        if (!mounted) return;

        /*
         * Some backends return:
         *
         * { ...note }
         *
         * while others return:
         *
         * { note: { ...note } }
         *
         * This handles both.
         */
        const noteData =
          response.data?.note ||
          response.data?.data ||
          response.data;

        if (!noteData) {
          setError("Note was not found.");
          setNote(null);
          return;
        }

        setNote(noteData);
      } catch (err) {
        console.error("NOTE DETAILS ERROR:", err);

        if (!mounted) return;

        const status = err?.response?.status;

        if (status === 404) {
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
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="note-details-page">
        <div className="note-details-loading">
          <div className="note-loading-spinner"></div>

          <p>Loading note...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !note) {
    return (
      <div className="note-details-page">
        <div className="note-details-error">

          <div className="note-error-icon">
            📘
          </div>

          <h2>
            {error || "Note not found"}
          </h2>

          <p>
            The note could not be loaded.
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="note-back-button"
          >
            ← Go Back
          </button>

        </div>
      </div>
    );
  }

  // =========================================================
  // GET NOTE VALUES
  // =========================================================

  const title =
    note.title ||
    note.name ||
    note.subject ||
    "Untitled Note";

  const description =
    note.description ||
    note.content ||
    note.text ||
    "";

  const subject =
    note.subject ||
    "";

  const subjectCode =
    note.subjectCode ||
    "";

  const branch =
    note.branch ||
    "";

  const semester =
    note.semester ||
    "";

  const year =
    note.year ||
    "";

  const fileUrl =
    note.fileUrl ||
    note.file ||
    note.pdfUrl ||
    note.documentUrl ||
    note.url ||
    "";

  const imageUrl =
    note.imageUrl ||
    note.image ||
    note.banner ||
    note.thumbnail ||
    "";

  // =========================================================
  // BACKEND FILE URL
  // =========================================================

  const BACKEND_URL = "http://localhost:5000";

  const getFileUrl = (url) => {
    if (!url || typeof url !== "string") {
      return "";
    }

    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    if (url.startsWith("/")) {
      return `${BACKEND_URL}${url}`;
    }

    return `${BACKEND_URL}/${url}`;
  };

  const finalFileUrl = getFileUrl(fileUrl);
  const finalImageUrl = getFileUrl(imageUrl);

  // =========================================================
  // OPEN FILE
  // =========================================================

  const openFile = () => {
    if (!finalFileUrl) {
      console.warn("No file URL found for this note.");
      return;
    }

    window.open(
      finalFileUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="note-details-page">

      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <div className="note-details-top">

        <button
          type="button"
          className="note-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

      </div>

      {/* =====================================================
          NOTE CONTENT
      ====================================================== */}

      <main className="note-details-content">

        {/* ===================================================
            IMAGE
        ==================================================== */}

        {finalImageUrl && (
          <div className="note-details-image-wrapper">

            <img
              src={finalImageUrl}
              alt={title}
              className="note-details-image"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

          </div>
        )}

        {/* ===================================================
            TITLE
        ==================================================== */}

        <h1 className="note-details-title">
          {title}
        </h1>

        {/* ===================================================
            META
        ==================================================== */}

        <div className="note-details-meta">

          {subject && (
            <span>
              <strong>Subject:</strong>{" "}
              {subject}
            </span>
          )}

          {subjectCode && (
            <span>
              <strong>Subject Code:</strong>{" "}
              {subjectCode}
            </span>
          )}

          {branch && (
            <span>
              <strong>Branch:</strong>{" "}
              {branch}
            </span>
          )}

          {semester && (
            <span>
              <strong>Semester:</strong>{" "}
              {semester}
            </span>
          )}

          {year && (
            <span>
              <strong>Year:</strong>{" "}
              {year}
            </span>
          )}

        </div>

        {/* ===================================================
            DESCRIPTION / CONTENT
        ==================================================== */}

        {description && (
          <section className="note-details-description">

            <h2>
              Note Content
            </h2>

            <div className="note-content-text">
              {description}
            </div>

          </section>
        )}

        {/* ===================================================
            FILE
        ==================================================== */}

        {finalFileUrl && (
          <section className="note-details-file">

            <h2>
              Note Document
            </h2>

            <button
              type="button"
              className="note-open-file-button"
              onClick={openFile}
            >
              📄 Open Note
            </button>

          </section>
        )}

        {/* ===================================================
            DEBUG INFORMATION
            Remove this section later if not needed.
        ==================================================== */}

        <div
          style={{
            display: "none",
          }}
        >
          {JSON.stringify(note)}
        </div>

      </main>

    </div>
  );
}

export default NoteDetails;

