import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BranchSection from "../components/BranchSection";
import LatestNotes from "../components/LatestNotes";
import QuestionPapers from "../components/QuestionPapers";
import Notifications from "../components/Notifications";
import LatestSyllabus from "../components/LatestSyllabus";
import LabPrograms from "../pages/LabPrograms";
import Footer from "../components/Footer";

function Home() {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBranchName, setSelectedBranchName] = useState("");

  const handleSelectBranch = (query, name) => {
    if (!query || selectedBranch === query) {
      setSelectedBranch("");
      setSelectedBranchName("");
    } else {
      setSelectedBranch(query);
      setSelectedBranchName(name || query);

      // Smoothly scroll down to the filtered resources section
      setTimeout(() => {
        const target = document.getElementById("academic-resources-section");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 80);
    }
  };

  return (
    <>
      {/* =========================
          NAVBAR
      ========================== */}
      <Navbar />

      {/* =========================
          HERO SECTION
      ========================== */}
      <Hero />

      {/* =========================
          HOME CONTENT
      ========================== */}
      <main className="home-main">
        <section className="home-content">
          {/* Branches (Connected to Backend Stats & Dynamic Filtering) */}
          <BranchSection 
            selectedBranch={selectedBranch} 
            onSelectBranch={handleSelectBranch} 
          />

          {/* Academic Resources Wrapper with Live Filter Banner */}
          <div id="academic-resources-section" className="academic-resources-anchor">
            {selectedBranch && (
              <div className="home-branch-filter-banner">
                <div className="filter-banner-left">
                  <span className="filter-banner-chip">
                    <span className="filter-banner-dot" />
                    DEPARTMENT FILTER ACTIVE
                  </span>
                  <h3 className="filter-banner-title">
                    Showing materials for: <span className="highlight-branch">{selectedBranchName}</span>
                  </h3>
                  <p className="filter-banner-sub">
                    Live database records across Notes, Question Papers, Syllabus, and Lab Programs
                  </p>
                </div>

                <div className="filter-banner-actions">
                  <button 
                    type="button"
                    className="filter-clear-btn"
                    onClick={() => handleSelectBranch("", "")}
                  >
                    ✕ Clear Filter
                  </button>
                  <button 
                    type="button"
                    className="filter-catalog-btn"
                    onClick={() => navigate(`/notes?search=${encodeURIComponent(selectedBranch)}`)}
                  >
                    Open Notes Page →
                  </button>
                </div>
              </div>
            )}

            {/* Latest Notes */}
            <LatestNotes search={selectedBranch} />

            {/* Question Papers */}
            <QuestionPapers search={selectedBranch} />

            {/* Notifications */}
            <Notifications />

            {/* Latest Syllabus */}
            <LatestSyllabus search={selectedBranch} />

            {/* Lab Programs */}
            <LabPrograms search={selectedBranch} />
          </div>

        </section>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <Footer />
    </>
  );
}

export default Home;