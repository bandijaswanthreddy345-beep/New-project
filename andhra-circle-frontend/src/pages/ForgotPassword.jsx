import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import "./Login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);
      const res = await API.post("/auth/forgot-password", {
        email,
      });

      setMessage(res.data.message || "Password reset link sent to your email!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send reset instructions. Please verify your email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Background Ambience Decorations */}
      <div className="login-bg-decorations" aria-hidden="true">
        <div className="login-bg-grid" />
        <div className="login-bg-orb-1" />
        <div className="login-bg-orb-2" />
      </div>

      {/* Top Bar: Return to Login */}
      <div className="login-top-bar">
        <Link to="/login" className="login-back-home-btn" title="Return to Sign In">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Sign In</span>
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="login-auth-card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <Link to="/" className="login-brand-link" title="JNTU Circle Academic Hub">
            <div className="login-logo-glow-ring">
              <img
                src="/jntu-circle-logo.png"
                alt="JNTU Circle"
                className="login-logo-img"
              />
            </div>
            <div className="login-brand-text">
              <h2 className="login-brand-name">
                <span className="font-deltha">JNTU</span> Circle
              </h2>
              <span className="login-brand-tagline">Academic Resource Hub</span>
            </div>
          </Link>
        </div>

        {/* Welcome Section */}
        <div className="login-heading-section">
          <h1 className="login-main-title">Reset Your Password</h1>
          <p className="login-main-sub">
            Enter your registered university email to receive a recovery link
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-alert login-alert-error" role="alert">
            <svg
              className="login-alert-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {message && (
          <div className="login-alert" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" }} role="status">
            <svg
              className="login-alert-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        {/* Form */}
        <form className="login-form-inner" onSubmit={handleSubmit}>
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="forgot-email">
              <span>Registered Email Address</span>
              <span className="login-required-star">*</span>
            </label>
            <div className="login-input-wrapper">
              <svg
                className="login-input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="forgot-email"
                type="email"
                placeholder="student@example.com"
                className="login-text-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <span className="login-btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Prompt */}
        <p className="login-register-prompt">
          Remember your password?
          <Link to="/login" className="login-register-cta">
            Return to Sign In
          </Link>
        </p>

        {/* Security Trust Badge */}
        <div className="login-security-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Official JNTU Academic Portal · Verified Account Security</span>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;