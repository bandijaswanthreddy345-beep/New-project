import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import profileImg from "../assets/jaswanth.png.png";
import {
  DEFAULT_STUDENT_DATA,
  getStoredStudentData,
  saveStoredStudentData,
} from "../data/studentData";
import "./StudentProfile.css";

function StudentProfile() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(getStoredStudentData());
  const [activeTab, setActiveTab] = useState("overview");
  const [editForm, setEditForm] = useState(student);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const current = getStoredStudentData();
    setStudent(current);
    setEditForm(current);
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...student,
      ...editForm,
      shortName: editForm.name.split(" ")[0] || "Chinnu",
    };
    saveStoredStudentData(updated);
    setStudent(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab("overview");
    }, 1200);
  };

  return (
    <div className="student-profile-page">
      {/* Top Navigation Bar */}
      <header className="sp-page-header">
        <div className="sp-page-header-inner">
          <div className="sp-header-left" onClick={() => navigate("/")} title="Return to Homepage">
            <img src="/jntu-circle-logo.png" alt="JNTU Circle" className="sp-page-logo" />
            <div>
              <h2 className="sp-brand-title"><span className="font-deltha">JNTU</span> Circle</h2>
              <span className="sp-brand-subtitle">Student Academic Portal</span>
            </div>
          </div>

          <div className="sp-header-right">
            <button 
              type="button" 
              className="sp-header-nav-btn" 
              onClick={() => navigate("/notes")}
            >
              ← Back to Notes Portal
            </button>
            <button 
              type="button" 
              className="sp-header-home-btn" 
              onClick={() => navigate("/")}
            >
              Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="sp-page-main">
        <div className="sp-page-card">

          {/* Academic Cover Banner */}
          <div className="sp-page-banner">
            <div className="sp-page-banner-glow" />
            <div className="sp-banner-eyebrow">
              <span className="sp-academic-year">AY 2024–25</span>
            </div>
          </div>

          {/* Identity Bar (Clean Layout: Avatar elevated, details 100% on white card) */}
          <div className="sp-page-identity">
            <div className="sp-avatar-holder">
              <img src={profileImg} alt={student.name} className="sp-profile-photo" />
              <span className="sp-online-dot" title="Active Enrolled Status" />
            </div>

            <div className="sp-identity-details">
              <div className="sp-name-badge-row">
                <h1 className="sp-main-name">{student.name}</h1>
                <span className="sp-verified-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  Verified Student
                </span>
              </div>
              <p className="sp-main-subtext">
                <strong className="sp-main-roll">{student.hallTicket}</strong>
                <span className="sp-dot-separator">•</span>
                <span>{student.branch}</span>
                <span className="sp-dot-separator">•</span>
                <span className="sp-highlight-gold">{student.year} ({student.semester})</span>
              </p>
            </div>

            <div className="sp-identity-actions">
              <button 
                type="button" 
                className={`sp-btn-action-primary ${activeTab === "edit" ? "active" : ""}`}
                onClick={() => setActiveTab(activeTab === "edit" ? "overview" : "edit")}
              >
                {activeTab === "edit" ? "View Overview" : "Edit Profile ✎"}
              </button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="sp-page-metrics">
            <div className="sp-p-metric">
              <div className="sp-metric-header">
                <span className="sp-pm-label">CUMULATIVE CGPA</span>
                <svg className="sp-metric-icon sp-icon-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="sp-pm-val sp-gold">{student.cgpa} <span className="sp-pm-max">/ 10.0</span></div>
              <span className="sp-pm-desc">Top 5% of Department</span>
            </div>

            <div className="sp-p-metric">
              <div className="sp-metric-header">
                <span className="sp-pm-label">TOTAL ATTENDANCE</span>
                <svg className="sp-metric-icon sp-icon-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="sp-pm-val sp-emerald">{student.attendance}</div>
              <span className="sp-pm-desc">Exam Hall Ticket Eligible</span>
            </div>

            <div className="sp-p-metric">
              <div className="sp-metric-header">
                <span className="sp-pm-label">COMPLETED CREDITS</span>
                <svg className="sp-metric-icon sp-icon-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div className="sp-pm-val">{student.credits} <span className="sp-pm-max">/ 160</span></div>
              <span className="sp-pm-desc">82.5% Degree Complete</span>
            </div>

            <div className="sp-p-metric">
              <div className="sp-metric-header">
                <span className="sp-pm-label">REGULATION & BATCH</span>
                <svg className="sp-metric-icon sp-icon-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div className="sp-pm-val sp-reg">{student.regulation}</div>
              <span className="sp-pm-desc">{student.batch} Batch</span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="sp-page-tabs">
            <button 
              type="button" 
              className={`sp-page-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              🎓 Academic Details
            </button>
            <button 
              type="button" 
              className={`sp-page-tab ${activeTab === "grades" ? "active" : ""}`}
              onClick={() => setActiveTab("grades")}
            >
              📊 Semester Grade Card (SGPA)
            </button>
            <button 
              type="button" 
              className={`sp-page-tab ${activeTab === "notes" ? "active" : ""}`}
              onClick={() => setActiveTab("notes")}
            >
              📚 Saved Study Notes ({student.savedNotes?.length || 0})
            </button>
            <button 
              type="button" 
              className={`sp-page-tab ${activeTab === "edit" ? "active" : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              ⚙️ Edit Profile Information
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="sp-page-content">

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="sp-tab-fade">
                <div className="sp-info-grid">
                  <div className="sp-info-card">
                    <span className="sp-info-label">College / Institution</span>
                    <span className="sp-info-data">{student.college}</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Affiliated University</span>
                    <span className="sp-info-data">{student.university}</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Department</span>
                    <span className="sp-info-data">{student.branch} ({student.branchCode})</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Hall Ticket Number</span>
                    <span className="sp-info-data font-mono">{student.hallTicket}</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Academic Level</span>
                    <span className="sp-info-data">{student.year} • {student.semester}</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Curriculum Regulation</span>
                    <span className="sp-info-data">{student.regulation}</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Student Institutional Email</span>
                    <span className="sp-info-data sp-text-link">{student.email}</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Contact Phone</span>
                    <span className="sp-info-data">{student.phone}</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Academic Faculty Mentor</span>
                    <span className="sp-info-data">{student.mentor}</span>
                  </div>
                  <div className="sp-info-card">
                    <span className="sp-info-label">Enrollment Status</span>
                    <span className="sp-info-data sp-text-success">
                      <span className="sp-status-active-dot" />
                      Active Enrolled Student
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GRADES */}
            {activeTab === "grades" && (
              <div className="sp-tab-fade">
                <div className="sp-card-box">
                  <div className="sp-card-box-header">
                    <div>
                      <h3 className="sp-box-title">Semester Performance Summary</h3>
                      <p className="sp-box-subtitle">Official semester grade point averages (SGPA) and awarded credits.</p>
                    </div>
                    <div className="sp-cgpa-display">
                      <span>CUMULATIVE CGPA</span>
                      <strong>{student.cgpa} / 10.0</strong>
                    </div>
                  </div>

                  <table className="sp-full-table">
                    <thead>
                      <tr>
                        <th>Semester</th>
                        <th>Registered Credits</th>
                        <th>SGPA Score</th>
                        <th>Academic Classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.semesterGrades.map((grade, index) => (
                        <tr key={index} className={grade.status === "Active Sem" ? "row-highlight" : ""}>
                          <td><strong>{grade.sem}</strong></td>
                          <td>{grade.credits} Credits</td>
                          <td className="sp-td-score">
                            {grade.sgpa === "In Progress" ? (
                              <span className="sp-score-tag">In Progress</span>
                            ) : (
                              <span className="sp-score-num">{grade.sgpa}</span>
                            )}
                          </td>
                          <td>
                            <span className={`sp-badge-status ${grade.status.includes("Top") ? "gold" : ""}`}>
                              {grade.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: SAVED NOTES */}
            {activeTab === "notes" && (
              <div className="sp-tab-fade">
                <div className="sp-notes-stack">
                  {student.savedNotes && student.savedNotes.length > 0 ? (
                    student.savedNotes.map((note) => (
                      <div key={note.id} className="sp-saved-note-row">
                        <div className="sp-note-meta-col">
                          <span className="sp-note-badge-branch">{note.branch}</span>
                          <span className="sp-note-badge-sem">{note.sem}</span>
                          <h4 className="sp-note-h">{note.title}</h4>
                          <span className="sp-note-subdetails">{note.units} • Instructor: {note.faculty}</span>
                        </div>
                        <button 
                          type="button" 
                          className="sp-btn-view-material"
                          onClick={() => navigate(`/notes?branch=${note.branch}`)}
                        >
                          View Notes Portal →
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="sp-empty-notice">No study materials saved yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: EDIT PROFILE */}
            {activeTab === "edit" && (
              <div className="sp-tab-fade">
                <form onSubmit={handleSaveProfile} className="sp-form-container">
                  {saveSuccess && (
                    <div className="sp-alert-success">
                      ✓ Profile successfully updated and saved locally!
                    </div>
                  )}

                  <div className="sp-form-row-2">
                    <div className="sp-input-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={editForm.name} 
                        onChange={handleEditChange} 
                        required 
                      />
                    </div>

                    <div className="sp-input-group">
                      <label>Hall Ticket / Roll No.</label>
                      <input 
                        type="text" 
                        name="hallTicket" 
                        value={editForm.hallTicket} 
                        onChange={handleEditChange} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="sp-form-row-2">
                    <div className="sp-input-group">
                      <label>Department & Branch</label>
                      <input 
                        type="text" 
                        name="branch" 
                        value={editForm.branch} 
                        onChange={handleEditChange} 
                        required 
                      />
                    </div>

                    <div className="sp-input-group">
                      <label>Branch Short Code</label>
                      <input 
                        type="text" 
                        name="branchCode" 
                        value={editForm.branchCode} 
                        onChange={handleEditChange} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="sp-form-row-2">
                    <div className="sp-input-group">
                      <label>Academic Year</label>
                      <input 
                        type="text" 
                        name="year" 
                        value={editForm.year} 
                        onChange={handleEditChange} 
                      />
                    </div>

                    <div className="sp-input-group">
                      <label>Current Semester</label>
                      <input 
                        type="text" 
                        name="semester" 
                        value={editForm.semester} 
                        onChange={handleEditChange} 
                      />
                    </div>
                  </div>

                  <div className="sp-form-row-2">
                    <div className="sp-input-group">
                      <label>Curriculum Regulation</label>
                      <input 
                        type="text" 
                        name="regulation" 
                        value={editForm.regulation} 
                        onChange={handleEditChange} 
                      />
                    </div>

                    <div className="sp-input-group">
                      <label>Cumulative CGPA</label>
                      <input 
                        type="text" 
                        name="cgpa" 
                        value={editForm.cgpa} 
                        onChange={handleEditChange} 
                      />
                    </div>
                  </div>

                  <div className="sp-input-group">
                    <label>College / Institution</label>
                    <input 
                      type="text" 
                      name="college" 
                      value={editForm.college} 
                      onChange={handleEditChange} 
                    />
                  </div>

                  <div className="sp-form-row-2">
                    <div className="sp-input-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={editForm.email} 
                        onChange={handleEditChange} 
                      />
                    </div>

                    <div className="sp-input-group">
                      <label>Contact Phone</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={editForm.phone} 
                        onChange={handleEditChange} 
                      />
                    </div>
                  </div>

                  <div className="sp-form-footer-actions">
                    <button 
                      type="button" 
                      className="sp-btn-text" 
                      onClick={() => setActiveTab("overview")}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="sp-btn-submit">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}

export default StudentProfile;
