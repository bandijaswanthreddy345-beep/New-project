import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Hero({ onOpenProfile, onSelectBranch, selectedBranch = "" }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const clean = query.trim();

    if (clean.toLowerCase().includes("paper")) {
      const el = document.getElementById("previous-question-papers");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else navigate("/papers");
      return;
    }

    // Direct all queries to the intelligent JNTU AI Chatbot modal
    window.dispatchEvent(
      new CustomEvent("open-jntu-chatbot", {
        detail: { query: clean || "Hi" },
      })
    );
  };

  const branches = [
    { code: "CSE", icon: "terminal" },
    { code: "AIML", icon: "smart_toy" },
    { code: "ECE", icon: "memory" },
    { code: "ME", icon: "settings" },
    { code: "Civil", icon: "apartment" },
    { code: "EEE", icon: "bolt" },
  ];

  const handleBranchClick = (code) => {
    if (onSelectBranch) {
      onSelectBranch(code);
    }
    const el = document.getElementById("departments");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#departments`);
    }
  };

  return (
    <section id="hero-section" className="relative flex flex-col items-center text-center pt-8 md:pt-14 pb-6 w-full max-w-5xl mx-auto z-10 px-4">
      {/* Subtle ambient glow matching dark obsidian aesthetic */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#8B5CF6]/10 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Top Badge / Portal Status Indicator */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/40 backdrop-blur-xl text-[#C4B5FD] font-label-mono-sm text-label-mono-sm mb-4 shadow-[0_0_20px_rgba(139,92,246,0.35)] relative overflow-hidden group">
        <span className="material-symbols-outlined text-[15px] text-[#C4B5FD]">school</span>
        <span className="tracking-widest uppercase text-[11px] font-semibold text-[#F5F5FA]">
          ACADEMIC STUDENT COMPANION
        </span>
      </div>

      {/* Headings */}
      <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero font-bold tracking-tight text-[#F5F5FA]">
        Welcome to JNTU{" "}
        <span
          className="hero-circle-gradient"
          style={{
            backgroundImage: "linear-gradient(135deg, #E0D4FF 0%, #C4B5FD 50%, #A78BFA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "#C4B5FD",
            display: "inline-block",
          }}
        >
          Circle
        </span>
      </h1>
      <p className="mt-3 text-headline-sm md:text-headline-md font-semibold text-[#F5F5FA]">
        Built by Students, <span className="text-[#C4B5FD]">for Students.</span>
      </p>
      <p className="mt-2 font-body-md text-body-md text-[#A3A3B5] max-w-2xl leading-relaxed">
        Find Notes, Question Papers, Syllabus, Lab Programs and Notifications
      </p>

      {/* Prominent Capsule AI Search Bar */}
      <div className="mt-8 w-full max-w-2xl mx-auto">
        <form
          onSubmit={handleSearch}
          className="group relative flex items-center bg-[#12131B] border border-[#292733] hover:border-[#8B5CF6]/60 focus-within:border-[#8B5CF6] rounded-full p-2.5 sm:p-3 pl-4 sm:pl-5 shadow-2xl transition-all"
        >
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("open-jntu-chatbot", {
                  detail: { query: query.trim() || "Hi" },
                })
              )
            }
            title="Ask JNTU AI Chatbot"
            aria-label="Ask JNTU AI Chatbot"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-[#C4B5FD] shrink-0 mr-3 select-none shadow-[0_0_12px_rgba(139,92,246,0.2)] hover:scale-105 hover:bg-[#8B5CF6]/25 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#C4B5FD]">neurology</span>
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask JNTU AI, search notes, or type 'Build Student Profile'..."
            className="w-full bg-transparent text-[#F5F5FA] placeholder-[#A3A3B5] font-body-sm text-body-sm focus:outline-none pr-3"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#8B5CF6] hover:bg-[#7c4def] text-[#F5F5FA] flex items-center justify-center shrink-0 transition-all shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] cursor-pointer group/btn"
            aria-label="Search with AI"
            title="Ask AI"
          >
            <span className="material-symbols-outlined text-[18px] transition-transform group-hover/btn:translate-x-0.5">
              arrow_forward
            </span>
          </button>
        </form>
      </div>

      {/* Branch & Quick Action Filter Pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("open-jntu-chatbot", {
                detail: { query: "Build your student profile using chatbot" },
              })
            );
          }}
          className="px-4 py-2 rounded-full bg-[#12131B] border border-[#8B5CF6]/60 text-[#C4B5FD] font-body-sm text-body-sm font-semibold flex items-center gap-2 shadow-[0_0_16px_rgba(139,92,246,0.2)] hover:bg-[#27213B] hover:border-[#8B5CF6] transition-all cursor-pointer"
        >
          <span>Build Student Profile</span>
        </button>

        {branches.map((b) => {
          const isSelected = selectedBranch === b.code;
          return (
            <button
              key={b.code}
              type="button"
              onClick={() => handleBranchClick(b.code)}
              className={`px-3.5 py-1.5 rounded-full bg-[#12131B] border transition-all cursor-pointer group flex items-center gap-1.5 font-body-sm text-body-sm ${
                isSelected
                  ? "border-[#8B5CF6] bg-[#27213B]/60 text-[#C4B5FD]"
                  : "border-[#292733] hover:border-[#8B5CF6]/60 text-[#F5F5FA] hover:bg-[#27213B]/40"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[15px] ${
                  isSelected ? "text-[#C4B5FD]" : "text-[#A3A3B5] group-hover:text-[#C4B5FD]"
                }`}
              >
                {b.icon}
              </span>
              <span className="font-medium">{b.code}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Resource Cards (Notes, Question Papers, Syllabus) */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
        {/* Notes */}
        <Link
          to="/notes"
          className="group bg-[#12131B] border border-[#292733] hover:border-[#8B5CF6] rounded-2xl p-5 flex items-center justify-between text-left transition-all duration-300 hover:shadow-[0_4px_24px_-4px_rgba(139,92,246,0.25)] hover:bg-[#12131B]/90"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#08090D] border border-[#292733] flex items-center justify-center shrink-0 group-hover:border-[#8B5CF6]/50 group-hover:bg-[#8B5CF6]/10 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[#C4B5FD] text-[24px]">description</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-[#F5F5FA] group-hover:text-[#C4B5FD] transition-colors">
                Notes
              </h2>
              <p className="font-body-sm text-body-sm text-[#A3A3B5] mt-0.5 leading-tight">
                Well organized and easy to study
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#A3A3B5] group-hover:text-[#C4B5FD] text-[20px] transition-transform group-hover:translate-x-1 shrink-0 ml-3">
            arrow_forward
          </span>
        </Link>

        {/* Question Papers */}
        <a
          href="#previous-question-papers"
          className="group bg-[#12131B] border border-[#292733] hover:border-[#8B5CF6] rounded-2xl p-5 flex items-center justify-between text-left transition-all duration-300 hover:shadow-[0_4px_24px_-4px_rgba(139,92,246,0.25)] hover:bg-[#12131B]/90"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#08090D] border border-[#292733] flex items-center justify-center shrink-0 group-hover:border-[#8B5CF6]/50 group-hover:bg-[#8B5CF6]/10 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[#C4B5FD] text-[24px]">quiz</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-[#F5F5FA] group-hover:text-[#C4B5FD] transition-colors">
                Question Papers
              </h2>
              <p className="font-body-sm text-body-sm text-[#A3A3B5] mt-0.5 leading-tight">
                Practice for better results
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#A3A3B5] group-hover:text-[#C4B5FD] text-[20px] transition-transform group-hover:translate-x-1 shrink-0 ml-3">
            arrow_forward
          </span>
        </a>

        {/* Syllabus */}
        <Link
          to="/syllabus"
          className="group bg-[#12131B] border border-[#292733] hover:border-[#8B5CF6] rounded-2xl p-5 flex items-center justify-between text-left transition-all duration-300 hover:shadow-[0_4px_24px_-4px_rgba(139,92,246,0.25)] hover:bg-[#12131B]/90"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#08090D] border border-[#292733] flex items-center justify-center shrink-0 group-hover:border-[#8B5CF6]/50 group-hover:bg-[#8B5CF6]/10 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[#C4B5FD] text-[24px]">menu_book</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-[#F5F5FA] group-hover:text-[#C4B5FD] transition-colors">
                Syllabus
              </h2>
              <p className="font-body-sm text-body-sm text-[#A3A3B5] mt-0.5 leading-tight">
                Always stay ahead
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#A3A3B5] group-hover:text-[#C4B5FD] text-[20px] transition-transform group-hover:translate-x-1 shrink-0 ml-3">
            arrow_forward
          </span>
        </Link>
      </div>
    </section>
  );
}

export default Hero;