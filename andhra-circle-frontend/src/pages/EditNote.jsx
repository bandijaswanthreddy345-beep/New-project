import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import "./UploadNote.css";

function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Basic Info
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");

  // Existing standard PDFs
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const [newPdf, setNewPdf] = useState(null);

  const [existingModulePdfs, setExistingModulePdfs] = useState({
    module1Pdf: "",
    module2Pdf: "",
    module3Pdf: "",
    module4Pdf: "",
    module5Pdf: "",
  });

  const [newModule1Pdf, setNewModule1Pdf] = useState(null);
  const [newModule2Pdf, setNewModule2Pdf] = useState(null);
  const [newModule3Pdf, setNewModule3Pdf] = useState(null);
  const [newModule4Pdf, setNewModule4Pdf] = useState(null);
  const [newModule5Pdf, setNewModule5Pdf] = useState(null);

  // Handwritten Notes
  const [hasHandwritten, setHasHandwritten] = useState(false);
  const [handwrittenCredits, setHandwrittenCredits] = useState("");
  const [existingHandwrittenPdfUrl, setExistingHandwrittenPdfUrl] = useState("");
  const [newHandwrittenPdf, setNewHandwrittenPdf] = useState(null);

  const [existingHandwrittenModulePdfs, setExistingHandwrittenModulePdfs] = useState({
    module1Pdf: "",
    module2Pdf: "",
    module3Pdf: "",
    module4Pdf: "",
    module5Pdf: "",
  });

  const [newHandwrittenModule1Pdf, setNewHandwrittenModule1Pdf] = useState(null);
  const [newHandwrittenModule2Pdf, setNewHandwrittenModule2Pdf] = useState(null);
  const [newHandwrittenModule3Pdf, setNewHandwrittenModule3Pdf] = useState(null);
  const [newHandwrittenModule4Pdf, setNewHandwrittenModule4Pdf] = useState(null);
  const [newHandwrittenModule5Pdf, setNewHandwrittenModule5Pdf] = useState(null);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/notes/${id}`);
      const data = res.data?.note || res.data?.data || res.data;

      setTitle(data.title || "");
      setBranch(data.branch || "");
      setSemester(data.semester || "");
      setSubject(data.subject || "");
      setSubjectCode(data.subjectCode || "");
      setDescription(data.description || "");
      setCredits(data.credits || "");

      setExistingPdfUrl(data.pdfUrl || "");
      setExistingModulePdfs({
        module1Pdf: data.module1Pdf || "",
        module2Pdf: data.module2Pdf || "",
        module3Pdf: data.module3Pdf || "",
        module4Pdf: data.module4Pdf || "",
        module5Pdf: data.module5Pdf || "",
      });

      const hasHw = Boolean(
        data.hasHandwritten ||
        data.handwrittenPdfUrl ||
        data.handwrittenModule1Pdf ||
        data.handwrittenModule2Pdf ||
        data.handwrittenModule3Pdf ||
        data.handwrittenModule4Pdf ||
        data.handwrittenModule5Pdf
      );
      setHasHandwritten(hasHw);
      setHandwrittenCredits(data.handwrittenCredits || "");
      setExistingHandwrittenPdfUrl(data.handwrittenPdfUrl || "");
      setExistingHandwrittenModulePdfs({
        module1Pdf: data.handwrittenModule1Pdf || "",
        module2Pdf: data.handwrittenModule2Pdf || "",
        module3Pdf: data.handwrittenModule3Pdf || "",
        module4Pdf: data.handwrittenModule4Pdf || "",
        module5Pdf: data.handwrittenModule5Pdf || "",
      });
    } catch (err) {
      console.error("Fetch Note Error:", err);
      alert(err.response?.data?.message || "Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const formData = new FormData();

      formData.append("title", title);
      formData.append("branch", branch);
      formData.append("semester", semester);
      formData.append("subject", subject);
      formData.append("subjectCode", subjectCode);
      formData.append("description", description);
      formData.append("credits", credits);

      if (newPdf) formData.append("pdf", newPdf);
      if (newModule1Pdf) formData.append("module1Pdf", newModule1Pdf);
      if (newModule2Pdf) formData.append("module2Pdf", newModule2Pdf);
      if (newModule3Pdf) formData.append("module3Pdf", newModule3Pdf);
      if (newModule4Pdf) formData.append("module4Pdf", newModule4Pdf);
      if (newModule5Pdf) formData.append("module5Pdf", newModule5Pdf);

      formData.append("hasHandwritten", String(hasHandwritten));
      formData.append("handwrittenCredits", handwrittenCredits);

      if (newHandwrittenPdf) formData.append("handwrittenPdf", newHandwrittenPdf);
      if (newHandwrittenModule1Pdf) formData.append("handwrittenModule1Pdf", newHandwrittenModule1Pdf);
      if (newHandwrittenModule2Pdf) formData.append("handwrittenModule2Pdf", newHandwrittenModule2Pdf);
      if (newHandwrittenModule3Pdf) formData.append("handwrittenModule3Pdf", newHandwrittenModule3Pdf);
      if (newHandwrittenModule4Pdf) formData.append("handwrittenModule4Pdf", newHandwrittenModule4Pdf);
      if (newHandwrittenModule5Pdf) formData.append("handwrittenModule5Pdf", newHandwrittenModule5Pdf);

      await API.put(`/notes/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Note updated successfully with material sets!");
      navigate("/manage-resources");
    } catch (err) {
      console.error("Update Note Error:", err);
      alert(err.response?.data?.message || "Update Failed!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading note details...</div>;
  }

  return (
    <div className="upload-note-card">
      <h1>Edit Subject Note</h1>
      <p className="upload-note-subtitle">Update syllabus details, standard material, and handwritten notes.</p>

      <form onSubmit={handleSubmit}>
        <div className="upload-section-divider">
          <h2><span>📋</span> Basic Information</h2>
        </div>

        <div className="upload-field-group">
          <label>Note Title *</label>
          <input
            type="text"
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
            <label>Subject Name</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="upload-field-group">
            <label>Subject Code</label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
            />
          </div>
        </div>

        <div className="upload-field-group">
          <label>Credits / Prepared By</label>
          <input
            type="text"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
          />
        </div>

        {/* ==================================================
            STANDARD MATERIAL (MATERIAL 1)
        ================================================== */}
        <div className="upload-section-divider">
          <h2>
            <span>📄</span> Standard Notes
            <span className="upload-badge-pill">Material 1</span>
          </h2>
        </div>

        <div className="upload-file-wrapper">
          <label>
            <span>Complete Notes PDF</span>
            {existingPdfUrl && (
              <small style={{ color: "#0d9488" }}>
                Current: {existingPdfUrl.split("/").pop()}
              </small>
            )}
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setNewPdf(e.target.files?.[0] || null)}
          />
        </div>

        <h4 style={{ fontSize: "13.5px", fontWeight: "700", color: "#013a33", margin: "16px 0 10px" }}>
          Unit-wise Standard PDFs:
        </h4>

        {[
          { num: 1, current: existingModulePdfs.module1Pdf, setter: setNewModule1Pdf },
          { num: 2, current: existingModulePdfs.module2Pdf, setter: setNewModule2Pdf },
          { num: 3, current: existingModulePdfs.module3Pdf, setter: setNewModule3Pdf },
          { num: 4, current: existingModulePdfs.module4Pdf, setter: setNewModule4Pdf },
          { num: 5, current: existingModulePdfs.module5Pdf, setter: setNewModule5Pdf },
        ].map((u) => (
          <div key={u.num} className="upload-file-wrapper">
            <label>
              <span>Unit {u.num} PDF</span>
              {u.current && (
                <small style={{ color: "#0d9488" }}>
                  Current: {u.current.split("/").pop()}
                </small>
              )}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => u.setter(e.target.files?.[0] || null)}
            />
          </div>
        ))}

        {/* ==================================================
            HANDWRITTEN MATERIAL (MATERIAL 2)
        ================================================== */}
        <div
          className="handwritten-toggle-card"
          onClick={() => setHasHandwritten(!hasHandwritten)}
        >
          <div className="handwritten-toggle-left">
            <div className="handwritten-toggle-icon">✍️</div>
            <div className="handwritten-toggle-text">
              <h3>Handwritten Notes (Material 2)</h3>
              <p>Enable to provide a second set of handwritten notes for students.</p>
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
                placeholder="e.g. Jaswanth Reddy / Topper Notes"
                value={handwrittenCredits}
                onChange={(e) => setHandwrittenCredits(e.target.value)}
              />
            </div>

            <div className="upload-file-wrapper">
              <label>
                <span>Complete Handwritten Notes PDF</span>
                {existingHandwrittenPdfUrl && (
                  <small style={{ color: "#b45309" }}>
                    Current: {existingHandwrittenPdfUrl.split("/").pop()}
                  </small>
                )}
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setNewHandwrittenPdf(e.target.files?.[0] || null)}
              />
            </div>

            <h4 style={{ fontSize: "13.5px", fontWeight: "700", color: "#78350f", margin: "16px 0 10px" }}>
              Unit-wise Handwritten PDFs:
            </h4>

            {[
              { num: 1, current: existingHandwrittenModulePdfs.module1Pdf, setter: setNewHandwrittenModule1Pdf },
              { num: 2, current: existingHandwrittenModulePdfs.module2Pdf, setter: setNewHandwrittenModule2Pdf },
              { num: 3, current: existingHandwrittenModulePdfs.module3Pdf, setter: setNewHandwrittenModule3Pdf },
              { num: 4, current: existingHandwrittenModulePdfs.module4Pdf, setter: setNewHandwrittenModule4Pdf },
              { num: 5, current: existingHandwrittenModulePdfs.module5Pdf, setter: setNewHandwrittenModule5Pdf },
            ].map((u) => (
              <div key={u.num} className="upload-file-wrapper" style={{ background: "#ffffff", borderColor: "#fed7aa" }}>
                <label>
                  <span>Unit {u.num} Handwritten PDF</span>
                  {u.current && (
                    <small style={{ color: "#b45309" }}>
                      Current: {u.current.split("/").pop()}
                    </small>
                  )}
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => u.setter(e.target.files?.[0] || null)}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="upload-submit-btn"
          disabled={saving}
        >
          {saving ? "Saving Changes..." : "Save Note Changes"}
        </button>
      </form>
    </div>
  );
}

export default EditNote;
