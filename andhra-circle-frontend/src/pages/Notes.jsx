import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MetalFx, useMetalBend } from "metal-fx";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import API from "../api/api";
import profile from "../assets/jaswanth.png.png";
import StudentProfileModal from "../components/StudentProfileModal";
import { getStoredStudentData } from "../data/studentData";
import AuthorProfile from "../components/AuthorProfile";
import "./Notes.css";

// Branch definitions matching homepage engineering departments
const BRANCH_TABS = [
  {
    code: "CSE",
    name: "Computer Science Engineering",
    aliases: [
      "computer science and engineering",
      "computer science & engineering",
      "computer science",
      "cse",
      "information science",
      "information science engineering",
      "ise",
      "information technology",
      "it",
      "cs",
    ],
  },
  {
    code: "ECE",
    name: "Electronics & Communication",
    aliases: [
      "electronics and communication",
      "electronics and communication engineering",
      "electronics & communication engineering",
      "electronics",
      "ece",
    ],
  },
  {
    code: "ME",
    name: "Mechanical Engineering",
    aliases: [
      "mechanical",
      "mechanical engg",
      "mechanical engineering",
      "mech",
      "me",
    ],
  },
  {
    code: "CE",
    name: "Civil Engineering",
    aliases: [
      "civil",
      "civil engineering",
      "ce",
    ],
  },
  {
    code: "AIML",
    name: "AI & Machine Learning",
    aliases: [
      "artificial intelligence and machine learning",
      "artificial intelligence & machine learning",
      "artificial intelligence",
      "machine learning",
      "ai and machine learning",
      "ai & machine learning",
      "ai & data science",
      "aiml",
      "ai",
      "ml",
    ],
  },
  {
    code: "EEE",
    name: "Electrical & Electronics",
    aliases: [
      "electrical and electronics",
      "electrical and electronics engineering",
      "electrical & electronics engineering",
      "electrical",
      "eee",
      "ee",
    ],
  },
];

