import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { getStoredStudentData, saveStoredStudentData } from "../data/studentData";
import {
  R23_SUBJECTS_BY_BRANCH_SEM,
  ALL_R23_SUBJECTS_LIST,
  detectSubjectCredits,
  getR23PresetSubjects,
} from "../data/r23Subjects";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Calculator.css";

// Standard JNTU Grade Points Mapping
const GRADE_POINTS = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
  AB: 0,
};

// JNTU 10-Point Absolute Grading Scale: Marks to Grade & Points Converter
export function getGradeInfoFromMarks(marks) {
  if (marks === "" || marks === null || marks === undefined) {
    return { grade: "", points: 0, hasMarks: false, desc: "Awaiting Marks", color: "#94a3b8" };
  }
  const m = parseFloat(marks);
  if (isNaN(m) || m < 0) {
    return { grade: "", points: 0, hasMarks: false, desc: "Invalid Marks", color: "#94a3b8" };
  }
  if (m >= 90) return { grade: "O", points: 10, hasMarks: true, desc: "Outstanding", color: "#10b981" };
  if (m >= 80) return { grade: "A+", points: 9, hasMarks: true, desc: "Excellent", color: "#06b6d4" };
  if (m >= 70) return { grade: "A", points: 8, hasMarks: true, desc: "Very Good", color: "#3b82f6" };
  if (m >= 60) return { grade: "B+", points: 7, hasMarks: true, desc: "Good", color: "#8b5cf6" };
  if (m >= 50) return { grade: "B", points: 6, hasMarks: true, desc: "Above Average", color: "#f59e0b" };
  if (m >= 40) return { grade: "C", points: 5, hasMarks: true, desc: "Pass", color: "#ea580c" };
  return { grade: "F", points: 0, hasMarks: true, desc: "Fail / Arrear", color: "#ef4444" };
}

