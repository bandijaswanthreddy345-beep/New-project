import { useEffect, useState } from "react";
import API from "../api/api";

function LabPrograms({ search = "" }) {
const [labPrograms, setLabPrograms] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// ==========================================
// FETCH LAB PROGRAMS
// ==========================================

useEffect(() => {
fetchLabPrograms();
}, []);

const fetchLabPrograms = async () => {
try {
setLoading(true);
setError("");


  const response = await API.get("/lab-programs");

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  setLabPrograms(data);
} catch (err) {
  console.error(
    "Lab Program Fetch Error:",
    err
  );

  setError(
    err.response?.data?.message ||
      "Unable to load lab programs"
  );
} finally {
  setLoading(false);
}


};

// ==========================================
// SEARCH
// ==========================================

const searchText = String(search || "")
.trim()
.toLowerCase();

const filteredPrograms = labPrograms.filter(
(program) => {
if (!searchText) {
return true;
}


  return (
    String(program.title || "")
      .toLowerCase()
      .includes(searchText) ||

    String(program.subject || "")
      .toLowerCase()
      .includes(searchText) ||

    String(program.subjectCode || "")
      .toLowerCase()
      .includes(searchText) ||

    String(program.branch || "")
      .toLowerCase()
      .includes(searchText) ||

    String(program.semester || "")
      .toLowerCase()
      .includes(searchText) ||

    String(program.description || "")
      .toLowerCase()
      .includes(searchText)
  );
}


);

// ==========================================
// GET PDF URL
// ==========================================

const getPdfUrl = (pdfUrl) => {
if (!pdfUrl) {
return "";
}


if (
  pdfUrl.startsWith("http://") ||
  pdfUrl.startsWith("https://")
) {
  return pdfUrl;
}

return `http://localhost:5000${pdfUrl}`;


};

// ==========================================
// DOWNLOAD PDF
// ==========================================

const handleDownload = async (program) => {
if (!program.pdfUrl) {
alert("PDF file is not available.");
return;
}


try {
  const pdfUrl = getPdfUrl(
    program.pdfUrl
  );

  const response = await fetch(pdfUrl);

  if (!response.ok) {
    throw new Error(
      "Failed to download lab program"
    );
  }

  const blob = await response.blob();

  const downloadUrl =
    window.URL.createObjectURL(blob);

  const fileName = `${
    program.title || "lab-program"
  }-lab-program.pdf`
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  const link =
    document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  window.URL.revokeObjectURL(
    downloadUrl
  );
} catch (err) {
  console.error(
    "Lab Program Download Error:",
    err
  );

  alert(
    "Unable to download the PDF. Please try again."
  );
}


};

// ==========================================
// LOADING
// ==========================================

if (loading) {
return ( <section className="syllabus-section"> <h2>🧪 Lab Programs</h2>


    <p>Loading Lab Programs...</p>
  </section>
);


}

// ==========================================
// ERROR
// ==========================================

if (error) {
return ( <section className="syllabus-section"> <h2>🧪 Lab Programs</h2>


    <p
      style={{
        color: "red",
      }}
    >
      {error}
    </p>

    <button
      type="button"
      onClick={fetchLabPrograms}
    >
      Retry
    </button>
  </section>
);


}

// ==========================================
// MAIN UI
// ==========================================

return ( <section className="syllabus-section">


  {/* SECTION TITLE */}

  <h2>🧪 Lab Programs</h2>

  {/* LAB PROGRAM GRID */}

  {filteredPrograms.length === 0 ? (
    <p
      style={{
        textAlign: "center",
      }}
    >
      {searchText
        ? `No Lab Programs Found for "${search}"`
        : "No Lab Programs Available"}
    </p>
  ) : (
    <div className="syllabus-grid">

      {filteredPrograms.map(
        (program) => (
          <div
            className="syllabus-card"
            key={program._id}
          >

            {/* TITLE */}

            <h3>
              {program.title ||
                "Untitled Lab Program"}
            </h3>

            {/* SUBJECT */}

            {program.subject && (
              <p>
                <strong>
                  Subject:
                </strong>{" "}
                {program.subject}
              </p>
            )}

            {/* SUBJECT CODE */}

            {program.subjectCode && (
              <p>
                <strong>
                  Subject Code:
                </strong>{" "}
                {program.subjectCode}
              </p>
            )}

            {/* BRANCH */}

            {program.branch && (
              <p>
                <strong>
                  Branch:
                </strong>{" "}
                {program.branch}
              </p>
            )}

            {/* SEMESTER */}

            {program.semester && (
              <p>
                <strong>
                  Semester:
                </strong>{" "}
                {program.semester}
              </p>
            )}

            {/* DESCRIPTION */}

            {program.description && (
              <p>
                <strong>
                  Description:
                </strong>{" "}
                {program.description}
              </p>
            )}

            {/* PDF BUTTONS */}

            {program.pdfUrl ? (
              <div
                className="syllabus-pdf-actions"
              >

                {/* VIEW PDF */}

                <a
                  href={getPdfUrl(
                    program.pdfUrl
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button type="button">
                    👁️ View PDF
                  </button>
                </a>

                {/* DOWNLOAD PDF */}

                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      program
                    )
                  }
                >
                  ⬇️ Download PDF
                </button>

              </div>
            ) : (
              <p>
                📄 PDF not available
              </p>
            )}

          </div>
        )
      )}

    </div>
  )}

</section>


);
}

export default LabPrograms;
