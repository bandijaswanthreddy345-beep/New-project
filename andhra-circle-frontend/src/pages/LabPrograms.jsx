import { useEffect, useState } from "react";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";

function LabPrograms({ search = "" }) {
  const [labPrograms, setLabPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingPdf, setOpeningPdf] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  // =========================================================
  // FETCH LAB PROGRAMS
  // =========================================================

  useEffect(() => {
    fetchLabPrograms();
  }, []);

  const fetchLabPrograms = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/lab-programs");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setLabPrograms(data);
    } catch (err) {
      console.error("Lab Program Fetch Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load lab programs."
      );

      setLabPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const searchText = String(search || "")
    .trim()
    .toLowerCase();

  const filteredPrograms = labPrograms.filter((program) => {
    if (!searchText) {
      return true;
    }

    return (
      String(program.title || "")
        .toLowerCase()
        .includes(searchText) ||
      String(program.subject || "")
        .toLowerCase()
        .includes(searchText) ||
      String(program.subjectCode || "")
        .toLowerCase()
        .includes(searchText) ||
      String(program.branch || "")
        .toLowerCase()
        .includes(searchText) ||
      String(program.semester || "")
        .toLowerCase()
        .includes(searchText) ||
      String(program.description || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // =========================================================
  // BACKEND BASE URL
  // =========================================================

  const getBackendBaseUrl = () => {
    /*
      Example API baseURL:
      http://localhost:5000/api

      Static uploaded files should be:
      http://localhost:5000/uploads/filename.pdf

      Therefore we remove /api from the end.
    */

    const apiBaseUrl =
      API.defaults?.baseURL ||
      "http://localhost:5000/api";

    return apiBaseUrl
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");
  };

  // =========================================================
  // BUILD CORRECT PDF URL
  // =========================================================

  const getPdfUrl = (pdfUrl) => {
    if (!pdfUrl) {
      return "";
    }

    let value = String(pdfUrl).trim();

    // ---------------------------------------------------------
    // COMPLETE URL
    // ---------------------------------------------------------

    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      try {
        const url = new URL(value);

        /*
          Fix:
          /api/uploads/file.pdf
                ↓
          /uploads/file.pdf
        */

        url.pathname = url.pathname.replace(
          /^\/api\/uploads\//,
          "/uploads/"
        );

        return url.toString();
      } catch {
        return value;
      }
    }

    // ---------------------------------------------------------
    // RELATIVE URL
    // ---------------------------------------------------------

    /*
      Possible database values:

      /uploads/file.pdf
      uploads/file.pdf
      /api/uploads/file.pdf
      api/uploads/file.pdf

      Convert all of them to:

      /uploads/file.pdf
    */

    value = value.replace(
      /^\/?api\/uploads\//,
      "/uploads/"
    );

    if (!value.startsWith("/")) {
      value = `/${value}`;
    }

    const backendBaseUrl = getBackendBaseUrl();

    return `${backendBaseUrl}${value}`;
  };

  // =========================================================
  // VIEW PDF
  // =========================================================

  const handleViewPdf = (program) => {
    if (!program.pdfUrl) {
      alert("PDF file is not available.");
      return;
    }

    try {
      setOpeningPdf(program._id);

      const finalUrl = getPdfUrl(program.pdfUrl);

      console.log("Original PDF URL:", program.pdfUrl);
      console.log("Opening PDF from:", finalUrl);

      if (!finalUrl) {
        throw new Error("Invalid PDF URL");
      }

      /*
        Open the real static file directly.

        IMPORTANT:
        We are NOT using API.get() here because API.get()
        would add /api before /uploads.
      */

      const pdfWindow = window.open(
        finalUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!pdfWindow) {
        alert(
          "Popup was blocked. Please allow popups for this website."
        );
      }
    } catch (err) {
      console.error("View PDF Error:", err);

      alert(
        "Unable to open the PDF. Please check that the PDF file exists."
      );
    } finally {
      setOpeningPdf(null);
    }
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const handleDownload = async (program) => {
    if (!program.pdfUrl) {
      alert("PDF file is not available.");
      return;
    }

    try {
      setDownloadingPdf(program._id);

      const finalUrl = getPdfUrl(program.pdfUrl);

      console.log("Downloading PDF from:", finalUrl);

      const response = await fetch(finalUrl);

      if (!response.ok) {
        throw new Error(
          `PDF request failed: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error("PDF file is empty.");
      }

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const fileName = `${
        program.title || "lab-program"
      }-lab-program.pdf`
        .replace(/[^a-z0-9.-]/gi, "_")
        .toLowerCase();

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      console.error(
        "Lab Program Download Error:",
        err
      );

      alert(
        "Unable to download the PDF. Please check that the PDF file exists on the server."
      );
    } finally {
      setDownloadingPdf(null);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <section className="papers-section">
        <div className="section-heading">
          <span className="section-tag">
            LAB RESOURCES
          </span>

          <h2>Lab Programs</h2>
        </div>

        <div className="papers-loading">
          Loading lab programs...
        </div>
      </section>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <section className="papers-section">
        <div className="section-heading">
          <span className="section-tag">
            LAB RESOURCES
          </span>

          <h2>Lab Programs</h2>
        </div>

        <div className="error-state">
          <h3>Unable to Load Lab Programs</h3>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchLabPrograms}
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <section className="papers-section">
      {/* =====================================================
          SECTION HEADING
      ====================================================== */}

      <div className="section-heading">
        <span className="section-tag">
          LAB RESOURCES
        </span>

        <h2>Lab Programs</h2>
      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {filteredPrograms.length === 0 ? (
        <div className="empty-state">
          <h3>
            {searchText
              ? `No lab programs found for "${search}"`
              : "No lab programs available"}
          </h3>

          <p>
            Try searching with another keyword or check
            again later.
          </p>
        </div>
      ) : (
        /* ===================================================
           PROGRAM GRID
        ==================================================== */

        <div className="papers-grid">
          {filteredPrograms.map((program) => (
            <article
              className="resource-card"
              key={program._id}
            >
              {/* =============================================
                  IMAGE
              ============================================== */}

              <div className="resource-image">
                <img
                  src={defaultBanner}
                  alt={
                    program.title ||
                    "Lab Program"
                  }
                />

                <span className="read-time">
                  Lab Program
                </span>
              </div>

              {/* =============================================
                  CONTENT
              ============================================== */}

              <div className="resource-content">
                {/* BRANCH */}

                {program.branch && (
                  <span className="resource-badge">
                    {program.branch}
                  </span>
                )}

                {/* TITLE */}

                <h3>
                  {program.title ||
                    "Untitled Lab Program"}
                </h3>

                {/* DESCRIPTION */}

                <p>
                  {program.description ||
                    "Laboratory program and practical study material."}
                </p>

                {/* DETAILS */}

                <div className="resource-footer">
                  {program.subject && (
                    <span>
                      Subject: {program.subject}
                    </span>
                  )}

                  {program.semester && (
                    <span>
                      Semester: {program.semester}
                    </span>
                  )}

                  {program.createdAt && (
                    <span>
                      {formatDate(
                        program.createdAt
                      )}
                    </span>
                  )}
                </div>

                {/* SUBJECT CODE */}

                {program.subjectCode && (
                  <div className="lab-subject-code">
                    <span>Subject Code</span>

                    <strong>
                      {program.subjectCode}
                    </strong>
                  </div>
                )}

                {/* RESOURCE INFO */}

                <div className="resource-stats">
                  <span>PDF Resource</span>

                  <span>Practical</span>
                </div>

                {/* BUTTONS */}

                <div className="resource-buttons">
                  {program.pdfUrl ? (
                    <>
                      <button
                        type="button"
                        className="view-pdf-button"
                        disabled={
                          openingPdf === program._id
                        }
                        onClick={() =>
                          handleViewPdf(program)
                        }
                      >
                        {openingPdf === program._id
                          ? "Opening..."
                          : "View PDF"}
                      </button>

                      <button
                        type="button"
                        className="download-pdf-button"
                        disabled={
                          downloadingPdf === program._id
                        }
                        onClick={() =>
                          handleDownload(program)
                        }
                      >
                        {downloadingPdf === program._id
                          ? "Downloading..."
                          : "Download"}
                      </button>
                    </>
                  ) : (
                    <div className="pdf-not-available">
                      PDF not available
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default LabPrograms;