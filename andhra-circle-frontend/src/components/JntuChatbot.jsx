import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BorderBeam } from "border-beam";
import { BotAvatar } from "bot-avatars";
import { MetalFx, useMetalBend } from "metal-fx";

function JntuChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const resultsBodyRef = useRef(null);
  const inputRef = useRef(null);
  const sendMetalRef = useRef(null);
  const navigate = useNavigate();

  useMetalBend(sendMetalRef);

  // Auto-scroll ONLY the internal chatbot messages container without scrolling the window/page
  useEffect(() => {
    if (resultsBodyRef.current) {
      resultsBodyRef.current.scrollTop = resultsBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateResponse = (rawQuery) => {
    const q = rawQuery.toLowerCase().trim();

    // Check for Notes
    if (q.includes("note") || q.includes("material") || q.includes("lecture") || q.includes("pdf") || q.includes("textbook")) {
      return {
        text: "I found verified B.Tech lecture notes and study materials for R20 & R23 regulations across CSE, ECE, EEE, MECH & CIVIL departments.",
        action: { label: "Open Notes Catalog →", path: "/notes" },
        suggestions: ["CSE Notes", "ECE Notes", "Civil Notes"]
      };
    }

    // Check for Question Papers
    if (q.includes("paper") || q.includes("question") || q.includes("pyq") || q.includes("mid") || q.includes("model")) {
      return {
        text: "Access previous semester end examination papers and mid question papers categorized by regulation and academic branch.",
        action: { label: "Browse Question Papers →", path: "/papers" },
        suggestions: ["R20 Papers", "R23 Papers", "Mid Exam Papers"]
      };
    }

    // Check for Syllabus
    if (q.includes("syllabus") || q.includes("curriculum") || q.includes("credit") || q.includes("course structure")) {
      return {
        text: "Official JNTU academic curriculum, credit distribution, and semester-wise syllabus are updated for all programs.",
        action: { label: "View Syllabus →", path: "/syllabus" },
        suggestions: ["R20 Syllabus", "R23 Syllabus"]
      };
    }

    // Check for Lab Programs
    if (q.includes("lab") || q.includes("program") || q.includes("code") || q.includes("manual") || q.includes("viva") || q.includes("practical")) {
      return {
        text: "Explore verified lab manuals, source code implementations, and practical exercises across all semesters.",
        action: { label: "Open Lab Programs →", path: "/lab-programs" },
        suggestions: ["Java Lab", "Python Lab", "Data Structures Lab"]
      };
    }

    // Check for Notifications / Circulars
    if (q.includes("notification") || q.includes("circular") || q.includes("timetable") || q.includes("exam") || q.includes("result") || q.includes("alert")) {
      return {
        text: "Stay updated with official JNTU circulars, examination timetables, fee notifications, and university announcements.",
        action: { label: "View Notifications →", path: "/notifications" },
        suggestions: ["Exam Timetable", "Academic Calendar"]
      };
    }

    // Check for Departments / Branches
    if (q.includes("department") || q.includes("branch")) {
      return {
        text: "JNTU Circle provides dedicated study resources for CSE, ECE, EEE, MECH, CIVIL, IT, and AI & ML departments.",
        action: { label: "Explore Department Notes →", path: "/notes" },
        suggestions: ["CSE", "ECE", "EEE", "MECH", "CIVIL"]
      };
    }

    if (q.includes("cse") || q.includes("computer science")) {
      return {
        text: "Found resources for Computer Science & Engineering (CSE) including Operating Systems, DBMS, Computer Networks, and DSA.",
        action: { label: "Open CSE Materials →", path: "/notes?search=CSE" }
      };
    }

    if (q.includes("ece") || q.includes("electronics")) {
      return {
        text: "Found resources for Electronics & Communication Engineering (ECE) including VLSI, Signals & Systems, and EDC.",
        action: { label: "Open ECE Materials →", path: "/notes?search=ECE" }
      };
    }

    if (q.includes("eee") || q.includes("electrical")) {
      return {
        text: "Found resources for Electrical & Electronics Engineering (EEE) including Power Systems, Machines, and Control Systems.",
        action: { label: "Open EEE Materials →", path: "/notes?search=EEE" }
      };
    }

    if (q.includes("mech") || q.includes("mechanical")) {
      return {
        text: "Found resources for Mechanical Engineering including Thermodynamics, Kinematics, and Manufacturing Technology.",
        action: { label: "Open Mech Materials →", path: "/notes?search=MECH" }
      };
    }

    if (q.includes("civil")) {
      return {
        text: "Found resources for Civil Engineering including Structural Analysis, Surveying, and Fluid Mechanics.",
        action: { label: "Open Civil Materials →", path: "/notes?search=CIVIL" }
      };
    }

    // Greetings
    if (q.startsWith("hi") || q.startsWith("hello") || q.startsWith("hey") || q.includes("good morning") || q.includes("good evening") || q === "help") {
      return {
        text: "Hello! I am your JNTU AI Assistant. Ask me about lecture notes, syllabus, question papers, or university circulars.",
        suggestions: ["Notes", "Question Papers", "Syllabus", "Lab Programs"]
      };
    }

    // Fallback search
    return {
      text: `Looking for resources matching "${rawQuery}"? Search our verified portal database for notes, question papers, and syllabus.`,
      action: { label: `Search "${rawQuery}" in Portal →`, path: `/search?query=${encodeURIComponent(rawQuery)}` }
    };
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    // Prevent any browser auto-scroll when focusing input
    inputRef.current?.focus({ preventScroll: true });

    const userMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: query
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const responseData = generateResponse(query);
      const botMessage = {
        id: "bot-" + Date.now(),
        sender: "assistant",
        text: responseData.text,
        action: responseData.action,
        suggestions: responseData.suggestions
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 550);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    inputRef.current?.focus({ preventScroll: true });
    handleSend();
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    inputRef.current?.focus({ preventScroll: true });
  };

  const hasInput = input.trim().length > 0;

  return (
    <div className="hero-ai-container">
      {/* Anchor container: keeps input anchored and acts as positioning context for the overlay */}
      <div className="hero-ai-bar-anchor">
        {/* =================================================
            COMPACT AI COMMAND BAR (BORDER-BEAM WRAPPED)
        ================================================== */}
        <BorderBeam
          size="sm"
          colorVariant="gold"
          strength={0.5}
          active={true}
          theme="dark"
          borderRadius={18}
          className="hero-ai-beam"
        >
          <form className="hero-ai-bar" onSubmit={handleSubmit}>
            <div
              className="hero-ai-avatar-badge"
              title="JNTU AI Bot (Click to play)"
              onClick={() => inputRef.current?.focus({ preventScroll: true })}
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
              placeholder="Ask JNTU AI about notes, syllabus, question papers..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (input) {
                    setInput("");
                  } else if (messages.length > 0) {
                    handleClear();
                  }
                }
              }}
              aria-label="Ask JNTU AI"
              autoComplete="off"
            />

            {/* ACTION CONTROLS */}
            <div className="hero-ai-send-wrapper">
              {hasInput && (
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
                  aria-label="Send query"
                  disabled={!hasInput}
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

        {/* =================================================
            ACTIVE CONVERSATION PANEL (OVERLAY BELOW INPUT)
            Only visible when there is an actual message.
            Positioned at top: calc(100% + 14px)
        ================================================== */}
        {messages.length > 0 && (
          <div className="hero-ai-results-panel" role="region" aria-label="AI Conversation">
            <div className="hero-ai-results-header">
              <div className="hero-ai-results-badge">
                <BotAvatar
                  type="ghost"
                  color="#FFFFFF"
                  size={18}
                  state={isTyping ? "working" : "default"}
                />
                <span className="hero-ai-badge-text">JNTU AI ASSISTANT</span>
                <span className="hero-ai-dot" />
              </div>
              <button
                type="button"
                className="hero-ai-close-btn"
                onClick={handleClear}
                title="Close and clear results"
                aria-label="Close and clear results"
              >
                ✕ Close
              </button>
            </div>

            <div className="hero-ai-results-body" ref={resultsBodyRef}>
              {messages.map((msg) => (
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
                            size={22}
                            state={isTyping ? "working" : "default"}
                          />
                        </div>
                        <span className="hero-ai-tag hero-ai-tag-bot">JNTU AI</span>
                      </div>

                      <div className="hero-ai-bot-content">
                        <p className="hero-ai-text">{msg.text}</p>

                        {msg.action && (
                          <button
                            type="button"
                            className="hero-ai-action-btn"
                            onClick={() => navigate(msg.action.path)}
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
              ))}

              {isTyping && (
                <div className="hero-ai-msg-item hero-ai-msg-assistant">
                  <div className="hero-ai-assistant-card">
                    <div className="hero-ai-assistant-header">
                      <div className="hero-ai-msg-avatar">
                        <BotAvatar
                          type="ghost"
                          color="#FFFFFF"
                          size={22}
                          state="working"
                        />
                      </div>
                      <span className="hero-ai-tag hero-ai-tag-bot">JNTU AI</span>
                    </div>
                    <div className="hero-ai-typing-indicator">
                      <span className="hero-ai-typing-dot" />
                      <span className="hero-ai-typing-dot" />
                      <span className="hero-ai-typing-dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          INITIAL QUICK SUGGESTION PILLS
          Maintains consistent footprint to prevent any vertical layout shift
      ================================================== */}
      <div
        className={`hero-ai-quick-pills ${messages.length > 0 ? "hero-ai-quick-pills-hidden" : ""}`}
        aria-hidden={messages.length > 0}
      >
        <button
          type="button"
          className="hero-ai-quick-pill"
          tabIndex={messages.length > 0 ? -1 : 0}
          onClick={() => handleSend("Notes")}
        >
          <span className="hero-ai-pill-icon">📝</span> Notes
        </button>
        <button
          type="button"
          className="hero-ai-quick-pill"
          tabIndex={messages.length > 0 ? -1 : 0}
          onClick={() => handleSend("Question Papers")}
        >
          <span className="hero-ai-pill-icon">📑</span> Question Papers
        </button>
        <button
          type="button"
          className="hero-ai-quick-pill"
          tabIndex={messages.length > 0 ? -1 : 0}
          onClick={() => handleSend("Syllabus")}
        >
          <span className="hero-ai-pill-icon">📚</span> Syllabus
        </button>
        <button
          type="button"
          className="hero-ai-quick-pill"
          tabIndex={messages.length > 0 ? -1 : 0}
          onClick={() => handleSend("Lab Programs")}
        >
          <span className="hero-ai-pill-icon">💻</span> Lab Programs
        </button>
        <button
          type="button"
          className="hero-ai-quick-pill"
          tabIndex={messages.length > 0 ? -1 : 0}
          onClick={() => handleSend("Notifications")}
        >
          <span className="hero-ai-pill-icon">📢</span> Circulars
        </button>
      </div>
    </div>
  );
}

export default JntuChatbot;
