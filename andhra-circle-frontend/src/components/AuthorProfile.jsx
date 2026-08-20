import "./AuthorProfile.css";
import profile from "../assets/jaswanth.png.png";

function AuthorProfile() {
  return (
    <section className="author-section">
      <div className="author-section-heading">
        <span className="section-tag">
          PLATFORM CREATOR
        </span>

        <h2>Meet the Developer</h2>

        <p>
          The developer behind JNTU Circle and its
          student-focused academic resource platform.
        </p>
      </div>

      <div className="author-card">

        {/* =========================
            LEFT SIDE - PROFILE IMAGE
        ========================== */}

        <div className="author-image-wrapper">

          <div className="author-image-bg"></div>

          <img
            src={profile}
            alt="Bandi Jaswanth Reddy"
            className="author-image"
          />

          <span className="author-status">
            ●
          </span>

        </div>

        {/* =========================
            RIGHT SIDE - PROFILE INFO
        ========================== */}

        <div className="author-content">

          <span className="author-role-tag">
            PLATFORM CREATOR
          </span>

          <h2>
            Bandi Jaswanth Reddy
          </h2>

          <h4>
            Backend Developer
            <span>•</span>
            AIML Student
          </h4>

          <p className="author-description">
            JNTU Circle is a student-focused academic
            platform designed to provide easy access
            to notes, previous question papers,
            syllabus, notifications, and other
            essential learning resources.
          </p>

          {/* =========================
              HIGHLIGHTS
          ========================== */}

          <div className="author-highlights">

            <div className="author-highlight">

              <span className="highlight-icon">
                🎓
              </span>

              <div>
                <strong>
                  Student Focused
                </strong>

                <small>
                  Built to support learning
                </small>
              </div>

            </div>

            <div className="author-highlight">

              <span className="highlight-icon">
                💻
              </span>

              <div>
                <strong>
                  Full-Stack Development
                </strong>

                <small>
                  Modern web technologies
                </small>
              </div>

            </div>

          </div>

          {/* =========================
              AUTHOR PROFILE BUTTON
          ========================== */}

          <a
            href="mailto:support@jntucircle.com"
            className="author-btn"
          >
            <span>AUTHOR PROFILE</span>

            <span className="author-btn-arrow">
              →
            </span>
          </a>

        </div>

      </div>
    </section>
  );
}

export default AuthorProfile;

