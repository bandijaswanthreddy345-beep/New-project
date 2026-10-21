import { useState } from "react";
import noteThumbnail from "../assets/note-thumbnail.jpg";
import trigger100Hearts from "../utils/heartBurst";

const PAPERS_DATA = [
  {
    id: "qp-1",
    examType: "Semester Notes",
    branch: "CSE",
    title: "Python Programming & Data Structures",
    views: "1.4k",
    downloads: 482,
    likes: 48,
    pdfUrl: "/sample-paper.pdf",
    units: [
      "Unit I: Python Basics, Control Structures & Functions",
      "Unit II: Strings, Lists, Tuples & Dictionaries",
      "Unit III: OOP Concepts & File Handling",
      "Unit IV: Linear Data Structures (Stacks, Queues, Linked Lists)",
      "Unit V: Trees, Graphs & Sorting Algorithms",
    ],
  },
  {
    id: "qp-2",
    examType: "Semester Notes",
    branch: "AIML",
    title: "Principles of Programming (POP)",
    views: "864",
    downloads: 290,
    likes: 32,
    pdfUrl: "/sample-paper.pdf",
    units: [
      "Unit I: Problem Solving & Algorithms",
      "Unit II: Core C Programming Paradigms",
      "Unit III: Memory Management & Pointers",
      "Unit IV: Data Structures in AI Applications",
      "Unit V: Logic & Computational Foundations",
    ],
  },
  {
    id: "qp-3",
    examType: "Semester Notes",
    branch: "CSE / ECE",
    title: "Engineering Physics & Quantum Mechanics",
    views: "1.1k",
    downloads: 370,
    likes: 65,
    pdfUrl: "/sample-paper.pdf",
    units: [
      "Unit I: Wave Optics & Interference",
      "Unit II: Lasers & Optical Fibers",
      "Unit III: Quantum Mechanics & Schrödinger Equation",
      "Unit IV: Band Theory of Solids & Semiconductors",
      "Unit V: Superconductivity & Dielectric Properties",
    ],
  },
  {
    id: "qp-4",
    examType: "Semester Notes",
    branch: "AIML / CSE",
    title: "Discrete Mathematics & Graph Theory",
    views: "2.3k",
    downloads: 910,
    likes: 118,
    pdfUrl: "/sample-paper.pdf",
    units: [
      "Unit I: Mathematical Logic & Predicates",
      "Unit II: Set Theory, Relations & Functions",
      "Unit III: Recurrence Relations & Generating Functions",
      "Unit IV: Graph Theory Fundamentals & Trees",
      "Unit V: Planar Graphs, Coloring & Algebraic Structures",
    ],
  },
];

