import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredStudentData, saveStoredStudentData } from "../data/studentData";
import {
  R23_SUBJECTS_BY_BRANCH_SEM,
  ALL_R23_SUBJECTS_LIST,
  detectSubjectCredits,
  getR23PresetSubjects,
} from "../data/r23Subjects";
import {
  validateName,
  validateHallTicket,
  validateGradePoint,
  validateSubjectMarks,
  validateSubjectCredits,
} from "../utils/validators";
import Footer from "../components/Footer";
import "./Calculator.css";

// JNTU 10-Point Absolute Grading Scale: Marks to Grade & Points Converter
function getGradeInfoFromMarks(marks) {
  if (marks === "" || marks === null || marks === undefined) {
    return { grade: "", points: 0, hasMarks: false, isValid: true, desc: "Awaiting Marks", color: "#8fa39c" };
  }
  const check = validateSubjectMarks(marks);
  if (!check.ok) {
    return { grade: "", points: 0, hasMarks: false, isValid: false, desc: check.message, color: "#dc2626" };
  }
  const m = check.value;
  if (m >= 90) return { grade: "O", points: 10, hasMarks: true, isValid: true, desc: "Outstanding", color: "#10b981" };
  if (m >= 80) return { grade: "A+", points: 9, hasMarks: true, isValid: true, desc: "Excellent", color: "#0d9488" };
  if (m >= 70) return { grade: "A", points: 8, hasMarks: true, isValid: true, desc: "Very Good", color: "#0284c7" };
  if (m >= 60) return { grade: "B+", points: 7, hasMarks: true, isValid: true, desc: "Good", color: "#6366f1" };
  if (m >= 50) return { grade: "B", points: 6, hasMarks: true, isValid: true, desc: "Above Average", color: "#d97706" };
  if (m >= 40) return { grade: "C", points: 5, hasMarks: true, isValid: true, desc: "Pass", color: "#ea580c" };
  return { grade: "F", points: 0, hasMarks: true, isValid: true, desc: "Fail / Arrear", color: "#dc2626" };
}

