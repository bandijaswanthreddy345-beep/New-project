import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BranchSection from "../components/BranchSection";
import LatestNotes from "../components/LatestNotes";
import QuestionPapers from "../components/QuestionPapers";
import LatestSyllabus from "../components/LatestSyllabus";
import LabPrograms from "../pages/LabPrograms";
import Footer from "../components/Footer";

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
          <div id="academic-resources-section" className="academic-resources-anchor">
            {/* Latest Notes */}
            <LatestNotes />

            {/* Question Papers */}
            <QuestionPapers />

            {/* Latest Syllabus */}
            <LatestSyllabus />

            {/* Lab Programs */}
            <LabPrograms />
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