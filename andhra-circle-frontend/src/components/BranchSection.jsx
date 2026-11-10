import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./BranchSection.css";
import aimlImg from "../assets/branches/aiml.webp";
import cseImg from "../assets/branches/cse.webp";
import eceImg from "../assets/branches/ece.webp";
import mechImg from "../assets/branches/mech.webp";
import civilImg from "../assets/branches/civil.webp";
import eeeImg from "../assets/branches/eee.webp";

const BRANCHES = [
  {
    id: "01",
    name: "AI & Machine Learning",
    code: "AIML",
    tag: "NEURAL NETS & DATA SCIENCE",
    image: aimlImg,
    color: "#5eead4",
    watermark: "AI",
  },
  {
    id: "02",
    name: "Computer Science Engineering",
    code: "CSE",
    tag: "SOFTWARE & ALGORITHMS",
    image: cseImg,
    color: "#38bdf8",
    watermark: "CS",
  },
  {
    id: "03",
    name: "Electronics & Communication",
    code: "ECE",
    tag: "VLSI & EMBEDDED SYSTEMS",
    image: eceImg,
    color: "#ffefb3",
    watermark: "EC",
  },
  {
    id: "04",
    name: "Mechanical Engineering",
    code: "MECH",
    tag: "ROBOTICS & AUTOMATION",
    image: mechImg,
    color: "#fbbf24",
    watermark: "ME",
  },
  {
    id: "05",
    name: "Civil Engineering",
    code: "CIVIL",
    tag: "SMART INFRASTRUCTURE",
    image: civilImg,
    color: "#f5bd3f",
    watermark: "CE",
  },
  {
    id: "06",
    name: "Electrical & Electronics",
    code: "EEE",
    tag: "POWER & ENERGY SYSTEMS",
    image: eeeImg,
    color: "#baf46a",
    watermark: "EE",
  },
];

