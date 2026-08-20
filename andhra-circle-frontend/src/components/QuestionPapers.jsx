import { useEffect, useState } from "react";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";

function QuestionPapers({ search = "" }) {
const [papers, setPapers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// ==========================================
// FETCH QUESTION PAPERS
// ==========================================

useEffect(() => {
fetchPapers();
}, []);

const fetchPapers = async () => {
try {
setLoading(true);
setError("");


  const response = await API.get("/papers");

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  setPapers(data);
} catch (err) {
  console.error(
    "Fetch Question Papers Error:",
    err
  );

  setError(
    err.response?.data?.message ||
      "Unable to load question papers."
  );

  setPapers([]);
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

const filteredPapers = papers.filter((paper) => {
if (!searchText) {
return true;
}


return (
  String(paper.title || "")
    .toLowerCase()
    .includes(searchText) ||
  String(paper.branch || "")
    .toLowerCase()
    .includes(searchText) ||
  String(paper.semester || "")
    .toLowerCase()
    .includes(searchText) ||
  String(paper.year || "")
    .toLowerCase()
    .includes(searchText) ||
  String(paper.examType || "")
    .toLowerCase()
    .includes(searchText) ||
  String(paper.subject || "")
    .toLowerCase()
    .includes(searchText) ||
  String(paper.subjectCode || "")
    .toLowerCase()
    .includes(searchText)
);


});

// ==========================================
// GET PDF URL
// ==========================================

const getPdfUrl = (pdfUrl) => {
if (!pdfUrl) {
return "";
}


if (
  pdfUrl.startsWith("http://") ||
  pdfUrl.startsWith("https://")
) {
  return pdfUrl;
}

return `http://localhost:5000${pdfUrl}`;


};
const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// DOWNLOAD PDF
// ==========================================

const handleDownload = async (paper) => {
  try {
    await API.put(`/papers/${paper._id}/download`);

    setPapers((prev) =>
      prev.map((item) =>
        item._id === paper._id
          ? {
              ...item,
              downloads: (item.downloads || 0) + 1,
            }
          : item
      )
    );

    const response = await fetch(getPdfUrl(paper.pdfUrl));

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${paper.title}.pdf`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
  }
};

// ==========================================
// LOADING UI
// ==========================================

if (loading) {
return ( <section className="papers-section"> <div className="section-heading"> <span className="section-tag">
EXAM RESOURCES </span>


      <h2>
        Previous Question Papers
      </h2>

      <p>
        Practice with previous examination
        question papers.
      </p>
    </div>

    <div className="papers-loading">
      Loading question papers...
    </div>
  </section>
);


}

// ==========================================
// ERROR UI
// ==========================================

if (error) {
return ( <section className="papers-section"> <div className="section-heading"> <span className="section-tag">
EXAM RESOURCES </span>


      <h2>
        Previous Question Papers
      </h2>

      <p>
        Practice with previous examination
        question papers.
      </p>
    </div>

    <div className="error-state">
      <span>⚠️</span>

      <h3>
        Unable to Load Question Papers
      </h3>

      <p>
        {error}
      </p>

      <button
        type="button"
        onClick={fetchPapers}
      >
        Try Again
      </button>
    </div>
  </section>
);


}

// ==========================================
// MAIN UI
// ==========================================

return ( <section className="papers-section"> <div className="section-heading"> <span className="section-tag">
EXAM RESOURCES </span>


    <h2>
      Previous Question Papers
    </h2>

   
  </div>

  {filteredPapers.length === 0 ? (
    <div className="empty-state">
      <span>📄</span>

      <h3>
        {searchText
          ? `No question papers found for "${search}"`
          : "No question papers available"}
      </h3>

      <p>
        Try searching with another keyword
        or check again later.
      </p>
    </div>
  ) : (
    <div className="papers-grid">
  {filteredPapers.map((paper) => (
    <article
      className="resource-card"
      key={paper._id}
    >
      <div className="resource-image">
        <img
          src={defaultBanner}
          alt={paper.title}
        />

        <span className="read-time">
          {paper.examType || "Semester"}
        </span>
      </div>

      <div className="resource-content">
        <span className="resource-badge">
          {paper.branch}
        </span>

        <h3>{paper.title}</h3>

        <p>
          Previous examination question paper.
        </p>

        <div className="resource-footer">
          <span>
            📚 {paper.subject}
          </span>

          <span>
            🎓 {paper.semester}
          </span>

          <span>
            📅 {formatDate(paper.createdAt)}
          </span>
        </div>

        <div className="resource-stats">
          <span>
            👁 {paper.views || 0} Views
          </span>

          <span>
            ⬇ {paper.downloads || 0} Downloads
          </span>

          <button
  className="like-button"
  onClick={async () => {
    try {
      await API.put(`/papers/${paper._id}/like`);

      setPapers((prev) =>
        prev.map((item) =>
          item._id === paper._id
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
  ❤️ {paper.likes || 0}
</button>
        </div>

        <div className="resource-buttons">
          <a
  href={getPdfUrl(paper.pdfUrl)}
  className="view-pdf-button"
  onClick={async (e) => {
    e.preventDefault();

    try {
      await API.put(`/papers/${paper._id}/view`);

      setPapers((prev) =>
        prev.map((item) =>
          item._id === paper._id
            ? {
                ...item,
                views: (item.views || 0) + 1,
              }
            : item
        )
      );

      window.open(
        getPdfUrl(paper.pdfUrl),
        "_blank"
      );
    } catch (error) {
      console.error(error);
    }
  }}
>
  View PDF
</a>

          <button
            className="download-pdf-button"
            onClick={() =>
              handleDownload(paper)
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

export default QuestionPapers;
