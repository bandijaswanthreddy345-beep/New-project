import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "./UploadMaterials.css";

export default function UploadMaterials() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });
  const [uploadForm, setUploadForm] = useState({
    materialType: "",
    comment: "",
    name: "",
    email: "",
  });

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
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

      setUploadForm({
        materialType: "",
        comment: "",
        name: "",
        email: "",
      });
      setSelectedFile(null);

      window.setTimeout(() => {
        handleClose();
      }, 1000);
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
    <div
      className="upload-modal-overlay upload-page-overlay"
      onClick={handleClose}
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
          onClick={handleClose}
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
            <button
              type="submit"
              className="upload-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Uploading..." : "Submit Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
