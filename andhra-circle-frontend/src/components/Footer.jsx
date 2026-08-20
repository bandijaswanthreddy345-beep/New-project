import { Link } from "react-router-dom";

function Footer() {
const quickLinks = [
{
name: "Home",
path: "/",
},
{
name: "Notes",
path: "/notes",
},
{
name: "Question Papers",
path: "/papers",
},
{
name: "Syllabus",
path: "/syllabus",
},
{
name: "Notifications",
path: "/notifications",
},
];

const resourceLinks = [
{
name: "Lab Programs",
path: "/lab-programs",
},
{
name: "Search Resources",
path: "/search",
},
{
name: "Create Account",
path: "/register",
},
{
name: "Admin Login",
path: "/login",
},
];

return ( <footer className="footer"> <div className="footer-container">

```
    {/* ======================================
        BRAND
    ======================================= */}

    <div className="footer-column footer-brand">
      <div className="footer-brand-title">
        <span className="footer-brand-icon">
          🎓
        </span>

        <h2>
          JNTU Circle
        </h2>
      </div>

      <p>
        JNTU Circle is a centralized
        academic platform that provides
        students with easy access to
        notes, question papers, syllabus,
        notifications, and other essential
        learning resources.
      </p>

      <p className="footer-location">
        📍 Andhra Pradesh, India
      </p>
    </div>

    {/* ======================================
        QUICK LINKS
    ======================================= */}

    <div className="footer-column">
      <h3>
        Quick Links
      </h3>

      <ul>
        {quickLinks.map(
          (link) => (
            <li
              key={link.path}
            >
              <Link
                to={link.path}
              >
                {link.name}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>

    {/* ======================================
        RESOURCES
    ======================================= */}

    <div className="footer-column">
      <h3>
        Resources
      </h3>

      <ul>
        {resourceLinks.map(
          (link) => (
            <li
              key={link.path}
            >
              <Link
                to={link.path}
              >
                {link.name}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>

    {/* ======================================
        CONTACT
    ======================================= */}

    <div className="footer-column footer-contact">
      <h3>
        Contact Us
      </h3>

      <p>
        Have questions, suggestions,
        or feedback? We would be happy
        to hear from you.
      </p>

      <a
        href="mailto:support@jntucircle.com"
        className="footer-email"
      >
        ✉️ support@jntucircle.com
      </a>

      <p className="footer-location">
        📍 Andhra Pradesh, India
      </p>
    </div>

  </div>

  {/* ======================================
      FOOTER BOTTOM
  ======================================= */}

  <div className="footer-bottom">
    <p>
      © {new Date().getFullYear()}{" "}
      <strong>
        JNTU Circle
      </strong>
      . All rights reserved.
    </p>

    <p>
      Built for Students
      <span className="footer-divider">
        •
      </span>
      Made for Learning
    </p>
  </div>
</footer>


);
}

export default Footer;
