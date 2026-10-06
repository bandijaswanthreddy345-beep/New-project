import { useState } from "react";

function LikeReactionButton({ isLiked, onToggle, title = "Like" }) {
  const [particles, setParticles] = useState([]);
  const [isHaptic, setIsHaptic] = useState(false);

  const triggerAnimation = () => {
    setIsHaptic(true);
    setTimeout(() => setIsHaptic(false), 460);

    const now = Date.now();
    const newParticles = [];

    // 1. Shockwave Expanding Ring
    newParticles.push({
      id: `${now}_sw`,
      type: "shockwave",
    });

    // 2. Central Hero 3D Glossy Heart
    newParticles.push({
      id: `${now}_hero`,
      type: "hero",
    });

    // 3. Staggered Fountain Mini 3D Hearts (Arches to left and right)
    const fountainConfigs = [
      { xMid: -16, xEnd: -32, rot: -22, scale: 0.95, delay: 0 },
      { xMid: 18, xEnd: 34, rot: 20, scale: 0.9, delay: 35 },
      { xMid: -24, xEnd: -45, rot: -30, scale: 0.75, delay: 75 },
      { xMid: 22, xEnd: 42, rot: 28, scale: 0.8, delay: 110 },
    ];

    fountainConfigs.forEach((cfg, i) => {
      newParticles.push({
        id: `${now}_mini_${i}`,
        type: "mini",
        ...cfg,
      });
    });

    // 4. Shimmering 4-Point Golden & Rose Diamond Sparkles
    const sparkleConfigs = [
      { sx: -24, sy: -30, delay: 0, color: "#fbbf24" },
      { sx: 26, sy: -28, delay: 40, color: "#f59e0b" },
      { sx: -32, sy: -10, delay: 80, color: "#fda4af" },
      { sx: 30, sy: -12, delay: 110, color: "#fef08a" },
    ];

    sparkleConfigs.forEach((sp, i) => {
      newParticles.push({
        id: `${now}_sp_${i}`,
        type: "sparkle",
        ...sp,
      });
    });

    setParticles(newParticles);

    // Clean up particles automatically after animation duration
    setTimeout(() => {
      setParticles([]);
    }, 950);
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // The animation strictly works ONLY when user is liking (not when unliking)
    if (!isLiked) {
      triggerAnimation();
    }

    onToggle(e);
  };

  return (
    <div className="like-symbol-wrapper">
      {/* 3D Motion Luxury Popup Particles */}
      {particles.map((p) => {
        if (p.type === "shockwave") {
          return <span key={p.id} className="particle-shockwave-ring" />;
        }

        if (p.type === "hero") {
          return (
            <div key={p.id} className="particle-hero-heart">
              <svg viewBox="0 0 32 32" width="28" height="28" style={{ display: "block" }}>
                <defs>
                  <linearGradient id={`heroGrad_${p.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4370" />
                    <stop offset="45%" stopColor="#e11d48" />
                    <stop offset="100%" stopColor="#881337" />
                  </linearGradient>
                  <radialGradient id={`heroGloss_${p.id}`} cx="32%" cy="28%" r="42%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* 3D Heart Body with soft shadow */}
                <path
                  d="M16 28.2C15.4 28.2 4.2 20.6 2.4 13.5C0.8 7.3 5.2 2.2 11 2.2C13.6 2.2 15.1 3.5 16 4.6C16.9 3.5 18.4 2.2 21 2.2C26.8 2.2 31.2 7.3 29.6 13.5C27.8 20.6 16.6 28.2 16 28.2Z"
                  fill={`url(#heroGrad_${p.id})`}
                  filter="drop-shadow(0 4px 8px rgba(225, 29, 72, 0.45))"
                />
                {/* Glossy Specular Reflection Curve */}
                <path
                  d="M10.8 4.2C7 4.2 4.2 7.5 5.2 12C6.3 16.8 12.2 22 15.6 25C15 22.8 11.2 17.2 9.2 13.2C7.8 10.2 8.2 6.5 10.8 4.2Z"
                  fill={`url(#heroGloss_${p.id})`}
                />
              </svg>
            </div>
          );
        }

        if (p.type === "mini") {
          return (
            <div
              key={p.id}
              className="particle-mini-heart"
              style={{
                "--x-mid": `${p.xMid}px`,
                "--x-end": `${p.xEnd}px`,
                "--rot": `${p.rot}deg`,
                "--scale": p.scale,
                animationDelay: `${p.delay}ms`,
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" style={{ display: "block" }}>
                <defs>
                  <linearGradient id={`miniGrad_${p.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff5277" />
                    <stop offset="100%" stopColor="#be123c" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={`url(#miniGrad_${p.id})`}
                  filter="drop-shadow(0 2px 4px rgba(225, 29, 72, 0.4))"
                />
                <circle cx="8" cy="7" r="2.2" fill="#ffffff" opacity="0.65" />
              </svg>
            </div>
          );
        }

        if (p.type === "sparkle") {
          return (
            <div
              key={p.id}
              className="particle-sparkle"
              style={{
                "--sx": `${p.sx}px`,
                "--sy": `${p.sy}px`,
                animationDelay: `${p.delay}ms`,
              }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" style={{ display: "block" }}>
                <path
                  d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z"
                  fill={p.color}
                  filter="drop-shadow(0 0 3px rgba(251, 191, 36, 0.75))"
                />
              </svg>
            </div>
          );
        }

        return null;
      })}

      {/* Main Like Reaction Button with Just Heart Symbol (No Background) */}
      <button
        type="button"
        className={`like-symbol-btn ${isLiked ? "is-liked" : ""} ${isHaptic ? "animate-haptic" : ""}`}
        onClick={handleClick}
        title={title}
        aria-label={title}
      >
        <svg
          className="like-heart-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}

export default LikeReactionButton;
