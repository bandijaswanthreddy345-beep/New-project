import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    notes: 0,
    papers: 0,
    syllabus: 0,
    notifications: 0,
    labPrograms: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/dashboard/stats");

      setStats({
        users: res.data.users || 0,
        notes: res.data.notes || 0,
        papers: res.data.papers || 0,
        syllabus: res.data.syllabus || 0,
        notifications: res.data.notifications || 0,
        labPrograms: res.data.labPrograms || 0,
      });
    } catch (err) {
      console.log("Dashboard Stats Error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert("Logged out successfully!");

    navigate("/login");
  };

  return (
    <div className="dashboard-page">

      {/* =========================
          DASHBOARD HEADER
      ========================== */}

      <div className="dashboard-header">

        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage JNTU Circle resources and users.</p>
        </div>

        <button
          onClick={handleLogout}
          className="dashboard-logout-button"
        >
          🚪 Logout
        </button>

      </div>

      {/* =========================
          STATISTICS
      ========================== */}

      <section className="dashboard-section">

        <h2>Statistics</h2>

        <div className="dashboard-stats-grid">

          {/* Users */}

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              👥
            </div>

            <div>
              <h3>{stats.users}</h3>
              <p>Total Users</p>
            </div>
          </div>

          {/* Notes */}

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              📝
            </div>

            <div>
              <h3>{stats.notes}</h3>
              <p>Notes</p>
            </div>
          </div>

          {/* Question Papers */}

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              📚
            </div>

            <div>
              <h3>{stats.papers}</h3>
              <p>Question Papers</p>
            </div>
          </div>

          {/* Syllabus */}

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              📖
            </div>

            <div>
              <h3>{stats.syllabus}</h3>
              <p>Syllabus</p>
            </div>
          </div>

          {/* Notifications */}

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              🔔
            </div>

            <div>
              <h3>{stats.notifications}</h3>
              <p>Notifications</p>
            </div>
          </div>

          {/* Lab Programs */}

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              💻
            </div>

            <div>
              <h3>{stats.labPrograms}</h3>
              <p>Lab Programs</p>
            </div>
          </div>

        </div>

      </section>

      {/* =========================
          ADMIN OPTIONS
      ========================== */}

      <section className="dashboard-section">

        <h2>Admin Options</h2>

        <div className="dashboard-options-grid">

          {/* Upload Note */}

          <Link
            to="/upload-note"
            className="dashboard-option-card"
          >
            <span>📝</span>

            <div>
              <h3>Upload Notes</h3>
              <p>Add new study notes.</p>
            </div>
          </Link>

          {/* Upload Question Paper */}

          <Link
            to="/upload-paper"
            className="dashboard-option-card"
          >
            <span>📄</span>

            <div>
              <h3>Upload Question Papers</h3>
              <p>Add previous examination papers.</p>
            </div>
          </Link>

          {/* Upload Syllabus */}

          <Link
            to="/upload-syllabus"
            className="dashboard-option-card"
          >
            <span>📚</span>

            <div>
              <h3>Upload Syllabus</h3>
              <p>Add syllabus information.</p>
            </div>
          </Link>

          {/* Upload Notifications */}

          <Link
            to="/upload-notification"
            className="dashboard-option-card"
          >
            <span>🔔</span>

            <div>
              <h3>Upload Notifications</h3>
              <p>Add important announcements.</p>
            </div>
          </Link>

          {/* Upload Lab Programs */}

          <Link
            to="/upload-lab-program"
            className="dashboard-option-card"
          >
            <span>💻</span>

            <div>
              <h3>Upload Lab Programs</h3>
              <p>Add laboratory programs.</p>
            </div>
          </Link>

          {/* Manage Resources */}

          <Link
            to="/manage-resources"
            className="dashboard-option-card"
          >
            <span>⚙️</span>

            <div>
              <h3>Manage Resources</h3>
              <p>Edit or delete resources.</p>
            </div>
          </Link>

          {/* Manage Users */}

          <Link
            to="/manage-users"
            className="dashboard-option-card"
          >
            <span>👥</span>

            <div>
              <h3>Manage Users</h3>
              <p>View and manage registered users.</p>
            </div>
          </Link>

        </div>

      </section>

      {/* =========================
          BACK TO HOME
      ========================== */}

      <div className="dashboard-home-button">

        <button
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Dashboard;

