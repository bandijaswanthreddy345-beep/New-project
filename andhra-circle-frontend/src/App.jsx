
import { Routes, Route, Navigate } from "react-router-dom";

// =========================
// Public Pages
// =========================

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import Syllabus from "./pages/Syllabus";
import LabPrograms from "./pages/LabPrograms";
import SearchResults from "./pages/SearchResults";
import NoteDetails from "./pages/NoteDetails";
import StudentProfile from "./pages/StudentProfile";

// =========================
// Public Resource Pages
// =========================

import QuestionPapers from "./components/QuestionPapers";
import Notifications from "./components/Notifications";
import Calculator from "./pages/Calculator";
import UploadMaterials from "./pages/UploadMaterials";
import JntuChatbot from "./components/JntuChatbot";

// =========================
// Authentication Pages
// =========================

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// =========================
// Admin Pages
// =========================

import Dashboard from "./pages/Dashboard";

import UploadNote from "./pages/UploadNote";
import UploadPaper from "./pages/UploadPaper";
import UploadNotification from "./pages/UploadNotification";
import UploadSyllabus from "./pages/UploadSyllabus";
import UploadLabProgram from "./pages/UploadLabProgram";

import ManageResources from "./pages/ManageResources";
import ManageUsers from "./pages/ManageUsers";
import UserUploadedData from "./pages/UserUploadedData";

// =========================
// Edit Pages
// =========================

import EditNote from "./pages/EditNote";
import EditPaper from "./pages/EditPaper";
import EditSyllabus from "./pages/EditSyllabus";
import EditNotification from "./pages/EditNotification";
import EditLabProgram from "./pages/EditLabProgram";

// =========================
// Route Protection
// =========================

import AdminRoute from "./components/AdminRoute";

// =========================
// PDF Viewer
// =========================

import PdfViewer from "./pages/PdfViewer";

