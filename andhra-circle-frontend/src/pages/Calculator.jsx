import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStoredStudentData, saveStoredStudentData } from "../data/studentData";
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

const GRADE_SCALE_TABLE = [
  { grade: "O", points: 10, marks: "≥ 90%", desc: "Outstanding", color: "#10b981" },
  { grade: "A+", points: 9, marks: "80% - 89%", desc: "Excellent", color: "#06b6d4" },
  { grade: "A", points: 8, marks: "70% - 79%", desc: "Very Good", color: "#3b82f6" },
  { grade: "B+", points: 7, marks: "60% - 69%", desc: "Good", color: "#8b5cf6" },
  { grade: "B", points: 6, marks: "50% - 59%", desc: "Above Average", color: "#f59e0b" },
  { grade: "C", points: 5, marks: "40% - 49%", desc: "Average / Pass", color: "#ea580c" },
  { grade: "F", points: 0, marks: "< 40%", desc: "Fail / Backlog", color: "#ef4444" },
  { grade: "AB", points: 0, marks: "Absent", desc: "Absent in Exam", color: "#64748b" },
];

// Standard Semester Subject Presets for fast input
const PRESET_SUBJECTS = {
  "AIML-6": [
    { name: "Deep Learning & Neural Networks", credits: 3, grade: "O" },
    { name: "Natural Language Processing (NLP)", credits: 3, grade: "A+" },
    { name: "Cloud Computing & DevOps", credits: 3, grade: "A" },
    { name: "Big Data Analytics", credits: 3, grade: "A+" },
    { name: "Professional Elective - II", credits: 3, grade: "O" },
    { name: "Deep Learning Laboratory", credits: 1.5, grade: "O" },
    { name: "NLP & Cloud Lab", credits: 1.5, grade: "O" },
    { name: "Technical Seminar / Internship", credits: 2, grade: "O" },
  ],
  "CSE-6": [
    { name: "Computer Networks & Security", credits: 3, grade: "A+" },
    { name: "Software Engineering & Agile", credits: 3, grade: "A" },
    { name: "Machine Learning Concepts", credits: 3, grade: "O" },
    { name: "Web Technologies & Frameworks", credits: 3, grade: "A+" },
    { name: "Open Elective - I", credits: 3, grade: "A" },
    { name: "Computer Networks Lab", credits: 1.5, grade: "O" },
    { name: "Web Technologies Lab", credits: 1.5, grade: "O" },
    { name: "Mini Project / Internship", credits: 2, grade: "O" },
  ],
  "ECE-6": [
    { name: "VLSI Design & Architecture", credits: 3, grade: "A+" },
    { name: "Digital Signal Processing", credits: 3, grade: "A" },
    { name: "Antennas & Microwave Propagation", credits: 3, grade: "A+" },
    { name: "Microcontrollers & Embedded Systems", credits: 3, grade: "O" },
    { name: "Professional Elective", credits: 3, grade: "A" },
    { name: "VLSI & Embedded Lab", credits: 1.5, grade: "O" },
    { name: "DSP Lab", credits: 1.5, grade: "O" },
    { name: "Technical Seminar", credits: 2, grade: "O" },
  ],
  "DEFAULT": [
    { name: "Subject 1 (Theory)", credits: 3, grade: "A+" },
    { name: "Subject 2 (Theory)", credits: 3, grade: "O" },
    { name: "Subject 3 (Theory)", credits: 3, grade: "A" },
    { name: "Subject 4 (Theory)", credits: 3, grade: "B+" },
    { name: "Subject 5 (Professional Elective)", credits: 3, grade: "A+" },
    { name: "Lab Course 1", credits: 1.5, grade: "O" },
    { name: "Lab Course 2", credits: 1.5, grade: "O" },
    { name: "Project / Seminar", credits: 2, grade: "O" },
  ],
};

