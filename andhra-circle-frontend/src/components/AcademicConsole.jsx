import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import {
  getStoredStudentData,
  getBranchExamSchedule,
  computeLiveCountdown,
} from "../data/studentData";

function AcademicConsole() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(getStoredStudentData());
  const [timetableLink, setTimetableLink] = useState(
    "https://drive.google.com/file/d/1y7wCLbwIrrUImTdN0iY3iEWtVoiMEa6q/view?usp=drive_link"
  );
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setStudent(getStoredStudentData());
    };
    window.addEventListener("studentProfileUpdated", handleSync);
    return () => window.removeEventListener("studentProfileUpdated", handleSync);
  }, []);

  // Synchronize official examination timetable link from real university notifications
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

  // Dynamically synchronize examination schedule based on student's branch
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

  // Keep countdown strictly synchronized with the first scheduled examination date
  useEffect(() => {
    const update = () => {
      setCountdownText(computeLiveCountdown(`${firstExamDateStr} 10:00:00`));
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [firstExamDateStr]);

  const handleDownloadTimeTable = () => {
    setIsDownloading(true);
    if (timetableLink) {
      window.open(timetableLink, "_blank", "noopener,noreferrer");
    } else {
      navigate("/notifications");
    }
    setTimeout(() => setIsDownloading(false), 2000);
  };

  const cgpaNum = parseFloat(student.cgpa) || 9.18;
  const sgpaText = student.sgpa || "9.42";
  const cgpaPercentage = Math.min(100, Math.max(0, (cgpaNum / 10) * 100));

  const getClassification = (score) => {
    if (score >= 8.5) return "Distinction";
    if (score >= 7.0) return "First Class";
    if (score >= 6.0) return "Second Class";
    return "Pass";
  };

  const attendanceStr = student.attendance || "89.4%";
  const attendanceNum = parseFloat(attendanceStr) || 89.4;
  const isAttendanceEligible = attendanceNum >= 75.0;

  // Credits parsing e.g. "142 / 160"
  const creditsStr = student.credits || "142 / 160";
  const parts = creditsStr.split("/").map((c) => parseInt(c.trim(), 10) || 0);
  const clearedCredits = parts[0] || 142;
  const totalCredits = parts[1] || 160;
  const creditPercent = totalCredits > 0 ? Math.min(100, Math.max(0, (clearedCredits / totalCredits) * 100)) : 88.75;
  const remainingCredits = Math.max(0, totalCredits - clearedCredits);

  const backlogsText = student.backlogs || "0 Backlogs";

  return (
    <section className="flex flex-col gap-6 w-full scroll-mt-20 px-4" id="academic-console">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-mono-sm text-label-mono-sm uppercase tracking-widest text-[#C4B5FD] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            Activity PORTAL&nbsp;
          </span>
          <h2 className="font-headline-lg text-headline-lg font-bold text-[#F5F5FA] mt-1">
            Student Academic Console (Preview)
          </h2>
        </div>
      </div>

      {/* Mock Browser/Terminal Container */}
      <div className="bg-[#12131B] border border-[#292733] rounded-xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-[#08090D] border-b border-[#292733] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-[#27213B] border border-[#8B5CF6]/30 font-label-mono-sm text-label-mono-sm text-[#C4B5FD]">
              Student Performance &amp; Schedule ({student.shortName || student.name || "Student"})
            </span>
          </div>
        </div>

        {/* 3-Column Student Telemetry Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#12131B]">
          
          {/* Column 1: CGPA Gauge & Attendance (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5 bg-[#08090D] border border-[#292733] rounded-lg p-5">
            <div className="flex items-center justify-between border-b border-[#292733] pb-3">
              <span className="font-label-caps text-label-caps uppercase text-[#A3A3B5] tracking-wider">
                Cumulative Performance
              </span>
            </div>

            {/* CGPA Circular Progress Representation */}
            <div className="flex items-center gap-5 my-2">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#292733]"
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
                  <span className="font-headline-sm text-headline-sm font-bold text-[#F5F5FA]">
                    {student.cgpa || "9.18"}
                  </span>
                  <span className="font-label-mono-sm text-[9px] text-[#A3A3B5]">/10.0</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-body-md text-body-md font-medium text-[#F5F5FA]">
                  SGPA Current: {sgpaText}
                </span>
                <span className="font-body-sm text-body-sm text-[#A3A3B5]">
                  Grade Classification:{" "}
                  <span className="text-[#C4B5FD] font-semibold">{getClassification(cgpaNum)}</span>
                </span>
                <Link
                  to="/calculator"
                  className="text-xs text-[#8B5CF6] hover:text-[#C4B5FD] underline mt-1"
                >
                  Calculate your CGPA →
                </Link>
              </div>
            </div>

            {/* Attendance Row */}
            <div className="bg-[#12131B] border border-[#292733] rounded p-3.5 flex items-center justify-between">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-[#A3A3B5]">
                  Attendance stats
                </span>
                <div className="font-headline-sm text-headline-sm font-bold text-[#F5F5FA] mt-0.5">
                  {attendanceStr}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#12131B] border font-label-mono-sm text-label-mono-sm ${
                  isAttendanceEligible
                    ? "border-[#B8F268]/40 text-[#B8F268]"
                    : "border-[#f43f5e]/40 text-[#f43f5e]"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAttendanceEligible ? "bg-[#B8F268]" : "bg-[#f43f5e]"}`} />
                  {isAttendanceEligible ? "Eligible for Finals" : "Attendance Shortage"}
                </span>
                <span className="font-label-mono-sm text-[10px] text-[#A3A3B5] mt-1">
                  Min. Requirement: 75.0%
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Upcoming Semester Examination Schedule (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-[#08090D] border border-[#292733] rounded-lg p-5">
            <div className="flex items-center justify-between border-b border-[#292733] pb-3">
              <span className="font-label-caps text-label-caps uppercase text-[#A3A3B5] tracking-wider">
                Semester Examination Schedule
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#27213B] text-[#C4B5FD] font-label-mono-sm text-label-mono-sm border border-[#8B5CF6]/30 shadow-[0_0_8px_rgba(139,92,246,0.2)]">
                {countdownText || student.examCountdown || "STARTS IN 12D : 20H"}
              </span>
            </div>

            {/* Exam Items */}
            <div className="flex flex-col gap-2.5">
              {activeSchedule.map((exam, idx) => (
                <div key={idx} className="p-3 rounded bg-[#12131B] border border-[#292733] hover:border-[#8B5CF6]/40 transition-colors flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-mono-sm text-label-mono-sm text-[#8B5CF6] font-semibold">
                        {exam.code}
                      </span>
                      <span className="font-body-sm text-body-sm font-medium text-[#F5F5FA]">
                        {exam.title}
                      </span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm text-[#A3A3B5]">
                      &nbsp;{exam.time}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-[#08090D] border border-[#292733] font-label-mono-sm text-label-mono-sm text-[#C4B5FD]">
                      {exam.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Hall Ticket / Timetable Action Bar */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadTimeTable}
                className="px-3 py-1.5 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-[#C4B5FD] font-label-mono-sm text-label-mono-sm hover:bg-[#8B5CF6] hover:text-[#F5F5FA] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Download official university examination timetable"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isDownloading ? "hourglass_top" : "download"}
                </span>
                {isDownloading ? "Opening timetable..." : "Download time table"}
              </button>
            </div>
          </div>

          {/* Column 3: Credit Audit & Backlogs (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4 bg-[#08090D] border border-[#292733] rounded-lg p-5">
            <div className="border-b border-[#292733] pb-3">
              <span className="font-label-caps text-label-caps uppercase text-[#A3A3B5] tracking-wider">
                Credit Clearance Audit
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between font-label-mono-sm text-label-mono-sm">
                <span className="text-[#A3A3B5]">Degree Completion</span>
                <span className="text-[#F5F5FA] font-bold">{creditsStr}</span>
              </div>
              <div className="w-full bg-[#12131B] border border-[#292733] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#8B5CF6] to-[#C4B5FD] h-full transition-all duration-700 ease-out"
                  style={{ width: `${creditPercent.toFixed(1)}%` }}
                />
              </div>
              <span className="font-label-mono-sm text-[11px] text-[#A3A3B5]">
                {remainingCredits} Credits remaining in {student.semester || "Semester 8"}
              </span>
            </div>

            {/* Backlogs Status Card */}
            <div className="bg-[#12131B] border border-[#292733] rounded p-3.5 mt-2 flex flex-col gap-2">
              <span className="font-label-caps text-label-caps uppercase text-[#A3A3B5]">
                Standing Backlog Registry
              </span>
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm font-bold text-[#F5F5FA]">
                  {backlogsText}
                </span>
              </div>
              <span className="font-label-mono-sm text-[10px] text-[#A3A3B5]">
                {backlogsText.startsWith("0")
                  ? "Provisional Degree eligibility intact."
                  : "Subject clearance required for degree completion."}
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default AcademicConsole;
