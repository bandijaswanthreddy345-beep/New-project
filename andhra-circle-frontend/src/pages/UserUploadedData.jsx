import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "./UserUploadedData.css";

const API_ORIGIN = API.defaults.baseURL.replace(/\/api\/?$/, "");

const formatMaterialType = (value) =>
  String(value || "unknown")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function UserUploadedData() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/user-materials");
      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected submissions response.");
      }

      setSubmissions(data);
    } catch (requestError) {
      console.error("Fetch user-uploaded data error:", requestError);
      setError(
        requestError?.response?.data?.message ||
          requestError.message ||
          "Unable to load user submissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const deleteSubmission = async (submission) => {
    const confirmed = window.confirm(
      `Delete the submission from ${submission.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(submission._id);
    setError("");

    try {
      const response = await API.delete(`/user-materials/${submission._id}`);
      setSubmissions((current) =>
        current.filter((item) => item._id !== submission._id)
      );

      if (response.data?.cleanupWarning) {
        setError(response.data.cleanupWarning);
      }
    } catch (requestError) {
      console.error("Delete user-uploaded data error:", requestError);
      setError(
        requestError?.response?.data?.message ||
          "Unable to delete this user submission."
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="user-uploaded-page">
      <header className="user-uploaded-header">
        <div>
          <span className="user-uploaded-eyebrow">ADMIN · SUBMISSIONS</span>
          <h1>User Uploaded Data</h1>
          <p>Review materials submitted by JNTU Circle users.</p>
        </div>
        <div className="user-uploaded-header-actions">
          <button type="button" onClick={fetchSubmissions} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            className="user-uploaded-back"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <section className="user-uploaded-summary" aria-label="Submission count">
        <span aria-hidden="true">📥</span>
        <div>
          <strong>{submissions.length}</strong>
          <span>Total submissions</span>
        </div>
      </section>

      {error && (
        <div className="user-uploaded-message user-uploaded-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="user-uploaded-empty" role="status">
          Loading user submissions…
        </div>
      ) : error ? null : submissions.length === 0 ? (
        <div className="user-uploaded-empty">
          <span aria-hidden="true">🗂️</span>
          <h2>No user uploads yet</h2>
          <p>Submissions will appear here after users upload their materials.</p>
        </div>
      ) : (
        <div className="user-uploaded-table-wrap">
          <table className="user-uploaded-table">
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col">Submitted by</th>
                <th scope="col">Comment</th>
                <th scope="col">File</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission._id}>
                  <td>
                    <span className="user-uploaded-type">
                      {formatMaterialType(submission.materialType)}
                    </span>
                  </td>
                  <td>
                    <strong className="user-uploaded-name">{submission.name}</strong>
                    <a className="user-uploaded-email" href={`mailto:${submission.email}`}>
                      {submission.email}
                    </a>
                  </td>
                  <td className="user-uploaded-comment">
                    {submission.comment || "—"}
                  </td>
                  <td>
                    {submission.fileUrl ? (
                      <a
                        className="user-uploaded-file"
                        href={`${API_ORIGIN}${submission.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {submission.fileName || "Open PDF"} ↗
                      </a>
                    ) : (
                      <span className="user-uploaded-no-file">No file attached</span>
                    )}
                  </td>
                  <td>{formatDate(submission.createdAt)}</td>
                  <td>
                    <span className={`user-uploaded-status status-${submission.status || "pending"}`}>
                      {formatMaterialType(submission.status || "pending")}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="user-uploaded-delete"
                      onClick={() => deleteSubmission(submission)}
                      disabled={deletingId === submission._id}
                    >
                      {deletingId === submission._id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default UserUploadedData;
