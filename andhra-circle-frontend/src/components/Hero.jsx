import JntuChatbot from "./JntuChatbot";

function Hero() {
  return (
    <section className="hero">
      {/* Background ambient lighting and subtle grid texture */}
      <div className="hero-grid-overlay" aria-hidden="true" />
      <div className="hero-ambient-glow" aria-hidden="true" />

      <div className="hero-content">

        {/* =================================================
            TOP REPOSITORY BADGE (CREATES FULFILLMENT & FOCUS)
        ================================================== */}
        <div className="hero-top-badge">
          <span className="hero-badge-glow-dot" />
          <span>Verified Academic Repository • R23, R20 & R19 Ready</span>
        </div>

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
            AI SEARCH / COMMAND BAR (with black profile button)
        ================================================== */}
        <JntuChatbot />

        {/* =================================================
            ACADEMIC TRUST & METRICS STRIP (FULFILLS THE HERO)
        ================================================== */}
        <div className="hero-stats-strip">
          <div className="hero-stat-pill">
            <span className="stat-pill-num">50,000+</span>
            <span className="stat-pill-label">B.Tech Students</span>
          </div>
          <span className="hero-stat-divider" />
          <div className="hero-stat-pill">
            <span className="stat-pill-num">1,200+</span>
            <span className="stat-pill-label">Curated Notes & PDFs</span>
          </div>
          <span className="hero-stat-divider" />
          <div className="hero-stat-pill">
            <span className="stat-pill-num">6 Branches</span>
            <span className="stat-pill-label">AIML, CSE, ECE, EEE, ME, CE</span>
          </div>
          <span className="hero-stat-divider" />
          <div className="hero-stat-pill">
            <span className="stat-pill-num">100% Free</span>
            <span className="stat-pill-label">Open Access</span>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;