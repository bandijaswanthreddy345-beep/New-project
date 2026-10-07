import { useNavigate } from "react-router-dom";
import "./ResourceHighlights.css";

const RESOURCES = [
  {
    path: "/notes",
    title: "Notes",
    description: "Well organized and easy to study",
    className: "resource-highlight-notes",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
  },
  {
    path: "/papers",
    title: "Question Papers",
    description: "Practice for better results",
    className: "resource-highlight-papers",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
        <path d="m16 16 1.5 1.5L21 14" />
      </>
    ),
  },
  {
    path: "/syllabus",
    title: "Syllabus",
    description: "Always stay ahead",
    className: "resource-highlight-syllabus",
    icon: (
      <>
        <path d="M12 7v14" />
        <path d="M3 18V5a2 2 0 0 1 2-2h2a5 5 0 0 1 5 5 5 5 0 0 1 5-5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-3a4 4 0 0 0-4 2 4 4 0 0 0-4-2H5a2 2 0 0 1-2-2Z" />
      </>
    ),
  },
];

function ResourceHighlights() {
  const navigate = useNavigate();

  return (
    <section className="resource-highlights" aria-label="Explore study resources">
      <div className="resource-highlights-grid">
        {RESOURCES.map((resource) => (
          <button
            key={resource.path}
            type="button"
            className={`resource-highlight-card ${resource.className}`}
            onClick={() => navigate(resource.path)}
            aria-label={`Browse ${resource.title}`}
          >
            <span className="resource-highlight-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {resource.icon}
              </svg>
            </span>
            <span className="resource-highlight-copy">
              <span className="resource-highlight-title">{resource.title}</span>
              <span className="resource-highlight-description">
                {resource.description}
              </span>
            </span>
            <svg
              className="resource-highlight-arrow"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 10h12m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ResourceHighlights;
