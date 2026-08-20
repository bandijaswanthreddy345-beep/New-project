import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "./ManageResources.css";

function ManageResources() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [papers, setPapers] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [labPrograms, setLabPrograms] = useState([]);

  useEffect(() => {
    fetchResources();
  }, []);

  // ==========================================
  // FETCH ALL RESOURCES
  // ==========================================

  const fetchResources = async () => {
    try {
      const [
        notesRes,
        papersRes,
        syllabusRes,
        notificationsRes,
        labProgramsRes,
      ] = await Promise.all([
        API.get("/notes"),
        API.get("/papers"),
        API.get("/syllabus"),
        API.get("/notifications"),
        API.get("/lab-programs"),
      ]);

      setNotes(notesRes.data);
      setPapers(papersRes.data);
      setSyllabus(syllabusRes.data);
      setNotifications(notificationsRes.data);
      setLabPrograms(labProgramsRes.data);
    } catch (err) {
      console.log("Fetch Resources Error:", err);
    }
  };

  // ==========================================
  // DELETE RESOURCE
  // ==========================================

  const deleteResource = async (type, id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this resource?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/${type}/${id}`);

      alert("Deleted Successfully!");

      fetchResources();
    } catch (err) {
      console.log("Delete Resource Error:", err);
      alert("Delete Failed!");
    }
  };

  // ==========================================
  // EMPTY STATE
  // ==========================================

  const EmptyState = ({ icon, text }) => (
    <div className="resource-empty">
      <div className="resource-empty-icon">{icon}</div>
      <p>{text}</p>
    </div>
  );

  // ==========================================
  // RESOURCE SECTION
  // ==========================================

  return (
    <div className="manage-container">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="manage-header">
        <div>
          <h1>Manage Resources</h1>
          <p>
            View, edit and manage all educational resources
            available on Andhra Circle.
          </p>
        </div>

        <button
          className="manage-back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* ==========================================
          SUMMARY
      ========================================== */}

      <div className="resource-summary">

        <div className="summary-card">
          <span className="summary-icon">📘</span>
          <div>
            <strong>{notes.length}</strong>
            <span>Notes</span>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-icon">📄</span>
          <div>
            <strong>{papers.length}</strong>
            <span>Question Papers</span>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-icon">📚</span>
          <div>
            <strong>{syllabus.length}</strong>
            <span>Syllabus</span>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-icon">📢</span>
          <div>
            <strong>{notifications.length}</strong>
            <span>Notifications</span>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-icon">🧪</span>
          <div>
            <strong>{labPrograms.length}</strong>
            <span>Lab Programs</span>
          </div>
        </div>

      </div>

      {/* ==========================================
          NOTES
      ========================================== */}

      <section className="resource-section">

        <div className="resource-section-header">
          <div>
            <span className="section-icon">📘</span>
            <div>
              <h2>Notes</h2>
              <p>Manage uploaded study notes</p>
            </div>
          </div>

          <span className="resource-count">
            {notes.length}
          </span>
        </div>

        {notes.length === 0 ? (
          <EmptyState
            icon="📝"
            text="No Notes Available"
          />
        ) : (
          <div className="resource-grid">
            {notes.map((note) => (
              <div
                className="manage-card"
                key={note._id}
              >
                <div className="resource-card-top">
                  <span className="resource-type-badge">
                    NOTE
                  </span>
                </div>

                <h3>{note.title}</h3>

                <div className="resource-details">

                  <p>
                    <strong>Branch</strong>
                    <span>{note.branch}</span>
                  </p>

                  <p>
                    <strong>Semester</strong>
                    <span>{note.semester}</span>
                  </p>

                  {note.subject && (
                    <p>
                      <strong>Subject</strong>
                      <span>{note.subject}</span>
                    </p>
                  )}

                </div>

                <div className="action-buttons">

                  <button
                    className="edit-button"
                    onClick={() =>
                      navigate(`/edit-note/${note._id}`)
                    }
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteResource(
                        "notes",
                        note._id
                      )
                    }
                  >
                    🗑 Delete
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* ==========================================
          QUESTION PAPERS
      ========================================== */}

      <section className="resource-section">

        <div className="resource-section-header">
          <div>
            <span className="section-icon">📄</span>
            <div>
              <h2>Question Papers</h2>
              <p>Manage previous examination papers</p>
            </div>
          </div>

          <span className="resource-count">
            {papers.length}
          </span>
        </div>

        {papers.length === 0 ? (
          <EmptyState
            icon="📄"
            text="No Question Papers Available"
          />
        ) : (
          <div className="resource-grid">

            {papers.map((paper) => (
              <div
                className="manage-card"
                key={paper._id}
              >

                <div className="resource-card-top">
                  <span className="resource-type-badge">
                    PAPER
                  </span>
                </div>

                <h3>{paper.title}</h3>

                <div className="resource-details">

                  <p>
                    <strong>Branch</strong>
                    <span>{paper.branch}</span>
                  </p>

                  <p>
                    <strong>Semester</strong>
                    <span>{paper.semester}</span>
                  </p>

                </div>

                <div className="action-buttons">

                  <button
                    className="edit-button"
                    onClick={() =>
                      navigate(`/edit-paper/${paper._id}`)
                    }
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteResource(
                        "papers",
                        paper._id
                      )
                    }
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

      {/* ==========================================
          SYLLABUS
      ========================================== */}

      <section className="resource-section">

        <div className="resource-section-header">
          <div>
            <span className="section-icon">📚</span>
            <div>
              <h2>Syllabus</h2>
              <p>Manage academic syllabus resources</p>
            </div>
          </div>

          <span className="resource-count">
            {syllabus.length}
          </span>
        </div>

        {syllabus.length === 0 ? (
          <EmptyState
            icon="📚"
            text="No Syllabus Available"
          />
        ) : (
          <div className="resource-grid">

            {syllabus.map((item) => (
              <div
                className="manage-card"
                key={item._id}
              >

                <div className="resource-card-top">
                  <span className="resource-type-badge">
                    SYLLABUS
                  </span>
                </div>

                <h3>{item.title}</h3>

                <div className="resource-details">

                  <p>
                    <strong>Branch</strong>
                    <span>{item.branch}</span>
                  </p>

                  <p>
                    <strong>Semester</strong>
                    <span>{item.semester}</span>
                  </p>

                </div>

                <div className="action-buttons">

                  <button
                    className="edit-button"
                    onClick={() =>
                      navigate(
                        `/edit-syllabus/${item._id}`
                      )
                    }
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteResource(
                        "syllabus",
                        item._id
                      )
                    }
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

      {/* ==========================================
          NOTIFICATIONS
      ========================================== */}

      <section className="resource-section">

        <div className="resource-section-header">
          <div>
            <span className="section-icon">📢</span>
            <div>
              <h2>Notifications</h2>
              <p>Manage important announcements</p>
            </div>
          </div>

          <span className="resource-count">
            {notifications.length}
          </span>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            text="No Notifications Available"
          />
        ) : (
          <div className="resource-grid">

            {notifications.map((item) => (
              <div
                className="manage-card"
                key={item._id}
              >

                <div className="resource-card-top">
                  <span className="resource-type-badge">
                    NOTICE
                  </span>
                </div>

                <h3>{item.title}</h3>

                <div className="notification-description">
                  {item.description}
                </div>

                <div className="action-buttons">

                  <button
                    className="edit-button"
                    onClick={() =>
                      navigate(
                        `/edit-notification/${item._id}`
                      )
                    }
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteResource(
                        "notifications",
                        item._id
                      )
                    }
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

      {/* ==========================================
          LAB PROGRAMS
      ========================================== */}

      <section className="resource-section">

        <div className="resource-section-header">
          <div>
            <span className="section-icon">🧪</span>
            <div>
              <h2>Lab Programs</h2>
              <p>Manage laboratory programs</p>
            </div>
          </div>

          <span className="resource-count">
            {labPrograms.length}
          </span>
        </div>

        {labPrograms.length === 0 ? (
          <EmptyState
            icon="🧪"
            text="No Lab Programs Available"
          />
        ) : (
          <div className="resource-grid">

            {labPrograms.map((item) => (
              <div
                className="manage-card"
                key={item._id}
              >

                <div className="resource-card-top">
                  <span className="resource-type-badge">
                    LAB
                  </span>
                </div>

                <h3>{item.title}</h3>

                <div className="resource-details">

                  <p>
                    <strong>Subject</strong>
                    <span>{item.subject}</span>
                  </p>

                  <p>
                    <strong>Subject Code</strong>
                    <span>{item.subjectCode}</span>
                  </p>

                  <p>
                    <strong>Branch</strong>
                    <span>{item.branch}</span>
                  </p>

                  <p>
                    <strong>Semester</strong>
                    <span>{item.semester}</span>
                  </p>

                </div>

                {item.description && (
                  <div className="notification-description">
                    {item.description}
                  </div>
                )}

                <div className="action-buttons">

                  <button
                    className="edit-button"
                    onClick={() =>
                      navigate(
                        `/edit-lab-program/${item._id}`
                      )
                    }
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteResource(
                        "lab-programs",
                        item._id
                      )
                    }
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}

export default ManageResources;