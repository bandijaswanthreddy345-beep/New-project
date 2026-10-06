import { useEffect, useState, useMemo, useRef } from "react";
import { MetalFx, useMetalBend } from "metal-fx";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import logo from "../assets/jntu-circle-logo.png.png";
import profile from "../assets/jaswanth.png.png";
import StudentProfileModal from "../components/StudentProfileModal";
import { getStoredStudentData } from "../data/studentData";
import "./Notes.css";

// Branch definitions matching homepage engineering departments
const BRANCH_TABS = [
  {
    code: "CSE",
    name: "Computer Science Engineering",
    keywords: ["computer", "cse", "cs"],
  },
  {
    code: "ECE",
    name: "Electronics & Communication",
    keywords: ["electronics", "ece", "ec"],
  },
  {
    code: "EEE",
    name: "Electrical & Electronics",
    keywords: ["electrical", "eee", "ee"],
  },
  {
    code: "ME",
    name: "Mechanical Engineering",
    keywords: ["mechanical", "mech", "me"],
  },
  {
    code: "CE",
    name: "Civil Engineering",
    keywords: ["civil", "ce"],
  },
  {
    code: "AIML",
    name: "AI & Machine Learning",
    keywords: ["artificial", "aiml", "machine", "ai"],
  },
];

// Curated subjects for standard reference matching academic syllabus
const CURATED_SUBJECTS = {
  CSE: [
    { title: "Data Structures", semester: "3rd Sem" },
    { title: "Operating Systems", semester: "5th Sem" },
    { title: "Database Management Systems", semester: "3rd Sem" },
    { title: "Computer Networks", semester: "6th Sem" },
  ],
  ECE: [
    { title: "Signals & Systems", semester: "3rd Sem" },
    { title: "Digital Signal Processing", semester: "5th Sem" },
    { title: "VLSI Design", semester: "6th Sem" },
    { title: "Microprocessors & Microcontrollers", semester: "4th Sem" },
  ],
  EEE: [
    { title: "Power Systems Analysis", semester: "5th Sem" },
    { title: "Electrical Machines", semester: "3rd Sem" },
    { title: "Control Systems Engineering", semester: "4th Sem" },
    { title: "Power Electronics", semester: "6th Sem" },
  ],
  ME: [
    { title: "Thermodynamics", semester: "3rd Sem" },
    { title: "Fluid Mechanics", semester: "4th Sem" },
    { title: "Design of Machine Elements", semester: "5th Sem" },
    { title: "Manufacturing Technology", semester: "3rd Sem" },
  ],
  CE: [
    { title: "Structural Analysis", semester: "4th Sem" },
    { title: "Geotechnical Engineering", semester: "5th Sem" },
    { title: "Surveying & Geomatics", semester: "3rd Sem" },
    { title: "Transportation Engineering", semester: "6th Sem" },
  ],
  AIML: [
    { title: "Deep Learning", semester: "7th Sem" },
    { title: "Big Data Analytics", semester: "4th Sem" },
    { title: "Machine Learning Fundamentals", semester: "5th Sem" },
    { title: "Natural Language Processing", semester: "6th Sem" },
  ],
};

