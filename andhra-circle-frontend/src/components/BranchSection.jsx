import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReferenceGlassShatter from "./ReferenceGlassShatter";



// Department cards matching reference image layout and tags:
// 0: CSE, 1: ECE, 2: AIML, 3: MECH, 4: CIVIL
const BRANCHES = [
  {
    id: "01",
    name: "Computer Science Engineering",
    code: "CSE",
    tag: "SOFTWARE SYSTEMS",
    image: "/branches/cse.jpg",
    accent: "#00d4ff",
    filterQuery: "Computer Science",
  },
  {
    id: "02",
    name: "Electronics & Communication",
    code: "ECE",
    tag: "VLSI & EMBEDDED SYSTEMS",
    image: "/branches/ece.jpg",
    accent: "#00e5ff",
    filterQuery: "Electronics",
  },
  {
    id: "03",
    name: "AI & Machine Learning",
    code: "AIML",
    tag: "NEURAL NETS & DATA SCIENCE",
    image: "/branches/aiml.jpg",
    accent: "#00d4ff",
    filterQuery: "Artificial Intelligence",
  },
  {
    id: "04",
    name: "Mechanical Engineering",
    code: "MECH",
    tag: "ROBOTICS & AUTOMATION",
    image: "/branches/mech.jpg",
    accent: "#00d4ff",
    filterQuery: "Mechanical",
  },
  {
    id: "05",
    name: "Civil Engineering",
    code: "CIVIL",
    tag: "SMART INFRASTRUCTURE",
    image: "/branches/civil.jpg",
    accent: "#00d4ff",
    filterQuery: "Civil",
  },
  {
    id: "06",
    name: "Electrical & Electronics",
    code: "EEE",
    tag: "POWER SYSTEMS & CIRCUITS",
    image: "/branches/eee.jpg",
    accent: "#00d4ff",
    filterQuery: "Electrical",
  },
];

