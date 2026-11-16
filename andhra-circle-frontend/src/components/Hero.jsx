import { lazy, Suspense } from "react";
import ResourceHighlights from "./ResourceHighlights";

const JntuChatbot = lazy(() => import("./JntuChatbot"));

function HeroChatbotFallback() {
  return (
    <div className="hero-ai-container" style={{ minHeight: "68px" }}>
      <div className="hero-ai-bar-anchor">
        <div className="hero-ai-bar">
          <div className="hero-ai-avatar-badge" title="Voice Search / Ask AI">
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
            type="text"
            className="hero-ai-input"
            placeholder="Ask JNTU AI or enter branch (CSE, AIML)..."
            readOnly
            style={{ outline: "none", border: "none", boxShadow: "none" }}
          />
          <div className="hero-ai-send-wrapper">
            <button
              type="button"
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
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        {/* =================================================
            TITLE
        ================================================== */}
        <h1 className="hero-title">
          Welcome to <span className="font-deltha">JNTU</span> Circle
        </h1>

        {/* =================================================
            SLOGAN
        ================================================== */}
        <p className="hero-slogan">
          Built by Students, <span className="slogan-gold">for Students.</span>
        </p>

        {/* =================================================
            SUBTITLE
        ================================================== */}
        <p className="hero-subtitle">
          Find Notes, Question Papers, Syllabus,
          Lab Programs and Notifications
        </p>

        {/* =================================================
            AI SEARCH / COMMAND BAR (Interactive Trigger)
        ================================================== */}
        <Suspense fallback={<HeroChatbotFallback />}>
          <JntuChatbot />
        </Suspense>

        <ResourceHighlights />
      </div>
    </section>
  );
}

export default Hero;
