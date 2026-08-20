import { useEffect, useState } from "react";
import API from "../api/api";

function Syllabus() {
  const [syllabus, setSyllabus] = useState([]);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      const res = await API.get("/syllabus");
      setSyllabus(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>All Syllabus</h1>

      {syllabus.length === 0 ? (
        <p>No Syllabus Available</p>
      ) : (
        syllabus.map((item) => (
          <div
            key={item._id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>{item.title}</h3>

            <p>Branch: {item.branch}</p>

            <p>Semester: {item.semester}</p>

            <a
              href={`http://localhost:5000${item.pdfUrl}`}
              target="_blank"
              rel="noreferrer"
            >
              View PDF
            </a>
          </div>
        ))
      )}
    </div>
  );
}

export default Syllabus;