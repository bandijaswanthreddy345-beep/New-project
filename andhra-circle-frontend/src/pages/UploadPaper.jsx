import { useState } from "react";
import API from "../api/api";

function UploadPaper() {
const [title, setTitle] = useState("");
const [branch, setBranch] = useState("");
const [semester, setSemester] = useState("");
const [subject, setSubject] = useState("");
const [year, setYear] = useState("");
const [examType, setExamType] = useState("Semester");
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
formData.append("subject", subject);
formData.append("year", year);
formData.append("examType", examType);
formData.append("description", description);
formData.append("file", file);

try {
  setLoading(true);

  const response = await API.post(
    "/papers",
    formData
  );

  console.log(
    "Upload Response:",
    response.data
  );

  alert(
    "Question Paper Uploaded Successfully!"
  );

  // Clear form
  setTitle("");
  setBranch("");
  setSemester("");
  setSubject("");
  setYear("");
  setExamType("Semester");
  setDescription("");
  setFile(null);

  // Reset file input
  e.target.reset();

} catch (error) {
  console.error(
    "Upload Paper Error:",
    error
  );

  if (error.response) {
    alert(
      error.response.data?.message ||
        "Upload failed"
    );
  } else if (error.request) {
    alert(
      "Server is not responding. Please check the backend."
    );
  } else {
    alert(
      "Upload failed. Please try again."
    );
  }

} finally {
  setLoading(false);
}

};

return (
<div className="upload-container">
<h1>Upload Question Paper</h1>

  <form onSubmit={handleSubmit}>

    {/* Title */}
    <input
      type="text"
      placeholder="Question Paper Title"
      value={title}
      onChange={(e) =>
        setTitle(e.target.value)
      }
      required
    />

    {/* Subject */}
    <input
      type="text"
      placeholder="Subject Name"
      value={subject}
      onChange={(e) =>
        setSubject(e.target.value)
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

    {/* Year */}
    <input
      type="number"
      placeholder="Year (Example: 2026)"
      value={year}
      min="2000"
      max="2100"
      onChange={(e) =>
        setYear(e.target.value)
      }
      required
    />

    {/* Exam Type */}
    <select
      value={examType}
      onChange={(e) =>
        setExamType(e.target.value)
      }
      required
    >
      <option value="Mid-1">
        Mid-1
      </option>

      <option value="Mid-2">
        Mid-2
      </option>

      <option value="Semester">
        Semester
      </option>

      <option value="Supply">
        Supply
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
        : "Upload Question Paper"}
    </button>

  </form>
</div>

);
}

export default UploadPaper;