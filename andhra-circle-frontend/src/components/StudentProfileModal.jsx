import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import profileImg from "../assets/jaswanth.png.png";
import "./StudentProfileModal.css";
import brandLogo from "../assets/jntu-brand-logo-v2.png";
import API from "../api/api";
import {
  getStoredStudentData,
  saveStoredStudentData,
  getBranchExamSchedule,
  computeLiveCountdown,
} from "../data/studentData";

function StudentProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const navigate = useNavigate();
  const [student, setStudent] = useState(getStoredStudentData());
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "grades" | "notes"
  const [timetableLink, setTimetableLink] = useState(
    "https://drive.google.com/file/d/1y7wCLbwIrrUImTdN0iY3iEWtVoiMEa6q/view?usp=drive_link"
  );

  useEffect(() => {
    if (isOpen) {
      const current = getStoredStudentData();
      setStudent(current);
    }
  }, [isOpen]);

  // Synchronize on external student data changes
  useEffect(() => {
    const handleSync = () => {
      const current = getStoredStudentData();
      setStudent(current);
    };
    window.addEventListener("studentProfileUpdated", handleSync);
    return () => window.removeEventListener("studentProfileUpdated", handleSync);
  }, []);

  // Fetch official live timetable notification from API
  useEffect(() => {
    let isMounted = true;
    const fetchTimetable = async () => {
      try {
        const res = await API.get("/notifications");
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.notifications)
          ? res.data.notifications
          : [];
        const tt = list.find(
          (n) =>
            n.title &&
            (n.title.toLowerCase().includes("timetable") ||
              n.title.toLowerCase().includes("time table")) &&
            n.link
        );
        if (tt && tt.link && isMounted) {
          setTimetableLink(tt.link);
        }
      } catch (e) {
        // Fallback default
      }
    };
    fetchTimetable();
    return () => {
      isMounted = false;
    };
  }, []);

  const cgpaNum = parseFloat(student.cgpa) || 8.85;
  const cgpaPercentage = Math.min(100, Math.max(0, (cgpaNum / 10) * 100));

  const getClassification = (score) => {
    if (score >= 8.5) return "Distinction";
    if (score >= 7.0) return "First Class";
    if (score >= 6.0) return "Second Class";
    return "Pass";
  };

  const attendanceStr = student.attendance || "90%";
  const attendanceNum = parseFloat(attendanceStr) || 90;
  const isAttendanceEligible = attendanceNum >= 75.0;

  const creditsStr = student.credits || "132 / 160";
  const parts = creditsStr.split("/").map((c) => parseInt(c.trim(), 10) || 0);
  const clearedCredits = parts[0] || 132;
  const totalCredits = parts[1] || 160;
  const creditPercent = totalCredits > 0 ? Math.min(100, Math.max(0, (clearedCredits / totalCredits) * 100)) : 82.5;
  const remainingCredits = Math.max(0, totalCredits - clearedCredits);

  const activeSchedule = useMemo(() => {
    if (
      student.examSchedule &&
      Array.isArray(student.examSchedule) &&
      student.examSchedule.length > 0 &&
      !student.examSchedule.some((e) => e.date?.includes("Dec 04"))
    ) {
      return student.examSchedule;
    }
    return getBranchExamSchedule(student.branchCode || student.branch);
  }, [student]);

  const firstExamDateStr = activeSchedule[0]?.date || "Nov 04, 2026";
  const [countdownText, setCountdownText] = useState(() =>
    computeLiveCountdown(`${firstExamDateStr} 10:00:00`)
  );

  useEffect(() => {
    const update = () => {
      setCountdownText(computeLiveCountdown(`${firstExamDateStr} 10:00:00`));
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [firstExamDateStr]);

  const handleDownloadTimetable = () => {
    if (timetableLink) {
      window.open(timetableLink, "_blank", "noopener,noreferrer");
    } else {
      navigate("/notifications");
    }
  };

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
              <img src={brandLogo} alt="JNTU Circle" className="sp-banner-logo" />
              <div className="sp-banner-titles">
                <span className="sp-banner-title">JNTU CIRCLE</span>
                <span className="sp-banner-tag">OFFICIAL STUDENT PORTAL</span>
              </div>
            </div>

            <div className="sp-banner-actions">
              <button 
                type="button" 
                className="sp-banner-btn" 
                onClick={handleOpenFullPage}
                title="Open in Dedicated Full Page to Edit & Manage Profile"
              >
                Full Page &amp; Edit ↗
              </button>
              <button 
                type="button" 
                className="sp-close-btn" 
                onClick={onClose}
                title="Close Profile"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Student Identity Card Bar */}
        <div className="sp-identity-card">
          <div className="sp-avatar-wrapper">
            <img src={profileImg} alt={student.name} className="sp-avatar-img" />
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
            
            <div className="sp-sub-info">
              <span className="sp-roll-pill">{student.hallTicket}</span>
              <span className="sp-dot-sep" />
              <span className="sp-degree">{student.branch} ({student.branchCode})</span>
              <span className="sp-dot-sep" />
              <span className="sp-year-badge">{student.year} ({student.semester})</span>
            </div>
          </div>

          <div className="sp-identity-meta-right hidden md:flex items-center">
            <span className="sp-academic-status-pill">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Academic Year 2024-25
            </span>
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
            <span className="material-symbols-outlined text-[17px]">dashboard</span> Dashboard Preview
          </button>
          <button 
            type="button" 
            className={`sp-tab-btn ${activeTab === "grades" ? "active" : ""}`}
            onClick={() => setActiveTab("grades")}
          >
            <span className="material-symbols-outlined text-[17px]">bar_chart</span> Semester Grades (SGPA)
          </button>
          <button 
            type="button" 
            className={`sp-tab-btn ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <span className="material-symbols-outlined text-[17px]">bookmark</span> Saved Study Notes ({student.savedNotes?.length || 0})
          </button>
        </div>

        {/* Modal Body Panels */}
        <div className="sp-modal-body">

          {/* TAB 1: ACADEMIC DASHBOARD PREVIEW & CREDENTIALS */}
          {activeTab === "overview" && (
            <div className="sp-tab-panel flex flex-col gap-4">
              
              {/* Row 1: Dual Telemetry Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                
                {/* Telemetry Card 1: Cumulative Performance & Attendance (6 cols) */}
                <div className="md:col-span-6 bg-[#12131B] border border-[#292733] rounded-xl p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#292733] pb-2">
                    <span className="text-[11px] font-bold tracking-wider text-[#A3A3B5] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                      Cumulative Performance
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#161724] border border-[#8B5CF6]/30 text-[11px] font-semibold text-[#C4B5FD]">
                      {getClassification(cgpaNum)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-0.5">
                    {/* CGPA Progress Ring */}
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#1e202f]"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                        <path
                          className="text-[#8B5CF6] transition-all duration-700 ease-out"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray={`${cgpaPercentage.toFixed(1)}, 100`}
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-lg font-black text-[#F5F5FA] leading-none">
                          {student.cgpa || "8.85"}
                        </span>
                        <span className="text-[8.5px] text-[#A3A3B5] font-mono">/10.0</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-semibold text-[#F5F5FA]">
                        Current SGPA: <span className="text-[#C4B5FD]">{student.sgpa || "9.42"}</span>
                      </span>
                      <span className="text-xs text-[#94A3B8]">
                        Department Rank: <span className="text-emerald-400 font-medium">Top 5% Merit</span>
                      </span>
                      <span className="text-[11px] text-[#A3A3B5]">
                        Attendance: <strong className="text-emerald-400">{student.attendance}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Attendance Bar */}
                  <div className="bg-[#08090D] border border-[#292733] rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">Final Exam Eligibility</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161724] border border-[#B8F268]/40 text-[#B8F268] text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B8F268]" />
                      Eligible for Finals
                    </span>
                  </div>
                </div>

                {/* Telemetry Card 2: Degree Progress & Credit Clearance (6 cols) */}
                <div className="md:col-span-6 bg-[#12131B] border border-[#292733] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#292733] pb-2">
                    <span className="text-[11px] font-bold tracking-wider text-[#A3A3B5] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C4B5FD]" />
                      Credit Clearance Audit
                    </span>
                    <span className="text-xs font-bold text-[#F5F5FA] font-mono">{student.credits || "132 / 160"}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-[#08090D] border border-[#292733] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#8B5CF6] to-[#C4B5FD] h-full transition-all duration-700 ease-out"
                        style={{ width: `${creditPercent.toFixed(1)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>{creditPercent.toFixed(1)}% Degree Progress</span>
                      <span className="text-[#C4B5FD] font-semibold">{remainingCredits} Credits Remaining</span>
                    </div>
                  </div>

                  {/* Backlogs Status Box */}
                  <div className="bg-[#08090D] border border-[#292733] rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">Standing Backlogs</span>
                      <span className="text-sm font-bold text-[#F5F5FA]">{student.backlogs || "0 Backlogs"}</span>
                    </div>
                    <span className="text-[11px] text-[#A3A3B5] text-right">Provisional Degree<br/>eligibility intact</span>
                  </div>
                </div>

              </div>

              {/* Row 2: Upcoming Semester Examination Schedule & Live Timetable */}
              <div className="bg-[#12131B] border border-[#292733] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-[#292733] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8B5CF6] text-[18px]">calendar_month</span>
                    <span className="text-xs font-bold tracking-wider text-[#F5F5FA] uppercase">
                      Upcoming Semester Examination Schedule
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#161724] border border-[#8B5CF6]/40 text-[#C4B5FD] font-mono text-[11px] font-semibold shadow-[0_0_8px_rgba(139,92,246,0.2)]">
                    {countdownText}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeSchedule.map((exam, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#08090D] border border-[#292733] hover:border-[#8B5CF6]/50 transition-all flex flex-col justify-between gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-[#8B5CF6]">{exam.code}</span>
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-[#161724] text-[#C4B5FD] font-mono">{exam.date}</span>
                      </div>
                      <span className="text-xs font-medium text-[#F5F5FA] line-clamp-1">{exam.title}</span>
                      <span className="text-[10.5px] text-[#94A3B8]">{exam.time}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadTimetable}
                    className="px-3.5 py-1.5 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 hover:bg-[#8B5CF6] hover:text-white text-[#C4B5FD] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    Download official timetable
                  </button>
                  <span className="text-[11px] text-[#64748B]">Official JNTUA Academic Session Schedule</span>
                </div>
              </div>

              {/* Row 3: Verified Student Academic Profile Credentials Grid */}
              <div className="bg-[#12131B] border border-[#292733] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-[#292733] pb-2">
                  <span className="text-xs font-bold tracking-wider text-[#A3A3B5] uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#8B5CF6]">badge</span>
                    Verified Student Credentials &amp; Institution
                  </span>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Enrolled &amp; Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-[#08090D] border border-[#292733] rounded-lg p-2.5 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Institution</span>
                    <span className="font-semibold text-[#F5F5FA] leading-tight">{student.college}</span>
                    <span className="text-[11px] text-[#94A3B8]">{student.university}</span>
                  </div>

                  <div className="bg-[#08090D] border border-[#292733] rounded-lg p-2.5 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Department &amp; Branch</span>
                    <span className="font-semibold text-[#F5F5FA]">{student.branch} ({student.branchCode})</span>
                    <span className="text-[11px] text-[#94A3B8] font-mono">Roll: {student.hallTicket}</span>
                  </div>

                  <div className="bg-[#08090D] border border-[#292733] rounded-lg p-2.5 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Academic Standing</span>
                    <span className="font-semibold text-[#F5F5FA]">{student.year} • {student.semester}</span>
                    <span className="text-[11px] text-[#C4B5FD] font-semibold">{student.regulation}</span>
                  </div>

                  <div className="bg-[#08090D] border border-[#292733] rounded-lg p-2.5 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Institutional Email</span>
                    <span className="font-semibold text-[#C4B5FD] truncate">{student.email}</span>
                    <span className="text-[11px] text-[#94A3B8]">Phone: {student.phone}</span>
                  </div>

                  <div className="bg-[#08090D] border border-[#292733] rounded-lg p-2.5 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Faculty Academic Mentor</span>
                    <span className="font-semibold text-[#F5F5FA]">{student.mentor || "Prof. K. S. Rao"}</span>
                    <span className="text-[11px] text-[#94A3B8]">Dept of {student.branchCode || "AIML"}</span>
                  </div>

                  <div className="bg-[#08090D] border border-[#292733] rounded-lg p-2.5 flex flex-col gap-1 justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Curriculum Status</span>
                    <span className="font-semibold text-emerald-400">Regular Full-Time Enrolled</span>
                    <span className="text-[11px] text-[#94A3B8]">{student.batch || "2022 - 2026"} Batch</span>
                  </div>
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
