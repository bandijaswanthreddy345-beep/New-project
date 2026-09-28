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

          {/* Branches */}
          <BranchSection />

          {/* Latest Notes */}
          <LatestNotes />

          {/* Question Papers */}
          <QuestionPapers />

          {/* Notifications */}
          <Notifications />

          {/* Latest Syllabus */}
          <LatestSyllabus />

          {/* Lab Programs */}
          <LabPrograms />

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