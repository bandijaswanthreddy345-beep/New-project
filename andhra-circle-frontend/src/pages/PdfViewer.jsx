import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import "./PdfViewer.css";

function PdfViewer() {
  const { fileName } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const BACKEND_URL = "http://localhost:5000";
  const customUrl = searchParams.get("url");
  const customTitle = searchParams.get("title");
  const source = searchParams.get("source");
  const noteId = searchParams.get("noteId");

  // Determine display document title
  const displayTitle = useMemo(() => {
    if (customTitle) return customTitle;
    if (fileName && fileName !== "circular.pdf" && fileName !== "document.pdf") {
      return decodeURIComponent(fileName).replace(/[-_]/g, " ");
    }
    return "Official Circular / Examination Document";
  }, [customTitle, fileName]);

  // Determine raw URL
  const rawPdfUrl = useMemo(() => {
    if (customUrl) return customUrl;
    if (fileName) {
      if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
        return fileName;
      }
      return `${BACKEND_URL}/uploads/${fileName}`;
    }
    return "";
  }, [customUrl, fileName]);

  // Stream directly via backend proxy so Chrome renders its native full-height PDF reader
  const embedUrl = useMemo(() => {
    if (!rawPdfUrl) return "";

    // Direct proxy streaming gives 100% full-screen Chrome PDF reader with zero letterboxing
    if (rawPdfUrl.startsWith("http") && !rawPdfUrl.includes("localhost:5000/api")) {
      return `${BACKEND_URL}/api/notifications/proxy-pdf?url=${encodeURIComponent(rawPdfUrl)}`;
    }

    return rawPdfUrl;
  }, [rawPdfUrl]);

  // Back navigation returning safely to project/notifications
  const handleBack = () => {
    if (source === "notifications") {
      navigate("/notifications");
      return;
    }
    if (source === "question-papers") {
      navigate("/question-papers");
      return;
    }
    if (source === "syllabus") {
      navigate("/syllabus");
      return;
    }
    if (source === "lab-programs") {
      navigate("/lab-programs");
      return;
    }
    if (source === "notes") {
      navigate("/notes");
      return;
    }
    if (noteId) {
      navigate(`/notes/${encodeURIComponent(noteId)}`);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  // Download PDF handler
  const handleDownload = async () => {
    if (!rawPdfUrl) return;

    try {
      setDownloading(true);

      const downloadName = customTitle
        ? `${customTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50)}.pdf`
        : fileName || "document.pdf";

      // 1. Try direct fetch blob download
      try {
        const streamUrl = rawPdfUrl.startsWith("http") && !rawPdfUrl.includes("localhost:5000/api")
          ? `${BACKEND_URL}/api/notifications/proxy-pdf?url=${encodeURIComponent(rawPdfUrl)}`
          : rawPdfUrl;

        const response = await fetch(streamUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);

          setToastMessage("File downloaded! You are in JNTU Circle project.");
          setTimeout(() => setToastMessage(""), 3500);
          return;
        }
      } catch (err) {
        console.warn("Direct blob download failed, falling back to anchor:", err);
      }

      // 2. Direct anchor download fallback
      const link = document.createElement("a");
      link.href = rawPdfUrl;
      link.download = downloadName;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToastMessage("Download started! You remain safely in the project.");
      setTimeout(() => setToastMessage(""), 3500);
    } catch (error) {
      console.error("PDF DOWNLOAD ERROR:", error);
      alert("Unable to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="pdf-viewer-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="pdf-floating-toast">
          <span className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================
          EXECUTIVE FOREST GREEN HEADER (MATCHING CHATBOT / PROFILE)
          Left: Anchored Brand Logo & Title (Clean, NO back button)
          Right: Rotate + Mode Toggle + Download + Close (✕)
          ========================================================= */}
      <header className="pdf-viewer-header">
        <div className="pdf-header-left">
          {/* Anchored Brand Logo & Title (Clicking returns to Project) */}
          <div
            className="pdf-brand-anchor"
            onClick={handleBack}
            title="Return to JNTU Circle"
          >
            <img
              src="/jntu-circle-logo.png"
              alt="JNTU Circle"
              className="pdf-brand-logo"
            />
            <div className="pdf-brand-info">
              <span className="pdf-brand-title">
                <span className="font-deltha">JNTU</span> Circle
              </span>
              <span className="pdf-doc-title" title={displayTitle}>
                {displayTitle}
              </span>
            </div>
          </div>
        </div>

        <div className="pdf-header-right">
          {/* Download PDF Button */}
          <button
            type="button"
            className="pdf-download-button"
            onClick={handleDownload}
            disabled={downloading}
            title="Download PDF Document"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{downloading ? "Downloading..." : "Download PDF"}</span>
          </button>

          {/* Close / Return Button (✕) */}
          <button
            type="button"
            className="pdf-close-btn"
            onClick={handleBack}
            title="Close and Return to Project"
            aria-label="Close and Return to Project"
          >
            ✕
          </button>
        </div>
      </header>

      {/* =========================================================
          FULL-SCREEN IN-PAGE VIEWER (EDGE-TO-EDGE, NO BLACK MARGINS)
          ========================================================= */}
      <main className="pdf-viewer-main">
        <div className="pdf-viewer-container">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={displayTitle}
              className="pdf-frame"
              allow="autoplay; encrypted-media; fullscreen"
            />
          ) : (
            <div className="pdf-viewer-empty-state">
              <h3>Document Not Available</h3>
              <p>No valid PDF attachment was found for this circular.</p>
              <button
                type="button"
                className="pdf-download-button"
                onClick={handleBack}
              >
                ← Return to Project
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PdfViewer;