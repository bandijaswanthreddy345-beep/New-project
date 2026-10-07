import JntuChatbot from "./JntuChatbot";

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
          Built by Students, for Students.
        </p>

        {/* =================================================
            SUBTITLE
        ================================================== */}
        <p className="hero-subtitle">
          Find Notes, Question Papers, Syllabus,
          Lab Programs and Notifications
        </p>

        {/* =================================================
            AI SEARCH / COMMAND BAR
        ================================================== */}
        <JntuChatbot />

      </div>
    </section>
  );
}

export default Hero;