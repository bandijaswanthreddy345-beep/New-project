import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import logo from "../assets/jntu-circle-logo.png.png";
import profile from "../assets/jaswanth.png.png";
import StudentProfileModal, { getStoredStudentData } from "../components/StudentProfileModal";
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

  // Handle branch tab switch
  const handleSelectBranch = (code) => {
    setActiveBranch(code);
    setSearchParams({ branch: code });
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
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notifications</span>
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
              <span className="profile-name">{studentData.shortName || "Jaswanth"}</span>
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
            <div className="notes-eyebrow">
              <span className="notes-eyebrow-dot" />
              ACADEMIC REPOSITORY
            </div>
            <h1 className="notes-page-title">Notes & Study Materials</h1>
            <p className="notes-page-subtitle">Access high-quality lecture notes, module guides, and syllabus resources across all engineering departments.</p>
          </header>

          {/* Search & Filters Controls */}
          <div className="notes-filters-row">
            {/* Search Box */}
            <div className="notes-search-box">
              <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search notes, subjects, codes..."
                className="notes-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                return (
                  <button
                    key={tab.code}
                    type="button"
                    className={`branch-nav-pill ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectBranch(tab.code)}
                  >
                    {/* Branch Specific Icons Matching Academic Theme */}
                    <span className="branch-icon-box">
                      {tab.code === "CSE" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      )}
                      {tab.code === "ECE" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      )}
                      {tab.code === "EEE" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      )}
                      {tab.code === "ME" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      )}
                      {tab.code === "CE" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2">
                          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                          <line x1="9" y1="22" x2="9" y2="2" />
                          <path d="M5 12h4" />
                          <path d="M5 7h4" />
                          <path d="M5 17h4" />
                          <path d="M15 12h4" />
                          <path d="M15 7h4" />
                          <path d="M15 17h4" />
                        </svg>
                      )}
                      {tab.code === "AIML" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2">
                          <rect x="3" y="11" width="18" height="10" rx="2" />
                          <circle cx="12" cy="5" r="2" />
                          <path d="M12 7v4" />
                          <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
                          <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
                        </svg>
                      )}
                    </span>
                    <span>{tab.code}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Subject Folder Cards List */}
            <div className="notes-cards-container">
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

                    {/* View Action Button */}
                    <button
                      type="button"
                      className="folder-view-btn"
                      onClick={() => handleViewNote(item)}
                    >
                      View
                    </button>
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