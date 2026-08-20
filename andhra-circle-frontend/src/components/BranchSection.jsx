function BranchSection() {
  const branches = [
    {
      name: "Computer Science Engineering",
      code: "CSE",
      icon: "💻",
      description:
        "Explore notes, syllabus, question papers, and academic resources.",
    },
    {
      name: "Electronics & Communication Engineering",
      code: "ECE",
      icon: "📡",
      description:
        "Access organized study materials and examination resources.",
    },
    {
      name: "AI & ML Engineering",
      code: "AIML",
      icon: "🤖",
      description:
        "Find learning materials for artificial intelligence and machine learning.",
    },
    {
      name: "Mechanical Engineering",
      code: "ME",
      icon: "⚙️",
      description:
        "Browse academic notes, syllabus, and previous question papers.",
    },
    {
      name: "Civil Engineering",
      code: "CE",
      icon: "🏗️",
      description:
        "Discover structured resources for civil engineering subjects.",
    },
  ];

  return (
    <section className="branches">
      {/* =========================
          SECTION HEADER
      ========================== */}

      <div className="section-heading">
        <span className="section-tag">
          ACADEMIC DEPARTMENTS
        </span>

        <h2>Browse by Branch</h2>

       
      </div>

      {/* =========================
          BRANCH GRID
      ========================== */}

      <div className="branch-grid">
        {branches.map((branch) => (
          <article
            className="branch-card"
            key={branch.code}
          >
            <div className="branch-icon">
              {branch.icon}
            </div>

            <span className="branch-code">
              {branch.code}
            </span>

            <h3>{branch.name}</h3>

            <p>{branch.description}</p>

            <button
              type="button"
              className="branch-button"
            >
              Explore Resources
              <span> → </span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default BranchSection;