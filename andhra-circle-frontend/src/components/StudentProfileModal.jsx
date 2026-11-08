import React from "react";
import profileImg from "../assets/jaswanth.png.png";
import "./StudentProfileModal.css";
import { getStoredStudentData } from "../data/studentData";

function StudentProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const student = getStoredStudentData();
  const avatar =
    student.profilePhoto && student.profilePhoto !== "none"
      ? student.profilePhoto
      : profileImg;

  // Sanitized display values (avoiding accidental query string repetitions)
  const sanitize = (val, fallback = "—") => {
    if (!val || typeof val !== "string") return fallback;
    const clean = val.trim();
    if (clean.toLowerCase().includes("build your student profile")) {
      return fallback;
    }
    return clean || fallback;
  };

  const displayName = sanitize(student.name, "Chinnu");
  const displayBranch = sanitize(student.branch, "Computer Science & Engineering");
  const displayHallTicket = sanitize(student.hallTicket, "22131A0501");
  const displayYear = sanitize(student.year, "3rd Year");
  const displaySemester = sanitize(student.semester, "1st Semester");
  const displayRegulation = sanitize(student.regulation, "R20 Regulation");
  const displayCgpa = student.cgpa && !isNaN(student.cgpa) ? student.cgpa : "8.88";
  const displayAttendance = student.attendance || "75%";
  const displayCollege = sanitize(student.college, "JNTU College of Engineering (Autonomous)");

  return (
    <div className="sp-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sp-preview-card" onClick={(e) => e.stopPropagation()}>
        {/* Card Header */}
        <div className="sp-preview-header">
          <div className="sp-preview-brand">
            <img src="/jntu-circle-logo.png" alt="JNTU Circle" className="sp-preview-logo" />
            <div>
              <span className="sp-preview-portal">JNTU CIRCLE</span>
              <span className="sp-preview-badge">Student Profile</span>
            </div>
          </div>
        </div>

        {/* Student Profile Info Section */}
        <div className="sp-preview-user-row">
          <div className="sp-preview-avatar-wrap">
            <img
              src={avatar}
              alt={displayName}
              className="sp-preview-avatar"
              onError={(e) => {
                e.currentTarget.src = profileImg;
              }}
            />
            <span className="sp-preview-status-dot" />
          </div>

          <div className="sp-preview-user-meta">
            <div className="sp-preview-name-row">
              <h3 className="sp-preview-name">{displayName}</h3>
            </div>
            <p className="sp-preview-branch">{displayBranch}</p>
            <p className="sp-preview-academic-meta">
              <span>{displayYear} • {displaySemester}</span>
              <span className="sp-meta-sep">•</span>
              <span className="sp-meta-ht">{displayHallTicket}</span>
            </p>
          </div>
        </div>

        {/* Core Academic Metric Highlights */}
        <div className="sp-preview-metrics">
          <div className="sp-preview-metric-box sp-metric-highlight">
            <span className="sp-p-metric-label">CGPA</span>
            <span className="sp-p-metric-value">{displayCgpa} <small>/10</small></span>
            <span className="sp-p-metric-sub">Academic Standing</span>
          </div>

          <div className="sp-preview-metric-box">
            <span className="sp-p-metric-label">ATTENDANCE</span>
            <span className="sp-p-metric-value sp-emerald-val">{displayAttendance}</span>
            <span className="sp-p-metric-sub">Exam Eligible</span>
          </div>

          <div className="sp-preview-metric-box">
            <span className="sp-p-metric-label">REGULATION</span>
            <span className="sp-p-metric-value">{displayRegulation}</span>
            <span className="sp-p-metric-sub">Curriculum</span>
          </div>
        </div>

        {/* Concise Academic Details Strip */}
        <div className="sp-preview-details-list">
          <div className="sp-preview-detail-item">
            <span className="sp-pd-label">College</span>
            <span className="sp-pd-value">{displayCollege}</span>
          </div>
          <div className="sp-preview-detail-item">
            <span className="sp-pd-label">University</span>
            <span className="sp-pd-value">{student.university || "Jawaharlal Nehru Technological University"}</span>
          </div>
          <div className="sp-preview-detail-item">
            <span className="sp-pd-label">Hall Ticket No</span>
            <span className="sp-pd-value sp-pd-code">{displayHallTicket}</span>
          </div>
        </div>

        {/* Clean Footer Bar */}
        <div className="sp-preview-footer">
          <span className="sp-preview-footer-note">
            JNTU Circle Student Academic Record
          </span>
          <button
            type="button"
            className="sp-preview-done-btn"
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