function QuestionPapersSection() {
  const [papers, setPapers] = useState(() => {
    try {
      const storedLikes = JSON.parse(localStorage.getItem("andhra_liked_papers_v2") || "{}");
      return PAPERS_DATA.map((p) => {
        const isLiked = Boolean(storedLikes[p.id]);
        return {
          ...p,
          isLiked,
          likes: isLiked ? p.likes + 1 : p.likes,
        };
      });
    } catch {
      return PAPERS_DATA;
    }
  });

  const [previewPaper, setPreviewPaper] = useState(null);
  const [blinkingPaperId, setBlinkingPaperId] = useState(null);
  const [downloadToast, setDownloadToast] = useState(null);

  const handlePreviewPaper = (paper) => {
    setBlinkingPaperId(paper.id);
    setTimeout(() => {
      setPreviewPaper(paper);
      setBlinkingPaperId(null);
    }, 650);
  };

  // Toggle Like Reaction with 3D 100-Hearts Pop Celebration & Storage
  const toggleLike = (id, e) => {
    const targetPaper = papers.find((p) => p.id === id);

    // Trigger volcanic 3D 100-hearts pop burst on like
    if (targetPaper && !targetPaper.isLiked && e) {
      try {
        const rect = e.currentTarget.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        trigger100Hearts(originX, originY);
      } catch (err) {
        console.error("Heart burst trigger error:", err);
      }
    }

    setPapers((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      });

      try {
        const likesMap = {};
        updated.forEach((p) => {
          if (p.isLiked) likesMap[p.id] = true;
        });
        localStorage.setItem("andhra_liked_papers_v2", JSON.stringify(likesMap));
      } catch (err) {
        console.warn("Storage access failed:", err);
      }

      return updated;
    });
  };

  // Handle Download with count increment & toast
  const handleDownload = (paper) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === paper.id ? { ...p, downloads: p.downloads + 1 } : p))
    );

    const blob = new Blob([
      `%PDF-1.4\n% JNTU Circle - Verified Academic Resource\nTitle: ${paper.title}\nBranch: ${paper.branch}\nStatus: Verified Notes & PYQ Bank\nDownloaded from JNTU Circle Academic Portal.`
    ], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${paper.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadToast(`Downloading: ${paper.title}.pdf`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  return (
    <section className="flex flex-col items-center w-full scroll-mt-20 py-4" id="previous-question-papers">
      {/* Badge & Headings */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/40 text-[#C4B5FD] font-label-mono-sm text-[11px] mb-3 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <span className="material-symbols-outlined text-[14px] text-[#C4B5FD]">school</span>
          <span className="tracking-wider uppercase font-semibold">EXAM RESOURCES</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-[#F5F5FA] tracking-tight">
          Previous Question Papers
        </h2>
        <div className="w-12 h-1 rounded-full bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6] mt-2 mb-2" />
        <p className="font-body-md text-body-md text-[#A3A3B5]">
          Practice with previous examination question papers.
        </p>
      </div>

      {/* 4-Column Question Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="group bg-[#12131B] border border-[#292733] hover:border-[#8B5CF6]/70 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(139,92,246,0.22)] hover:-translate-y-1 relative"
          >
            <div>
              {/* Thumbnail Header */}
              <div className="relative h-40 w-full overflow-hidden border-b border-[#292733] bg-[#0d0e15]">
                <img
                  src={noteThumbnail}
                  alt={paper.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12131B] via-[#08090D]/50 to-transparent" />

                {/* Badge Overlay */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#08090D]/90 border border-[#8B5CF6]/50 text-[#C4B5FD] text-[11px] font-label-mono-sm font-semibold backdrop-blur-md shadow-[0_0_10px_rgba(139,92,246,0.3)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
                    {paper.examType}
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-3.5 flex flex-col gap-2">
                <div className="flex items-center">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C4B5FD] text-[11px] font-label-mono-sm font-semibold tracking-wide">
                    {paper.branch}
                  </span>
                </div>

                <h3 className="font-headline-sm text-[15px] font-bold text-[#F5F5FA] group-hover:text-[#C4B5FD] transition-colors leading-snug line-clamp-2">
                  {paper.title}
                </h3>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="p-3.5 pt-0 flex flex-col gap-2.5 mt-1">
              <div className="flex items-center justify-between text-[11px] font-label-mono-sm border-t border-[#292733]/60 pt-2.5">
                {/* Views & Downloads: Mono White with NO background, NO borders, NO colored symbols */}
                <div className="flex items-center gap-3 text-white">
                  <span className="inline-flex items-center gap-1.5 text-white">
                    <span className="material-symbols-outlined text-[15px] text-white">visibility</span>
                    <span className="font-semibold text-white text-[11px]">{paper.views}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-white">
                    <span className="material-symbols-outlined text-[15px] text-white">download</span>
                    <span className="font-semibold text-white text-[11px]">{paper.downloads}</span>
                  </span>
                </div>

                {/* Interactive Like Reaction */}
                <button
                  type="button"
                  aria-label="Bookmark paper"
                  onClick={(e) => toggleLike(paper.id, e)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#08090D] border transition-all cursor-pointer ${
                    paper.isLiked
                      ? "border-[#f43f5e]/60 text-[#f43f5e] shadow-[0_0_10px_rgba(244,63,94,0.25)]"
                      : "border-[#292733] text-[#A3A3B5] hover:text-[#f43f5e] hover:border-[#f43f5e]/40"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[14px] transition-transform ${
                      paper.isLiked ? "scale-110 text-[#f43f5e]" : ""
                    }`}
                  >
                    {paper.isLiked ? "favorite" : "favorite_border"}
                  </span>
                  <span className={`font-semibold text-[11px] ${paper.isLiked ? "text-[#f43f5e]" : ""}`}>
                    {paper.likes}
                  </span>
                </button>
              </div>

              {/* Action Buttons: Solid Purple Preview (No black at corners) & Download */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePreviewPaper(paper)}
                  className="group/eye px-3 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7c4def] text-white font-medium text-[12px] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_14px_rgba(139,92,246,0.35)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] active:scale-[0.98] cursor-pointer"
                  title="Preview Question Paper"
                >
                  <span className={`material-symbols-outlined text-[15px] ${blinkingPaperId === paper.id ? "eye-blink-anim" : ""}`}>
                    visibility
                  </span>
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(paper)}
                  className="px-3 py-2 rounded-xl bg-[#08090D] border border-[#292733] hover:border-[#8B5CF6]/70 hover:bg-[#1f1d2e] text-[#F1F5F9] font-medium text-[12px] flex items-center justify-center gap-1.5 transition-all hover:shadow-[0_0_12px_rgba(139,92,246,0.2)] active:scale-[0.98] cursor-pointer group/dl"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#C4B5FD] group-hover/dl:translate-y-0.5 transition-transform">
                    download
                  </span>
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          HIGH-TECH PDF PREVIEW MODAL (z-[999999] and pt-24 so it never overlaps with header)
      ========================================================================= */}
      {previewPaper && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 pt-24 pb-8 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={() => setPreviewPaper(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#12131B] border border-[#8B5CF6]/50 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(139,92,246,0.3)] overflow-hidden flex flex-col max-h-[85vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-[#292733] bg-[#0d0e15] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center text-[#C4B5FD]">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-[16px] font-bold text-[#F5F5FA] leading-tight">
                    {previewPaper.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] text-[10px] font-label-mono-sm font-semibold">
                      {previewPaper.branch}
                    </span>
                    <span className="text-[11px] text-[#A3A3B5] font-label-mono-sm">
                      {previewPaper.examType} • PDF Document
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewPaper(null)}
                className="w-8 h-8 rounded-lg bg-[#1a1b26] border border-[#292733] hover:border-[#8B5CF6]/60 text-[#A3A3B5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Document Viewer Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#08090D] flex flex-col items-center">
              <div className="w-full max-w-2xl bg-[#0f1016] border border-[#292733] rounded-xl p-8 shadow-2xl relative overflow-hidden text-[#E2E8F0]">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5">
                  <span className="text-8xl font-black font-display-hero text-[#8B5CF6] -rotate-45">
                    JNTU CIRCLE
                  </span>
                </div>

                {/* Document Header */}
                <div className="text-center pb-6 border-b border-[#292733] mb-6">
                  <p className="font-label-mono-sm text-[11px] text-[#C4B5FD] tracking-widest uppercase font-semibold">
                    JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY
                  </p>
                  <h4 className="font-display-hero text-xl font-bold text-[#F8FAFC] mt-1">
                    {previewPaper.title}
                  </h4>
                  <p className="font-label-mono-sm text-[12px] text-[#94A3B8] mt-1">
                    Department of {previewPaper.branch} • Semester Lecture Notes & PYQ Bank
                  </p>
                </div>

                {/* Course Modules Index */}
                <div className="space-y-4">
                  <h5 className="font-label-mono-sm text-[12px] font-bold text-[#C4B5FD] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                    Syllabus Coverage & Lecture Notes
                  </h5>

                  <div className="space-y-2.5">
                    {previewPaper.units.map((unit, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#141520] border border-[#292733]/80 flex items-start gap-3 hover:border-[#8B5CF6]/40 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-md bg-[#8B5CF6]/20 text-[#C4B5FD] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-[13px] text-[#F1F5F9] font-medium leading-relaxed">
                            {unit}
                          </p>
                          <span className="text-[11px] text-[#94A3B8] font-label-mono-sm mt-0.5 block">
                            Includes Detailed Explanations, Diagrams & Past 5-Year Solved Questions
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample PYQ Section */}
                <div className="mt-6 pt-6 border-t border-[#292733]">
                  <h5 className="font-label-mono-sm text-[12px] font-bold text-[#C4B5FD] uppercase tracking-wider mb-3">
                    Sample University Examination Questions
                  </h5>
                  <div className="p-3.5 rounded-lg bg-[#12131D] border border-[#292733] text-[12px] font-mono text-[#94A3B8] leading-relaxed">
                    <p className="text-[#F8FAFC] font-semibold mb-1">Q1. Answer all questions (Compulsory - 10 Marks):</p>
                    <p className="mb-1">a) Explain the fundamental architecture and lifecycle with suitable diagram.</p>
                    <p className="mb-1">b) Compare time and space complexity trade-offs with code benchmarks.</p>
                    <p>c) State the main theorem and provide mathematical derivation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 px-6 border-t border-[#292733] bg-[#0d0e15] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-[12px] font-label-mono-sm text-white">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="material-symbols-outlined text-[15px] text-white">visibility</span>
                  <span className="text-white font-medium">{previewPaper.views} Views</span>
                </span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1.5 text-white">
                  <span className="material-symbols-outlined text-[15px] text-white">download</span>
                  <span className="text-white font-medium">{previewPaper.downloads} Downloads</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPaper(null)}
                  className="px-4 py-2 rounded-xl bg-[#141520] border border-[#292733] hover:border-[#8B5CF6]/50 text-[#F1F5F9] text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewPaper)}
                  className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7c4def] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.35)] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download Full PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Download Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#12131B] border border-[#8B5CF6] text-[#F1F5F9] text-[13px] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-[#A855F7]">check_circle</span>
          <span>{downloadToast}</span>
        </div>
      )}
    </section>
  );
}

export default QuestionPapersSection;
