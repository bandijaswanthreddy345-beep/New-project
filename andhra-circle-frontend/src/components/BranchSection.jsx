function BranchSection() {
  const branches = [
    "Computer Science Engineering",
    "Electronics & Communication Engineering",
    "AI & ML Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  return (
    <section className="branches-modern">
      <div className="branches-modern-container">

        {/* SECTION HEADING */}
        <div className="branches-modern-heading">
          <span className="branches-modern-label">
            ACADEMIC DEPARTMENTS
          </span>

          <h2>Browse by Branch</h2>

          <p>
            Explore academic resources by engineering department
          </p>
        </div>

        {/* BRANCH CARDS */}
        <div className="branches-modern-grid">
          {branches.map((branch, index) => (
            <article
              className="branches-modern-card"
              key={branch}
            >
              <span className="branch-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3>{branch}</h3>

              <span className="branch-card-line" />
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

export default BranchSection;