import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/jntu-circle-logo.png.png";

function Navbar() {
  const navigate = useNavigate();

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
            <h2>JNTU Circle</h2>
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
              SEARCH BUTTON
          ========================================== */}

          <li>
            <button
              type="button"
              className="nav-search-button"
              aria-label="Search"
              title="Search"
              onClick={handleSearchClick}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                <path
                  d="M20 20L16.65 16.65"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
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