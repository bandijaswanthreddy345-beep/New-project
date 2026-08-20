import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function EditPaper() {
const { id } = useParams();
const navigate = useNavigate();

const [title, setTitle] = useState("");
const [branch, setBranch] = useState("");
const [semester, setSemester] = useState("");
const [subject, setSubject] = useState("");
const [year, setYear] = useState("");
const [examType, setExamType] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
fetchPaper();
}, [id]);

const fetchPaper = async () => {
try {
const res = await API.get(`/papers/${id}`);

  setTitle(res.data.title || "");
  setBranch(res.data.branch || "");
  setSemester(res.data.semester || "");
  setSubject(res.data.subject || "");
  setYear(res.data.year || "");
  setExamType(res.data.examType || "");
} catch (err) {
  console.error("Fetch Paper Error:", err);

  alert(
    err.response?.data?.message ||
      "Failed to load question paper"
  );

  navigate("/manage-resources");
} finally {
  setLoading(false);
}

};

const handleSubmit = async (e) => {
e.preventDefault();

try {
  await API.put(`/papers/${id}`, {
    title,
    branch,
    semester,
    subject,
    year,
    examType,
  });

  alert("Question Paper Updated Successfully!");

  navigate("/manage-resources");
} catch (err) {
  console.error("Update Paper Error:", err);

  alert(
    err.response?.data?.message ||
      "Update Failed!"
  );
}

};

if (loading) {
return <p>Loading question paper...</p>;
}

return (
<div className="upload-container">
<h1>Edit Question Paper</h1>

  <form onSubmit={handleSubmit}>
    <input
      type="text"
      placeholder="Paper Title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required
    />

    <input
      type="text"
      placeholder="Branch"
      value={branch}
      onChange={(e) => setBranch(e.target.value)}
      required
    />

    <input
      type="text"
      placeholder="Semester"
      value={semester}
      onChange={(e) => setSemester(e.target.value)}
      required
    />

    <input
      type="text"
      placeholder="Subject"
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
      required
    />

    <input
      type="number"
      placeholder="Year"
      value={year}
      onChange={(e) => setYear(e.target.value)}
      required
    />

    <select
      value={examType}
      onChange={(e) => setExamType(e.target.value)}
      required
    >
      <option value="">Select Exam Type</option>
      <option value="Mid-1">Mid-1</option>
      <option value="Mid-2">Mid-2</option>
      <option value="Semester">Semester</option>
      <option value="Supply">Supply</option>
    </select>

    <button type="submit">
      Update Question Paper
    </button>
  </form>
</div>

);
}

export default EditPaper;