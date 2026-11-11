import { useState, useEffect, lazy, Suspense } from "react";
import ResourceHighlights from "./ResourceHighlights";

const JntuChatbot = lazy(() => import("./JntuChatbot"));

function Hero() {
  const [shouldLoadBot, setShouldLoadBot] = useState(false);

  // Preload chatbot after page has become idle
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setShouldLoadBot(true), {
        timeout: 4000,
      });
      return () => window.cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setShouldLoadBot(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const triggerBot = () => {
    setShouldLoadBot(true);
  };

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
        {shouldLoadBot ? (
          <Suspense
            fallback={
              <div className="hero-ai-container" style={{ minHeight: "68px" }}>
                <div className="hero-ai-bar-anchor">
                  <div className="hero-ai-bar">
                    <div className="hero-ai-avatar-badge">
                      <img
                        src="/jntu-circle-logo.png"
                        alt="JNTU Circle"
                        width="34"
                        height="34"
                        style={{ borderRadius: "50%" }}
                      />
                    </div>
                    <input
                      type="text"
                      className="hero-ai-input"
                      placeholder="Ask JNTU AI or enter branch (CSE, AIML)..."
                      readOnly
                      style={{ outline: "none", border: "none", boxShadow: "none" }}
                    />
                  </div>
                </div>
              </div>
            }
          >
            <JntuChatbot />
          </Suspense>
        ) : (
          <div className="hero-ai-container" onClick={triggerBot}>
            <div className="hero-ai-bar-anchor">
              <div className="hero-ai-bar" style={{ cursor: "pointer" }}>
                <div className="hero-ai-avatar-badge" title="Click to ask JNTU AI">
                  <img
                    src="/jntu-circle-logo.png"
                    alt="JNTU Circle"
                    width="34"
                    height="34"
                    style={{ borderRadius: "50%" }}
                  />
                </div>
                <input
                  type="text"
                  className="hero-ai-input"
                  placeholder="Ask JNTU AI or enter branch (CSE, AIML)..."
                  onFocus={triggerBot}
                  onClick={triggerBot}
                  readOnly
                  style={{ outline: "none", border: "none", boxShadow: "none", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        )}

        <ResourceHighlights />
      </div>
    </section>
  );
}

export default Hero;
