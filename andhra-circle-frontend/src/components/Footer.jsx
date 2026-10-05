import { Link } from "react-router-dom";

function Footer() {
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "CGPA & SGPA Calculator", path: "/calculator" },
    { name: "Academic Reports", path: "/reports" },
    { name: "Upload Materials", path: "/upload-materials" },
    { name: "Notifications", path: "/notifications" },
  ];

  const resourceLinks = [
    { name: "Notes & Materials", path: "/notes" },
    { name: "Question Papers", path: "/papers" },
    { name: "Syllabus Copies", path: "/syllabus" },
    { name: "Lab Programs", path: "/lab-programs" },
    { name: "Search Resources", path: "/search" },
    { name: "Admin Dashboard", path: "/dashboard" },
  ];

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-column footer-brand">
          <Link to="/" className="footer-brand-title">
            <span className="footer-brand-icon">🎓</span>
            <span>JNTU Circle</span>
          </Link>

          <p className="footer-description">
            JNTU Circle is a centralized academic platform designed to help
            students easily access notes, question papers, syllabus,
            notifications, lab programs, and other essential learning
            resources.
          </p>

          <div className="footer-location">
            <span className="footer-icon">📍</span>
            <span>Andhra Pradesh, India</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>

          <ul className="footer-links">
            {quickLinks.map((link) => (
              <li key={link.path}>
                <Link to={link.path}>{link.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-column">
          <h3>Resources</h3>

          <ul className="footer-links">
            {resourceLinks.map((link) => (
              <li key={link.path}>
                <Link to={link.path}>{link.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-column footer-contact">
          <h3>Contact Us</h3>

          <p className="footer-description">
            Have questions, suggestions, or feedback? We'd love to hear from
            you.
          </p>

          <a
            href="mailto:support@jntucircle.com"
            className="footer-email"
          >
            <span className="footer-icon">✉</span>
            <span>support@jntucircle.com</span>
          </a>

          <div className="footer-location">
            <span className="footer-icon">📍</span>
            <span>Andhra Pradesh, India</span>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()}{" "}
          <strong>JNTU Circle</strong>. All rights reserved.
        </p>

        <p className="footer-tagline">
          Built for Students
          <span className="footer-divider">•</span>
          Made for Learning
        </p>
      </div>
    </footer>
  );
}

export default Footer;