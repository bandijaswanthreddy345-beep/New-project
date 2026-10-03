import { useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { MetalFx, useMetalBend } from "metal-fx";
import logo from "../assets/jntu-circle-logo.png.png";

function Navbar() {
  const navigate = useNavigate();
  const searchMetalRef = useRef(null);

  // Hook for cursor-driven liquid metal bend interaction
  useMetalBend(searchMetalRef);

  const navigationLinks = [
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
      name: "Lab Programs",
      path: "/lab-programs",
    },
    {
      name: "Notifications",
      path: "/notifications",
    },
  ];

  // ==========================================
  // OPEN SEARCH
  // ==========================================

  const handleSearchClick = (e) => {
    e.preventDefault();

    /*
      Add a timestamp so that clicking Search
      again while already on /search still
      creates a new navigation event.
    */

    navigate(`/search?open=${Date.now()}`);
  };

  return (
    <header className="navbar">

      {/* ==========================================
          LOGO
      ========================================== */}

      <div className="logo">
        <Link to="/">
          <img
            src={logo}
            alt="JNTU Circle Logo"
            className="logo-image"
          />

          <div className="logo-text">
            <h2><span className="font-deltha">JNTU</span> Circle</h2>
            <span>Academic Resource Hub</span>
          </div>
        </Link>
      </div>

      {/* ==========================================
          NAVIGATION
      ========================================== */}

      <nav>
        <ul className="nav-links">

          {navigationLinks.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}

          {/* ==========================================
              3D METAL SEARCH BUTTON
          ========================================== */}

          <li className="nav-metal-search-item">
            <MetalFx
              ref={searchMetalRef}
              preset="chromatic"
              variant="circle"
              strength={1}
              innerShadow
              className="metal-search-wrapper"
            >
              <button
                type="button"
                className="metal-search-btn"
                aria-label="Search"
                title="Search"
                onClick={handleSearchClick}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="metal-search-icon"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
                </svg>
              </button>
            </MetalFx>
          </li>



          {/* ==========================================
              LOGIN BUTTON
          ========================================== */}

          <li>
            <Link
              to="/login"
              className="nav-login-button"
            >
              <span>Login</span>
              <span className="login-arrow">→</span>
            </Link>
          </li>

        </ul>
      </nav>

    </header>
  );
}

export default Navbar;