export default function Calculator() {
  const [activeTab, setActiveTab] = useState("sgpa"); // "sgpa" | "cgpa" | "target" | "scale"
  const [regulation, setRegulation] = useState("R20");
  const [branch, setBranch] = useState("AIML");
  const [semester, setSemester] = useState("6");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Student Profile Data
  const [studentData, setStudentData] = useState(getStoredStudentData());

  useEffect(() => {
    const handleUpdate = () => setStudentData(getStoredStudentData());
    window.addEventListener("studentProfileUpdated", handleUpdate);
    return () => window.removeEventListener("studentProfileUpdated", handleUpdate);
  }, []);

  // -------------------------------------------------------------
  // SGPA STATE & LOGIC
  // -------------------------------------------------------------
  const [sgpaSubjects, setSgpaSubjects] = useState(
    PRESET_SUBJECTS["AIML-6"] || PRESET_SUBJECTS["DEFAULT"]
  );

  const handleApplyPreset = (b, s) => {
    const key = `${b}-${s}`;
    const preset = PRESET_SUBJECTS[key] || PRESET_SUBJECTS["DEFAULT"];
    setSgpaSubjects(preset.map((item) => ({ ...item })));
  };

  const handleSubjectChange = (index, field, value) => {
    setSgpaSubjects((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "credits" ? parseFloat(value) || 0 : value,
      };
      return updated;
    });
  };

  const handleAddSubject = () => {
    setSgpaSubjects((prev) => [
      ...prev,
      { name: `New Subject ${prev.length + 1}`, credits: 3, grade: "A" },
    ]);
  };

  const handleRemoveSubject = (index) => {
    if (sgpaSubjects.length <= 1) return;
    setSgpaSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetSgpa = () => {
    handleApplyPreset(branch, semester);
  };

  const sgpaResult = useMemo(() => {
    let totalCredits = 0;
    let totalGradePoints = 0;
    let hasFail = false;

    sgpaSubjects.forEach((sub) => {
      const cred = parseFloat(sub.credits) || 0;
      const pts = GRADE_POINTS[sub.grade] ?? 0;
      if (sub.grade === "F" || sub.grade === "AB") hasFail = true;
      totalCredits += cred;
      totalGradePoints += cred * pts;
    });

    const calculatedSgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : "0.00";
    const percentage = totalCredits > 0 ? ((parseFloat(calculatedSgpa) - 0.75) * 10).toFixed(1) : "0.0";

    let classification = "First Class with Distinction";
    const numSgpa = parseFloat(calculatedSgpa);
    if (hasFail) classification = "Contains Arrears / Fail";
    else if (numSgpa >= 7.75) classification = "First Class with Distinction";
    else if (numSgpa >= 6.75) classification = "First Class";
    else if (numSgpa >= 5.75) classification = "Second Class";
    else if (numSgpa >= 5.0) classification = "Pass Class";
    else classification = "Re-evaluation Recommended";

    return {
      sgpa: calculatedSgpa,
      totalCredits: totalCredits.toFixed(1),
      totalGradePoints: totalGradePoints.toFixed(1),
      percentage: Math.max(0, parseFloat(percentage)).toFixed(1),
      classification,
      hasFail,
    };
  }, [sgpaSubjects]);

  // -------------------------------------------------------------
  // CGPA STATE & LOGIC
  // -------------------------------------------------------------
  const [cgpaSemesters, setCgpaSemesters] = useState([
    { sem: "Semester 1", sgpa: "8.60", credits: "21", active: true },
    { sem: "Semester 2", sgpa: "8.90", credits: "21", active: true },
    { sem: "Semester 3", sgpa: "9.10", credits: "22", active: true },
    { sem: "Semester 4", sgpa: "8.75", credits: "22", active: true },
    { sem: "Semester 5", sgpa: "9.05", credits: "23", active: true },
    { sem: "Semester 6", sgpa: "8.80", credits: "23", active: true },
    { sem: "Semester 7", sgpa: "", credits: "20", active: false },
    { sem: "Semester 8", sgpa: "", credits: "16", active: false },
  ]);

  const handleCgpaSemChange = (index, field, value) => {
    setCgpaSemesters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
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
    let totalCredits = 0;
    let weightedPoints = 0;
    let activeSemCount = 0;

    cgpaSemesters.forEach((sem) => {
      if (sem.active && sem.sgpa && !isNaN(parseFloat(sem.sgpa))) {
        const cred = parseFloat(sem.credits) || 0;
        const s = parseFloat(sem.sgpa) || 0;
        totalCredits += cred;
        weightedPoints += cred * s;
        activeSemCount++;
      }
    });

    const calculatedCgpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : "0.00";
    const jntuPercentage = totalCredits > 0 ? ((parseFloat(calculatedCgpa) - 0.75) * 10).toFixed(2) : "0.00";
    const aictePercentage = totalCredits > 0 ? (parseFloat(calculatedCgpa) * 9.5).toFixed(2) : "0.00";

    let standing = "First Class with Distinction";
    const numCgpa = parseFloat(calculatedCgpa);
    if (numCgpa >= 7.75) standing = "First Class with Distinction (Honors Grade)";
    else if (numCgpa >= 6.75) standing = "First Class";
    else if (numCgpa >= 5.75) standing = "Second Class";
    else if (numCgpa >= 5.0) standing = "Pass Division";
    else standing = "Needs Academic Improvement";

    return {
      cgpa: calculatedCgpa,
      totalCredits: totalCredits.toFixed(0),
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
      cgpa: cgpaResult.cgpa,
      credits: `${cgpaResult.totalCredits} / 160`,
    };
    saveStoredStudentData(updated);
    setSaveSuccessMsg(`CGPA (${cgpaResult.cgpa}) successfully saved to your Student Profile!`);
    setTimeout(() => setSaveSuccessMsg(""), 4000);
  };

  // -------------------------------------------------------------
  // TARGET CGPA PLANNER STATE & LOGIC
  // -------------------------------------------------------------
  const [currentCgpaInput, setCurrentCgpaInput] = useState("8.85");
  const [completedCreditsInput, setCompletedCreditsInput] = useState("110");
  const [targetCgpaInput, setTargetCgpaInput] = useState("9.00");
  const [remainingCreditsInput, setRemainingCreditsInput] = useState("50");

  const targetPlannerResult = useMemo(() => {
    const curCgpa = parseFloat(currentCgpaInput) || 0;
    const compCredits = parseFloat(completedCreditsInput) || 0;
    const tgtCgpa = parseFloat(targetCgpaInput) || 0;
    const remCredits = parseFloat(remainingCreditsInput) || 0;

    const totalCredits = compCredits + remCredits;
    if (totalCredits <= 0 || remCredits <= 0) {
      return { requiredSgpa: "0.00", status: "Enter valid values", doable: true };
    }

    const requiredTotalPoints = tgtCgpa * totalCredits;
    const currentPoints = curCgpa * compCredits;
    const neededPoints = requiredTotalPoints - currentPoints;
    const requiredSgpa = (neededPoints / remCredits).toFixed(2);

    let status = "Highly Achievable";
    let doable = true;
    const reqNum = parseFloat(requiredSgpa);

    if (reqNum > 10.0) {
      status = "Mathematically Impossible (Exceeds 10.0 SGPA)";
      doable = false;
    } else if (reqNum > 9.5) {
      status = "Extremely Challenging (Requires All O Grades)";
      doable = true;
    } else if (reqNum > 8.5) {
      status = "Achievable with Consistent Distinction";
      doable = true;
    } else if (reqNum > 7.0) {
      status = "Comfortably Achievable";
      doable = true;
    } else {
      status = "Target Already Achieved or Very Easy";
      doable = true;
    }

    return {
      requiredSgpa,
      status,
      doable,
      totalCredits,
    };
  }, [currentCgpaInput, completedCreditsInput, targetCgpaInput, remainingCreditsInput]);

  return (
    <div className="calc-page-wrapper">
      <Navbar />

      <main className="calc-main-container">
        {/* Top Header Hero */}
        <section className="calc-header-hero">
          <div className="calc-hero-badge">
            <span className="calc-badge-pulse" />
            <span>Official JNTU Academic Tool</span>
          </div>
          <h1 className="calc-hero-title">CGPA & SGPA Calculator</h1>
          <p className="calc-hero-subtitle">
            Fast, accurate grade point calculator and graduation honors planner tailored for JNTU R23, R20, R19 & R16 syllabus regulations.
          </p>

          {/* Quick Tab Switcher */}
          <div className="calc-tab-nav" role="tablist">
            <button
              type="button"
              className={`calc-tab-btn ${activeTab === "sgpa" ? "active" : ""}`}
              onClick={() => setActiveTab("sgpa")}
            >
              <span className="tab-icon">🎯</span>
              <span>SGPA Calculator</span>
            </button>
            <button
              type="button"
              className={`calc-tab-btn ${activeTab === "cgpa" ? "active" : ""}`}
              onClick={() => setActiveTab("cgpa")}
            >
              <span className="tab-icon">📊</span>
              <span>CGPA Calculator</span>
            </button>
            <button
              type="button"
              className={`calc-tab-btn ${activeTab === "target" ? "active" : ""}`}
              onClick={() => setActiveTab("target")}
            >
              <span className="tab-icon">🚀</span>
              <span>Target CGPA Planner</span>
            </button>
            <button
              type="button"
              className={`calc-tab-btn ${activeTab === "scale" ? "active" : ""}`}
              onClick={() => setActiveTab("scale")}
            >
              <span className="tab-icon">📜</span>
              <span>Grade Scale Reference</span>
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
            TAB 1: SGPA CALCULATOR
            ========================================================= */}
        {activeTab === "sgpa" && (
          <div className="calc-section-layout">
            <div className="calc-card-primary">
              <div className="calc-card-header">
                <div>
                  <h2 className="calc-card-title">Semester Grade Point Average (SGPA)</h2>
                  <p className="calc-card-desc">Select semester subjects, enter your expected grades, and calculate exact SGPA in real-time.</p>
                </div>

                {/* Regulation & Branch Selector */}
                <div className="calc-presets-bar">
                  <div className="calc-input-group">
                    <label>Regulation:</label>
                    <select
                      value={regulation}
                      onChange={(e) => setRegulation(e.target.value)}
                      className="calc-select"
                    >
                      <option value="R23">R23 Regulation</option>
                      <option value="R20">R20 Regulation</option>
                      <option value="R19">R19 Regulation</option>
                      <option value="R16">R16 Regulation</option>
                    </select>
                  </div>

                  <div className="calc-input-group">
                    <label>Branch:</label>
                    <select
                      value={branch}
                      onChange={(e) => {
                        setBranch(e.target.value);
                        handleApplyPreset(e.target.value, semester);
                      }}
                      className="calc-select"
                    >
                      <option value="AIML">AI & Machine Learning (AIML)</option>
                      <option value="CSE">Computer Science (CSE)</option>
                      <option value="ECE">Electronics & Comm (ECE)</option>
                      <option value="EEE">Electrical & Electronics (EEE)</option>
                      <option value="ME">Mechanical Engg (ME)</option>
                      <option value="CE">Civil Engg (CE)</option>
                    </select>
                  </div>

                  <div className="calc-input-group">
                    <label>Semester:</label>
                    <select
                      value={semester}
                      onChange={(e) => {
                        setSemester(e.target.value);
                        handleApplyPreset(branch, e.target.value);
                      }}
                      className="calc-select"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Subject Table */}
              <div className="calc-table-wrapper">
                <table className="calc-table">
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "45%" }}>Subject / Course Title</th>
                      <th style={{ width: "20%" }}>Credits</th>
                      <th style={{ width: "20%" }}>Grade</th>
                      <th style={{ width: "10%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sgpaSubjects.map((sub, idx) => (
                      <tr key={idx}>
                        <td className="text-center-cell">{idx + 1}</td>
                        <td>
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => handleSubjectChange(idx, "name", e.target.value)}
                            className="calc-input-text"
                            placeholder="Course Name..."
                          />
                        </td>
                        <td>
                          <select
                            value={sub.credits}
                            onChange={(e) => handleSubjectChange(idx, "credits", e.target.value)}
                            className="calc-select-cell"
                          >
                            <option value={4}>4.0 Credits (Major Core)</option>
                            <option value={3}>3.0 Credits (Standard)</option>
                            <option value={2}>2.0 Credits (Seminar / Project)</option>
                            <option value={1.5}>1.5 Credits (Lab Practical)</option>
                            <option value={1}>1.0 Credit (Skill Course)</option>
                            <option value={0.5}>0.5 Credit (Mandatory Non-Credit)</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={sub.grade}
                            onChange={(e) => handleSubjectChange(idx, "grade", e.target.value)}
                            className={`calc-select-cell calc-grade-${sub.grade.replace("+", "plus")}`}
                          >
                            <option value="O">O (10 Points) - Outstanding</option>
                            <option value="A+">A+ (9 Points) - Excellent</option>
                            <option value="A">A (8 Points) - Very Good</option>
                            <option value="B+">B+ (7 Points) - Good</option>
                            <option value="B">B (6 Points) - Above Average</option>
                            <option value="C">C (5 Points) - Average</option>
                            <option value="P">P (4 Points) - Pass</option>
                            <option value="F">F (0 Points) - Fail</option>
                            <option value="AB">AB (0 Points) - Absent</option>
                          </select>
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Action Bar */}
              <div className="calc-action-bar">
                <button type="button" className="calc-btn-add" onClick={handleAddSubject}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Another Subject</span>
                </button>

                <button type="button" className="calc-btn-reset" onClick={handleResetSgpa}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  <span>Reset Subjects</span>
                </button>
              </div>
            </div>

            {/* Sidebar Results Summary Card */}
            <aside className="calc-sidebar-score">
              <div className="calc-score-card">
                <div className="calc-score-header">
                  <span className="calc-pill-tag">SEMESTER SCORE</span>
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
                    <span>Total Registered Credits:</span>
                    <strong>{sgpaResult.totalCredits}</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Total Grade Points:</span>
                    <strong>{sgpaResult.totalGradePoints}</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Equivalent Percentage:</span>
                    <strong className="text-accent">{sgpaResult.percentage}%</strong>
                  </div>
                </div>

                <div className="calc-formula-note">
                  <p><strong>JNTU Formula:</strong> SGPA = Σ(Credits × Grade Points) / Σ(Credits)</p>
                  <p><strong>Percentage:</strong> (SGPA - 0.75) × 10%</p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* =========================================================
            TAB 2: CGPA CALCULATOR
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

              {/* Semesters Grid */}
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
                      <span className="calc-sem-cred-pill">{sem.credits} Credits</span>
                    </div>

                    <div className="calc-cgpa-inputs-row">
                      <div className="calc-input-subgroup">
                        <label>SGPA (0 - 10):</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={sem.sgpa}
                          disabled={!sem.active}
                          onChange={(e) => handleCgpaSemChange(idx, "sgpa", e.target.value)}
                          placeholder="e.g. 8.75"
                          className="calc-input-sgpa"
                        />
                      </div>

                      <div className="calc-input-subgroup">
                        <label>Credits:</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="30"
                          value={sem.credits}
                          disabled={!sem.active}
                          onChange={(e) => handleCgpaSemChange(idx, "credits", e.target.value)}
                          className="calc-input-cred"
                        />
                      </div>
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
                    <span>Total Credits Counted:</span>
                    <strong>{cgpaResult.totalCredits} / 160</strong>
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
              </div>
            </aside>
          </div>
        )}

        {/* =========================================================
            TAB 3: TARGET CGPA GOAL PLANNER
            ========================================================= */}
        {activeTab === "target" && (
          <div className="calc-section-layout">
            <div className="calc-card-primary">
              <div className="calc-card-header">
                <div>
                  <h2 className="calc-card-title">Target CGPA Graduation Planner</h2>
                  <p className="calc-card-desc">Calculate the exact SGPA you need in your upcoming semesters to achieve your dream graduation CGPA or Honors distinction.</p>
                </div>
              </div>

              <div className="calc-target-form-grid">
                <div className="calc-target-input-box">
                  <label>Current Cumulative CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={currentCgpaInput}
                    onChange={(e) => setCurrentCgpaInput(e.target.value)}
                    className="calc-target-input"
                  />
                  <span className="calc-input-hint">Your CGPA up to last semester</span>
                </div>

                <div className="calc-target-input-box">
                  <label>Completed Credits</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="160"
                    value={completedCreditsInput}
                    onChange={(e) => setCompletedCreditsInput(e.target.value)}
                    className="calc-target-input"
                  />
                  <span className="calc-input-hint">Credits earned so far (e.g. 110)</span>
                </div>

                <div className="calc-target-input-box">
                  <label>Target Dream CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={targetCgpaInput}
                    onChange={(e) => setTargetCgpaInput(e.target.value)}
                    className="calc-target-input target-highlight"
                  />
                  <span className="calc-input-hint">Desired final CGPA (e.g. 9.00)</span>
                </div>

                <div className="calc-target-input-box">
                  <label>Remaining Credits</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={remainingCreditsInput}
                    onChange={(e) => setRemainingCreditsInput(e.target.value)}
                    className="calc-target-input"
                  />
                  <span className="calc-input-hint">Total credits in remaining semesters</span>
                </div>
              </div>
            </div>

            {/* Sidebar Target Result */}
            <aside className="calc-sidebar-score">
              <div className="calc-score-card">
                <div className="calc-score-header">
                  <span className="calc-pill-tag">REQUIRED PERFORMANCE</span>
                  <span className="calc-sem-name">Goal: {targetCgpaInput} CGPA</span>
                </div>

                <div className="calc-score-visual">
                  <div className={`calc-score-circle ${targetPlannerResult.doable ? "target-circle-good" : "target-circle-warn"}`}>
                    <span className="calc-score-val">{targetPlannerResult.requiredSgpa}</span>
                    <span className="calc-score-sub">Avg SGPA Needed</span>
                  </div>
                </div>

                <div className={`calc-standing-badge ${targetPlannerResult.doable ? "standing-distinction" : "standing-fail"}`}>
                  {targetPlannerResult.status}
                </div>

                <div className="calc-breakdown-list">
                  <div className="calc-breakdown-row">
                    <span>Total B.Tech Credits:</span>
                    <strong>{targetPlannerResult.totalCredits} Credits</strong>
                  </div>
                  <div className="calc-breakdown-row">
                    <span>Target JNTU %:</span>
                    <strong className="text-accent">
                      {((parseFloat(targetCgpaInput) - 0.75) * 10).toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* =========================================================
            TAB 4: GRADE SCALE REFERENCE TABLE
            ========================================================= */}
        {activeTab === "scale" && (
          <div className="calc-section-layout-single">
            <div className="calc-card-primary">
              <div className="calc-card-header">
                <div>
                  <h2 className="calc-card-title">JNTU 10-Point Absolute Grading System</h2>
                  <p className="calc-card-desc">Standard grading scheme for B.Tech R23, R20, R19 & R16 academic regulations.</p>
                </div>
              </div>

              <div className="calc-table-wrapper">
                <table className="calc-table">
                  <thead>
                    <tr>
                      <th>Academic Grade</th>
                      <th>Grade Points</th>
                      <th>Marks Range</th>
                      <th>Performance Description</th>
                      <th>Pass / Fail Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRADE_SCALE_TABLE.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="grade-pill-badge" style={{ backgroundColor: `${row.color}15`, color: row.color, borderColor: `${row.color}35` }}>
                            {row.grade}
                          </span>
                        </td>
                        <td><strong>{row.points}</strong> / 10</td>
                        <td>{row.marks}</td>
                        <td>{row.desc}</td>
                        <td>
                          {row.points >= 4 ? (
                            <span className="status-pass-tag">✓ PASSED</span>
                          ) : (
                            <span className="status-fail-tag">✗ ARREAR</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
