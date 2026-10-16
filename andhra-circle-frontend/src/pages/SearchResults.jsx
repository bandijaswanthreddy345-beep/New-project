import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";
import { performSearch, formatResourceAction } from "../utils/searchEngine";
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
  // SEARCH INPUT & CATEGORY FILTER STATE
  // =========================================================

  const [search, setSearch] = useState(urlQuery);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  // =========================================================
  // SEARCH ENGINE STATE
  // =========================================================

  const [searchData, setSearchData] = useState({
    query: "",
    results: [],
    relatedResources: [],
    relatedSubjects: [],
    suggestedQueries: [],
    categoryCounts: {
      all: 0,
      notes: 0,
      papers: 0,
      syllabus: 0,
      labs: 0,
      notifications: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BACKEND_URL = "http://localhost:5000";

  // =========================================================
  // PERFORM SEARCH
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const executeSearch = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await performSearch(urlQuery);

        if (mounted) {
          setSearchData(result);
          // If current category has 0 items but another has items, keep or reset
          if (
            activeCategory !== "all" &&
            result.categoryCounts[activeCategory.toLowerCase()] === 0
          ) {
            setActiveCategory("all");
          }
        }
      } catch (err) {
        console.error("SEARCH ERROR:", err);
        if (mounted) {
          setError("Unable to complete search.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    executeSearch();

    return () => {
      mounted = false;
    };
  }, [urlQuery]);

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
  // AUTOMATIC SEARCH INPUT CHANGE
  // =========================================================

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    const trimmed = value.trim();
    if (trimmed) {
      navigate(`/search?query=${encodeURIComponent(trimmed)}`, {
        replace: true,
      });
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
    setActiveCategory("all");
    navigate("/search", {
      replace: true,
    });
  };

  // =========================================================
  // QUICK SEARCH CLICK
  // =========================================================

  const handleQuickSearch = (newQuery) => {
    setSearch(newQuery);
    navigate(`/search?query=${encodeURIComponent(newQuery)}`);
  };

  // =========================================================
  // FILTER DISPLAYED RESULTS BY ACTIVE CATEGORY TAB
  // =========================================================

  const displayedResults = useMemo(() => {
    if (!searchData.results) return [];
    if (activeCategory === "all") return searchData.results;
    return searchData.results.filter((item) => item.type === activeCategory);
  }, [searchData.results, activeCategory]);

  // =========================================================
  // IMAGE URL
  // =========================================================

  const getImageUrl = (item) => {
    if (!item) return defaultBanner;

    const image =
      item.imageUrl ||
      item.banner ||
      item.image ||
      item.thumbnail;

    if (!image) return defaultBanner;

    if (
      typeof image === "string" &&
      (image.startsWith("http://") || image.startsWith("https://"))
    ) {
      return image;
    }

    if (typeof image === "string" && image.startsWith("/")) {
      return `${BACKEND_URL}${image}`;
    }

    return `${BACKEND_URL}/${image}`;
  };

  // =========================================================
  // HIGHLIGHT SEARCH TEXT (Multi-Token Safe)
  // =========================================================

  const highlight = (text) => {
    const value = String(text ?? "");
    if (!urlQuery) return value;

    // Split words from query
    const words = urlQuery
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1);

    if (words.length === 0) return value;

    const escaped = words
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");

    const regex = new RegExp(`(${escaped})`, "gi");

    return value.split(regex).map((part, index) => {
      const isMatch = words.some(
        (w) => w.toLowerCase() === part.toLowerCase()
      );
      if (isMatch) {
        return <mark key={index}>{part}</mark>;
      }
      return part;
    });
  };

  // =========================================================
  // OPEN RESULT
  // =========================================================

  const openItem = (item) => {
    if (!item) return;

    const action = formatResourceAction(item);
    if (action.path) {
      navigate(action.path);
      return;
    }

    const title = getTitle(item);

    if (item.type === "Notes" && item._id) {
      navigate(`/notes/${item._id}`);
      return;
    }

    if (item.type === "Question Paper") {
      navigate(`/papers?search=${encodeURIComponent(title)}`);
      return;
    }

    if (item.type === "Syllabus") {
      navigate(`/syllabus?search=${encodeURIComponent(title)}`);
      return;
    }

    if (item.type === "Lab Program") {
      navigate(`/lab-programs?search=${encodeURIComponent(title)}`);
      return;
    }

    if (item.type === "Notification") {
      navigate(
        item._id
          ? `/notifications?view=${encodeURIComponent(item._id)}`
          : `/notifications?search=${encodeURIComponent(title)}`
      );
      return;
    }

    if (item.pdfUrl) {
      let pdfUrl = item.pdfUrl;
      if (!pdfUrl.startsWith("http://") && !pdfUrl.startsWith("https://")) {
        pdfUrl = pdfUrl.startsWith("/")
          ? `${BACKEND_URL}${pdfUrl}`
          : `${BACKEND_URL}/${pdfUrl}`;
      }
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (item.link) {
      window.open(item.link, "_blank", "noopener,noreferrer");
    }
  };

  // =========================================================
  // RESULT META PILLS
  // =========================================================

  const getMeta = (item) => {
    const parts = [];
    if (item.subject) parts.push(item.subject);
    if (item.subjectCode) parts.push(item.subjectCode);
    if (item.branch) parts.push(item.branch);
    if (item.semester) parts.push(item.semester);
    if (item.year) parts.push(item.year);
    if (item.regulation) parts.push(item.regulation);
    if (item.credits) parts.push(`${item.credits} Credits`);
    return parts;
  };

  // =========================================================
  // CATEGORY TABS DATA
  // =========================================================

  const categoryTabs = [
    { id: "all", label: "All Resources", count: searchData.categoryCounts.all },
    { id: "Notes", label: "📘 Notes", count: searchData.categoryCounts.notes },
    { id: "Question Paper", label: "📄 Question Papers", count: searchData.categoryCounts.papers },
    { id: "Syllabus", label: "📚 Syllabus", count: searchData.categoryCounts.syllabus },
    { id: "Lab Program", label: "🧪 Lab Programs", count: searchData.categoryCounts.labs },
    { id: "Notification", label: "📢 Notifications", count: searchData.categoryCounts.notifications },
  ];

  // =========================================================
  // RENDER PAGE
  // =========================================================

  return (
    <main className="search-page">
      {/* Animated ambient background */}
      <div className="search-animated-background" aria-hidden="true">
        <div className="search-gradient-orb search-orb-one"></div>
        <div className="search-gradient-orb search-orb-two"></div>
        <div className="search-gradient-orb search-orb-three"></div>
        <div className="search-gradient-orb search-orb-four"></div>
        <div className="search-background-wave search-wave-one"></div>
        <div className="search-background-wave search-wave-two"></div>
        <div className="search-background-glow"></div>
      </div>

      {/* =====================================================
          FULL SCREEN SEARCH HEADER & CATEGORY TABS
      ====================================================== */}
      <section className="search-top">
        <div className="search-bar">
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search notes, question papers, syllabus, lab programs, subjects..."
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

        {/* Category Filter Tabs with Resource Counts */}
        {urlQuery && (
          <div className="search-filter-tabs-wrapper">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`search-category-tab ${
                  activeCategory === tab.id ? "active" : ""
                }`}
                onClick={() => setActiveCategory(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="search-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          FULL SCREEN CONTENT
      ====================================================== */}
      <section className="search-content">
        {/* ===================================================
            RELATED CONTENT & SIBLING SUBJECTS PANEL
        ==================================================== */}
        {urlQuery && !loading && (
          (searchData.relatedResources.length > 0 ||
            searchData.relatedSubjects.length > 0 ||
            searchData.suggestedQueries.length > 0) && (
            <div className="search-related-panel">
              <h3 className="search-related-title">
                <span>💡</span>
                <span>Related Content & Sibling Subjects</span>
              </h3>

              <div className="search-related-chips-grid">
                {/* Companion Cross-Type Resources */}
                {searchData.relatedResources.map((rel, rIdx) => (
                  <button
                    key={`rel-item-${rIdx}`}
                    type="button"
                    className="search-related-chip"
                    onClick={() => handleQuickSearch(`${rel.subject || rel.title} ${rel.type}`)}
                  >
                    <span>{rel.icon}</span>
                    <span>
                      {rel.type}: <strong>{rel.subject || rel.title}</strong>
                    </span>
                  </button>
                ))}

                {/* Sibling Subjects from R23 Curriculum */}
                {searchData.relatedSubjects.map((sub, sIdx) => (
                  <button
                    key={`sub-item-${sIdx}`}
                    type="button"
                    className="search-related-chip"
                    onClick={() => handleQuickSearch(`${sub.name} notes`)}
                  >
                    <span>📚</span>
                    <span>
                      {sub.name} ({sub.branch} Sem {sub.semester})
                    </span>
                  </button>
                ))}

                {/* Suggested Queries */}
                {searchData.suggestedQueries.map((sug, qIdx) => (
                  <button
                    key={`sug-item-${qIdx}`}
                    type="button"
                    className="search-related-chip"
                    onClick={() => handleQuickSearch(sug)}
                  >
                    <span>✨</span>
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {/* ===================================================
            EMPTY SEARCH STATE
        ==================================================== */}
        {!urlQuery && !loading && (
          <div className="search-empty">
            <div className="search-empty-icon">🔎</div>
            <h1>Search Verified Academic Resources</h1>
            <p>
              Search by subject name, course code, branch (CSE, AIML, ECE), semester
              (1-1, 1-2, 2-1), or topic to find verified notes, question papers, syllabus,
              and lab programs.
            </p>

            <div style={{ marginTop: "24px" }} className="search-related-chips-grid">
              <button
                type="button"
                className="search-related-chip"
                onClick={() => handleQuickSearch("Data Structures Notes")}
              >
                📘 Data Structures Notes
              </button>
              <button
                type="button"
                className="search-related-chip"
                onClick={() => handleQuickSearch("Python Programming Lab")}
              >
                🧪 Python Lab Manual
              </button>
              <button
                type="button"
                className="search-related-chip"
                onClick={() => handleQuickSearch("Linear Algebra Calculus M1")}
              >
                📘 M1 Calculus Notes
              </button>
              <button
                type="button"
                className="search-related-chip"
                onClick={() => handleQuickSearch("Operating Systems Papers")}
              >
                📄 OS Question Papers
              </button>
              <button
                type="button"
                className="search-related-chip"
                onClick={() => handleQuickSearch("R23 AIML Syllabus")}
              >
                📚 R23 AIML Syllabus
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            LOADING
        ==================================================== */}
        {loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <p>Scanning academic records & ranking related content...</p>
          </div>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}
        {!loading && error && <div className="search-error">{error}</div>}

        {/* ===================================================
            NO RESULTS STATE
        ==================================================== */}
        {!loading &&
          !error &&
          urlQuery &&
          displayedResults.length === 0 && (
            <div className="search-no-results">
              <div className="no-results-icon">🔍</div>
              <h2>No matching resources found for "{urlQuery}"</h2>
              <p>
                Try searching with alternate terms like acronyms (e.g. "DS", "OS", "M1"),
                department ("AIML", "CSE"), or browse the related suggestions above.
              </p>
            </div>
          )}

        {/* ===================================================
            SEARCH RESULTS LIST
        ==================================================== */}
        {!loading &&
          !error &&
          displayedResults.length > 0 && (
            <div className="search-results-list">
              {displayedResults.map((item, index) => {
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
                      if (e.key === "Enter" || e.key === " ") {
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
                          if (e.currentTarget.src !== defaultBanner) {
                            e.currentTarget.src = defaultBanner;
                          }
                        }}
                      />
                    </div>

                    {/* INFORMATION */}
                    <div className="result-information">
                      <h2>{highlight(title)}</h2>

                      <div className="result-meta">
                        <span className="result-type">
                          {item.icon} {item.type}
                        </span>

                        {meta.map((value, metaIndex) => (
                          <span key={metaIndex} className="result-meta-value">
                            • {highlight(value)}
                          </span>
                        ))}
                      </div>

                      {item.description && (
                        <p className="result-description">
                          {highlight(item.description)}
                        </p>
                      )}
                    </div>

                    {/* ARROW */}
                    <div className="result-arrow" aria-hidden="true">
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