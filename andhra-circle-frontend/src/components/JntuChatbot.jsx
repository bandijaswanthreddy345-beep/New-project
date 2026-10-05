import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BorderBeam } from "border-beam";
import { BotAvatar } from "bot-avatars";
import { MetalFx, useMetalBend } from "metal-fx";
import { ThinkingOrb } from "thinking-orbs";
import { getStoredStudentData, saveStoredStudentData } from "../data/studentData";

function JntuChatbot() {
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

  const resultsBodyRef = useRef(null);
  const inputRef = useRef(null);
  const modalInputRef = useRef(null);
  const sendMetalRef = useRef(null);
  const modalSendMetalRef = useRef(null);
  const navigate = useNavigate();

  useMetalBend(sendMetalRef);
  useMetalBend(modalSendMetalRef);

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

  // Helper to apply quick profile field updates from NLP
  const handleQuickProfileUpdate = (patch) => {
    const current = getStoredStudentData();
    const updated = { ...current, ...patch };
    saveStoredStudentData(updated);
    return updated;
  };

  const generateResponse = (rawQuery, currentSession) => {
    const q = rawQuery.toLowerCase().trim();

    // =========================================================
    // 1. ACTIVE PROFILE BUILDER WIZARD STEPS
    // =========================================================
    if (currentSession.active && currentSession.step) {
      const step = currentSession.step;
      const draft = { ...currentSession.draft };

      if (step === "NAME") {
        draft.name = rawQuery.trim();
        draft.shortName = rawQuery.trim().split(" ")[0];
        setProfileSession({ active: true, step: "HALLTICKET", draft });
        return {
          text: `Awesome, ${draft.name}! What is your JNTU Hall Ticket / Roll Number? (e.g. 22B91A4201)`,
          suggestions: ["22B91A4201", "21B91A0501", "23B91A0501"],
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
          text: `🎉 All set! Your Student Profile has been created and synced live across JNTU Circle.`,
          profilePreview: updated,
          action: { label: "Open Full Student Profile →", path: "/profile" },
          suggestions: ["🎓 View JNTU Reports", "📊 CGPA Calculator", "📁 Upload Materials"],
        };
      }
    }

    // =========================================================
    // 2. TRIGGER PROFILE BUILDER COMMAND
    // =========================================================
    if (
      q.includes("build") && q.includes("profile") ||
      q.includes("create") && q.includes("profile") ||
      q.includes("setup") && q.includes("profile") ||
      q === "build your student profile using chatbot" ||
      q === "build student profile with ai" ||
      q === "student profile" ||
      q === "update profile"
    ) {
      setProfileSession({ active: true, step: "NAME", draft: {} });
      return {
        text: `🎓 Let's build your verified JNTU Student Profile together! First, what is your Full Name?`,
        suggestions: ["Chinnu", "Jaswanth Reddy", "K. Suresh"],
        wizardActive: true,
      };
    }

    // =========================================================
    // 3. SINGLE-SHOT PROFILE NLP FIELD UPDATES
    // =========================================================
    // CGPA Update: e.g. "update cgpa to 9.2", "cgpa 8.9", "set cgpa 9.0"
    const cgpaMatch = q.match(/(?:cgpa|gpa)\s*(?:is|to|:|=)?\s*([0-9]+\.?[0-9]*)/i);
    if (cgpaMatch && (q.includes("cgpa") || q.includes("gpa"))) {
      const newCgpa = parseFloat(cgpaMatch[1]).toFixed(2);
      const updated = handleQuickProfileUpdate({ cgpa: newCgpa });
      return {
        text: `✅ Updated your Cumulative CGPA to ${newCgpa}! This reflects in your JNTU Reports and Calculator.`,
        profilePreview: updated,
        action: { label: "View JNTU Reports →", path: "/reports" },
        suggestions: ["📊 CGPA Calculator", "🎓 View Student Profile"],
      };
    }

    // Name Update: e.g. "my name is Alex", "change name to Priya"
    const nameMatch = rawQuery.match(/(?:my name is|name is|set name to|change name to)\s+([a-zA-Z\s]+)/i);
    if (nameMatch) {
      const newName = nameMatch[1].trim();
      const updated = handleQuickProfileUpdate({ name: newName, shortName: newName.split(" ")[0] });
      return {
        text: `✅ Updated your profile name to "${newName}".`,
        profilePreview: updated,
        action: { label: "Open Student Profile →", path: "/profile" },
      };
    }

    // Hall Ticket Update: e.g. "my hall ticket is 22B91A4201"
    const htMatch = rawQuery.match(/(?:hall ticket|roll number|reg no|ht no)\s*(?:is|to|:|=)?\s*([0-9a-zA-Z]+)/i);
    if (htMatch) {
      const newHt = htMatch[1].trim().toUpperCase();
      const updated = handleQuickProfileUpdate({ hallTicket: newHt });
      return {
        text: `✅ Updated your Hall Ticket Number to ${newHt}.`,
        profilePreview: updated,
        action: { label: "Open Student Profile →", path: "/profile" },
      };
    }

    // Attendance Update: e.g. "attendance 92%"
    const attMatch = q.match(/attendance\s*(?:is|to|:|=)?\s*([0-9]+(?:\.[0-9]+)?%?)/i);
    if (attMatch) {
      const newAtt = attMatch[1].includes("%") ? attMatch[1] : `${attMatch[1]}%`;
      const updated = handleQuickProfileUpdate({ attendance: newAtt });
      return {
        text: `✅ Updated your Attendance Rate to ${newAtt}.`,
        profilePreview: updated,
        action: { label: "Open Student Profile →", path: "/profile" },
      };
    }

    // =========================================================
    // 4. GENERAL PLATFORM QUERIES & NAVIGATION
    // =========================================================

    // Calculator Query
    if (q.includes("calculator") || q.includes("cgpa") || q.includes("sgpa") || q.includes("percentage") || q.includes("grade point")) {
      return {
        text: "Interactive CGPA & SGPA Evaluation Engine for R23, R20, R19 regulations with real-time grade calculations.",
        action: { label: "Open CGPA & SGPA Calculator →", path: "/calculator" },
        suggestions: ["SGPA Calculator", "Target CGPA Planner", "Grade Scale Reference"],
      };
    }

    // Reports Query
    if (q.includes("report") || q.includes("transcript") || q.includes("marks") || q.includes("result card") || q.includes("progress")) {
      return {
        text: "Official JNTU Academic Reports: verified semester breakdown, CGPA trajectory, credit audits, and printable transcript.",
        action: { label: "Open JNTU Reports →", path: "/reports" },
        suggestions: ["Print Official Transcript", "Credit Tracker", "SGPA History"],
      };
    }

    // Upload Materials Query
    if (q.includes("upload") || q.includes("contribute") || q.includes("share material") || q.includes("submit note")) {
      return {
        text: "Centralized Academic Upload Portal: contribute lecture notes, question papers, syllabus copies, and lab programs.",
        action: { label: "Open Upload Materials Hub →", path: "/upload-materials" },
        suggestions: ["Upload Note", "Upload Question Paper", "Upload Lab Program"],
      };
    }

    // Check for Notes
    if (q.includes("note") || q.includes("material") || q.includes("lecture") || q.includes("pdf") || q.includes("textbook")) {
      return {
        text: "Verified B.Tech notes & materials for R20 & R23 across all departments.",
        action: { label: "Open Notes Catalog →", path: "/notes" },
        suggestions: ["CSE Notes", "ECE Notes", "Civil Notes"],
      };
    }

    // Check for Question Papers
    if (q.includes("paper") || q.includes("question") || q.includes("pyq") || q.includes("mid") || q.includes("model")) {
      return {
        text: "Semester-end & mid exam question papers categorized by regulation and branch.",
        action: { label: "Browse Question Papers →", path: "/papers" },
        suggestions: ["R20 Papers", "R23 Papers", "Mid Exam Papers"],
      };
    }

    // Check for Syllabus
    if (q.includes("syllabus") || q.includes("curriculum") || q.includes("credit") || q.includes("course structure")) {
      return {
        text: "Official JNTU academic curriculum, credits, and semester syllabus.",
        action: { label: "View Syllabus →", path: "/syllabus" },
        suggestions: ["R20 Syllabus", "R23 Syllabus"],
      };
    }

    // Check for Lab Programs
    if (q.includes("lab") || q.includes("program") || q.includes("code") || q.includes("manual") || q.includes("viva") || q.includes("practical")) {
      return {
        text: "Verified lab manuals, source codes, and practical viva exercises.",
        action: { label: "Open Lab Programs →", path: "/lab-programs" },
        suggestions: ["Java Lab", "Python Lab", "Data Structures Lab"],
      };
    }

    // Check for Notifications / Circulars
    if (q.includes("notification") || q.includes("circular") || q.includes("timetable") || q.includes("exam") || q.includes("result") || q.includes("alert")) {
      return {
        text: "Official JNTU circulars, exam timetables, fee alerts, and university circulars.",
        action: { label: "View Notifications →", path: "/notifications" },
        suggestions: ["Exam Timetable", "Academic Calendar"],
      };
    }

    // Check for Departments / Branches
    if (q.includes("department") || q.includes("branch")) {
      return {
        text: "Dedicated study resources for CSE, ECE, EEE, MECH, CIVIL & AIML branches.",
        action: { label: "Explore Department Notes →", path: "/notes" },
        suggestions: ["CSE", "ECE", "EEE", "MECH", "CIVIL", "AIML"],
      };
    }

    // Greetings
    if (q.startsWith("hi") || q.startsWith("hello") || q.startsWith("hey") || q.includes("good morning") || q.includes("good evening") || q === "help") {
      return {
        text: "Hello! I am your JNTU AI Assistant. I can help you build your student profile, calculate CGPA/SGPA, view JNTU reports, or find study notes.",
        suggestions: ["🚀 Build Student Profile with AI", "📊 CGPA Calculator", "🎓 JNTU Reports", "Notes"],
      };
    }

    // Fallback search
    return {
      text: `Resources matching "${rawQuery}": search verified portal database records.`,
      action: { label: `Search "${rawQuery}" in Portal →`, path: `/search?query=${encodeURIComponent(rawQuery)}` },
      suggestions: ["🚀 Build Student Profile with AI", "Notes", "Question Papers"],
    };
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || "").trim();
    if (!query) return;

    // Immediately open the overlay modal
    setIsModalOpen(true);

    const userMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: query,
    };

    const q = query.toLowerCase();
    let orbState = "searching";
    let orbLabel = "Searching verified resources...";

    if (q.includes("profile") || profileSession.active) {
      orbState = "weaving";
      orbLabel = "Structuring student profile attributes...";
    } else if (q.includes("calculator") || q.includes("cgpa") || q.includes("sgpa")) {
      orbState = "solving";
      orbLabel = "Computing academic grade point metrics...";
    } else if (q.includes("lab") || q.includes("program") || q.includes("code")) {
      orbState = "solving";
      orbLabel = "Resolving lab programs & solutions...";
    } else if (q.includes("notification") || q.includes("circular") || q.includes("report")) {
      orbState = "connecting";
      orbLabel = "Connecting to university records...";
    } else if (q.startsWith("hi") || q.startsWith("hello") || q.startsWith("hey")) {
      orbState = "working";
      orbLabel = "Initializing JNTU AI Assistant...";
    }

    setThinkingState(orbState);
    setThinkingLabel(orbLabel);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setModalInput("");
    setIsTyping(true);

    setTimeout(() => {
      const responseData = generateResponse(query, profileSession);
      const botMessage = {
        id: "bot-" + Date.now(),
        sender: "assistant",
        text: responseData.text,
        action: responseData.action,
        suggestions: responseData.suggestions,
        profilePreview: responseData.profilePreview,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 550);
  };

  // Submit from the Hero home command bar
  const handleHeroSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      handleSend(input);
    } else {
      setIsModalOpen(true);
    }
  };

  // Submit from the Modal Overlay input bar
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (modalInput.trim()) {
      handleSend(modalInput);
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
    <div className="hero-ai-container">
      {/* =========================================================
          HERO HOME COMMAND BAR (CLEAN TRIGGER BAR)
          ========================================================= */}
      <div className="hero-ai-bar-anchor">
        <BorderBeam
          size="sm"
          colorVariant="gold"
          strength={0.5}
          active={true}
          theme="dark"
          borderRadius={18}
          className="hero-ai-beam"
        >
          <form className="hero-ai-bar" onSubmit={handleHeroSubmit}>
            <div
              className="hero-ai-avatar-badge"
              title="Click to open JNTU AI Chatbot"
              onClick={() => {
                setIsModalOpen(true);
                if (messages.length === 0) {
                  handleSend("Hi");
                }
              }}
            >
              <BotAvatar
                type="ghost"
                color="#FFFFFF"
                size={32}
                state={isTyping ? "working" : "default"}
              />
            </div>

            <input
              ref={inputRef}
              type="text"
              className="hero-ai-input"
              placeholder="Ask JNTU AI or say 'Build my student profile'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Ask JNTU AI"
              autoComplete="off"
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
                  ✕
                </button>
              )}

              <MetalFx
                ref={sendMetalRef}
                preset="chromatic"
                variant="circle"
                theme="dark"
                strength={1}
                innerShadow
                className="hero-ai-metal-send-wrapper"
              >
                <button
                  type="submit"
                  className="hero-ai-send-btn"
                  aria-label="Send query and open overlay"
                  disabled={!hasHeroInput}
                  title="Send query"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </MetalFx>
            </div>
          </form>
        </BorderBeam>

        {/* Clean, centered Quick Launch Chip for Student Profile Builder */}
        <div className="hero-ai-starter-chips">
          <button
            type="button"
            className="hero-ai-starter-pill starter-pill-highlight"
            onClick={handleStartProfileBuilder}
          >
            <span className="starter-pill-sparkle">✨</span>
            <span>Build your Student Profile using AI Chatbot</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          POPUP MODAL & OVERLAY (COMMUNICATION IS DONE HERE)
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
                  <BotAvatar
                    type="ghost"
                    color="#FFFFFF"
                    size={28}
                    state={isTyping ? "working" : "default"}
                  />
                  <span className="chat-modal-status-dot" />
                </div>
                <div>
                  <div className="chat-modal-title-row">
                    <h3 className="chat-modal-title">JNTU Circle AI Assistant</h3>
                    <span className="chat-modal-role-badge">
                      {profileSession.active ? "Profile Wizard Active" : "Online"}
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
                ✕
              </button>
            </div>

            {/* Modal Conversation Body (Scrollable messages) */}
            <div className="chat-modal-body" ref={resultsBodyRef}>
              {messages.length === 0 ? (
                <div className="chat-modal-empty-state">
                  <BotAvatar type="ghost" color="#FFFFFF" size={48} state="default" />
                  <h4>How can I help you today?</h4>
                  <p>Ask about notes, syllabus, question papers, or build your student profile.</p>
                  <div className="chat-modal-quick-suggestions">
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("Build your student profile using chatbot")}
                    >
                      ✨ Build Student Profile
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("CGPA & SGPA Calculator")}
                    >
                      📊 CGPA Calculator
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("JNTU Reports")}
                    >
                      🎓 JNTU Reports
                    </button>
                    <button
                      type="button"
                      className="chat-modal-sugg-pill"
                      onClick={() => handleSend("Notes for AIML")}
                    >
                      📘 AIML Notes
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
                            <BotAvatar
                              type="ghost"
                              color="#FFFFFF"
                              size={18}
                              state="default"
                            />
                          </div>
                          <span className="hero-ai-tag hero-ai-tag-bot">JNTU AI</span>
                        </div>

                        <div className="hero-ai-bot-content">
                          <p className="hero-ai-text">{msg.text}</p>

                          {/* Interactive Profile Sync Card */}
                          {msg.profilePreview && (
                            <div className="hero-ai-profile-card">
                              <div className="hero-ai-profile-top">
                                <div className="hero-ai-profile-avatar-box">🎓</div>
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

            {/* Modal Input Footer (Interactive Chat Control) */}
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
                  autoComplete="off"
                />

                {hasModalInput && (
                  <button
                    type="button"
                    className="chat-modal-clear-btn"
                    onClick={() => setModalInput("")}
                    title="Clear text"
                  >
                    ✕
                  </button>
                )}

                <MetalFx
                  ref={modalSendMetalRef}
                  preset="chromatic"
                  variant="circle"
                  theme="dark"
                  strength={1}
                  innerShadow
                  className="chat-modal-metal-wrapper"
                >
                  <button
                    type="submit"
                    className="chat-modal-send-btn"
                    disabled={!hasModalInput}
                    title="Send message"
                    aria-label="Send message"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </MetalFx>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JntuChatbot;
