import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStoredStudentData } from "../data/studentData";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import logo from "../assets/jntu-circle-logo.png.png";
import "./Reports.css";

export default function Reports() {
  const [studentData, setStudentData] = useState(getStoredStudentData());
  const [selectedSemFilter, setSelectedSemFilter] = useState("ALL");

  useEffect(() => {
    const handleUpdate = () => setStudentData(getStoredStudentData());
    window.addEventListener("studentProfileUpdated", handleUpdate);
    return () => window.removeEventListener("studentProfileUpdated", handleUpdate);
  }, []);

  const semesterGrades = studentData.semesterGrades || [
    { sem: "Sem 1", sgpa: "8.60", credits: 21, status: "Distinction" },
    { sem: "Sem 2", sgpa: "8.90", credits: 21, status: "Distinction" },
    { sem: "Sem 3", sgpa: "9.10", credits: 22, status: "Top 3 Rank" },
    { sem: "Sem 4", sgpa: "8.75", credits: 22, status: "Distinction" },
    { sem: "Sem 5", sgpa: "9.05", credits: 23, status: "Top 5 Rank" },
    { sem: "Sem 6", sgpa: "8.80", credits: 23, status: "Active Sem" },
  ];

  const filteredGrades = selectedSemFilter === "ALL"
    ? semesterGrades
    : semesterGrades.filter((g) => g.sem === selectedSemFilter);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rep-page-wrapper">
      <div className="rep-no-print">
        <Navbar />
      </div>

      <main className="rep-main-container">
        {/* Top Header & Actions */}
        <section className="rep-header-section rep-no-print">
          <div>
            <div className="rep-hero-badge">
              <span className="rep-badge-dot" />
              <span>Verified Academic Transcript & Analytics</span>
            </div>
            <h1 className="rep-page-title">JNTU Academic Reports</h1>
            <p className="rep-page-desc">
              Comprehensive semester evaluations, credit progression, grade point analytics, and official university transcript summary.
            </p>
          </div>

          <div className="rep-header-actions">
            <button type="button" className="rep-btn-print" onClick={handlePrint}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Download & Print Report</span>
            </button>
          </div>
        </section>

        {/* 4 Stat Overview Cards */}
        <section className="rep-stats-grid">
          <div className="rep-stat-card">
            <div className="rep-stat-icon-wrap stat-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="rep-stat-content">
              <span className="rep-stat-label">CUMULATIVE CGPA</span>
              <div className="rep-stat-val-row">
                <span className="rep-stat-value">{studentData.cgpa || "8.85"}</span>
                <span className="rep-stat-sub">/ 10.0</span>
              </div>
              <span className="rep-stat-foot text-green">Distinction Division</span>
            </div>
          </div>

          <div className="rep-stat-card">
            <div className="rep-stat-icon-wrap stat-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="rep-stat-content">
              <span className="rep-stat-label">EARNED CREDITS</span>
              <div className="rep-stat-val-row">
                <span className="rep-stat-value">{studentData.credits ? studentData.credits.split(" ")[0] : "132"}</span>
                <span className="rep-stat-sub">/ 160</span>
              </div>
              <span className="rep-stat-foot text-blue">82.5% Degree Completed</span>
            </div>
          </div>

          <div className="rep-stat-card">
            <div className="rep-stat-icon-wrap stat-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            </div>
            <div className="rep-stat-content">
              <span className="rep-stat-label">ATTENDANCE RATE</span>
              <div className="rep-stat-val-row">
                <span className="rep-stat-value">{studentData.attendance || "89.4%"}</span>
              </div>
              <span className="rep-stat-foot text-purple">Eligible for Exam Hall Ticket</span>
            </div>
          </div>

          <div className="rep-stat-card">
            <div className="rep-stat-icon-wrap stat-teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="rep-stat-content">
              <span className="rep-stat-label">ACTIVE BACKLOGS</span>
              <div className="rep-stat-val-row">
                <span className="rep-stat-value">0</span>
                <span className="rep-stat-sub">Standing</span>
              </div>
              <span className="rep-stat-foot text-teal">All Subjects Cleared</span>
            </div>
          </div>
        </section>

        {/* Printable Official Transcript Container */}
        <section className="rep-transcript-card">
          {/* Official JNTU Header */}
          <div className="rep-transcript-header">
            <img src={logo} alt="JNTU Logo" className="rep-official-logo" />
            <div className="rep-official-titles">
              <h2>JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY</h2>
              <h3>OFFICIAL ACADEMIC PROGRESS & TRANSCRIPT REPORT</h3>
              <p>{studentData.college || "Autonomous College of Engineering"}</p>
            </div>
          </div>

          {/* Student Particulars Bar */}
          <div className="rep-student-meta-grid">
            <div className="rep-meta-item">
              <span className="rep-meta-label">Student Name:</span>
              <strong className="rep-meta-val">{studentData.name || "Chinnu"}</strong>
            </div>
            <div className="rep-meta-item">
              <span className="rep-meta-label">Hall Ticket No:</span>
              <strong className="rep-meta-val text-primary">{studentData.hallTicket || "22B91A4201"}</strong>
            </div>
            <div className="rep-meta-item">
              <span className="rep-meta-label">Department / Branch:</span>
              <strong className="rep-meta-val">{studentData.branch || "AI & Machine Learning"}</strong>
            </div>
            <div className="rep-meta-item">
              <span className="rep-meta-label">Regulation & Batch:</span>
              <strong className="rep-meta-val">{studentData.regulation || "R20"} ({studentData.batch || "2022 - 2026"})</strong>
            </div>
          </div>

          {/* Semester Grades Table */}
          <div className="rep-table-section">
            <div className="rep-table-filter-bar rep-no-print">
              <span className="rep-filter-title">Semester Performance Breakdown:</span>
              <div className="rep-filter-pills">
                {["ALL", "Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`rep-filter-btn ${selectedSemFilter === s ? "active" : ""}`}
                    onClick={() => setSelectedSemFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <table className="rep-data-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Registered Credits</th>
                  <th>Credits Earned</th>
                  <th>SGPA Secured</th>
                  <th>Equiv. Percentage</th>
                  <th>Performance Classification</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((row, idx) => {
                  const isNumSgpa = !isNaN(parseFloat(row.sgpa));
                  const percentage = isNumSgpa ? ((parseFloat(row.sgpa) - 0.75) * 10).toFixed(1) : "—";

                  return (
                    <tr key={idx}>
                      <td><strong>{row.sem}</strong></td>
                      <td>{row.credits}</td>
                      <td>{row.credits}</td>
                      <td>
                        <span className="rep-sgpa-badge">
                          {row.sgpa}
                        </span>
                      </td>
                      <td>{percentage !== "—" ? `${percentage}%` : "—"}</td>
                      <td>{row.status}</td>
                      <td>
                        <span className="rep-status-tag">PASSED</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="rep-transcript-footer">
            <div className="rep-calc-notes">
              <p><strong>Grading Standards:</strong> 10-point scale. Distinction: SGPA/CGPA ≥ 7.75. First Class: ≥ 6.75.</p>
              <p><strong>Formula:</strong> Percentage Marks = (CGPA - 0.75) × 10% as prescribed by JNTU Academic Senate.</p>
            </div>

            <div className="rep-signature-block">
              <div className="rep-sig-line" />
              <span>Controller of Examinations / Dean</span>
            </div>
          </div>
        </section>
      </main>

      <div className="rep-no-print">
        <Footer />
      </div>
    </div>
  );
}
