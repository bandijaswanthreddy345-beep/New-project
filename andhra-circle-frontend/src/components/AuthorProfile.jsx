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

  // Automatically advance developers every 3 seconds
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveDeveloper((current) => (current + 1) % developers.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

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
          </div>

          <div className="jntu-upload-card">
            <div className="jntu-upload-header">
              <h3 className="text-base font-bold text-[#F5F5FA] mb-2">Upload Study Materials</h3>
            </div>

            <p className="jntu-upload-copy text-xs text-[#94A3B8] leading-relaxed mb-4">
              JNTU Circle grows with the help of students who share their notes,
              question papers, and study materials. If you have clear, useful
              notes, upload them and support thousands of fellow engineers.
            </p>

            {/* Stitch Dashed Dropzone Box */}
            <div
              onClick={() => setIsUploadModalOpen(true)}
              className="border border-dashed border-[#8B5CF6]/40 hover:border-[#8B5CF6] rounded-2xl p-4 mb-4 text-center cursor-pointer bg-[#08090D]/50 hover:bg-[#8B5CF6]/5 transition-all flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-[#161724] border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
                <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              </div>
              <span className="text-xs font-semibold text-[#F5F5FA]">Drop PDF, DOCX or scanned sheets</span>
              <span className="text-[10px] text-[#64748B]">or browse files from device</span>
            </div>

            {/* Stitch Solid Purple Gradient Upload Button */}
            <button
              type="button"
              className="jntu-upload-cta-btn"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <span>Upload Materials</span>
              <span aria-hidden="true">↑</span>
            </button>

            <div className="pt-3 mt-3 border-t border-[#292733] flex items-center gap-2 text-[11px] text-[#64748B]">
              <span>Your verified submissions earn community contributor credits and badge recognition.</span>
            </div>
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
              Upload notes, papers, syllabus, or lab programs in PDF format only.
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
                  <span className="material-symbols-outlined text-[16px]">person</span>
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
                  <span className="material-symbols-outlined text-[16px]">person</span>
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
