import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import API from "../api/api";
import Footer from "../components/Footer";
import AuthorProfile from "../components/AuthorProfile";
import StudentProfileModal from "../components/StudentProfileModal";
import { getStoredStudentData } from "../data/studentData";
import "./Notes.css";

// Branch definitions matching homepage engineering departments
const BRANCH_TABS = [
  {
    code: "CSE",
    name: "Computer Science Engineering",
    icon: "terminal",
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
    icon: "memory",
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
    icon: "settings",
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
    icon: "apartment",
    aliases: [
      "civil",
      "civil engineering",
      "ce",
    ],
  },
  {
    code: "AIML",
    name: "AI & Machine Learning",
    icon: "smart_toy",
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
    icon: "bolt",
    aliases: [
      "electrical and electronics",
      "electrical & electronics",
      "electrical engineering",
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
    icon: "description",
    eyebrow: "JNTU Circle · Study Library",
    title: "Notes & Study Materials",
    subtitle: "Find verified lecture notes, unit-wise module guides, and study materials for your engineering branch.",
    searchPlaceholder: (branch) => `Search ${branch} notes, subjects, codes...`,
    emptyTitle: "No Notes Available",
    emptyDesc: "No study materials match your search or filter criteria for this department.",
  },
  papers: {
    key: "papers",
    label: "Question Papers",
    icon: "assignment",
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
    icon: "menu_book",
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
    icon: "science",
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [, setStudentData] = useState(getStoredStudentData());

  const [blinkingItemId, setBlinkingItemId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const searchInputRef = useRef(null);

  const handleViewWithBlink = (item) => {
    setBlinkingItemId(item.id);
    setTimeout(() => {
      handleViewItem(item);
      setBlinkingItemId(null);
    }, 650);
  };

  // Profile synchronization listener
  useEffect(() => {
    const handleProfileSync = () => {
      setStudentData(getStoredStudentData());
    };
    window.addEventListener("studentProfileUpdated", handleProfileSync);
    return () => window.removeEventListener("studentProfileUpdated", handleProfileSync);
  }, []);

  // Ensure page always opens at top when navigated from 3D branches or route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, searchParams]);

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
    setActiveBranch(code);
    setSearchParams({ branch: code });
  };

  // Handle search submit
  const handleExecuteSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
    <div className="bg-[#08090D] text-[#F5F5FA] min-h-screen selection:bg-[#8B5CF6]/30 selection:text-white relative flex flex-col justify-between">
      
      {/* =========================================================
          FULL-PAGE ACADEMIC RESOURCE HEADER (NEW PAGE HEADER)
          Full-width, edge-to-edge header across the top of the entire page
          ========================================================= */}
      <header className="w-full bg-[#12131B]/95 backdrop-blur-md border-b border-[#292733] relative overflow-hidden shadow-2xl z-30">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6 flex flex-col gap-5 sm:gap-6">
          {/* Top Navigation Row: Rounded Pill Tabs + Right Eyebrow & Portal Action */}
          <div className="flex flex-wrap items-center justify-between gap-3" role="tablist" aria-label="Academic Resource Selector">
            {/* Left Switcher Pill Group in Dark Container */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-[#08090D]/80 border border-[#292733]/80 overflow-x-auto max-w-full custom-scrollbar">
              {/* Home Tab */}
              <button
                type="button"
                role="tab"
                onClick={() => navigate("/")}
                className="px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-200 flex items-center gap-2 text-[#94A3B8] hover:text-[#C4B5FD] hover:bg-[#161724] border border-transparent shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">home</span>
                <span>HOME</span>
              </button>

              {/* Notes Pill */}
              <button
                type="button"
                role="tab"
                aria-selected={activeResource === "notes"}
                onClick={() => handleSwitchResource("notes")}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeResource === "notes"
                    ? "text-[#C4B5FD] bg-[#161724] border border-[#8B5CF6]/50 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161724] border border-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">description</span>
                <span>Notes</span>
              </button>

              {/* Question Papers */}
              <button
                type="button"
                role="tab"
                aria-selected={activeResource === "papers"}
                onClick={() => handleSwitchResource("papers")}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeResource === "papers"
                    ? "text-[#C4B5FD] bg-[#161724] border border-[#8B5CF6]/50 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161724] border border-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">assignment</span>
                <span>Question Papers</span>
              </button>

              {/* Syllabus */}
              <button
                type="button"
                role="tab"
                aria-selected={activeResource === "syllabus"}
                onClick={() => handleSwitchResource("syllabus")}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeResource === "syllabus"
                    ? "text-[#C4B5FD] bg-[#161724] border border-[#8B5CF6]/50 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161724] border border-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">menu_book</span>
                <span>Syllabus</span>
              </button>

              {/* Lab Programs */}
              <button
                type="button"
                role="tab"
                aria-selected={activeResource === "labs"}
                onClick={() => handleSwitchResource("labs")}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeResource === "labs"
                    ? "text-[#C4B5FD] bg-[#161724] border border-[#8B5CF6]/50 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161724] border border-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">science</span>
                <span>Lab Programs</span>
              </button>
            </div>

            {/* Right Eyebrow Badge Pill & Student Portal */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center px-4 py-2 rounded-full bg-[#08090D] border border-[#292733] text-[11px] font-semibold text-[#94A3B8] tracking-wider uppercase">
                {currentConfig.eyebrow}
              </div>

              {/* Student Portal button to open Student Profile Modal */}
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#d0bcff] text-[#23005c] text-xs font-bold hover:bg-[#c4b5fd] transition-all shadow-[0_0_12px_rgba(208,188,255,0.25)] flex items-center gap-1.5 cursor-pointer"
                title="Student Portal Profile"
                aria-label="Student Portal"
              >
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                <span className="hidden md:inline">Student Portal</span>
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F5F5FA] tracking-tight mb-2.5">
              {currentConfig.title}
            </h1>
            <p className="text-sm md:text-base text-[#94A3B8] max-w-3xl leading-relaxed">
              {currentConfig.subtitle}
            </p>
          </div>

          {/* Search and Filters Row matching Stitch */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Clean Dark Capsule Search Bar */}
            <div className="md:col-span-6 relative flex items-center bg-[#08090D] border border-[#292733] hover:border-[#8B5CF6]/50 focus-within:border-[#8B5CF6]/70 rounded-full p-1.5 pl-2 gap-2 transition-all shadow-sm">
              {/* Normal Clean Search Icon Button */}
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#161724] transition-colors shrink-0 cursor-pointer"
                aria-label="Search"
                title="Search study materials"
                onClick={handleExecuteSearch}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
                </svg>
              </button>

              <input
                ref={searchInputRef}
                type="text"
                placeholder={currentConfig.searchPlaceholder(activeBranch)}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleExecuteSearch();
                  }
                }}
                className="w-full bg-transparent text-sm text-[#F5F5FA] placeholder-[#64748B] outline-none pr-2 py-1"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                  className="text-[#94A3B8] hover:text-white text-xs px-2 py-0.5 rounded-full bg-[#161724] hover:bg-[#202134] border border-[#292733] mr-1 cursor-pointer transition-colors shrink-0"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Branch Selector Dropdown */}
            <div className="md:col-span-3 relative flex items-center">
              <select
                value={activeBranch}
                onChange={(e) => handleSelectBranch(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-[#08090D] border border-[#292733] focus:border-[#8B5CF6] rounded-xl text-sm text-[#F5F5FA] outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="CSE">CSE — Computer Science Eng...</option>
                <option value="ECE">ECE — Electronics & Comm.</option>
                <option value="ME">ME — Mechanical Engineering</option>
                <option value="CE">CE — Civil Engineering</option>
                <option value="AIML">AIML — AI & Machine Learning</option>
                <option value="EEE">EEE — Electrical & Electronics</option>
              </select>
              <div className="absolute right-3.5 inset-y-0 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[#94A3B8] text-[18px] leading-none">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            {/* Semester Selector Dropdown */}
            <div className="md:col-span-3 relative flex items-center">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-[#08090D] border border-[#292733] focus:border-[#8B5CF6] rounded-xl text-sm text-[#F5F5FA] outline-none transition-all cursor-pointer appearance-none"
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
              <div className="absolute right-3.5 inset-y-0 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[#94A3B8] text-[18px] leading-none">
                  keyboard_arrow_down
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas (Full-width responsive workspace) */}
      <main className="w-full py-8 md:py-10 pb-20 bg-[#08090D] relative flex-1">
        {/* Architectural Grid & Ambient Violet Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
          <div className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[#8B5CF6]/10 rounded-full blur-[140px]" />
          <div className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] bg-[#27213B]/20 rounded-full blur-[120px]" />
          <svg
            className="w-full h-full stroke-[#292733]/40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern height="48" id="jntu-telemetry-grid-notes" patternUnits="userSpaceOnUse" width="48">
                <path d="M 48 0 L 0 0 0 48" fill="none" strokeWidth="1" />
                <circle cx="48" cy="48" fill="#8B5CF6" fillOpacity="0.5" r="0.8" />
              </pattern>
            </defs>
            <rect fill="url(#jntu-telemetry-grid-notes)" height="100%" width="100%" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col gap-8">

          {/* =========================================================
              MAIN CONTENT VIEW (DEPARTMENTS + STITCH STUDY CARDS + TEAM)
              ========================================================= */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Left Department Sidebar matching Stitch design */}
            <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
              <div className="bg-[#12131B] border border-[#292733] rounded-3xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 px-1 py-1 text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  <span>DEPARTMENTS</span>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
                  {BRANCH_TABS.map((tab) => {
                    const isActive = activeBranch === tab.code;
                    return (
                      <button
                        key={tab.code}
                        type="button"
                        onClick={() => handleSelectBranch(tab.code)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 lg:w-full text-left cursor-pointer ${
                          isActive
                            ? "bg-[#161724] border-2 border-[#8B5CF6] text-white shadow-[0_0_16px_rgba(139,92,246,0.3)]"
                            : "bg-[#0d0e15] border border-[#292733]/80 text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/50"
                        }`}
                      >
                        <span className={`px-2 py-1 rounded-md font-bold text-[11px] shrink-0 font-mono ${
                          isActive ? "bg-[#8B5CF6] text-white" : "bg-[#181926] text-[#A78BFA]"
                        }`}>
                          {tab.code}
                        </span>
                        <span className="truncate font-medium text-[13px]">{tab.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Summary Meta at bottom of Departments */}
                <div className="pt-3 mt-1 border-t border-[#292733] flex flex-col gap-2 text-xs text-[#94A3B8]">
                  <div className="flex items-center justify-between">
                    <span>Selected Branch:</span>
                    <span className="text-[#8B5CF6] font-bold">{activeBranch}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Available Resources:</span>
                    <span className="text-white font-bold">{displayItems.length}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Resource Items List (Exact Stitch Card Layout) */}
            <div className="flex-1 w-full flex flex-col gap-3 min-w-0">
              {loading ? (
                <>
                  <div className="bg-[#12131B] border border-[#292733] rounded-3xl h-24 animate-pulse" />
                  <div className="bg-[#12131B] border border-[#292733] rounded-3xl h-24 animate-pulse" />
                  <div className="bg-[#12131B] border border-[#292733] rounded-3xl h-24 animate-pulse" />
                </>
              ) : displayItems.length === 0 ? (
                <div className="bg-[#12131B] border border-[#292733] rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#181928] border border-[#292733] text-[#8B5CF6] flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[32px]">folder_off</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#F5F5FA] mb-2">{currentConfig.emptyTitle}</h3>
                  <p className="text-sm text-[#94A3B8] max-w-md mb-6">{currentConfig.emptyDesc}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSemester("ALL");
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                displayItems.map((item) => (
                  <article
                    key={item.id}
                    className="bg-[#12131B] border border-[#292733] hover:border-[#8B5CF6]/60 rounded-3xl p-5 sm:p-6 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Left Icon & Information */}
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Document Icon Box in Purple Border */}
                      <div className="w-12 h-12 rounded-2xl bg-[#161724] border border-[#8B5CF6]/40 flex items-center justify-center shrink-0 text-[#8B5CF6]">
                        <span className="material-symbols-outlined text-[22px]">
                          description
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-[#F5F5FA] group-hover:text-white transition-colors truncate">
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
                          <span className="font-semibold text-white">
                            {item.branchCode}
                          </span>
                          {item.semester && (
                            <span>
                              • {item.semester}
                            </span>
                          )}
                          {item.extraBadge && (
                            <span>
                              • {item.extraBadge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right View Pill Button matching Stitch */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {item.pdfUrl && (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(item, e)}
                          disabled={downloadingId === item.id}
                          className="px-4 py-2 rounded-full text-xs font-semibold border border-[#292733] bg-[#08090D] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6] flex items-center gap-1.5 transition-all"
                          title={`Download ${item.title} PDF`}
                        >
                          {downloadingId === item.id ? (
                            <span className="inline-block w-3.5 h-3.5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[15px]">download</span>
                          )}
                          <span>Download</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleViewWithBlink(item)}
                        className="group/eye px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#161724] hover:bg-[#8B5CF6] border border-[#292733] hover:border-[#8B5CF6] text-white flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] active:scale-[0.98]"
                        title={`View ${item.title}`}
                      >
                        <span className={`material-symbols-outlined text-[17px] ${blinkingItemId === item.id ? "eye-blink-anim" : ""}`}>
                          visibility
                        </span>
                        <span>View</span>
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Right Column: Developer Team Profile & Upload Materials (Preserved at original spot as requested) */}
            <aside className="w-full xl:w-80 lg:w-72 shrink-0">
              <AuthorProfile />
            </aside>

          </div>

        </div>
      </main>

      {/* Universal Footer */}
      <Footer />

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