function App() {
  return (
    <>
      <Routes>

      {/* =========================
          PUBLIC ROUTES
      ========================== */}

      {/* Home */}
      <Route
        path="/"
        element={<Home />}
      />

      {/* Login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Register */}
      <Route
        path="/register"
        element={<Register />}
      />

      {/* =========================
          PDF VIEWER
      ========================== */}

      <Route
        path="/pdf/:fileName"
        element={<PdfViewer />}
      />

      {/* =========================
          NOTES
      ========================== */}

      <Route
        path="/notes"
        element={<Notes />}
      />

      <Route
        path="/notes/:id"
        element={<NoteDetails />}
      />

      {/* =========================
          STUDENT PROFILE
      ========================== */}

      <Route
        path="/profile"
        element={<StudentProfile />}
      />

      <Route
        path="/student-profile"
        element={<StudentProfile />}
      />

      {/* =========================
          QUESTION PAPERS
      ========================== */}

      <Route
        path="/papers"
        element={<Notes initialType="papers" />}
      />

      {/* =========================
          SYLLABUS
      ========================== */}

      <Route
        path="/syllabus"
        element={<Notes initialType="syllabus" />}
      />

      {/* =========================
          LAB PROGRAMS
      ========================== */}

      <Route
        path="/lab-programs"
        element={<Notes initialType="labs" />}
      />

      {/* =========================
          NOTIFICATIONS
      ========================== */}

      <Route
        path="/notifications"
        element={<Notifications />}
      />

      {/* =========================
          CALCULATOR (CGPA & SGPA)
      ========================== */}

      <Route
        path="/calculator"
        element={<Calculator />}
      />

      <Route
        path="/cgpa-calculator"
        element={<Calculator />}
      />

      <Route
        path="/sgpa-calculator"
        element={<Calculator />}
      />

      <Route
        path="/cgpa"
        element={<Navigate to="/cgpa-calculator" replace />}
      />

      <Route
        path="/sgpa"
        element={<Navigate to="/sgpa-calculator" replace />}
      />


      {/* =========================
          REPORTS REDIRECT
      ========================== */}

      <Route
        path="/reports"
        element={<Navigate to="/" replace />}
      />

      <Route
        path="/academic-reports"
        element={<Navigate to="/" replace />}
      />

      {/* =========================
          UPLOAD MATERIALS
      ========================== */}

      <Route
        path="/upload-materials"
        element={<UploadMaterials />}
      />

      <Route
        path="/upload"
        element={<UploadMaterials />}
      />

      {/* =========================
          SEARCH RESULTS
      ========================== */}

      <Route
        path="/search"
        element={<SearchResults />}
      />

      {/* =========================
          PASSWORD ROUTES
      ========================== */}

      {/* Forgot Password */}
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* Reset Password */}
      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      {/* =========================
          ADMIN DASHBOARD
      ========================== */}

      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />

      {/* =========================
          ADMIN UPLOAD PAGES
      ========================== */}

      {/* Upload Note */}
      <Route
        path="/upload-note"
        element={
          <AdminRoute>
            <UploadNote />
          </AdminRoute>
        }
      />

      {/* Upload Question Paper */}
      <Route
        path="/upload-paper"
        element={
          <AdminRoute>
            <UploadPaper />
          </AdminRoute>
        }
      />

      {/* Upload Notification */}
      <Route
        path="/upload-notification"
        element={
          <AdminRoute>
            <UploadNotification />
          </AdminRoute>
        }
      />

      {/* Upload Syllabus */}
      <Route
        path="/upload-syllabus"
        element={
          <AdminRoute>
            <UploadSyllabus />
          </AdminRoute>
        }
      />

      {/* Upload Lab Program */}
      <Route
        path="/upload-lab-program"
        element={
          <AdminRoute>
            <UploadLabProgram />
          </AdminRoute>
        }
      />

      {/* =========================
          MANAGE RESOURCES
      ========================== */}

      <Route
        path="/manage-resources"
        element={
          <AdminRoute>
            <ManageResources />
          </AdminRoute>
        }
      />

      {/* =========================
          MANAGE USERS
      ========================== */}

      <Route
        path="/manage-users"
        element={
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        }
      />

      <Route
        path="/user-uploaded-data"
        element={
          <AdminRoute>
            <UserUploadedData />
          </AdminRoute>
        }
      />

      {/* =========================
          EDIT PAGES
      ========================== */}

      {/* Edit Note */}
      <Route
        path="/edit-note/:id"
        element={
          <AdminRoute>
            <EditNote />
          </AdminRoute>
        }
      />

      {/* Edit Question Paper */}
      <Route
        path="/edit-paper/:id"
        element={
          <AdminRoute>
            <EditPaper />
          </AdminRoute>
        }
      />

      {/* Edit Syllabus */}
      <Route
        path="/edit-syllabus/:id"
        element={
          <AdminRoute>
            <EditSyllabus />
          </AdminRoute>
        }
      />

      {/* Edit Notification */}
      <Route
        path="/edit-notification/:id"
        element={
          <AdminRoute>
            <EditNotification />
          </AdminRoute>
        }
      />

      {/* Edit Lab Program */}
      <Route
        path="/edit-lab-program/:id"
        element={
          <AdminRoute>
            <EditLabProgram />
          </AdminRoute>
        }
      />

    </Routes>
    
    {/* Floating Email Action (Placed directly above Instagram) */}
    <a
      href="mailto:jntucircle@gmail.com"
      className="floating-email-btn"
      title="Email: jntucircle@gmail.com"
      aria-label="Email: jntucircle@gmail.com"
    >
      <span className="floating-email-pulse" aria-hidden="true" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="floating-email-icon">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
      <span className="floating-email-tooltip">Email: jntucircle@gmail.com</span>
    </a>

    {/* Floating Instagram Action (Placed right above WhatsApp) */}
    <a
      href="https://instagram.com/jntucircle"
      target="_blank"
      rel="noopener noreferrer"
      className="floating-instagram-btn"
      title="Follow @JNTUCIRCLE on Instagram"
      aria-label="Follow @JNTUCIRCLE on Instagram"
    >
      <span className="floating-instagram-pulse" aria-hidden="true" />
      <svg viewBox="0 0 24 24" fill="currentColor" className="floating-instagram-icon">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
      <span className="floating-instagram-tooltip">Follow @JNTUCIRCLE</span>
    </a>

    {/* Floating WhatsApp Community Action */}
    <a
      href="https://chat.whatsapp.com/D6eyPwzgdcnHpE4Y9ZHvdz"
      target="_blank"
      rel="noopener noreferrer"
      className="floating-whatsapp-btn"
      title="Join JNTU Circle WhatsApp Community"
      aria-label="Join JNTU Circle WhatsApp Community"
    >
      <span className="floating-whatsapp-pulse" aria-hidden="true" />
      <svg viewBox="0 0 24 24" fill="currentColor" className="floating-whatsapp-icon">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.16 12.05 20.16C10.66 20.16 9.3 19.8 8.1 19.11L7.74 18.9L4.62 19.72L5.45 16.68L5.22 16.31C4.46 15.09 4.06 13.52 4.06 11.91C4.06 7.37 7.75 3.67 12.05 3.67ZM8.79 7.37C8.61 7.37 8.32 7.44 8.08 7.7C7.84 7.96 7.15 8.6 7.15 9.92C7.15 11.23 8.11 12.5 8.24 12.68C8.38 12.85 10.12 15.55 12.79 16.7C13.43 16.97 13.92 17.13 14.31 17.26C14.95 17.46 15.53 17.43 15.99 17.36C16.51 17.29 17.58 16.71 17.8 16.09C18.02 15.46 18.02 14.93 17.96 14.82C17.89 14.71 17.72 14.65 17.45 14.51C17.19 14.38 15.88 13.74 15.64 13.65C15.4 13.56 15.22 13.52 15.05 13.78C14.87 14.05 14.37 14.65 14.21 14.82C14.06 15 13.9 15.02 13.64 14.89C13.38 14.76 12.54 14.48 11.53 13.59C10.75 12.89 10.22 12.02 10.07 11.76C9.92 11.5 10.05 11.36 10.18 11.23C10.3 11.11 10.45 10.92 10.58 10.77C10.71 10.62 10.76 10.51 10.84 10.33C10.93 10.16 10.89 10.01 10.82 9.88C10.76 9.75 10.23 8.44 10.01 7.92C9.8 7.4 9.58 7.48 9.42 7.47C9.27 7.46 9.09 7.37 8.79 7.37Z" />
      </svg>
      <span className="floating-whatsapp-tooltip">Join WhatsApp Community</span>
    </a>

    {/* JNTU AI Chatbot (Global floating trigger & modal overlay) */}
    <JntuChatbot />
    </>
  );
}

export default App;
