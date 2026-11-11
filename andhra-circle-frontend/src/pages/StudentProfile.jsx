import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import profileImgDefault from "../assets/jaswanth.webp";
import {
  EMPTY_STUDENT_DATA,
  INITIAL_SEMESTERS,
  getStoredStudentData,
  saveStoredStudentData,
  logoutStudentProfile,
  calculateCgpaFromGrades,
  getStudentAvatar,
  DEFAULT_STUDENT_AVATAR,
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
  const mobileEditFileInputRef = useRef(null);

  const [student, setStudent] = useState(getStoredStudentData());
  const [authUser, setAuthUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleAuth = () => {
      try {
        const raw = localStorage.getItem("user");
        setAuthUser(raw ? JSON.parse(raw) : null);
      } catch {
        setAuthUser(null);
      }
    };
    window.addEventListener("storage", handleAuth);
    window.addEventListener("authChanged", handleAuth);
    return () => {
      window.removeEventListener("storage", handleAuth);
      window.removeEventListener("authChanged", handleAuth);
    };
  }, []);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "grades" | "attendance" | "notes" | "edit"
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

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
    semester: "1st Semester",
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

  // Handle Photo Upload with strict validation (image types only, max 2MB)
  const handlePhotoUpload = (e, targetForm = "create") => {
    const file = e.target.files?.[0];
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
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    };
    reader.readAsDataURL(file);
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
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
        status: numericVal && !isNaN(numericVal) ? "Completed" : "Not Started",
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
        status: numericVal && !isNaN(numericVal) ? "Completed" : "Not Started",
      };
      return { ...prev, semesterGrades: updatedGrades };
    });
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
    const filledSems = createForm.semesterGrades.filter((g) => g.sgpa && !isNaN(g.sgpa)).length;
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
      year: "",
      semester: createForm.semester || "1st Semester",
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
    const filledSems = (editForm.semesterGrades || []).filter((g) => g.sgpa && !isNaN(g.sgpa)).length;
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
    setShowMenu(false);
    setShowMobileMenu(false);
    // Reset local state to fresh empty form
    setStudent({ ...EMPTY_STUDENT_DATA, isConfigured: false, name: "" });
    setCreateForm({
      name: "",
      branch: "Computer Science & Engineering",
      branchCode: "CSE",
      customBranch: "",
      hallTicket: "",
      college: "",
      email: "",
      phone: "",
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
  const currentAttendance = Number(student?.attendancePercentage || 0);
  const attendanceStatus = getAttendanceStatus(currentAttendance);
  const activeAvatar = getStudentAvatar(student);
  const hasCgpa = Boolean(student?.cgpa && !isNaN(Number(student.cgpa)) && Number(student.cgpa) > 0);
  const hasAttendance = Boolean(student?.attendancePercentage && Number(student.attendancePercentage) > 0);
  const hasCredits = Boolean(
    student?.credits &&
    student.credits !== "0 / 160" &&
    !String(student.credits).startsWith("0 /")
  );

  const handleDownloadPdf = () => {
    window.print();
  };

  // Reusable Create Profile Form for both Desktop and Mobile views
  const renderCreateProfileForm = () => (
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
            onBlur={handleCreateBlur}
            aria-invalid={Boolean(createErrors.name)}
            placeholder="Enter full student name"
            required
          />
          {createErrors.name && (
            <span className="sp-field-error" role="alert">{createErrors.name}</span>
          )}
        </div>

        <div className="sp-input-box">
          <label>USN / Hall Ticket Number <span className="sp-req">*</span></label>
          <input
            type="text"
            name="hallTicket"
            value={createForm.hallTicket}
            onChange={handleCreateChange}
            onBlur={handleCreateBlur}
            aria-invalid={Boolean(createErrors.hallTicket)}
            placeholder="Enter 10-digit Hall Ticket / USN"
            required
          />
          {createErrors.hallTicket && (
            <span className="sp-field-error" role="alert">{createErrors.hallTicket}</span>
          )}
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
            <label>Custom Branch Name <span className="sp-req">*</span></label>
            <input
              type="text"
              name="customBranch"
              value={createForm.customBranch}
              onChange={handleCreateChange}
              onBlur={handleCreateBlur}
              aria-invalid={Boolean(createErrors.branch)}
              placeholder="Enter branch / specialization"
              required
            />
            {createErrors.branch && (
              <span className="sp-field-error" role="alert">{createErrors.branch}</span>
            )}
          </div>
        )}

        <div className="sp-input-box">
          <label>College / Campus Name</label>
          <input
            type="text"
            name="college"
            value={createForm.college}
            onChange={handleCreateChange}
            placeholder="Enter college or campus name"
          />
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
            <option value="R16 Regulation">R16 Regulation</option>
            <option value="R15 Regulation">R15 Regulation</option>
          </select>
        </div>

        <div className="sp-input-box">
          <label>Current Semester</label>
          <select
            name="semester"
            value={createForm.semester}
            onChange={handleCreateChange}
            className="sp-select-input"
          >
            <option value="1st Semester">Semester 1 (Sem 1)</option>
            <option value="2nd Semester">Semester 2 (Sem 2)</option>
            <option value="3rd Semester">Semester 3 (Sem 3)</option>
            <option value="4th Semester">Semester 4 (Sem 4)</option>
            <option value="5th Semester">Semester 5 (Sem 5)</option>
            <option value="6th Semester">Semester 6 (Sem 6)</option>
            <option value="7th Semester">Semester 7 (Sem 7)</option>
            <option value="8th Semester">Semester 8 (Sem 8)</option>
          </select>
        </div>

        <div className="sp-input-box">
          <label>Student Email (Optional)</label>
          <input
            type="email"
            name="email"
            value={createForm.email}
            onChange={handleCreateChange}
            onBlur={handleCreateBlur}
            aria-invalid={Boolean(createErrors.email)}
            placeholder="Enter student email address"
          />
          {createErrors.email && (
            <span className="sp-field-error" role="alert">{createErrors.email}</span>
          )}
        </div>

        <div className="sp-input-box">
          <label>Phone Number (Optional)</label>
          <input
            type="tel"
            name="phone"
            value={createForm.phone}
            onChange={handleCreateChange}
            onBlur={handleCreateBlur}
            aria-invalid={Boolean(createErrors.phone)}
            placeholder="Enter 10-digit mobile number"
          />
          {createErrors.phone && (
            <span className="sp-field-error" role="alert">{createErrors.phone}</span>
          )}
        </div>
      </div>

      <div className="sp-form-divider" />

      {/* Attendance Benchmark */}
      <div className="sp-section-heading-row">
        <span className="sp-sec-step">2</span>
        <div>
          <h3 className="sp-sec-title">Current Semester Attendance</h3>
          <p className="sp-sec-desc">Keep track of your JNTU examination eligibility status.</p>
        </div>
      </div>

      <div className="sp-att-slider-box">
        <div className="sp-att-slider-header">
          <span>Self-Reported Attendance:</span>
          <strong className={createForm.attendancePercentage >= 75 ? "sp-att-num-safe" : "sp-att-num-warn"}>
            {createForm.attendancePercentage}%
          </strong>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          name="attendancePercentage"
          value={createForm.attendancePercentage}
          onChange={handleCreateChange}
          className="sp-range-slider"
        />
        <div className="sp-slider-labels">
          <span>0% (Detained)</span>
          <span className="sp-lbl-75">75% (Min. Required)</span>
          <span>100% (Perfect)</span>
        </div>
      </div>

      <div className="sp-form-divider" />

      {/* Semester Academic Matrix (SGPAs) */}
      <div className="sp-section-heading-row">
        <span className="sp-sec-step">3</span>
        <div className="sp-sec-heading-flex">
          <div>
            <h3 className="sp-sec-title">Semester Grades (SGPA)</h3>
            <p className="sp-sec-desc">Enter your SGPA for completed semesters (0.00 – 10.00). Leave blank if in progress.</p>
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
            <div className="sp-sem-card-header">
              <span className="sp-sem-tag">{sem.sem}</span>
              <span className="sp-sem-subtext">20 Credits</span>
            </div>
            <div className="sp-sem-input-wrapper">
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="SGPA (e.g. 8.75)"
                value={sem.sgpa}
                onChange={(e) => handleCreateSemGradeChange(idx, e.target.value)}
                className="sp-sem-score-input"
              />
            </div>
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
  );

  return (
    <div className="student-profile-page">
      {/* =========================================================
          LOGOUT CONFIRMATION MODAL (ACCESSIBLE ON BOTH DESKTOP & MOBILE)
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
          MAIN CONTAINER
          ========================================================= */}
        <main className="sp-page-main">
          {saveSuccess && (
            <div className="sp-floating-toast">
              <span className="sp-toast-icon">✓</span>
              <span>Profile successfully updated and saved securely!</span>
            </div>
          )}

          {/* =========================================================
            EXECUTIVE ACADEMIC DASHBOARD (ALWAYS RENDERED)
            Shows interactive '+ Add Details' prompts when fields are empty
            ========================================================= */}
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
                    alt={student.name || "Student"}
                    className="sp-profile-photo"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="sp-profile-photo-placeholder sp-clickable-avatar"
                    onClick={() => editFileInputRef.current?.click()}
                    title="Click to upload profile photo"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="sp-avatar-add-overlay">+ Photo</span>
                  </div>
                )}
                <span className="sp-online-dot" title="Active Student Status" />
              </div>

              <div className="sp-identity-details">
                <div className="sp-name-badge-row">
                  <h1 className="sp-main-name">
                    {student.name?.trim() || authUser?.name || "Student Scholar"}
                  </h1>
                  {isConfigured ? (
                    <span className="sp-verified-pill">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Verified Academic Record
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="sp-inline-add-chip sp-inline-add-accent"
                      onClick={() => setActiveTab("edit")}
                    >
                      + Complete Profile
                    </button>
                  )}
                </div>

                <div className="sp-main-subtext">
                  {student.hallTicket?.trim() ? (
                    <strong className="sp-main-roll">{student.hallTicket}</strong>
                  ) : (
                    <button
                      type="button"
                      className="sp-inline-add-chip"
                      onClick={() => setActiveTab("edit")}
                      title="Add your Hall Ticket Number"
                    >
                      + Add Hall Ticket / USN
                    </button>
                  )}

                  <span className="sp-dot-separator">•</span>

                  {student.branch?.trim() ? (
                    <span>{student.branch} {student.branchCode ? `(${student.branchCode})` : ""}</span>
                  ) : (
                    <button
                      type="button"
                      className="sp-inline-add-chip"
                      onClick={() => setActiveTab("edit")}
                      title="Add your engineering branch"
                    >
                      + Add Branch
                    </button>
                  )}

                  <span className="sp-dot-separator">•</span>

                  {student.semester?.trim() ? (
                    <span className="sp-highlight-gold">
                      {cleanSemester(student.semester)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="sp-inline-add-chip"
                      onClick={() => setActiveTab("edit")}
                      title="Add academic semester"
                    >
                      + Add Semester
                    </button>
                  )}
                </div>

                <div className="sp-college-subtext">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sp-inst-icon">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                  {student.college?.trim() ? (
                    <span>{cleanCollege(student.college)}</span>
                  ) : (
                    <button
                      type="button"
                      className="sp-inline-add-chip"
                      onClick={() => setActiveTab("edit")}
                      title="Add college or campus name"
                    >
                      + Add College / Campus
                    </button>
                  )}
                </div>
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
                  {hasCgpa ? (
                    <>
                      {student.cgpa} <span className="sp-pm-max">/ 10.0</span>
                    </>
                  ) : (
                    <span className="sp-pm-empty">0.00 <span className="sp-pm-max">/ 10.0</span></span>
                  )}
                </div>
                <div className="sp-pm-desc sp-gold-sub">
                  {hasCgpa ? (
                    Number(student.cgpa) >= 8.5
                      ? "★ Distinction Standing"
                      : Number(student.cgpa) >= 7.0
                        ? "✓ First Class Standing"
                        : "Active Academic Record"
                  ) : (
                    <button
                      type="button"
                      className="sp-kpi-add-link"
                      onClick={() => setActiveTab("edit")}
                    >
                      + Add SGPA Grades →
                    </button>
                  )}
                </div>
              </div>

              <div className={`sp-p-metric sp-metric-bot-theme ${hasAttendance ? attendanceStatus.class : ""}`}>
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
                  {hasAttendance ? `${student.attendancePercentage}%` : "0%"}
                </div>
                <div className="sp-pm-desc">
                  {hasAttendance ? (
                    <div className={`sp-pm-badge-pill ${attendanceStatus.class}`}>
                      {attendanceStatus.icon} {currentAttendance >= 75 ? "Hall Ticket Eligible" : "Action Required"}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="sp-kpi-add-link"
                      onClick={() => setActiveTab("edit")}
                    >
                      + Set Attendance →
                    </button>
                  )}
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
                <div className="sp-pm-desc sp-credits-sub">
                  {hasCredits ? (
                    "B.Tech Degree Requirement"
                  ) : (
                    <button
                      type="button"
                      className="sp-kpi-add-link"
                      onClick={() => setActiveTab("edit")}
                    >
                      + Track Credits →
                    </button>
                  )}
                </div>
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
                <div className="sp-pm-val sp-reg-val">{student.regulation || "R23 Regulation"}</div>
                <div className="sp-pm-desc sp-reg-sub">
                  {student.branchCode ? (
                    `${student.branchCode} Department`
                  ) : (
                    <button
                      type="button"
                      className="sp-kpi-add-link"
                      onClick={() => setActiveTab("edit")}
                    >
                      + Select Regulation →
                    </button>
                  )}
                </div>
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
                      <span className="sp-info-data">
                        {student.name?.trim() || (
                          <button type="button" className="sp-inline-add-btn" onClick={() => setActiveTab("edit")}>
                            + Add Full Name
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Hall Ticket / USN</span>
                      <span className="sp-info-data font-mono">
                        {student.hallTicket?.trim() || (
                          <button type="button" className="sp-inline-add-btn" onClick={() => setActiveTab("edit")}>
                            + Add Hall Ticket
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Department & Branch</span>
                      <span className="sp-info-data">
                        {student.branch?.trim() ? (
                          `${student.branch} ${student.branchCode ? `(${student.branchCode})` : ""}`
                        ) : (
                          <button type="button" className="sp-inline-add-btn" onClick={() => setActiveTab("edit")}>
                            + Add Department & Branch
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">College / Institution</span>
                      <span className="sp-info-data">
                        {student.college?.trim() ? (
                          cleanCollege(student.college)
                        ) : (
                          <button type="button" className="sp-inline-add-btn" onClick={() => setActiveTab("edit")}>
                            + Add College / Campus
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Affiliated University</span>
                      <span className="sp-info-data">{student.university || "JNT University"}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Academic Semester</span>
                      <span className="sp-info-data">
                        {student.semester?.trim() ? (
                          cleanSemester(student.semester)
                        ) : (
                          <button type="button" className="sp-inline-add-btn" onClick={() => setActiveTab("edit")}>
                            + Add Semester
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Curriculum Regulation</span>
                      <span className="sp-info-data">{student.regulation || "R23 Regulation"}</span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Email Address</span>
                      <span className="sp-info-data sp-text-link">
                        {student.email?.trim() || (
                          <button type="button" className="sp-inline-add-btn" onClick={() => setActiveTab("edit")}>
                            + Add Email Address
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Contact Phone</span>
                      <span className="sp-info-data">
                        {student.phone?.trim() || (
                          <button type="button" className="sp-inline-add-btn" onClick={() => setActiveTab("edit")}>
                            + Add Phone Number
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="sp-info-card">
                      <span className="sp-info-label">Attendance Clearance</span>
                      <span className={`sp-info-data ${hasAttendance ? attendanceStatus.class : ""}`}>
                        {hasAttendance ? (
                          `${student.attendancePercentage}% — ${attendanceStatus.label}`
                        ) : (
                          <button type="button" className="sp-inline-add-btn" onClick={() => setActiveTab("edit")}>
                            + Set Attendance Record
                          </button>
                        )}
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
                        <strong>{hasCgpa ? `${student.cgpa} / 10.0` : "-- / 10.0"}</strong>
                      </div>
                    </div>

                    {!hasCgpa && (
                      <div className="sp-tab-empty-banner">
                        <div className="sp-tab-empty-icon">📊</div>
                        <div className="sp-tab-empty-info">
                          <h4>Semester Grades Not Yet Recorded</h4>
                          <p>
                            Enter your SGPA for completed semesters to generate your progression progression and official CGPA standing.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="sp-unconfigured-add-btn"
                          onClick={() => setActiveTab("edit")}
                        >
                          + Enter Semester Grades
                        </button>
                      </div>
                    )}

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
                                  className={`sp-badge-status ${hasScore && sgpaNum >= 8.5
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
                    {!hasAttendance && (
                      <div className="sp-tab-empty-banner" style={{ marginBottom: "16px" }}>
                        <div className="sp-tab-empty-icon">📋</div>
                        <div className="sp-tab-empty-info">
                          <h4>Attendance Record Pending</h4>
                          <p>
                            Add your current self-reported attendance percentage to monitor your examination hall ticket eligibility according to university rules.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="sp-unconfigured-add-btn"
                          onClick={() => setActiveTab("edit")}
                        >
                          + Set Attendance
                        </button>
                      </div>
                    )}

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
                          <p>Issued official examination hall ticket without penalty.</p>
                        </div>
                      </div>
                      <div className="sp-benchmark-item warn">

                        <div>
                          <strong>65% – 74%: Condonation Allowed</strong>
                          <p>Eligible upon payment of university condonation fee with medical proof.</p>
                        </div>
                      </div>
                      <div className="sp-benchmark-item danger">

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
                        <label>Current Semester</label>
                        <select
                          name="semester"
                          value={editForm.semester || "1st Semester"}
                          onChange={handleEditChange}
                          className="sp-select-input"
                        >
                          <option value="1st Semester">Semester 1 (Sem 1)</option>
                          <option value="2nd Semester">Semester 2 (Sem 2)</option>
                          <option value="3rd Semester">Semester 3 (Sem 3)</option>
                          <option value="4th Semester">Semester 4 (Sem 4)</option>
                          <option value="5th Semester">Semester 5 (Sem 5)</option>
                          <option value="6th Semester">Semester 6 (Sem 6)</option>
                          <option value="7th Semester">Semester 7 (Sem 7)</option>
                          <option value="8th Semester">Semester 8 (Sem 8)</option>
                        </select>
                        {editErrors.semester && (
                          <span className="sp-field-error" role="alert">{editErrors.semester}</span>
                        )}
                      </div>

                      <div className="sp-input-group">
                        <label>Curriculum Regulation</label>
                        <select
                          name="regulation"
                          value={editForm.regulation || "R23 Regulation"}
                          onChange={handleEditChange}
                          className="sp-select-input"
                        >
                          <option value="R23 Regulation">R23 Regulation</option>
                          <option value="R20 Regulation">R20 Regulation</option>
                          <option value="R19 Regulation">R19 Regulation</option>
                          <option value="R16 Regulation">R16 Regulation</option>
                          <option value="R15 Regulation">R15 Regulation</option>
                        </select>
                      </div>
                    </div>

                    <div className="sp-form-row-1">
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
                            <div className="sp-sem-card-header">
                              <span className="sp-sem-tag">{sem.sem}</span>
                              <span className="sp-sem-subtext">20 Credits</span>
                            </div>
                            <div className="sp-sem-input-wrapper">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                placeholder="SGPA (e.g. 8.75)"
                                value={sem.sgpa || ""}
                                onChange={(e) => handleEditSemGradeChange(idx, e.target.value)}
                                aria-invalid={Boolean(editErrors[`sem_${idx}`])}
                                className="sp-sem-score-input"
                              />
                            </div>
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
        </main>
      </div>

      {/* =========================================================
          STITCH MOBILE VIEW (SCREEN WIDTH <= 768px)
          Always renders the mobile dashboard with '+ Add' triggers
          ========================================================= */}
      <div className="sp-mobile-stitch-container">
        {/* BEGIN: MainHeader */}
        <header className="sp-m-header">
          {/* Top Action Row */}
          <div className="sp-m-topbar">
            <div className="sp-m-topbar-left">
              <button
                type="button"
                className="sp-m-back-btn"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/");
                  }
                }}
                aria-label="Go Back"
                title="Go Back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>

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
                        navigate("/");
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      Back to Home
                    </button>
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
              <div
                className="sp-m-avatar-ring sp-clickable-avatar"
                onClick={() => mobileEditFileInputRef.current?.click()}
                title="Tap to change photo"
              >
                <img
                  src={activeAvatar || profileImgDefault}
                  alt={`Student Avatar - ${student.name || "Student"}`}
                  className="sp-m-avatar-img"
                  onError={(e) => {
                    e.currentTarget.src = profileImgDefault;
                  }}
                />
                <span className="sp-m-status-dot" title="Active Enrolled" />
              </div>
            </div>

            <div className="sp-m-identity-details">
              <h1 className="sp-m-name">{student.name?.trim() || authUser?.name || "Student Scholar"}</h1>
              <div className="sp-m-meta-row">
                {student.hallTicket?.trim() ? (
                  <span className="sp-m-roll-pill">{student.hallTicket}</span>
                ) : (
                  <button
                    type="button"
                    className="sp-m-add-chip"
                    onClick={() => setActiveTab("edit")}
                  >
                    + Add Roll No
                  </button>
                )}
                {student.branch?.trim() ? (
                  <span className="sp-m-branch-text">{student.branch}</span>
                ) : (
                  <button
                    type="button"
                    className="sp-m-add-chip"
                    onClick={() => setActiveTab("edit")}
                  >
                    + Add Branch
                  </button>
                )}
              </div>
              <div className="sp-m-tag-row">
                {student.semester?.trim() ? (
                  <span className="sp-m-sem-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {cleanSemester(student.semester)}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="sp-m-add-chip"
                    onClick={() => setActiveTab("edit")}
                  >
                    + Add Semester
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="sp-m-content">
          {/* 4 Metric Cards */}
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
                <span className="sp-m-card-val-gold">{hasCgpa ? student.cgpa : "--"}</span>
                <span className="sp-m-card-val-sub">/ 10.0</span>
              </div>
              <div className="sp-m-card-badge-wrap">
                {hasCgpa ? (
                  <span className="sp-m-standing-badge">
                    {Number(student.cgpa) >= 8.5 ? "★ Distinction Standing" : "✓ Active Standing"}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="sp-m-kpi-add-link"
                    onClick={() => setActiveTab("edit")}
                  >
                    + Add SGPA →
                  </button>
                )}
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
                <span className="sp-m-card-val-white">{hasAttendance ? `${student.attendancePercentage}%` : "--%"}</span>
                <span className="sp-m-card-sub-emerald">
                  {hasAttendance ? (currentAttendance >= 75 ? "Threshold met" : "Action req.") : "Pending"}
                </span>
              </div>
              <div className="sp-m-progress-track">
                <div
                  className="sp-m-progress-fill"
                  style={{ width: `${Math.min(100, Number(student.attendancePercentage) || 0)}%` }}
                />
              </div>
              <div className="sp-m-card-badge-wrap">
                {hasAttendance ? (
                  <span className={`sp-m-eligible-badge ${currentAttendance < 75 ? "warn" : ""}`}>
                    {currentAttendance >= 75 ? "✓ Hall Ticket Eligible" : "⚠️ Condonation Needed"}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="sp-m-kpi-add-link"
                    onClick={() => setActiveTab("edit")}
                  >
                    + Set Attendance →
                  </button>
                )}
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
                  {(student.credits || "0 / 160").split("/")[0]?.trim() || "0"}
                </span>
                <span className="sp-m-card-val-sub">/ 160 Total</span>
              </div>
              <div className="sp-m-progress-track">
                <div
                  className="sp-m-progress-fill sp-m-progress-fill-emerald"
                  style={{
                    width: `${Math.min(100, ((parseFloat(student.credits) || 0) / 160) * 100)}%`
                  }}
                />
              </div>
              <div className="sp-m-card-desc">
                {hasCredits ? "Degree Requirement" : (
                  <button
                    type="button"
                    className="sp-m-kpi-add-link"
                    onClick={() => setActiveTab("edit")}
                  >
                    + Track Credits →
                  </button>
                )}
              </div>
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
                <span className="sp-m-card-val-gold-reg">{student.regulation || "R23 Regulation"}</span>
              </div>
              <div className="sp-m-card-batch-row">
                <span>{student.branchCode || "Engineering"}</span>
                <span className="sp-m-dot-sep">•</span>
                <span>{student.batch || "Active"}</span>
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
                <span>Details</span>
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
                <span>SGPA</span>
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
                <span>Attendance</span>
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
                <span>Notes ({student.savedNotes?.length || 0})</span>
              </button>
              <button
                type="button"
                className={`sp-m-tab-btn ${activeTab === "edit" ? "active" : ""}`}
                onClick={() => setActiveTab("edit")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>Edit Profile</span>
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
                    <p className="sp-m-detail-val font-bold">
                      {student.name?.trim() || (
                        <button type="button" className="sp-m-add-link-btn" onClick={() => setActiveTab("edit")}>
                          + Add Full Name
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">HALL TICKET / USN</p>
                    <p className="sp-m-detail-val font-mono font-bold tracking-wide">
                      {student.hallTicket?.trim() || (
                        <button type="button" className="sp-m-add-link-btn" onClick={() => setActiveTab("edit")}>
                          + Add Hall Ticket
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">DEPARTMENT & BRANCH</p>
                    <p className="sp-m-detail-val font-bold">
                      {student.branch?.trim() ? (
                        `${student.branch} ${student.branchCode ? `(${student.branchCode})` : ""}`
                      ) : (
                        <button type="button" className="sp-m-add-link-btn" onClick={() => setActiveTab("edit")}>
                          + Add Branch
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">ACADEMIC SEMESTER</p>
                    <p className="sp-m-detail-val font-bold">
                      {student.semester?.trim() ? (
                        cleanSemester(student.semester)
                      ) : (
                        <button type="button" className="sp-m-add-link-btn" onClick={() => setActiveTab("edit")}>
                          + Add Semester
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">COLLEGE / INSTITUTION</p>
                    <p className="sp-m-detail-val font-semibold">
                      {student.college?.trim() ? (
                        cleanCollege(student.college)
                      ) : (
                        <button type="button" className="sp-m-add-link-btn" onClick={() => setActiveTab("edit")}>
                          + Add College / Campus
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">AFFILIATED UNIVERSITY & REGULATION</p>
                    <p className="sp-m-detail-val font-semibold">{student.university || "JNT University"} • {student.regulation || "R23 Regulation"}</p>
                  </div>
                </div>
              </div>

              {/* Group 2: Contact & Clearance Status Card */}
              <div className="sp-m-white-card">
                <div className="sp-m-detail-items">
                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">OFFICIAL EMAIL</p>
                    {student.email?.trim() ? (
                      <a className="sp-m-contact-link sp-m-link-green" href={`mailto:${student.email}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span>{student.email}</span>
                      </a>
                    ) : (
                      <button type="button" className="sp-m-add-link-btn" onClick={() => setActiveTab("edit")}>
                        + Add Email Address
                      </button>
                    )}
                  </div>

                  <div className="sp-m-detail-box">
                    <p className="sp-m-detail-lbl">CONTACT PHONE</p>
                    {student.phone?.trim() ? (
                      <a className="sp-m-contact-link" href={`tel:${student.phone}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{student.phone}</span>
                      </a>
                    ) : (
                      <button type="button" className="sp-m-add-link-btn" onClick={() => setActiveTab("edit")}>
                        + Add Contact Phone
                      </button>
                    )}
                  </div>

                  <div className="sp-m-detail-box sp-m-clearance-box">
                    <div>
                      <p className="sp-m-detail-lbl">ATTENDANCE CLEARANCE</p>
                      <p className="sp-m-clearance-text">
                        {hasAttendance
                          ? (currentAttendance >= 75
                            ? "Eligible for mid & semester end examinations without condonation"
                            : "Examination detention risk / condonation fee required")
                          : "Attendance tracking pending"}
                      </p>
                    </div>
                    {hasAttendance ? (
                      <span className={`sp-m-clearance-pill ${currentAttendance < 75 ? "warn" : ""}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                        {student.attendancePercentage}% Clearance ({attendanceStatus.label})
                      </span>
                    ) : (
                      <button type="button" className="sp-m-add-link-btn" onClick={() => setActiveTab("edit")}>
                        + Set Attendance Record
                      </button>
                    )}
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

                <div className="sp-m-grades-header-bar">
                  <div className="sp-m-cgpa-stat">
                    <span className="sp-m-cgpa-lbl">Cumulative CGPA</span>
                    <strong className="sp-m-cgpa-val">{hasCgpa ? `${student.cgpa} / 10.0` : "-- / 10.0"}</strong>
                  </div>
                  <button
                    type="button"
                    className="sp-m-btn-edit-grades"
                    onClick={() => setActiveTab("edit")}
                  >
                    ✏️ Edit Grades
                  </button>
                </div>

                <div className="sp-m-grades-list">
                  {(student.semesterGrades || INITIAL_SEMESTERS).map((grade, idx) => {
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
                            <span className="sp-m-score-not-entered">Not entered</span>
                          )}
                        </div>
                        <div className="sp-m-grade-right">
                          {hasScore ? (
                            <span className={`sp-m-grade-badge ${sgpaNum >= 8.5 ? "gold" : "green"}`}>
                              {sgpaNum >= 9.0 ? "Outstanding" : sgpaNum >= 8.0 ? "Distinction" : "Pass"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="sp-m-add-grade-btn"
                              onClick={() => setActiveTab("edit")}
                            >
                              + Add SGPA
                            </button>
                          )}
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
                    <label>Branch Short Code (e.g. CSE, EEE)</label>
                    <input
                      type="text"
                      name="branchCode"
                      value={editForm.branchCode || ""}
                      onChange={handleEditChange}
                      onBlur={handleEditBlur}
                    />
                  </div>
                  <div className="sp-m-input-item">
                    <label>College / Campus Name</label>
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
                  <div className="sp-m-input-item">
                    <label>Current Semester</label>
                    <select
                      name="semester"
                      value={editForm.semester || "1st Semester"}
                      onChange={handleEditChange}
                      className="sp-m-select-input"
                    >
                      <option value="1st Semester">Semester 1 (Sem 1)</option>
                      <option value="2nd Semester">Semester 2 (Sem 2)</option>
                      <option value="3rd Semester">Semester 3 (Sem 3)</option>
                      <option value="4th Semester">Semester 4 (Sem 4)</option>
                      <option value="5th Semester">Semester 5 (Sem 5)</option>
                      <option value="6th Semester">Semester 6 (Sem 6)</option>
                      <option value="7th Semester">Semester 7 (Sem 7)</option>
                      <option value="8th Semester">Semester 8 (Sem 8)</option>
                    </select>
                  </div>
                  <div className="sp-m-input-item">
                    <label>Curriculum Regulation</label>
                    <select
                      name="regulation"
                      value={editForm.regulation || "R23 Regulation"}
                      onChange={handleEditChange}
                      className="sp-m-select-input"
                    >
                      <option value="R23 Regulation">R23 Regulation</option>
                      <option value="R20 Regulation">R20 Regulation</option>
                      <option value="R19 Regulation">R19 Regulation</option>
                      <option value="R16 Regulation">R16 Regulation</option>
                      <option value="R15 Regulation">R15 Regulation</option>
                    </select>
                  </div>
                  <div className="sp-m-input-item">
                    <label>Attendance Percentage (%)</label>
                    <input
                      type="number"
                      name="attendancePercentage"
                      min="0"
                      max="100"
                      value={editForm.attendancePercentage !== undefined ? editForm.attendancePercentage : ""}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="sp-m-input-item">
                    <div className="sp-m-sem-grades-heading">
                      <label>Semester Grades (SGPA 1 – 8)</label>
                      {calculateCgpaFromGrades(editForm.semesterGrades) && (
                        <span className="sp-m-cgpa-pill">
                          CGPA: {calculateCgpaFromGrades(editForm.semesterGrades)} / 10.0
                        </span>
                      )}
                    </div>
                    <p className="sp-m-sem-grades-hint">
                      Enter SGPA for completed semesters (0.00 – 10.00). Leave blank if in progress.
                    </p>
                    <div className="sp-sem-matrix-grid">
                      {(editForm.semesterGrades || INITIAL_SEMESTERS).map((sem, idx) => (
                        <div key={idx} className="sp-sem-input-card">
                          <div className="sp-sem-card-header">
                            <span className="sp-sem-tag">{sem.sem}</span>
                            <span className="sp-sem-subtext">20 Credits</span>
                          </div>
                          <div className="sp-sem-input-wrapper">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              placeholder="SGPA (e.g. 8.75)"
                              value={sem.sgpa || ""}
                              onChange={(e) => handleEditSemGradeChange(idx, e.target.value)}
                              className="sp-sem-score-input"
                            />
                          </div>
                          {editErrors[`sem_${idx}`] && (
                            <span className="sp-field-error" role="alert">{editErrors[`sem_${idx}`]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sp-m-edit-actions">
                    <button type="button" className="sp-m-btn-cancel" onClick={() => setActiveTab("overview")}>
                      Cancel
                    </button>
                    <button type="submit" className="sp-m-btn-save">
                      Save Profile Changes
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
