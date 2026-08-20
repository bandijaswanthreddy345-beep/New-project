import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function EditNotification() {
const { id } = useParams();
const navigate = useNavigate();

const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [category, setCategory] = useState("General");
const [link, setLink] = useState("");
const [publishedDate, setPublishedDate] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
fetchNotification();
}, [id]);

const fetchNotification = async () => {
try {
const res = await API.get(`/notifications/${id}`);

  setTitle(res.data.title || "");
  setDescription(res.data.description || "");
  setCategory(res.data.category || "General");
  setLink(res.data.link || "");

  setPublishedDate(
    res.data.publishedDate
      ? res.data.publishedDate.substring(0, 10)
      : ""
  );
} catch (err) {
  console.error("Fetch Notification Error:", err);

  alert(
    err.response?.data?.message ||
      "Failed to load notification"
  );

  navigate("/manage-resources");
} finally {
  setLoading(false);
}

};

const handleSubmit = async (e) => {
e.preventDefault();

try {
  await API.put(`/notifications/${id}`, {
    title,
    description,
    category,
    link,
    publishedDate,
  });

  alert("Notification Updated Successfully!");

  navigate("/manage-resources");
} catch (err) {
  console.error("Update Notification Error:", err);

  alert(
    err.response?.data?.message ||
      "Update Failed!"
  );
}

};

if (loading) {
return <p>Loading notification...</p>;
}

return (
<div className="upload-container">
<h1>Edit Notification</h1>

  <form onSubmit={handleSubmit}>
    {/* Notification Title */}
    <input
      type="text"
      placeholder="Notification Title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required
    />

    {/* Description */}
    <textarea
      placeholder="Description"
      rows="4"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      required
    />

    {/* Category */}
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
    >
      <option value="General">General</option>
      <option value="Exam">Exam</option>
      <option value="Results">Results</option>
      <option value="Circular">Circular</option>
      <option value="Placement">Placement</option>
      <option value="Holiday">Holiday</option>
    </select>

    {/* Notification Link */}
    <input
      type="url"
      placeholder="Notification Link (Optional)"
      value={link}
      onChange={(e) => setLink(e.target.value)}
    />

    {/* Published Date */}
    <input
      type="date"
      value={publishedDate}
      onChange={(e) => setPublishedDate(e.target.value)}
    />

    <button type="submit">
      Update Notification
    </button>
  </form>
</div>

);
}

export default EditNotification;