function BranchSection({ selectedBranch = "", onSelectBranch = null }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [shatteringBranch, setShatteringBranch] = useState(null);

  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cardRefs = useRef([]);

  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const angleRef = useRef(Math.PI / 10);
  const hoveredIndexRef = useRef(null);
  const shatteringRef = useRef(null);

  useEffect(() => {
    hoveredIndexRef.current = hoveredIndex;
  }, [hoveredIndex]);

  useEffect(() => {
    shatteringRef.current = shatteringBranch;
  }, [shatteringBranch]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = (e) => {
    if (isMobile || !containerRef.current || shatteringBranch) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    mouseRef.current.targetX = normX * 8;
    mouseRef.current.targetY = -normY * 6;
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
    setHoveredIndex(null);
  };

  useEffect(() => {
    if (isMobile) return;

    let animId;

    const animate = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      if (sceneRef.current) {
        sceneRef.current.style.transform = `rotateX(${mouseRef.current.y.toFixed(2)}deg) rotateY(${mouseRef.current.x.toFixed(2)}deg)`;
      }

      const currentHovered = hoveredIndexRef.current;
      const isShatteringActive = shatteringRef.current !== null;
      // Freeze rotation during shatter explosion so the camera stays locked on the shattering card
      const speed = isShatteringActive ? 0 : (currentHovered !== null ? 0.0004 : 0.0016);
      angleRef.current = (angleRef.current + speed) % (Math.PI * 2);

      const width = window.innerWidth;
      let rx = 310;
      let ry = 18;
      let rz = 160;

      if (width <= 1100) {
        rx = 255;
        ry = 15;
        rz = 130;
      }

      const total = BRANCHES.length;

      BRANCHES.forEach((_, index) => {
        const cardEl = cardRefs.current[index];
        if (!cardEl) return;

        const isHovered = currentHovered === index;
        const baseAngle = angleRef.current + (index * Math.PI * 2) / total;

        const x = Math.cos(baseAngle) * rx;
        const z = Math.sin(baseAngle) * rz;
        const y = -Math.sin(baseAngle) * ry;

        const normZ = z / rz; // -1 (back) to +1 (front center)

        // Smooth yaw: front center faces camera (rotY = 0), side cards subtly angle along curve
        const rotY = isHovered ? 0 : -(x / rx) * 16;

        let scale = 0.88 + normZ * 0.16; // 0.72 (back) to 1.04 (front)
        let zIndex = Math.round(90 + normZ * 60); // 30 to 150

        if (isHovered) {
          scale = 1.12;
          zIndex = 300;
        }

        const shadowBlur = Math.round(16 + normZ * 16);
        const shadowY = Math.round(8 + normZ * 8);
        const shadowAlpha = (0.2 + Math.max(0, normZ) * 0.35).toFixed(3);

        cardEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        cardEl.style.opacity = "1";
        cardEl.style.zIndex = zIndex;

        if (isHovered) {
          cardEl.style.boxShadow = "0 28px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 229, 255, 0.45)";
        } else {
          cardEl.style.boxShadow = `0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowAlpha}), 0 0 ${Math.round(Math.max(0, normZ) * 16)}px rgba(0, 229, 255, ${(Math.max(0, normZ) * 0.25).toFixed(2)})`;
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isMobile]);

  const hasNavigatedRef = useRef(false);

  const triggerBranchNavigation = (item) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    if (onSelectBranch) {
      onSelectBranch(item.code, item.name);
    } else {
      navigate(`/notes?branch=${encodeURIComponent(item.code)}`);
    }
  };

  const activeShatteringItem = BRANCHES.find((b) => b.code === shatteringBranch);

  return (
    <section 
      className="branches-section" 
      ref={containerRef} 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
    >
      <div className="branches-container">

        {/* Section Header: "— Browse by Branch —" + Subtitle */}
        <div className="branches-header">
          <div className="branches-eyebrow-wrapper">
            <span className="branches-eyebrow-line" />
            <span className="branches-eyebrow">Browse by Branch</span>
            <span className="branches-eyebrow-line" />
          </div>
          <h2 className="branches-title">
            Explore academic resources by engineering department
          </h2>
        </div>

        {/* 3D Orbit Layout */}
        <div className="orbit-scene">

          {/* Luminous Floor Light Pool under Center Card */}
          <div className="orbit-ground-glow" />

          {/* ====================================================
              FULLSCREEN GLASS SHATTER DISPERSAL (ONLY PIECES)
              ==================================================== */}
          {activeShatteringItem && (
            <ReferenceGlassShatter
              onComplete={() => triggerBranchNavigation(activeShatteringItem)}
            />
          )}

          {/* ====================================================
              3D CAROUSEL WORLD (Cards suspended in 3D Space)
              Hidden immediately during shatter so no cards are visible
              ==================================================== */}
          <div 
            className="orbit-world" 
            ref={sceneRef}
            style={{ 
              display: activeShatteringItem ? "none" : "flex",
              opacity: activeShatteringItem ? 0 : 1, 
              pointerEvents: activeShatteringItem ? "none" : "auto",
            }}
          >
            {BRANCHES.map((item, index) => {
              const isSelected = Boolean(
                selectedBranch &&
                (selectedBranch.toLowerCase() === item.filterQuery.toLowerCase() ||
                 selectedBranch.toLowerCase() === item.name.toLowerCase() ||
                 selectedBranch.toLowerCase() === item.code.toLowerCase())
              );
              const isShattering = shatteringBranch === item.code;

              const handleCardClick = (e) => {
                e.preventDefault();
                if (shatteringBranch) return; // Prevent double trigger while shattering

                hasNavigatedRef.current = false;
                setShatteringBranch(item.code);
                // Sound removed as requested

                // Failsafe timer: navigate after 1150ms if onComplete hasn't fired yet
                window.setTimeout(() => {
                  triggerBranchNavigation(item);
                }, 1150);
              };

              return (
                <div
                  key={item.id}
                  ref={(el) => (cardRefs.current[index] = el)}
                  className={`orbit-item ${hoveredIndex === index ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""} ${isShattering ? "is-shattering" : ""}`}
                  style={{ "--index": index, "--accent": item.accent }}
                  onMouseEnter={() => !shatteringBranch && setHoveredIndex(index)}
                  onMouseLeave={() => !shatteringBranch && setHoveredIndex(null)}
                  onClick={handleCardClick}
                  title={`View ${item.name} notes & resources`}
                  role="button"
                  tabIndex={0}
                >
                  <article className="branch-card">
                    {/* Background Graphics */}
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="branch-card-bg-img"
                      loading="eager"
                    />

                    {/* Dark Glass Overlay */}
                    <div className="branch-card-gradient" />

                    {/* Ambient Accent Glow */}
                    <div className="branch-card-glow" />

                    {/* Top Pill Badge: ● CODE */}
                    <div className="branch-card-top">
                      <span className="branch-code-badge">
                        <span className="badge-dot" />
                        {item.code}
                      </span>

                      {isSelected && (
                        <span className="branch-active-pill">
                          ● ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Bottom Content: Tag, Title, Glowing Line */}
                    <div className="branch-body">
                      <div className="branch-tag-row">
                        <span className="branch-tag">
                          {item.tag}
                        </span>
                      </div>

                      <h3 className="branch-name">{item.name}</h3>

                      <span className="branch-line" />
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}

export default BranchSection;
