import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import profileImg from "../assets/jaswanth.png.png";
import "./StudentProfileModal.css";

import { getStoredStudentData, saveStoredStudentData } from "../data/studentData";

function StudentProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const navigate = useNavigate();
  const [student, setStudent] = useState(getStoredStudentData());
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "grades" | "notes" | "edit"
  const [editForm, setEditForm] = useState(student);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getStoredStudentData();
      setStudent(current);
      setEditForm(current);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    if (onProfileUpdated) onProfileUpdated(updated);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab("overview");
    }, 1000);
  };

  const handleOpenFullPage = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sp-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Top Decorative Header Banner */}
        <div className="sp-modal-banner">
          <div className="sp-banner-glow" />
          <div className="sp-banner-content">
            <div className="sp-banner-brand">
              <img src="/jntu-circle-logo.png" alt="JNTU Circle" className="sp-banner-logo" />
              <div>
                <span className="sp-banner-title">JNTU CIRCLE</span>
                <span className="sp-banner-tag">OFFICIAL STUDENT PORTAL</span>
              </div>
            </div>

            <div className="sp-banner-actions">
              <button 
                type="button" 
                className="sp-banner-btn" 
                onClick={handleOpenFullPage}
                title="Open in Dedicated Full Page"
              >
                Full Page ↗
              </button>
              <button 
                type="button" 
                className="sp-close-btn" 
                onClick={onClose}
                title="Close Profile"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Student Identity Card Bar */}
        <div className="sp-identity-card">
          <div className="sp-avatar-wrapper">
            <img src={profileImg} alt={student.name} className="sp-avatar-img" />
            <span className="sp-status-indicator" title="Active Student Status" />
          </div>

          <div className="sp-identity-text">
            <div className="sp-name-row">
              <h2 className="sp-student-name">{student.name}</h2>
              <span className="sp-verified-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Verified Student
              </span>
            </div>
            
            <p className="sp-sub-info">
              <span className="sp-roll-pill">{student.hallTicket}</span>
              <span className="sp-dot-sep">•</span>
              <span className="sp-degree">{student.branch} ({student.branchCode})</span>
              <span className="sp-dot-sep">•</span>
              <span className="sp-year-badge">{student.year} ({student.semester})</span>
            </p>
          </div>

          <div className="sp-identity-quick-btn">
            <button 
              type="button" 
              className={`sp-edit-toggle-btn ${activeTab === "edit" ? "active" : ""}`}
              onClick={() => setActiveTab(activeTab === "edit" ? "overview" : "edit")}
            >
              {activeTab === "edit" ? "View Overview" : "Edit Profile ✎"}
            </button>
          </div>
        </div>

        {/* Quick Academic Key Metrics (CGPA, Attendance, Credits, Regulation) */}
        <div className="sp-metrics-grid">
          <div className="sp-metric-tile">
            <span className="sp-metric-label">CUMULATIVE CGPA</span>
            <div className="sp-metric-val sp-gold">{student.cgpa} <span className="sp-metric-max">/ 10.0</span></div>
            <span className="sp-metric-sub">Top 5% in Department</span>
          </div>

          <div className="sp-metric-tile">
            <span className="sp-metric-label">OVERALL ATTENDANCE</span>
            <div className="sp-metric-val sp-emerald">{student.attendance}</div>
            <span className="sp-metric-sub">Exams Eligible (≥ 75%)</span>
          </div>

          <div className="sp-metric-tile">
            <span className="sp-metric-label">CREDITS COMPLETED</span>
            <div className="sp-metric-val">{student.credits}</div>
            <span className="sp-metric-sub">82.5% Degree Progress</span>
          </div>

          <div className="sp-metric-tile">
            <span className="sp-metric-label">REGULATION & BATCH</span>
            <div className="sp-metric-val sp-reg">{student.regulation}</div>
            <span className="sp-metric-sub">{student.batch} Batch</span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="sp-tabs-nav">
          <button 
            type="button" 
            className={`sp-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            🎓 Academic Details
          </button>
          <button 
            type="button" 
            className={`sp-tab-btn ${activeTab === "grades" ? "active" : ""}`}
            onClick={() => setActiveTab("grades")}
          >
            📊 Semester Grades (SGPA)
          </button>
          <button 
            type="button" 
            className={`sp-tab-btn ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            📚 Saved Study Notes ({student.savedNotes?.length || 0})
          </button>
          <button 
            type="button" 
            className={`sp-tab-btn ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            ⚙️ Edit Information
          </button>
        </div>

        {/* Modal Body Panels */}
        <div className="sp-modal-body">

          {/* TAB 1: ACADEMIC DETAILS OVERVIEW */}
          {activeTab === "overview" && (
            <div className="sp-tab-panel">
              <div className="sp-details-grid">
                <div className="sp-detail-row">
                  <span className="sp-label">College / Institute:</span>
                  <span className="sp-value">{student.college}</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Affiliated University:</span>
                  <span className="sp-value">{student.university}</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Department & Branch:</span>
                  <span className="sp-value">{student.branch} ({student.branchCode})</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Hall Ticket Number:</span>
                  <span className="sp-value sp-code">{student.hallTicket}</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Current Academic Level:</span>
                  <span className="sp-value">{student.year} • {student.semester}</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Curriculum Regulation:</span>
                  <span className="sp-value">{student.regulation}</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Student Institutional Email:</span>
                  <span className="sp-value sp-link">{student.email}</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Contact Mobile:</span>
                  <span className="sp-value">{student.phone}</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Faculty Academic Mentor:</span>
                  <span className="sp-value">{student.mentor}</span>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-label">Academic Status:</span>
                  <span className="sp-value sp-status-ok">● Active Enrolled Student in Good Standing</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEMESTER GRADES (SGPA TRACKER) */}
          {activeTab === "grades" && (
            <div className="sp-tab-panel">
              <div className="sp-grades-intro">
                <div>
                  <h4 className="sp-section-heading">Semester Performance History</h4>
                  <p className="sp-section-desc">Track your semester grade point average (SGPA) and completed course credits.</p>
                </div>
                <div className="sp-cgpa-badge">
                  <span>OVERALL CGPA</span>
                  <strong>{student.cgpa}</strong>
                </div>
              </div>

              <div className="sp-grades-table-wrapper">
                <table className="sp-grades-table">
                  <thead>
                    <tr>
                      <th>Semester</th>
                      <th>Credits</th>
                      <th>SGPA Score</th>
                      <th>Status / Recognition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.semesterGrades.map((g, idx) => (
                      <tr key={idx} className={g.status === "Active Sem" ? "current-row" : ""}>
                        <td className="sp-td-sem"><strong>{g.sem}</strong></td>
                        <td>{g.credits} Credits</td>
                        <td className="sp-td-sgpa">
                          {g.sgpa === "In Progress" ? (
                            <span className="sp-in-progress-tag">In Progress</span>
                          ) : (
                            <span className="sp-sgpa-num">{g.sgpa}</span>
                          )}
                        </td>
                        <td>
                          <span className={`sp-result-pill ${g.status === "Top 3 Rank" || g.status === "Top 5 Rank" ? "gold" : ""}`}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED STUDY NOTES */}
          {activeTab === "notes" && (
            <div className="sp-tab-panel">
              <div className="sp-saved-notes-header">
                <h4 className="sp-section-heading">Saved Academic Notes & Modules</h4>
                <p className="sp-section-desc">Quickly access study materials bookmarked for quick revision.</p>
              </div>

              <div className="sp-saved-notes-list">
                {student.savedNotes && student.savedNotes.length > 0 ? (
                  student.savedNotes.map((note) => (
                    <div key={note.id} className="sp-note-card">
                      <div className="sp-note-left">
                        <div className="sp-note-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="sp-note-title">{note.title}</h4>
                          <p className="sp-note-meta">
                            <span className="sp-note-badge">{note.branch}</span>
                            <span className="sp-note-badge">{note.sem}</span>
                            <span>• {note.units}</span>
                            <span>• {note.faculty}</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="sp-note-access-btn"
                        onClick={() => {
                          onClose();
                          navigate(`/notes?branch=${note.branch}`);
                        }}
                      >
                        Study Now →
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="sp-empty-text">No notes saved yet. Browse the notes directory to save resources.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EDIT PROFILE DETAILS */}
          {activeTab === "edit" && (
            <div className="sp-tab-panel">
              <form onSubmit={handleSaveProfile} className="sp-edit-form">
                {saveSuccess && (
                  <div className="sp-save-success-alert">
                    ✓ Profile updated successfully! Changes saved locally.
                  </div>
                )}

                <div className="sp-form-grid">
                  <div className="sp-field">
                    <label>Full Student Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={editForm.name} 
                      onChange={handleEditChange} 
                      required 
                    />
                  </div>

                  <div className="sp-field">
                    <label>Hall Ticket / Roll Number</label>
                    <input 
                      type="text" 
                      name="hallTicket" 
                      value={editForm.hallTicket} 
                      onChange={handleEditChange} 
                      required 
                    />
                  </div>

                  <div className="sp-field">
                    <label>Department & Branch</label>
                    <input 
                      type="text" 
                      name="branch" 
                      value={editForm.branch} 
                      onChange={handleEditChange} 
                      required 
                    />
                  </div>

                  <div className="sp-field">
                    <label>Branch Short Code</label>
                    <input 
                      type="text" 
                      name="branchCode" 
                      value={editForm.branchCode} 
                      onChange={handleEditChange} 
                      required 
                    />
                  </div>

                  <div className="sp-field">
                    <label>Year of Study</label>
                    <input 
                      type="text" 
                      name="year" 
                      value={editForm.year} 
                      onChange={handleEditChange} 
                    />
                  </div>

                  <div className="sp-field">
                    <label>Semester</label>
                    <input 
                      type="text" 
                      name="semester" 
                      value={editForm.semester} 
                      onChange={handleEditChange} 
                    />
                  </div>

                  <div className="sp-field">
                    <label>Regulation</label>
                    <input 
                      type="text" 
                      name="regulation" 
                      value={editForm.regulation} 
                      onChange={handleEditChange} 
                    />
                  </div>

                  <div className="sp-field">
                    <label>CGPA</label>
                    <input 
                      type="text" 
                      name="cgpa" 
                      value={editForm.cgpa} 
                      onChange={handleEditChange} 
                    />
                  </div>

                  <div className="sp-field sp-col-span-2">
                    <label>College / Institution Name</label>
                    <input 
                      type="text" 
                      name="college" 
                      value={editForm.college} 
                      onChange={handleEditChange} 
                    />
                  </div>

                  <div className="sp-field">
                    <label>Institutional Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={editForm.email} 
                      onChange={handleEditChange} 
                    />
                  </div>

                  <div className="sp-field">
                    <label>Contact Mobile Number</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={editForm.phone} 
                      onChange={handleEditChange} 
                    />
                  </div>
                </div>

                <div className="sp-form-actions">
                  <button 
                    type="button" 
                    className="sp-btn-cancel" 
                    onClick={() => setActiveTab("overview")}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="sp-btn-save">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="sp-modal-footer">
          <span className="sp-footer-note">
            JNTU Circle Student Academic Record • Encrypted & Secure
          </span>
          <button 
            type="button" 
            className="sp-footer-close-btn"
            onClick={onClose}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

export default StudentProfileModal;
