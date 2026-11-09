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