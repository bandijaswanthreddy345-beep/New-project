import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/api";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);

  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || "";

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    const filtered = notes.filter((note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.branch.toLowerCase().includes(search.toLowerCase()) ||
      note.semester.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredNotes(filtered);
  }, [notes, search]);

  const fetchNotes = async () => {
    try {
      const res = await API.get("/notes");
      setNotes(res.data);
      setFilteredNotes(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>All Notes</h1>

      {filteredNotes.length === 0 ? (
        <p>No Notes Found</p>
      ) : (
        filteredNotes.map((note) => (
          <div
            key={note._id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>{note.title}</h3>

            <p>Branch: {note.branch}</p>

            <p>Semester: {note.semester}</p>

            <a
              href={`http://localhost:5000${note.pdfUrl}`}
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

export default Notes;