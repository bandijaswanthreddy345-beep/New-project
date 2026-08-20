import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function UploadLabProgram() {
const navigate = useNavigate();

const [title, setTitle] = useState("");
const [branch, setBranch] = useState("");
const [semester, setSemester] = useState("");
const [subject, setSubject] = useState("");
const [subjectCode, setSubjectCode] = useState("");
const [description, setDescription] = useState("");
const [file, setFile] = useState(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
e.preventDefault();

if (!file) {
  alert("Please select a PDF file");
  return;
}

const formData = new FormData();

formData.append("title", title);
formData.append("branch", branch);
formData.append("semester", semester);
formData.append("subject", subject);
formData.append("subjectCode", subjectCode);
formData.append("description", description);
formData.append("file", file);

try {
  setLoading(true);

  await API.post("/lab-programs", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  alert("Lab Program uploaded successfully!");

  navigate("/manage-resources");
} catch (err) {
  console.error("Upload Lab Program Error:", err);

  alert(
    err.response?.data?.message ||
      "Failed to upload Lab Program"
  );
} finally {
  setLoading(false);
}

};

return (
<div className="upload-container">
<h1>Upload Lab Program</h1>

  <form onSubmit={handleSubmit}>

    {/* Title */}
    <input
      type="text"
      placeholder="Lab Program Title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required
    />

    {/* Branch */}
    <select
      value={branch}
      onChange={(e) => setBranch(e.target.value)}
      required
    >
      <option value="">Select Branch</option>

      <option value="Computer Science Engineering">
        Computer Science Engineering
      </option>

      <option value="Information Science Engineering">
        Information Science Engineering
      </option>

      <option value="Artificial Intelligence & Machine Learning">
        Artificial Intelligence & Machine Learning
      </option>

      <option value="Electronics & Communication Engineering">
        Electronics & Communication Engineering
      </option>

      <option value="Mechanical Engineering">
        Mechanical Engineering
      </option>

      <option value="Civil Engineering">
        Civil Engineering
      </option>
    </select>

    {/* Semester */}
    <select
      value={semester}
      onChange={(e) => setSemester(e.target.value)}
      required
    >
      <option value="">Select Semester</option>

      <option value="1st Semester">1st Semester</option>
      <option value="2nd Semester">2nd Semester</option>
      <option value="3rd Semester">3rd Semester</option>
      <option value="4th Semester">4th Semester</option>
      <option value="5th Semester">5th Semester</option>
      <option value="6th Semester">6th Semester</option>
      <option value="7th Semester">7th Semester</option>
      <option value="8th Semester">8th Semester</option>
    </select>

    {/* Subject */}
    <input
      type="text"
      placeholder="Subject Name"
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
      required
    />

    {/* Subject Code */}
    <input
      type="text"
      placeholder="Subject Code"
      value={subjectCode}
      onChange={(e) => setSubjectCode(e.target.value)}
      required
    />

    {/* Description */}
    <textarea
      placeholder="Description"
      rows="5"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />

    {/* PDF File */}
    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => setFile(e.target.files[0])}
      required
    />

    {/* Submit */}
    <button
      type="submit"
      disabled={loading}
    >
      {loading
        ? "Uploading..."
        : "Upload Lab Program"}
    </button>

  </form>
</div>

);
}

export default UploadLabProgram;