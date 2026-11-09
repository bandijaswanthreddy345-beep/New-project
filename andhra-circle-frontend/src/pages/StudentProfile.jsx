import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  EMPTY_STUDENT_DATA,
  INITIAL_SEMESTERS,
  SAMPLE_STUDENT_PROFILE,
  getStoredStudentData,
  saveStoredStudentData,
  logoutStudentProfile,
  restoreDefaultStudentData,
  calculateCgpaFromGrades,
  calculateEquivalentPercentage,
  getAcademicClassification,
  getGradeLetter,
  getStudentAvatar,
  getStudentAvatarUrl,
  cleanCollege,
  cleanSemester,
} from "../data/studentData";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateGradePoint,
  validateAttendance,
  validateHallTicket,
  validateYear,
  validateSemester,
  validateBranch,
  validateProfilePhoto,
} from "../utils/validators";
import "./StudentProfile.css";

const POPULAR_BRANCHES = [
  { name: "Computer Science & Engineering", code: "CSE" },
  { name: "Artificial Intelligence & Machine Learning", code: "CSE (AI&ML)" },
  { name: "Artificial Intelligence & Data Science", code: "CSE (AI&DS)" },
  { name: "Data Science", code: "CSE (DS)" },
  { name: "Information Technology", code: "IT" },
  { name: "Electronics & Communication Engineering", code: "ECE" },
  { name: "Electrical & Electronics Engineering", code: "EEE" },
  { name: "Mechanical Engineering", code: "MECH" },
  { name: "Civil Engineering", code: "CIVIL" },
  { name: "Computer Science & Business Systems", code: "CSBS" },
  { name: "Cyber Security", code: "CSE (Cyber Security)" },
];

function StudentProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const mobileEditFileInputRef = useRef(null);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const [student, setStudent] = useState(getStoredStudentData());
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "idcard" | "grades" | "attendance" | "notes" | "edit"
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [copiedUsn, setCopiedUsn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Close kebab dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
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
    semester: "1-1",
    regulation: "R23 Regulation",
    attendancePercentage: 82,
    profilePhoto: null,
    semesterGrades: INITIAL_SEMESTERS.map((s) => ({ ...s, sgpa: "" })),
  });

  // Edit Form State for existing users
  const [editForm, setEditForm] = useState(student);

  // Field validation errors state
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [photoError, setPhotoError] = useState("");

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
    window.addEventListener("storage", handleProfileUpdate);
    return () => {
      window.removeEventListener("studentProfileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, []);

  // Update edit form when student data changes
  useEffect(() => {
    setEditForm(student);
  }, [student]);

  // Handle Photo File validation and conversion
  const processImageFile = (file, targetForm = "create") => {
    if (!file) return;

    const validation = validateProfilePhoto(file);
    if (!validation.ok) {
      setPhotoError(validation.message);
      alert(validation.message);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      if (mobileEditFileInputRef.current) mobileEditFileInputRef.current.value = "";
      return;
    }

    setPhotoError("");
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      if (targetForm === "create") {
        setCreateForm((prev) => ({ ...prev, profilePhoto: base64Data }));
      } else {
        setEditForm((prev) => ({ ...prev, profilePhoto: base64Data }));
        const current = getStoredStudentData();
        const updated = {
          ...current,
          profilePhoto: base64Data,
        };
        saveStoredStudentData(updated);
        setStudent(updated);
        setToastMessage("Student profile photo updated successfully!");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2200);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e, targetForm = "create") => {
    const file = e.target.files?.[0];
    processImageFile(file, targetForm);
  };

  // Drag and Drop support for Profile Picture
  const handlePhotoDrop = (e, targetForm = "create") => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    processImageFile(file, targetForm);
  };

  const handleRemovePhoto = (targetForm = "create") => {
    setPhotoError("");
    if (targetForm === "create") {
      setCreateForm((prev) => ({ ...prev, profilePhoto: "none" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setEditForm((prev) => ({ ...prev, profilePhoto: "none" }));
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      if (mobileEditFileInputRef.current) mobileEditFileInputRef.current.value = "";
      const current = getStoredStudentData();
      const updated = {
        ...current,
        profilePhoto: "none",
      };
      saveStoredStudentData(updated);
      setStudent(updated);
      setToastMessage("Student profile photo removed.");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    }
  };

  // Field validator helper
  const validateFormField = (name, value, isRequired = true) => {
    switch (name) {
      case "name":
        return validateName(value);
      case "hallTicket":
        return validateHallTicket(value);
      case "email":
        return validateEmail(value, { required: isRequired });
      case "phone":
        return validatePhone(value, { required: isRequired });
      case "branch":
        return validateBranch(value);
      case "year":
        return validateYear(value);
      case "semester":
        return validateSemester(value);
      case "college": {
        const trimmed = (value || "").trim();
        if (isRequired && !trimmed) {
          return { ok: false, message: "College / Institution name is required." };
        }
        return { ok: true, value: trimmed, message: "" };
      }
      default:
        return { ok: true, value, message: "" };
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
    // Clear error for field as user types
    if (createErrors[name]) {
      setCreateErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Creation blur validation handler
  const handleCreateBlur = (e) => {
    const { name, value } = e.target;
    if (name === "branchSelect") return;
    const res = validateFormField(name, value, true);
    setCreateErrors((prev) => ({
      ...prev,
      [name]: res.ok ? "" : res.message,
    }));
  };

  // Creation semester grade change handler
  const handleCreateSemGradeChange = (semIndex, sgpaVal) => {
    const numericVal = sgpaVal.trim();
    if (numericVal !== "") {
      const gCheck = validateGradePoint(numericVal, `Sem ${semIndex + 1} SGPA`);
      setCreateErrors((prev) => ({
        ...prev,
        [`sem_${semIndex}`]: gCheck.ok ? "" : gCheck.message,
      }));
    } else {
      setCreateErrors((prev) => ({
        ...prev,
        [`sem_${semIndex}`]: "",
      }));
    }

    setCreateForm((prev) => {
      const updatedGrades = [...prev.semesterGrades];
      updatedGrades[semIndex] = {
        ...updatedGrades[semIndex],
        sgpa: numericVal,
        status: numericVal && !isNaN(numericVal) && Number(numericVal) > 0 ? "Completed" : "Not Started",
      };
      return { ...prev, semesterGrades: updatedGrades };
    });
  };

  // Edit form change handler
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Edit blur validation handler
  const handleEditBlur = (e) => {
    const { name, value } = e.target;
    const isRequired = name === "name" || name === "hallTicket" || name === "branch" || name === "college";
    const res = validateFormField(name, value, isRequired);
    setEditErrors((prev) => ({
      ...prev,
      [name]: res.ok ? "" : res.message,
    }));
  };

  // Edit semester grade change handler
  const handleEditSemGradeChange = (semIndex, sgpaVal) => {
    const numericVal = sgpaVal.trim();
    if (numericVal !== "") {
      const gCheck = validateGradePoint(numericVal, `Sem ${semIndex + 1} SGPA`);
      setEditErrors((prev) => ({
        ...prev,
        [`sem_${semIndex}`]: gCheck.ok ? "" : gCheck.message,
      }));
    } else {
      setEditErrors((prev) => ({
        ...prev,
        [`sem_${semIndex}`]: "",
      }));
    }

    setEditForm((prev) => {
      const updatedGrades = [...(prev.semesterGrades || INITIAL_SEMESTERS)];
      updatedGrades[semIndex] = {
        ...updatedGrades[semIndex],
        sgpa: numericVal,
        status: numericVal && !isNaN(numericVal) && Number(numericVal) > 0 ? "Completed" : "Not Started",
      };
      return { ...prev, semesterGrades: updatedGrades };
    });
  };

  // Quick fill sample data matching prompt
  const handleQuickFillSample = () => {
    setCreateForm({
      name: "Jaswanth",
      branch: "Computer Science & Engineering",
      branchCode: "CSE",
      customBranch: "",
      hallTicket: "22B91A4201",
      college: "Madanapalle Institute of Technology & Science",
      email: "jaswanth@gmail.com",
      phone: "+91 98765 43210",
      year: "1st Year",
      semester: "1-1",
      regulation: "R23 Regulation",
      attendancePercentage: 82,
      profilePhoto: null,
      semesterGrades: [
        { sem: "1-1", sgpa: "8.75", credits: 20, status: "Completed" },
        { sem: "1-2", sgpa: "", credits: 20, status: "Not Started" },
        { sem: "2-1", sgpa: "", credits: 20, status: "Not Started" },
        { sem: "2-2", sgpa: "", credits: 20, status: "Not Started" },
        { sem: "3-1", sgpa: "", credits: 20, status: "Not Started" },
        { sem: "3-2", sgpa: "", credits: 20, status: "Not Started" },
        { sem: "4-1", sgpa: "", credits: 20, status: "Not Started" },
        { sem: "4-2", sgpa: "", credits: 20, status: "Not Started" },
      ],
    });
  };

  // Reset form to blank
  const handleResetCreateForm = () => {
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
      semester: "1-1",
      regulation: "R23 Regulation",
      attendancePercentage: 75,
      profilePhoto: null,
      semesterGrades: INITIAL_SEMESTERS.map((s) => ({ ...s, sgpa: "" })),
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Copy USN to clipboard
  const handleCopyUsn = (usn) => {
    if (!usn) return;
    navigator.clipboard?.writeText(usn);
    setCopiedUsn(true);
    setTimeout(() => setCopiedUsn(false), 2000);
  };

  // Print Profile / ID Card
  const handlePrintIdCard = () => {
    window.print();
  };

  // Create Profile Submission
  const handleCreateProfileSubmit = (e) => {
    e.preventDefault();

    const errors = {};
    const nameCheck = validateName(createForm.name);
    if (!nameCheck.ok) errors.name = nameCheck.message;

    const htCheck = validateHallTicket(createForm.hallTicket);
    if (!htCheck.ok) errors.hallTicket = htCheck.message;

    if (!createForm.college?.trim()) {
      errors.college = "College / Institution name is required.";
    }

    const emailCheck = validateEmail(createForm.email, { required: true });
    if (!emailCheck.ok) errors.email = emailCheck.message;

    const phoneCheck = validatePhone(createForm.phone, { required: true });
    if (!phoneCheck.ok) errors.phone = phoneCheck.message;

    const attCheck = validateAttendance(createForm.attendancePercentage);
    if (!attCheck.ok) errors.attendance = attCheck.message;

    // Check SGPA inputs in semester grades
    createForm.semesterGrades.forEach((sem, idx) => {
      if (sem.sgpa && sem.sgpa.trim()) {
        const gCheck = validateGradePoint(sem.sgpa, `Sem ${idx + 1} SGPA`);
        if (!gCheck.ok) errors[`sem_${idx}`] = gCheck.message;
      }
    });

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return; // Block saving! Retain typed user text completely.
    }

    setCreateErrors({});
    const calculatedCgpa = calculateCgpaFromGrades(createForm.semesterGrades);
    const filledSems = createForm.semesterGrades.filter(
      (g) => g.sgpa && !isNaN(g.sgpa) && Number(g.sgpa) > 0
    ).length;
    const completedCredits = filledSems * 20;

    const newProfile = {
      ...EMPTY_STUDENT_DATA,
      name: nameCheck.value,
      shortName: nameCheck.value.split(" ")[0] || "Student",
      hallTicket: htCheck.value,
      branch: createForm.branch || "Computer Science & Engineering",
      branchCode: createForm.branchCode || "CSE",
      college: createForm.college.trim() || "JNTU Affiliated Institution",
      email: emailCheck.value,
      phone: phoneCheck.value,
      year: createForm.year || "1st Year",
      semester: createForm.semester || "1-1",
      regulation: createForm.regulation || "R23 Regulation",
      attendancePercentage: attCheck.value,
      attendance: attCheck.formatted,
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

    const errors = {};
    const nameCheck = validateName(editForm.name);
    if (!nameCheck.ok) errors.name = nameCheck.message;

    const htCheck = validateHallTicket(editForm.hallTicket);
    if (!htCheck.ok) errors.hallTicket = htCheck.message;

    const branchCheck = validateBranch(editForm.branch);
    if (!branchCheck.ok) errors.branch = branchCheck.message;

    if (!editForm.college?.trim()) {
      errors.college = "College / Institution name is required.";
    }

    if (editForm.email && editForm.email.trim()) {
      const emailCheck = validateEmail(editForm.email, { required: false });
      if (!emailCheck.ok) errors.email = emailCheck.message;
    }

    if (editForm.phone && editForm.phone.trim()) {
      const phoneCheck = validatePhone(editForm.phone, { required: false });
      if (!phoneCheck.ok) errors.phone = phoneCheck.message;
    }

    if (editForm.year) {
      const yearCheck = validateYear(editForm.year);
      if (!yearCheck.ok) errors.year = yearCheck.message;
    }

    if (editForm.semester) {
      const semCheck = validateSemester(editForm.semester);
      if (!semCheck.ok) errors.semester = semCheck.message;
    }

    if (editForm.attendancePercentage !== undefined && editForm.attendancePercentage !== "") {
      const attCheck = validateAttendance(editForm.attendancePercentage);
      if (!attCheck.ok) errors.attendance = attCheck.message;
    }

    (editForm.semesterGrades || []).forEach((sem, idx) => {
      if (sem.sgpa && String(sem.sgpa).trim()) {
        const gCheck = validateGradePoint(sem.sgpa, `Sem ${idx + 1} SGPA`);
        if (!gCheck.ok) errors[`sem_${idx}`] = gCheck.message;
      }
    });

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return; // Block saving! Retain typed user text.
    }

    setEditErrors({});
    const calculatedCgpa = calculateCgpaFromGrades(editForm.semesterGrades);
    const filledSems = (editForm.semesterGrades || []).filter(
      (g) => g.sgpa && !isNaN(g.sgpa) && Number(g.sgpa) > 0
    ).length;
    const completedCredits = filledSems * 20;

    const attVal = Number(editForm.attendancePercentage) || 75;
    const updated = {
      ...student,
      ...editForm,
      name: nameCheck.value,
      shortName: nameCheck.value.split(" ")[0] || "Student",
      hallTicket: htCheck.value,
      branch: branchCheck.ok ? branchCheck.value : editForm.branch,
      branchCode: branchCheck.ok ? branchCheck.code : (editForm.branchCode || "CSE"),
      attendancePercentage: attVal,
      attendance: `${attVal}%`,
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
    setStudent({ ...EMPTY_STUDENT_DATA, isConfigured: false });
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
      semester: "1-1",
      regulation: "R23 Regulation",
      attendancePercentage: 82,
      profilePhoto: null,
      semesterGrades: INITIAL_SEMESTERS.map((s) => ({ ...s, sgpa: "" })),
    });
    setActiveTab("overview");
    setToastMessage("Logged out from student profile.");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);
  };

  // Restore Jaswanth Profile handler
  const handleResetToSample = () => {
    const sample = restoreDefaultStudentData();
    setShowLogoutModal(false);
    setStudent(sample);
    setEditForm(sample);
    setActiveTab("overview");
    setToastMessage("Restored Jaswanth's profile successfully!");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);
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
        desc: "Requires medical certificate or official JNTU condonation fee (₹500–₹1000) sanctioned by Principal.",
      };
    } else {
      return {
        label: "Detention Risk (< 65%)",
        class: "sp-att-danger",
        icon: "✕",
        color: "#dc2626",
        desc: "Below minimum 65% condonation limit. Ineligible for semester end exams under JNTU academic rules.",
      };
    }
  };

  const isConfigured = Boolean(student && student.isConfigured && student.name?.trim());
  const currentAttendance = Number(student?.attendancePercentage || 75);
  const attendanceStatus = getAttendanceStatus(currentAttendance);
  const activeAvatar = getStudentAvatar(student);

  // Memoized live calculations for create form to ensure instantaneous slider & input response
  const liveCreateCgpa = useMemo(
    () => calculateCgpaFromGrades(createForm.semesterGrades),
    [createForm.semesterGrades]
  );
  const liveCreatePct = useMemo(
    () => calculateEquivalentPercentage(liveCreateCgpa),
    [liveCreateCgpa]
  );
  const liveCreateStanding = useMemo(
    () => getAcademicClassification(liveCreateCgpa),
    [liveCreateCgpa]
  );
  const liveCreateFilledCount = useMemo(
    () =>
      createForm.semesterGrades.filter(
        (g) => g.sgpa && !isNaN(g.sgpa) && Number(g.sgpa) > 0
      ).length,
    [createForm.semesterGrades]
  );

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <div className="student-profile-page">
      {/* =========================================================
          DESKTOP VIEW (SCREEN WIDTH > 768px)
          ========================================================= */}
      <div className="sp-desktop-only">
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
            <h3 className="sp-confirm-title">Switch / Log Out Profile?</h3>
            <p className="sp-confirm-text">
              Are you sure you want to log out from <strong>{student.name || "Student"}</strong> ({student.hallTicket || "JNTU"})?
              You can log back in, create a fresh profile, or reset back to Jaswanth at any time.
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
                className="sp-btn-confirm-reset"
                onClick={handleResetToSample}
                title="Restore default Jaswanth profile"
              >
                Reset to Jaswanth
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
            <span>{toastMessage || "Profile successfully updated and saved privately on device!"}</span>
          </div>
        )}

        {copiedUsn && (
          <div className="sp-floating-toast sp-toast-copied">
            <span className="sp-toast-icon">📋</span>
            <span>Hall Ticket Number copied to clipboard!</span>
          </div>
        )}

        {/* ---------------------------------------------------------
            SCENARIO 1: FRESH USER / NOT CONFIGURED (CREATE PROFILE)
            --------------------------------------------------------- */}
        {!isConfigured ? (
          <div className="sp-create-wrapper">
            <div className="sp-create-hero">
              <div className="sp-create-hero-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.45 9L12 4.34 20.55 9 12 13.66 3.45 9zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                </svg>
                <span>🎓 JNTU Student Portal</span>
                <span className="sp-badge-dot">•</span>
                <span>Autonomous & Affiliated</span>
              </div>
              <h1 className="sp-create-title">Create Your Student Academic Profile</h1>
              <p className="sp-create-subtitle">
                Set up your official university credential with attendance tracking,
                semester-wise CGPA matrix, and personalized profile picture. Stored privately on your device.
              </p>

              {/* Quick Demo Pre-fill Bar */}
              <div className="sp-quick-fill-bar">
                <div className="sp-qf-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>Quick Start Option:</span>
                </div>
                <button
                  type="button"
                  className="sp-btn-quick-fill"
                  onClick={handleQuickFillSample}
                  title="Populate Jaswanth • 22B91A4201 • 82% Attendance"
                >
                  ⚡ Fill Sample Data (Jaswanth • 22B91A4201)
                </button>
                <button
                  type="button"
                  className="sp-btn-quick-reset"
                  onClick={handleResetCreateForm}
                  title="Clear all fields"
                >
                  Reset Form
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="sp-create-card">
              {/* Photo Upload Section */}
              <div
                className={`sp-create-photo-sec ${isDraggingPhoto ? "sp-photo-drag-active" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(true);
                }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={(e) => handlePhotoDrop(e, "create")}
              >
                <div className="sp-photo-preview-wrap">
                  {createForm.profilePhoto && createForm.profilePhoto !== "none" ? (
                    <img
                      src={createForm.profilePhoto}
                      alt="Student Preview"
                      className="sp-photo-circle"
                    />
                  ) : (
                    <div className="sp-photo-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
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
                    aria-label="Upload Profile Photo"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </button>
                </div>

                <div className="sp-photo-actions-text">
                  <div className="sp-photo-header-line">
                    <h4 className="sp-photo-h">Student Profile Picture</h4>
                    <span className="sp-photo-tag">Official ID Photo</span>
                  </div>
                  <p className="sp-photo-p">
                    Upload a clear photo (JPG, PNG, or WEBP). Maximum 4MB. Drag and drop supported.
                  </p>
                  <div className="sp-photo-btns-row">
                    <button
                      type="button"
                      className="sp-btn-upload-file"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Choose Photo From Device
                    </button>
                    {createForm.profilePhoto && createForm.profilePhoto !== "none" && (
                      <button
                        type="button"
                        className="sp-btn-remove-photo"
                        onClick={() => handleRemovePhoto("create")}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {photoError && <span className="sp-photo-error" role="alert">{photoError}</span>}
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

              {/* Step 1: Personal & Academic Details */}
              <div className="sp-section-heading-row">
                <span className="sp-sec-step">1</span>
                <div>
                  <h3 className="sp-sec-title">Personal & University Information</h3>
                  <p className="sp-sec-desc">Enter your primary student details as registered in college.</p>
                </div>
              </div>

              <div className="sp-form-grid-2">
                <div className="sp-input-box">
                  <label htmlFor="student-name">
                    Full Student Name <span className="sp-req">*</span>
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    name="name"
                    value={createForm.name}
                    onChange={handleCreateChange}
                    onBlur={handleCreateBlur}
                    aria-invalid={Boolean(createErrors.name)}
                    placeholder="e.g. Jaswanth Reddy"
                    required
                  />
                  {createErrors.name && (
                    <span className="sp-field-error" role="alert">{createErrors.name}</span>
                  )}
                </div>

                <div className="sp-input-box">
                  <label htmlFor="hall-ticket">
                    USN / Hall Ticket Number <span className="sp-req">*</span>
                  </label>
                  <input
                    id="hall-ticket"
                    type="text"
                    name="hallTicket"
                    value={createForm.hallTicket}
                    onChange={handleCreateChange}
                    onBlur={handleCreateBlur}
                    aria-invalid={Boolean(createErrors.hallTicket)}
                    placeholder="e.g. 21B91A0201"
                    className="font-mono"
                    required
                  />
                  {createErrors.hallTicket && (
                    <span className="sp-field-error" role="alert">{createErrors.hallTicket}</span>
                  )}
                </div>

                <div className="sp-input-box">
                  <label htmlFor="branch-select">
                    Branch / Specialization <span className="sp-req">*</span>
                  </label>
                  <select
                    id="branch-select"
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
                    <label htmlFor="custom-branch">Specify Branch Name & Code</label>
                    <input
                      id="custom-branch"
                      type="text"
                      name="branch"
                      value={createForm.branch}
                      onChange={handleCreateChange}
                      onBlur={handleCreateBlur}
                      aria-invalid={Boolean(createErrors.branch)}
                      placeholder="e.g. Chemical Engineering (CHEM)"
                      required
                    />
                    {createErrors.branch && (
                      <span className="sp-field-error" role="alert">{createErrors.branch}</span>
                    )}
                  </div>
                )}

                <div className="sp-input-box">
                  <label htmlFor="college-name">
                    College / Institution Name <span className="sp-req">*</span>
                  </label>
                  <input
                    id="college-name"
                    type="text"
                    name="college"
                    value={createForm.college}
                    onChange={handleCreateChange}
                    onBlur={handleCreateBlur}
                    aria-invalid={Boolean(createErrors.college)}
                    placeholder="e.g. Madanapalle Institute of Technology & Science"
                    required
                  />
                  {createErrors.college && (
                    <span className="sp-field-error" role="alert">{createErrors.college}</span>
                  )}
                </div>

                <div className="sp-input-box">
                  <label htmlFor="email-address">
                    Email Address <span className="sp-req">*</span>
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateChange}
                    onBlur={handleCreateBlur}
                    aria-invalid={Boolean(createErrors.email)}
                    placeholder="e.g. jaswanth@gmail.com"
                    required
                  />
                  {createErrors.email && (
                    <span className="sp-field-error" role="alert">{createErrors.email}</span>
                  )}
                </div>

                <div className="sp-input-box">
                  <label htmlFor="phone-number">
                    Contact Phone Number <span className="sp-req">*</span>
                  </label>
                  <input
                    id="phone-number"
                    type="tel"
                    name="phone"
                    value={createForm.phone}
                    onChange={handleCreateChange}
                    onBlur={handleCreateBlur}
                    aria-invalid={Boolean(createErrors.phone)}
                    placeholder="e.g. +91 98765 43210"
                    required
                  />
                  {createErrors.phone && (
                    <span className="sp-field-error" role="alert">{createErrors.phone}</span>
                  )}
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
                      <option value="1-1">Semester 1-1</option>
                      <option value="1-2">Semester 1-2</option>
                      <option value="2-1">Semester 2-1</option>
                      <option value="2-2">Semester 2-2</option>
                      <option value="3-1">Semester 3-1</option>
                      <option value="3-2">Semester 3-2</option>
                      <option value="4-1">Semester 4-1</option>
                      <option value="4-2">Semester 4-2</option>
                    </select>
                  </div>
                </div>

                <div className="sp-input-box">
                  <label htmlFor="regulation-select">Curriculum Regulation</label>
                  <select
                    id="regulation-select"
                    name="regulation"
                    value={createForm.regulation}
                    onChange={handleCreateChange}
                    className="sp-select-input"
                  >
                    <option value="R23 Regulation">R23 Regulation (Latest JNTU)</option>
                    <option value="R20 Regulation">R20 Regulation</option>
                    <option value="R19 Regulation">R19 Regulation</option>
                    <option value="R18 Regulation">R18 Regulation</option>
                    <option value="R15 Regulation">R15 Regulation</option>
                  </select>
                </div>
              </div>

              <div className="sp-form-divider" />

              {/* Step 2: Attendance Tracker Input */}
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

                    <div className="sp-att-presets-row">
                      <button
                        type="button"
                        className={`sp-att-preset-btn ${createForm.attendancePercentage === 65 ? "active" : ""}`}
                        onClick={() => setCreateForm((prev) => ({ ...prev, attendancePercentage: 65 }))}
                      >
                        65% (Min Condonation)
                      </button>
                      <button
                        type="button"
                        className={`sp-att-preset-btn ${createForm.attendancePercentage === 75 ? "active" : ""}`}
                        onClick={() => setCreateForm((prev) => ({ ...prev, attendancePercentage: 75 }))}
                      >
                        75% (Min Safe)
                      </button>
                      <button
                        type="button"
                        className={`sp-att-preset-btn ${createForm.attendancePercentage === 82 ? "active" : ""}`}
                        onClick={() => setCreateForm((prev) => ({ ...prev, attendancePercentage: 82 }))}
                      >
                        82% (Default)
                      </button>
                      <button
                        type="button"
                        className={`sp-att-preset-btn ${createForm.attendancePercentage === 90 ? "active" : ""}`}
                        onClick={() => setCreateForm((prev) => ({ ...prev, attendancePercentage: 90 }))}
                      >
                        90% (Distinction)
                      </button>
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
                      aria-label="Attendance Percentage Slider"
                    />

                    <div className="sp-att-bar-track">
                      <div
                        className={`sp-att-bar-fill ${getAttendanceStatus(createForm.attendancePercentage).class}`}
                        style={{ width: `${createForm.attendancePercentage}%` }}
                      />
                      <div className="sp-att-marker mark-65" title="65% Condonation Limit">
                        <span>65%</span>
                      </div>
                      <div className="sp-att-marker mark-75" title="75% Safe Threshold">
                        <span>75%</span>
                      </div>
                    </div>
                  </div>

                  <div className={`sp-att-status-badge-card ${getAttendanceStatus(createForm.attendancePercentage).class}`}>
                    <div className="sp-att-status-header">
                      <span className="sp-att-status-icon">
                        {getAttendanceStatus(createForm.attendancePercentage).icon}
                      </span>
                      <strong>{getAttendanceStatus(createForm.attendancePercentage).label}</strong>
                    </div>
                    <p className="sp-att-status-text">
                      {getAttendanceStatus(createForm.attendancePercentage).desc}
                    </p>
                    <div className="sp-att-status-footer">
                      <span className="sp-att-rule-badge">Official JNTU Rule §4.2</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sp-form-divider" />

              {/* Step 3: Semester-wise CGPA / SGPA Section */}
              <div className="sp-section-heading-row">
                <span className="sp-sec-step">3</span>
                <div className="sp-sec-flex-header">
                  <div>
                    <h3 className="sp-sec-title">Semester-wise SGPA Performance</h3>
                    <p className="sp-sec-desc">
                      Enter your SGPA for each completed semester (1 through 8). Leave future semesters blank.
                    </p>
                  </div>
                  {liveCreateCgpa && (
                    <div className="sp-live-cgpa-pill">
                      <div className="sp-live-cgpa-score">
                        <span>CGPA:</span>
                        <strong>{liveCreateCgpa} / 10.0</strong>
                      </div>
                      {liveCreatePct && (
                        <span className="sp-live-equiv-tag">({liveCreatePct}%)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Live CGPA Summary Meter */}
              {liveCreateCgpa && (
                <div className="sp-live-metric-card">
                  <div className="sp-lmc-left">
                    <span className="sp-lmc-label">CALCULATED CGPA</span>
                    <strong className="sp-lmc-score">{liveCreateCgpa}</strong>
                    <span className="sp-lmc-standing">★ {liveCreateStanding}</span>
                  </div>
                  <div className="sp-lmc-right">
                    <div className="sp-lmc-stat">
                      <span>Equivalent %</span>
                      <strong>{liveCreatePct}%</strong>
                    </div>
                    <div className="sp-lmc-stat">
                      <span>Completed Semesters</span>
                      <strong>{liveCreateFilledCount} of 8</strong>
                    </div>
                    <div className="sp-lmc-stat">
                      <span>Credits Earned</span>
                      <strong>{liveCreateFilledCount * 20} / 160</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 8-Semester Matrix Grid */}
              <div className="sp-sem-matrix-grid">
                {createForm.semesterGrades.map((sem, idx) => {
                  const gradeInfo = getGradeLetter(sem.sgpa);
                  return (
                    <div key={idx} className={`sp-sem-input-card ${sem.sgpa ? "has-value" : ""}`}>
                      <div className="sp-sem-card-top">
                        <span className="sp-sem-tag">{sem.sem}</span>
                        <span className="sp-sem-subtext">20 Credits</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        placeholder="e.g. 8.75"
                        value={sem.sgpa}
                        onChange={(e) => handleCreateSemGradeChange(idx, e.target.value)}
                        className="sp-sem-score-input"
                        aria-label={`Semester ${sem.sem} SGPA`}
                      />
                      <div className="sp-sem-grade-footer">
                        {gradeInfo ? (
                          <span className="sp-grade-chip" style={{ color: gradeInfo.color }}>
                            {gradeInfo.grade} • {gradeInfo.label}
                          </span>
                        ) : (
                          <span className="sp-grade-chip-empty">Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Form Action */}
              <div className="sp-create-submit-bar">
                <button type="submit" className="sp-btn-create-submit">
                  <span className="sp-btn-shine" />
                  <span>✨ Create & Save My Student Profile</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ---------------------------------------------------------
              SCENARIO 2: CONFIGURED USER (EXECUTIVE ACADEMIC CARD)
              --------------------------------------------------------- */
          <div className="sp-page-card">
            {/* Hidden Input for Global Profile Photo Upload */}
            <input
              type="file"
              ref={editFileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handlePhotoUpload(e, "edit")}
            />

            {/* Academic Cover Banner with Three Dots Kebab Menu */}
            <div className="sp-page-banner">
              <div className="sp-page-banner-glow" />
              <div className="sp-banner-eyebrow" ref={menuRef}>
                <div className="sp-banner-left-info">
                  <span className="sp-banner-inst-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                    </svg>
                    JNTU Verified Student Record
                  </span>
                </div>

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
                    <button
                      type="button"
                      className="sp-kebab-item"
                      onClick={() => {
                        setShowMenu(false);
                        handlePrintIdCard();
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                      Print ID Card
                    </button>
                    {activeAvatar ? (
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
                    ) : (
                      <button
                        type="button"
                        className="sp-kebab-item"
                        onClick={() => {
                          setShowMenu(false);
                          editFileInputRef.current?.click();
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        Upload Photo
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
                      Switch / Logout
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
                  <div
                    className="sp-profile-photo-placeholder"
                    title="No Photo Set • Click to Upload Photo"
                    onClick={() => editFileInputRef.current?.click()}
                    style={{ cursor: "pointer" }}
                  >
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
                    Verified JNTU Student
                  </span>
                </div>
                <div className="sp-main-subtext">
                  <span
                    className="sp-main-roll clickable"
                    onClick={() => handleCopyUsn(student.hallTicket)}
                    title="Click to copy Hall Ticket Number"
                  >
                    <strong>{student.hallTicket}</strong>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </span>
                  <span className="sp-dot-separator">•</span>
                  <span>{student.branch} ({student.branchCode})</span>
                  <span className="sp-dot-separator">•</span>
                  <span className="sp-highlight-gold">{student.year || "3rd Year"} ({cleanSemester(student.semester)})</span>
                </div>
                <p className="sp-college-subtext">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sp-inst-icon">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                  <span>{cleanCollege(student.college)}</span>
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
                  ★ {getAcademicClassification(student.cgpa)}
                  {calculateEquivalentPercentage(student.cgpa) && ` (${calculateEquivalentPercentage(student.cgpa)}%)`}
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

            {/* Tabs Navigation (Professional Minimalist, No Forced Scrollbar) */}
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
                className={`sp-page-tab ${activeTab === "idcard" ? "active" : ""}`}
                onClick={() => setActiveTab("idcard")}
              >
                Digital ID Card
              </button>
              <button
                type="button"
                className={`sp-page-tab ${activeTab === "grades" ? "active" : ""}`}
                onClick={() => setActiveTab("grades")}
              >
                Semester Grades (SGPA)
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
                      <span className="sp-info-data">{cleanCollege(student.college)}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Affiliated University</span>
                      <span className="sp-info-data">{student.university}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Academic Level</span>
                      <span className="sp-info-data">{student.year || "3rd Year"} | {cleanSemester(student.semester)}</span>
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

              {/* TAB 2: DIGITAL ID CARD */}
              {activeTab === "idcard" && (
                <div className="sp-tab-fade">
                  <div className="sp-idcard-wrapper">
                    <div className="sp-idcard-badge-wrap">
                      <div className="sp-idcard-official-card" id="printable-id-card">
                        <div className="sp-idc-header">
                          <img src="/jntu-circle-logo.png" alt="University Logo" className="sp-idc-logo" />
                          <div className="sp-idc-univ-text">
                            <h3>JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY</h3>
                            <p>OFFICIAL STUDENT CREDENTIAL & DIGITAL IDENTITY CARD</p>
                          </div>
                        </div>

                        <div className="sp-idc-body">
                          <div className="sp-idc-photo-col">
                            {activeAvatar ? (
                              <img src={activeAvatar} alt={student.name} className="sp-idc-avatar" />
                            ) : (
                              <div className="sp-idc-avatar-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                            )}
                            <div className="sp-idc-valid-tag">VALID STUDENT</div>
                          </div>

                          <div className="sp-idc-info-col">
                            <h2 className="sp-idc-name">{student.name}</h2>
                            <div className="sp-idc-roll-line">
                              <span>USN / ROLL NO:</span>
                              <strong>{student.hallTicket}</strong>
                            </div>
                            <div className="sp-idc-details-grid">
                              <div>
                                <small>BRANCH</small>
                                <span>{student.branchCode}</span>
                              </div>
                              <div>
                                <small>LEVEL</small>
                                <span>{student.year} ({student.semester})</span>
                              </div>
                              <div>
                                <small>REGULATION</small>
                                <span>{student.regulation}</span>
                              </div>
                              <div>
                                <small>ATTENDANCE</small>
                                <span className={attendanceStatus.class}>{student.attendancePercentage || 75}% ({attendanceStatus.label.split(" ")[0]})</span>
                              </div>
                            </div>
                            <div className="sp-idc-college-line">
                              <small>COLLEGE / INSTITUTION</small>
                              <span>{student.college}</span>
                            </div>
                          </div>
                        </div>

                        <div className="sp-idc-footer">
                          <div className="sp-idc-barcode-sim">
                            <span className="sp-bar-lines" />
                            <small>{student.hallTicket} • JNTU-ID-VERIFIED</small>
                          </div>
                          <div className="sp-idc-seal-wrap">
                            <div className="sp-idc-seal">
                              <span>JNTU</span>
                              <small>OFFICIAL</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sp-idcard-actions">
                        <button
                          type="button"
                          className="sp-btn-print-action"
                          onClick={handlePrintIdCard}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                          </svg>
                          Download / Print ID Card
                        </button>
                        <button
                          type="button"
                          className="sp-btn-copy-usn"
                          onClick={() => handleCopyUsn(student.hallTicket)}
                        >
                          📋 Copy Hall Ticket Number
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SEMESTER GRADES */}
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
                        {calculateEquivalentPercentage(student.cgpa) && (
                          <small className="sp-cgpa-equiv">
                            Equivalent: {calculateEquivalentPercentage(student.cgpa)}%
                          </small>
                        )}
                      </div>
                    </div>

                    <table className="sp-full-table">
                      <thead>
                        <tr>
                          <th>Semester</th>
                          <th>Credits</th>
                          <th>SGPA Score</th>
                          <th>Visual Progression</th>
                          <th>Standing & Letter Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(student.semesterGrades || INITIAL_SEMESTERS).map((grade, index) => {
                          const sgpaNum = parseFloat(grade.sgpa);
                          const hasScore = !isNaN(sgpaNum) && sgpaNum > 0;
                          const gradeInfo = getGradeLetter(grade.sgpa);
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
                                      background:
                                        hasScore && sgpaNum >= 8.5
                                          ? "linear-gradient(90deg, #10b981, #fed866)"
                                          : hasScore && sgpaNum >= 7.0
                                          ? "#10b981"
                                          : "#3b82f6",
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
                                  {gradeInfo ? `${gradeInfo.grade} (${gradeInfo.label})` : "Pending"}
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

              {/* TAB 4: ATTENDANCE DETAILS */}
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
                        <div>
                          <strong>75% – 100%: Normal Eligibility</strong>
                          <p>Issued official examination hall ticket without penalty or condonation fee.</p>
                        </div>
                      </div>
                      <div className="sp-benchmark-item warn">
                        <div>
                          <strong>65% – 74%: Condonation Allowed</strong>
                          <p>Eligible upon payment of university condonation fee with medical or genuine reason approval.</p>
                        </div>
                      </div>
                      <div className="sp-benchmark-item danger">
                        <div>
                          <strong>Below 65%: Detained</strong>
                          <p>Not eligible for semester end examinations; student must repeat the semester.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SAVED NOTES */}
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
                              {note.units} | Instructor: {note.faculty}
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

              {/* TAB 6: EDIT PROFILE */}
              {activeTab === "edit" && (
                <div className="sp-tab-fade">
                  <form onSubmit={handleSaveProfile} className="sp-form-container">
                    <h3 className="sp-edit-section-title">Update Student Information</h3>

                    {/* Photo Edit */}
                    <div className="sp-edit-photo-strip">
                      <div className="sp-avatar-holder-mini">
                        {getStudentAvatarUrl(editForm.profilePhoto) ? (
                          <img
                            src={getStudentAvatarUrl(editForm.profilePhoto)}
                            alt="Edit Preview"
                            className="sp-edit-avatar-img"
                          />
                        ) : activeAvatar ? (
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
                          {(getStudentAvatarUrl(editForm.profilePhoto) || activeAvatar) && (
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
                          onBlur={handleEditBlur}
                          aria-invalid={Boolean(editErrors.name)}
                          required
                        />
                        {editErrors.name && (
                          <span className="sp-field-error" role="alert">{editErrors.name}</span>
                        )}
                      </div>

                      <div className="sp-input-group">
                        <label>Hall Ticket / Roll No.</label>
                        <input
                          type="text"
                          name="hallTicket"
                          value={editForm.hallTicket || ""}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          aria-invalid={Boolean(editErrors.hallTicket)}
                          className="font-mono"
                          required
                        />
                        {editErrors.hallTicket && (
                          <span className="sp-field-error" role="alert">{editErrors.hallTicket}</span>
                        )}
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
                          onBlur={handleEditBlur}
                          aria-invalid={Boolean(editErrors.branch)}
                          required
                        />
                        {editErrors.branch && (
                          <span className="sp-field-error" role="alert">{editErrors.branch}</span>
                        )}
                      </div>

                      <div className="sp-input-group">
                        <label>Branch Short Code</label>
                        <input
                          type="text"
                          name="branchCode"
                          value={editForm.branchCode || ""}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          aria-invalid={Boolean(editErrors.branchCode)}
                          required
                        />
                        {editErrors.branchCode && (
                          <span className="sp-field-error" role="alert">{editErrors.branchCode}</span>
                        )}
                      </div>
                    </div>

                    <div className="sp-input-group">
                      <label>College / Institution Name</label>
                      <input
                        type="text"
                        name="college"
                        value={editForm.college || ""}
                        onChange={handleEditChange}
                        onBlur={handleEditBlur}
                        aria-invalid={Boolean(editErrors.college)}
                        required
                      />
                      {editErrors.college && (
                        <span className="sp-field-error" role="alert">{editErrors.college}</span>
                      )}
                    </div>

                    <div className="sp-form-row-2">
                      <div className="sp-input-group">
                        <label>Institutional Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email || ""}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          aria-invalid={Boolean(editErrors.email)}
                        />
                        {editErrors.email && (
                          <span className="sp-field-error" role="alert">{editErrors.email}</span>
                        )}
                      </div>

                      <div className="sp-input-group">
                        <label>Contact Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={editForm.phone || ""}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          aria-invalid={Boolean(editErrors.phone)}
                        />
                        {editErrors.phone && (
                          <span className="sp-field-error" role="alert">{editErrors.phone}</span>
                        )}
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
                          onBlur={handleEditBlur}
                          aria-invalid={Boolean(editErrors.year)}
                        />
                        {editErrors.year && (
                          <span className="sp-field-error" role="alert">{editErrors.year}</span>
                        )}
                      </div>

                      <div className="sp-input-group">
                        <label>Current Semester</label>
                        <input
                          type="text"
                          name="semester"
                          value={editForm.semester || ""}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          aria-invalid={Boolean(editErrors.semester)}
                        />
                        {editErrors.semester && (
                          <span className="sp-field-error" role="alert">{editErrors.semester}</span>
                        )}
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
                        {editErrors.attendance && (
                          <span className="sp-field-error" role="alert">{editErrors.attendance}</span>
                        )}
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
                              aria-invalid={Boolean(editErrors[`sem_${idx}`])}
                              className="sp-sem-score-input"
                            />
                            {editErrors[`sem_${idx}`] && (
                              <span className="sp-field-error" role="alert">{editErrors[`sem_${idx}`]}</span>
                            )}
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

      {/* =========================================================
          STITCH MOBILE VIEW (SCREEN WIDTH <= 768px)
          Exact match to Stitch Screen: ef9d9d11bcc84239961a51c2ba1fa1e6
          ========================================================= */}
      <div className="sp-mobile-stitch-container">
        {/* BEGIN: MainHeader */}
        <header className="sp-m-header">
          {/* Top Action Row */}
          <div className="sp-m-topbar">
            <div className="sp-m-portal-badge" onClick={() => navigate("/")} title="JNTU Portal Home">
              <div className="sp-m-portal-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
              <div className="sp-m-portal-text">
                <span className="sp-m-portal-name">JNTU PORTAL</span>
                <span className="sp-m-portal-sub">Student Academic System</span>
              </div>
            </div>

            <div className="sp-m-top-actions">
              <button
                type="button"
                className="sp-m-action-btn"
                aria-label="Notifications"
                onClick={() => navigate("/notifications")}
                title="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

              <div className="sp-m-kebab-wrap" ref={mobileMenuRef}>
                <button
                  type="button"
                  className="sp-m-action-btn"
                  aria-label="Menu options"
                  onClick={() => setShowMobileMenu((prev) => !prev)}
                  title="Profile Menu"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2.2" />
                    <circle cx="12" cy="12" r="2.2" />
                    <circle cx="12" cy="19" r="2.2" />
                  </svg>
                </button>

                {showMobileMenu && (
                  <div className="sp-m-menu-dropdown">
                    <button
                      type="button"
                      className="sp-m-menu-item"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setActiveTab("edit");
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      className="sp-m-menu-item"
                      onClick={() => {
                        setShowMobileMenu(false);
                        mobileEditFileInputRef.current?.click();
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      Change Photo
                    </button>
                    <button
                      type="button"
                      className="sp-m-menu-item sp-m-menu-logout"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowLogoutModal(true);
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Log Out / Switch
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Identification Overview */}
          <div className="sp-m-identity">
            <div className="sp-m-avatar-container">
              <div className="sp-m-avatar-ring">
                <img
                  src={activeAvatar || chinnuDefaultAvatar}
                  alt={`Student Avatar - ${student.name || "Chinnu"}`}
                  className="sp-m-avatar-img"
                  onError={(e) => {
                    e.currentTarget.src = profileImgDefault;
                  }}
                />
                <span className="sp-m-status-dot" title="Active Enrolled" />
              </div>
            </div>

            <div className="sp-m-identity-details">
              <h1 className="sp-m-name">{student.name || "Chinnu"}</h1>
              <div className="sp-m-meta-row">
                <span className="sp-m-roll-pill">{student.hallTicket || "21B91A0201"}</span>
                <span className="sp-m-branch-text">{student.branch || "Electrical & Electronics Engineering (EEE)"}</span>
              </div>
              <div className="sp-m-tag-row">
                <span className="sp-m-sem-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {student.year || "3rd Year"} ({cleanSemester(student.semester)})
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* BEGIN: MainContent */}
        <main className="sp-m-content">
          {/* 4 High Impact Dark Emerald Stat Cards (2x2 grid) */}
          <section className="sp-m-metrics-grid" aria-label="Key Academic Metrics">
            {/* Card 1: CGPA */}
            <article className="sp-m-metric-card">
              <div className="sp-m-card-top">
                <span className="sp-m-card-label">CUMULATIVE CGPA</span>
                <div className="sp-m-icon-box sp-m-icon-gold">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
              </div>
              <div className="sp-m-card-value-row">
                <span className="sp-m-card-val-gold">{student.cgpa || "8.88"}</span>
                <span className="sp-m-card-val-sub">/ 10.0</span>
              </div>
              <div className="sp-m-card-badge-wrap">
                <span className="sp-m-standing-badge">
                  ★ Distinction Standing
                </span>
              </div>
            </article>

            {/* Card 2: Attendance */}
            <article className="sp-m-metric-card">
              <div className="sp-m-card-top">
                <span className="sp-m-card-label">TOTAL ATTENDANCE</span>
                <div className="sp-m-icon-box sp-m-icon-emerald">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
              </div>
              <div className="sp-m-card-value-row">
                <span className="sp-m-card-val-white">{student.attendancePercentage || 75}%</span>
                <span className="sp-m-card-sub-emerald">Threshold met</span>
              </div>
              <div className="sp-m-progress-track">
                <div
                  className="sp-m-progress-fill"
                  style={{ width: `${Math.min(100, Number(student.attendancePercentage) || 75)}%` }}
                />
              </div>
              <div className="sp-m-card-badge-wrap">
                <span className="sp-m-eligible-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Hall Ticket Eligible
                </span>
              </div>
            </article>

            {/* Card 3: Credits */}
            <article className="sp-m-metric-card">
              <div className="sp-m-card-top">
                <span className="sp-m-card-label">CREDITS COMPLETED</span>
                <div className="sp-m-icon-box sp-m-icon-emerald">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
              </div>
              <div className="sp-m-card-value-row">
                <span className="sp-m-card-val-white">
                  {(student.credits || "100 / 160").split("/")[0]?.trim() || "100"}
                </span>
                <span className="sp-m-card-val-sub">/ 160 Total</span>
              </div>
              <div className="sp-m-progress-track">
                <div
                  className="sp-m-progress-fill sp-m-progress-fill-emerald"
                  style={{ width: "62.5%" }}
                />
              </div>
              <div className="sp-m-card-desc">62.5% Degree Requirement</div>
            </article>

            {/* Card 4: Regulation */}
            <article className="sp-m-metric-card">
              <div className="sp-m-card-top">
                <span className="sp-m-card-label">CURRICULUM & BATCH</span>
                <div className="sp-m-icon-box sp-m-icon-emerald">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              </div>
              <div className="sp-m-card-value-row">
                <span className="sp-m-card-val-gold-reg">{student.regulation || "R16 Regulation"}</span>
              </div>
              <div className="sp-m-card-batch-row">
                <span>{student.branchCode || "EEE"} Dept</span>
                <span className="sp-m-dot-sep">•</span>
                <span>Batch {student.batch || "2021–25"}</span>
              </div>
            </article>
          </section>

          {/* Horizontally Scrollable Tabs Navigation */}
          <nav className="sp-m-tabs-nav" aria-label="Profile Tabs">
            <div className="sp-m-tabs-row">
              <button
                type="button"
                className={`sp-m-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <polyline points="17 11 19 13 23 9" />
                </svg>
                <span>Academic Details</span>
              </button>
              <button
                type="button"
                className={`sp-m-tab-btn ${activeTab === "grades" ? "active" : ""}`}
                onClick={() => setActiveTab("grades")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>Semester SGPA</span>
              </button>
              <button
                type="button"
                className={`sp-m-tab-btn ${activeTab === "attendance" ? "active" : ""}`}
                onClick={() => setActiveTab("attendance")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
                <span>Attendance ({student.attendancePercentage || 75}%)</span>
              </button>
              <button
                type="button"
                className={`sp-m-tab-btn ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Notes ({student.savedNotes?.length || 4})</span>
              </button>
            </div>
          </nav>

          {/* Tab Content Area */}
          {activeTab === "overview" && (
            <div className="sp-m-tab-pane">
              {/* Group 1: Academic Identification Card */}
              <div className="sp-m-white-card">
                <div className="sp-m-card-group-header">
                  <div className="sp-m-group-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                    </svg>
                  </div>
                  <h2 className="sp-m-group-title">ACADEMIC IDENTIFICATION</h2>
                </div>

                <div className="sp-m-detail-items">
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">FULL STUDENT NAME</p>
                    <p className="sp-m-detail-val font-bold">{student.name || "Chinnu"}</p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">HALL TICKET / USN</p>
                    <p className="sp-m-detail-val font-mono font-bold tracking-wide">{student.hallTicket || "21B91A0201"}</p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">DEPARTMENT & BRANCH</p>
                    <p className="sp-m-detail-val font-bold">{student.branch || "Electrical & Electronics Engineering (EEE)"}</p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">ACADEMIC LEVEL</p>
                    <p className="sp-m-detail-val font-bold">{student.year || "3rd Year"} | {cleanSemester(student.semester)}</p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">COLLEGE / INSTITUTION</p>
                    <p className="sp-m-detail-val font-semibold">{cleanCollege(student.college)}</p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">AFFILIATED UNIVERSITY & REGULATION</p>
                    <p className="sp-m-detail-val font-semibold">{student.university || "JNT University"} • {student.regulation || "R16 Regulation"}</p>
                  </div>
                </div>
              </div>

              {/* Group 2: Contact & Clearance Status Card */}
              <div className="sp-m-white-card">
                <div className="sp-m-detail-items">
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">OFFICIAL EMAIL</p>
                    <a className="sp-m-contact-link sp-m-link-green" href={`mailto:${student.email || "chinnu@gmail.com"}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>{student.email || "chinnu@gmail.com"}</span>
                    </a>
                  </div>

                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">CONTACT PHONE</p>
                    <a className="sp-m-contact-link" href={`tel:${student.phone || "+919876543210"}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>{student.phone || "+91 98765 43210"}</span>
                    </a>
                  </div>

                  <div className="sp-m-detail-box sp-m-clearance-box">
                    <div>
                      <p className="sp-m-detail-lbl">ATTENDANCE CLEARANCE</p>
                      <p className="sp-m-clearance-text">Eligible for mid & semester end examinations without condonation</p>
                    </div>
                    <span className="sp-m-clearance-pill">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      75% Clearance (Safe Standing)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Semester SGPA */}
          {activeTab === "grades" && (
            <div className="sp-m-tab-pane">
              <div className="sp-m-white-card">
                <div className="sp-m-card-group-header">
                  <div className="sp-m-group-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <h2 className="sp-m-group-title">SEMESTER PERFORMANCE MATRIX</h2>
                </div>

                <div className="sp-m-grades-list">
                  {(student.semesterGrades || []).map((grade, idx) => {
                    const sgpaNum = parseFloat(grade.sgpa);
                    const hasScore = !isNaN(sgpaNum) && sgpaNum > 0;
                    return (
                      <div key={idx} className="sp-m-grade-row">
                        <div className="sp-m-grade-left">
                          <strong>{grade.sem}</strong>
                          <span className="sp-m-grade-credits">{grade.credits || 20} Credits</span>
                        </div>
                        <div className="sp-m-grade-middle">
                          {hasScore ? (
                            <>
                              <div className="sp-m-score-val">{sgpaNum.toFixed(2)}</div>
                              <div className="sp-m-progress-track">
                                <div className="sp-m-progress-fill" style={{ width: `${(sgpaNum / 10) * 100}%` }} />
                              </div>
                            </>
                          ) : (
                            <span className="sp-m-score-pending">{grade.status || "Pending"}</span>
                          )}
                        </div>
                        <div className="sp-m-grade-right">
                          <span className={`sp-m-grade-badge ${hasScore && sgpaNum >= 8.5 ? "gold" : hasScore ? "green" : "gray"}`}>
                            {hasScore ? (sgpaNum >= 9.0 ? "Outstanding" : sgpaNum >= 8.0 ? "Distinction" : "Pass") : "Upcoming"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Attendance Details */}
          {activeTab === "attendance" && (
            <div className="sp-m-tab-pane">
              <div className="sp-m-white-card">
                <div className="sp-m-att-stat-box">
                  <div className="sp-m-att-big-circle">
                    <span className="sp-m-att-circle-val">{student.attendancePercentage || 75}%</span>
                    <span className="sp-m-att-circle-lbl">Attendance</span>
                  </div>
                  <div className="sp-m-att-status-info">
                    <span className="sp-m-clearance-pill">✓ Hall Ticket Eligible</span>
                    <h3 className="sp-m-att-h3">University Attendance Norms</h3>
                    <p className="sp-m-att-p">JNTU regulations require a minimum aggregate of 75% across all semester coursework.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Notes */}
          {activeTab === "notes" && (
            <div className="sp-m-tab-pane">
              <div className="sp-m-white-card">
                <div className="sp-m-notes-list">
                  {(student.savedNotes || []).map((note) => (
                    <div key={note.id} className="sp-m-note-item" onClick={() => navigate(`/notes?branch=${note.branch}`)}>
                      <div className="sp-m-note-header">
                        <span className="sp-m-note-branch">{note.branch}</span>
                        <span className="sp-m-note-sem">{note.sem}</span>
                      </div>
                      <h4 className="sp-m-note-title">{note.title}</h4>
                      <p className="sp-m-note-faculty">{note.units} • {note.faculty}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Edit Profile (Mobile) */}
          {activeTab === "edit" && (
            <div className="sp-m-tab-pane">
              <div className="sp-m-white-card">
                <h3 className="sp-m-edit-title">Edit Profile Details</h3>
                <form onSubmit={handleSaveProfile} className="sp-m-edit-form">
                  <div className="sp-m-input-item">
                    <label>Student Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name || ""}
                      onChange={handleEditChange}
                      onBlur={handleEditBlur}
                      aria-invalid={Boolean(editErrors.name)}
                      required
                    />
                    {editErrors.name && (
                      <span className="sp-field-error" role="alert">{editErrors.name}</span>
                    )}
                  </div>
                  <div className="sp-m-input-item">
                    <label>Hall Ticket / Roll No.</label>
                    <input
                      type="text"
                      name="hallTicket"
                      value={editForm.hallTicket || ""}
                      onChange={handleEditChange}
                      onBlur={handleEditBlur}
                      aria-invalid={Boolean(editErrors.hallTicket)}
                      required
                    />
                    {editErrors.hallTicket && (
                      <span className="sp-field-error" role="alert">{editErrors.hallTicket}</span>
                    )}
                  </div>
                  <div className="sp-m-input-item">
                    <label>Department / Branch</label>
                    <input
                      type="text"
                      name="branch"
                      value={editForm.branch || ""}
                      onChange={handleEditChange}
                      onBlur={handleEditBlur}
                      aria-invalid={Boolean(editErrors.branch)}
                      required
                    />
                    {editErrors.branch && (
                      <span className="sp-field-error" role="alert">{editErrors.branch}</span>
                    )}
                  </div>
                  <div className="sp-m-input-item">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email || ""}
                      onChange={handleEditChange}
                      onBlur={handleEditBlur}
                      aria-invalid={Boolean(editErrors.email)}
                    />
                    {editErrors.email && (
                      <span className="sp-field-error" role="alert">{editErrors.email}</span>
                    )}
                  </div>
                  <div className="sp-m-input-item">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone || ""}
                      onChange={handleEditChange}
                      onBlur={handleEditBlur}
                      aria-invalid={Boolean(editErrors.phone)}
                    />
                    {editErrors.phone && (
                      <span className="sp-field-error" role="alert">{editErrors.phone}</span>
                    )}
                  </div>
                  <div className="sp-m-edit-actions">
                    <button type="button" className="sp-m-btn-cancel" onClick={() => setActiveTab("overview")}>
                      Cancel
                    </button>
                    <button type="submit" className="sp-m-btn-save">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Footer CTA Button */}
          <div className="sp-m-footer-cta">
            <button
              type="button"
              className="sp-m-btn-download"
              onClick={handleDownloadPdf}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download Academic Summary (PDF)</span>
            </button>
          </div>
        </main>
      </div>

      <input
        type="file"
        ref={mobileEditFileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handlePhotoUpload(e, "edit")}
      />
    </div>
  );
}

export default StudentProfile;
