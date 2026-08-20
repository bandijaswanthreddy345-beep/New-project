import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BranchSection from "../components/BranchSection";
import LatestNotes from "../components/LatestNotes";
import QuestionPapers from "../components/QuestionPapers";
import Notifications from "../components/Notifications";
import LatestSyllabus from "../components/LatestSyllabus";
import LabPrograms from "../pages/LabPrograms";
import AuthorProfile from "../components/AuthorProfile";
import Footer from "../components/Footer";

function Home() {
  const navigate = useNavigate();

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

        {/* =========================
            SIDEBAR
        ========================== */}

        <aside className="home-sidebar">

          {/* Upload Study Materials */}

          <div className="sidebar-card upload-study-card">

            <div className="sidebar-card-header">
              Upload Study Materials
            </div>

            <div className="sidebar-card-content">

              <p>
                Share useful notes,
                question papers, study
                materials, and academic
                resources.
              </p>

              <button
                type="button"
                className="sidebar-primary-button"
                onClick={() => navigate("/dashboard")}
              >
                Upload Materials ⤴
              </button>

              <small>
                Your contribution helps
                students.
              </small>

            </div>
          </div>

          {/* Support */}

          <div className="sidebar-card support-card">

            <div className="sidebar-card-header">
              Support Andhra Circle
            </div>

            <div className="sidebar-card-content">

              <p>
                Help us improve the
                platform.
              </p>

              <button
                type="button"
                className="sidebar-primary-button"
              >
                Support ❤️
              </button>

            </div>
          </div>

          {/* Author */}

          <AuthorProfile />

        </aside>
      </main>

      {/* =========================
          FOOTER
      ========================== */}

      <Footer />
    </>
  );
}

export default Home;

