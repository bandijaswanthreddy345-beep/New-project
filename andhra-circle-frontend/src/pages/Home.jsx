import { lazy, Suspense } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BranchSection from "../components/BranchSection";
import LatestNotes from "../components/LatestNotes";
import Footer from "../components/Footer";

// Lazy-load below-the-fold academic resource components
const QuestionPapers = lazy(() => import("../components/QuestionPapers"));
const LatestSyllabus = lazy(() => import("../components/LatestSyllabus"));
const LabPrograms = lazy(() => import("../pages/LabPrograms"));

function SectionSkeleton() {
  return (
    <div
      style={{
        minHeight: "160px",
        margin: "1.5rem 0",
        borderRadius: "14px",
        background: "rgba(255, 255, 255, 0.03)",
      }}
    />
  );
}

function Home() {
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
          {/* Branches (3D Orbit Model) */}
          <BranchSection />

          {/* Academic Resources Wrapper */}
          <div
            id="academic-resources-section"
            className="academic-resources-anchor"
          >
            {/* Latest Notes */}
            <LatestNotes />

            {/* Question Papers */}
            <Suspense fallback={<SectionSkeleton />}>
              <QuestionPapers />
            </Suspense>

            {/* Latest Syllabus */}
            <Suspense fallback={<SectionSkeleton />}>
              <LatestSyllabus />
            </Suspense>

            {/* Lab Programs */}
            <Suspense fallback={<SectionSkeleton />}>
              <LabPrograms />
            </Suspense>
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
