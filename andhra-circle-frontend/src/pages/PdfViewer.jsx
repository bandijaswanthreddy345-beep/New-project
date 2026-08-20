import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import "./PdfViewer.css";

function PdfViewer() {
  const { fileName } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [downloading, setDownloading] = useState(false);

  const BACKEND_URL = "http://localhost:5000";

  const pdfUrl = `${BACKEND_URL}/uploads/${fileName}`;

  const noteId = searchParams.get("noteId");

  // =========================================================
  // BACK TO NOTES
  // =========================================================

  const handleBack = () => {
    if (noteId) {
      navigate(`/notes/${encodeURIComponent(noteId)}`);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/notes");
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const handleDownload = async () => {
    if (!fileName) {
      return;
    }

    try {
      setDownloading(true);

      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("PDF DOWNLOAD ERROR:", error);

      alert("Unable to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="pdf-viewer-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="pdf-viewer-header">

        {/* LEFT - BACK */}

        <button
          type="button"
          className="pdf-back-button"
          onClick={handleBack}
        >
          <span className="pdf-back-icon">
            ←
          </span>

          <span>
            Back to Notes
          </span>
        </button>

        {/* RIGHT - DOWNLOAD */}

        <button
          type="button"
          className="pdf-download-button"
          onClick={handleDownload}
          disabled={downloading}
        >
          <span>
            {downloading ? "⏳" : "↓"}
          </span>

          <span>
            {downloading
              ? "Downloading..."
              : "Download PDF"}
          </span>
        </button>

      </header>

      {/* =====================================================
          PDF VIEWER
      ====================================================== */}

      <main className="pdf-viewer-main">

        <div className="pdf-viewer-container">

          <iframe
            src={pdfUrl}
            title="PDF Viewer"
            className="pdf-frame"
          />

        </div>

      </main>

    </div>
  );
}

export default PdfViewer;