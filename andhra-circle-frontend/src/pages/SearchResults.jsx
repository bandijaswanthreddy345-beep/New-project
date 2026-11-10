import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../api/api";
import defaultBanner from "../assets/banner.webp";
import { performSearch, formatResourceAction } from "../utils/searchEngine";
import { formatSemDisplay } from "../utils/validators";
import "./SearchResults.css";

const PAGE_SIZE = 15;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setSearch(urlQuery);
    setVisibleCount(PAGE_SIZE);
  }, [urlQuery]);

  // =========================================================
  // DEBOUNCED SEARCH INPUT (250 ms)
  // =========================================================

  const debounceTimerRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      const currentParam = (new URLSearchParams(location.search).get("query") || "").trim();
      if (trimmed !== currentParam) {
        if (trimmed) {
          navigate(`/search?query=${encodeURIComponent(trimmed)}`, {
            replace: true,
          });
        } else {
          navigate("/search", {
            replace: true,
          });
        }
      }
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // PERFORM SEARCH WITH ABORT CONTROLLER / CANCEL STALE
  // =========================================================

  useEffect(() => {
    let mounted = true;
    const abortCtrl = new AbortController();

    const executeSearch = async () => {
      if (!urlQuery) {
        setSearchData({
          query: "",
          results: [],
          relatedResources: [],
          relatedSubjects: [],
          suggestedQueries: [],
          categoryCounts: { all: 0, notes: 0, papers: 0, syllabus: 0, labs: 0, notifications: 0 },
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await performSearch(urlQuery, { signal: abortCtrl.signal });

        if (mounted) {
          setSearchData(result);
          if (
            activeCategory !== "all" &&
            result.categoryCounts[activeCategory.toLowerCase()] === 0
          ) {
            setActiveCategory("all");
          }
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("SEARCH ERROR:", err);
        if (mounted) {
          setError("Unable to complete search. Please check connection and retry.");
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
      abortCtrl.abort();
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
  // GET META
  // =========================================================

  const getMeta = (item) => {
    const meta = [];
    if (item.branch) meta.push(item.branch);
    if (item.semester) meta.push(formatSemDisplay(item.semester));
    if (item.regulation) meta.push(item.regulation);
    if (item.year) meta.push(`Year ${item.year}`);
    if (item.subjectCode) meta.push(`Code: ${item.subjectCode}`);
    if (item.examType) meta.push(item.examType);
    return meta;
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

  const filteredResults = useMemo(() => {
    if (!searchData.results) return [];
    if (activeCategory === "all") return searchData.results;
    return searchData.results.filter((item) => item.type === activeCategory);
  }, [searchData.results, activeCategory]);

  const displayedResults = useMemo(() => {
    return filteredResults.slice(0, visibleCount);
  }, [filteredResults, visibleCount]);

  const hasMore = filteredResults.length > visibleCount;

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

    if (item.pdfUrl) {
      navigate(
        `/pdf/${encodeURIComponent(item.pdfUrl)}?title=${encodeURIComponent(
          title
        )}`
      );
      return;
    }

    if (item.link) {
      window.open(item.link, "_blank", "noopener,noreferrer");
      return;
    }

    alert(`No digital file or URL attached to ${title}`);
  };

  // Category counts and label list
  const categoryTabs = [
    { id: "all", label: "All Results", count: searchData.categoryCounts.all },
    { id: "Notes", label: "Notes", count: searchData.categoryCounts.notes },
    { id: "Paper", label: "Papers", count: searchData.categoryCounts.papers },
    { id: "Syllabus", label: "Syllabus", count: searchData.categoryCounts.syllabus },
    { id: "Lab", label: "Lab Manuals", count: searchData.categoryCounts.labs },
    {
      id: "Notification",
      label: "Circulars",
      count: searchData.categoryCounts.notifications,
    },
  ];

  return (
    <main className="search-results-page">
      {/* =====================================================
          TOP HEADER
      ====================================================== */}
      <section className="search-header">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>

          <input
            type="text"
            className="search-input"
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
                className={`search-category-tab ${activeCategory === tab.id ? "active" : ""
                  }`}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setVisibleCount(PAGE_SIZE);
                }}
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
                      {sub.name} ({sub.branch} {formatSemDisplay(sub.semester)})
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
            LOADING SKELETON (Layout-preserving)
        ==================================================== */}
        {loading && (
          <div className="search-results-list" style={{ opacity: 0.7 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`skel-${i}`}
                className="search-result-item"
                style={{
                  pointerEvents: "none",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div
                  className="result-image-box"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <div className="result-information" style={{ width: "100%" }}>
                  <div
                    style={{
                      height: "20px",
                      width: "60%",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.08)",
                      marginBottom: "8px",
                    }}
                  />
                  <div
                    style={{
                      height: "14px",
                      width: "35%",
                      borderRadius: "4px",
                      background: "rgba(255, 255, 255, 0.04)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===================================================
            ERROR STATE WITH RETRY
        ==================================================== */}
        {!loading && error && (
          <div className="search-error" style={{ textAlign: "center", padding: "2rem" }}>
            <p>{error}</p>
            <button
              type="button"
              className="search-related-chip"
              onClick={() => handleQuickSearch(urlQuery)}
              style={{ marginTop: "1rem", cursor: "pointer" }}
            >
              🔄 Retry Search
            </button>
          </div>
        )}

        {/* ===================================================
            NO RESULTS STATE
        ==================================================== */}
        {!loading &&
          !error &&
          urlQuery &&
          filteredResults.length === 0 && (
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
            <>
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
                          width="100"
                          height="70"
                          loading="lazy"
                          decoding="async"
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

              {hasMore && (
                <div style={{ textAlign: "center", margin: "2rem 0" }}>
                  <button
                    type="button"
                    className="search-related-chip"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    style={{
                      padding: "10px 24px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Load More Results ({filteredResults.length - visibleCount} remaining) ↓
                  </button>
                </div>
              )}
            </>
          )}
      </section>
    </main>
  );
}

export default SearchResults;
