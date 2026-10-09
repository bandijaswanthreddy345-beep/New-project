import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer id="about" className="site-footer">
      {/* Platform Manifesto / Intro Section */}
      <div className="footer-platform-intro">
        <div className="footer-platform-heading">
          <p className="eyebrow">THE PLATFORM</p>
          <h2>
            Designed for a bold<br />
            <em>academic presence.</em>
          </h2>
        </div>
        <p className="footer-platform-desc">
          JNTU Circle is built to provide engineering students with instant,
          verified access to university resources. From semester exam question
          papers to lab manuals and real-time circular updates, everything is
          organized in a focused, distraction-free environment.
        </p>
      </div>

      <div className="footer-bottom-bar">
        <div>
          <Link className="logo" to="/" aria-label="JNTU Circle home">
            <span className="logo-mark"></span>
            <span>JNTU<span>CIRCLE</span></span>
          </Link>
          <p>Crafted for modern digital academic experiences at JNTU.</p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/notes">Notes</Link>
          <Link to="/papers">Papers</Link>
          <Link to="/calculator">Calculator</Link>
          <Link to="/reports">Reports</Link>
          <Link to="/notifications">Notifications</Link>
        </div>

        <p className="copyright">© {new Date().getFullYear()} JNTU Circle • Emerald Horizon</p>
      </div>
    </footer>
  );
}

export default Footer;