export default function Calculator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes("cgpa")) return "cgpa";
    return "sgpa";
  });

  useEffect(() => {
    if (location.pathname.includes("cgpa")) {
      setActiveTab("cgpa");
    } else if (location.pathname.includes("sgpa")) {
      setActiveTab("sgpa");
    }
  }, [location.pathname]);
  
  // Student Profile Data
  const [studentData, setStudentData] = useState(getStoredStudentData());

  // 1. Student Name, 2. University Number, 3. Respective Branch, 4. Scheme, 5. Semester
  const [studentName, setStudentName] = useState(() => {
    const s = getStoredStudentData();
    return s?.name || "";
  });
  const [universityNumber, setUniversityNumber] = useState(() => {
    const s = getStoredStudentData();
    return s?.hallTicket || "";
  });
  const [branch, setBranch] = useState("AIML");
  const [regulation, setRegulation] = useState("R23"); // Scheme (R23 default)
  const [semester, setSemester] = useState("1");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [completedReport, setCompletedReport] = useState(null);

  useEffect(() => {
    const handleUpdate = () => {
      const data = getStoredStudentData();
      setStudentData(data);
      if (data?.name && !studentName) setStudentName(data.name);
      if (data?.hallTicket && !universityNumber) setUniversityNumber(data.hallTicket);
    };
    window.addEventListener("studentProfileUpdated", handleUpdate);
    return () => window.removeEventListener("studentProfileUpdated", handleUpdate);
  }, [studentName, universityNumber]);

  // -------------------------------------------------------------
  // SGPA STATE & LOGIC (AUTOMATED CREDITS + MARKS ENTRY)
  // -------------------------------------------------------------
  const [sgpaSubjects, setSgpaSubjects] = useState(() =>
    getR23PresetSubjects("AIML", "1").map((item) => ({ ...item, marks: "" }))
  );

  const handleApplyPreset = (b, s) => {
    const preset = getR23PresetSubjects(b, s);
    setSgpaSubjects(preset.map((item) => ({ ...item, marks: "" })));
  };

  const handleSubjectNameChange = (index, newName) => {
    const autoCredits = detectSubjectCredits(newName);
    setSgpaSubjects((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: newName,
        credits: autoCredits,
      };
      return updated;
    });
  };

  const handleSubjectChange = (index, field, value) => {
    setSgpaSubjects((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleAddSubject = () => {
    setSgpaSubjects((prev) => [
      ...prev,
      { name: `Elective Course ${prev.length + 1}`, credits: 3, marks: "" },
    ]);
  };

  const handleRemoveSubject = (index) => {
    if (sgpaSubjects.length <= 1) return;
    setSgpaSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetSgpa = () => {
    handleApplyPreset(branch, semester);
  };

  const handleStartFreshForNewStudent = () => {
    setStudentName("");
    setUniversityNumber("");
    setRegulation("R23");
    setBranch("AIML");
    setSemester("1");
    // Fresh subjects with empty marks
    setSgpaSubjects(
      getR23PresetSubjects("AIML", "1").map((item) => ({ ...item, marks: "" }))
    );
    setCgpaSemesters([
      { sem: "1-1", sgpa: "", active: true },
      { sem: "1-2", sgpa: "", active: true },
      { sem: "2-1", sgpa: "", active: false },
      { sem: "2-2", sgpa: "", active: false },
      { sem: "3-1", sgpa: "", active: false },
      { sem: "3-2", sgpa: "", active: false },
      { sem: "4-1", sgpa: "", active: false },
      { sem: "4-2", sgpa: "", active: false },
    ]);
    setTaskCompleted(false);
    setCompletedReport(null);
    setSaveSuccessMsg("Portal ready for next student! All fields and marks reset fresh.");
    setTimeout(() => setSaveSuccessMsg(""), 5000);
  };

  const studentNameValidation = useMemo(() => {
    if (!studentName || !studentName.trim()) return { ok: true, message: "" };
    return validateName(studentName);
  }, [studentName]);

  const universityNumberValidation = useMemo(() => {
    if (!universityNumber || !universityNumber.trim()) return { ok: true, message: "" };
    return validateHallTicket(universityNumber);
  }, [universityNumber]);

  // Validation per row in SGPA table
  const sgpaRowValidation = useMemo(() => {
    return sgpaSubjects.map((sub) => {
      const hasEnteredMarks = sub.marks !== "" && sub.marks !== undefined;
      const markCheck = hasEnteredMarks
        ? validateSubjectMarks(sub.marks)
        : { ok: true, message: "" };
      const creditCheck = validateSubjectCredits(sub.credits, 0.5, 16);
      return {
        markError: markCheck.ok ? "" : markCheck.message,
        creditError: creditCheck.ok ? "" : creditCheck.message,
        hasError: !markCheck.ok || !creditCheck.ok,
        hasEnteredMarks,
      };
    });
  }, [sgpaSubjects]);

  const hasSgpaErrors = useMemo(() => {
    return sgpaRowValidation.some((r) => r.hasError);
  }, [sgpaRowValidation]);

  const handleCompleteTask = () => {
    if (hasSgpaErrors) {
      alert("Please fix invalid marks or credits in the table before completing evaluation.");
      return;
    }

    const enteredCount = sgpaSubjects.filter(
      (s) => s.marks !== "" && s.marks !== undefined && validateSubjectMarks(s.marks).ok
    ).length;
    if (enteredCount === 0) {
      alert("Please enter subject marks (0–100) before completing the evaluation.");
      return;
    }

    if (!studentNameValidation.ok) {
      alert(studentNameValidation.message);
      return;
    }
    if (!universityNumberValidation.ok) {
      alert(universityNumberValidation.message);
      return;
    }

    const report = {
      name: studentName.trim() || "Student",
      hallTicket: universityNumber.trim() || "N/A",
      branch,
      regulation,
      semester,
      sgpa: sgpaResult.sgpa,
      percentage: sgpaResult.percentage,
      averageMarks: sgpaResult.averageMarks,
      classification: sgpaResult.classification,
      totalCredits: sgpaResult.totalCredits,
      subjectCount: enteredCount,
    };

    setCompletedReport(report);
    setTaskCompleted(true);
    handleSaveCgpaToProfile();
  };

  const sgpaResult = useMemo(() => {
    if (hasSgpaErrors) {
      return {
        sgpa: "--",
        rawSgpa: "0.00",
        subjectCount: sgpaSubjects.length,
        enteredCount: 0,
        averageMarks: "0.0",
        isAwaiting: false,
        hasError: true,
        errorMessage: "Invalid inputs detected. Please enter valid marks (0–100) and credits (0.5–16).",
        totalCredits: "0.0",
        totalGradePointsMultiplied: "0.0",
        percentage: "0.0",
        classification: "Invalid Input Detected",
        hasFail: false,
      };
    }

    let totalGradePointsMultiplied = 0;
    let totalCredits = 0;
    let totalMarks = 0;
    let subjectCount = 0;
    let enteredCount = 0;
    let hasFail = false;

    sgpaSubjects.forEach((sub) => {
      subjectCount++;
      const info = getGradeInfoFromMarks(sub.marks);
      if (info.hasMarks && info.isValid) {
        const creds = parseFloat(sub.credits) || 3;
        if (info.grade === "F") hasFail = true;
        totalGradePointsMultiplied += info.points * creds;
        totalCredits += creds;
        totalMarks += parseFloat(sub.marks) || 0;
        enteredCount++;
      }
    });

    const isAwaiting = enteredCount === 0;
    const calculatedSgpa = totalCredits > 0 ? (totalGradePointsMultiplied / totalCredits).toFixed(2) : "0.00";
    const rawPct = totalCredits > 0 ? ((parseFloat(calculatedSgpa) - 0.75) * 10) : 0;
    const percentage = isAwaiting ? "0.0" : Math.max(0, isNaN(rawPct) ? 0 : rawPct).toFixed(1);
    const averageMarks = enteredCount > 0 ? (totalMarks / enteredCount).toFixed(1) : "0.0";

    let classification = "First Class with Distinction";
    const numSgpa = parseFloat(calculatedSgpa);
    if (isAwaiting) classification = "Awaiting Marks Entry";
    else if (hasFail) classification = "Contains Arrears / Backlog (< 40 Marks)";
    else if (numSgpa >= 7.75) classification = "First Class with Distinction";
    else if (numSgpa >= 6.75) classification = "First Class";
    else if (numSgpa >= 5.75) classification = "Second Class";
    else if (numSgpa >= 5.0) classification = "Pass Class";
    else classification = "Re-evaluation Recommended";

    return {
      sgpa: isAwaiting ? "--" : calculatedSgpa,
      rawSgpa: calculatedSgpa,
      subjectCount,
      enteredCount,
      averageMarks,
      isAwaiting,
      hasError: false,
      totalCredits: totalCredits.toFixed(1),
      totalGradePointsMultiplied: totalGradePointsMultiplied.toFixed(1),
      percentage,
      classification,
      hasFail,
    };
  }, [sgpaSubjects, hasSgpaErrors]);

  // -------------------------------------------------------------
  // CGPA STATE & LOGIC (NO CREDITS REQUIRED)
  // -------------------------------------------------------------
  const [cgpaSemesters, setCgpaSemesters] = useState([
    { sem: "1-1", sgpa: "8.60", active: true },
    { sem: "1-2", sgpa: "8.90", active: true },
    { sem: "2-1", sgpa: "9.10", active: true },
    { sem: "2-2", sgpa: "8.75", active: true },
    { sem: "3-1", sgpa: "9.05", active: true },
    { sem: "3-2", sgpa: "8.80", active: true },
    { sem: "4-1", sgpa: "", active: false },
    { sem: "4-2", sgpa: "", active: false },
  ]);

  const handleCgpaSemChange = (index, value) => {
    setCgpaSemesters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], sgpa: value };
      return updated;
    });
  };

  const toggleSemesterActive = (index) => {
    setCgpaSemesters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], active: !updated[index].active };
      return updated;
    });
  };

  // Validation for CGPA semesters
  const cgpaValidation = useMemo(() => {
    return cgpaSemesters.map((sem) => {
      if (!sem.active) return { error: "", hasError: false };
      if (sem.sgpa === "" || sem.sgpa === undefined) {
        return { error: "SGPA required (0.00–10.00)", hasError: true };
      }
      const check = validateGradePoint(sem.sgpa, "SGPA");
      return {
        error: check.ok ? "" : check.message,
        hasError: !check.ok,
      };
    });
  }, [cgpaSemesters]);

  const hasCgpaErrors = useMemo(() => {
    return cgpaValidation.some((v) => v.hasError);
  }, [cgpaValidation]);

  const cgpaResult = useMemo(() => {
    if (hasCgpaErrors) {
      return {
        cgpa: "--",
        activeSemCount: 0,
        jntuPercentage: "0.00",
        aictePercentage: "0.00",
        hasError: true,
        errorMessage: "Please enter valid SGPA values (0.00 – 10.00) for all active semesters.",
        standing: "Invalid Input Detected",
      };
    }

    let totalSgpa = 0;
    let activeSemCount = 0;

    cgpaSemesters.forEach((sem) => {
      if (sem.active) {
        const check = validateGradePoint(sem.sgpa);
        if (check.ok) {
          totalSgpa += check.numeric;
          activeSemCount++;
        }
      }
    });

    if (activeSemCount === 0) {
      return {
        cgpa: "--",
        activeSemCount: 0,
        jntuPercentage: "0.00",
        aictePercentage: "0.00",
        hasError: false,
        standing: "Awaiting Semester SGPAs",
      };
    }

    const calculatedCgpa = (totalSgpa / activeSemCount).toFixed(2);
    const numCgpa = parseFloat(calculatedCgpa);
    const jntuRaw = ((numCgpa - 0.75) * 10);
    const jntuPercentage = Math.max(0, isNaN(jntuRaw) ? 0 : jntuRaw).toFixed(2);
    const aicteRaw = (numCgpa * 9.5);
    const aictePercentage = Math.max(0, isNaN(aicteRaw) ? 0 : aicteRaw).toFixed(2);

    let standing = "First Class with Distinction";
    if (numCgpa >= 7.75) standing = "First Class with Distinction (Honors Grade)";
    else if (numCgpa >= 6.75) standing = "First Class";
    else if (numCgpa >= 5.75) standing = "Second Class";
    else if (numCgpa >= 5.0) standing = "Pass Division";
    else standing = "Needs Academic Improvement";

    return {
      cgpa: calculatedCgpa,
      activeSemCount,
      jntuPercentage,
      aictePercentage,
      hasError: false,
      standing,
    };
  }, [cgpaSemesters, hasCgpaErrors]);

  // Save CGPA to Profile
  const handleSaveCgpaToProfile = () => {
    if (activeTab === "sgpa") {
      if (hasSgpaErrors || sgpaResult.isAwaiting) {
        alert("Cannot save: please enter valid subject marks.");
        return;
      }
    } else {
      if (hasCgpaErrors || cgpaResult.activeSemCount === 0) {
        alert("Cannot save: please provide valid SGPA values (0.00–10.00) for active semesters.");
        return;
      }
    }

    const updated = {
      ...studentData,
      name: studentNameValidation.ok && studentName ? studentName.trim() : studentData.name,
      hallTicket: universityNumberValidation.ok && universityNumber ? universityNumber.trim().toUpperCase() : studentData.hallTicket,
      branchCode: branch,
      regulation: `${regulation} Scheme`,
      semester: `Semester ${semester}`,
      cgpa: activeTab === "sgpa" ? sgpaResult.sgpa : cgpaResult.cgpa,
    };
    saveStoredStudentData(updated);
    setSaveSuccessMsg(
      `Academic Score (${activeTab === "sgpa" ? `SGPA ${sgpaResult.sgpa}` : `CGPA ${cgpaResult.cgpa}`}) saved for ${studentName || "Student"}!`
    );
    setTimeout(() => setSaveSuccessMsg(""), 4500);
  };

  return (
    <div className="calc-page-wrapper">
      {/* =========================================================
          TOP NAVIGATION BAR (MATCHING STUDENT PROFILE FOREST GREEN)
          ========================================================= */}
      <header className="calc-page-header">
        <div className="calc-page-header-inner">
          <div className="calc-header-left" onClick={() => navigate("/")} title="Return to Homepage">
            <img src="/jntu-circle-logo.png" alt="JNTU Circle" className="calc-page-logo" />
            <div>
              <h2 className="calc-brand-title">
                <span className="font-deltha">JNTU</span> Circle
              </h2>
              <span className="calc-brand-subtitle">Official Academic Evaluation Portal</span>
            </div>
          </div>

          <div className="calc-header-right">
            <button
              type="button"
              className="calc-header-close-btn"
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

      <main className="calc-main-container">
        {/* Top Tab Switcher */}
        <section className="calc-header-hero">
          <div className="calc-tab-nav" role="tablist">
            <button
              type="button"
              className={`calc-tab-btn ${activeTab === "sgpa" ? "active" : ""}`}
              onClick={() => setActiveTab("sgpa")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="tab-svg">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>SGPA Calculator</span>
            </button>
            <button
              type="button"
              className={`calc-tab-btn ${activeTab === "cgpa" ? "active" : ""}`}
              onClick={() => setActiveTab("cgpa")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="tab-svg">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>CGPA Calculator</span>
            </button>
          </div>
        </section>

        {/* Global Save Alert */}
        {saveSuccessMsg && (
          <div className="calc-toast-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* =========================================================
            PROFESSIONAL STUDENT ACADEMIC PROFILE HEADER
            1. Student Name
            2. University Number
            3. Respective Branch
            4. Scheme (Regulation)
            5. Along with Semester
            ========================================================= */}
        <section className="calc-student-header-card">
          <div className="calc-student-header-top">
            <div className="calc-hero-badge" style={{ margin: 0 }}>
              <span className="calc-badge-pulse" />
              <span>Official University Academic Evaluation Portal</span>
            </div>
            <span className="calc-header-tagline">Academic Session 2024–2025 • {regulation} Scheme</span>
          </div>

          <div className="calc-student-grid">
            {/* 1. Student Name */}
            <div className="calc-field-box">
              <label className="calc-field-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>1. Student Name</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                aria-invalid={!studentNameValidation.ok}
                placeholder="Enter Student Full Name..."
                className="calc-field-input"
              />
              {studentName && !studentNameValidation.ok && (
                <span className="calc-field-error" role="alert">{studentNameValidation.message}</span>
              )}
            </div>

            {/* 2. University Number */}
            <div className="calc-field-box">
              <label className="calc-field-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="13" y2="12" />
                  <line x1="7" y1="16" x2="10" y2="16" />
                </svg>
                <span>2. University Number</span>
              </label>
              <input
                type="text"
                value={universityNumber}
                onChange={(e) => setUniversityNumber(e.target.value)}
                aria-invalid={!universityNumberValidation.ok}
                placeholder="e.g. 23B91A4201"
                className="calc-field-input"
              />
              {universityNumber && !universityNumberValidation.ok && (
                <span className="calc-field-error" role="alert">{universityNumberValidation.message}</span>
              )}
            </div>

            {/* 3. Respective Branch */}
            <div className="calc-field-box">
              <label className="calc-field-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span>3. Respective Branch</span>
              </label>
              <select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  handleApplyPreset(e.target.value, semester);
                }}
                className="calc-field-select"
              >
                <option value="AIML">AI & Machine Learning (AIML)</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics & Comm (ECE)</option>
                <option value="EEE">Electrical & Electronics (EEE)</option>
                <option value="ME">Mechanical Engg (ME)</option>
                <option value="CE">Civil Engg (CE)</option>
              </select>
            </div>

            {/* 4. Scheme */}
            <div className="calc-field-box">
              <label className="calc-field-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>4. Scheme</span>
              </label>
              <select
                value={regulation}
                onChange={(e) => setRegulation(e.target.value)}
                className="calc-field-select"
              >
                <option value="R23">R23 Scheme</option>
                <option value="R20">R20 Scheme</option>
                <option value="R19">R19 Scheme</option>
                <option value="R16">R16 Scheme</option>
              </select>
            </div>

            {/* 5. Along with Semester */}
            <div className="calc-field-box">
              <label className="calc-field-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h10" />
                  <path d="M7 12h10" />
                  <path d="M7 17h10" />
                </svg>
                <span>5. Semester</span>
              </label>
              <select
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  handleApplyPreset(branch, e.target.value);
                }}
                className="calc-field-select"
              >
                {[
                  { id: "1", label: "1-1" },
                  { id: "2", label: "1-2" },
                  { id: "3", label: "2-1" },
                  { id: "4", label: "2-2" },
                  { id: "5", label: "3-1" },
                  { id: "6", label: "3-2" },
                  { id: "7", label: "4-1" },
                  { id: "8", label: "4-2" },
                ].map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* =========================================================
            TAB 1: SGPA CALCULATOR
            ========================================================= */}
        {activeTab === "sgpa" && (
          <div className="calc-section-layout">
            <div className="calc-card-primary">
              <div className="calc-card-header">
                <div>
                  <h2 className="calc-card-title">Semester Grade Point Average (SGPA)</h2>
                  <p className="calc-card-desc">
                    Official courses loaded for <strong>{branch}</strong> • <strong>{regulation} Scheme</strong> • <strong>Semester {semester}</strong>. Enter your subject marks (0–100) to calculate your SGPA automatically.
                  </p>
                </div>
              </div>

              {/* Subject Table with Automated Credits & Subject Marks Input */}
              {hasSgpaErrors && (
                <div className="calc-warning-banner" role="alert">
                  <span>⚠️ {sgpaResult.errorMessage}</span>
                </div>
              )}
              <div className="calc-table-wrapper">
                <table className="calc-table">
                  <thead>
                    <tr>
                      <th style={{ width: "6%" }}>#</th>
                      <th style={{ width: "44%" }}>Subject / Course Title</th>
                      <th style={{ width: "16%" }} className="text-center-cell">Credits (Auto)</th>
                      <th style={{ width: "26%" }}>Subject Marks (0–100)</th>
                      <th style={{ width: "8%" }} className="text-center-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sgpaSubjects.map((sub, idx) => {
                      const gradeInfo = getGradeInfoFromMarks(sub.marks);
                      const rowVal = sgpaRowValidation[idx];
                      return (
                        <tr key={idx}>
                          <td className="text-center-cell">{idx + 1}</td>
                          <td>
                            <input
                              type="text"
                              list="r23-subjects-datalist"
                              value={sub.name}
                              onChange={(e) => handleSubjectNameChange(idx, e.target.value)}
                              className="calc-input-text"
                              placeholder="Type or select subject..."
                            />
                          </td>
                          <td className="text-center-cell">
                            <div className="calc-auto-credit-box" title="Official R23 course credits automatically assigned">
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="16"
                                value={sub.credits}
                                onChange={(e) => handleSubjectChange(idx, "credits", e.target.value)}
                                aria-invalid={Boolean(rowVal?.creditError)}
                                className="calc-input-credit"
                              />
                              <span className="calc-auto-pill">AUTO</span>
                            </div>
                            {rowVal?.creditError && (
                              <span className="calc-row-error" role="alert">{rowVal.creditError}</span>
                            )}
                          </td>
                          <td>
                            <div className="calc-marks-input-wrapper">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={sub.marks !== undefined ? sub.marks : ""}
                                onChange={(e) => handleSubjectChange(idx, "marks", e.target.value)}
                                aria-invalid={Boolean(rowVal?.markError)}
                                className="calc-input-marks"
                                placeholder="Marks (0–100)"
                              />
                              {gradeInfo.hasMarks && gradeInfo.isValid && (
                                <span
                                  className="calc-marks-grade-badge"
                                  style={{
                                    backgroundColor: `${gradeInfo.color}15`,
                                    color: gradeInfo.color,
                                    borderColor: `${gradeInfo.color}40`,
                                  }}
                                  title={`${gradeInfo.desc} (${gradeInfo.points} Grade Points)`}
                                >
                                  {gradeInfo.grade} ({gradeInfo.points} GP)
                                </span>
                              )}
                            </div>
                            {rowVal?.markError && (
                              <span className="calc-row-error" role="alert">{rowVal.markError}</span>
                            )}
                          </td>
                          <td className="text-center-cell">
                            <button
                              type="button"
                              className="calc-btn-del"
                              onClick={() => handleRemoveSubject(idx)}
                              title="Remove Course"
                              aria-label="Remove Course"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Datalist with Official Subjects for fast typing */}
              <datalist id="r23-subjects-datalist">
                {(R23_SUBJECTS_BY_BRANCH_SEM[`${branch}-${semester}`] || []).map((item, i) => (
                  <option key={`sem-sub-${i}`} value={item.name}>
                    {item.name} • Official {branch} Sem {semester}
                  </option>
                ))}
                {ALL_R23_SUBJECTS_LIST.map((name, i) => (
                  <option key={`all-sub-${i}`} value={name} />
                ))}
              </datalist>

              {/* Table Action Bar */}
              <div className="calc-action-bar">
                <div className="calc-action-left">
                  <button type="button" className="calc-btn-add" onClick={handleAddSubject}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Custom Subject</span>
                  </button>

                  <button type="button" className="calc-btn-reset" onClick={handleResetSgpa}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span>Reload {branch} Sem {semester} Courses</span>
                  </button>
                </div>

                <div className="calc-action-right">
                  <button
                    type="button"
                    className="calc-btn-complete-task"
                    style={{ margin: 0, width: "auto", padding: "9px 18px" }}
                    onClick={handleCompleteTask}
                    disabled={hasSgpaErrors || sgpaResult.isAwaiting || !studentNameValidation.ok || !universityNumberValidation.ok}
                    title={
                      hasSgpaErrors
                        ? "Fix invalid marks or credits in table first"
                        : sgpaResult.isAwaiting
                          ? "Enter subject marks first"
                          : "Complete evaluation task for this student"
                    }
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Complete Task</span>
                  </button>

                  <button
                    type="button"
                    className="calc-btn-fresh"
                    onClick={handleStartFreshForNewStudent}
                    title="Clear previous calculation and start fresh for the next student"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                    <span>Start Fresh (Next User)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Results Summary Card */}
            <aside className="calc-sidebar-score">
              <div className="calc-score-card">
                <div className="calc-score-header">
                  <span className="calc-pill-tag">{regulation} SCHEME SCORE</span>
                  <span className="calc-sem-name">Sem {semester} ({branch})</span>
                </div>

                <div className="calc-score-visual">
                  <div className="calc-score-circle">
                    <span className="calc-score-val">{sgpaResult.sgpa}</span>
                    <span className="calc-score-sub">SGPA</span>
                  </div>
                </div>

                <div className={`calc-standing-badge ${sgpaResult.hasFail ? "standing-fail" : "standing-distinction"}`}>
                  {sgpaResult.classification}
                </div>

                <div className="calc-breakdown-list">
                  <div className="calc-breakdown-row">
                    <span>Student Name:</span>
                    <strong>{studentName || "N/A"}</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>University Roll No:</span>
                    <strong>{universityNumber || "N/A"}</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Branch & Scheme:</span>
                    <strong>{branch} ({regulation})</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Evaluated Term:</span>
                    <strong>Semester {semester}</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Courses Evaluated:</span>
                    <strong>{sgpaResult.enteredCount} of {sgpaResult.subjectCount} Subjects</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Average Marks:</span>
                    <strong>{sgpaResult.averageMarks} / 100</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Total Registered Credits:</span>
                    <strong>{sgpaResult.totalCredits} Credits</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Equivalent Percentage:</span>
                    <strong className="text-accent">{sgpaResult.percentage}%</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="calc-btn-complete-task"
                  onClick={handleCompleteTask}
                  disabled={hasSgpaErrors || sgpaResult.isAwaiting || !studentNameValidation.ok || !universityNumberValidation.ok}
                  title="Finalize evaluation and view result slip"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Complete Task & Finalize</span>
                </button>

                <button
                  type="button"
                  className="calc-btn-save-profile"
                  style={{ marginBottom: "10px" }}
                  onClick={handleSaveCgpaToProfile}
                  disabled={hasSgpaErrors || sgpaResult.isAwaiting}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Sync to Student Profile</span>
                </button>

                <button
                  type="button"
                  className="calc-btn-fresh-sidebar"
                  onClick={handleStartFreshForNewStudent}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  <span>Start Fresh for Another User</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* =========================================================
            TAB 2: CGPA CALCULATOR (NO CREDITS REQUIRED)
            ========================================================= */}
        {activeTab === "cgpa" && (
          <div className="calc-section-layout">
            <div className="calc-card-primary">
              <div className="calc-card-header">
                <div>
                  <h2 className="calc-card-title">Cumulative Grade Point Average (CGPA)</h2>
                  <p className="calc-card-desc">Enter your SGPA for each completed semester to calculate your overall cumulative CGPA.</p>
                </div>
              </div>

              {/* Semesters Grid (No Credits Input) */}
              {hasCgpaErrors && (
                <div className="calc-warning-banner" role="alert">
                  <span>⚠️ {cgpaResult.errorMessage}</span>
                </div>
              )}
              <div className="calc-cgpa-grid">
                {cgpaSemesters.map((sem, idx) => {
                  const semVal = cgpaValidation[idx];
                  return (
                    <div key={idx} className={`calc-cgpa-sem-box ${sem.active ? "is-active" : "is-inactive"}`}>
                      <div className="calc-sem-toggle-row">
                        <label className="calc-checkbox-container">
                          <input
                            type="checkbox"
                            checked={sem.active}
                            onChange={() => toggleSemesterActive(idx)}
                          />
                          <span className="calc-sem-title">{sem.sem}</span>
                        </label>
                        <span className="calc-sem-status-tag">
                          {sem.active ? "Active" : "Excluded"}
                        </span>
                      </div>

                      <div className="calc-cgpa-inputs-row-simple">
                        <label className="calc-simple-label">Semester SGPA (0.00 – 10.00):</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={sem.sgpa}
                          disabled={!sem.active}
                          onChange={(e) => handleCgpaSemChange(idx, e.target.value)}
                          aria-invalid={Boolean(semVal?.hasError)}
                          placeholder="e.g. 8.75"
                          className="calc-input-sgpa"
                        />
                        {semVal?.hasError && (
                          <span className="calc-row-error" role="alert">{semVal.error}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar CGPA Result */}
            <aside className="calc-sidebar-score">
              <div className="calc-score-card">
                <div className="calc-score-header">
                  <span className="calc-pill-tag">OVERALL ACADEMIC CGPA</span>
                  <span className="calc-sem-name">{cgpaResult.activeSemCount} Semesters Included</span>
                </div>

                <div className="calc-score-visual">
                  <div className="calc-score-circle cgpa-circle-glow">
                    <span className="calc-score-val">{cgpaResult.cgpa}</span>
                    <span className="calc-score-sub">CGPA / 10.0</span>
                  </div>
                </div>

                <div className="calc-standing-badge standing-distinction">
                  {cgpaResult.standing}
                </div>

                <div className="calc-breakdown-list">
                  <div className="calc-breakdown-row">
                    <span>Student Name:</span>
                    <strong>{studentName || "N/A"}</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>University Roll No:</span>
                    <strong>{universityNumber || "N/A"}</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Branch & Scheme:</span>
                    <strong>{branch} ({regulation})</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Semesters Evaluated:</span>
                    <strong>{cgpaResult.activeSemCount} Semesters</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>JNTU % (CGPA - 0.75)×10:</span>
                    <strong className="text-accent">{cgpaResult.jntuPercentage}%</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>AICTE / General (CGPA × 9.5):</span>
                    <strong>{cgpaResult.aictePercentage}%</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="calc-btn-save-profile"
                  onClick={handleSaveCgpaToProfile}
                  disabled={hasCgpaErrors || cgpaResult.activeSemCount === 0 || !studentNameValidation.ok || !universityNumberValidation.ok}
                  title={
                    hasCgpaErrors
                      ? "Enter valid SGPA for all active semesters"
                      : cgpaResult.activeSemCount === 0
                        ? "Select at least 1 semester"
                        : "Save academic CGPA to student profile"
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Sync to Student Profile</span>
                </button>

                <button
                  type="button"
                  className="calc-btn-fresh-sidebar"
                  onClick={handleStartFreshForNewStudent}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  <span>Done? Start Fresh for Next Student</span>
                </button>
              </div>
            </aside>
          </div>
        )}
        {/* =========================================================
            TASK COMPLETED MODAL (FOR STARTING FRESH FOR NEXT USER)
            ========================================================= */}
        {taskCompleted && completedReport && (
          <div className="calc-completion-modal-backdrop" onClick={() => setTaskCompleted(false)}>
            <div className="calc-completion-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="calc-modal-success-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Evaluation Task Completed</span>
              </div>

              <h2 className="calc-modal-title">Official Semester Grade Report</h2>
              <p className="calc-modal-subtitle">
                Academic evaluation finalized for <strong>{completedReport.name}</strong> ({completedReport.hallTicket})
              </p>

              <div className="calc-modal-score-banner">
                <div className="calc-modal-score-left">
                  <span className="calc-modal-score-label">FINAL EVALUATED SGPA</span>
                  <strong className="calc-modal-score-val">{completedReport.sgpa}</strong>
                  <span className="calc-modal-score-class">{completedReport.classification}</span>
                </div>
                <div className="calc-modal-score-right">
                  <div className="calc-modal-stat-pill">
                    <span>Branch & Scheme</span>
                    <strong>{completedReport.branch} ({completedReport.regulation})</strong>
                  </div>
                  <div className="calc-modal-stat-pill">
                    <span>Semester Term</span>
                    <strong>Semester {completedReport.semester}</strong>
                  </div>
                  <div className="calc-modal-stat-pill">
                    <span>Average Marks</span>
                    <strong>{completedReport.averageMarks} / 100</strong>
                  </div>
                  <div className="calc-modal-stat-pill">
                    <span>Registered Credits</span>
                    <strong>{completedReport.totalCredits} Credits</strong>
                  </div>
                  <div className="calc-modal-stat-pill">
                    <span>Percentage</span>
                    <strong>{completedReport.percentage}%</strong>
                  </div>
                </div>
              </div>

              <div className="calc-modal-action-row">
                <button
                  type="button"
                  className="calc-btn-start-fresh-primary"
                  onClick={() => {
                    setTaskCompleted(false);
                    setCompletedReport(null);
                    handleStartFreshForNewStudent();
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  <span>Start Fresh for Another User (Clear All)</span>
                </button>

                <div className="calc-modal-btn-subgroup">
                  <button
                    type="button"
                    className="calc-btn-print-slip"
                    onClick={() => window.print()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    <span>Print Result Slip</span>
                  </button>

                  <button
                    type="button"
                    className="calc-btn-dismiss"
                    onClick={() => setTaskCompleted(false)}
                  >
                    Close & Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
