import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

const BRANCHES = [
  {
    id: "01",
    name: "Computer Science",
    code: "CSE",
    tag: "AI & Software Systems",
    image: "/branches/cse.jpg",
    accent: "#f5bd3f", // Emerald Horizon Gold
    filterQuery: "CSE",
  },
  {
    id: "02",
    name: "Electronics & Comm",
    code: "ECE",
    tag: "VLSI & Embedded Systems",
    image: "/branches/ece.jpg",
    accent: "#ffe29a", // Light Gold
    filterQuery: "ECE",
  },
  {
    id: "03",
    name: "AI & Machine Learning",
    code: "AIML",
    tag: "Neural Nets & Data Science",
    image: "/branches/aiml.jpg",
    accent: "#5eead4", // Emerald Mint / Cyan
    filterQuery: "AIML",
  },
  {
    id: "04",
    name: "Mechanical Engineering",
    code: "MECH",
    tag: "Robotics & Automation",
    image: "/branches/mech.jpg",
    accent: "#fbbf24", // Warm Amber Gold
    filterQuery: "MECH",
  },
  {
    id: "05",
    name: "Civil Engineering",
    code: "CIVIL",
    tag: "Smart Infrastructure",
    image: "/branches/civil.jpg",
    accent: "#34d399", // Deep Emerald Accent
    filterQuery: "CIVIL",
  },
];

