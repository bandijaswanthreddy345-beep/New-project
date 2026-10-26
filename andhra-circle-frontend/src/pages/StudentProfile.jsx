import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import profileImgDefault from "../assets/jaswanth.png.png";
import {
  EMPTY_STUDENT_DATA,
  INITIAL_SEMESTERS,
  getStoredStudentData,
  saveStoredStudentData,
  logoutStudentProfile,
  calculateCgpaFromGrades,
} from "../data/studentData";
import "./StudentProfile.css";

const POPULAR_BRANCHES = [
  { name: "Computer Science & Engineering", code: "CSE" },
  { name: "Artificial Intelligence & Machine Learning", code: "AI & ML" },
  { name: "Artificial Intelligence & Data Science", code: "AI & DS" },
  { name: "Electronics & Communication Engineering", code: "ECE" },
  { name: "Electrical & Electronics Engineering", code: "EEE" },
  { name: "Mechanical Engineering", code: "MECH" },
  { name: "Civil Engineering", code: "CIVIL" },
  { name: "Information Technology", code: "IT" },
];

function StudentProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const [student, setStudent] = useState(getStoredStudentData());
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "grades" | "attendance" | "notes" | "edit"
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close kebab dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Creation Form State for fresh users
  const [createForm, setCreateForm] = useState({
    name: "",
    branch: "Computer Science & Engineering",
    branchCode: "CSE",
    customBranch: "",
    hallTicket: "",
    college: "",
    email: "",
    phone: "",
    year: "1st Year",
    semester: "1st Semester",
    regulation: "R23 Regulation",
    attendancePercentage: 82,
    profilePhoto: null,
    semesterGrades: INITIAL_SEMESTERS.map((s) => ({ ...s, sgpa: "" })),
  });

  // Edit Form State for existing users
  const [editForm, setEditForm] = useState(student);

  // Sync state on mount and when storage updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      const current = getStoredStudentData();
      setStudent(current);
      setEditForm(current);
    };

    const current = getStoredStudentData();
    setStudent(current);
    setEditForm(current);

    window.addEventListener("studentProfileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("studentProfileUpdated", handleProfileUpdate);
  }, []);

  // Update edit form when student data changes
  useEffect(() => {
    setEditForm(student);
  }, [student]);

  // Handle Photo Upload via FileReader
  const handlePhotoUpload = (e, targetForm = "create") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Photo file size is too large (maximum 4MB). Please select a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      if (targetForm === "create") {
        setCreateForm((prev) => ({ ...prev, profilePhoto: base64Data }));
      } else {
        setEditForm((prev) => ({ ...prev, profilePhoto: base64Data }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (targetForm = "create") => {
    if (targetForm === "create") {
      setCreateForm((prev) => ({ ...prev, profilePhoto: "none" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setEditForm((prev) => ({ ...prev, profilePhoto: "none" }));
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      const updated = {
        ...student,
        profilePhoto: "none",
      };
      saveStoredStudentData(updated);
      setStudent(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Creation form change handler
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    if (name === "branchSelect") {
      if (value === "OTHER") {
        setCreateForm((prev) => ({ ...prev, branch: "", branchCode: "OTHER" }));
      } else {
        const found = POPULAR_BRANCHES.find((b) => b.code === value);
        if (found) {
          setCreateForm((prev) => ({
            ...prev,
            branch: found.name,
            branchCode: found.code,
          }));
        }
      }
      return;
    }
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  // Creation semester grade change handler
  const handleCreateSemGradeChange = (semIndex, sgpaVal) => {
    setCreateForm((prev) => {
      const updatedGrades = [...prev.semesterGrades];
      const numericVal = sgpaVal.trim();
      updatedGrades[semIndex] = {
        ...updatedGrades[semIndex],
        sgpa: numericVal,
        status: numericVal && !isNaN(numericVal) ? "Completed" : "Not Started",
      };
      return { ...prev, semesterGrades: updatedGrades };
    });
  };

  // Edit form change handler
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Edit semester grade change handler
  const handleEditSemGradeChange = (semIndex, sgpaVal) => {
    setEditForm((prev) => {
      const updatedGrades = [...(prev.semesterGrades || INITIAL_SEMESTERS)];
      const numericVal = sgpaVal.trim();
      updatedGrades[semIndex] = {
        ...updatedGrades[semIndex],
        sgpa: numericVal,
        status: numericVal && !isNaN(numericVal) ? "Completed" : "Not Started",
      };
      return { ...prev, semesterGrades: updatedGrades };
    });
  };

  // Create Profile Submission
  const handleCreateProfileSubmit = (e) => {
    e.preventDefault();

    if (!createForm.name.trim()) {
      alert("Please enter your full name.");
      return;
    }
    if (!createForm.hallTicket.trim()) {
      alert("Please enter your USN / Hall Ticket Number.");
      return;
    }

    const calculatedCgpa = calculateCgpaFromGrades(createForm.semesterGrades);
    const filledSems = createForm.semesterGrades.filter((g) => g.sgpa && !isNaN(g.sgpa)).length;
    const completedCredits = filledSems * 20;

    const newProfile = {
      ...EMPTY_STUDENT_DATA,
      name: createForm.name.trim(),
      shortName: createForm.name.trim().split(" ")[0] || "Student",
      hallTicket: createForm.hallTicket.trim().toUpperCase(),
      branch: createForm.branch || "Computer Science & Engineering",
      branchCode: createForm.branchCode || "CSE",
      college: createForm.college.trim() || "JNTU Affiliated Institution",
      email: createForm.email.trim(),
      phone: createForm.phone.trim(),
      year: createForm.year || "1st Year",
      semester: createForm.semester || "1st Semester",
      regulation: createForm.regulation || "R23 Regulation",
      attendancePercentage: Number(createForm.attendancePercentage) || 75,
      attendance: `${Number(createForm.attendancePercentage) || 75}%`,
      profilePhoto: createForm.profilePhoto,
      semesterGrades: createForm.semesterGrades,
      cgpa: calculatedCgpa || "0.00",
      credits: `${completedCredits} / 160`,
      isConfigured: true,
    };

    saveStoredStudentData(newProfile);
    setStudent(newProfile);
    setEditForm(newProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Edit Profile Save Submission
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const calculatedCgpa = calculateCgpaFromGrades(editForm.semesterGrades);
    const filledSems = (editForm.semesterGrades || []).filter((g) => g.sgpa && !isNaN(g.sgpa)).length;
    const completedCredits = filledSems * 20;

    const updated = {
      ...student,
      ...editForm,
      shortName: editForm.name ? editForm.name.trim().split(" ")[0] : "Student",
      attendancePercentage: Number(editForm.attendancePercentage) || 75,
      attendance: `${Number(editForm.attendancePercentage) || 75}%`,
      cgpa: calculatedCgpa || editForm.cgpa || "0.00",
      credits: `${completedCredits} / 160`,
      isConfigured: true,
    };

    saveStoredStudentData(updated);
    setStudent(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab("overview");
    }, 1200);
  };

  // Logout / Switch Profile handler
  const handleConfirmLogout = () => {
    logoutStudentProfile();
    setShowLogoutModal(false);
    // Reset local state to fresh empty form
    setStudent(EMPTY_STUDENT_DATA);
    setCreateForm({
      name: "",
      branch: "Computer Science & Engineering",
      branchCode: "CSE",
      customBranch: "",
      hallTicket: "",
      college: "",
      email: "",
      phone: "",
      year: "1st Year",
      semester: "1st Semester",
      regulation: "R23 Regulation",
      attendancePercentage: 82,
      profilePhoto: null,
      semesterGrades: INITIAL_SEMESTERS.map((s) => ({ ...s, sgpa: "" })),
    });
    setActiveTab("overview");
  };

  // Helper for attendance status
  const getAttendanceStatus = (pct) => {
    const num = Number(pct) || 0;
    if (num >= 75) {
      return {
        label: "Eligible for Exams (Safe)",
        class: "sp-att-safe",
        icon: "✓",
        color: "#059669",
        desc: "Meets official JNTU 75% minimum threshold for semester end exam hall ticket.",
      };
    } else if (num >= 65) {
      return {
        label: "Condonation Required (65%–74%)",
        class: "sp-att-warn",
        icon: "⚠️",
        color: "#d97706",
        desc: "Medical certificate or special approval required to avoid examination detention.",
      };
    } else {
      return {
        label: "Detention Risk (< 65%)",
        class: "sp-att-danger",
        icon: "✕",
        color: "#dc2626",
        desc: "Below minimum condonation limit. Immediate faculty mentor consultation needed.",
      };
    }
  };

  const isConfigured = Boolean(student && student.isConfigured && student.name?.trim());
  const currentAttendance = Number(student?.attendancePercentage || 75);
  const attendanceStatus = getAttendanceStatus(currentAttendance);
  const activeAvatar = student?.profilePhoto && student.profilePhoto !== "none"
    ? student.profilePhoto
    : (student?.profilePhoto === "none" ? null : profileImgDefault);

  return (
    <div className="student-profile-page">
      {/* =========================================================
          TOP NAVIGATION BAR (ANCHORED LOGO AT LEFT CORNER)
          ========================================================= */}
      <header className="sp-page-header">
        <div className="sp-page-header-inner">
          <div className="sp-header-left" onClick={() => navigate("/")} title="Return to Homepage">
            <img src="/jntu-circle-logo.png" alt="JNTU Circle" className="sp-page-logo" />
            <div>
              <h2 className="sp-brand-title">
                <span className="font-deltha">JNTU</span> Circle
              </h2>
              <span className="sp-brand-subtitle">Official Student Academic Identity</span>
            </div>
          </div>

          <div className="sp-header-right">
            <button
              type="button"
              className="sp-header-close-btn"
              onClick={() => navigate(-1)}
              title="Close and Return"
              aria-label="Close and Return"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          LOGOUT CONFIRMATION MODAL
          ========================================================= */}
      {showLogoutModal && (
        <div className="sp-modal-backdrop" onClick={() => setShowLogoutModal(false)}>
          <div className="sp-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sp-confirm-icon">🚪</div>
            <h3 className="sp-confirm-title">Log Out from Student Profile?</h3>
            <p className="sp-confirm-text">
              Logging out will clear your saved academic profile from this browser session.
              You or another student can create or log into a new profile anytime.
            </p>
            <div className="sp-confirm-actions">
              <button
                type="button"
                className="sp-btn-confirm-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sp-btn-confirm-logout"
                onClick={handleConfirmLogout}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN CONTAINER
          ========================================================= */}
      <main className="sp-page-main">
        {saveSuccess && (
          <div className="sp-floating-toast">
            <span className="sp-toast-icon">✓</span>
            <span>Profile successfully updated and saved securely!</span>
          </div>
        )}

        {/* ---------------------------------------------------------
            SCENARIO 1: FRESH USER / NOT CONFIGURED (CREATE PROFILE)
            --------------------------------------------------------- */}
        {!isConfigured ? (
          <div className="sp-create-wrapper">
            <div className="sp-create-hero">
              <div className="sp-create-hero-badge">🎓 JNTU Student Portal</div>
              <h1 className="sp-create-title">Create Your Student Academic Profile</h1>
              <p className="sp-create-subtitle">
                Set up your official university credential with attendance tracking,
                semester-wise CGPA matrix, and personalized profile picture. Stored privately on your device.
              </p>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="sp-create-card">
              {/* Photo Upload Section */}
              <div className="sp-create-photo-sec">
                <div className="sp-photo-preview-wrap">
                  {createForm.profilePhoto ? (
                    <img
                      src={createForm.profilePhoto}
                      alt="Student Preview"
                      className="sp-photo-circle"
                    />
                  ) : (
                    <div className="sp-photo-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>No Photo</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="sp-upload-badge-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Profile Photo"
                  >
                    📷
                  </button>
                </div>

                <div className="sp-photo-actions-text">
                  <h4 className="sp-photo-h">Student Profile Picture</h4>
                  <p className="sp-photo-p">
                    Upload a clear photo (JPG, PNG, or WEBP). Maximum 4MB.
                  </p>
                  <div className="sp-photo-btns-row">
                    <button
                      type="button"
                      className="sp-btn-upload-file"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Photo From Device
                    </button>
                    {createForm.profilePhoto && (
                      <button
                        type="button"
                        className="sp-btn-remove-photo"
                        onClick={() => handleRemovePhoto("create")}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handlePhotoUpload(e, "create")}
                  />
                </div>
              </div>

              <div className="sp-form-divider" />

              {/* Personal & Academic Details */}
              <div className="sp-section-heading-row">
                <span className="sp-sec-step">1</span>
                <div>
                  <h3 className="sp-sec-title">Personal & University Information</h3>
                  <p className="sp-sec-desc">Enter your primary student details as registered in college.</p>
                </div>
              </div>

              <div className="sp-form-grid-2">
                <div className="sp-input-box">
                  <label>Full Student Name <span className="sp-req">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={createForm.name}
                    onChange={handleCreateChange}
                    placeholder="e.g. Bandi Jaswanth Reddy"
                    required
                  />
                </div>

                <div className="sp-input-box">
                  <label>USN / Hall Ticket Number <span className="sp-req">*</span></label>
                  <input
                    type="text"
                    name="hallTicket"
                    value={createForm.hallTicket}
                    onChange={handleCreateChange}
                    placeholder="e.g. 21691A0501"
                    required
                  />
                </div>

                <div className="sp-input-box">
                  <label>Branch / Specialization <span className="sp-req">*</span></label>
                  <select
                    name="branchSelect"
                    value={createForm.branchCode}
                    onChange={handleCreateChange}
                    className="sp-select-input"
                  >
                    {POPULAR_BRANCHES.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                    <option value="OTHER">Other Branch (Specify below)</option>
                  </select>
                </div>

                {createForm.branchCode === "OTHER" && (
                  <div className="sp-input-box">
                    <label>Specify Branch Name & Code</label>
                    <input
                      type="text"
                      name="branch"
                      value={createForm.branch}
                      onChange={handleCreateChange}
                      placeholder="e.g. Chemical Engineering (CHEM)"
                      required
                    />
                  </div>
                )}

                <div className="sp-input-box">
                  <label>College / Institution Name <span className="sp-req">*</span></label>
                  <input
                    type="text"
                    name="college"
                    value={createForm.college}
                    onChange={handleCreateChange}
                    placeholder="e.g. Madanapalle Institute of Technology & Science"
                    required
                  />
                </div>

                <div className="sp-input-box">
                  <label>Email Address <span className="sp-req">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateChange}
                    placeholder="e.g. jaswanth@gmail.com"
                    required
                  />
                </div>

                <div className="sp-input-box">
                  <label>Contact Phone Number <span className="sp-req">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={createForm.phone}
                    onChange={handleCreateChange}
                    placeholder="e.g. +91 98765 43210"
                    required
                  />
                </div>

                <div className="sp-input-box">
                  <label>Current Academic Level</label>
                  <div className="sp-inline-2">
                    <select
                      name="year"
                      value={createForm.year}
                      onChange={handleCreateChange}
                      className="sp-select-input"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                    <select
                      name="semester"
                      value={createForm.semester}
                      onChange={handleCreateChange}
                      className="sp-select-input"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                    </select>
                  </div>
                </div>

                <div className="sp-input-box">
                  <label>Curriculum Regulation</label>
                  <select
                    name="regulation"
                    value={createForm.regulation}
                    onChange={handleCreateChange}
                    className="sp-select-input"
                  >
                    <option value="R23 Regulation">R23 Regulation</option>
                    <option value="R20 Regulation">R20 Regulation</option>
                    <option value="R19 Regulation">R19 Regulation</option>
                    <option value="R15 Regulation">R15 Regulation</option>
                  </select>
                </div>
              </div>

              <div className="sp-form-divider" />

              {/* Attendance Tracker Input */}
              <div className="sp-section-heading-row">
                <span className="sp-sec-step">2</span>
                <div>
                  <h3 className="sp-sec-title">Overall Attendance Percentage</h3>
                  <p className="sp-sec-desc">Keep track of your semester attendance for JNTU exam hall ticket clearance.</p>
                </div>
              </div>

              <div className="sp-attendance-card-box">
                <div className="sp-att-slider-row">
                  <div className="sp-att-input-col">
                    <div className="sp-att-num-display">
                      <span className="sp-att-big-num">{createForm.attendancePercentage}%</span>
                      <span className="sp-att-sub">Current Attendance</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={createForm.attendancePercentage}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          attendancePercentage: Number(e.target.value),
                        }))
                      }
                      className="sp-att-range-slider"
                    />
                  </div>

                  <div className={`sp-att-status-badge-card ${getAttendanceStatus(createForm.attendancePercentage).class}`}>
                    <div className="sp-att-status-header">
                      <span className="sp-att-status-icon">{getAttendanceStatus(createForm.attendancePercentage).icon}</span>
                      <strong>{getAttendanceStatus(createForm.attendancePercentage).label}</strong>
                    </div>
                    <p className="sp-att-status-text">
                      {getAttendanceStatus(createForm.attendancePercentage).desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sp-form-divider" />

              {/* Semester-wise CGPA / SGPA Section */}
              <div className="sp-section-heading-row">
                <span className="sp-sec-step">3</span>
                <div className="sp-sec-flex-header">
                  <div>
                    <h3 className="sp-sec-title">Semester-wise SGPA Performance</h3>
                    <p className="sp-sec-desc">
                      Enter your SGPA for each completed semester (1 through 8). Leave future semesters blank.
                    </p>
                  </div>
                  {calculateCgpaFromGrades(createForm.semesterGrades) && (
                    <div className="sp-live-cgpa-pill">
                      <span>Calculated CGPA:</span>
                      <strong>{calculateCgpaFromGrades(createForm.semesterGrades)} / 10.0</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="sp-sem-matrix-grid">
                {createForm.semesterGrades.map((sem, idx) => (
                  <div key={idx} className="sp-sem-input-card">
                    <span className="sp-sem-tag">{sem.sem}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 8.75"
                      value={sem.sgpa}
                      onChange={(e) => handleCreateSemGradeChange(idx, e.target.value)}
                      className="sp-sem-score-input"
                    />
                    <span className="sp-sem-subtext">20 Credits</span>
                  </div>
                ))}
              </div>

              {/* Form Action */}
              <div className="sp-create-submit-bar">
                <button type="submit" className="sp-btn-create-submit">
                  ✨ Create & Save My Student Profile
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ---------------------------------------------------------
              SCENARIO 2: CONFIGURED USER (EXECUTIVE ACADEMIC CARD)
              --------------------------------------------------------- */
          <div className="sp-page-card">
            {/* Academic Cover Banner with Three Dots Kebab Menu */}
            <div className="sp-page-banner">
              <div className="sp-page-banner-glow" />
              <div className="sp-banner-eyebrow" ref={menuRef}>
                <button
                  type="button"
                  className="sp-kebab-btn"
                  onClick={() => setShowMenu((prev) => !prev)}
                  title="Profile Options"
                  aria-label="Profile Options"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2.2" />
                    <circle cx="12" cy="12" r="2.2" />
                    <circle cx="12" cy="19" r="2.2" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="sp-kebab-dropdown">
                    <button
                      type="button"
                      className="sp-kebab-item"
                      onClick={() => {
                        setShowMenu(false);
                        setActiveTab("edit");
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Edit Profile
                    </button>
                    {activeAvatar && (
                      <button
                        type="button"
                        className="sp-kebab-item sp-kebab-item-remove-photo"
                        onClick={() => {
                          setShowMenu(false);
                          handleRemovePhoto("edit");
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Remove Photo
                      </button>
                    )}
                    <button
                      type="button"
                      className="sp-kebab-item sp-kebab-item-logout"
                      onClick={() => {
                        setShowMenu(false);
                        setShowLogoutModal(true);
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Identity Bar */}
            <div className="sp-page-identity">
              <div className="sp-avatar-holder">
                {activeAvatar ? (
                  <img
                    src={activeAvatar}
                    alt={student.name}
                    className="sp-profile-photo"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="sp-profile-photo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <span className="sp-online-dot" title="Active Student Status" />
              </div>

              <div className="sp-identity-details">
                <div className="sp-name-badge-row">
                  <h1 className="sp-main-name">{student.name}</h1>
                  <span className="sp-verified-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    Verified Student
                  </span>
                </div>
                <p className="sp-main-subtext">
                  <strong className="sp-main-roll">{student.hallTicket}</strong>
                  <span className="sp-dot-separator">•</span>
                  <span>{student.branch} ({student.branchCode})</span>
                  <span className="sp-dot-separator">•</span>
                  <span className="sp-highlight-gold">{student.year} ({student.semester})</span>
                </p>
                <p className="sp-college-subtext">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sp-inst-icon">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                  <span>{student.college}</span>
                </p>
              </div>
            </div>

            {/* Metric KPI Cards (Styled with Bot Reference Colors) */}
            <div className="sp-page-metrics">
              <div className="sp-p-metric sp-metric-bot-theme">
                <div className="sp-metric-header">
                  <span className="sp-pm-label">CUMULATIVE CGPA</span>
                  <div className="sp-pm-icon-wrap">
                    <svg className="sp-metric-icon sp-icon-gold" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                <div className="sp-pm-val sp-gold">
                  {student.cgpa || "0.00"} <span className="sp-pm-max">/ 10.0</span>
                </div>
                <span className="sp-pm-desc sp-gold-sub">
                  {Number(student.cgpa) >= 8.5
                    ? "★ Distinction Standing"
                    : Number(student.cgpa) >= 7.0
                    ? "✓ First Class Standing"
                    : "Active Academic Record"}
                </span>
              </div>

              <div className={`sp-p-metric sp-metric-bot-theme ${attendanceStatus.class}`}>
                <div className="sp-metric-header">
                  <span className="sp-pm-label">TOTAL ATTENDANCE</span>
                  <div className="sp-pm-icon-wrap">
                    <svg className="sp-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <div className="sp-pm-val sp-att-val">
                  {student.attendancePercentage || 75}%
                </div>
                <div className={`sp-pm-badge-pill ${attendanceStatus.class}`}>
                  {attendanceStatus.icon} {currentAttendance >= 75 ? "Hall Ticket Eligible" : "Action Required"}
                </div>
              </div>

              <div className="sp-p-metric sp-metric-bot-theme">
                <div className="sp-metric-header">
                  <span className="sp-pm-label">COMPLETED CREDITS</span>
                  <div className="sp-pm-icon-wrap">
                    <svg className="sp-metric-icon sp-icon-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                </div>
                <div className="sp-pm-val sp-credits-val">{student.credits || "0 / 160"}</div>
                <span className="sp-pm-desc sp-credits-sub">B.Tech Degree Requirement</span>
              </div>

              <div className="sp-p-metric sp-metric-bot-theme">
                <div className="sp-metric-header">
                  <span className="sp-pm-label">REGULATION & BATCH</span>
                  <div className="sp-pm-icon-wrap">
                    <svg className="sp-metric-icon sp-icon-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                </div>
                <div className="sp-pm-val sp-reg-val">{student.regulation}</div>
                <span className="sp-pm-desc sp-reg-sub">{student.branchCode} Department</span>
              </div>
            </div>

            {/* Tabs Navigation (Professional Minimalist, No Emojis) */}
            <div className="sp-page-tabs">
              <button
                type="button"
                className={`sp-page-tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Academic Details
              </button>
              <button
                type="button"
                className={`sp-page-tab ${activeTab === "grades" ? "active" : ""}`}
                onClick={() => setActiveTab("grades")}
              >
                Semester Grade Card (SGPA)
              </button>
              <button
                type="button"
                className={`sp-page-tab ${activeTab === "attendance" ? "active" : ""}`}
                onClick={() => setActiveTab("attendance")}
              >
                Attendance Status ({student.attendancePercentage || 75}%)
              </button>
              <button
                type="button"
                className={`sp-page-tab ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                Saved Notes ({student.savedNotes?.length || 0})
              </button>
              <button
                type="button"
                className={`sp-page-tab ${activeTab === "edit" ? "active" : ""}`}
                onClick={() => setActiveTab("edit")}
              >
                Edit Profile
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="sp-page-content">
              {/* TAB 1: ACADEMIC DETAILS */}
              {activeTab === "overview" && (
                <div className="sp-tab-fade">
                  <div className="sp-info-grid">
                    <div className="sp-info-card">
                      <span className="sp-info-label">Full Student Name</span>
                      <span className="sp-info-data">{student.name}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Hall Ticket / USN</span>
                      <span className="sp-info-data font-mono">{student.hallTicket}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Department & Branch</span>
                      <span className="sp-info-data">
                        {student.branch} ({student.branchCode})
                      </span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">College / Institution</span>
                      <span className="sp-info-data">{student.college}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Affiliated University</span>
                      <span className="sp-info-data">{student.university}</span>
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
                      <span className="sp-info-label">Email Address</span>
                      <span className="sp-info-data sp-text-link">{student.email || "Not specified"}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Contact Phone</span>
                      <span className="sp-info-data">{student.phone || "Not specified"}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Attendance Clearance</span>
                      <span className={`sp-info-data ${attendanceStatus.class}`}>
                        {student.attendancePercentage || 75}% — {attendanceStatus.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SEMESTER GRADES */}
              {activeTab === "grades" && (
                <div className="sp-tab-fade">
                  <div className="sp-card-box">
                    <div className="sp-card-box-header">
                      <div>
                        <h3 className="sp-box-title">8-Semester Performance Matrix</h3>
                        <p className="sp-box-subtitle">
                          Official semester grade point averages (SGPA) and cumulative CGPA.
                        </p>
                      </div>
                      <div className="sp-cgpa-display">
                        <span>CUMULATIVE CGPA</span>
                        <strong>{student.cgpa || "0.00"} / 10.0</strong>
                      </div>
                    </div>

                    <table className="sp-full-table">
                      <thead>
                        <tr>
                          <th>Semester</th>
                          <th>Credits</th>
                          <th>SGPA Score</th>
                          <th>Visual Progression</th>
                          <th>Academic Standing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(student.semesterGrades || INITIAL_SEMESTERS).map((grade, index) => {
                          const sgpaNum = parseFloat(grade.sgpa);
                          const hasScore = !isNaN(sgpaNum) && sgpaNum > 0;
                          return (
                            <tr key={index}>
                              <td>
                                <strong>{grade.sem}</strong>
                              </td>
                              <td>{grade.credits || 20} Credits</td>
                              <td className="sp-td-score">
                                {hasScore ? (
                                  <span className="sp-score-num">{sgpaNum.toFixed(2)}</span>
                                ) : (
                                  <span className="sp-score-tag">Not Entered</span>
                                )}
                              </td>
                              <td>
                                <div className="sp-progress-bar-track">
                                  <div
                                    className="sp-progress-bar-fill"
                                    style={{
                                      width: hasScore ? `${(sgpaNum / 10) * 100}%` : "0%",
                                    }}
                                  />
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`sp-badge-status ${
                                    hasScore && sgpaNum >= 8.5
                                      ? "gold"
                                      : hasScore
                                      ? "completed"
                                      : ""
                                  }`}
                                >
                                  {hasScore
                                    ? sgpaNum >= 9.0
                                      ? "Outstanding (O)"
                                      : sgpaNum >= 8.0
                                      ? "Excellent (A+)"
                                      : "Cleared (Pass)"
                                    : "Pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ATTENDANCE DETAILS */}
              {activeTab === "attendance" && (
                <div className="sp-tab-fade">
                  <div className="sp-att-analytics-card">
                    <div className="sp-att-top-row">
                      <div className="sp-att-dial">
                        <div className="sp-att-dial-inner">
                          <span className="sp-att-dial-val">{currentAttendance}%</span>
                          <span className="sp-att-dial-lbl">Attendance</span>
                        </div>
                      </div>

                      <div className="sp-att-dial-details">
                        <span className={`sp-att-pill ${attendanceStatus.class}`}>
                          {attendanceStatus.icon} {attendanceStatus.label}
                        </span>
                        <h3 className="sp-att-rule-title">JNTU University Attendance Norms</h3>
                        <p className="sp-att-rule-desc">
                          According to JNTU regulations, every student must maintain a minimum of{" "}
                          <strong>75% attendance</strong> in aggregate across all coursework.
                        </p>
                      </div>
                    </div>

                    <div className="sp-att-benchmarks">
                      <div className="sp-benchmark-item safe">
                        <span className="sp-bm-dot safe" />
                        <div>
                          <strong>75% – 100%: Normal Eligibility</strong>
                          <p>Issued official examination hall ticket without penalty.</p>
                        </div>
                      </div>
                      <div className="sp-benchmark-item warn">
                        <span className="sp-bm-dot warn" />
                        <div>
                          <strong>65% – 74%: Condonation Allowed</strong>
                          <p>Eligible upon payment of university condonation fee with medical proof.</p>
                        </div>
                      </div>
                      <div className="sp-benchmark-item danger">
                        <span className="sp-bm-dot danger" />
                        <div>
                          <strong>Below 65%: Detained</strong>
                          <p>Not eligible for semester examinations; must repeat course.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SAVED NOTES */}
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
                            <span className="sp-note-subdetails">
                              {note.units} • Instructor: {note.faculty}
                            </span>
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
                      <div className="sp-empty-notice">
                        <p>No study materials saved yet.</p>
                        <button
                          type="button"
                          className="sp-btn-view-material"
                          onClick={() => navigate("/notes")}
                        >
                          Browse Notes Library
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: EDIT PROFILE */}
              {activeTab === "edit" && (
                <div className="sp-tab-fade">
                  <form onSubmit={handleSaveProfile} className="sp-form-container">
                    <h3 className="sp-edit-section-title">Update Student Information</h3>

                    {/* Photo Edit */}
                    <div className="sp-edit-photo-strip">
                      <div className="sp-avatar-holder-mini">
                        {editForm.profilePhoto && editForm.profilePhoto !== "none" ? (
                          <img
                            src={editForm.profilePhoto}
                            alt="Edit Preview"
                            className="sp-edit-avatar-img"
                          />
                        ) : editForm.profilePhoto !== "none" && activeAvatar ? (
                          <img
                            src={activeAvatar}
                            alt="Edit Preview"
                            className="sp-edit-avatar-img"
                          />
                        ) : (
                          <div className="sp-avatar-placeholder-mini">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="sp-edit-photo-cta">
                        <strong>Student Profile Photo</strong>
                        <p>Upload a photo from your machine (PNG/JPG, max 4MB) or remove current photo.</p>
                        <div className="sp-photo-btns-row">
                          <button
                            type="button"
                            className="sp-btn-upload-file"
                            onClick={() => editFileInputRef.current?.click()}
                          >
                            📷 Select New Photo
                          </button>
                          {(editForm.profilePhoto !== "none" && (editForm.profilePhoto || activeAvatar)) && (
                            <button
                              type="button"
                              className="sp-btn-remove-photo"
                              onClick={() => handleRemovePhoto("edit")}
                            >
                              🗑️ Remove Photo
                            </button>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={editFileInputRef}
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handlePhotoUpload(e, "edit")}
                        />
                      </div>
                    </div>

                    <div className="sp-form-row-2">
                      <div className="sp-input-group">
                        <label>Full Student Name</label>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name || ""}
                          onChange={handleEditChange}
                          required
                        />
                      </div>

                      <div className="sp-input-group">
                        <label>Hall Ticket / Roll No.</label>
                        <input
                          type="text"
                          name="hallTicket"
                          value={editForm.hallTicket || ""}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="sp-form-row-2">
                      <div className="sp-input-group">
                        <label>Branch / Specialization</label>
                        <input
                          type="text"
                          name="branch"
                          value={editForm.branch || ""}
                          onChange={handleEditChange}
                          required
                        />
                      </div>

                      <div className="sp-input-group">
                        <label>Branch Short Code</label>
                        <input
                          type="text"
                          name="branchCode"
                          value={editForm.branchCode || ""}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="sp-input-group">
                      <label>College / Institution Name</label>
                      <input
                        type="text"
                        name="college"
                        value={editForm.college || ""}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    <div className="sp-form-row-2">
                      <div className="sp-input-group">
                        <label>Institutional Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email || ""}
                          onChange={handleEditChange}
                        />
                      </div>

                      <div className="sp-input-group">
                        <label>Contact Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={editForm.phone || ""}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>

                    <div className="sp-form-row-2">
                      <div className="sp-input-group">
                        <label>Academic Year</label>
                        <input
                          type="text"
                          name="year"
                          value={editForm.year || ""}
                          onChange={handleEditChange}
                        />
                      </div>

                      <div className="sp-input-group">
                        <label>Current Semester</label>
                        <input
                          type="text"
                          name="semester"
                          value={editForm.semester || ""}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>

                    <div className="sp-form-row-2">
                      <div className="sp-input-group">
                        <label>Regulation</label>
                        <input
                          type="text"
                          name="regulation"
                          value={editForm.regulation || ""}
                          onChange={handleEditChange}
                        />
                      </div>

                      <div className="sp-input-group">
                        <label>
                          Attendance Percentage ({editForm.attendancePercentage || 75}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editForm.attendancePercentage || 75}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              attendancePercentage: Number(e.target.value),
                            }))
                          }
                          className="sp-att-range-slider"
                        />
                      </div>
                    </div>

                    {/* Edit Semester Grades */}
                    <div className="sp-edit-sem-section">
                      <div className="sp-edit-sem-header">
                        <h4>Semester-wise SGPA (Sem 1 – Sem 8)</h4>
                        {calculateCgpaFromGrades(editForm.semesterGrades) && (
                          <span className="sp-live-cgpa-badge">
                            Live CGPA: {calculateCgpaFromGrades(editForm.semesterGrades)} / 10.0
                          </span>
                        )}
                      </div>
                      <div className="sp-sem-matrix-grid">
                        {(editForm.semesterGrades || INITIAL_SEMESTERS).map((sem, idx) => (
                          <div key={idx} className="sp-sem-input-card">
                            <span className="sp-sem-tag">{sem.sem}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              placeholder="SGPA"
                              value={sem.sgpa || ""}
                              onChange={(e) => handleEditSemGradeChange(idx, e.target.value)}
                              className="sp-sem-score-input"
                            />
                          </div>
                        ))}
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
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentProfile;
