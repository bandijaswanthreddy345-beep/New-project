import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import "./Login.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or expired reset link. Token is missing.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both passwords match.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post(`/auth/reset-password/${token}`, {
        password,
      });

      setSuccess(res.data.message || "Password successfully updated! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(
        err.response?.data?.message ||
          "Password Reset Failed. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Background Ambience */}
      <div className="login-bg-decorations" aria-hidden="true">
        <div className="login-bg-grid" />
        <div className="login-bg-orb-1" />
        <div className="login-bg-orb-2" />
      </div>

      {/* Top Bar */}
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
          <h1 className="login-main-title">Set New Password</h1>
          <p className="login-main-sub">
            Choose a strong password to secure your student portal account
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
        {success && (
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
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form className="login-form-inner" onSubmit={handleSubmit}>
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="reset-password">
              <span>New Password</span>
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                className="login-text-input login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="login-field-group">
            <label className="login-field-label" htmlFor="reset-confirm-password">
              <span>Confirm New Password</span>
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                className="login-text-input login-password-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
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
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <span className="login-btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        <p className="login-register-prompt">
          Back to
          <Link to="/login" className="login-register-cta">
            Sign In
          </Link>
        </p>

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

export default ResetPassword;