function Notes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get initial branch from URL param or default to "CSE"
  const urlBranch = (searchParams.get("branch") || searchParams.get("search") || "CSE").toUpperCase();
  const matchedTab = BRANCH_TABS.find(
    (b) => b.code === urlBranch || b.keywords.some((k) => urlBranch.toLowerCase().includes(k))
  );

  const [activeBranch, setActiveBranch] = useState(matchedTab ? matchedTab.code : "CSE");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [studentData, setStudentData] = useState(getStoredStudentData());
  const [downloadingId, setDownloadingId] = useState(null);
  const [pulsingBranch, setPulsingBranch] = useState(null);
  const searchInputRef = useRef(null);
  const searchMetalRef = useRef(null);

  // Hook for cursor-driven liquid metal bend interaction
  useMetalBend(searchMetalRef);

  useEffect(() => {
    const handleProfileSync = () => {
      setStudentData(getStoredStudentData());
    };
    window.addEventListener("studentProfileUpdated", handleProfileSync);
    return () => window.removeEventListener("studentProfileUpdated", handleProfileSync);
  }, []);

  // Sync state if URL branch query parameter changes
  useEffect(() => {
    const b = searchParams.get("branch") || searchParams.get("search");
    if (b) {
      const found = BRANCH_TABS.find(
        (t) => t.code === b.toUpperCase() || t.keywords.some((k) => b.toLowerCase().includes(k))
      );
      if (found) {
        setActiveBranch(found.code);
      }
    }
  }, [searchParams]);

  // Fetch real notes from MongoDB backend
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const res = await API.get("/notes");
        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (Array.isArray(res.data?.notes)) {
          data = res.data.notes;
        } else if (Array.isArray(res.data?.data)) {
          data = res.data.data;
        }
        setNotes(data);
      } catch (err) {
        console.error("Error fetching notes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  // Format note title cleanly
  const formatTitle = (raw) => {
    if (!raw) return "Subject Notes";
    return raw
      .split(" ")
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
      .join(" ");
  };

  // Build the list of notes for the active branch
  const displayNotes = useMemo(() => {
    const activeTab = BRANCH_TABS.find((t) => t.code === activeBranch);
    const keywords = activeTab ? activeTab.keywords : ["cse"];

    // 1. Filter real backend notes belonging to this branch
    const backendMatching = notes.filter((n) => {
      const bText = String(n.branch || "").toLowerCase();
      return keywords.some((k) => bText.includes(k));
    });

    const mappedBackend = backendMatching.map((n) => {
      let title = n.subject || n.title;
      if (title.toLowerCase() === "notes" && n.subject) {
        title = n.subject;
      }
      const sem = n.semester ? n.semester.replace(/semester/i, "Sem").trim() : "3rd Sem";
      return {
        id: n._id,
        title: formatTitle(title),
        semester: sem,
        branchCode: activeBranch,
        isBackend: true,
      };
    });

    // 2. Curated subjects
    const curated = (CURATED_SUBJECTS[activeBranch] || CURATED_SUBJECTS.CSE).map((c, idx) => ({
      id: `curated-${activeBranch}-${idx}`,
      title: c.title,
      semester: c.semester,
      branchCode: activeBranch,
      isBackend: false,
    }));

    // Combine backend items with curated items (avoiding duplicates)
    const combined = [...mappedBackend];
    curated.forEach((c) => {
      if (!combined.some((item) => item.title.toLowerCase() === c.title.toLowerCase())) {
        combined.push(c);
      }
    });

    // 3. Filter by search query
    let filtered = combined;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) => item.title.toLowerCase().includes(q) || item.semester.toLowerCase().includes(q)
      );
    }

    // 4. Filter by semester dropdown
    if (selectedSemester !== "ALL") {
      const s = selectedSemester.toLowerCase();
      filtered = filtered.filter((item) => item.semester.toLowerCase().includes(s));
    }

    return filtered;
  }, [notes, activeBranch, searchQuery, selectedSemester]);

  // Memoized count of study resources per engineering branch
  const branchCounts = useMemo(() => {
    const counts = {};
    BRANCH_TABS.forEach((tab) => {
      const keywords = tab.keywords;
      const backendMatching = notes.filter((n) => {
        const bText = String(n.branch || "").toLowerCase();
        return keywords.some((k) => bText.includes(k));
      });
      const curated = CURATED_SUBJECTS[tab.code] || [];
      const titleSet = new Set(
        backendMatching.map((n) => String(n.subject || n.title || "").toLowerCase().trim())
      );
      curated.forEach((c) => titleSet.add(c.title.toLowerCase().trim()));
      counts[tab.code] = titleSet.size || curated.length || 4;
    });
    return counts;
  }, [notes]);

  // Handle branch tab switch with reactive search button feedback
  const handleSelectBranch = (code) => {
    setPulsingBranch(code);
    setTimeout(() => setPulsingBranch(null), 500);
    setActiveBranch(code);
    setSearchParams({ branch: code });
  };

  // Handle direct search execution via search button
  const handleExecuteSearch = () => {
    setPulsingBranch(activeBranch);
    setTimeout(() => setPulsingBranch(null), 500);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle viewing a note
  const handleViewNote = (item) => {
    if (item.isBackend && item.id) {
      navigate(`/notes/${item.id}`);
    } else {
      // Find matching note in backend or navigate to the first available note
      const activeTab = BRANCH_TABS.find((t) => t.code === activeBranch);
      const keywords = activeTab ? activeTab.keywords : ["cse"];
      const match = notes.find((n) => {
        const bText = String(n.branch || "").toLowerCase();
        return keywords.some((k) => bText.includes(k));
      });
      if (match) {
        navigate(`/notes/${match._id}`);
      } else if (notes.length > 0) {
        navigate(`/notes/${notes[0]._id}`);
      } else {
        alert(`Accessing ${item.title} notes for ${item.branchCode}...`);
      }
    }
  };

  // Handle downloading note file or study material package
  const handleDownloadNote = async (e, item) => {
    e.stopPropagation();
    try {
      setDownloadingId(item.id);

      // 1. Identify backend note (either directly or by searching notes array)
      let targetNote = null;
      if (item.isBackend && item.id) {
        targetNote = notes.find((n) => n._id === item.id);
      } else {
        const activeTab = BRANCH_TABS.find((t) => t.code === activeBranch);
        const keywords = activeTab ? activeTab.keywords : ["cse"];
        targetNote =
          notes.find((n) => {
            const bText = String(n.branch || "").toLowerCase();
            const titleText = String(n.subject || n.title || "").toLowerCase();
            return (
              keywords.some((k) => bText.includes(k)) &&
              (titleText.includes(item.title.toLowerCase()) ||
                item.title.toLowerCase().includes(titleText))
            );
          }) ||
          notes.find((n) => {
            const bText = String(n.branch || "").toLowerCase();
            return keywords.some((k) => bText.includes(k));
          }) ||
          (notes.length > 0 ? notes[0] : null);
      }

      // 2. Check for uploaded PDF
      const pdfPath =
        targetNote?.module1Pdf ||
        targetNote?.pdfUrl ||
        targetNote?.module2Pdf ||
        targetNote?.module3Pdf;

      let downloadedSuccessfully = false;

      if (pdfPath) {
        const downloadUrl = pdfPath.startsWith("http")
          ? pdfPath
          : `http://localhost:5000${pdfPath}`;
        const fileName = `${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_${
          item.branchCode || activeBranch
        }_Notes.pdf`;

        try {
          const res = await fetch(downloadUrl);
          if (res.ok) {
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            downloadedSuccessfully = true;
            if (targetNote?._id) {
              API.put(`/notes/${targetNote._id}/download`).catch(() => {});
            }
          }
        } catch (fetchErr) {
          console.warn("Server file unavailable, falling back to academic study package:", fetchErr);
        }
      }

      if (!downloadedSuccessfully) {
        // Generate an official academic study package document for this subject
        const content = `=====================================================
JNTU CIRCLE — ACADEMIC REPOSITORY
Subject: ${item.title}
Branch: ${item.branchCode || activeBranch}
Semester: ${item.semester || "Current Semester"}
Student Account: ${studentData.name || "Chinnu"} (${studentData.hallTicket || "22B91A4201"})
Curriculum: ${studentData.regulation || "R20 Regulation"}
=====================================================

SYLLABUS & MODULE BLUEPRINT:
-----------------------------------------------------
Unit 1: Foundational Theory & Core Principles
Unit 2: Mathematical Formulations & Architecture
Unit 3: Design Frameworks & Analytical Methods
Unit 4: Systems Implementation & Industry Standards
Unit 5: Advanced Applications & Emerging Topics

EXAMINATION PREPARATION CHECKLIST:
1. Review previous year university question papers for ${item.title}.
2. Practice module derivations and block diagrams.
3. For additional module notes, access JNTU Circle at: http://localhost:5173/notes

Generated securely by JNTU Circle Student Academic Portal.
`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_${
          item.branchCode || activeBranch
        }_Study_Notes.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error downloading notes:", err);
      alert(`Preparing ${item.title} notes download... Please try again.`);
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
      }, 700);
    }
  };

  return (
    <div className="notes-dashboard-container">
      <div className="notes-dashboard-card">

        {/* =========================================================
            LEFT SIDEBAR (MIDNIGHT EMERALD #002420)
            ========================================================= */}
        <aside className="notes-sidebar">
          {/* Brand Header */}
          <div className="sidebar-brand" onClick={() => navigate("/")} title="Return to Homepage">
            <img src={logo} alt="JNTU Circle" className="sidebar-logo-img" />
            <div className="sidebar-brand-text">
              <h2><span className="font-deltha">JNTU</span> Circle</h2>
              <span>Academic Hub</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate("/")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </button>

            <button
              type="button"
              className="sidebar-link active"
              onClick={() => navigate("/notes")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Notes</span>
            </button>

            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate("/papers")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M9 15h6" />
                <path d="M9 11h6" />
              </svg>
              <span>Question Papers</span>
            </button>

            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate("/syllabus")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Syllabus</span>
            </button>

            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate("/notifications")}
              title="View live academic notifications & circulars"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notifications</span>
              <span className="sidebar-notif-badge">New</span>
            </button>
          </nav>

          {/* Bottom Profile Pill (Clickable & Opens Student Profile) */}
          <button
            type="button"
            className="sidebar-profile"
            onClick={() => setIsProfileOpen(true)}
            title="View & Edit Student Profile"
          >
            <div className="profile-avatar-wrapper">
              <img src={profile} alt={studentData.name} className="profile-avatar" />
              <span className="profile-status-dot" />
            </div>
            <div className="profile-info">
              <span className="profile-name">{studentData.shortName || "Chinnu"}</span>
              <span className="profile-role">{studentData.role || "Student"}</span>
            </div>
            <svg className="profile-chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </aside>

        {/* =========================================================
            MAIN CONTENT AREA (WARM CANVAS & CRISP CARDS)
            ========================================================= */}
        <main className="notes-main-panel">
          {/* Header */}
          <header className="notes-page-header">
            <h1 className="notes-page-title">Notes & Study Materials</h1>
            <p className="notes-page-subtitle">Access high-quality lecture notes, module guides, and syllabus resources across all engineering departments.</p>
          </header>

          {/* Search & Filters Controls */}
          <div className="notes-filters-row">
            {/* Search Box with Reactive Search Button */}
            <div className="notes-search-box">
              <div className="notes-search-metal-wrap">
                <MetalFx
                  ref={searchMetalRef}
                  preset="chromatic"
                  variant="circle"
                  strength={1}
                  innerShadow
                  className="metal-search-wrapper"
                >
                  <button 
                    type="button" 
                    className="metal-search-btn notes-metal-search-btn"
                    onClick={handleExecuteSearch}
                    title="Search notes"
                    aria-label="Search"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="metal-search-icon"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
                    </svg>
                  </button>
                </MetalFx>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Search ${activeBranch} notes, subjects, codes...`}
                className="notes-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecuteSearch()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Branch Dropdown */}
            <select
              className="notes-select-dropdown"
              value={activeBranch}
              onChange={(e) => handleSelectBranch(e.target.value)}
            >
              <option value="CSE">CSE — Computer Science</option>
              <option value="ECE">ECE — Electronics & Comm.</option>
              <option value="EEE">EEE — Electrical Eng.</option>
              <option value="ME">ME — Mechanical Eng.</option>
              <option value="CE">CE — Civil Eng.</option>
              <option value="AIML">AIML — AI & Data Science</option>
            </select>

            {/* Semester Dropdown */}
            <select
              className="notes-select-dropdown"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="ALL">All Semesters</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="3rd">3rd Semester</option>
              <option value="4th">4th Semester</option>
              <option value="5th">5th Semester</option>
              <option value="6th">6th Semester</option>
              <option value="7th">7th Semester</option>
              <option value="8th">8th Semester</option>
            </select>
          </div>

          {/* Two-Column Body: Branch Tabs + Notes Folder Cards */}
          <div className="notes-split-view">
            {/* Left Branch Tabs Column */}
            <div className="notes-branch-sidebar">
              {BRANCH_TABS.map((tab) => {
                const isActive = activeBranch === tab.code;
                const isPulsing = pulsingBranch === tab.code;
                const count = branchCounts[tab.code] || 0;
                return (
                  <button
                    key={tab.code}
                    type="button"
                    className={`branch-nav-pill ${isActive ? "active" : ""} ${isPulsing ? "is-pulsing" : ""}`}
                    onClick={() => handleSelectBranch(tab.code)}
                    title={`Search ${tab.name}`}
                    aria-label={`Search ${tab.name}`}
                  >
                    {/* Reactive Branch Specific Emoji / Icon */}
                    <span 
                      className={`branch-icon-box ${tab.code.toLowerCase()}-icon ${isPulsing ? "reactive-burst" : ""}`}
                    >
                      {tab.code === "CSE" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                          <line x1="14" y1="4" x2="10" y2="20" stroke="#38bdf8" strokeWidth="2" />
                        </svg>
                      )}
                      {tab.code === "ECE" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="4" width="16" height="16" rx="2.5" fill="#ea580c" fillOpacity="0.12" />
                          <rect x="9" y="9" width="6" height="6" rx="1" fill="#ea580c" fillOpacity="0.28" />
                          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
                        </svg>
                      )}
                      {tab.code === "EEE" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#d97706" fillOpacity="0.22" />
                        </svg>
                      )}
                      {tab.code === "ME" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" fill="#9333ea" fillOpacity="0.25" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                        </svg>
                      )}
                      {tab.code === "CE" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" fill="#0891b2" fillOpacity="0.14" />
                          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                          <path d="M10 6h4" />
                          <path d="M10 10h4" />
                          <path d="M10 14h4" />
                          <path d="M10 18h4" />
                        </svg>
                      )}
                      {tab.code === "AIML" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" fill="#059669" fillOpacity="0.22" />
                          <path d="M5 3v4M3 5h4" strokeWidth="1.8" />
                          <path d="M19 17v4M17 19h4" strokeWidth="1.8" />
                        </svg>
                      )}
                    </span>
                    <span className="branch-nav-code">{tab.code}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Subject Folder Cards List */}
            <div 
              key={`${activeBranch}-${selectedSemester}-${searchQuery}`}
              className="notes-cards-container"
            >
              {loading ? (
                <>
                  <div className="notes-skeleton-card" />
                  <div className="notes-skeleton-card" />
                  <div className="notes-skeleton-card" />
                </>
              ) : displayNotes.length === 0 ? (
                <div className="notes-empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <h3>No Notes Available</h3>
                  <p>No study materials match your search or filter criteria for this department.</p>
                  <button
                    type="button"
                    className="empty-reset-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSemester("ALL");
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                displayNotes.map((item) => (
                  <article key={item.id} className="notes-folder-card">
                    {/* Folder Icon & Subject Details */}
                    <div className="folder-card-left">
                      {/* Deep Emerald & Sunbeam Dual-Tone Folder Icon */}
                      <svg
                        className="folder-svg-icon"
                        viewBox="0 0 48 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 8C4 5.79086 5.79086 4 8 4H18.2426C19.3035 4 20.3209 4.42143 21.0711 5.17157L24.8284 8.92893C25.5786 9.67907 26.596 10.1005 27.6569 10.1005H40C42.2091 10.1005 44 11.8914 44 14.1005V32C44 34.2091 42.2091 36 40 36H8C5.79086 36 4 34.2091 4 32V8Z"
                          fill="#002924"
                        />
                        <path
                          d="M4 14.5C4 12.567 5.567 11 7.5 11H40.5C42.433 11 44 12.567 44 14.5V32.5C44 34.433 42.433 36 40.5 36H7.5C5.567 36 4 34.433 4 32.5V14.5Z"
                          fill="#013e37"
                        />
                        <path
                          d="M4 16.5C4 14.8431 5.34315 13.5 7 13.5H41C42.6569 13.5 44 14.8431 44 16.5V32.5C44 34.433 42.433 36 40.5 36H7.5C5.567 36 4 34.433 4 32.5V16.5Z"
                          fill="#02594f"
                        />
                        <circle cx="39" cy="9.5" r="2.5" fill="#d9a726" />
                      </svg>

                      <div className="folder-card-meta">
                        <h3 className="folder-card-title">{item.title}</h3>
                        <p className="folder-card-sub">
                          <span className="folder-branch-tag">{item.branchCode}</span>
                          <span>•</span>
                          <span>{item.semester}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Button: View */}
                    <div className="folder-card-actions">
                      <button
                        type="button"
                        className="folder-view-btn"
                        onClick={() => handleViewNote(item)}
                        title={`View ${item.title}`}
                      >
                        View
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </main>

      </div>

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={(updated) => setStudentData(updated)}
      />
    </div>
  );
}

export default Notes;