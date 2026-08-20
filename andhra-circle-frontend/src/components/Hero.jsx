import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchSuggestions from "./SearchSuggestions";

function Hero() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // =========================================================
  // SEARCH SUBMIT
  // =========================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    const query = search.trim();

    console.log("=================================");
    console.log("HERO SEARCH SUBMIT");
    console.log("SEARCH VALUE:", search);
    console.log("QUERY:", query);
    console.log("=================================");

    // Do nothing if search box is empty
    if (!query) {
      console.log("SEARCH IS EMPTY");
      return;
    }

    // IMPORTANT:
    // SearchResults.jsx must read ?query=
    const searchUrl = `/search?query=${encodeURIComponent(query)}`;

    console.log("NAVIGATING TO:", searchUrl);

    navigate(searchUrl);
  };

  // =========================================================
  // SEARCH INPUT CHANGE
  // =========================================================

  const handleSearchChange = (e) => {
    const value = e.target.value;

    console.log("HERO SEARCH INPUT:", value);

    setSearch(value);
  };

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  const handleClear = () => {
    console.log("CLEARING SEARCH");

    setSearch("");
  };

  // =========================================================
  // HERO
  // =========================================================

  return (
    <section className="hero">
      <div className="hero-content">

        {/* =================================================
            TITLE
        ================================================== */}

        <h1>
          Welcome to JNTU Circle
        </h1>

        {/* =================================================
            DESCRIPTION
        ================================================== */}

        <p>
          Find Notes, Question Papers, Syllabus,
          Lab Programs and Notifications
        </p>

        {/* =================================================
            SEARCH FORM
        ================================================== */}

        <form
          className="search-box"
          onSubmit={handleSubmit}
        >

          {/* =================================================
              INPUT
          ================================================== */}

          <div className="search-input-wrapper">

            <input
              type="text"
              placeholder="Search notes, papers, syllabus..."
              value={search}
              onChange={handleSearchChange}
              aria-label="Search academic resources"
              autoComplete="off"
            />

            {/* =================================================
                CLEAR BUTTON
            ================================================== */}

            {search.trim() && (
              <button
                type="button"
                className="search-clear-button"
                onClick={handleClear}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            {/* =================================================
                SEARCH SUGGESTIONS
            ================================================== */}

            {search.trim() && (
              <SearchSuggestions
                search={search}
              />
            )}

          </div>

          {/* =================================================
              SEARCH BUTTON
          ================================================== */}

          <button
            type="submit"
            className="search-submit-button"
          >
            Search
          </button>

        </form>

      </div>
    </section>
  );
}

export default Hero;