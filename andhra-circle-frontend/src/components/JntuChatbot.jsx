import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import JntuBotAvatar from "./JntuBotAvatar";
import { ThinkingOrb } from "thinking-orbs";
import { getStoredStudentData, saveStoredStudentData } from "../data/studentData";
import {
  performSearch,
  formatResourceAction,
  detectBranchFromQuery,
  getBranchHubData,
  getAcademicKnowledgeAnswer,
  getSemesterCurriculumAnswer,
  BRANCH_DIRECTORY,
} from "../utils/searchEngine";
import {
  getConversationalAnswer,
  getSubjectConceptAnswer,
  getStudyAdviceAnswer,
  synthesizeDynamicAcademicResponse,
} from "../utils/aiReasoningEngine";

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
        <div className="chat-branch-icon">{branch.icon || "🎓"}</div>
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
          📂 All ({hub.totalCount})
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "notes" ? "is-active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          📘 Notes ({counts.notes})
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "papers" ? "is-active" : ""}`}
          onClick={() => setActiveTab("papers")}
        >
          📝 Papers ({counts.papers})
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "syllabus" ? "is-active" : ""}`}
          onClick={() => setActiveTab("syllabus")}
        >
          📑 Syllabus ({counts.syllabus})
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "labs" ? "is-active" : ""}`}
          onClick={() => setActiveTab("labs")}
        >
          💻 Labs ({counts.labs})
        </button>
        <button
          type="button"
          className={`chat-branch-tab ${activeTab === "curriculum" ? "is-active" : ""}`}
          onClick={() => setActiveTab("curriculum")}
        >
          🗓️ Curriculum (8 Sems)
        </button>
      </div>

      {/* Direct Quick Action Links */}
      <div className="chat-branch-quick-links">
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/notes?branch=${branch.code}`);
          }}
        >
          📘 {branch.code} Notes Portal →
        </button>
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/papers?branch=${branch.code}`);
          }}
        >
          📝 {branch.code} Question Papers →
        </button>
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/syllabus?branch=${branch.code}`);
          }}
        >
          📑 {branch.code} Syllabus →
        </button>
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/lab-programs?branch=${branch.code}`);
          }}
        >
          🔬 {branch.code} Lab Manuals →
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === "curriculum" ? (
        <div className="chat-curriculum-list">
          {semesters.map((sem) => (
            <div key={sem.semNum} className="chat-sem-card">
              <div className="chat-sem-title">
                <span>{sem.semName}</span>
                <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                  {sem.subjects.length} Subjects
                </span>
              </div>
              <div className="chat-sem-subjects-wrap">
                {sem.subjects.map((sub, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    className="chat-sem-sub-pill"
                    onClick={() => onSelectQuery(`${sub.name} notes`)}
                    title={`Find notes and syllabus for ${sub.name}`}
                  >
                    <span>{sub.isLab ? "💻" : "📚"}</span>
                    <span>{sub.name}</span>
                    <span className="chat-sem-sub-credits">({sub.credits}C)</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="chat-result-cards">
          {currentItems.length === 0 ? (
            <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
              No {activeTab} recorded yet for {branch.code}. Check other categories or open the full catalog.
            </div>
          ) : (
            currentItems.map((resItem, rIdx) => {
              const action = formatResourceAction(resItem);
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
                      <span>{resItem.icon || "📄"}</span>
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

/**
 * Interactive Semester Curriculum Card
 * Displays the R23/R20 course breakdown with credits and instant material links.
 */
function SemesterCurriculumCard({ data, onSelectQuery, onCloseModal }) {
  const navigate = useNavigate();
  if (!data) return null;
  const { branchCode, semesterCode, semesterTitle, totalCredits, subjects } = data;

  return (
    <div className="chat-sem-curriculum-card">
      <div className="chat-sem-curriculum-header">
        <div className="chat-sem-curriculum-badge">R23 Regulation</div>
        <h4>{semesterTitle}</h4>
        <span className="chat-sem-curriculum-credits">
          {totalCredits} Total Credits • {subjects.length} Courses
        </span>
      </div>

      <div className="chat-sem-curriculum-grid">
        {subjects.map((sub, sIdx) => (
          <div key={sIdx} className="chat-sem-course-item">
            <div className="chat-sem-course-info">
              <span className="chat-sem-course-icon">{sub.isLab ? "💻" : "📚"}</span>
              <div className="chat-sem-course-text">
                <span className="chat-sem-course-name">{sub.name}</span>
                <span className="chat-sem-course-type">
                  {sub.isLab ? "Practical / Lab" : "Theory Course"} • {sub.credits} Credits
                </span>
              </div>
            </div>
            <button
              type="button"
              className="chat-sem-course-find-btn"
              onClick={() => onSelectQuery(`${sub.name} notes`)}
              title={`Find ${sub.name} notes & papers`}
            >
              Get Notes →
            </button>
          </div>
        ))}
      </div>

      <div className="chat-sem-curriculum-footer">
        <button
          type="button"
          className="chat-branch-link-btn"
          onClick={() => {
            onCloseModal();
            navigate(`/syllabus?branch=${branchCode}`);
          }}
        >
          📑 Open Official {branchCode} Syllabus copy →
        </button>
      </div>
    </div>
  );
}

/**
 * Text Formatter for Assistant Messages
 * Parses bold markdown (**text**), inline code (`code`), bullets (•), and line breaks.
 */
function formatBotText(text) {
  if (!text) return null;
  const lines = text.split("\n");

  return (
    <div className="hero-ai-formatted-text">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="hero-ai-text-spacer" />;
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ") || trimmed.startsWith("* ");
        const content = isBullet ? trimmed.replace(/^[•\-\*]\s*/, "") : line;

        // Split by bold (**text**) and code (`code`)
        const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="hero-ai-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={pIdx} className="hero-ai-code">
                {part.slice(1, -1)}
              </code>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className="hero-ai-bullet-item">
              <span className="hero-ai-bullet-dot">•</span>
              <span className="hero-ai-bullet-content">{rendered}</span>
            </div>
          );
        }

        return (
          <p key={lIdx} className="hero-ai-text">
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Automatically computes academic Year and Semester from student's semester input.
 * Supports JNTU notation ("3-2", "2-1", "1-1"), numerical sem ("Sem 6", "6th sem", "6"),
 * and descriptive input ("3rd Year, 6th Sem").
 */
function detectYearAndSemester(rawQuery) {
  const str = (rawQuery || "").toLowerCase().trim();

  // 1. Direct JNTU year-sem notation: e.g. "3-2", "2-1", "1-1", "4-2"
  const jntuMatch = str.match(/\b([1-4])\s*[-–]\s*([1-2])\b/);
  if (jntuMatch) {
    const yr = parseInt(jntuMatch[1]);
    const sm = parseInt(jntuMatch[2]);
    const semNum = (yr - 1) * 2 + sm;
    const yearLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const semLabels = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
    return {
      year: yearLabels[yr - 1],
      semester: `${semLabels[semNum - 1]} Semester (${yr}-${sm})`,
      semCode: `${yr}-${sm}`,
      semIndex: semNum,
    };
  }

  // 2. Semester keywords: e.g. "sem 6", "6th sem", "semester 4", "4th semester"
  const semWordMatch = str.match(/(?:sem|semester)\s*([1-8])\b|\b([1-8])(?:st|nd|rd|th)?\s*(?:sem|semester)\b/);
  if (semWordMatch) {
    const semNum = parseInt(semWordMatch[1] || semWordMatch[2]);
    const yr = Math.ceil(semNum / 2);
    const sm = ((semNum - 1) % 2) + 1;
    const yearLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const semLabels = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
    return {
      year: yearLabels[yr - 1],
      semester: `${semLabels[semNum - 1]} Semester (${yr}-${sm})`,
      semCode: `${yr}-${sm}`,
      semIndex: semNum,
    };
  }

  // 3. Comma-separated or compound input: e.g. "3rd Year, 6th Sem"
  if (str.includes(",")) {
    const parts = str.split(",");
    const yrPart = parts[0]?.trim();
    const semPart = parts[1]?.trim();
    const detectedYrMatch = yrPart.match(/\b([1-4])\b/);
    const detectedSemMatch = semPart.match(/\b([1-8])\b/);
    if (detectedYrMatch && detectedSemMatch) {
      const yr = parseInt(detectedYrMatch[1]);
      const semNum = parseInt(detectedSemMatch[1]);
      const sm = ((semNum - 1) % 2) + 1;
      const yearLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
      const semLabels = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
      return {
        year: yearLabels[yr - 1],
        semester: `${semLabels[semNum - 1]} Semester (${yr}-${sm})`,
        semCode: `${yr}-${sm}`,
        semIndex: semNum,
      };
    }
  }

  // 4. Single digit 1 to 8: e.g. "6", "4", "2"
  const digitMatch = str.match(/\b([1-8])\b/);
  if (digitMatch) {
    const semNum = parseInt(digitMatch[1]);
    const yr = Math.ceil(semNum / 2);
    const sm = ((semNum - 1) % 2) + 1;
    const yearLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const semLabels = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
    return {
      year: yearLabels[yr - 1],
      semester: `${semLabels[semNum - 1]} Semester (${yr}-${sm})`,
      semCode: `${yr}-${sm}`,
      semIndex: semNum,
    };
  }

  // Fallback defaults
  return {
    year: "3rd Year",
    semester: "6th Semester (3-2)",
    semCode: "3-2",
    semIndex: 6,
  };
}

function JntuChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [modalInput, setModalInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [thinkingState, setThinkingState] = useState("searching");
  const [thinkingLabel, setThinkingLabel] = useState("Searching verified resources...");

  // Speech Recognition (Voice Input / Mic) State
  const [isListening, setIsListening] = useState(false);
  const [listeningTarget, setListeningTarget] = useState(null); // "hero" | "modal"
  const recognitionRef = useRef(null);

  // Profile Wizard Session State
  const [profileSession, setProfileSession] = useState({
    active: false,
    step: null, // "NAME" | "HALLTICKET" | "BRANCH" | "SEMESTER" | "REGULATION" | "CGPA" | "ATTENDANCE"
    draft: {},
  });

  const resultsBodyRef = useRef(null);
  const inputRef = useRef(null);
  const modalInputRef = useRef(null);
  const navigate = useNavigate();

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // Web Speech API Voice-to-Text Recognition Toggle
  const toggleSpeechRecognition = (target = "hero") => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    // If currently listening, stop immediately
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setListeningTarget(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // English (India) with seamless engineering academic term detection

      let speechTranscript = "";

      recognition.onstart = () => {
        setIsListening(true);
        setListeningTarget(target);
      };

      recognition.onresult = (event) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            speechTranscript += chunk;
          } else {
            interimText += chunk;
          }
        }
        const currentSpokenText = speechTranscript || interimText;
        if (target === "hero") {
          setInput(currentSpokenText);
        } else {
          setModalInput(currentSpokenText);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition warning/error:", event.error);
        setIsListening(false);
        setListeningTarget(null);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          alert("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setListeningTarget(null);
        const textToQuery = speechTranscript.trim();
        if (textToQuery) {
          // Immediately process the transcribed question in the chatbot
          handleSend(textToQuery);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition startup error:", err);
      setIsListening(false);
      setListeningTarget(null);
    }
  };

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

  // Lock body scroll and apply chatbot-modal-open class when modal is open
  useEffect(() => {
    if (isModalOpen && typeof document !== "undefined") {
      document.body.classList.add("chatbot-modal-open");
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.classList.remove("chatbot-modal-open");
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

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

  // Lock body scroll and mark chat-modal-open on body when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("chat-modal-open");
    } else {
      document.body.classList.remove("chat-modal-open");
    }
    return () => {
      document.body.classList.remove("chat-modal-open");
    };
  }, [isModalOpen]);

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
        draft.shortName = rawQuery.trim().split(" ")[0];
        setProfileSession({ active: true, step: "HALLTICKET", draft });
        return {
          text: `Awesome, ${draft.name}! What is your JNTU Hall Ticket / USN Roll Number? (e.g. 22B91A4201)`,
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
        setProfileSession({ active: true, step: "SEMESTER", draft });
        return {
          text: `Great, ${draft.branch}! Which Semester are you currently in? (e.g. 3-2, 2-1, 1st Sem)`,
          wizardActive: true,
        };
      }

      if (step === "SEMESTER" || step === "YEAR_SEM") {
        const detected = detectYearAndSemester(rawQuery);
        draft.year = detected.year;
        draft.semester = detected.semester;
        draft.semCode = detected.semCode;
        setProfileSession({ active: true, step: "REGULATION", draft });
        return {
          text: `Got it, ${detected.year} (${detected.semCode})! Which Academic Regulation applies to you?`,
          suggestions: ["R23 Regulation", "R20 Regulation", "R19 Regulation", "R16 Regulation"],
          wizardActive: true,
        };
      }

      if (step === "REGULATION") {
        draft.regulation = rawQuery.includes("R") ? rawQuery.trim() : `${rawQuery.trim()} Regulation`;
        setProfileSession({ active: true, step: "CGPA", draft });
        return {
          text: `What is your current Cumulative CGPA? (e.g. 8.85)`,
          wizardActive: true,
        };
      }

      if (step === "CGPA") {
        const num = parseFloat(rawQuery.replace(/[^0-9.]/g, "")) || 8.5;
        draft.cgpa = num.toFixed(2);
        setProfileSession({ active: true, step: "ATTENDANCE", draft });
        return {
          text: `What is your current Attendance Percentage? (e.g. 89.4%)`,
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
          suggestions: ["📊 CGPA Calculator", "👤 Student Profile", "📘 Notes"],
        };
      }
    }

    // =========================================================
    // 2. CONVERSATIONAL & ASSISTANT IDENTITY HANDLER
    // Instant friendly responses to greetings, questions about JNTU Circle,
    // gratitude, assistance, and guidance.
    // =========================================================
    const conversationalAnswer = getConversationalAnswer(rawQuery);
    if (conversationalAnswer) {
      return conversationalAnswer;
    }

    // =========================================================
    // 3. TRIGGER PROFILE BUILDER COMMAND
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
        wizardActive: true,
      };
    }

    // =========================================================
    // 4. JNTUA ACADEMIC REGULATIONS KNOWLEDGE ENGINE (100% Precision Q&A)
    // Authoritative answers for CGPA formulas, attendance rules,
    // internal/external pass marks, grading scales, credits, 80:20 mid split, etc.
    // =========================================================
    const knowledgeAnswer = getAcademicKnowledgeAnswer(rawQuery);
    if (knowledgeAnswer) {
      return knowledgeAnswer;
    }

    // =========================================================
    // 5. JNTUA SEMESTER CURRICULUM ENQUIRY (e.g. "CSE 2-1 subjects")
    // =========================================================
    const curriculumAnswer = getSemesterCurriculumAnswer(rawQuery);
    if (curriculumAnswer) {
      return {
        text: curriculumAnswer.text,
        isSemesterCurriculum: true,
        curriculumData: curriculumAnswer,
        action: curriculumAnswer.action,
        suggestions: curriculumAnswer.suggestions,
      };
    }

    // =========================================================
    // 6. CORE ENGINEERING CONCEPTS & SUBJECT EXPLAINERS
    // Explains OS, DBMS, DSA, AI/ML, Networks, OOP, DLD, EDC, BEEE, etc.
    // =========================================================
    const conceptAnswer = getSubjectConceptAnswer(rawQuery);
    if (conceptAnswer) {
      return conceptAnswer;
    }

    // =========================================================
    // 7. STUDY STRATEGIES, EXAM PREPARATION & CAREER GUIDANCE
    // Answers how to score 9 CGPA, prepare for exams, clear backlogs, placements.
    // =========================================================
    const adviceAnswer = getStudyAdviceAnswer(rawQuery);
    if (adviceAnswer) {
      return adviceAnswer;
    }

    // =========================================================
    // 8. SINGLE-SHOT PROFILE NLP FIELD UPDATES
    // Only runs when user explicitly commands to set or update profile data
    // =========================================================
    const isAcademicQuestion = /percentage|formula|convert|rule|scale|how|what|split|weight|why|when|where/i.test(q);

    // CGPA Update: e.g. "update cgpa to 9.2", "set cgpa 9.0", "my cgpa is 8.9"
    const cgpaExplicitMatch = !isAcademicQuestion && (
      q.match(/(?:my\s+(?:cgpa|gpa)\s*(?:is|=|:)|(?:set|update|change)\s+(?:my\s+)?(?:cgpa|gpa)\s*(?:is|to|=|:)?)\s*([0-9]+\.?[0-9]*)/i) ||
      (q.startsWith("cgpa ") && /^[0-9]+\.?[0-9]*$/.test(q.replace("cgpa ", "").trim()))
    );
    if (cgpaExplicitMatch) {
      const numVal = parseFloat(cgpaExplicitMatch[1]);
      if (numVal >= 0 && numVal <= 10) {
        const newCgpa = numVal.toFixed(2);
        const updated = handleQuickProfileUpdate({ cgpa: newCgpa });
        return {
          text: `✅ Updated your Cumulative CGPA to ${newCgpa}! This reflects in your Student Profile and Calculator.`,
          profilePreview: updated,
          action: { label: "Open CGPA Calculator →", path: "/calculator" },
          suggestions: ["📊 CGPA Calculator", "🎓 View Student Profile"],
        };
      }
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

    // Attendance Update: e.g. "my attendance is 92%", "set attendance to 85%"
    const isAttRuleQuestion = /rule|condonation|detention|medical|shortage|minimum|eligibility|percentage/i.test(q);
    const attExplicitMatch = !isAttRuleQuestion && (
      q.match(/(?:my\s+attendance\s*(?:is|=|:)|(?:set|update|change)\s+(?:my\s+)?attendance\s*(?:is|to|=|:)?)\s*([0-9]+(?:\.[0-9]+)?%?)/i) ||
      (q.startsWith("attendance ") && /^[0-9]+(?:\.[0-9]+)?%?$/.test(q.replace("attendance ", "").trim()))
    );
    if (attExplicitMatch) {
      const rawPct = attExplicitMatch[1].replace("%", "").trim();
      const numPct = parseFloat(rawPct);
      if (numPct >= 0 && numPct <= 100) {
        const newAtt = `${numPct}%`;
        const updated = handleQuickProfileUpdate({ attendance: newAtt });
        return {
          text: `✅ Updated your Attendance Rate to ${newAtt}.`,
          profilePreview: updated,
          action: { label: "Open Student Profile →", path: "/profile" },
        };
      }
    }

    // =========================================================
    // 6. PLATFORM TOOLS & HELPERS
    // =========================================================

    // Calculator Query
    if (q.includes("calculator") || q === "sgpa" || q === "cgpa") {
      return {
        text: "Interactive CGPA & SGPA Evaluation Engine for R23, R20, R19 regulations with real-time grade calculations.",
        action: { label: "Open CGPA & SGPA Calculator →", path: "/calculator" },
        suggestions: ["📊 SGPA Calculator", "📜 Grade Scale Reference", "🎯 Target CGPA Planner"],
      };
    }

    // Student Academic Performance / Transcript Query
    if (q.includes("transcript") || q.includes("marks card") || q.includes("result card") || q.includes("my progress")) {
      return {
        text: "View your verified academic profile, semester progression, and CGPA trajectory in your Student Profile.",
        action: { label: "View Student Profile →", path: "/profile" },
        suggestions: ["📊 CGPA Calculator", "👤 Student Profile"],
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

    // =========================================================
    // 10. ACCURATE ACADEMIC SEARCH & BRANCH HUB CONTENT
    // =========================================================
    // Check if the query is asking about a specific engineering branch alone (e.g. "CSE", "AIML", "ECE", "ME", "Civil", "EEE")
    const detectedBranch = detectBranchFromQuery(rawQuery);
    const hasSpecificSubject = /note|paper|syllabus|lab|program|unit|module|code|question/i.test(rawQuery);

    if (detectedBranch && !hasSpecificSubject) {
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
      // Display matched items for comprehensive query coverage
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

    // =========================================================
    // 11. DYNAMIC INTELLIGENT ACADEMIC SYNTHESIZER
    // Guarantees an authoritative, helpful response for EVERY query from the user,
    // completely eliminating "No exact records found"!
    // =========================================================
    return synthesizeDynamicAcademicResponse(rawQuery, searchRes);
  };

  const handleSend = async (textToSend) => {
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
    let orbLabel = `Searching academic resources for "${query}"...`;

    if (q.includes("profile") || profileSession.active) {
      orbState = "weaving";
      orbLabel = "Structuring student profile attributes...";
    } else if (q.includes("calculator") || q.includes("cgpa") || q.includes("sgpa") || q.includes("percentage")) {
      orbState = "solving";
      orbLabel = "Computing academic grade point metrics...";
    } else if (q.includes("attendance") || q.includes("condonation") || q.includes("detention")) {
      orbState = "connecting";
      orbLabel = "Checking official JNTUA attendance regulations...";
    } else if (q.includes("pass") || q.includes("mark") || q.includes("grade") || q.includes("credit")) {
      orbState = "solving";
      orbLabel = "Checking university examination evaluation standards...";
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
        isKnowledge: responseData.isKnowledge,
        formula: responseData.formula,
        isSemesterCurriculum: responseData.isSemesterCurriculum,
        curriculumData: responseData.curriculumData,
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

  // Submit from the Hero home command bar
  const handleHeroSubmit = (e) => {
    if (e) e.preventDefault();
    if (input.trim()) {
      handleSend(input);
    } else {
      setIsModalOpen(true);
    }
  };

  // Submit from the Modal Overlay input bar
  const handleModalSubmit = (e) => {
    if (e) e.preventDefault();
    if (modalInput.trim()) {
      handleSend(modalInput);
    }
  };

  // Handle Enter key on hero input (bypass disabled submit button)
  const handleHeroKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleHeroSubmit();
    }
  };

  // Handle Enter key on modal input (bypass disabled submit button)
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

  const handleRedirectToBrowseByBranch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const deptSection = document.getElementById("departments");
    if (deptSection) {
      deptSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/#departments");
    }
  };

  const handleBranchClick = (branchCode) => {
    window.dispatchEvent(new CustomEvent("select-branch", { detail: branchCode }));
    const deptSection = document.getElementById("departments");
    if (deptSection) {
      deptSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/#departments");
    }
  };

  const hasHeroInput = input.trim().length > 0;
  const hasModalInput = modalInput.trim().length > 0;

  return (
    <div className="hero-ai-container">
      {/* =========================================================
          HERO HOME COMMAND BAR (CLEAN TRIGGER BAR)
          ========================================================= */}
      <div className="hero-ai-bar-anchor">
        <form className="hero-ai-bar" onSubmit={handleHeroSubmit}>
          <div
            className={`hero-ai-avatar-badge ${isListening && listeningTarget === "hero" ? "is-listening" : ""}`}
            title={
              isListening && listeningTarget === "hero"
                ? "🎙️ Listening... click to stop"
                : "Click for Voice Search / Ask AI"
            }
            onClick={(e) => {
              e.stopPropagation();
              toggleSpeechRecognition("hero");
            }}
          >
            <div className="hero-ai-avatar-desktop">
              <JntuBotAvatar size={34} state={isTyping ? "working" : "default"} />
            </div>
            <div className="hero-ai-avatar-mobile-mic" aria-label="Voice Search / Ask AI">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
          </div>

          <input
            ref={inputRef}
            type="text"
            className="hero-ai-input"
            placeholder={
              isListening && listeningTarget === "hero"
                ? "🎙️ Listening... speak your question now..."
                : "Ask JNTU AI or enter branch (CSE, AIML)..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleHeroKeyDown}
            aria-label="Ask JNTU AI"
            autoComplete="off"
            style={{ outline: "none", border: "none", boxShadow: "none" }}
          />

          {/* ACTION CONTROLS */}
          <div className="hero-ai-send-wrapper">
            <button
              type="submit"
              className="hero-ai-send-btn"
              aria-label="Submit Search / Ask AI"
              title="Submit Search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </form>

        {/* Quick Launch Chips for Student Profile & Branch Hubs */}
        <div className="hero-ai-starter-chips">
          <button
            type="button"
            className="hero-ai-quick-pill"
            onClick={handleStartProfileBuilder}
          >
            <span>Build Student Profile</span>
          </button>
          <button
            type="button"
            className="hero-ai-quick-pill"
            onClick={() => handleBranchClick("CSE")}
          >
            <span>CSE</span>
          </button>
          <button
            type="button"
            className="hero-ai-quick-pill"
            onClick={() => handleBranchClick("AIML")}
          >
            <span>AIML</span>
          </button>
          <button
            type="button"
            className="hero-ai-quick-pill"
            onClick={() => handleBranchClick("ECE")}
          >
            <span>ECE</span>
          </button>
          <button
            type="button"
            className="hero-ai-quick-pill"
            onClick={() => handleBranchClick("ME")}
          >
            <span>ME</span>
          </button>
          <button
            type="button"
            className="hero-ai-quick-pill"
            onClick={() => handleBranchClick("Civil")}
          >
            <span>Civil</span>
          </button>
          <button
            type="button"
            className="hero-ai-quick-pill"
            onClick={() => handleBranchClick("EEE")}
          >
            <span>EEE</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          POPUP MODAL & OVERLAY (COMMUNICATION IS DONE HERE)
          Rendered via React Portal directly into document.body
          to eliminate any stacking context traps from parent/sibling
          sections, 3D carousels, and floating action buttons.
          ========================================================= */}
      {isModalOpen && typeof document !== "undefined" && createPortal(
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
                  <JntuBotAvatar size={38} state={isTyping ? "working" : "default"} />
                  <span className="chat-modal-status-dot" />
                </div>
                <div className="chat-modal-header-info">
                  <div className="chat-modal-title-row">
                    <h3 className="chat-modal-title">JNTU Circle AI Assistant</h3>
                    <span className="chat-modal-role-badge">
                      {profileSession.active ? "Profile Wizard" : "Online"}
                    </span>
                  </div>
                  <p className="chat-modal-subtitle">
                    Live academic guidance & instant answers
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
                  <div className="chat-modal-empty-avatar-wrap">
                    <JntuBotAvatar size={64} />
                  </div>
                  <h4>JNTU Academic Assistant</h4>
                  <p>
                    Instant, verified lecture notes, previous question papers, syllabus, or authoritative guidance on university academic regulations.
                  </p>

                  <div className="chat-modal-starter-categories">
                    <div className="chat-modal-starter-group">
                      <span className="chat-modal-group-title">🎓 Engineering Branches</span>
                      <div className="chat-modal-quick-suggestions">
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("CSE")}>
                          💻 CSE Hub
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("AIML")}>
                          🤖 AIML Hub
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("ECE")}>
                          📡 ECE Hub
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("Mechanical")}>
                          ⚙️ ME Hub
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("Civil")}>
                          🏗️ Civil Hub
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("EEE")}>
                          ⚡ EEE Hub
                        </button>
                      </div>
                    </div>

                    <div className="chat-modal-starter-group">
                      <span className="chat-modal-group-title">💡 Academic Regulations & FAQs</span>
                      <div className="chat-modal-quick-suggestions">
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("CGPA to Percentage formula")}>
                          📐 CGPA to % Formula
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("Attendance & Condonation Rules")}>
                          📋 Attendance Rules
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("Internal Marks System & Passing Marks")}>
                          📝 Passing & Mid Marks
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("10-Point Grade Scale & SGPA Calculation")}>
                          📜 10-Point Grade Scale
                        </button>
                      </div>
                    </div>

                    <div className="chat-modal-starter-group">
                      <span className="chat-modal-group-title">📚 Popular Study Materials</span>
                      <div className="chat-modal-quick-suggestions">
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("Data Structures Notes")}>
                          📘 Data Structures Notes
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("Python Lab Programs")}>
                          🧪 Python Lab Programs
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("Operating Systems Question Papers")}>
                          📄 Operating Systems Papers
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("Linear Algebra Calculus M1")}>
                          📘 M1 Calculus Notes
                        </button>
                      </div>
                    </div>

                    <div className="chat-modal-starter-group">
                      <span className="chat-modal-group-title">🚀 Tools & Profiles</span>
                      <div className="chat-modal-quick-suggestions">
                        <button
                          type="button"
                          className="chat-modal-sugg-pill"
                          onClick={() => handleSend("Build your student profile using chatbot")}
                        >
                          ✨ Build Student Profile
                        </button>
                        <button type="button" className="chat-modal-sugg-pill" onClick={() => handleSend("CGPA & SGPA Calculator")}>
                          📊 CGPA & SGPA Calculator
                        </button>
                      </div>
                    </div>
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
                            <JntuBotAvatar size={24} />
                          </div>
                          <span className="hero-ai-tag hero-ai-tag-bot">JNTU AI</span>
                          {msg.isKnowledge && (
                            <span className="hero-ai-tag-badge">Official Standard</span>
                          )}
                          {msg.isSemesterCurriculum && (
                            <span className="hero-ai-tag-badge">R23 Curriculum</span>
                          )}
                        </div>

                        <div className="hero-ai-bot-content">
                          {formatBotText(msg.text)}

                          {/* Highlighted Formula Card */}
                          {msg.formula && (
                            <div className="hero-ai-formula-card">
                              <span className="hero-ai-formula-badge">Official Standard Formula</span>
                              <div className="hero-ai-formula-text">{msg.formula}</div>
                            </div>
                          )}

                          {/* Interactive Semester Curriculum Card */}
                          {msg.isSemesterCurriculum && msg.curriculumData && (
                            <SemesterCurriculumCard
                              data={msg.curriculumData}
                              onSelectQuery={(q) => handleSend(q)}
                              onCloseModal={handleCloseModal}
                            />
                          )}

                          {/* Interactive Profile Sync Card */}

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

                          {/* Interactive Branch Hub View (Shows all content when branch name is queried) */}
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
                                        <span>{resItem.icon || "📄"}</span>
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
                                <span>💡</span>
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
                                    {rel.icon} {rel.type}: {rel.subject || rel.title}
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
                                    📚 {sub.name} ({sub.branch})
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

            {/* Modal Input Footer (Interactive Chat Control) */}
            <div className="chat-modal-footer">
              <form className="chat-modal-input-bar" onSubmit={handleModalSubmit}>
                {/* Voice Input Microphone Button on the LEFT */}
                <button
                  type="button"
                  className={`chat-modal-mic-btn ${isListening && listeningTarget === "modal" ? "is-listening" : ""}`}
                  onClick={() => toggleSpeechRecognition("modal")}
                  title={
                    isListening && listeningTarget === "modal"
                      ? "Listening... click to stop"
                      : "Voice input / Speak question"
                  }
                  aria-label="Voice input"
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
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </button>

                <input
                  ref={modalInputRef}
                  type="text"
                  className="chat-modal-input-field"
                  placeholder={
                    isListening && listeningTarget === "modal"
                      ? "🎙️ Listening... speak your message now..."
                      : profileSession.active
                        ? profileSession.step === "NAME"
                          ? "Type your full name..."
                          : profileSession.step === "HALLTICKET"
                            ? "Type your Hall Ticket / USN Roll Number..."
                            : profileSession.step === "BRANCH"
                              ? "Type or select your branch..."
                              : profileSession.step === "SEMESTER" || profileSession.step === "YEAR_SEM"
                                ? "Type your semester (e.g. 3-2, 2-1)..."
                                : profileSession.step === "REGULATION"
                                  ? "Type or select regulation..."
                                  : profileSession.step === "CGPA"
                                    ? "Type your CGPA (e.g. 8.85)..."
                                    : profileSession.step === "ATTENDANCE"
                                      ? "Type your attendance % (e.g. 89%)..."
                                      : "Type your response here..."
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
                    ✕
                  </button>
                )}

                <button
                  type="submit"
                  className="chat-modal-send-btn"
                  // always enabled for immediate interaction
                  title="Send message"
                  aria-label="Send message"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default JntuChatbot;
