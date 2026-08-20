import { useEffect, useState } from "react";
import API from "../api/api";

function LatestSyllabus({ search = "" }) {
const [syllabus, setSyllabus] = useState([]);
const [loading, setLoading] = useState(true);

// ==========================================
// FETCH SYLLABUS
// ==========================================

useEffect(() => {
fetchSyllabus();
}, []);

const fetchSyllabus = async () => {
try {
setLoading(true);


  const res = await API.get("/syllabus");

  const data = Array.isArray(res.data)
    ? res.data
    : [];

  setSyllabus(data);
} catch (error) {
  console.error("Error fetching syllabus:", error);
  setSyllabus([]);
} finally {
  setLoading(false);
}


};

// ==========================================
// SEARCH FILTER
// ==========================================

const searchText = String(search || "")
.trim()
.toLowerCase();

const filteredSyllabus = syllabus.filter((item) => {
if (!searchText) {
return true;
}


return (
  String(item.title || "")
    .toLowerCase()
    .includes(searchText) ||

  String(item.branch || "")
    .toLowerCase()
    .includes(searchText) ||

  String(item.semester || "")
    .toLowerCase()
    .includes(searchText) ||

  String(item.subject || "")
    .toLowerCase()
    .includes(searchText) ||

  String(item.subjectCode || "")
    .toLowerCase()
    .includes(searchText) ||

  String(item.description || "")
    .toLowerCase()
    .includes(searchText)
);


});

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
// IMPORTANT: async is required because
// we are using await below.
// ==========================================

const handleDownload = async (item) => {
if (!item.pdfUrl) {
alert("PDF file is not available.");
return;
}


try {
  const pdfUrl = getPdfUrl(item.pdfUrl);

  const response = await fetch(pdfUrl);

  if (!response.ok) {
    throw new Error("Failed to download PDF");
  }

  const blob = await response.blob();

  const downloadUrl =
    window.URL.createObjectURL(blob);

  const fileName = `${item.title || "syllabus"}-syllabus.pdf`
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  window.URL.revokeObjectURL(downloadUrl);
} catch (error) {
  console.error(
    "Syllabus PDF Download Error:",
    error
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
return ( <section className="syllabus-section"> <h2>📚 Latest Syllabus</h2>


    <p>Loading Syllabus...</p>
  </section>
);


}

// ==========================================
// MAIN UI
// ==========================================

return ( <section className="syllabus-section">


  <h2>📚 Latest Syllabus</h2>

  {filteredSyllabus.length === 0 ? (
    <p style={{ textAlign: "center" }}>
      {searchText
        ? `No Syllabus Found for "${search}"`
        : "No Syllabus Available"}
    </p>
  ) : (
    <div className="syllabus-grid">

      {filteredSyllabus.map((item) => (
        <div
          className="syllabus-card"
          key={item._id}
        >

          {/* TITLE */}

          <h3>
            {item.title || "Untitled Syllabus"}
          </h3>

          {/* BRANCH */}

          {item.branch && (
            <p>
              <strong>Branch:</strong>{" "}
              {item.branch}
            </p>
          )}

          {/* SEMESTER */}

          {item.semester && (
            <p>
              <strong>Semester:</strong>{" "}
              {item.semester}
            </p>
          )}

          {/* SUBJECT */}

          {item.subject && (
            <p>
              <strong>Subject:</strong>{" "}
              {item.subject}
            </p>
          )}

          {/* SUBJECT CODE */}

          {item.subjectCode && (
            <p>
              <strong>Subject Code:</strong>{" "}
              {item.subjectCode}
            </p>
          )}

          {/* DESCRIPTION */}

          {item.description && (
            <p>
              <strong>Description:</strong>{" "}
              {item.description}
            </p>
          )}

          {/* PDF BUTTONS */}

          {item.pdfUrl ? (
            <div className="syllabus-pdf-actions">

              {/* VIEW PDF */}

              <a
                href={getPdfUrl(item.pdfUrl)}
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
                  handleDownload(item)
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
      ))}

    </div>
  )}

</section>


);
}

export default LatestSyllabus;
