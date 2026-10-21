import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import aimlImg from "../assets/branches/aiml.jpg";
import cseImg from "../assets/branches/cse.jpg";
import eceImg from "../assets/branches/ece.jpg";
import mechImg from "../assets/branches/mech.jpg";
import civilImg from "../assets/branches/civil.jpg";
import eeeImg from "../assets/branches/eee.jpg";

const BRANCHES = [
  {
    id: "01",
    name: "AI & Machine Learning",
    code: "AIML",
    tag: "NEURAL NETS & DATA SCIENCE",
    image: aimlImg,
    color: "#38bdf8",
    watermark: "AI",
  },
  {
    id: "02",
    name: "Computer Science Engineering",
    code: "CSE",
    tag: "SOFTWARE & ALGORITHMS",
    image: cseImg,
    color: "#8B5CF6",
    watermark: "CS",
  },
  {
    id: "03",
    name: "Electronics & Communication",
    code: "ECE",
    tag: "VLSI & EMBEDDED SYSTEMS",
    image: eceImg,
    color: "#8B5CF6",
    watermark: "EC",
  },
  {
    id: "04",
    name: "Mechanical Engineering",
    code: "MECH",
    tag: "ROBOTICS & AUTOMATION",
    image: mechImg,
    color: "#38bdf8",
    watermark: "ME",
  },
  {
    id: "05",
    name: "Civil Engineering",
    code: "CIVIL",
    tag: "SMART INFRASTRUCTURE",
    image: civilImg,
    color: "#eab308",
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
  const [isMobile, setIsMobile] = useState(false);
  const dragStartRef = useRef(null);

  // Responsive breakpoint tracking
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Synchronize if selectedBranch prop changes externally
  useEffect(() => {
    if (selectedBranch) {
      const idx = BRANCHES.findIndex(
        (b) => b.code.toLowerCase() === selectedBranch.toLowerCase()
      );
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    }
  }, [selectedBranch]);

  // Smooth continuous auto-rotation: always keeps moving smoothly even when in view or out of view
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % BRANCHES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const prevBranch = () => {
    setActiveIndex((prev) => (prev - 1 + BRANCHES.length) % BRANCHES.length);
  };

  const nextBranch = () => {
    setActiveIndex((prev) => (prev + 1) % BRANCHES.length);
  };

  const handleBranchClick = (branch, isCenter) => {
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

  // Calculate 3D circular transformation for each card
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

    if (isMobile) {
      // Mobile 3D adjustments
      if (offset === 0) {
        return {
          transform: "translate3d(0, 0, 40px) rotateY(0deg) scale(1)",
          zIndex: 30,
          opacity: 1,
          filter: "brightness(1) drop-shadow(0 15px 30px rgba(139, 92, 246, 0.4))",
          pointerEvents: "auto",
        };
      }
      const xMobile = offset < 0 ? -160 : 160;
      const rotMobile = offset < 0 ? 22 : -22;
      return {
        transform: `translate3d(${xMobile}px, 0, -40px) rotateY(${rotMobile}deg) scale(0.82)`,
        zIndex: 20 - absOffset,
        opacity: 0.5,
        filter: "brightness(0.6)",
        pointerEvents: "auto",
      };
    }

    // Desktop 3D cylindrical orbit calculation
    if (offset === 0) {
      return {
        transform: "translate3d(0, 0, 100px) rotateY(0deg) scale(1.06)",
        zIndex: 30,
        opacity: 1,
        filter: "brightness(1) drop-shadow(0 25px 45px rgba(139, 92, 246, 0.45))",
        pointerEvents: "auto",
      };
    }

    if (absOffset === 1) {
      const xTranslate = offset === -1 ? -340 : 340;
      const yRotate = offset === -1 ? 26 : -26;
      return {
        transform: `translate3d(${xTranslate}px, 0, -30px) rotateY(${yRotate}deg) scale(0.88)`,
        zIndex: 20,
        opacity: 0.78,
        filter: "brightness(0.7)",
        pointerEvents: "auto",
      };
    }

    if (absOffset === 2) {
      const xTranslate = offset === -2 ? -580 : 580;
      const yRotate = offset === -2 ? 40 : -40;
      return {
        transform: `translate3d(${xTranslate}px, 0, -120px) rotateY(${yRotate}deg) scale(0.72)`,
        zIndex: 10,
        opacity: 0.35,
        filter: "brightness(0.45)",
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
    <section
      className="flex flex-col items-center w-full scroll-mt-24 py-12 md:py-16 relative"
      id="departments"
    >
      {/* Seamless Ambient Radial Glow (Fades 100% naturally without clipped box edges) */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse 960px 450px at 50% 55%, rgba(139, 92, 246, 0.12) 0%, rgba(39, 33, 59, 0.04) 50%, transparent 80%)",
        }}
      />

      {/* Section Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 z-10 px-4">
        <div className="flex items-center gap-3 text-[#A3A3B5] text-body-sm font-medium mb-3">
          <span className="w-10 h-[1px] bg-[#494454]/60" />
          <span className="font-label-mono-sm text-[12px] tracking-widest text-[#C4B5FD] uppercase font-semibold">
            Browse by Branch
          </span>
          <span className="w-10 h-[1px] bg-[#494454]/60" />
        </div>
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-[#F5F5FA] tracking-tight leading-tight max-w-2xl mx-auto">
          Explore Academic Resources by Engineering Department
        </h2>
      </div>

      {/* 3D Rotating Stage */}
      <div
        className="relative w-full max-w-6xl mx-auto flex items-center justify-center min-h-[380px] md:min-h-[440px] select-none"
        style={{ perspective: "1200px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        <div
          className="relative w-full h-[320px] md:h-[350px] flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {BRANCHES.map((branch, index) => {
            const isCenter = index === activeIndex;
            const style3D = getCardStyle(index);

            return (
              <div
                key={branch.code}
                onClick={() => handleBranchClick(branch, isCenter)}
                style={{
                  ...style3D,
                  transition: "all 0.85s cubic-bezier(0.25, 1, 0.45, 1)",
                }}
                className={`absolute top-0 w-[290px] sm:w-[340px] md:w-[410px] h-[300px] md:h-[330px] rounded-2xl md:rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 cursor-pointer ${
                  isCenter
                    ? "border-[#8B5CF6] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(139,92,246,0.4)]"
                    : "border-[#292733] hover:border-[#8B5CF6]/50"
                } bg-[#12131B]`}
              >
                {/* Visual Image */}
                <img
                  src={branch.image}
                  alt={branch.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                    isCenter
                      ? "opacity-90 scale-105"
                      : "opacity-45 scale-100"
                  }`}
                  loading="lazy"
                />

                {/* Dark Gradient Overlay for optimal legibility */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    isCenter
                      ? "bg-gradient-to-t from-[#08090D] via-[#08090D]/60 to-[#08090D]/15"
                      : "bg-gradient-to-t from-[#08090D] via-[#08090D]/85 to-[#08090D]/40"
                  }`}
                />

                {/* Card Content */}
                <div className="relative h-full p-6 md:p-7 flex flex-col justify-between z-10">
                  {/* Top Badge (clean branch code without dot or counter) */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#08090D]/85 border border-[#8B5CF6]/50 backdrop-blur-md shadow-md">
                      <span className="font-label-mono-sm text-[11px] font-bold tracking-wider text-[#F5F5FA]">
                        {branch.code}
                      </span>
                    </div>
                  </div>

                  {/* Middle / Bottom Content */}
                  <div className="flex flex-col gap-1.5">
                    <span
                      className="font-label-mono-sm text-[11px] font-bold tracking-wider uppercase"
                      style={{ color: branch.color }}
                    >
                      {branch.tag}
                    </span>

                    <h3 className="font-headline-md text-[22px] md:text-[25px] font-bold text-[#F5F5FA] leading-tight group-hover:text-[#C4B5FD] transition-colors">
                      {branch.name}
                    </h3>

                    {/* Neon Accent Bar */}
                    <div
                      className="w-14 h-1 rounded-full mt-1"
                      style={{
                        backgroundColor: branch.color,
                        boxShadow: `0 0 12px ${branch.color}`,
                      }}
                    />

                    {/* CTA */}
                    <div className="mt-3 flex items-center justify-end pt-2 border-t border-[#292733]/60 text-[11px] font-label-mono-sm">
                      <span
                        className="text-[#C4B5FD] font-semibold flex items-center gap-1 group-hover:underline"
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
      <div className="flex flex-col items-center gap-4 mt-6 z-10">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prevBranch}
            aria-label="Previous department"
            className="w-10 h-10 rounded-full bg-[#12131B] border border-[#292733] text-[#A3A3B5] hover:text-[#F5F5FA] hover:border-[#8B5CF6] hover:bg-[#27213B]/40 hover:shadow-[0_0_16px_rgba(139,92,246,0.35)] transition-all flex items-center justify-center cursor-pointer group active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-0.5">
              chevron_left
            </span>
          </button>

          <button
            type="button"
            onClick={nextBranch}
            aria-label="Next department"
            className="w-10 h-10 rounded-full bg-[#12131B] border border-[#292733] text-[#A3A3B5] hover:text-[#F5F5FA] hover:border-[#8B5CF6] hover:bg-[#27213B]/40 hover:shadow-[0_0_16px_rgba(139,92,246,0.35)] transition-all flex items-center justify-center cursor-pointer group active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">
              chevron_right
            </span>
          </button>
        </div>

        {/* Interactive Dots for direct jump */}
        <div className="flex items-center gap-2">
          {BRANCHES.map((b, i) => (
            <button
              key={b.code}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to ${b.name}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex
                  ? "w-7 bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]"
                  : "w-2 bg-[#292733] hover:bg-[#494454]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BranchSection;
