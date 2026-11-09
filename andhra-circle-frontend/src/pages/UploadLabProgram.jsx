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

      <option value="CSE">CSE</option>
      <option value="AIML">AIML</option>
      <option value="ME">ME</option>
      <option value="CE">CE</option>
      <option value="ECE">ECE</option>
      <option value="EEE">EEE</option>
    </select>

    {/* Semester */}
    <select
      value={semester}
      onChange={(e) => setSemester(e.target.value)}
      required
    >
      <option value="">Select Semester</option>

      <option value="1-1">1-1</option>
      <option value="1-2">1-2</option>
      <option value="2-1">2-1</option>
      <option value="2-2">2-2</option>
      <option value="3-1">3-1</option>
      <option value="3-2">3-2</option>
      <option value="4-1">4-1</option>
      <option value="4-2">4-2</option>
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