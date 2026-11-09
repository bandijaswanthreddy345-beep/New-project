import React from "react";
import { useNavigate } from "react-router-dom";
import "./StudentProfileModal.css";
import {
  getStoredStudentData,
  getStudentAvatar,
  DEFAULT_STUDENT_AVATAR,
  cleanCollege,
  cleanSemester,
} from "../data/studentData";

function StudentProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  const navigate = useNavigate();

  const student = getStoredStudentData();
  const isConfigured = Boolean(student && student.isConfigured && student.name?.trim());
  const avatar = getStudentAvatar(student);

  // Sanitized display values (avoiding accidental query string repetitions)
  const sanitize = (val, fallback = "—") => {
    if (!val || typeof val !== "string") return fallback;
    const clean = val.trim();
    if (clean.toLowerCase().includes("build your student profile")) {
      return fallback;
    }
    return clean || fallback;
  };

  const displayName = sanitize(student.name, "Student");
  const displayBranch = sanitize(student.branch, "Engineering");
  const displayHallTicket = sanitize(student.hallTicket, "—");
  const displayYear = sanitize(student.year, "1st Year");
  const displaySemester = cleanSemester(sanitize(student.semester, "1st Semester"));
  const displayRegulation = sanitize(student.regulation, "R23 Regulation");
  const displayCgpa = student.cgpa && !isNaN(student.cgpa) ? student.cgpa : "—";
  const displayAttendance = student.attendance || "—";
  const displayCollege = cleanCollege(sanitize(student.college, "JNTU College of Engineering"));

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

        {!isConfigured ? (
          <div style={{ padding: "28px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "38px", display: "block", marginBottom: "10px" }}>🎓</span>
            <h3 style={{ margin: "0 0 6px", fontSize: "18px", color: "#013a33", fontWeight: "800" }}>
              No Active Profile Configured
            </h3>
            <p style={{ fontSize: "13px", color: "#557973", margin: "0 0 20px", lineHeight: "1.5" }}>
              Set up your student academic profile with attendance tracking, SGPA matrix, and personalized details.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="sp-preview-done-btn"
                style={{ background: "#e2e8f0", color: "#334155" }}
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="sp-preview-done-btn"
                style={{ background: "#013a33", color: "#ffffff" }}
                onClick={() => {
                  onClose();
                  navigate("/profile");
                }}
              >
                Create Profile →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Student Profile Info Section */}
            <div className="sp-preview-user-row">
              <div className="sp-preview-avatar-wrap">
                <img
                  src={avatar || DEFAULT_STUDENT_AVATAR}
                  alt={displayName}
                  className="sp-preview-avatar"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
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
                <span className="sp-pd-value">{student.university || "JNT University"}</span>
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
          </>
        )}
      </div>
    </div>
  );
}

export default StudentProfileModal;
