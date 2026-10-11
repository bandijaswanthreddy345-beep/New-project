import { useEffect, useState } from "react";
import API from "../api/api";
import "./AuthorProfile.css";
import bharathProfile from "../assets/bharath-profile.png";
import jaswanthProfile from "../assets/jaswanth.png.png";
import nagaSaiProfile from "../assets/naga-sai-profile.png";
import vamsiKumarProfile from "../assets/vamsi-kumar-profile.png";

const developers = [
  {
    name: "Bandi Jaswanth Reddy",
    image: jaswanthProfile,
    title: "PLATFORM CREATOR",
    role: "Backend Developer · AIML Student",
  },
  {
    name: "Naga Sai",
    image: nagaSaiProfile,
    title: "DEVELOPER",
    role: "Frontend Developer · AIML Student",
  },
  {
    name: "Bandi Bharath",
    image: bharathProfile,
    title: "DEVELOPER",
    role: "Frontend Developer · AIML Student",
  },
  {
    name: "Vamsi Kumar",
    image: vamsiKumarProfile,
    title: "DEVELOPER",
    role: "Application Developer · AIML Student",
  },
];

function AuthorProfile() {
  const [activeDeveloper, setActiveDeveloper] = useState(0);
  const [isPlaying, setIsPlaying] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    materialType: "",
    comment: "",
    name: "",
    email: "",
  });
  const developer = developers[activeDeveloper];

  useEffect(() => {
    if (!isPlaying) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveDeveloper((current) => (current + 1) % developers.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [isPlaying]);

  useEffect(() => {
    if (!isUploadModalOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsUploadModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isUploadModalOpen]);

  const resetUploadForm = () => {
    setUploadForm({
      materialType: "",
      comment: "",
      name: "",
      email: "",
    });
    setSelectedFile(null);
  };

  const handleUploadFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "materialType") {
      setSelectedFile(null);
    }

    setUploadForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (file && (file.type !== "application/pdf" || file.size > 20 * 1024 * 1024)) {
      setSelectedFile(null);
      event.target.value = "";
      setSubmitMessage({
        type: "error",
        text:
          file.type !== "application/pdf"
            ? "Please choose a PDF file."
            : "The PDF file must be 20 MB or smaller.",
      });
      return;
    }

    setSelectedFile(file);
    setSubmitMessage({ type: "", text: "" });
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();

    const { materialType, comment, name, email } = uploadForm;

    if (!materialType || !name.trim() || !email.trim()) {
      setSubmitMessage({
        type: "error",
        text: "Please select a material type and fill in your name and email.",
      });
      return;
    }

    if (materialType === "notes" && !selectedFile) {
      setSubmitMessage({
        type: "error",
        text: "Please attach the PDF notes you want to upload.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitMessage({ type: "", text: "" });

      const formData = new FormData();
      formData.append("materialType", materialType);
      formData.append("comment", comment.trim());
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await API.post("/user-materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitMessage({
        type: "success",
        text: "Your material submission has been saved successfully.",
      });
      resetUploadForm();

      window.setTimeout(() => {
        setIsUploadModalOpen(false);
      }, 900);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Unable to submit your material right now.";

      setSubmitMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="author-section" aria-labelledby="developers-heading">
        <div className="author-section-heading">
          <span className="section-tag">THE TEAM</span>
          <h2 id="developers-heading">Developers</h2>
        </div>

        <div className="team-card">
          <blockquote className="team-quote">
            <span className="team-quote-mark" aria-hidden="true">
              “
            </span>
            <p>
              JNTU Circle brings notes, previous papers, syllabus, and
              notifications together—making essential learning resources easier
              for every student to access.
            </p>
            <cite>Our vision for JNTU Circle</cite>
          </blockquote>

          <div
            className="developer-slide"
            key={developer.name}
            aria-live="off"
            aria-atomic="true"
          >
            <div
              className={`developer-slide-image ${
                developer.title === "PLATFORM CREATOR"
                  ? "developer-slide-image--creator"
                  : "developer-slide-image--dev"
              }`}
            >
              <img src={developer.image} alt="" />
            </div>
            <div className="developer-slide-copy">
              <span
                className={`author-role-tag ${
                  developer.title === "PLATFORM CREATOR"
                    ? "author-role-tag--creator"
                    : "author-role-tag--dev"
                }`}
              >
                <span className="author-role-bullet" aria-hidden="true">
                  {developer.title === "PLATFORM CREATOR" ? "★" : "✦"}
                </span>
                {developer.title}
              </span>
              <h3>{developer.name}</h3>
              <p>{developer.role}</p>
            </div>
          </div>

          <div className="developer-carousel-controls">
            <div className="developer-carousel-dots" aria-label="Choose developer">
              {developers.map((item, index) => (
                <button
                  aria-label={`Show ${item.name}`}
                  aria-pressed={activeDeveloper === index}
                  className={`developer-carousel-dot${activeDeveloper === index ? " is-active" : ""}`}
                  key={item.name}
                  onClick={() => setActiveDeveloper(index)}
                  type="button"
                />
              ))}
            </div>
            <button
              className="developer-carousel-toggle"
              onClick={() => setIsPlaying((playing) => !playing)}
              type="button"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
          </div>

          <div className="jntu-upload-card">
            <div className="jntu-upload-header">
              <h3>Upload Study Materials</h3>
            </div>

            <p className="jntu-upload-copy">
              JNTU Circle grows with the help of students who share their notes,
              question papers, and study materials. If you have clear, useful
              notes, you can upload them and support thousands of JNTU students.
            </p>

            <button
              type="button"
              className="jntu-upload-button"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload Materials <span aria-hidden="true">↑</span>
            </button>

            <p className="jntu-upload-footnote">
              Your notes can help others learn better and make JNTU Circle a
              stronger community resource.
            </p>
          </div>
        </div>
      </section>

      {isUploadModalOpen && (
        <div
          className="upload-modal-overlay"
          onClick={() => setIsUploadModalOpen(false)}
          role="presentation"
        >
          <div
            className="upload-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-materials-title"
          >
            <button
              type="button"
              className="upload-modal-close"
              onClick={() => setIsUploadModalOpen(false)}
              aria-label="Close upload form"
            >
              ×
            </button>

            <h2 id="upload-materials-title">Upload Materials</h2>
            <p className="upload-modal-subtitle">
              Upload notes, papers, syllabus, or reports in PDF format only.
            </p>

            <form className="upload-material-form" onSubmit={handleUploadSubmit}>
              <label className="upload-field-label" htmlFor="material-type">
                Material Type <span>*</span>
              </label>
              <div className="upload-select-wrap">
                <select
                  id="material-type"
                  name="materialType"
                  value={uploadForm.materialType}
                  onChange={handleUploadFormChange}
                  className="upload-select"
                  required
                >
                  <option value="" disabled>
                    Select Material Type
                  </option>
                  <option value="notes">Notes</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="question-papers">Question Papers or Solutions</option>
                  <option value="academic-report">Academic Report</option>
                  <option value="lab-manual">Lab Manual</option>
                </select>
              </div>

              {uploadForm.materialType === "notes" && (
                <div className="upload-file-field">
                  <label className="upload-field-label" htmlFor="notes-file">
                    Notes PDF <span>*</span>
                  </label>
                  <input
                    id="notes-file"
                    name="file"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    required
                  />
                  <span className="upload-file-hint">
                    PDF only, up to 20 MB.
                    {selectedFile ? ` Selected: ${selectedFile.name}` : ""}
                  </span>
                </div>
              )}

              <div className="upload-comment-box">
                <div className="upload-avatar" aria-hidden="true">
                  👤
                </div>
                <textarea
                  name="comment"
                  placeholder="Your Comment"
                  rows={4}
                  className="upload-comment-input"
                  value={uploadForm.comment}
                  onChange={handleUploadFormChange}
                />
              </div>

              <div className="upload-input-row">
                <span className="upload-input-icon" aria-hidden="true">
                  👤
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your Name*"
                  value={uploadForm.name}
                  onChange={handleUploadFormChange}
                  required
                />
              </div>

              <div className="upload-input-row">
                <span className="upload-input-icon" aria-hidden="true">
                  @
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your Email*"
                  value={uploadForm.email}
                  onChange={handleUploadFormChange}
                  required
                />
              </div>

              {submitMessage.text && (
                <div
                  className={`upload-form-message ${submitMessage.type === "error" ? "error" : "success"}`}
                >
                  {submitMessage.text}
                </div>
              )}

              <div className="upload-submit-row">
                <button type="submit" className="upload-submit-button" disabled={isSubmitting}>
                  {isSubmitting ? "Uploading..." : "Submit Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AuthorProfile;
