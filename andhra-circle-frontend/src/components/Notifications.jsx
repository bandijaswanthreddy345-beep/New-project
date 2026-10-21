import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API from "../api/api";
import noteThumbnail from "../assets/note-thumbnail.jpg";
import LikeReactionButton from "./LikeReactionButton";
import trigger100Hearts from "../utils/heartBurst";
import Navbar from "./Navbar";
import Footer from "./Footer";
import StudentProfileModal from "./StudentProfileModal";
import { getStoredStudentData } from "../data/studentData";

// Curated official JNTU academic notices as standard fallback
const CURATED_NOTICES = [
  {
    _id: "notice-jntu-01",
    title: "JNTU B.Tech R20/R23 Semester End Examination Timetable 2024-25",
    description: "Official schedule for regular and supplementary examinations commencing next month. Hall tickets will be issued one week prior to commencement.",
    category: "EXAM",
    publishedDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    views: 1420,
    downloads: 512,
    likes: 145,
    link: "https://jntuk.edu.in",
  },
  {
    _id: "notice-jntu-02",
    title: "Revised Academic Calendar & Instruction Days for 2nd, 3rd & 4th Years",
    description: "University circular detailing working Saturdays, mid-term assessment schedules, and practical examination guidelines.",
    category: "CIRCULAR",
    publishedDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    views: 980,
    downloads: 340,
    likes: 98,
    link: "https://jntua.ac.in",
  },
  {
    _id: "notice-jntu-03",
    title: "Revaluation & Recounting Results for 2-1 and 3-1 Regular Examinations",
    description: "Results portal is now active for verification. Students may check updated grades and request duplicate scorecards.",
    category: "RESULTS",
    publishedDate: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    views: 1890,
    downloads: 720,
    likes: 230,
    link: "https://jntukresults.edu.in",
  },
  {
    _id: "notice-jntu-04",
    title: "AICTE & JNTU Internship Guidelines & Credit Transfer Notification",
    description: "Mandatory industrial internship rules for 6th and 7th semester engineering students with list of accredited portal partners.",
    category: "GENERAL",
    publishedDate: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    views: 820,
    downloads: 310,
    likes: 74,
    link: "https://jntuk.edu.in",
  },
];