const normalizeBranch = (branch) =>
  String(branch || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const noteMatchesBranch = (noteBranch, tab) => {
  const normalizedBranch = normalizeBranch(noteBranch);
  return [tab.code, tab.name, ...tab.aliases].some(
    (branch) => normalizeBranch(branch) === normalizedBranch
  );
};

// Resource Configuration for Unified Study Library Dashboard
const RESOURCE_CONFIG = {
  notes: {
    key: "notes",
    label: "Notes",
    eyebrow: "JNTU Circle · Study Library",
    title: "Notes & Study Materials",
    subtitle: "Find lecture notes, module guides, and study resources for your engineering branch.",
    searchPlaceholder: (branch) => `Search ${branch} notes, subjects, codes...`,
    emptyTitle: "No Notes Available",
    emptyDesc: "No study materials match your search or filter criteria for this department.",
  },
  papers: {
    key: "papers",
    label: "Question Papers",
    eyebrow: "JNTU Circle · University Papers",
    title: "Question Papers",
    subtitle: "Access previous semester exam question papers, mid tests, and model papers.",
    searchPlaceholder: (branch) => `Search ${branch} question papers, exams, years...`,
    emptyTitle: "No Question Papers Available",
    emptyDesc: "No examination papers match your search or filter criteria for this department.",
  },
  syllabus: {
    key: "syllabus",
    label: "Syllabus",
    eyebrow: "JNTU Circle · Academic Curriculum",
    title: "Syllabus",
    subtitle: "Official university course curriculum, subject units, and academic regulations.",
    searchPlaceholder: (branch) => `Search ${branch} syllabus, subjects, regulations...`,
    emptyTitle: "No Syllabus Available",
    emptyDesc: "No curriculum records match your search or filter criteria for this department.",
  },
  labs: {
    key: "labs",
    label: "Lab Programs",
    eyebrow: "JNTU Circle · Laboratory Manuals",
    title: "Lab Programs",
    subtitle: "Practical experiment codes, laboratory records, and viva preparation manuals.",
    searchPlaceholder: (branch) => `Search ${branch} lab programs, experiments, codes...`,
    emptyTitle: "No Lab Programs Available",
    emptyDesc: "No laboratory materials match your search or filter criteria for this department.",
  },
};

// Format title helper
const formatTitle = (raw) => {
  if (!raw) return "";
  return String(raw)
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
};

function Notes({ initialType }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect active resource type based on prop, route path, or query param
  const getResourceFromPath = useCallback(() => {
    if (initialType && RESOURCE_CONFIG[initialType]) return initialType;
    if (location.pathname.startsWith("/papers")) return "papers";
    if (location.pathname.startsWith("/syllabus")) return "syllabus";
    if (location.pathname.startsWith("/lab-programs")) return "labs";
    const typeParam = searchParams.get("type");
    if (typeParam && RESOURCE_CONFIG[typeParam]) return typeParam;
    return "notes";
  }, [initialType, location.pathname, searchParams]);

  const [activeResource, setActiveResource] = useState(getResourceFromPath);

  // Sync resource type if route changes
  useEffect(() => {
    const detected = getResourceFromPath();
    setActiveResource(detected);
  }, [getResourceFromPath]);

  // Initial branch from URL param or default to "CSE"
  const urlBranch = (searchParams.get("branch") || searchParams.get("search") || "CSE").toUpperCase();
  const matchedTab = BRANCH_TABS.find((tab) =>
    noteMatchesBranch(urlBranch, tab)
  );

  const [activeBranch, setActiveBranch] = useState(matchedTab ? matchedTab.code : "CSE");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Academic Resource Data Stores
  const [notesData, setNotesData] = useState([]);
  const [papersData, setPapersData] = useState([]);
  const [syllabusData, setSyllabusData] = useState([]);
  const [labsData, setLabsData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [studentData, setStudentData] = useState(getStoredStudentData());
  const [pulsingBranch, setPulsingBranch] = useState(null);

  const searchInputRef = useRef(null);
  const searchMetalRef = useRef(null);

  // Hook for cursor-driven liquid metal bend interaction
  useMetalBend(searchMetalRef);

  // Profile synchronization listener
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
      const found = BRANCH_TABS.find((tab) => noteMatchesBranch(b, tab));
      if (found) {
        setActiveBranch(found.code);
      }
    }
  }, [searchParams]);

  // Fetch all 4 academic resources in parallel for instant instantaneous switching
  useEffect(() => {
    let isMounted = true;

    const fetchAllResources = async () => {
      try {
        setLoading(true);

        const [notesRes, papersRes, syllabusRes, labsRes] = await Promise.allSettled([
          API.get("/notes"),
          API.get("/papers"),
          API.get("/syllabus"),
          API.get("/lab-programs"),
        ]);

        if (!isMounted) return;

        // Notes extract
        if (notesRes.status === "fulfilled") {
          const res = notesRes.value;
          const data = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.notes)
            ? res.data.notes
            : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          setNotesData(data);
        }

        // Papers extract
        if (papersRes.status === "fulfilled") {
          const res = papersRes.value;
          const data = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.papers)
            ? res.data.papers
            : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          setPapersData(data);
        }

        // Syllabus extract
        if (syllabusRes.status === "fulfilled") {
          const res = syllabusRes.value;
          const data = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.syllabus)
            ? res.data.syllabus
            : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          setSyllabusData(data);
        }

        // Lab programs extract
        if (labsRes.status === "fulfilled") {
          const res = labsRes.value;
          const data = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.programs)
            ? res.data.programs
            : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          setLabsData(data);
        }
      } catch (err) {
        console.error("Error fetching academic resources:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllResources();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper: Backend upload URL resolution
  const getBackendBaseUrl = useCallback(() => {
    const apiBaseUrl = API.defaults?.baseURL || "http://localhost:5000/api";
    return apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }, []);

  const getPdfUrl = useCallback((pdfUrl) => {
    if (!pdfUrl) return "";
    let value = String(pdfUrl).trim();
    if (value.startsWith("http://") || value.startsWith("https://")) {
      try {
        const url = new URL(value);
        url.pathname = url.pathname.replace(/^\/api\/uploads\//, "/uploads/");
        return url.toString();
      } catch {
        return value;
      }
    }
    value = value.replace(/^\/?api\/uploads\//, "/uploads/");
    if (!value.startsWith("/")) {
      value = `/${value}`;
    }
    return `${getBackendBaseUrl()}${value}`;
  }, [getBackendBaseUrl]);

  const getPdfFileName = useCallback((pdfUrl) => {
    if (!pdfUrl) return "";
    try {
      const full = getPdfUrl(pdfUrl);
      const pathname = new URL(full).pathname;
      return decodeURIComponent(pathname.split("/").pop() || "");
    } catch {
      const parts = String(pdfUrl).split("/");
      return decodeURIComponent(parts.pop() || "");
    }
  }, [getPdfUrl]);

  // Unified items mapping for current active branch
  const activeTab = useMemo(
    () => BRANCH_TABS.find((t) => t.code === activeBranch),
    [activeBranch]
  );

  // 1. Mapped Notes
  const mappedNotes = useMemo(() => {
    if (!activeTab) return [];
    return notesData
      .filter((n) => noteMatchesBranch(n.branch, activeTab))
      .map((n) => {
        let title = n.subject || n.title;
        if (title.toLowerCase() === "notes" && n.subject) {
          title = n.subject;
        }
        const sem = n.semester ? n.semester.replace(/semester/i, "Sem").trim() : "";
        return {
          id: n._id,
          title: formatTitle(title),
          semester: sem,
          branchCode: activeBranch,
          extraBadge: n.subjectCode || "",
          pdfUrl: n.pdfUrl || "",
          resourceType: "notes",
        };
      });
  }, [notesData, activeTab, activeBranch]);

  // 2. Mapped Question Papers
  const mappedPapers = useMemo(() => {
    if (!activeTab) return [];
    return papersData
      .filter((p) => noteMatchesBranch(p.branch, activeTab))
      .map((p) => {
        const rawTitle = String(p.title || "").trim();
        const subj = String(p.subject || "").trim();
        let displayTitle = "";
        const genericWords = ["question paper", "paper", "semester", "mid", "makeup", "supply"];
        if (subj && genericWords.includes(rawTitle.toLowerCase())) {
          displayTitle = `${formatTitle(subj)} (${formatTitle(rawTitle)})`;
        } else if (subj && !rawTitle) {
          displayTitle = formatTitle(subj);
        } else {
          displayTitle = formatTitle(rawTitle || subj || "Question Paper");
        }

        const sem = p.semester ? p.semester.replace(/semester/i, "Sem").trim() : "";
        const metaItems = [];
        if (p.year) metaItems.push(p.year);
        if (p.examType && !displayTitle.toLowerCase().includes(p.examType.toLowerCase())) {
          metaItems.push(p.examType);
        }

        return {
          id: p._id,
          title: displayTitle,
          semester: sem,
          branchCode: activeBranch,
          extraBadge: metaItems.join(" • "),
          pdfUrl: p.pdfUrl || "",
          resourceType: "papers",
        };
      });
  }, [papersData, activeTab, activeBranch]);

  // 3. Mapped Syllabus
  const mappedSyllabus = useMemo(() => {
    if (!activeTab) return [];
    return syllabusData
      .filter((s) => noteMatchesBranch(s.branch, activeTab))
      .map((s) => {
        const subj = String(s.subject || "").trim();
        let title = String(s.title || "Syllabus").trim();
        if (subj && (title.toLowerCase() === "syllabus" || !title)) {
          title = `${formatTitle(subj)} Syllabus`;
        } else if (!subj && (!title || title.toLowerCase() === "syllabus")) {
          title = "Syllabus";
        } else {
          title = formatTitle(title);
        }

        const sem = s.semester ? s.semester.replace(/semester/i, "Sem").trim() : "";
        const metaItems = [];
        if (s.regulation) metaItems.push(s.regulation);
        if (s.subjectCode) metaItems.push(s.subjectCode);

        return {
          id: s._id,
          title: title,
          semester: sem,
          branchCode: activeBranch,
          extraBadge: metaItems.join(" • "),
          pdfUrl: s.pdfUrl || "",
          resourceType: "syllabus",
        };
      });
  }, [syllabusData, activeTab, activeBranch]);

  // 4. Mapped Lab Programs
  const mappedLabs = useMemo(() => {
    if (!activeTab) return [];
    return labsData
      .filter((l) => noteMatchesBranch(l.branch, activeTab))
      .map((l) => {
        const subj = String(l.subject || "").trim();
        let title = String(l.title || "Lab Program").trim();
        if (subj && (title.toLowerCase() === "lab program" || title.toLowerCase() === "lab" || title.toLowerCase() === subj.toLowerCase())) {
          title = `${formatTitle(subj)} Lab`;
        } else {
          title = formatTitle(title || subj || "Lab Program");
        }

        const sem = l.semester ? l.semester.replace(/semester/i, "Sem").trim() : "";
        const metaItems = [];
        if (l.subjectCode) metaItems.push(l.subjectCode);

        return {
          id: l._id,
          title: title,
          semester: sem,
          branchCode: activeBranch,
          extraBadge: metaItems.join(" • "),
          pdfUrl: l.pdfUrl || "",
          resourceType: "labs",
        };
      });
  }, [labsData, activeTab, activeBranch]);

  // Filter items for current active resource by search and semester
  const displayItems = useMemo(() => {
    let list = [];
    if (activeResource === "notes") list = mappedNotes;
    else if (activeResource === "papers") list = mappedPapers;
    else if (activeResource === "syllabus") list = mappedSyllabus;
    else if (activeResource === "labs") list = mappedLabs;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.semester.toLowerCase().includes(q) ||
          (item.extraBadge && item.extraBadge.toLowerCase().includes(q))
      );
    }

    // Filter by semester dropdown
    if (selectedSemester !== "ALL") {
      const s = selectedSemester.toLowerCase();
      list = list.filter((item) => item.semester.toLowerCase().includes(s));
    }

    return list;
  }, [activeResource, mappedNotes, mappedPapers, mappedSyllabus, mappedLabs, searchQuery, selectedSemester]);

  // Switch between academic resource types (Notes, Question Papers, Syllabus, Lab Programs)
  const handleSwitchResource = (type) => {
    setActiveResource(type);
    const pathMap = {
      notes: "/notes",
      papers: "/papers",
      syllabus: "/syllabus",
      labs: "/lab-programs",
    };
    const targetPath = pathMap[type] || "/notes";
    const branchParam = activeBranch && activeBranch !== "CSE" ? `?branch=${activeBranch}` : "";
    if (location.pathname !== targetPath) {
      navigate(`${targetPath}${branchParam}`, { replace: false });
    }
  };

  // Handle branch tab switch
  const handleSelectBranch = (code) => {
    setPulsingBranch(code);
    setTimeout(() => setPulsingBranch(null), 500);
    setActiveBranch(code);
    setSearchParams({ branch: code });
  };

  // Handle search submit
  const handleExecuteSearch = () => {
    setPulsingBranch(activeBranch);
    setTimeout(() => setPulsingBranch(null), 500);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle View Action
  const handleViewItem = async (item) => {
    if (item.resourceType === "notes") {
      if (item.id) {
        navigate(`/notes/${item.id}`);
        return;
      }
    }

    // Record view counts on backend
    if (item.resourceType === "papers") {
      API.put(`/papers/${item.id}/view`).catch(() => {});
    } else if (item.resourceType === "syllabus") {
      API.put(`/syllabus/${item.id}/view`).catch(() => {});
    } else if (item.resourceType === "labs") {
      API.put(`/lab-programs/${item.id}/view`).catch(() => {});
    }

    const fileName = getPdfFileName(item.pdfUrl);
    if (fileName) {
      navigate(`/pdf/${encodeURIComponent(fileName)}`);
    } else if (item.pdfUrl) {
      window.open(getPdfUrl(item.pdfUrl), "_blank");
    } else if (item.id) {
      navigate(`/notes/${item.id}`);
    } else {
      alert("No document file is attached to this record.");
    }
  };

  // Handle Download Action
  const handleDownloadPdf = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!item.pdfUrl) return;

    const fullUrl = getPdfUrl(item.pdfUrl);
    const fileName = getPdfFileName(item.pdfUrl) || `${item.title}.pdf`;

    try {
      setDownloadingId(item.id);

      // Increment download counter
      if (item.resourceType === "papers") {
        API.put(`/papers/${item.id}/download`).catch(() => {});
      } else if (item.resourceType === "syllabus") {
        API.put(`/syllabus/${item.id}/download`).catch(() => {});
      } else if (item.resourceType === "labs") {
        API.put(`/lab-programs/${item.id}/download`).catch(() => {});
      }

      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Direct download failed, opening in new tab:", err);
      window.open(fullUrl, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const currentConfig = RESOURCE_CONFIG[activeResource] || RESOURCE_CONFIG.notes;

  return (
    <div className="notes-dashboard-container">
      <div className="notes-dashboard-card">

        {/* =========================================================
            LEFT SIDEBAR (MIDNIGHT EMERALD #002420)
            ========================================================= */}
        <aside className="notes-sidebar">
          {/* Brand Header */}
          <div className="sidebar-brand" onClick={() => navigate("/")} title="Return to Homepage">
            <img src="/jntu-circle-logo.png" alt="JNTU Circle" className="sidebar-logo-img" />
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
              className={`sidebar-link ${activeResource === "notes" ? "active" : ""}`}
              onClick={() => handleSwitchResource("notes")}
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
              className={`sidebar-link ${activeResource === "papers" ? "active" : ""}`}
              onClick={() => handleSwitchResource("papers")}
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
              className={`sidebar-link ${activeResource === "syllabus" ? "active" : ""}`}
              onClick={() => handleSwitchResource("syllabus")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Syllabus</span>
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeResource === "labs" ? "active" : ""}`}
              onClick={() => handleSwitchResource("labs")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M10 2v7.31L4.17 19.5A2 2 0 0 0 5.89 22h12.22a2 2 0 0 0 1.72-2.5L14 9.31V2" />
                <path d="M8.5 2h7" />
                <path d="M7 16h10" />
              </svg>
              <span>Lab Programs</span>
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

          {/* Bottom Profile Pill */}
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
          <section className="notes-opening-panel" aria-labelledby="notes-page-title">
            <header className="notes-page-header">
              {/* Quick Resource Switcher Pills */}
              <div className="notes-resource-switcher" role="tablist" aria-label="Academic Resource Selector">
                {Object.values(RESOURCE_CONFIG).map((res) => {
                  const isActive = activeResource === res.key;
                  return (
                    <button
                      key={res.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`resource-switch-tab ${isActive ? "active" : ""}`}
                      onClick={() => handleSwitchResource(res.key)}
                    >
                      {res.label}
                    </button>
                  );
                })}
              </div>

              <span className="notes-eyebrow">
                <span className="notes-eyebrow-dot" aria-hidden="true" />
                {currentConfig.eyebrow}
              </span>
              <h1 className="notes-page-title" id="notes-page-title">{currentConfig.title}</h1>
              <p className="notes-page-subtitle">{currentConfig.subtitle}</p>
            </header>

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
                      title={`Search ${currentConfig.label}`}
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
                  placeholder={currentConfig.searchPlaceholder(activeBranch)}
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
                <option value="ME">ME — Mechanical Eng.</option>
                <option value="CE">CE — Civil Eng.</option>
                <option value="AIML">AIML — AI & Data Science</option>
                <option value="EEE">EEE — Electrical & Electronics</option>
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
          </section>

          {/* Two-Column Body: Branch Tabs + Subject Folder Cards */}
          <div className="notes-split-view">
            {/* Left Branch Tabs Column */}
            <div className="notes-branch-sidebar">
              {BRANCH_TABS.map((tab) => {
                const isActive = activeBranch === tab.code;
                const isPulsing = pulsingBranch === tab.code;
                return (
                  <button
                    key={tab.code}
                    type="button"
                    className={`branch-nav-pill ${isActive ? "active" : ""} ${isPulsing ? "is-pulsing" : ""}`}
                    onClick={() => handleSelectBranch(tab.code)}
                    title={`View ${tab.name}`}
                    aria-label={`View ${tab.name}`}
                  >
                    {/* Reactive Branch Specific Icon */}
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

            {/* Right Column: Unified Subject Folder Cards List */}
            <div 
              key={`${activeResource}-${activeBranch}-${selectedSemester}-${searchQuery}`}
              className="notes-cards-container"
            >
              {loading ? (
                <>
                  <div className="notes-skeleton-card" />
                  <div className="notes-skeleton-card" />
                  <div className="notes-skeleton-card" />
                </>
              ) : displayItems.length === 0 ? (
                <div className="notes-empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <h3>{currentConfig.emptyTitle}</h3>
                  <p>{currentConfig.emptyDesc}</p>
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
                displayItems.map((item) => (
                  <article key={item.id} className="notes-folder-card">
                    {/* Folder Icon & Resource Details */}
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
                          {item.semester && (
                            <>
                              <span>•</span>
                              <span>{item.semester}</span>
                            </>
                          )}
                          {item.extraBadge && (
                            <>
                              <span>•</span>
                              <span>{item.extraBadge}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons: Download & View */}
                    <div className="folder-card-actions">
                      {item.pdfUrl && (
                        <button
                          type="button"
                          className={`folder-download-btn ${downloadingId === item.id ? "downloading" : ""}`}
                          onClick={(e) => handleDownloadPdf(item, e)}
                          disabled={downloadingId === item.id}
                          title={`Download ${item.title} PDF`}
                        >
                          {downloadingId === item.id ? (
                            <span className="download-spinner" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          )}
                          <span>Download</span>
                        </button>
                      )}

                      <MetalFx
                        preset="gold"
                        variant="button"
                        theme="dark"
                        strength={1}
                        innerShadow
                        normalizeHostStyles={false}
                        className="folder-view-metal-wrap"
                      >
                        <button
                          type="button"
                          className="folder-view-btn"
                          onClick={() => handleViewItem(item)}
                          title={`View ${item.title}`}
                        >
                          View
                        </button>
                      </MetalFx>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </main>

        {/* =========================================================
            RIGHT COLUMN: DEVELOPER PROFILES & JNTU UPLOAD
            (Matches Note Details design & placement)
            ========================================================= */}
        <aside className="notes-right-column">
          <AuthorProfile />
        </aside>

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