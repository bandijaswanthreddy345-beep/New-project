import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function EditSyllabus() {
const { id } = useParams();
const navigate = useNavigate();

const [title, setTitle] = useState("");
const [branch, setBranch] = useState("");
const [semester, setSemester] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
fetchSyllabus();
}, [id]);

const fetchSyllabus = async () => {
try {
const res = await API.get(`/syllabus/${id}`);

  setTitle(res.data.title || "");
  setBranch(res.data.branch || "");
  setSemester(res.data.semester || "");
} catch (err) {
  console.error("Fetch Syllabus Error:", err);

  alert(
    err.response?.data?.message ||
      "Failed to load syllabus"
  );

  navigate("/manage-resources");
} finally {
  setLoading(false);
}

};

const handleSubmit = async (e) => {
e.preventDefault();

try {
  await API.put(`/syllabus/${id}`, {
    title,
    branch,
    semester,
  });

  alert("Syllabus Updated Successfully!");

  navigate("/manage-resources");
} catch (err) {
  console.error("Update Syllabus Error:", err);

  alert(
    err.response?.data?.message ||
      "Update Failed!"
  );
}

};

if (loading) {
return <p>Loading syllabus...</p>;
}

return (
<div className="upload-container">
<h1>Edit Syllabus</h1>

  <form onSubmit={handleSubmit}>
    {/* Syllabus Title */}
    <input
      type="text"
      placeholder="Syllabus Title"
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

      <option value="1st Semester">
        1st Semester
      </option>

      <option value="2nd Semester">
        2nd Semester
      </option>

      <option value="3rd Semester">
        3rd Semester
      </option>

      <option value="4th Semester">
        4th Semester
      </option>

      <option value="5th Semester">
        5th Semester
      </option>

      <option value="6th Semester">
        6th Semester
      </option>

      <option value="7th Semester">
        7th Semester
      </option>

      <option value="8th Semester">
        8th Semester
      </option>
    </select>

    <button type="submit">
      Update Syllabus
    </button>
  </form>
</div>

);
}

export default EditSyllabus;