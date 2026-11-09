import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function EditNote() {
const { id } = useParams();
const navigate = useNavigate();

const [title, setTitle] = useState("");
const [branch, setBranch] = useState("");
const [semester, setSemester] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
fetchNote();
}, [id]);

const fetchNote = async () => {
try {
const res = await API.get(`/notes/${id}`);

  setTitle(res.data.title || "");
  setBranch(res.data.branch || "");
  setSemester(res.data.semester || "");
} catch (err) {
  console.error("Fetch Note Error:", err);

  alert(
    err.response?.data?.message ||
      "Failed to load note"
  );
} finally {
  setLoading(false);
}

};

const handleSubmit = async (e) => {
e.preventDefault();

try {
  await API.put(`/notes/${id}`, {
    title,
    branch,
    semester,
  });

  alert("Note Updated Successfully!");

  navigate("/manage-resources");
} catch (err) {
  console.error("Update Note Error:", err);

  alert(
    err.response?.data?.message ||
      "Update Failed!"
  );
}

};

if (loading) {
return <p>Loading note...</p>;
}

return (
<div className="upload-container">
<h1>Edit Note</h1>

  <form onSubmit={handleSubmit}>
    <input
      type="text"
      placeholder="Note Title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required
    />

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

    <button type="submit">
      Update Note
    </button>
  </form>
</div>

);
}

export default EditNote;