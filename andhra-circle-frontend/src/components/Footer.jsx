import { Link, useNavigate } from "react-router-dom";

function Footer() {
  const navigate = useNavigate();

  const handleAdminDashboardClick = (e) => {
    e.preventDefault();
    // Clear stored admin credentials so fresh login is always required
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      state: {
        adminPrompt: true,
        message: "Admin authentication required. Please sign in to access the Admin Dashboard.",
      },
    });
  };

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "CGPA & SGPA Calculator", path: "/calculator" },
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
            <img
              src="/jntu-circle-logo.png"
              alt="JNTU Circle Logo"
              className="footer-brand-logo"
            />
            <div className="footer-brand-text">
              <h2><span className="font-deltha">JNTU</span> Circle</h2>
              <span>Academic Resource Hub</span>
            </div>
          </Link>

          <p className="footer-description">
            JNTU Circle is a centralized academic platform designed to help
            students easily access notes, question papers, syllabus,
            notifications, lab programs, and other essential learning
            resources.
          </p>

          <div className="footer-location">
            <span className="footer-contact-icon">📍</span>
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
                {link.path === "/dashboard" ? (
                  <a
                    href="/login"
                    onClick={handleAdminDashboardClick}
                    className="footer-admin-link"
                    title="Sign in to Admin Dashboard"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link to={link.path}>{link.name}</Link>
                )}
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
            href="mailto:jntucircle@gmail.com"
            className="footer-contact-item"
          >
            <span className="footer-contact-icon">✉</span>
            <span>jntucircle@gmail.com</span>
          </a>

          <a
            href="https://chat.whatsapp.com/D6eyPwzgdcnHpE4Y9ZHvdz"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-contact-item footer-whatsapp-link"
            title="Join JNTU Circle WhatsApp Community"
          >
            <span className="footer-contact-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.16 12.05 20.16C10.66 20.16 9.3 19.8 8.1 19.11L7.74 18.9L4.62 19.72L5.45 16.68L5.22 16.31C4.46 15.09 4.06 13.52 4.06 11.91C4.06 7.37 7.75 3.67 12.05 3.67ZM8.79 7.37C8.61 7.37 8.32 7.44 8.08 7.7C7.84 7.96 7.15 8.6 7.15 9.92C7.15 11.23 8.11 12.5 8.24 12.68C8.38 12.85 10.12 15.55 12.79 16.7C13.43 16.97 13.92 17.13 14.31 17.26C14.95 17.46 15.53 17.43 15.99 17.36C16.51 17.29 17.58 16.71 17.8 16.09C18.02 15.46 18.02 14.93 17.96 14.82C17.89 14.71 17.72 14.65 17.45 14.51C17.19 14.38 15.88 13.74 15.64 13.65C15.4 13.56 15.22 13.52 15.05 13.78C14.87 14.05 14.37 14.65 14.21 14.82C14.06 15 13.9 15.02 13.64 14.89C13.38 14.76 12.54 14.48 11.53 13.59C10.75 12.89 10.22 12.02 10.07 11.76C9.92 11.5 10.05 11.36 10.18 11.23C10.3 11.11 10.45 10.92 10.58 10.77C10.71 10.62 10.76 10.51 10.84 10.33C10.93 10.16 10.89 10.01 10.82 9.88C10.76 9.75 10.23 8.44 10.01 7.92C9.8 7.4 9.58 7.48 9.42 7.47C9.27 7.46 9.09 7.37 8.79 7.37Z" />
              </svg>
            </span>
            <span>WhatsApp Community</span>
          </a>

          <a
            href="https://instagram.com/jntucircle"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-contact-item footer-instagram-link"
            title="Follow @JNTUCIRCLE on Instagram"
          >
            <span className="footer-contact-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </span>
            <span>@JNTUCIRCLE</span>
          </a>

          <div className="footer-location">
            <span className="footer-contact-icon">📍</span>
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