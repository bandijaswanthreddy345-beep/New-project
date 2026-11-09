import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";

function EditLabProgram() {
const { id } = useParams();
const navigate = useNavigate();

const [title, setTitle] = useState("");
const [subject, setSubject] = useState("");
const [subjectCode, setSubjectCode] = useState("");
const [branch, setBranch] = useState("");
const [semester, setSemester] = useState("");
const [description, setDescription] = useState("");

const [loading, setLoading] = useState(true);

// ==========================================
// FETCH LAB PROGRAM
// ==========================================

useEffect(() => {
fetchLabProgram();
}, [id]);

const fetchLabProgram = async () => {
try {
const res = await API.get(`/lab-programs/${id}`)

  setTitle(res.data.title || "");
  setSubject(res.data.subject || "");
  setSubjectCode(res.data.subjectCode || "");
  setBranch(res.data.branch || "");
  setSemester(res.data.semester || "");
  setDescription(res.data.description || "");
} catch (err) {
  console.error(
    "Fetch Lab Program Error:",
    err
  );

  alert(
    err.response?.data?.message ||
      "Failed to load lab program"
  );
} finally {
  setLoading(false);
}

};

// ==========================================
// UPDATE LAB PROGRAM
// ==========================================

const handleSubmit = async (e) => {
e.preventDefault();

try {
  await API.put(`/lab-programs/${id}`, {
    title,
    subject,
    subjectCode,
    branch,
    semester,
    description,
  });

  alert(
    "Lab Program Updated Successfully!"
  );

  navigate("/manage-resources");
} catch (err) {
  console.error(
    "Update Lab Program Error:",
    err
  );

  alert(
    err.response?.data?.message ||
      "Update Failed!"
  );
}

};

// ==========================================
// LOADING
// ==========================================

if (loading) {
return <p>Loading lab program...</p>;
}

// ==========================================
// EDIT FORM
// ==========================================

return (
<div className="upload-container">
<h1>🧪 Edit Lab Program</h1>

  <form onSubmit={handleSubmit}>

    {/* Title */}

    <input
      type="text"
      placeholder="Lab Program Title"
      value={title}
      onChange={(e) =>
        setTitle(e.target.value)
      }
      required
    />

    {/* Subject */}

    <input
      type="text"
      placeholder="Subject"
      value={subject}
      onChange={(e) =>
        setSubject(e.target.value)
      }
      required
    />

    {/* Subject Code */}

    <input
      type="text"
      placeholder="Subject Code"
      value={subjectCode}
      onChange={(e) =>
        setSubjectCode(e.target.value)
      }
      required
    />

    {/* Branch */}

    <select
      value={branch}
      onChange={(e) =>
        setBranch(e.target.value)
      }
      required
    >
      <option value="">
        Select Branch
      </option>

      <option value="CSE">
        CSE
      </option>

      <option value="AIML">
        AIML
      </option>

      <option value="ME">
        ME
      </option>

      <option value="CE">
        CE
      </option>

      <option value="ECE">
        ECE
      </option>

      <option value="EEE">
        EEE
      </option>
    </select>

    {/* Semester */}

    <select
      value={semester}
      onChange={(e) =>
        setSemester(e.target.value)
      }
      required
    >
      <option value="">
        Select Semester
      </option>

      <option value="1-1">1-1</option>
      <option value="1-2">1-2</option>
      <option value="2-1">2-1</option>
      <option value="2-2">2-2</option>
      <option value="3-1">3-1</option>
      <option value="3-2">3-2</option>
      <option value="4-1">4-1</option>
      <option value="4-2">4-2</option>
    </select>

    {/* Description */}

    <textarea
      placeholder="Description"
      value={description}
      onChange={(e) =>
        setDescription(e.target.value)
      }
    />

    {/* Update Button */}

    <button type="submit">
      Update Lab Program
    </button>

  </form>
</div>

);
}

export default EditLabProgram;