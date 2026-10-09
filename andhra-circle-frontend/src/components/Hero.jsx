import JntuChatbot from "./JntuChatbot";

function Hero() {
  return (
    <section id="home" className="hero">
      {/* The uploaded hero artwork from emerald-horizon-web-template */}
      <img
        className="hero-art"
        src="/hero.png"
        alt="Emerald horizon with a luminous golden arc over water"
      />

      <div className="hero-content">
        <p className="eyebrow">YOUR ACADEMIC COMPANION</p>

        <h1>
          Where <em>vision</em><br />
          meets possibility.
        </h1>

        {/* EXISTING AI COMMAND BAR + STUDENT PROFILE CTA */}
        <JntuChatbot />
      </div>

      <div className="hero-scroll">
        SCROLL <span></span>
      </div>
    </section>
  );
}

export default Hero;