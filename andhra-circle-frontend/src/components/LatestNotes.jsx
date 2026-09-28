
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
                  BANNER
              ========================================== */}

              <div className="resource-image">

                <img
                  src={getImageUrl(note.imageUrl)}
                  alt={note.title || "Notes"}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      defaultBanner;
                  }}
                />

                <span className="read-time">
                  📘 Notes
                </span>

              </div>

              {/* ==========================================
                  CONTENT
              ========================================== */}

              <div className="resource-content">

                <span className="resource-badge">
                  {note.branch || "Notes"}
                </span>

                <h3>
                  {note.title ||
                    "Untitled Notes"}
                </h3>

                <p>
                  {note.description ||
                    "Academic study material for students."}
                </p>

                {/* ==========================================
                    DETAILS
                ========================================== */}

                <div className="resource-footer">

                  <span>
                    📚{" "}
                    {note.subject ||
                      "Subject"}
                  </span>

                  <span>
                    🎓{" "}
                    {note.semester ||
                      "Semester"}
                  </span>

                  <span>
                    📅{" "}
                    {formatDate(
                      note.createdAt
                    )}
                  </span>

                </div>

                {/* ==========================================
                    STATS
                ========================================== */}

                <div className="resource-stats">

                  <span>
                    👁{" "}
                    {note.views || 0} Views
                  </span>

                  <span>
                    ⬇{" "}
                    {note.downloads || 0} Downloads
                  </span>

                  {/* LIKE */}

                  <button
                    type="button"
                    className="like-button"
                    onClick={async () => {

                      try {

                        await API.put(
                          `/notes/${note._id}/like`
                        );

                        setNotes((prev) =>
                          prev.map(
                            (item) =>
                              item._id ===
                              note._id
                                ? {
                                    ...item,
                                    likes:
                                      (item.likes ||
                                        0) + 1,
                                  }
                                : item
                          )
                        );

                      } catch (error) {

                        console.error(
                          "Error liking note:",
                          error
                        );

                      }

                    }}
                  >
                    ❤️{" "}
                    {note.likes || 0}
                  </button>

                </div>

                {/* ==========================================
                    BUTTONS
                ========================================== */}

                <div className="resource-buttons">

                  <button
                    type="button"
                    className="view-pdf-button"
                    onClick={() =>
                      handleView(note)
                    }
                  >
                    View Notes
                  </button>

                  <button
                    type="button"
                    className="download-pdf-button"
                    onClick={() =>
                      handleModuleDownload(
                        note,
                        1
                      )
                    }
                  >
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
