import { useEffect, useState } from "react";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";

function LatestNotes({ search = "" }) {
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
      console.error(
        "Error fetching notes:",
        error
      );
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
  // PDF URL
  // ==========================================

  const getPdfUrl = (pdfUrl) => {
    if (!pdfUrl) return "";

    if (
      pdfUrl.startsWith("http://") ||
      pdfUrl.startsWith("https://")
    ) {
      return pdfUrl;
    }

    return `http://localhost:5000${pdfUrl}`;
  };

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
  // DOWNLOAD PDF
  // ==========================================

const handleDownload = async (note) => {
  try {
    await API.put(`/notes/${note._id}/download`);

    setNotes((prev) =>
      prev.map((item) =>
        item._id === note._id
          ? {
              ...item,
              downloads: (item.downloads || 0) + 1,
            }
          : item
      )
    );

    const response = await fetch(getPdfUrl(note.pdfUrl));

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${note.title}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert("Unable to download PDF.");
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

      <div className="section-heading">
        <span className="section-tag">
          STUDY MATERIALS
        </span>

        <h2>Latest Notes</h2>
      </div>

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

              {/* Banner */}

<a
  href={getPdfUrl(note.pdfUrl)}
  target="_blank"
  rel="noopener noreferrer"
  onClick={async () => {
    try {
      await API.put(`/notes/${note._id}/view`);

      setNotes((prev) =>
        prev.map((item) =>
          item._id === note._id
            ? { ...item, views: item.views + 1 }
            : item
        )
      );
    } catch (err) {
      console.error(err);
    }
  }}
>
  <div className="resource-image">

    <img
      src={getImageUrl(note.imageUrl)}
      alt={note.title}
      onError={(e) => {
        e.target.src = defaultBanner;
      }}
    />

    <span className="read-time">
      📘 Notes
    </span>

  </div>
</a>

              {/* Content */}

              <div className="resource-content">

                <span className="resource-badge">
                  {note.branch || "Notes"}
                </span>

                <h3>{note.title}</h3>

                <p>
                  {note.description ||
                    "Academic study material for students."}
                </p>

               <div className="resource-footer">

  <span>
    📚 {note.subject || "Subject"}
  </span>

  <span>
    🎓 {note.semester}
  </span>

  <span>
    📅 {formatDate(note.createdAt)}
  </span>

</div>
            <div className="resource-stats">

  <span>👁 {note.views || 0} Views</span>

  <span>⬇ {note.downloads || 0} Downloads</span>

 <button
  className="like-button"
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
      console.error(error);
    }
  }}
>
  ❤️ {note.likes || 0}
</button>

</div>

                <div className="resource-buttons">

     <a
  href={getPdfUrl(note.pdfUrl)}
  target="_blank"
  rel="noopener noreferrer"
  className="view-pdf-button"
  onClick={async (e) => {
    e.preventDefault();

    try {
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

      window.open(getPdfUrl(note.pdfUrl), "_blank");
    } catch (error) {
      console.error(error);
    }
  }}
>
  View PDF
</a>

                  <button
                    type="button"
                    className="download-pdf-button"
                    onClick={() =>
                      handleDownload(note)
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