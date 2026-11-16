import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MetalFx } from "metal-fx";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import API, { BACKEND_URL } from "../api/api";
import StudentProfileModal from "../components/StudentProfileModal";
import { getStoredStudentData, getStudentAvatar, getStudentAvatarUrl } from "../data/studentData";
import AuthorProfile from "../components/AuthorProfile";
import { normalizeSemester, normalizeScheme } from "../utils/semester";
import { formatSemDisplay } from "../utils/validators";
import {
  getCachedResource,
  hasCachedResource,
  fetchResourceWithCache,
  setCachedResource,
  updateCachedResourceItem,
} from "../utils/resourceCache";
import trigger100Hearts from "../utils/heartBurst";
import "./Notes.css";

// Branch definitions matching requested engineering departments: CSE, AIML, ME, CE, ECE, EEE
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
    code: "AIML",
    name: "AI & Machine Learning",
    aliases: [
      "cse_aiml",
      "cse aiml",
      "cseaiml",
      "aiml",
      "ai & machine learning",
      "ai and machine learning",
      "artificial intelligence and machine learning",
      "artificial intelligence & machine learning",
      "artificial intelligence",
      "machine learning",
      "ai & data science",
      "ai",
      "ml",
      "cse (ai & ml)",
      "cse (aiml)",
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
  if (!tab || tab.code === "ALL") return true;
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(16);

  // Debounce search query (~250ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setVisibleCount(16);
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Academic Resource Data Stores (Instant 0ms retrieval from cache)
  const [notesData, setNotesData] = useState(() => getCachedResource("notes") || []);
  const [papersData, setPapersData] = useState(() => getCachedResource("papers") || []);
  const [syllabusData, setSyllabusData] = useState(() => getCachedResource("syllabus") || []);
  const [labsData, setLabsData] = useState(() => getCachedResource("labs") || []);

  const [loading, setLoading] = useState(() => {
    return (
      !hasCachedResource("notes") &&
      !hasCachedResource("papers") &&
      !hasCachedResource("syllabus") &&
      !hasCachedResource("labs")
    );
  });
  const [downloadingId, setDownloadingId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [studentData, setStudentData] = useState(getStoredStudentData());
  const [authUser, setAuthUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [pulsingBranch, setPulsingBranch] = useState(null);

  // Liked items tracked per client browser across shared keys
  const [likedItemIds, setLikedItemIds] = useState(() => {
    try {
      const set = new Set();
      [
        "andhra_liked_notes",
        "andhra_liked_papers",
        "andhra_liked_syllabus",
        "andhra_liked_labs",
        "andhra_liked_resources",
      ].forEach((k) => {
        const stored = localStorage.getItem(k);
        if (stored) {
          try {
            const arr = JSON.parse(stored);
            if (Array.isArray(arr)) arr.forEach((id) => set.add(id));
          } catch {}
        }
      });
      return set;
    } catch {
      return new Set();
    }
  });

  const studentAvatar = getStudentAvatarUrl(studentData?.profilePhoto);

  const searchInputRef = useRef(null);
  const loadMoreSentinelRef = useRef(null);

  // Profile and auth synchronization listener
  useEffect(() => {
    const handleProfileSync = () => {
      setStudentData(getStoredStudentData());
    };
    const handleAuthSync = () => {
      try {
        const raw = localStorage.getItem("user");
        setAuthUser(raw ? JSON.parse(raw) : null);
      } catch {
        setAuthUser(null);
      }
    };
    window.addEventListener("studentProfileUpdated", handleProfileSync);
    window.addEventListener("storage", handleProfileSync);
    window.addEventListener("storage", handleAuthSync);
    window.addEventListener("authChanged", handleAuthSync);
    return () => {
      window.removeEventListener("studentProfileUpdated", handleProfileSync);
      window.removeEventListener("storage", handleProfileSync);
      window.removeEventListener("storage", handleAuthSync);
      window.removeEventListener("authChanged", handleAuthSync);
    };
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

  // Fetch all 4 academic resources with deduplication & SWR caching
  useEffect(() => {
    let isMounted = true;

    const handleResourcesUpdated = (e) => {
      if (!isMounted || !e?.detail) return;
      const { notes, papers, syllabus, labPrograms } = e.detail;
      if (Array.isArray(notes) && notes.length > 0) setNotesData(notes);
      if (Array.isArray(papers) && papers.length > 0) setPapersData(papers);
      if (Array.isArray(syllabus) && syllabus.length > 0) setSyllabusData(syllabus);
      if (Array.isArray(labPrograms) && labPrograms.length > 0) setLabsData(labPrograms);
      setLoading(false);
    };

    window.addEventListener("resourcesUpdated", handleResourcesUpdated);

    const fetchAllResources = async () => {
      try {
        if (
          !hasCachedResource("notes") &&
          !hasCachedResource("papers") &&
          !hasCachedResource("syllabus") &&
          !hasCachedResource("labs")
        ) {
          setLoading(true);
        }

        const [notesRes, papersRes, syllabusRes, labsRes] = await Promise.allSettled([
          fetchResourceWithCache("notes", "/notes"),
          fetchResourceWithCache("papers", "/papers"),
          fetchResourceWithCache("syllabus", "/syllabus"),
          fetchResourceWithCache("labs", "/lab-programs"),
        ]);

        if (!isMounted) return;

        if (notesRes.status === "fulfilled" && Array.isArray(notesRes.value)) {
          setNotesData(notesRes.value);
        }
        if (papersRes.status === "fulfilled" && Array.isArray(papersRes.value)) {
          setPapersData(papersRes.value);
        }
        if (syllabusRes.status === "fulfilled" && Array.isArray(syllabusRes.value)) {
          setSyllabusData(syllabusRes.value);
        }
        if (labsRes.status === "fulfilled" && Array.isArray(labsRes.value)) {
          setLabsData(labsRes.value);
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
      window.removeEventListener("resourcesUpdated", handleResourcesUpdated);
    };
  }, []);

  // Helper: Backend upload URL resolution
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
    return `${BACKEND_URL}${value}`;
  }, []);

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
        const sem = normalizeSemester(n.semester) || (n.semester ? formatSemDisplay(n.semester) : "");
        return {
          id: n._id,
          title: formatTitle(title),
          semester: sem,
          scheme: normalizeScheme(n),
          branchCode: n.branch || activeBranch,
          extraBadge: n.subjectCode || "",
          pdfUrl: n.pdfUrl || "",
          resourceType: "notes",
          views: n.views || 0,
          downloads: n.downloads || 0,
          likes: n.likes || 0,
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

        const sem = normalizeSemester(p.semester) || (p.semester ? formatSemDisplay(p.semester) : "");
        const metaItems = [];
        if (p.year) metaItems.push(p.year);
        if (p.examType && !displayTitle.toLowerCase().includes(p.examType.toLowerCase())) {
          metaItems.push(p.examType);
        }

        return {
          id: p._id,
          title: displayTitle,
          semester: sem,
          scheme: normalizeScheme(p),
          branchCode: activeBranch,
          extraBadge: metaItems.join(" • "),
          pdfUrl: p.pdfUrl || "",
          resourceType: "papers",
          views: p.views || 0,
          downloads: p.downloads || 0,
          likes: p.likes || 0,
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

        const sem = normalizeSemester(s.semester) || (s.semester ? formatSemDisplay(s.semester) : "");
        const metaItems = [];
        if (s.subjectCode) metaItems.push(s.subjectCode);

        return {
          id: s._id,
          title: title,
          semester: sem,
          scheme: normalizeScheme(s),
          branchCode: activeBranch,
          extraBadge: metaItems.join(" • "),
          pdfUrl: s.pdfUrl || "",
          resourceType: "syllabus",
          views: s.views || 0,
          downloads: s.downloads || 0,
          likes: s.likes || 0,
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

        const sem = normalizeSemester(l.semester) || (l.semester ? formatSemDisplay(l.semester) : "");
        const metaItems = [];
        if (l.subjectCode) metaItems.push(l.subjectCode);

        return {
          id: l._id,
          title: title,
          semester: sem,
          scheme: normalizeScheme(l),
          branchCode: activeBranch,
          extraBadge: metaItems.join(" • "),
          pdfUrl: l.pdfUrl || "",
          resourceType: "labs",
          views: l.views || 0,
          downloads: l.downloads || 0,
          likes: l.likes || 0,
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

    // Filter by debounced search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.semester.toLowerCase().includes(q) ||
          (item.scheme && item.scheme.toLowerCase().includes(q)) ||
          (item.extraBadge && item.extraBadge.toLowerCase().includes(q))
      );
    }

    // Filter by semester dropdown
    if (selectedSemester !== "ALL") {
      const target = selectedSemester.toLowerCase();
      list = list.filter((item) => {
        const norm = (normalizeSemester(item.semester) || "").toLowerCase();
        const fmt = formatSemDisplay(item.semester).toLowerCase();
        const raw = String(item.semester || "").toLowerCase();
        return norm === target || fmt === target || raw.includes(target);
      });
    }

    return list;
  }, [activeResource, mappedNotes, mappedPapers, mappedSyllabus, mappedLabs, debouncedSearch, selectedSemester]);

  const paginatedItems = useMemo(() => {
    return displayItems.slice(0, visibleCount);
  }, [displayItems, visibleCount]);

  // Infinite scroll: automatically load more items when scrolling down
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => {
            if (prev < displayItems.length) {
              return Math.min(prev + 16, displayItems.length);
            }
            return prev;
          });
        }
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [displayItems.length]);

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

  // Handle Toggle Like Action
  const handleToggleLikeItem = async (item, e, skipAnimation = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const itemId = item.id;
    if (!itemId) return;

    const isLiked = likedItemIds.has(itemId);
    const action = isLiked ? "unlike" : "like";

    // Celebratory 100 hearts fountain if clicking heart button to like
    if (!isLiked && !skipAnimation) {
      let clientX = window.innerWidth / 2;
      let clientY = window.innerHeight / 2;
      if (e) {
        if (e.clientX && e.clientY) {
          clientX = e.clientX;
          clientY = e.clientY;
        } else if (e.touches && e.touches[0]) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        }
      }
      trigger100Hearts(clientX, clientY);
      setCardHeartPops((prev) => ({
        ...prev,
        [itemId]: Date.now(),
      }));
      setTimeout(() => {
        setCardHeartPops((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }, 900);
    }

    // 1. Optimistic Local Liked State across client storage
    setLikedItemIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      try {
        localStorage.setItem("andhra_liked_resources", JSON.stringify([...next]));
        const specificKey =
          item.resourceType === "papers"
            ? "andhra_liked_papers"
            : item.resourceType === "syllabus"
            ? "andhra_liked_syllabus"
            : item.resourceType === "labs"
            ? "andhra_liked_labs"
            : "andhra_liked_notes";
        const specificSet = new Set(
          JSON.parse(localStorage.getItem(specificKey) || "[]")
        );
        if (isLiked) specificSet.delete(itemId);
        else specificSet.add(itemId);
        localStorage.setItem(specificKey, JSON.stringify([...specificSet]));
      } catch (err) {
        console.error("Error saving liked resource:", err);
      }
      return next;
    });

    // 2. Optimistic Counter Update in active data store & local cache
    const targetLikes = Math.max(0, (item.likes || 0) + (isLiked ? -1 : 1));
    const updateResourceList = (prevList) =>
      prevList.map((res) => {
        if (res._id === itemId || res.id === itemId) {
          const current = typeof res.likes === "number" && !isNaN(res.likes) ? res.likes : 0;
          return {
            ...res,
            likes: Math.max(0, current + (isLiked ? -1 : 1)),
          };
        }
        return res;
      });

    const resKey =
      item.resourceType === "papers"
        ? "papers"
        : item.resourceType === "syllabus"
        ? "syllabus"
        : item.resourceType === "labs"
        ? "labs"
        : "notes";

    if (item.resourceType === "papers") setPapersData(updateResourceList);
    else if (item.resourceType === "syllabus") setSyllabusData(updateResourceList);
    else if (item.resourceType === "labs") setLabsData(updateResourceList);
    else setNotesData(updateResourceList);

    updateCachedResourceItem(resKey, itemId, { likes: targetLikes });

    // 3. Persist to Backend API
    try {
      const endpoint =
        item.resourceType === "papers"
          ? `/papers/${itemId}/like`
          : item.resourceType === "syllabus"
          ? `/syllabus/${itemId}/like`
          : item.resourceType === "labs"
          ? `/lab-programs/${itemId}/like`
          : `/notes/${itemId}/like`;

      const res = await API.put(endpoint, { action });
      if (res.data && typeof res.data.likes === "number") {
        const syncServerLikes = (prevList) =>
          prevList.map((r) =>
            r._id === itemId || r.id === itemId ? { ...r, likes: res.data.likes } : r
          );
        if (item.resourceType === "papers") setPapersData(syncServerLikes);
        else if (item.resourceType === "syllabus") setSyllabusData(syncServerLikes);
        else if (item.resourceType === "labs") setLabsData(syncServerLikes);
        else setNotesData(syncServerLikes);

        updateCachedResourceItem(resKey, itemId, { likes: res.data.likes });
      }
    } catch (err) {
      console.error("Error updating like on resource:", err);
    }
  };

  // Handle View Action
  const handleViewItem = async (item) => {
    const itemId = item.id;

    // 1. Instantly register view count on backend & sync local cache
    if (itemId) {
      if (item.resourceType === "papers") {
        API.put(`/papers/${itemId}/view`).catch(() => { });
      } else if (item.resourceType === "syllabus") {
        API.put(`/syllabus/${itemId}/view`).catch(() => { });
      } else if (item.resourceType === "labs") {
        API.put(`/lab-programs/${itemId}/view`).catch(() => { });
      } else {
        API.put(`/notes/${itemId}/view`).catch(() => { });
      }

      const resKey =
        item.resourceType === "papers"
          ? "papers"
          : item.resourceType === "syllabus"
          ? "syllabus"
          : item.resourceType === "labs"
          ? "labs"
          : "notes";
      const newViews = (item.views || 0) + 1;
      updateCachedResourceItem(resKey, itemId, { views: newViews });

      // Optimistic update in active data store
      const updateViews = (prevList) =>
        prevList.map((res) =>
          res._id === itemId || res.id === itemId
            ? { ...res, views: (res.views || 0) + 1 }
            : res
        );

      if (item.resourceType === "papers") setPapersData(updateViews);
      else if (item.resourceType === "syllabus") setSyllabusData(updateViews);
      else if (item.resourceType === "labs") setLabsData(updateViews);
      else setNotesData(updateViews);
    }

    if (item.resourceType === "notes" && item.id) {
      navigate(`/notes/${item.id}`);
      return;
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

  // Double-tap heart pop overlay state and detection per card
  const [cardHeartPops, setCardHeartPops] = useState({});
  const cardTapTimersRef = useRef({});
  const cardLastTapTimeRef = useRef({});

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(cardTapTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const triggerDoubleTapLike = (item, e) => {
    // 1. Get tap coordinates for the celebratory fountain
    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;
    if (e) {
      if (e.clientX && e.clientY) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches[0]) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
    }

    // 2. Haptic vibration feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 60]);
      } catch {}
    }

    // 3. 100-Hearts Canvas Fountain
    trigger100Hearts(clientX, clientY);

    // 4. Card-level pop heart overlay
    const itemId = item.id;
    setCardHeartPops((prev) => ({
      ...prev,
      [itemId]: Date.now(),
    }));
    setTimeout(() => {
      setCardHeartPops((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }, 900);

    // 5. If not already liked, register like
    if (!likedItemIds.has(itemId)) {
      handleToggleLikeItem(item, e, true);
    }
  };

  const handleCardClick = (item, e) => {
    // If user clicked directly on a button or link inside the card, ignore
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }

    const itemId = item.id;
    const now = Date.now();
    const lastTap = cardLastTapTimeRef.current[itemId] || 0;

    // Double-tap threshold: within 400ms (and at least 40ms to filter bounce)
    if (now - lastTap < 400 && now - lastTap > 40) {
      // Cancel pending single-tap navigation timer
      if (cardTapTimersRef.current[itemId]) {
        clearTimeout(cardTapTimersRef.current[itemId]);
        delete cardTapTimersRef.current[itemId];
      }
      cardLastTapTimeRef.current[itemId] = 0;
      triggerDoubleTapLike(item, e);
    } else {
      cardLastTapTimeRef.current[itemId] = now;
      // Single tap navigation with 380ms grace window so double tap is never interrupted
      if (cardTapTimersRef.current[itemId]) {
        clearTimeout(cardTapTimersRef.current[itemId]);
      }
      cardTapTimersRef.current[itemId] = setTimeout(() => {
        delete cardTapTimersRef.current[itemId];
        handleViewItem(item);
      }, 380);
    }
  };

  const handleCardDoubleClick = (item, e) => {
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    const itemId = item.id;
    if (cardTapTimersRef.current[itemId]) {
      clearTimeout(cardTapTimersRef.current[itemId]);
      delete cardTapTimersRef.current[itemId];
    }
    cardLastTapTimeRef.current[itemId] = 0;
    triggerDoubleTapLike(item, e);
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
        API.put(`/papers/${item.id}/download`).catch(() => { });
      } else if (item.resourceType === "syllabus") {
        API.put(`/syllabus/${item.id}/download`).catch(() => { });
      } else if (item.resourceType === "labs") {
        API.put(`/lab-programs/${item.id}/download`).catch(() => { });
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
              <span>Academic Resource Hub</span>
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
            onClick={() => {
              if (authUser) {
                setIsProfileOpen(true);
              } else {
                navigate("/login");
              }
            }}
            title={authUser ? "View & Edit Student Profile" : "Sign In to Andhra Circle"}
          >
            <div className="profile-avatar-wrapper">
              {studentAvatar ? (
                <img
                  src={studentAvatar}
                  alt={studentData.name || "Student"}
                  className="profile-avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <span className="profile-status-dot" />
            </div>
            <div className="profile-info">
              <span className="profile-name">Profile</span>
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
              <h1 className="notes-page-title" id="notes-page-title">{currentConfig.title}</h1>
              <p className="notes-page-subtitle">{currentConfig.subtitle}</p>
            </header>

            <div className="notes-filters-row">
              {/* Search Box with Reactive Search Button */}
              <div className="notes-search-box">
                <div className="notes-search-metal-wrap">
                  <MetalFx
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
                <option value="ALL">All Departments</option>
                <option value="CSE">CSE — Computer Science</option>
                <option value="AIML">AIML — AI & Machine Learning</option>
                <option value="ME">ME — Mechanical Eng.</option>
                <option value="CE">CE — Civil Eng.</option>
                <option value="ECE">ECE — Electronics & Comm.</option>
                <option value="EEE">EEE — Electrical & Electronics</option>
              </select>

              {/* Semester Dropdown */}
              <select
                className="notes-select-dropdown"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="ALL">All Semesters</option>
                <option value="1-1">1-1</option>
                <option value="1-2">1-2</option>
                <option value="2-1">2-1</option>
                <option value="2-2">2-2</option>
                <option value="3-1">3-1</option>
                <option value="3-2">3-2</option>
                <option value="4-1">4-1</option>
                <option value="4-2">4-2</option>
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
                    className={`notes-branch-tab-btn ${isActive ? "is-active" : ""} ${isPulsing ? "is-pulsing" : ""}`}
                    onClick={() => handleSelectBranch(tab.code)}
                    title={`View ${tab.name}`}
                    aria-label={`View ${tab.name}`}
                  >
                    <span className="notes-branch-tab-text">{tab.code}</span>
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
                <>
                  {paginatedItems.map((item) => (
                    <article
                      key={item.id}
                      className="notes-folder-card"
                      onClick={(e) => handleCardClick(item, e)}
                      onDoubleClick={(e) => handleCardDoubleClick(item, e)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleViewItem(item);
                        }
                      }}
                    >
                      {/* Double-tap Floating Heart Pop */}
                      {cardHeartPops[item.id] && (
                        <div className="card-double-tap-heart" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="#e11d48">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                      )}
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
                          <div className="folder-card-sub">
                            {item.branchCode && (
                              <span className="folder-tag folder-branch-tag">
                                {item.branchCode}
                              </span>
                            )}
                            {item.semester && (
                              <span className="folder-tag folder-sem-tag">
                                Sem {formatSemDisplay(item.semester).replace(/^sem\s*/i, "")}
                              </span>
                            )}
                            {item.scheme && (
                              <span className="folder-tag folder-scheme-tag">
                                {item.scheme.includes("Scheme") ? item.scheme : `${item.scheme} Scheme`}
                              </span>
                            )}
                            {item.extraBadge && (
                              <span className="folder-tag folder-code-tag">
                                {item.extraBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: View & Mobile Stats */}
                      <div className="folder-card-actions">
                        {/* Left side: View and Download metrics (visible only on mobile) */}
                        <div
                          className="folder-card-stats-mobile"
                          aria-label="Resource view and download stats"
                        >
                          <span
                            className="folder-stat-chip folder-stat-views"
                            title={`${item.views || 0} Total Views`}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span className="folder-stat-count">
                              {item.views || 0}
                            </span>
                          </span>

                          <span
                            className="folder-stat-chip folder-stat-downloads"
                            title={`${item.downloads || 0} Total Downloads`}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span className="folder-stat-count">
                              {item.downloads || 0}
                            </span>
                          </span>

                          <button
                            type="button"
                            className={`folder-stat-chip folder-stat-likes folder-stat-likes-btn ${likedItemIds.has(item.id) ? "is-liked" : ""}`}
                            title={likedItemIds.has(item.id) ? "Liked! Click to unlike" : "Click to like"}
                            onClick={(e) => handleToggleLikeItem(item, e)}
                          >
                            <svg
                              width="13.5"
                              height="13.5"
                              viewBox="0 0 24 24"
                              fill={likedItemIds.has(item.id) ? "#e11d48" : "currentColor"}
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span className="folder-stat-count">
                              {item.likes || 0}
                            </span>
                          </button>
                        </div>

                        {/* Right side: Minimized View button */}
                        <button
                          type="button"
                          className="folder-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewItem(item);
                          }}
                          title={`View ${item.title}`}
                        >
                          <svg
                            className="folder-view-btn-icon"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path
                              fillRule="evenodd"
                              d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>View</span>
                        </button>
                      </div>
                    </article>
                  ))}

                  {displayItems.length > visibleCount && (
                    <div
                      ref={loadMoreSentinelRef}
                      style={{
                        textAlign: "center",
                        padding: "1.5rem 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        color: "var(--text-muted, #94a3b8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span className="papers-spinner" style={{ width: 18, height: 18 }} />
                      <span>Loading more...</span>
                    </div>
                  )}
                </>
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