function BranchSection({ selectedBranch = "", onSelectBranch }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const containerRef = useRef(null);
  const orbitSceneRef = useRef(null);
  const sceneRef = useRef(null);
  const cardRefs = useRef([]);

  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const angleRef = useRef(0);
  const hoveredIndexRef = useRef(null);

  useEffect(() => {
    hoveredIndexRef.current = hoveredIndex;
  }, [hoveredIndex]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = (e) => {
    if (isMobile || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    mouseRef.current.targetX = normX * 10;
    mouseRef.current.targetY = -normY * 8;
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
    setHoveredIndex(null);
  };

  const handleExploreCatalogClick = (e) => {
    e.preventDefault();
    if (orbitSceneRef.current) {
      orbitSceneRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      const el = document.getElementById("branch-cards") || document.getElementById("features");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    if (isMobile) return;

    let animId;

    const animate = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      if (sceneRef.current) {
        sceneRef.current.style.transform = `rotateX(${mouseRef.current.y.toFixed(2)}deg) rotateY(${mouseRef.current.x.toFixed(2)}deg)`;
      }

      const currentHovered = hoveredIndexRef.current;
      const speed = currentHovered !== null ? 0.001 : 0.0028;
      angleRef.current = (angleRef.current + speed) % (Math.PI * 2);

      const width = window.innerWidth;
      let rx = 300; 
      let ry = 22;
      let rz = 160;

      if (width <= 1100) {
        rx = 245;
        ry = 18;
        rz = 125;
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

        const rotY = isHovered ? 0 : -(x / rx) * 18;

        let scale = 0.88 + normZ * 0.16;
        let zIndex = Math.round(100 + normZ * 60);

        if (isHovered) {
          scale = 1.14;
          zIndex = 350;
        }

        const shadowBlur = Math.round(14 + normZ * 14);
        const shadowY = Math.round(6 + normZ * 6);
        const shadowAlpha = (0.2 + Math.max(0, normZ) * 0.3).toFixed(3);

        cardEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        cardEl.style.opacity = "1";
        cardEl.style.zIndex = zIndex;

        if (isHovered) {
          cardEl.style.boxShadow = "0 24px 54px rgba(0, 0, 0, 0.85), 0 0 12px rgba(245, 189, 63, 0.12)";
        } else {
          cardEl.style.boxShadow = `0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowAlpha})`;
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isMobile]);

  return (
    <section 
      id="features"
      className="branches-section" 
      ref={containerRef} 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
    >
      <div className="branches-container">

        {/* Section Header styled in Emerald Horizon design */}
        <div className="section-heading branches-header">
          <p className="eyebrow">ACADEMIC DEPARTMENTS</p>
          <h2>
            Explore engineering <em>disciplines.</em>
          </h2>
          <p className="branches-subtitle">
            Interactive 3D navigation across university departments. Select a branch to access verified notes, question papers, and lab manuals.
          </p>
        </div>

        {/* 3D Orbit Layout */}
        <div className="orbit-scene" id="branch-cards" ref={orbitSceneRef}>
          
          <div className="orbit-world" ref={sceneRef}>

            {/* Department Cards */}
            {BRANCHES.map((item, index) => {
              const isSelected = Boolean(
                selectedBranch &&
                (selectedBranch.toLowerCase() === item.filterQuery.toLowerCase() ||
                 selectedBranch.toLowerCase() === item.name.toLowerCase() ||
                 selectedBranch.toLowerCase() === item.code.toLowerCase())
              );

              const handleCardClick = (e) => {
                e.preventDefault();
                if (onSelectBranch) {
                  onSelectBranch(item.code, item.name);
                } else {
                  navigate(`/notes?branch=${encodeURIComponent(item.code)}`);
                }
              };

              return (
                <div
                  key={item.id}
                  ref={(el) => (cardRefs.current[index] = el)}
                  className={`orbit-item ${hoveredIndex === index ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""}`}
                  style={{ "--index": index, "--accent": item.accent }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={handleCardClick}
                  title={`Explore ${item.name}`}
                  role="button"
                  tabIndex={0}
                >
                  {/* Seamless 3D Solid Card Panel */}
                  <article className="branch-card">
                    {/* High-res Image Background */}
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="branch-card-bg-img"
                      loading="eager"
                    />

                    {/* Cinematic Multi-stop Overlay */}
                    <div className="branch-card-gradient" />

                    {/* Subtle, soft ambient accent (significantly reduced glare) */}
                    <div 
                      className="branch-card-glow"
                      style={{
                        background: `radial-gradient(circle at 80% 20%, ${item.accent}14 0%, transparent 60%)`
                      }}
                    />

                    {/* Top Bar: Code Badge and ID */}
                    <div className="branch-card-top">
                      <span 
                        className="branch-code-badge"
                        style={{
                          borderColor: `${item.accent}44`,
                          boxShadow: "none"
                        }}
                      >
                        <span 
                          className="badge-dot" 
                          style={{ 
                            backgroundColor: item.accent,
                            boxShadow: `0 0 3px ${item.accent}88`
                          }} 
                        />
                        {item.code}
                      </span>
                      <span className="branch-number">{item.id}</span>
                    </div>

                    {/* Bottom Bar: Tag, Title, and Accent Line */}
                    <div className="branch-body">
                      <div className="branch-tag-row">
                        <span className="branch-tag" style={{ color: item.accent }}>
                          {item.tag}
                        </span>
                        {isSelected && (
                          <span 
                            className="branch-active-pill" 
                            style={{ 
                              borderColor: item.accent, 
                              color: "#ffffff",
                              backgroundColor: `${item.accent}55`
                            }}
                          >
                            ● ACTIVE
                          </span>
                        )}
                      </div>

                      <h3 className="branch-name">{item.name}</h3>

                      <div className="branch-action-row">
                        <span 
                          className="branch-line"
                          style={{
                            background: `linear-gradient(90deg, ${item.accent}, rgba(255, 226, 154, 0.4), transparent)`
                          }}
                        />
                        <span className="branch-action-text">Explore Notes →</span>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}

          </div>
        </div>

        {/* Ambition Statement aligned perfectly under 3D Cards */}
        <div className="branches-cta-footer">
          <p className="eyebrow">READY TO EXCEL?</p>
          <h2>
            Turn your ambition into<br />
            <em>academic success.</em>
          </h2>
          <a
            href="#branch-cards"
            className="primary-btn branches-cta-btn"
            onClick={handleExploreCatalogClick}
            aria-label="Explore 3D department cards catalog"
          >
            Explore Catalog <span>→</span>
          </a>
        </div>

      </div>
    </section>
  );
}

export default BranchSection;
