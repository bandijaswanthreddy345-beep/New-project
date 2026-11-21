import { useState } from "react";
import API from "../api/api";
import "./UploadNote.css";

function UploadNote() {
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("Bandi Bharath");

  // =========================================================
  // STANDARD MATERIAL (MATERIAL 1)
  // =========================================================
  const [pdf, setPdf] = useState(null); // Complete notes PDF

  const [module1, setModule1] = useState("");
  const [module2, setModule2] = useState("");
  const [module3, setModule3] = useState("");
  const [module4, setModule4] = useState("");
  const [module5, setModule5] = useState("");

  const [module1Pdf, setModule1Pdf] = useState(null);
  const [module2Pdf, setModule2Pdf] = useState(null);
  const [module3Pdf, setModule3Pdf] = useState(null);
  const [module4Pdf, setModule4Pdf] = useState(null);
  const [module5Pdf, setModule5Pdf] = useState(null);

  // =========================================================
  // HANDWRITTEN NOTES SECTION (MATERIAL 2 - OPTIONAL)
  // =========================================================
  const [hasHandwritten, setHasHandwritten] = useState(false);
  const [handwrittenCredits, setHandwrittenCredits] = useState("");
  const [handwrittenPdf, setHandwrittenPdf] = useState(null);

  const [handwrittenModule1Pdf, setHandwrittenModule1Pdf] = useState(null);
  const [handwrittenModule2Pdf, setHandwrittenModule2Pdf] = useState(null);
  const [handwrittenModule3Pdf, setHandwrittenModule3Pdf] = useState(null);
  const [handwrittenModule4Pdf, setHandwrittenModule4Pdf] = useState(null);
  const [handwrittenModule5Pdf, setHandwrittenModule5Pdf] = useState(null);

  const [loading, setLoading] = useState(false);

  // =========================================================
  // SUBMIT NOTE
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // Basic details
    formData.append("title", title);
    formData.append("branch", branch);
    formData.append("semester", semester);
    formData.append("subject", subject);
    formData.append("subjectCode", subjectCode);
    formData.append("description", description);
    formData.append("credits", credits);

    // Standard complete PDF
    if (pdf) {
      formData.append("pdf", pdf);
    }

    // Standard unit content & PDFs
    formData.append("module1", module1);
    formData.append("module2", module2);
    formData.append("module3", module3);
    formData.append("module4", module4);
    formData.append("module5", module5);

    if (module1Pdf) formData.append("module1Pdf", module1Pdf);
    if (module2Pdf) formData.append("module2Pdf", module2Pdf);
    if (module3Pdf) formData.append("module3Pdf", module3Pdf);
    if (module4Pdf) formData.append("module4Pdf", module4Pdf);
    if (module5Pdf) formData.append("module5Pdf", module5Pdf);

    // Handwritten Notes (Material 2)
    if (hasHandwritten) {
      formData.append("hasHandwritten", "true");
      formData.append("handwrittenCredits", handwrittenCredits);

      if (handwrittenPdf) formData.append("handwrittenPdf", handwrittenPdf);
      if (handwrittenModule1Pdf) formData.append("handwrittenModule1Pdf", handwrittenModule1Pdf);
      if (handwrittenModule2Pdf) formData.append("handwrittenModule2Pdf", handwrittenModule2Pdf);
      if (handwrittenModule3Pdf) formData.append("handwrittenModule3Pdf", handwrittenModule3Pdf);
      if (handwrittenModule4Pdf) formData.append("handwrittenModule4Pdf", handwrittenModule4Pdf);
      if (handwrittenModule5Pdf) formData.append("handwrittenModule5Pdf", handwrittenModule5Pdf);
    }

    try {
      setLoading(true);

      await API.post("/notes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Note uploaded successfully with both material sets!");

      // Reset
      setTitle("");
      setBranch("");
      setSemester("");
      setSubject("");
      setSubjectCode("");
      setDescription("");
      setCredits("Bandi Bharath");

      setPdf(null);
      setModule1("");
      setModule2("");
      setModule3("");
      setModule4("");
      setModule5("");
      setModule1Pdf(null);
      setModule2Pdf(null);
      setModule3Pdf(null);
      setModule4Pdf(null);
      setModule5Pdf(null);

      setHasHandwritten(false);
      setHandwrittenCredits("");
      setHandwrittenPdf(null);
      setHandwrittenModule1Pdf(null);
      setHandwrittenModule2Pdf(null);
      setHandwrittenModule3Pdf(null);
      setHandwrittenModule4Pdf(null);
      setHandwrittenModule5Pdf(null);

      e.target.reset();
    } catch (error) {
      console.error("Upload Note Error:", error);
      alert(error.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-note-card">
      <h1>Upload Study Material & Notes</h1>
      <p className="upload-note-subtitle">
        Add curriculum subject notes, with support for both Standard Lecture Notes and Handwritten Notes.
      </p>

      <form onSubmit={handleSubmit}>
        {/* ==================================================
            BASIC DETAILS
        ================================================== */}
        <div className="upload-section-divider">
          <h2>
            <span>📋</span> Subject Details
          </h2>
        </div>

        <div className="upload-field-group">
          <label>Note Title *</label>
          <input
            type="text"
            placeholder="e.g. Engineering Graphics"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="upload-grid-row">
          <div className="upload-field-group">
            <label>Branch *</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            >
              <option value="">Select Branch</option>
              <option value="Computer Science Engineering">Computer Science Engineering</option>
              <option value="Information Science Engineering">Information Science Engineering</option>
              <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
              <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
            </select>
          </div>

          <div className="upload-field-group">
            <label>Semester *</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            >
              <option value="">Select Semester</option>
              <option value="1st Semester">1st Semester (1-1)</option>
              <option value="2nd Semester">2nd Semester (1-2)</option>
              <option value="3rd Semester">3rd Semester (2-1)</option>
              <option value="4th Semester">4th Semester (2-2)</option>
              <option value="5th Semester">5th Semester (3-1)</option>
              <option value="6th Semester">6th Semester (3-2)</option>
              <option value="7th Semester">7th Semester (4-1)</option>
              <option value="8th Semester">8th Semester (4-2)</option>
            </select>
          </div>
        </div>

        <div className="upload-grid-row">
          <div className="upload-field-group">
            <label>Subject Name *</label>
            <input
              type="text"
              placeholder="e.g. Engineering Graphics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="upload-field-group">
            <label>Subject Code</label>
            <input
              type="text"
              placeholder="e.g. 23A03101T"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
            />
          </div>
        </div>

        <div className="upload-field-group">
          <label>Course Credits / Prepared By</label>
          <input
            type="text"
            placeholder="e.g. Bandi Bharath (or Credits: 3)"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
          />
        </div>

        <div className="upload-field-group">
          <label>Subject Description</label>
          <textarea
            rows="3"
            placeholder="Brief overview of the subject curriculum..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* ==================================================
            STANDARD NOTES (MATERIAL 1)
        ================================================== */}
        <div className="upload-section-divider">
          <h2>
            <span>📄</span> Standard Notes
            <span className="upload-badge-pill">Material 1</span>
          </h2>
        </div>

        <div className="upload-file-wrapper">
          <label>
            <span>Complete Notes PDF (Full Textbook / Material 1)</span>
            <small style={{ color: "#6b7280" }}>Optional</small>
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdf(e.target.files?.[0] || null)}
          />
        </div>

        {/* Standard Units 1 to 5 */}
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#013a33", marginBottom: "10px" }}>
            Unit-wise Standard Material:
          </h3>

          {[
            { num: 1, val: module1, setVal: setModule1, setPdf: setModule1Pdf },
            { num: 2, val: module2, setVal: setModule2, setPdf: setModule2Pdf },
            { num: 3, val: module3, setVal: setModule3, setPdf: setModule3Pdf },
            { num: 4, val: module4, setVal: setModule4, setPdf: setModule4Pdf },
            { num: 5, val: module5, setVal: setModule5, setPdf: setModule5Pdf },
          ].map((u) => (
            <div key={u.num} className="unit-row-card">
              <label>Unit {u.num}</label>
              <textarea
                rows="2"
                value={u.val}
                placeholder={`Unit ${u.num} syllabus / key topics...`}
                onChange={(e) => u.setVal(e.target.value)}
              />
              <div className="upload-file-wrapper" style={{ margin: "4px 0 0" }}>
                <label>
                  <span>Unit {u.num} PDF:</span>
                  <small style={{ color: "#6b7280" }}>PDF only</small>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => u.setPdf(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ==================================================
            HANDWRITTEN NOTES SECTION (MATERIAL 2)
        ================================================== */}
        <div
          className="handwritten-toggle-card"
          onClick={() => setHasHandwritten(!hasHandwritten)}
        >
          <div className="handwritten-toggle-left">
            <div className="handwritten-toggle-icon">✍️</div>
            <div className="handwritten-toggle-text">
              <h3>Upload Handwritten Notes (Material 2)</h3>
              <p>Check this if you have a second set of handwritten notes for this subject.</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="handwritten-checkbox"
            checked={hasHandwritten}
            onChange={(e) => setHasHandwritten(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {hasHandwritten && (
          <div className="handwritten-panel">
            <div className="upload-section-divider" style={{ marginTop: 0 }}>
              <h2>
                <span>✍️</span> Handwritten Notes Details
                <span className="upload-badge-pill handwritten">Material 2</span>
              </h2>
            </div>

            <div className="upload-field-group">
              <label>Handwritten Notes Prepared By</label>
              <input
                type="text"
                placeholder="e.g. Jaswanth Reddy / Topper Notes / Faculty Name"
                value={handwrittenCredits}
                onChange={(e) => setHandwrittenCredits(e.target.value)}
              />
            </div>

            <div className="upload-file-wrapper">
              <label>
                <span>Complete Handwritten Notes PDF (Full Subject)</span>
                <small style={{ color: "#b45309" }}>Optional</small>
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setHandwrittenPdf(e.target.files?.[0] || null)}
              />
            </div>

            <h4 style={{ fontSize: "13.5px", fontWeight: "700", color: "#78350f", margin: "16px 0 10px" }}>
              Unit-wise Handwritten PDFs:
            </h4>

            {[
              { num: 1, setPdf: setHandwrittenModule1Pdf },
              { num: 2, setPdf: setHandwrittenModule2Pdf },
              { num: 3, setPdf: setHandwrittenModule3Pdf },
              { num: 4, setPdf: setHandwrittenModule4Pdf },
              { num: 5, setPdf: setHandwrittenModule5Pdf },
            ].map((u) => (
              <div key={u.num} className="upload-file-wrapper" style={{ background: "#ffffff", borderColor: "#fed7aa" }}>
                <label>
                  <span>Unit {u.num} Handwritten PDF:</span>
                  <small style={{ color: "#b45309" }}>Handwritten Unit {u.num}</small>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => u.setPdf(e.target.files?.[0] || null)}
                />
              </div>
            ))}
          </div>
        )}

        {/* ==================================================
            SUBMIT BUTTON
        ================================================== */}
        <button
          type="submit"
          className="upload-submit-btn"
          disabled={loading}
        >
          {loading ? "Uploading Notes..." : "Upload Note (Material Sets)"}
        </button>
      </form>
    </div>
  );
}

export default UploadNote;
