import { useState } from "react";
import API from "../api/api";

function UploadNote() {
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("Bandi Bharath");

  const [module1, setModule1] = useState("");
  const [module2, setModule2] = useState("");
  const [module3, setModule3] = useState("");
  const [module4, setModule4] = useState("");
  const [module5, setModule5] = useState("");

  const [module1Pdf, setModule1Pdf] = useState(null);
  const [module2Pdf, setModule2Pdf] = useState(null);
  const [module3Pdf, setModule3Pdf] = useState(null);
  const [module4Pdf, setModule4Pdf] = useState(null);
  const [module5Pdf, setModule5Pdf] = useState(null);

  const [loading, setLoading] = useState(false);

  // ==========================================
  // SUBMIT NOTE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // ==========================================
    // BASIC DETAILS
    // ==========================================

    formData.append("title", title);
    formData.append("branch", branch);
    formData.append("semester", semester);
    formData.append("subject", subject);
    formData.append("subjectCode", subjectCode);
    formData.append("description", description);

    // ==========================================
    // CREDITS
    // ==========================================

    formData.append("credits", credits);

    // ==========================================
    // MODULE CONTENT
    // ==========================================

    formData.append("module1", module1);
    formData.append("module2", module2);
    formData.append("module3", module3);
    formData.append("module4", module4);
    formData.append("module5", module5);

    // ==========================================
    // MODULE PDFs
    // ==========================================

    if (module1Pdf) {
      formData.append("module1Pdf", module1Pdf);
    }

    if (module2Pdf) {
      formData.append("module2Pdf", module2Pdf);
    }

    if (module3Pdf) {
      formData.append("module3Pdf", module3Pdf);
    }

    if (module4Pdf) {
      formData.append("module4Pdf", module4Pdf);
    }

    if (module5Pdf) {
      formData.append("module5Pdf", module5Pdf);
    }

    // ==========================================
    // UPLOAD
    // ==========================================

    try {
      setLoading(true);

      console.log("========== NOTE UPLOAD ==========");

      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      console.log("=================================");

      await API.post("/notes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Note uploaded successfully!");

      // ==========================================
      // RESET
      // ==========================================

      setTitle("");
      setBranch("");
      setSemester("");
      setSubject("");
      setSubjectCode("");
      setDescription("");
      setCredits("Bandi Bharath");

      setModule1("");
      setModule2("");
      setModule3("");
      setModule4("");
      setModule5("");

      setModule1Pdf(null);
      setModule2Pdf(null);
      setModule3Pdf(null);
      setModule4Pdf(null);
      setModule5Pdf(null);

      e.target.reset();

    } catch (error) {
      console.error("Upload Note Error:", error);

      alert(
        error.response?.data?.message ||
          "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MODULE COMPONENT
  // ==========================================

  const renderModule = (
    moduleTitle,
    value,
    setter,
    pdfSetter
  ) => (
    <div className="module-upload">

      <label>{moduleTitle}</label>

      <textarea
        rows="5"
        value={value}
        placeholder={`Enter ${moduleTitle}`}
        onChange={(e) =>
          setter(e.target.value)
        }
      />

      <input
        type="file"
        accept=".pdf"
        onChange={(e) =>
          pdfSetter(
            e.target.files?.[0] || null
          )
        }
      />

    </div>
  );

  return (
    <div className="upload-container">

      <h1>Upload Note</h1>

      <form onSubmit={handleSubmit}>

        {/* ==========================================
            NOTE TITLE
        ========================================== */}

        <input
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          required
        />

        {/* ==========================================
            BRANCH
        ========================================== */}

        <select
          value={branch}
          onChange={(e) =>
            setBranch(e.target.value)
          }
          required
        >
          <option value="">
            Select Branch
          </option>

          <option value="Computer Science Engineering">
            Computer Science Engineering
          </option>

          <option value="Information Science Engineering">
            Information Science Engineering
          </option>

          <option value="Artificial Intelligence & Machine Learning">
            Artificial Intelligence & Machine Learning
          </option>

          <option value="Electronics & Communication Engineering">
            Electronics & Communication Engineering
          </option>

          <option value="Mechanical Engineering">
            Mechanical Engineering
          </option>

          <option value="Civil Engineering">
            Civil Engineering
          </option>
        </select>

        {/* ==========================================
            SEMESTER
        ========================================== */}

        <select
          value={semester}
          onChange={(e) =>
            setSemester(e.target.value)
          }
          required
        >
          <option value="">
            Select Semester
          </option>

          <option value="1st Semester">
            1st Semester
          </option>

          <option value="2nd Semester">
            2nd Semester
          </option>

          <option value="3rd Semester">
            3rd Semester
          </option>

          <option value="4th Semester">
            4th Semester
          </option>

          <option value="5th Semester">
            5th Semester
          </option>

          <option value="6th Semester">
            6th Semester
          </option>

          <option value="7th Semester">
            7th Semester
          </option>

          <option value="8th Semester">
            8th Semester
          </option>
        </select>

        {/* ==========================================
            SUBJECT
        ========================================== */}

        <input
          type="text"
          placeholder="Subject Name"
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value)
          }
          required
        />

        {/* ==========================================
            SUBJECT CODE
        ========================================== */}

        <input
          type="text"
          placeholder="Subject Code"
          value={subjectCode}
          onChange={(e) =>
            setSubjectCode(e.target.value)
          }
        />

        {/* ==========================================
            DESCRIPTION
        ========================================== */}

        <textarea
          rows="4"
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        {/* ==========================================
            CREDITS
        ========================================== */}

        <div className="credits-upload-field">

          <label htmlFor="credits">
            Credits
          </label>

          <input
            id="credits"
            type="text"
            placeholder="Prepared by"
            value={credits}
            onChange={(e) =>
              setCredits(e.target.value)
            }
          />

          <small>
            Enter the name of the person who prepared
            or contributed to these notes.
          </small>

        </div>

        {/* ==========================================
            MODULE 1
        ========================================== */}

        {renderModule(
          "Module 1",
          module1,
          setModule1,
          setModule1Pdf
        )}

        {/* ==========================================
            MODULE 2
        ========================================== */}

        {renderModule(
          "Module 2",
          module2,
          setModule2,
          setModule2Pdf
        )}

        {/* ==========================================
            MODULE 3
        ========================================== */}

        {renderModule(
          "Module 3",
          module3,
          setModule3,
          setModule3Pdf
        )}

        {/* ==========================================
            MODULE 4
        ========================================== */}

        {renderModule(
          "Module 4",
          module4,
          setModule4,
          setModule4Pdf
        )}

        {/* ==========================================
            MODULE 5
        ========================================== */}

        {renderModule(
          "Module 5",
          module5,
          setModule5,
          setModule5Pdf
        )}

        {/* ==========================================
            SUBMIT
        ========================================== */}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Uploading..."
            : "Upload Note"}
        </button>

      </form>

    </div>
  );
}

export default UploadNote;