export default function Calculator() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const getInitialTab = () => {
    const p = location.pathname.toLowerCase();
    const type = searchParams.get("type");
    if (p.includes("cgpa") || type === "cgpa") return "cgpa";
    return "sgpa";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Sync tab whenever URL pathname or query param changes
  useEffect(() => {
    const p = location.pathname.toLowerCase();
    const type = searchParams.get("type");
    if (p.includes("cgpa") || type === "cgpa") {
      setActiveTab("cgpa");
    } else if (p.includes("sgpa") || type === "sgpa") {
      setActiveTab("sgpa");
    }
  }, [location.pathname, searchParams]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    navigate(tab === "cgpa" ? "/cgpa-calculator" : "/sgpa-calculator", { replace: true });
  };
  
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
      { sem: "Semester 1", sgpa: "", active: true },
      { sem: "Semester 2", sgpa: "", active: true },
      { sem: "Semester 3", sgpa: "", active: false },
      { sem: "Semester 4", sgpa: "", active: false },
      { sem: "Semester 5", sgpa: "", active: false },
      { sem: "Semester 6", sgpa: "", active: false },
      { sem: "Semester 7", sgpa: "", active: false },
      { sem: "Semester 8", sgpa: "", active: false },
    ]);
    setTaskCompleted(false);
    setCompletedReport(null);
    setSaveSuccessMsg("Portal ready for next student! All fields and marks reset fresh.");
    setTimeout(() => setSaveSuccessMsg(""), 5000);
  };

  const handleCompleteTask = () => {
    const enteredCount = sgpaSubjects.filter(
      (s) => s.marks !== "" && s.marks !== undefined && !isNaN(parseFloat(s.marks))
    ).length;
    if (enteredCount === 0) {
      alert("Please enter subject marks (0–100) before completing the evaluation.");
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
    let totalGradePointsMultiplied = 0;
    let totalCredits = 0;
    let totalMarks = 0;
    let subjectCount = 0;
    let enteredCount = 0;
    let hasFail = false;

    sgpaSubjects.forEach((sub) => {
      subjectCount++;
      const info = getGradeInfoFromMarks(sub.marks);
      if (info.hasMarks) {
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
    const percentage = totalCredits > 0 ? ((parseFloat(calculatedSgpa) - 0.75) * 10).toFixed(1) : "0.0";
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
      totalCredits: totalCredits.toFixed(1),
      totalGradePointsMultiplied: totalGradePointsMultiplied.toFixed(1),
      percentage: isAwaiting ? "0.0" : Math.max(0, parseFloat(percentage)).toFixed(1),
      classification,
      hasFail,
    };
  }, [sgpaSubjects]);

  // -------------------------------------------------------------
  // CGPA STATE & LOGIC (NO CREDITS REQUIRED)
  // -------------------------------------------------------------
  const [cgpaSemesters, setCgpaSemesters] = useState([
    { sem: "Semester 1", sgpa: "8.60", active: true },
    { sem: "Semester 2", sgpa: "8.90", active: true },
    { sem: "Semester 3", sgpa: "9.10", active: true },
    { sem: "Semester 4", sgpa: "8.75", active: true },
    { sem: "Semester 5", sgpa: "9.05", active: true },
    { sem: "Semester 6", sgpa: "8.80", active: true },
    { sem: "Semester 7", sgpa: "", active: false },
    { sem: "Semester 8", sgpa: "", active: false },
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

  const cgpaResult = useMemo(() => {
    let totalSgpa = 0;
    let activeSemCount = 0;

    cgpaSemesters.forEach((sem) => {
      if (sem.active && sem.sgpa && !isNaN(parseFloat(sem.sgpa))) {
        totalSgpa += parseFloat(sem.sgpa);
        activeSemCount++;
      }
    });

    const calculatedCgpa = activeSemCount > 0 ? (totalSgpa / activeSemCount).toFixed(2) : "0.00";
    const jntuPercentage = activeSemCount > 0 ? ((parseFloat(calculatedCgpa) - 0.75) * 10).toFixed(2) : "0.00";
    const aictePercentage = activeSemCount > 0 ? (parseFloat(calculatedCgpa) * 9.5).toFixed(2) : "0.00";

    let standing = "First Class with Distinction";
    const numCgpa = parseFloat(calculatedCgpa);
    if (numCgpa >= 7.75) standing = "First Class with Distinction (Honors Grade)";
    else if (numCgpa >= 6.75) standing = "First Class";
    else if (numCgpa >= 5.75) standing = "Second Class";
    else if (numCgpa >= 5.0) standing = "Pass Division";
    else standing = "Needs Academic Improvement";

    return {
      cgpa: calculatedCgpa,
      activeSemCount,
      jntuPercentage: Math.max(0, parseFloat(jntuPercentage)).toFixed(2),
      aictePercentage: Math.max(0, parseFloat(aictePercentage)).toFixed(2),
      standing,
    };
  }, [cgpaSemesters]);

  // Save CGPA to Profile
  const handleSaveCgpaToProfile = () => {
    const updated = {
      ...studentData,
      name: studentName || studentData.name,
      hallTicket: universityNumber || studentData.hallTicket,
      branchCode: branch,
      regulation: `${regulation} Scheme`,
      semester: `Semester ${semester}`,
      cgpa: activeTab === "sgpa" ? (studentData.cgpa || "9.18") : cgpaResult.cgpa,
      sgpa: activeTab === "sgpa" ? sgpaResult.sgpa : (studentData.sgpa || "9.42"),
    };
    saveStoredStudentData(updated);
    setSaveSuccessMsg(
      `Academic Score (${activeTab === "sgpa" ? `SGPA ${sgpaResult.sgpa}` : `CGPA ${cgpaResult.cgpa}`}) saved for ${studentName || "Student"}!`
    );
    setTimeout(() => setSaveSuccessMsg(""), 4500);
  };

  return (
    <div className="calc-page-wrapper selection:bg-[#8B5CF6]/30 selection:text-white">
      <Navbar />

      {/* Architectural Background Grid & Ambient Violet Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
        <div className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[#8B5CF6]/10 rounded-full blur-[140px]" />
        <div className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] bg-[#27213B]/20 rounded-full blur-[120px]" />
        <svg
          className="w-full h-full stroke-[#292733]/40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern height="48" id="jntu-telemetry-grid-calc" patternUnits="userSpaceOnUse" width="48">
              <path d="M 48 0 L 0 0 0 48" fill="none" strokeWidth="1" />
              <circle cx="48" cy="48" fill="#8B5CF6" fillOpacity="0.5" r="0.8" />
            </pattern>
          </defs>
          <rect fill="url(#jntu-telemetry-grid-calc)" height="100%" width="100%" />
        </svg>
      </div>

      <main className="calc-main-container">
        {/* Top Header Hero */}
        <section className="calc-header-hero">
          <h1 className="calc-hero-title">CGPA & SGPA Calculator</h1>
          <p className="calc-hero-subtitle">
            Fast, accurate grade point calculator and graduation honors planner tailored for JNTU R23, R20, R19 & R16 syllabus regulations.
          </p>

          {/* Quick Tab Switcher */}
          <div className="calc-tab-nav" role="tablist">
            <button
              type="button"
              className={`calc-tab-btn ${activeTab === "sgpa" ? "active" : ""}`}
              onClick={() => handleTabSwitch("sgpa")}
            >
              <span className="tab-icon material-symbols-outlined text-[17px]">track_changes</span>
              <span>SGPA Calculator</span>
            </button>
            <button
              type="button"
              className={`calc-tab-btn ${activeTab === "cgpa" ? "active" : ""}`}
              onClick={() => handleTabSwitch("cgpa")}
            >
              <span className="tab-icon material-symbols-outlined text-[17px]">calculate</span>
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
                placeholder="Enter Student Full Name..."
                className="calc-field-input"
              />
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
                placeholder="e.g. 23B91A4201"
                className="calc-field-input"
              />
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
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
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
                                className="calc-input-credit"
                              />
                              <span className="calc-auto-pill">AUTO</span>
                            </div>
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
                                className="calc-input-marks"
                                placeholder="Marks (0–100)"
                              />
                              {gradeInfo.hasMarks && (
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
                    title="Complete evaluation task for this student"
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

                <div className="calc-formula-note">
                  <p><strong>Marks Scale:</strong> ≥90: O (10), ≥80: A+ (9), ≥70: A (8), ≥60: B+ (7), ≥50: B (6), ≥40: C (5), &lt;40: F (0)</p>
                  <p><strong>Official Evaluation:</strong> SGPA = Σ(Grade Points × Credits) / Σ(Credits)</p>
                  <p><strong>JNTU Percentage:</strong> (SGPA - 0.75) × 10%</p>
                </div>

                <button
                  type="button"
                  className="calc-btn-complete-task"
                  onClick={handleCompleteTask}
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
                  onClick={handleSaveCgpaToProfile}
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
              <div className="calc-cgpa-grid">
                {cgpaSemesters.map((sem, idx) => (
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
                        placeholder="e.g. 8.75"
                        className="calc-input-sgpa"
                      />
                    </div>
                  </div>
                ))}
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
