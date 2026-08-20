import { useState } from "react";
import API from "../api/api";

function UploadNotification() {
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [category, setCategory] = useState("General");
const [branch, setBranch] = useState("");
const [semester, setSemester] = useState("");
const [link, setLink] = useState("");
const [publishedDate, setPublishedDate] = useState("");
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
e.preventDefault();

try {
  setLoading(true);

  const response = await API.post(
    "/notifications",
    {
      title,
      description,
      category,
      branch,
      semester,
      link,
      publishedDate,
    }
  );

  console.log(
    "Notification Response:",
    response.data
  );

  alert(
    "Notification Uploaded Successfully!"
  );

  // Clear form
  setTitle("");
  setDescription("");
  setCategory("General");
  setBranch("");
  setSemester("");
  setLink("");
  setPublishedDate("");

} catch (error) {
  console.error(
    "Upload Notification Error:",
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
<h1>Upload Notification</h1>

  <form onSubmit={handleSubmit}>

    {/* Title */}
    <input
      type="text"
      placeholder="Notification Title"
      value={title}
      onChange={(e) =>
        setTitle(e.target.value)
      }
      required
    />

    {/* Description */}
    <textarea
      placeholder="Notification Description"
      rows="4"
      value={description}
      onChange={(e) =>
        setDescription(e.target.value)
      }
      required
    />

    {/* Category */}
    <select
      value={category}
      onChange={(e) =>
        setCategory(e.target.value)
      }
      required
    >
      <option value="General">
        General
      </option>

      <option value="Exam">
        Exam
      </option>

      <option value="Results">
        Results
      </option>

      <option value="Circular">
        Circular
      </option>

      <option value="Placement">
        Placement
      </option>

      <option value="Holiday">
        Holiday
      </option>
    </select>

    {/* Branch */}
    <select
      value={branch}
      onChange={(e) =>
        setBranch(e.target.value)
      }
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

    {/* Optional Link */}
    <input
      type="url"
      placeholder="Notification Link (Optional)"
      value={link}
      onChange={(e) =>
        setLink(e.target.value)
      }
    />

    {/* Published Date */}
    <input
      type="date"
      value={publishedDate}
      onChange={(e) =>
        setPublishedDate(e.target.value)
      }
    />

    {/* Submit */}
    <button
      type="submit"
      disabled={loading}
    >
      {loading
        ? "Uploading..."
        : "Upload Notification"}
    </button>

  </form>
</div>

);
}

export default UploadNotification;