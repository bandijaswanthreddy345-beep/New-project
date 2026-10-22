import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThinkingOrb } from "thinking-orbs";
import { getStoredStudentData, saveStoredStudentData } from "../data/studentData";
import {
  performSearch,
  formatResourceAction,
  detectBranchFromQuery,
  getBranchHubData,
  BRANCH_DIRECTORY,
} from "../utils/searchEngine";

/**
 * Interactive Branch Showcase component rendered inside chatbot messages.
 * Allows filtering branch content by All, Notes, Papers, Syllabus, Labs, and Curriculum.
 */
function BranchHubView({ hub, onSelectQuery, onCloseModal }) {
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  if (!hub || !hub.branch) return null;
  const { branch, counts, semesters } = hub;

  const currentItems =
    activeTab === "all"
      ? hub.allResources
      : activeTab === "notes"
      ? hub.notes
      : activeTab === "papers"
      ? hub.papers
      : activeTab === "syllabus"
      ? hub.syllabus
      : activeTab === "labs"
      ? hub.labs
      : [];

  return (
    <div className="chat-branch-hub">
      {/* Branch Header Banner */}
      <div className="chat-branch-header">
        <div className="chat-branch-icon">
          <span className="material-symbols-outlined text-[24px] text-[#C4B5FD]">
            {branch.icon || "school"}
          </span>
        </div>
        <div className="chat-branch-title-box">
          <h4>{branch.name} ({branch.code})</h4>
          <p>{branch.description}</p>
        </div>
      </div>

      {/* Interactive Category Filter Tabs */}
      <div className="chat-branch-tabs">
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "all" ? "is-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <span className="material-symbols-outlined text-[14px]">folder_open</span>
          <span>All ({hub.totalCount})</span>
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "notes" ? "is-active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <span className="material-symbols-outlined text-[14px]">description</span>
          <span>Notes ({counts.notes})</span>
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "papers" ? "is-active" : ""}`}
          onClick={() => setActiveTab("papers")}
        >
          <span className="material-symbols-outlined text-[14px]">assignment</span>
          <span>Papers ({counts.papers})</span>
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "syllabus" ? "is-active" : ""}`}
          onClick={() => setActiveTab("syllabus")}
        >
          <span className="material-symbols-outlined text-[14px]">list_alt</span>
          <span>Syllabus ({counts.syllabus})</span>
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "labs" ? "is-active" : ""}`}
          onClick={() => setActiveTab("labs")}
        >
          <span className="material-symbols-outlined text-[14px]">science</span>
          <span>Labs ({counts.labs})</span>
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "curriculum" ? "is-active" : ""}`}
          onClick={() => setActiveTab("curriculum")}
        >
          <span className="material-symbols-outlined text-[14px]">calendar_month</span>
          <span>Curriculum (8 Sems)</span>
        </button>
      </div>

      {/* Direct Branch Quick Action Buttons Bar */}
      <div className="chat-branch-quick-links">
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/notes?branch=${encodeURIComponent(branch.code)}`);
          }}
        >
          <span className="material-symbols-outlined text-[13px]">description</span>
          <span>{branch.code} Notes Portal</span>
        </button>
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/papers?branch=${encodeURIComponent(branch.code)}`);
          }}
        >
          <span className="material-symbols-outlined text-[13px]">assignment</span>
          <span>{branch.code} Question Papers</span>
        </button>
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/syllabus?branch=${encodeURIComponent(branch.code)}`);
          }}
        >
          <span className="material-symbols-outlined text-[13px]">list_alt</span>
          <span>{branch.code} Syllabus</span>
        </button>
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/labs?branch=${encodeURIComponent(branch.code)}`);
          }}
        >
          <span className="material-symbols-outlined text-[13px]">science</span>
          <span>{branch.code} Lab Manuals</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === "curriculum" ? (
        <div className="chat-curriculum-list">
          {semesters.map((sem) => (
            <div key={sem.id} className="chat-sem-card">
              <div className="chat-sem-title">
                <span>{sem.title}</span>
                <span className="chat-sem-sub-credits">{sem.subjects?.length || 0} subjects</span>
              </div>
              <div className="chat-sem-subjects-wrap">
                {sem.subjects?.map((sub, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    className="chat-sem-sub-pill"
                    onClick={() => onSelectQuery(`${sub.name} notes`)}
                    title={`Search ${sub.name}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {sub.isLab ? "science" : "description"}
                    </span>
                    <span>{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="chat-result-cards">
          {currentItems.length === 0 ? (
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "6px 0" }}>
              No {activeTab} indexed yet for this department. Check All tab or browse portal.
            </p>
          ) : (
            currentItems.slice(0, 4).map((resItem, idx) => {
              const action = formatResourceAction(resItem);
              const typeClass =
                resItem.type === "Notes" ? "chat-tag-notes"
                : resItem.type === "Question Paper" ? "chat-tag-paper"
                : resItem.type === "Syllabus" ? "chat-tag-syllabus"
                : resItem.type === "Lab Program" ? "chat-tag-lab"
                : "chat-tag-notif";

              return (
                <div
                  key={resItem._id || idx}
                  className="chat-result-card"
                  onClick={() => {
                    onCloseModal();
                    navigate(action.path);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onCloseModal();
                      navigate(action.path);
                    }
                  }}
                >
                  <div className="chat-result-top-row">
                    <span className={`chat-result-type-tag ${typeClass}`}>
                      <span className="material-symbols-outlined text-[13px]">
                        {resItem.icon || "description"}
                      </span>
                      <span>{resItem.type}</span>
                    </span>
                    {resItem.subjectCode && (
                      <span className="chat-result-badge">{resItem.subjectCode}</span>
                    )}
                  </div>

                  <h5 className="chat-result-title">{resItem.title}</h5>

                  {resItem.description && (
                    <p className="chat-result-desc">{resItem.description}</p>
                  )}

                  <div className="chat-result-badges">
                    {resItem.branch && (
                      <span className="chat-result-badge">Dept: {resItem.branch}</span>
                    )}
                    {resItem.semester && (
                      <span className="chat-result-badge">Sem: {resItem.semester}</span>
                    )}
                    {resItem.regulation && (
                      <span className="chat-result-badge">{resItem.regulation}</span>
                    )}
                  </div>

                  <div className="chat-result-btn-row">
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      {resItem.subject || resItem.type}
                    </span>
                    <button
                      type="button"
                      className="chat-result-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseModal();
                        navigate(action.path);
                      }}
                    >
                      <span>{action.label}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function JntuChatbot({ embedded = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [modalInput, setModalInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [thinkingState, setThinkingState] = useState("searching");
  const [thinkingLabel, setThinkingLabel] = useState("Searching verified resources...");
  
  // Profile Wizard Session State
  const [profileSession, setProfileSession] = useState({
    active: false,
    step: null, // "NAME" | "HALLTICKET" | "BRANCH" | "YEAR_SEM" | "REGULATION" | "CGPA" | "ATTENDANCE"
    draft: {},
  });

  // Track scroll position: chatbot button should NOT appear when on hero section
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);

  const resultsBodyRef = useRef(null);
  const inputRef = useRef(null);
  const modalInputRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll ONLY the internal chatbot messages container without scrolling the window/page
  useEffect(() => {
    if (resultsBodyRef.current) {
      resultsBodyRef.current.scrollTop = resultsBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping, isModalOpen]);

  // Focus modal input when modal opens or stops typing
  useEffect(() => {
    if (isModalOpen && !isTyping) {
      setTimeout(() => {
        modalInputRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [isModalOpen, isTyping]);

  // Handle ESC key to close modal overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Listen for global open requests from Hero search, buttons, etc.
  useEffect(() => {
    const handleOpenEvent = (e) => {
      setIsModalOpen(true);
      const query = e?.detail?.query;
      if (query) {
        handleSend(query);
      } else if (messages.length === 0) {
        handleSend("Hi");
      }
    };
    window.addEventListener("open-jntu-chatbot", handleOpenEvent);
    return () => window.removeEventListener("open-jntu-chatbot", handleOpenEvent);
  }, []);

  // Floating chatbot icon: hide while in hero section, appear when leaving hero section
  useEffect(() => {
    const checkScrollPosition = () => {
      const heroEl = document.getElementById("hero-section");
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        // Hide button when hero section is still on screen (rect.bottom > 70)
        // Only show button after user has completely scrolled past the hero section
        const isPastHero = rect.bottom <= 70;
        setShowFloatingBtn(isPastHero);
      } else {
        // On other routes without hero section, show button
        setShowFloatingBtn(true);
      }
    };

    checkScrollPosition();
    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    window.addEventListener("resize", checkScrollPosition, { passive: true });

    const timer = setTimeout(checkScrollPosition, 120);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, []);

  // Helper to apply quick profile field updates from NLP
  const handleQuickProfileUpdate = (patch) => {
    const current = getStoredStudentData();
    const updated = { ...current, ...patch };
    saveStoredStudentData(updated);
    return updated;
  };

  const generateResponse = async (rawQuery, currentSession) => {
    const q = rawQuery.toLowerCase().trim();

    // =========================================================
    // 1. ACTIVE PROFILE BUILDER WIZARD STEPS
    // =========================================================
    if (currentSession.active && currentSession.step) {
      const step = currentSession.step;
      const draft = { ...currentSession.draft };

      if (step === "NAME") {
        draft.name = rawQuery.trim();
        draft.shortName = rawQuery.trim().split(" ")[0] || rawQuery.trim();
        setProfileSession({ active: true, step: "HALLTICKET", draft });
        return {
          text: `Nice to meet you, ${draft.name}! What is your University Hall Ticket Number? (e.g. 22B91A4201)`,
          suggestions: ["22B91A4201", "21B91A0501", "23B91A1201"],
          wizardActive: true,
        };
      }

      if (step === "HALLTICKET") {
        draft.hallTicket = rawQuery.trim().toUpperCase();
        setProfileSession({ active: true, step: "BRANCH", draft });
        return {
          text: `Got it (${draft.hallTicket})! What is your Department / Engineering Branch?`,
          suggestions: ["AIML", "CSE", "ECE", "EEE", "MECH", "CIVIL"],
          wizardActive: true,
        };
      }

      if (step === "BRANCH") {
        const branchCode = rawQuery.trim().toUpperCase();
        draft.branchCode = branchCode;
        const branchNames = {
          AIML: "Artificial Intelligence & Machine Learning",
          CSE: "Computer Science Engineering",
          ECE: "Electronics & Communication Engineering",
          EEE: "Electrical & Electronics Engineering",
          MECH: "Mechanical Engineering",
          ME: "Mechanical Engineering",
          CIVIL: "Civil Engineering",
          CE: "Civil Engineering",
        };
        draft.branch = branchNames[branchCode] || `${branchCode} Engineering`;
        setProfileSession({ active: true, step: "YEAR_SEM", draft });
        return {
          text: `Great, ${draft.branch}! Which Year & Semester are you in? (e.g. 3rd Year, 6th Semester)`,
          suggestions: ["3rd Year, 6th Sem", "2nd Year, 4th Sem", "4th Year, 8th Sem", "1st Year, 2nd Sem"],
          wizardActive: true,
        };
      }

      if (step === "YEAR_SEM") {
        const parts = rawQuery.trim().split(",");
        draft.year = parts[0]?.trim() || "3rd Year";
        draft.semester = parts[1]?.trim() || "6th Semester";
        setProfileSession({ active: true, step: "REGULATION", draft });
        return {
          text: `Which Academic Regulation applies to you?`,
          suggestions: ["R23 Regulation", "R20 Regulation", "R19 Regulation", "R16 Regulation"],
          wizardActive: true,
        };
      }

      if (step === "REGULATION") {
        draft.regulation = rawQuery.includes("R") ? rawQuery.trim() : `${rawQuery.trim()} Regulation`;
        setProfileSession({ active: true, step: "CGPA", draft });
        return {
          text: `What is your current Cumulative CGPA? (e.g. 8.85)`,
          suggestions: ["8.85", "9.10", "8.50", "9.40"],
          wizardActive: true,
        };
      }

      if (step === "CGPA") {
        const num = parseFloat(rawQuery.replace(/[^0-9.]/g, "")) || 8.5;
        draft.cgpa = num.toFixed(2);
        setProfileSession({ active: true, step: "ATTENDANCE", draft });
        return {
          text: `What is your current Attendance Percentage? (e.g. 89.4%)`,
          suggestions: ["90%", "89.4%", "85%", "95%"],
          wizardActive: true,
        };
      }

      if (step === "ATTENDANCE") {
        draft.attendance = rawQuery.includes("%") ? rawQuery.trim() : `${rawQuery.trim()}%`;
        draft.credits = draft.credits || "132 / 160";
        draft.role = "Student";

        // Save finalized profile
        const updated = handleQuickProfileUpdate(draft);
        setProfileSession({ active: false, step: null, draft: {} });

        return {
          text: `All set! Your verified Student Profile has been created and synced live across JNTU Circle.`,
          profilePreview: updated,
          action: { label: "Open Full Student Profile →", path: "/profile" },
          suggestions: ["CGPA Calculator", "Student Profile", "Notes"],
        };
      }
    }

    // =========================================================
    // 2. TRIGGER PROFILE BUILDER COMMAND
    // =========================================================
    if (
      (q.includes("build") && q.includes("profile")) ||
      (q.includes("create") && q.includes("profile")) ||
      (q.includes("setup") && q.includes("profile")) ||
      q === "build your student profile using chatbot" ||
      q === "build student profile with ai" ||
      q === "student profile" ||
      q === "update profile"
    ) {
      setProfileSession({ active: true, step: "NAME", draft: {} });
      return {
        text: `Let's build your verified JNTU Student Profile together! First, what is your Full Name?`,
        suggestions: ["Chinnu", "Jaswanth Reddy", "K. Suresh"],
        wizardActive: true,
      };
    }

    // =========================================================
    // 3. SINGLE-SHOT PROFILE NLP FIELD UPDATES
    // =========================================================
    const cgpaMatch = q.match(/(?:cgpa|gpa)\s*(?:is|to|:|=)?\s*([0-9]+\.?[0-9]*)/i);
    if (cgpaMatch && (q.includes("cgpa") || q.includes("gpa"))) {
      const newCgpa = parseFloat(cgpaMatch[1]).toFixed(2);
      const updated = handleQuickProfileUpdate({ cgpa: newCgpa });
      return {
        text: `Updated your Cumulative CGPA to ${newCgpa}! This reflects in your Student Profile and Calculator.`,
        profilePreview: updated,
        action: { label: "Open CGPA Calculator →", path: "/calculator" },
        suggestions: ["CGPA Calculator", "View Student Profile"],
      };
    }

    const nameMatch = rawQuery.match(/(?:my name is|name is|set name to|change name to)\s+([a-zA-Z\s]+)/i);
    if (nameMatch) {
      const newName = nameMatch[1].trim();
      const updated = handleQuickProfileUpdate({ name: newName, shortName: newName.split(" ")[0] });
      return {
        text: `Updated your profile name to "${newName}".`,
        profilePreview: updated,
        action: { label: "Open Student Profile →", path: "/profile" },
      };
    }

    const htMatch = rawQuery.match(/(?:hall ticket|roll number|reg no|ht no)\s*(?:is|to|:|=)?\s*([0-9a-zA-Z]+)/i);
    if (htMatch) {
      const newHt = htMatch[1].trim().toUpperCase();
      const updated = handleQuickProfileUpdate({ hallTicket: newHt });
      return {
        text: `Updated your Hall Ticket Number to ${newHt}.`,
        profilePreview: updated,
        action: { label: "Open Student Profile →", path: "/profile" },
      };
    }

    const attMatch = q.match(/attendance\s*(?:is|to|:|=)?\s*([0-9]+(?:\.[0-9]+)?%?)/i);
    if (attMatch) {
      const newAtt = attMatch[1].includes("%") ? attMatch[1] : `${attMatch[1]}%`;
      const updated = handleQuickProfileUpdate({ attendance: newAtt });
      return {
        text: `Updated your Attendance Rate to ${newAtt}.`,
        profilePreview: updated,
        action: { label: "Open Student Profile →", path: "/profile" },
      };
    }

    // =========================================================
    // 4. PLATFORM TOOLS & HELPERS
    // =========================================================

    if (q.includes("calculator") || q.includes("cgpa") || q.includes("sgpa") || q.includes("percentage") || q.includes("grade point")) {
      return {
        text: "Interactive CGPA & SGPA Evaluation Engine for R23, R20, R19 regulations with real-time grade calculations.",
        action: { label: "Open CGPA & SGPA Calculator →", path: "/calculator" },
        suggestions: ["SGPA Calculator", "Target CGPA Planner", "Grade Scale Reference"],
      };
    }

    if (q.includes("transcript") || q.includes("marks") || q.includes("result card") || q.includes("progress")) {
      return {
        text: "View your verified academic profile, semester progression, and CGPA trajectory in your Student Profile.",
        action: { label: "View Student Profile →", path: "/profile" },
        suggestions: ["CGPA Calculator", "Student Profile"],
      };
    }

    if (q.includes("upload") || q.includes("contribute") || q.includes("share material") || q.includes("submit note")) {
      return {
        text: "Centralized Academic Upload Portal: contribute lecture notes, question papers, syllabus copies, and lab programs.",
        action: { label: "Open Upload Materials Hub →", path: "/upload-materials" },
        suggestions: ["Upload Note", "Upload Question Paper", "Upload Lab Program"],
      };
    }

    if (q.startsWith("hi") || q.startsWith("hello") || q.startsWith("hey") || q.includes("good morning") || q.includes("good evening") || q === "help") {
      return {
        text: "Hello! I am your JNTU AI Academic Assistant. Ask me to find notes, question papers, syllabus, or lab programs for any subject, or build your student profile.",
        suggestions: ["Build Student Profile", "Data Structures Notes", "Python Lab Programs", "R23 AIML Syllabus", "CGPA Calculator"],
      };
    }

    // =========================================================
    // 5. ACCURATE ACADEMIC SEARCH & BRANCH HUB CONTENT
    // =========================================================
    const detectedBranch = detectBranchFromQuery(rawQuery);
    if (detectedBranch) {
      const branchHub = await getBranchHubData(detectedBranch);
      return {
        text: `Here is all official academic content & verified curriculum for ${branchHub.branch.name} (${branchHub.branch.code}):`,
        isBranch: true,
        branchHub,
        action: {
          label: `Browse ${branchHub.branch.code} in Full Catalog →`,
          path: `/search?query=${encodeURIComponent(branchHub.branch.code)}`,
        },
        suggestions: branchHub.suggestions,
      };
    }

    const searchRes = await performSearch(rawQuery);

    if (searchRes.results && searchRes.results.length > 0) {
      const allItems = searchRes.results.map((item) => {
        const action = formatResourceAction(item);
        return {
          ...item,
          actionPath: action.path,
          actionLabel: action.label,
        };
      });

      return {
        text: `Found ${searchRes.results.length} verified academic resource${searchRes.results.length > 1 ? "s" : ""} matching "${rawQuery}":`,
        matchedResources: allItems,
        relatedResources: searchRes.relatedResources,
        relatedSubjects: searchRes.relatedSubjects,
        action: {
          label: `View all ${searchRes.results.length} results in Portal →`,
          path: `/search?query=${encodeURIComponent(rawQuery)}`,
        },
        suggestions: searchRes.suggestedQueries.length > 0 ? searchRes.suggestedQueries : ["Notes", "Question Papers", "Syllabus"],
      };
    }

    return {
      text: `No exact records found for "${rawQuery}". Here are related curriculum subjects and syllabus topics you can check:`,
      relatedSubjects: searchRes.relatedSubjects,
      action: {
        label: `Search "${rawQuery}" in Full Catalog →`,
        path: `/search?query=${encodeURIComponent(rawQuery)}`,
      },
      suggestions: searchRes.suggestedQueries.length > 0 ? searchRes.suggestedQueries : ["Data Structures Notes", "Python Programming", "Operating Systems", "R23 Syllabus"],
    };
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || "").trim();
    if (!query) return;

    setIsModalOpen(true);

    const userMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: query,
    };

    const q = query.toLowerCase();
    let orbState = "searching";
    let orbLabel = `Searching academic resources for "${query}"...`;

    if (q.includes("profile") || profileSession.active) {
      orbState = "weaving";
      orbLabel = "Structuring student profile attributes...";
    } else if (q.includes("calculator") || q.includes("cgpa") || q.includes("sgpa")) {
      orbState = "solving";
      orbLabel = "Computing academic grade point metrics...";
    } else if (q.includes("lab") || q.includes("program") || q.includes("code")) {
      orbState = "solving";
      orbLabel = "Locating verified lab manuals & code...";
    } else if (q.includes("paper") || q.includes("pyq") || q.includes("question")) {
      orbState = "searching";
      orbLabel = "Searching semester question papers...";
    } else if (q.includes("notification") || q.includes("circular") || q.includes("report")) {
      orbState = "connecting";
      orbLabel = "Connecting to university records...";
    }

    setThinkingState(orbState);
    setThinkingLabel(orbLabel);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setModalInput("");
    setIsTyping(true);

    try {
      const responseData = await generateResponse(query, profileSession);
      const botMessage = {
        id: "bot-" + Date.now(),
        sender: "assistant",
        text: responseData.text,
        action: responseData.action,
        suggestions: responseData.suggestions,
        profilePreview: responseData.profilePreview,
        matchedResources: responseData.matchedResources,
        relatedResources: responseData.relatedResources,
        relatedSubjects: responseData.relatedSubjects,
        isBranch: responseData.isBranch,
        branchHub: responseData.branchHub,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("AI Assistant Search Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          sender: "assistant",
          text: `Here are resources matching "${query}":`,
          action: { label: `Search in Portal →`, path: `/search?query=${encodeURIComponent(query)}` },
          suggestions: ["Data Structures Notes", "Python Programming", "Syllabus"],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleHeroSubmit = (e) => {
    if (e) e.preventDefault();
    if (input.trim()) {
      handleSend(input);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleModalSubmit = (e) => {
    if (e) e.preventDefault();
    if (modalInput.trim()) {
      handleSend(modalInput);
    }
  };

  const handleHeroKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleHeroSubmit();
    }
  };

  const handleModalKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleModalSubmit();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStartProfileBuilder = () => {
    handleSend("Build your student profile using chatbot");
  };

  const hasHeroInput = input.trim().length > 0;
  const hasModalInput = modalInput.trim().length > 0;

  return (
    <>
      {/* Floating AI Assistant Trigger Button (Hidden on hero section, appears after leaving hero) */}
      <button
        type="button"
        className={`floating-ai-btn ${!showFloatingBtn || isModalOpen ? "hidden-hero" : ""}`}
        onClick={() => {
          setIsModalOpen(true);
          if (messages.length === 0) {
            handleSend("Hi");
          }
        }}
        title="Ask JNTU AI Copilot"
        aria-label="Ask JNTU AI Copilot"
      >
        <span className="floating-ai-pulse" aria-hidden="true" />
        <span className="material-symbols-outlined floating-ai-icon">neurology</span>
        <span className="floating-ai-tooltip">Ask JNTU AI Copilot</span>
      </button>

      {/* Embedded In-page Command Bar (optional) */}
      {embedded && (
        <div className="hero-ai-container">
          <div className="hero-ai-bar-anchor">
            <form className="hero-ai-bar" onSubmit={handleHeroSubmit}>
              <div
                className="hero-ai-avatar-badge"
                title="Open JNTU AI Chatbot"
                onClick={() => {
                  setIsModalOpen(true);
                  if (messages.length === 0) {
                    handleSend("Hi");
                  }
                }}
              >
                <span className="material-symbols-outlined text-[20px] text-[#C4B5FD]">
                  neurology
                </span>
              </div>

              <input
                ref={inputRef}
                type="text"
                className="hero-ai-input"
                placeholder="Ask JNTU AI or say 'Build my student profile' or enter branch (CSE, AIML, ECE)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleHeroKeyDown}
                aria-label="Ask JNTU AI"
                autoComplete="off"
                style={{ outline: "none", border: "none", boxShadow: "none" }}
              />

              {/* ACTION CONTROLS */}
              <div className="hero-ai-send-wrapper">
                {hasHeroInput && (
                  <button
                    type="button"
                    className="hero-ai-clear-btn"
                    onClick={() => setInput("")}
                    title="Clear input"
                    aria-label="Clear input"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-[#8B5CF6] hover:bg-[#7c4def] text-[#F5F5FA] flex items-center justify-center shrink-0 transition-all shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group/btn"
                  aria-label="Send query"
                  disabled={!hasHeroInput}
                  title="Send query"
                >
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover/btn:translate-x-0.5">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            {/* Quick Launch Chips for Student Profile & Branch Hubs */}
            <div className="hero-ai-starter-chips">
              <button
                type="button"
                className="hero-ai-starter-pill starter-pill-highlight"
                onClick={handleStartProfileBuilder}
              >
                <span>Build Student Profile</span>
              </button>
              <button
                type="button"
                className="hero-ai-quick-pill"
                onClick={() => handleSend("CSE")}
              >
                <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                  terminal
                </span>
                <span>CSE</span>
              </button>
              <button
                type="button"
                className="hero-ai-quick-pill"
                onClick={() => handleSend("AIML")}
              >
                <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                  smart_toy
                </span>
                <span>AIML</span>
              </button>
              <button
                type="button"
                className="hero-ai-quick-pill"
                onClick={() => handleSend("ECE")}
              >
                <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                  memory
                </span>
                <span>ECE</span>
              </button>
              <button
                type="button"
                className="hero-ai-quick-pill"
                onClick={() => handleSend("Mechanical")}
              >
                <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                  settings
                </span>
                <span>ME</span>
              </button>
              <button
                type="button"
                className="hero-ai-quick-pill"
                onClick={() => handleSend("Civil")}
              >
                <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                  apartment
                </span>
                <span>Civil</span>
              </button>
              <button
                type="button"
                className="hero-ai-quick-pill"
                onClick={() => handleSend("EEE")}
              >
                <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                  bolt
                </span>
                <span>EEE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          POPUP MODAL & OVERLAY (MATCHING STITCH FRONTEND PALETTE)
          ========================================================= */}
      {isModalOpen && (
        <div
          className="chat-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="JNTU AI Chatbot Conversation"
        >
          <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="chat-modal-header">
              <div className="chat-modal-header-left">
                <div className="chat-modal-avatar-wrapper">
                  <span className="material-symbols-outlined text-[20px] text-[#C4B5FD]">
                    neurology
                  </span>
                </div>
                <div>
                  <div className="chat-modal-title-row">
                    <h3 className="chat-modal-title">JNTU Circle AI Assistant</h3>
                    <span className="chat-modal-role-badge">
                      <span>Online</span>
                    </span>
                  </div>
                  <p className="chat-modal-subtitle">
                    Live academic guidance, profile manager & instant answers
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                className="chat-modal-close-btn"
                onClick={handleCloseModal}
                title="Close chat overlay (Esc)"
                aria-label="Close chat overlay"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Conversation Body (Scrollable messages) */}
            <div className="chat-modal-body" ref={resultsBodyRef}>
              {messages.length === 0 ? (
                <div className="chat-modal-empty-state">
                  <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center text-[#C4B5FD] shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-3">
                    <span className="material-symbols-outlined text-[32px] text-[#C4B5FD]">
                      neurology
                    </span>
                  </div>
                  <h4>How can I help you today?</h4>
                  <p>Ask about notes, syllabus, question papers, or build your student profile.</p>
                  <div className="chat-modal-quick-suggestions">
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("Build your student profile using chatbot")}
                    >
                      <span>Build Student Profile</span>
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("CSE")}
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                        terminal
                      </span>
                      <span>CSE Hub</span>
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("AIML")}
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                        smart_toy
                      </span>
                      <span>AIML Hub</span>
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("ECE")}
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                        memory
                      </span>
                      <span>ECE Hub</span>
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("Mechanical")}
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                        settings
                      </span>
                      <span>ME Hub</span>
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("Civil")}
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                        apartment
                      </span>
                      <span>Civil Hub</span>
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("EEE")}
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                        bolt
                      </span>
                      <span>EEE Hub</span>
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("CGPA & SGPA Calculator")}
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#A3A3B5]">
                        calculate
                      </span>
                      <span>CGPA Calculator</span>
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`hero-ai-msg-item hero-ai-msg-${msg.sender}`}
                  >
                    {msg.sender === "user" ? (
                      <div className="hero-ai-user-card">
                        <span className="hero-ai-user-label">You</span>
                        <span className="hero-ai-user-text">{msg.text}</span>
                      </div>
                    ) : (
                      <div className="hero-ai-assistant-card">
                        <div className="hero-ai-assistant-header">
                          <div className="hero-ai-msg-avatar">
                            <span className="material-symbols-outlined text-[15px] text-[#C4B5FD]">
                              neurology
                            </span>
                          </div>
                          <span className="hero-ai-tag hero-ai-tag-bot">JNTU AI</span>
                        </div>

                        <div className="hero-ai-bot-content">
                          <p className="hero-ai-text">{msg.text}</p>

                          {/* Interactive Profile Sync Card */}
                          {msg.profilePreview && (
                            <div className="hero-ai-profile-card">
                              <div className="hero-ai-profile-top">
                                <div className="hero-ai-profile-avatar-box">
                                  <span className="material-symbols-outlined text-[20px] text-[#ffffff]">
                                    school
                                  </span>
                                </div>
                                <div>
                                  <h4 className="hero-ai-profile-name">{msg.profilePreview.name || "Student"}</h4>
                                  <span className="hero-ai-profile-ht">
                                    {msg.profilePreview.hallTicket || "22B91A4201"} • {msg.profilePreview.branchCode || "AIML"}
                                  </span>
                                </div>
                              </div>
                              <div className="hero-ai-profile-metrics">
                                <div className="hero-ai-metric-item">
                                  <span>CGPA</span>
                                  <strong>{msg.profilePreview.cgpa || "8.85"}</strong>
                                </div>
                                <div className="hero-ai-metric-item">
                                  <span>Attendance</span>
                                  <strong>{msg.profilePreview.attendance || "89.4%"}</strong>
                                </div>
                                <div className="hero-ai-metric-item">
                                  <span>Regulation</span>
                                  <strong>{msg.profilePreview.regulation || "R20"}</strong>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Interactive Branch Hub View */}
                          {msg.isBranch && msg.branchHub && (
                            <BranchHubView
                              hub={msg.branchHub}
                              onSelectQuery={(q) => handleSend(q)}
                              onCloseModal={handleCloseModal}
                            />
                          )}

                          {/* Interactive Academic Resource Cards */}
                          {msg.matchedResources && msg.matchedResources.length > 0 && (
                            <div className="chat-result-cards">
                              {msg.matchedResources.map((resItem, rIdx) => {
                                const typeClass =
                                  resItem.type === "Notes" ? "chat-tag-notes"
                                  : resItem.type === "Question Paper" ? "chat-tag-paper"
                                  : resItem.type === "Syllabus" ? "chat-tag-syllabus"
                                  : resItem.type === "Lab Program" ? "chat-tag-lab"
                                  : "chat-tag-notif";

                                return (
                                  <div
                                    key={resItem._id || rIdx}
                                    className="chat-result-card"
                                    onClick={() => {
                                      handleCloseModal();
                                      navigate(resItem.actionPath);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        handleCloseModal();
                                        navigate(resItem.actionPath);
                                      }
                                    }}
                                  >
                                    <div className="chat-result-top-row">
                                      <span className={`chat-result-type-tag ${typeClass}`}>
                                        <span className="material-symbols-outlined text-[13px]">
                                          {resItem.icon || "description"}
                                        </span>
                                        <span>{resItem.type}</span>
                                      </span>
                                      {resItem.subjectCode && (
                                        <span className="chat-result-badge">{resItem.subjectCode}</span>
                                      )}
                                    </div>

                                    <h5 className="chat-result-title">{resItem.title}</h5>

                                    {resItem.description && (
                                      <p className="chat-result-desc">{resItem.description}</p>
                                    )}

                                    <div className="chat-result-badges">
                                      {resItem.branch && (
                                        <span className="chat-result-badge">Dept: {resItem.branch}</span>
                                      )}
                                      {resItem.semester && (
                                        <span className="chat-result-badge">Sem: {resItem.semester}</span>
                                      )}
                                      {resItem.regulation && (
                                        <span className="chat-result-badge">{resItem.regulation}</span>
                                      )}
                                      {resItem.credits && (
                                        <span className="chat-result-badge">{resItem.credits} Credits</span>
                                      )}
                                    </div>

                                    <div className="chat-result-btn-row">
                                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                                        {resItem.subject || resItem.type}
                                      </span>
                                      <button
                                        type="button"
                                        className="chat-result-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCloseModal();
                                          navigate(resItem.actionPath);
                                        }}
                                      >
                                        <span>{resItem.actionLabel}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Related Resources & Sibling Subjects Explorer */}
                          {((msg.relatedResources && msg.relatedResources.length > 0) || (msg.relatedSubjects && msg.relatedSubjects.length > 0)) && (
                            <div className="chat-related-box">
                              <div className="chat-related-header">
                                <span className="material-symbols-outlined text-[15px] text-[#C4B5FD]">
                                  lightbulb
                                </span>
                                <span>Related Content & Sibling Subjects:</span>
                              </div>
                              <div className="chat-related-chips">
                                {msg.relatedResources && msg.relatedResources.map((rel, rIdx) => (
                                  <button
                                    key={`rel-res-${rIdx}`}
                                    type="button"
                                    className="chat-related-pill"
                                    onClick={() => handleSend(`${rel.subject || rel.title} ${rel.type}`)}
                                    title={`Search related ${rel.type}`}
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {rel.icon || "description"}
                                    </span>
                                    <span>{rel.type}: {rel.subject || rel.title}</span>
                                  </button>
                                ))}
                                {msg.relatedSubjects && msg.relatedSubjects.map((sub, sIdx) => (
                                  <button
                                    key={`rel-sub-${sIdx}`}
                                    type="button"
                                    className="chat-related-pill"
                                    onClick={() => handleSend(`${sub.name} notes`)}
                                    title={`Find resources for ${sub.name}`}
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      school
                                    </span>
                                    <span>{sub.name} ({sub.branch})</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {msg.action && (
                            <button
                              type="button"
                              className="hero-ai-action-btn"
                              onClick={() => {
                                handleCloseModal();
                                navigate(msg.action.path);
                              }}
                            >
                              {msg.action.label}
                            </button>
                          )}

                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="hero-ai-chips">
                              {msg.suggestions.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="hero-ai-chip"
                                  onClick={() => handleSend(item)}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isTyping && (
                <div className="hero-ai-msg-item hero-ai-msg-assistant">
                  <div className="hero-ai-assistant-card hero-ai-thinking-card">
                    <div className="hero-ai-thinking-inline">
                      <ThinkingOrb state={thinkingState} size={20} dark="true" />
                      <span className="hero-ai-thinking-text">{thinkingLabel}</span>
                      <span className="hero-ai-thinking-badge">{thinkingState}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Input Footer (Interactive Chat Control matching Frontend Palette) */}
            <div className="chat-modal-footer">
              <form className="chat-modal-input-bar" onSubmit={handleModalSubmit}>
                <input
                  ref={modalInputRef}
                  type="text"
                  className="chat-modal-input-field"
                  placeholder={
                    profileSession.active
                      ? "Type your response here..."
                      : "Type your message or answer..."
                  }
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  onKeyDown={handleModalKeyDown}
                  autoComplete="off"
                />

                {hasModalInput && (
                  <button
                    type="button"
                    className="chat-modal-clear-btn"
                    onClick={() => setModalInput("")}
                    title="Clear text"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-[#8B5CF6] hover:bg-[#7c4def] text-[#F5F5FA] flex items-center justify-center shrink-0 transition-all shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group/btn"
                  disabled={!hasModalInput}
                  title="Send message"
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover/btn:translate-x-0.5">
                    send
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default JntuChatbot;