function BranchSection({ selectedBranch = "", onSelectBranch = null }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  const dragStartRef = useRef(null);

  // Responsive breakpoint tracking
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Synchronize if selectedBranch prop changes externally or via select-branch event
  useEffect(() => {
    const handleSelect = (branchCode) => {
      if (!branchCode) return;
      const idx = BRANCHES.findIndex((b) => {
        const bCode = b.code.toLowerCase();
        const sCode = branchCode.toLowerCase();
        return (
          bCode === sCode ||
          (sCode === "me" && bCode === "mech") ||
          (sCode === "mech" && bCode === "me") ||
          (sCode === "civil" && (bCode === "civil" || bCode === "ce")) ||
          (sCode === "ce" && bCode === "civil")
        );
      });
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    };

    if (selectedBranch) {
      handleSelect(selectedBranch);
    }

    const onCustomSelect = (e) => {
      if (e?.detail) handleSelect(e.detail);
    };
    window.addEventListener("select-branch", onCustomSelect);
    return () => window.removeEventListener("select-branch", onCustomSelect);
  }, [selectedBranch]);

  // Smooth continuous auto-rotation: paused on touch/interaction
  useEffect(() => {
    let pauseUntil = 0;
    const onSelectEvent = (e) => {
      if (e?.detail) {
        pauseUntil = Date.now() + 8000;
      }
    };
    window.addEventListener('select-branch', onSelectEvent);
    const timer = setInterval(() => {
      if (Date.now() < pauseUntil) return;
      setActiveIndex((prev) => (prev + 1) % BRANCHES.length);
    }, 3600);
    return () => {
      clearInterval(timer);
      window.removeEventListener('select-branch', onSelectEvent);
    };
  }, []);

  const prevBranch = () => {
    setActiveIndex((prev) => (prev - 1 + BRANCHES.length) % BRANCHES.length);
  };

  const nextBranch = () => {
    setActiveIndex((prev) => (prev + 1) % BRANCHES.length);
  };

  const handleBranchClick = (branch, isCenter, index) => {
    // If user clicks a side card on mobile, smoothly bring it to the center first!
    if (!isCenter && windowWidth < 768) {
      setActiveIndex(index);
      return;
    }
    if (onSelectBranch) {
      onSelectBranch(branch.code);
    }
    navigate(`/notes?branch=${encodeURIComponent(branch.code)}`);
  };

  // Drag and touch handlers for 3D gesture swiping
  const handleTouchStart = (e) => {
    dragStartRef.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleTouchEnd = (e) => {
    if (dragStartRef.current === null) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = clientX - dragStartRef.current;
    if (diff > 45) {
      prevBranch();
    } else if (diff < -45) {
      nextBranch();
    }
    dragStartRef.current = null;
  };

  // Calculate 3D circular transformation for each card - Crisp, Solid, and Non-Washed on light canvas
  const getCardStyle = (index) => {
    const total = BRANCHES.length;
    let offset = (index - activeIndex) % total;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);

    if (absOffset > 2) {
      return {
        transform: "translate3d(0, 0, -400px) scale(0.5)",
        opacity: 0,
        zIndex: 0,
        pointerEvents: "none",
        visibility: "hidden",
      };
    }

    // 1. Mobile screen (< 768px) - High-fidelity 3D Coverflow geometry with smooth, natural shadows
    if (windowWidth < 768) {
      if (offset === 0) {
        return {
          transform: "translateX(0) translateZ(40px) scale(1.02) rotateY(0deg)",
          zIndex: 30,
          opacity: 1,
          filter: "none",
          boxShadow:
            "0 14px 28px -6px rgba(15, 23, 42, 0.18), 0 6px 14px -4px rgba(15, 23, 42, 0.12)",
          pointerEvents: "auto",
        };
      }
      if (offset === -1) {
        return {
          transform:
            "translateX(-64%) translateZ(-30px) scale(0.85) rotateY(20deg)",
          zIndex: 20,
          opacity: 1,
          filter: "brightness(0.65)",
          boxShadow:
            "0 10px 22px -6px rgba(15, 23, 42, 0.15)",
          pointerEvents: "auto",
        };
      }
      if (offset < -1) {
        return {
          transform:
            "translateX(-110%) translateZ(-80px) scale(0.72) rotateY(28deg)",
          zIndex: 10,
          opacity: 0,
          filter: "brightness(0.4)",
          pointerEvents: "none",
        };
      }
      if (offset === 1) {
        return {
          transform:
            "translateX(64%) translateZ(-30px) scale(0.85) rotateY(-20deg)",
          zIndex: 20,
          opacity: 1,
          filter: "brightness(0.65)",
          boxShadow:
            "0 10px 22px -6px rgba(15, 23, 42, 0.15)",
          pointerEvents: "auto",
        };
      }
      if (offset > 1) {
        return {
          transform:
            "translateX(110%) translateZ(-80px) scale(0.72) rotateY(-28deg)",
          zIndex: 10,
          opacity: 0,
          filter: "brightness(0.4)",
          pointerEvents: "none",
        };
      }
      return {
        transform: "translateX(0) translateZ(-160px) scale(0.6)",
        zIndex: 0,
        opacity: 0,
        pointerEvents: "none",
      };
    }

    // 2. Tablets / Smaller Laptops (768px - 1180px)
    if (windowWidth < 1180) {
      if (offset === 0) {
        return {
          transform: "translate3d(0, 0, 80px) rotateY(0deg) scale(1.04)",
          zIndex: 30,
          opacity: 1,
          filter: "brightness(1) drop-shadow(0 20px 40px rgba(1, 42, 35, 0.22))",
          pointerEvents: "auto",
        };
      }
      if (absOffset === 1) {
        const xTranslate = offset === -1 ? -240 : 240;
        const yRotate = offset === -1 ? 22 : -22;
        return {
          transform: `translate3d(${xTranslate}px, 0, -30px) rotateY(${yRotate}deg) scale(0.86)`,
          zIndex: 20,
          opacity: 0.96,
          filter: "brightness(0.85)",
          pointerEvents: "auto",
        };
      }
      if (absOffset === 2) {
        const xTranslate = offset === -2 ? -420 : 420;
        const yRotate = offset === -2 ? 34 : -34;
        return {
          transform: `translate3d(${xTranslate}px, 0, -90px) rotateY(${yRotate}deg) scale(0.72)`,
          zIndex: 10,
          opacity: 0.88,
          filter: "brightness(0.72)",
          pointerEvents: "auto",
        };
      }
    }

    // 3. Desktop (>= 1180px) - Perfectly proportioned spread without clipping on laptop screens
    if (offset === 0) {
      return {
        transform: "translate3d(0, 0, 100px) rotateY(0deg) scale(1.06)",
        zIndex: 30,
        opacity: 1,
        filter: "brightness(1) drop-shadow(0 24px 45px rgba(1, 42, 35, 0.22))",
        pointerEvents: "auto",
      };
    }

    if (absOffset === 1) {
      const xTranslate = offset === -1 ? -300 : 300;
      const yRotate = offset === -1 ? 24 : -24;
      return {
        transform: `translate3d(${xTranslate}px, 0, -30px) rotateY(${yRotate}deg) scale(0.88)`,
        zIndex: 20,
        opacity: 0.96,
        filter: "brightness(0.85)",
        pointerEvents: "auto",
      };
    }

    if (absOffset === 2) {
      const xTranslate = offset === -2 ? -520 : 520;
      const yRotate = offset === -2 ? 38 : -38;
      return {
        transform: `translate3d(${xTranslate}px, 0, -100px) rotateY(${yRotate}deg) scale(0.74)`,
        zIndex: 10,
        opacity: 0.90,
        filter: "brightness(0.72)",
        pointerEvents: "auto",
      };
    }

    return {
      transform: "translate3d(0, 0, -300px) scale(0.5)",
      opacity: 0,
      zIndex: 0,
      pointerEvents: "none",
    };
  };

  return (
    <section className="branch-carousel-section" id="departments">
      {/* Subtle clean ambient light */}
      <div className="branch-carousel-ambient-glow" />

      {/* Section Header - Matching Latest Notes Structure */}
      <div className="branch-carousel-header">
        <div className="branch-carousel-eyebrow-pill">
          <span className="branch-carousel-eyebrow-text">BROWSE BY BRANCH</span>
        </div>
        <h2 className="branch-carousel-title">
          Explore Academic Resources by Engineering Department
        </h2>
        <span className="branch-carousel-title-underline" />
      </div>

      {/* 3D Rotating Stage */}
      <div
        className="branch-carousel-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        <div className="branch-carousel-world">
          {BRANCHES.map((branch, index) => {
            const isCenter = index === activeIndex;
            const style3D = getCardStyle(index);

            return (
              <div
                key={branch.code}
                onClick={() => handleBranchClick(branch, isCenter, index)}
                style={{
                  ...style3D,
                  transition:
                    windowWidth < 768
                      ? "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease, filter 0.45s ease"
                      : "all 0.85s cubic-bezier(0.25, 1, 0.45, 1)",
                }}
                className={`branch-3d-card ${isCenter ? "is-center" : ""}`}
                title={`Explore ${branch.name}`}
              >
                {/* Visual Image */}
                <img
                  src={branch.image}
                  alt={branch.name}
                  className="branch-card-img"
                  width="360"
                  height="360"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                />

                {/* Dark Gradient Overlay for optimal legibility */}
                <div className="branch-card-overlay" />

                {/* Curved Mobile Ground Ambient Reflection / Pod */}
                <div className="branch-card-mobile-ground-shadow" aria-hidden="true" />

                {/* Card Content */}
                <div className="branch-card-inner">
                  {/* Top Badge (clean branch code) */}
                  <div className="branch-top-badge">
                    <span className="branch-badge-code">
                      {branch.code}
                    </span>
                  </div>

                  {/* Middle / Bottom Content */}
                  <div className="branch-bottom-content">
                    <span
                      className="branch-card-tag"
                      style={{ color: branch.color }}
                    >
                      {branch.tag}
                    </span>

                    <h3 className="branch-card-name">
                      {branch.name}
                    </h3>

                    {/* Bottom CTA Row: Explore -> */}
                    <div className="branch-action-row">
                      <span
                        className="branch-explore-link"
                        style={{ color: branch.color }}
                      >
                        Explore →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3D Carousel Navigation & Pagination Dots */}
      <div className="branch-carousel-controls">
        <div className="branch-nav-buttons">
          <button
            type="button"
            onClick={prevBranch}
            aria-label="Previous department"
            className="branch-nav-btn"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            type="button"
            onClick={nextBranch}
            aria-label="Next department"
            className="branch-nav-btn"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Interactive Dots for direct jump */}
        <div className="branch-dots-row">
          {BRANCHES.map((b, i) => (
            <button
              key={b.code}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to ${b.name}`}
              className={`branch-dot ${i === activeIndex ? "is-active" : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BranchSection;
