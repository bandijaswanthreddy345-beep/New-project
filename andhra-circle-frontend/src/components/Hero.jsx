import JntuChatbot from "./JntuChatbot";
import ResourceHighlights from "./ResourceHighlights";

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
            AI SEARCH / COMMAND BAR (with black profile button)
        ================================================== */}
        <JntuChatbot />

        <ResourceHighlights />

      </div>
    </section>
  );
}

export default Hero;