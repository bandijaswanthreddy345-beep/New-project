import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";
import "./SearchResults.css";

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  // =========================================================
  // URL SEARCH QUERY
  // =========================================================

  const urlQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);

    return (
      params.get("query") ||
      params.get("q") ||
      params.get("search") ||
      ""
    ).trim();
  }, [location.search]);

  // =========================================================
  // SEARCH INPUT
  // =========================================================

  const [search, setSearch] = useState(urlQuery);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  // =========================================================
  // DATA STATE
  // =========================================================

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BACKEND_URL = "http://localhost:5000";

  // =========================================================
  // FETCH ALL RESOURCES
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          notesRes,
          papersRes,
          syllabusRes,
          notificationsRes,
          labProgramsRes,
        ] = await Promise.all([
          API.get("/notes"),
          API.get("/papers"),
          API.get("/syllabus"),
          API.get("/notifications"),
          API.get("/lab-programs"),
        ]);

        // =====================================================
        // SAFE ARRAY EXTRACTION
        // =====================================================

        const getArray = (response) => {
          if (Array.isArray(response?.data)) {
            return response.data;
          }

          if (Array.isArray(response?.data?.data)) {
            return response.data.data;
          }

          if (Array.isArray(response?.data?.results)) {
            return response.data.results;
          }

          if (Array.isArray(response?.data?.items)) {
            return response.data.items;
          }

          return [];
        };

        const notes = getArray(notesRes);
        const papers = getArray(papersRes);
        const syllabus = getArray(syllabusRes);
        const notifications = getArray(notificationsRes);
        const labPrograms = getArray(labProgramsRes);

        // =====================================================
        // COMBINE ALL RESOURCES
        // =====================================================

        const allData = [
          ...notes.map((item) => ({
            ...item,
            type: "Notes",
            icon: "📘",
          })),

          ...papers.map((item) => ({
            ...item,
            type: "Question Paper",
            icon: "📄",
          })),

          ...syllabus.map((item) => ({
            ...item,
            type: "Syllabus",
            icon: "📚",
          })),

          ...notifications.map((item) => ({
            ...item,
            type: "Notification",
            icon: "📢",
          })),

          ...labPrograms.map((item) => ({
            ...item,
            type: "Lab Program",
            icon: "🧪",
          })),
        ];

        if (mounted) {
          setResults(allData);
        }
      } catch (err) {
        console.error("SEARCH ERROR:", err);
        console.error("RESPONSE:", err.response?.data);
        console.error("STATUS:", err.response?.status);

        if (mounted) {
          setError("Unable to load resources.");
          setResults([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // SEARCHABLE TEXT
  // =========================================================

  const getSearchableText = (item) => {
    return [
      item.title,
      item.name,
      item.subject,
      item.subjectCode,
      item.branch,
      item.semester,
      item.year,
      item.examType,
      item.description,
      item.category,
      item.date,
      item.paperName,
      item.course,
      item.program,
      item.department,
      item.regulation,
      item.type,
    ]
      .map((value) => String(value ?? ""))
      .join(" ")
      .toLowerCase();
  };

  // =========================================================
  // GET TITLE
  // =========================================================

  const getTitle = (item) => {
    return (
      item.title ||
      item.paperName ||
      item.name ||
      item.subject ||
      "Untitled Resource"
    );
  };

  // =========================================================
  // AUTOMATIC SEARCH
  // =========================================================

  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearch(value);

    const trimmed = value.trim();

    if (trimmed) {
      navigate(
        `/search?query=${encodeURIComponent(trimmed)}`,
        {
          replace: true,
        }
      );
    } else {
      navigate("/search", {
        replace: true,
      });
    }
  };

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  const handleClear = () => {
    setSearch("");

    navigate("/search", {
      replace: true,
    });
  };

  // =========================================================
  // FILTER RESULTS
  // =========================================================

  const filteredResults = useMemo(() => {
    const query = urlQuery.toLowerCase();

    if (!query) {
      return [];
    }

    return results.filter((item) => {
      return getSearchableText(item).includes(query);
    });
  }, [results, urlQuery]);

  // =========================================================
  // IMAGE URL
  // =========================================================

  const getImageUrl = (item) => {
    if (!item) {
      return defaultBanner;
    }

    const image =
      item.imageUrl ||
      item.banner ||
      item.image ||
      item.thumbnail;

    if (!image) {
      return defaultBanner;
    }

    if (
      typeof image === "string" &&
      (
        image.startsWith("http://") ||
        image.startsWith("https://")
      )
    ) {
      return image;
    }

    if (
      typeof image === "string" &&
      image.startsWith("/")
    ) {
      return `${BACKEND_URL}${image}`;
    }

    return `${BACKEND_URL}/${image}`;
  };

  // =========================================================
  // HIGHLIGHT SEARCH TEXT
  // =========================================================

  const highlight = (text) => {
    const value = String(text ?? "");

    if (!urlQuery) {
      return value;
    }

    const escapedQuery = urlQuery.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(
      `(${escapedQuery})`,
      "gi"
    );

    return value.split(regex).map((part, index) => {
      if (
        part.toLowerCase() ===
        urlQuery.toLowerCase()
      ) {
        return (
          <mark key={index}>
            {part}
          </mark>
        );
      }

      return part;
    });
  };

  // =========================================================
  // OPEN RESULT
  // =========================================================

  const openItem = (item) => {
    if (!item) {
      return;
    }

    const title = getTitle(item);

    // NOTES
    if (item.type === "Notes") {
      if (item._id) {
        navigate(`/notes/${item._id}`);
        return;
      }
    }

    // QUESTION PAPERS
    if (item.type === "Question Paper") {
      navigate(
        `/papers?search=${encodeURIComponent(title)}`
      );
      return;
    }

    // SYLLABUS
    if (item.type === "Syllabus") {
      navigate(
        `/syllabus?search=${encodeURIComponent(title)}`
      );
      return;
    }

    // LAB PROGRAMS
    if (item.type === "Lab Program") {
      navigate(
        `/lab-programs?search=${encodeURIComponent(title)}`
      );
      return;
    }

    // NOTIFICATIONS
    if (item.type === "Notification") {
      navigate(
        `/notifications?search=${encodeURIComponent(title)}`
      );
      return;
    }

    // PDF
    if (item.pdfUrl) {
      let pdfUrl = item.pdfUrl;

      if (
        !pdfUrl.startsWith("http://") &&
        !pdfUrl.startsWith("https://")
      ) {
        if (pdfUrl.startsWith("/")) {
          pdfUrl = `${BACKEND_URL}${pdfUrl}`;
        } else {
          pdfUrl = `${BACKEND_URL}/${pdfUrl}`;
        }
      }

      window.open(
        pdfUrl,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    // EXTERNAL LINK
    if (item.link) {
      window.open(
        item.link,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // =========================================================
  // RESULT META
  // =========================================================

  const getMeta = (item) => {
    const parts = [];

    if (item.subject) {
      parts.push(item.subject);
    }

    if (item.subjectCode) {
      parts.push(item.subjectCode);
    }

    if (item.branch) {
      parts.push(item.branch);
    }

    if (item.semester) {
      parts.push(item.semester);
    }

    if (item.year) {
      parts.push(item.year);
    }

    if (item.department) {
      parts.push(item.department);
    }

    if (item.regulation) {
      parts.push(item.regulation);
    }

    return parts;
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="search-page">

      {/* =====================================================
          ANIMATED BACKGROUND
      ====================================================== */}

      <div
        className="search-animated-background"
        aria-hidden="true"
      >
        <div className="search-gradient-orb search-orb-one"></div>

        <div className="search-gradient-orb search-orb-two"></div>

        <div className="search-gradient-orb search-orb-three"></div>

        <div className="search-gradient-orb search-orb-four"></div>

        <div className="search-background-wave search-wave-one"></div>

        <div className="search-background-wave search-wave-two"></div>

        <div className="search-background-glow"></div>
      </div>

      {/* =====================================================
          FULL SCREEN SEARCH HEADER
      ====================================================== */}

      <section className="search-top">

        <div className="search-bar">

          <span
            className="search-icon"
            aria-hidden="true"
          >
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search notes, question papers, syllabus, lab programs..."
            autoComplete="off"
            autoFocus
            aria-label="Search academic resources"
          />

          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={handleClear}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

        </div>

      </section>

      {/* =====================================================
          FULL SCREEN CONTENT
      ====================================================== */}

      <section className="search-content">

        {/* ===================================================
            EMPTY SEARCH
        ==================================================== */}

        {!urlQuery && !loading && (
          <div className="search-empty">

            <div className="search-empty-icon">
              🔎
            </div>

            <h1>
              Search Academic Resources
            </h1>

            <p>
              Start typing to search notes, question
              papers, syllabus, lab programs and
              notifications.
            </p>

          </div>
        )}

        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div className="search-loading">

            <div className="loading-spinner"></div>

            <p>
              Finding resources...
            </p>

          </div>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}

        {!loading && error && (
          <div className="search-error">
            {error}
          </div>
        )}

        {/* ===================================================
            NO RESULTS
        ==================================================== */}

        {!loading &&
          !error &&
          urlQuery &&
          filteredResults.length === 0 && (
            <div className="search-no-results">

              <div className="no-results-icon">
                🔍
              </div>

              <h2>
                No matching resources found
              </h2>

              <p>
                Try searching with another subject,
                topic, code or keyword.
              </p>

            </div>
          )}

        {/* ===================================================
            RESULTS
        ==================================================== */}

        {!loading &&
          !error &&
          filteredResults.length > 0 && (
            <div className="search-results-list">

              {filteredResults.map((item, index) => {

                const itemId =
                  item._id ||
                  item.id ||
                  `${item.type}-${index}`;

                const title = getTitle(item);
                const meta = getMeta(item);

                return (
                  <article
                    key={`${item.type}-${itemId}`}
                    className="search-result-item"
                    onClick={() => openItem(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === " "
                      ) {
                        e.preventDefault();
                        openItem(item);
                      }
                    }}
                  >

                    {/* IMAGE */}

                    <div className="result-image-box">

                      <img
                        src={getImageUrl(item)}
                        alt=""
                        className="result-image"
                        onError={(e) => {
                          if (
                            e.currentTarget.src !==
                            defaultBanner
                          ) {
                            e.currentTarget.src =
                              defaultBanner;
                          }
                        }}
                      />

                    </div>

                    {/* INFORMATION */}

                    <div className="result-information">

                      <h2>
                        {highlight(title)}
                      </h2>

                      <div className="result-meta">

                        <span className="result-type">
                          {item.icon}
                          {" "}
                          {item.type}
                        </span>

                        {meta.map(
                          (value, metaIndex) => (
                            <span
                              key={metaIndex}
                              className="result-meta-value"
                            >
                              •{" "}
                              {highlight(value)}
                            </span>
                          )
                        )}

                      </div>

                      {item.description && (
                        <p className="result-description">
                          {highlight(
                            item.description
                          )}
                        </p>
                      )}

                    </div>

                    {/* ARROW */}

                    <div
                      className="result-arrow"
                      aria-hidden="true"
                    >
                      →
                    </div>

                  </article>
                );
              })}

            </div>
          )}

      </section>

    </main>
  );
}

export default SearchResults;