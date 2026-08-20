
import { Routes, Route } from "react-router-dom";

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

// =========================
// Public Resource Pages
// =========================

import QuestionPapers from "./components/QuestionPapers";
import Notifications from "./components/Notifications";

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
          QUESTION PAPERS
      ========================== */}

      <Route
        path="/papers"
        element={<QuestionPapers />}
      />

      {/* =========================
          SYLLABUS
      ========================== */}

      <Route
        path="/syllabus"
        element={<Syllabus />}
      />

      {/* =========================
          LAB PROGRAMS
      ========================== */}

      <Route
        path="/lab-programs"
        element={<LabPrograms />}
      />

      {/* =========================
          NOTIFICATIONS
      ========================== */}

      <Route
        path="/notifications"
        element={<Notifications />}
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
  );
}

export default App;

