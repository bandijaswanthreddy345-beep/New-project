import { useState } from "react";
import API from "../api/api";

function UploadSyllabus() {
const [title, setTitle] = useState("");
const [branch, setBranch] = useState("");
const [semester, setSemester] = useState("");
const [description, setDescription] = useState("");
const [file, setFile] = useState(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
e.preventDefault();

if (!file) {
  alert("Please select a PDF file.");
  return;
}

const formData = new FormData();

formData.append("title", title);
formData.append("branch", branch);
formData.append("semester", semester);
formData.append("description", description);
formData.append("file", file);

try {
  setLoading(true);

  const response = await API.post(
    "/syllabus",
    formData
  );

  console.log(
    "Upload Response:",
    response.data
  );

  alert(
    "Syllabus Uploaded Successfully!"
  );

  // Clear form
  setTitle("");
  setBranch("");
  setSemester("");
  setDescription("");
  setFile(null);

  // Reset file input
  e.target.reset();

} catch (error) {
  console.error(
    "Upload Syllabus Error:",
    error
  );

  if (error.response) {
    alert(
      error.response.data?.message ||
        "Upload Failed!"
    );
  } else if (error.request) {
    alert(
      "Server is not responding. Please check the backend."
    );
  } else {
    alert(
      "Upload Failed! Please try again."
    );
  }

} finally {
  setLoading(false);
}

};

return (
<div className="upload-container">
<h1>Upload Syllabus</h1>

  <form onSubmit={handleSubmit}>

    {/* Syllabus Title */}
    <input
      type="text"
      placeholder="Syllabus Title"
      value={title}
      onChange={(e) =>
        setTitle(e.target.value)
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
      onChange={(e) =>
        setSemester(e.target.value)
      }
      required
    >
      <option value="">
        Select Semester
      </option>

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

    {/* Description */}
    <textarea
      placeholder="Description (Optional)"
      rows="4"
      value={description}
      onChange={(e) =>
        setDescription(e.target.value)
      }
    />

    {/* PDF File */}
    <input
      type="file"
      accept=".pdf,application/pdf"
      onChange={(e) =>
        setFile(e.target.files[0])
      }
      required
    />

    {/* Submit */}
    <button
      type="submit"
      disabled={loading}
    >
      {loading
        ? "Uploading..."
        : "Upload Syllabus"}
    </button>

  </form>
</div>

);
}

export default UploadSyllabus;