function Notifications({ search = "" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const effectiveSearch = search || urlSearch;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingNotice, setViewingNotice] = useState(null);
  const [blinkingNoticeId, setBlinkingNoticeId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [, setStudentData] = useState(getStoredStudentData());
  const [likedNotifIds, setLikedNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem("andhra_liked_notifications");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/notifications");
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await API.get("/notifications/sync");
    } catch (e) {
      console.warn("Manual sync error:", e);
    }
    await fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isBTechNotice = (n) => {
    if (!n) return false;
    const text = `${n.title || ""} ${n.description || ""}`.toLowerCase();
    const isBTech = text.includes("b.tech") || text.includes("btech") || text.includes("b tech");
    const isOther =
      text.includes("b.pharm") ||
      text.includes("bpharm") ||
      text.includes("m.pharm") ||
      text.includes("mpharm") ||
      text.includes("m.tech") ||
      text.includes("mtech") ||
      text.includes("mba") ||
      text.includes("mca") ||
      text.includes("ph.d") ||
      text.includes("phd") ||
      text.includes("pharm.d") ||
      text.includes("pharmd");
    if (isOther && !isBTech) return false;
    return isBTech;
  };

  // Combine backend notices with curated defaults (strictly B.Tech only)
  const combinedNotices = useMemo(() => {
    const list = [...notifications];
    CURATED_NOTICES.forEach((c) => {
      if (!list.some((n) => (n.title || "").toLowerCase() === c.title.toLowerCase())) {
        list.push(c);
      }
    });
    return list.filter(isBTechNotice);
  }, [notifications]);

  // Compute live metrics for the counter portion
  const metrics = useMemo(() => {
    const total = combinedNotices.length;
    const exams = combinedNotices.filter((n) => {
      const cat = (n.category || "").toUpperCase();
      const t = (n.title || "").toLowerCase();
      return cat.includes("EXAM") || t.includes("exam") || t.includes("timetable");
    }).length;

    const circulars = combinedNotices.filter((n) => {
      const cat = (n.category || "").toUpperCase();
      const t = (n.title || "").toLowerCase();
      return cat.includes("CIRCULAR") || cat.includes("ACADEMIC") || t.includes("circular");
    }).length;

    const totalViews = combinedNotices.reduce((acc, n) => acc + (n.views || 0), 0);
    const totalDownloads = combinedNotices.reduce((acc, n) => acc + (n.downloads || 0), 0);

    return { total, exams, circulars, totalViews, totalDownloads };
  }, [combinedNotices]);

  // Latest notice for the headline bulletin
  const latestNotice = useMemo(() => {
    if (combinedNotices.length === 0) return null;
    return [...combinedNotices].sort(
      (a, b) => new Date(b.publishedDate || 0) - new Date(a.publishedDate || 0)
    )[0];
  }, [combinedNotices]);

  // Filtered notifications list
  const displayedNotifications = useMemo(() => {
    let list = combinedNotices;

    // Filter by effective search
    if (effectiveSearch.trim()) {
      const q = effectiveSearch.toLowerCase().trim();
      list = list.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.description && n.description.toLowerCase().includes(q)) ||
          (n.category && n.category.toLowerCase().includes(q))
      );
    }

    // Filter by active category
    if (activeCategory !== "ALL") {
      list = list.filter((n) => {
        const cat = (n.category || "").toUpperCase();
        const t = (n.title || "").toLowerCase();
        if (activeCategory === "EXAM") {
          return cat.includes("EXAM") || t.includes("exam") || t.includes("timetable");
        }
        if (activeCategory === "CIRCULAR") {
          return cat.includes("CIRCULAR") || cat.includes("ACADEMIC") || t.includes("circular");
        }
        if (activeCategory === "RESULTS") {
          return cat.includes("RESULT") || t.includes("result");
        }
        if (activeCategory === "GENERAL") {
          return cat === "GENERAL" || (!cat.includes("EXAM") && !cat.includes("CIRCULAR") && !cat.includes("RESULT"));
        }
        return true;
      });
    }

    return list;
  }, [combinedNotices, effectiveSearch, activeCategory]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recent";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recent";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeAgo = (date) => {
    if (!date) return "Just now";
    const sec = Math.floor((new Date() - new Date(date)) / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleOpenNotice = async (notice) => {
    setViewingNotice(notice);
    try {
      if (notice._id && !notice._id.startsWith("notice-")) {
        await API.put(`/notifications/${notice._id}/view`);
      }
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notice._id
            ? { ...item, views: (item.views || 0) + 1 }
            : item
        )
      );
    } catch {
      // ignore
    }
  };

  const handleCloseNotice = () => {
    setViewingNotice(null);
  };

  const handlePreviewNotice = (notice) => {
    setBlinkingNoticeId(notice._id);
    setTimeout(() => {
      handleOpenNotice(notice);
      setBlinkingNoticeId(null);
    }, 650);
  };

  const handleDownload = async (notification) => {
    try {
      if (notification._id && !notification._id.startsWith("notice-")) {
        await API.put(`/notifications/${notification._id}/download`);
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, downloads: (item.downloads || 0) + 1 }
            : item
        )
      );

      const downloadUrl = notification.link || notification.pdfUrl;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
      } else {
        alert("Attached circular document is currently being synchronized.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleLike = async (notification, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const notifId = notification._id;
    const isLiked = likedNotifIds.has(notifId);
    const action = isLiked ? "unlike" : "like";

    // Trigger vibrant 3D 100-hearts pop burst animation when user likes
    if (!isLiked && e && e.currentTarget) {
      try {
        const rect = e.currentTarget.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        trigger100Hearts(originX, originY);
      } catch (err) {
        console.error("Heart burst trigger error:", err);
      }
    }

    setLikedNotifIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(notifId);
      } else {
        next.add(notifId);
      }
      try {
        localStorage.setItem("andhra_liked_notifications", JSON.stringify([...next]));
      } catch (err) {
        console.error("Error saving liked notifications:", err);
      }
      return next;
    });

    setNotifications((prevNotifs) =>
      prevNotifs.map((n) => {
        if (n._id === notifId) {
          const cur = typeof n.likes === "number" && !isNaN(n.likes) ? n.likes : 0;
          return {
            ...n,
            likes: Math.max(0, cur + (isLiked ? -1 : 1)),
          };
        }
        return n;
      })
    );

    try {
      if (!notifId.startsWith("notice-")) {
        const res = await API.put(`/notifications/${notifId}/like`, { action });
        if (res.data && typeof res.data.likes === "number") {
          setNotifications((prevNotifs) =>
            prevNotifs.map((n) =>
              n._id === notifId ? { ...n, likes: res.data.likes } : n
            )
          );
        }
      }
    } catch (error) {
      console.error("Error updating notification like:", error);
    }
  };

  const handleView = async (notification) => {
    try {
      if (notification._id && !notification._id.startsWith("notice-")) {
        await API.put(`/notifications/${notification._id}/view`);
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, views: (item.views || 0) + 1 }
            : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Category filter list
  const categoryFilters = [
    { key: "ALL", label: "All Notices", count: combinedNotices.length },
    { key: "EXAM", label: "Exams & Timetables", count: metrics.exams },
    { key: "CIRCULAR", label: "Academic Circulars", count: metrics.circulars },
    { key: "RESULTS", label: "Results", count: combinedNotices.filter((n) => (n.category || "").toUpperCase().includes("RESULT") || (n.title || "").toLowerCase().includes("result")).length },
    { key: "GENERAL", label: "General Updates", count: combinedNotices.filter((n) => (n.category || "").toUpperCase() === "GENERAL").length },
  ];

  return (
    <div className="bg-[#08090D] text-[#F5F5FA] min-h-screen selection:bg-[#8B5CF6]/30 selection:text-white relative flex flex-col justify-between">
      {/* Top Universal Navbar */}
      <Navbar onOpenProfile={() => setIsProfileOpen(true)} />

      {/* Main Content Area */}
      <main className="w-full pt-6 md:pt-8 pb-16 bg-[#08090D] relative flex-1">
        {/* Architectural Background Grid & Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
          <div className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[#8B5CF6]/10 rounded-full blur-[140px]" />
          <div className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] bg-[#27213B]/20 rounded-full blur-[120px]" />
          <svg
            className="w-full h-full stroke-[#292733]/40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern height="48" id="jntu-telemetry-grid-notifs" patternUnits="userSpaceOnUse" width="48">
                <path d="M 48 0 L 0 0 0 48" fill="none" strokeWidth="1" />
                <circle cx="48" cy="48" fill="#8B5CF6" fillOpacity="0.5" r="0.8" />
              </pattern>
            </defs>
            <rect fill="url(#jntu-telemetry-grid-notifs)" height="100%" width="100%" />
          </svg>
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8">
          
          {/* Top Breadcrumb & Back Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate("/");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12131B] border border-[#292733] text-xs font-semibold text-[#94A3B8] hover:text-white hover:border-[#8B5CF6] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <Link to="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span className="text-[#8B5CF6] font-semibold">B.Tech Notifications</span>
            </div>
          </div>

          {/* Section Heading */}
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181926] border border-[#8B5CF6]/30 text-[11px] font-bold text-[#C4B5FD] tracking-wider uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
              B.TECH UNIVERSITY ANNOUNCEMENTS
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#F5F5FA] tracking-tight">
              B.Tech Notifications & Circulars
            </h1>
          </div>

          {/* =========================================================
              QUICK NOTICE SUMMARY / LIVE UPDATES COUNTER HUB
              ========================================================= */}
          <div className="bg-[#12131B] border border-[#292733] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#292733] pb-6">
              <div>
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#8B5CF6]/15 text-[#C4B5FD] text-[11px] font-bold tracking-wider uppercase mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                  LIVE JNTU B.TECH CIRCULARS
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#F5F5FA]">
                  B.Tech Notice Summary & Live Updates Counter
                </h3>
                <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-2xl">
                  Real-time feed of official B.Tech examination timetables, semester circulars, and university updates.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#161724] border border-[#292733] hover:border-[#8B5CF6] text-white flex items-center gap-2 transition-all"
                >
                  <span className={`material-symbols-outlined text-[18px] text-[#A78BFA] ${isRefreshing ? "animate-spin" : ""}`}>
                    sync
                  </span>
                  <span>{isRefreshing ? "Syncing..." : "Live Sync"}</span>
                </button>
                <span className="text-[11px] text-[#64748B]">Updated {formatTimeAgo(lastUpdated)}</span>
              </div>
            </div>

            {/* 4 Stat Counter Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#161724] border border-[#292733] rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-[#8B5CF6]/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#1f2033] border border-[#292733] flex items-center justify-center text-[#8B5CF6] shrink-0">
                  <span className="material-symbols-outlined text-[24px]">article</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-extrabold text-[#F5F5FA]">{metrics.total}</span>
                  <span className="text-xs text-[#94A3B8] uppercase font-semibold">Active Notices</span>
                </div>
              </div>

              <div className="bg-[#161724] border border-[#292733] rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-[#8B5CF6]/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#1f2033] border border-[#292733] flex items-center justify-center text-[#38BDF8] shrink-0">
                  <span className="material-symbols-outlined text-[24px]">event_note</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-extrabold text-[#F5F5FA]">{metrics.exams}</span>
                  <span className="text-xs text-[#94A3B8] uppercase font-semibold">Exam Circulars</span>
                </div>
              </div>

              <div className="bg-[#161724] border border-[#292733] rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-[#8B5CF6]/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#1f2033] border border-[#292733] flex items-center justify-center text-[#A78BFA] shrink-0">
                  <span className="material-symbols-outlined text-[24px]">campaign</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-extrabold text-[#F5F5FA]">{metrics.circulars}</span>
                  <span className="text-xs text-[#94A3B8] uppercase font-semibold">Academic Circulars</span>
                </div>
              </div>

              <div className="bg-[#161724] border border-[#292733] rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-[#8B5CF6]/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#1f2033] border border-[#292733] flex items-center justify-center text-[#F59E0B] shrink-0">
                  <span className="material-symbols-outlined text-[24px]">visibility</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-extrabold text-[#F5F5FA]">
                    {metrics.totalViews > 999 ? `${(metrics.totalViews / 1000).toFixed(1)}k` : metrics.totalViews}
                  </span>
                  <span className="text-xs text-[#94A3B8] uppercase font-semibold">Student Reads</span>
                </div>
              </div>
            </div>

            {/* Latest Bulletin Ticker */}
            {latestNotice && (
              <div className="bg-[#161724] border border-[#8B5CF6]/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="bg-[#8B5CF6] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase shrink-0">
                    LATEST BULLETIN
                  </span>
                  <span className="text-[#F5F5FA] font-medium truncate">{latestNotice.title}</span>
                  <span className="hidden md:inline text-[#64748B] shrink-0">• Published {formatDate(latestNotice.publishedDate)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenNotice(latestNotice)}
                  className="text-[#C4B5FD] hover:text-white font-semibold flex items-center gap-1 shrink-0 self-end sm:self-center"
                >
                  <span>View Circular</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeCategory === cat.key
                      ? "bg-[#8B5CF6] text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                      : "bg-[#161724] border border-[#292733] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/50"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeCategory === cat.key ? "bg-white/20 text-white" : "bg-[#1f2033] text-[#A78BFA]"
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* =========================================================
              NOTIFICATIONS GRID (STITCH OBSIDIAN CARDS)
              ========================================================= */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-[#12131B] border border-[#292733] rounded-2xl h-72 animate-pulse" />
              <div className="bg-[#12131B] border border-[#292733] rounded-2xl h-72 animate-pulse" />
              <div className="bg-[#12131B] border border-[#292733] rounded-2xl h-72 animate-pulse" />
              <div className="bg-[#12131B] border border-[#292733] rounded-2xl h-72 animate-pulse" />
            </div>
          ) : error ? (
            <div className="bg-[#12131B] border border-[#292733] rounded-3xl p-10 text-center">
              <p className="text-[#EF4444] text-sm mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchNotifications}
                className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-sm font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="bg-[#12131B] border border-[#292733] rounded-3xl p-12 text-center text-[#94A3B8]">
              No notifications found matching your selection.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {displayedNotifications.map((notification) => {
                const isLiked = likedNotifIds.has(notification._id);
                return (
                  <div
                    key={notification._id}
                    className="group bg-[#12131B] border border-[#292733] hover:border-[#8B5CF6]/70 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(139,92,246,0.22)] hover:-translate-y-1 relative"
                  >
                    <div>
                      {/* Thumbnail Header with Home Page noteThumbnail */}
                      <div
                        className="relative h-40 w-full overflow-hidden border-b border-[#292733] bg-[#0d0e15] cursor-pointer"
                        onClick={() => handleOpenNotice(notification)}
                      >
                        <img
                          src={noteThumbnail}
                          alt={notification.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#12131B] via-[#08090D]/50 to-transparent" />

                        {/* Badge Overlay */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#08090D]/90 border border-[#8B5CF6]/50 text-[#C4B5FD] text-[11px] font-label-mono-sm font-semibold backdrop-blur-md shadow-[0_0_10px_rgba(139,92,246,0.3)] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
                            {notification.category || "EXAM"}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-3.5 flex flex-col gap-2">
                        <div className="flex items-center">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C4B5FD] text-[11px] font-label-mono-sm font-semibold tracking-wide">
                            {notification.branch || "JNTU"}
                          </span>
                        </div>

                        <h3
                          onClick={() => handleOpenNotice(notification)}
                          className="font-headline-sm text-[15px] font-bold text-[#F5F5FA] group-hover:text-[#C4B5FD] transition-colors leading-snug line-clamp-2 cursor-pointer"
                        >
                          {notification.title}
                        </h3>

                        <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                          {notification.description || "Official circular published by JNTU administrative board."}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-3.5 pt-0 flex flex-col gap-2.5 mt-1">
                      <div className="flex items-center justify-between text-[11px] font-label-mono-sm border-t border-[#292733]/60 pt-2.5">
                        {/* Views & Downloads: Mono White */}
                        <div className="flex items-center gap-3 text-white">
                          <span className="inline-flex items-center gap-1.5 text-white">
                            <span className="material-symbols-outlined text-[15px] text-white">visibility</span>
                            <span className="font-semibold text-white text-[11px]">{notification.views || 193}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-white">
                            <span className="material-symbols-outlined text-[15px] text-white">download</span>
                            <span className="font-semibold text-white text-[11px]">{notification.downloads || 38}</span>
                          </span>
                        </div>

                        {/* Interactive Like Reaction */}
                        <button
                          type="button"
                          aria-label="Bookmark notification"
                          onClick={(e) => handleToggleLike(notification, e)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#08090D] border transition-all cursor-pointer ${
                            isLiked
                              ? "border-[#f43f5e]/60 text-[#f43f5e] shadow-[0_0_10px_rgba(244,63,94,0.25)]"
                              : "border-[#292733] text-[#A3A3B5] hover:text-[#f43f5e] hover:border-[#f43f5e]/40"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[14px] transition-transform ${
                              isLiked ? "scale-110 text-[#f43f5e]" : ""
                            }`}
                          >
                            {isLiked ? "favorite" : "favorite_border"}
                          </span>
                          <span className={`font-semibold text-[11px] ${isLiked ? "text-[#f43f5e]" : ""}`}>
                            {notification.likes || 48}
                          </span>
                        </button>
                      </div>

                      {/* Action Buttons: Solid Purple Preview & Download */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePreviewNotice(notification)}
                          className="group/eye px-3 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7c4def] text-white font-medium text-[12px] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_14px_rgba(139,92,246,0.35)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] active:scale-[0.98] cursor-pointer"
                          title="Preview Circular"
                        >
                          <span className={`material-symbols-outlined text-[15px] ${blinkingNoticeId === notification._id ? "eye-blink-anim" : ""}`}>
                            visibility
                          </span>
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(notification)}
                          className="px-3 py-2 rounded-xl bg-[#08090D] border border-[#292733] hover:border-[#8B5CF6]/70 hover:bg-[#1f1d2e] text-[#F1F5F9] font-medium text-[12px] flex items-center justify-center gap-1.5 transition-all hover:shadow-[0_0_12px_rgba(139,92,246,0.2)] active:scale-[0.98] cursor-pointer group/dl"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#C4B5FD] group-hover/dl:translate-y-0.5 transition-transform">
                            download
                          </span>
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* Universal Footer */}
      <Footer />

      {/* Notice Detail Modal */}
      {viewingNotice && (
        <div
          className="fixed inset-0 z-50 bg-[#08090D]/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={handleCloseNotice}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-[#12131B] border border-[#292733] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#292733] pb-4">
              <span className="px-3 py-1 rounded-full bg-[#8B5CF6]/15 text-[#C4B5FD] text-xs font-bold uppercase tracking-wider">
                {viewingNotice.category || "GENERAL"} · OFFICIAL CIRCULAR
              </span>
              <button
                type="button"
                onClick={handleCloseNotice}
                className="w-8 h-8 rounded-full bg-[#161724] border border-[#292733] text-[#94A3B8] hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Title & Info */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5FA] mb-2">
                {viewingNotice.title}
              </h2>
              <span className="text-xs text-[#94A3B8]">
                Published {formatDate(viewingNotice.publishedDate || viewingNotice.createdAt)} · {formatTimeAgo(viewingNotice.publishedDate || viewingNotice.createdAt)}
              </span>
            </div>

            {/* University Verified Notice Banner */}
            <div className="bg-[#161724] border border-[#8B5CF6]/30 rounded-2xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#8B5CF6] text-[22px] shrink-0 mt-0.5">
                verified
              </span>
              <div className="text-xs text-[#94A3B8] leading-relaxed">
                <strong className="block text-[#F5F5FA] font-semibold mb-0.5">Official University Announcement</strong>
                Directly synchronized with Jawaharlal Nehru Technological University Examination Branch.
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#08090D] border border-[#292733] rounded-2xl p-4 text-sm text-[#F5F5FA] leading-relaxed">
              <h4 className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider mb-2">Circular Details & Instructions</h4>
              <p className="whitespace-pre-line text-[#CBD5E1]">
                {viewingNotice.description || "Official circular issued for B.Tech regular & supplementary examinations. Students are advised to verify timelines and download attached schedules."}
              </p>
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between border-t border-[#292733] pt-4">
              <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">visibility</span>
                  {viewingNotice.views || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  {viewingNotice.downloads || 0} dls
                </span>
              </div>

              <div className="flex items-center gap-2">
                {viewingNotice.link && (
                  <a
                    href={viewingNotice.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#161724] border border-[#292733] hover:border-[#8B5CF6] text-white flex items-center gap-1.5 transition-all"
                  >
                    <span>Open Official Portal</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleDownload(viewingNotice)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white shadow-md flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={(updated) => setStudentData(updated)}
      />
    </div>
  );
}

export default Notifications;
