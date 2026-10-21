import { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BranchSection from "../components/BranchSection";
import QuestionPapersSection from "../components/QuestionPapersSection";
import LatestNotes from "../components/LatestNotes";
import AcademicConsole from "../components/AcademicConsole";
import Footer from "../components/Footer";
import StudentProfileModal from "../components/StudentProfileModal";

function Home() {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="bg-[#08090D] text-[#F5F5FA] min-h-screen selection:bg-primary-container selection:text-on-primary-container relative">
      {/* =========================
          NAVBAR
      ========================== */}
      <Navbar onOpenProfile={() => setIsProfileModalOpen(true)} />

      {/* =========================
          MAIN HERO & SECTIONS
      ========================== */}
      <main className="w-full pt-4 md:pt-6 bg-[#08090D] relative">
        {/* Background Architectural Grid & Constrained Lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
          <div className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[#8B5CF6]/10 rounded-full blur-[140px]" />
          <div className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] bg-[#27213B]/20 rounded-full blur-[120px]" />
          <svg
            className="w-full h-full stroke-[#292733]/40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern height="48" id="jntu-telemetry-grid" patternUnits="userSpaceOnUse" width="48">
                <path d="M 48 0 L 0 0 0 48" fill="none" strokeWidth="1" />
                <circle cx="48" cy="48" fill="#8B5CF6" fillOpacity="0.5" r="0.8" />
              </pattern>
            </defs>
            <rect fill="url(#jntu-telemetry-grid)" height="100%" width="100%" />
          </svg>
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-margin-mobile md:px-margin w-full flex flex-col gap-y-24 pt-8 md:pt-16 pb-12">
          
          {/* 1. Hero Section */}
          <Hero
            onOpenProfile={() => setIsProfileModalOpen(true)}
            selectedBranch={selectedBranch}
            onSelectBranch={setSelectedBranch}
          />

          {/* 2. 3D Department Branches (Interactive Architecture) */}
          <BranchSection
            selectedBranch={selectedBranch}
            onSelectBranch={setSelectedBranch}
          />

          {/* 3. Previous Question Papers */}
          <QuestionPapersSection />

          {/* 4. Student Academic Console (Preview) */}
          <AcademicConsole />

        </div>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <Footer />

      {/* =========================
          STUDENT PROFILE MODAL
      ========================== */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default Home;