import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
    if (googleNotice) setGoogleNotice("");
  };

  const handleToggleTerms = () => {
    setForm((prev) => ({ ...prev, agreeTerms: !prev.agreeTerms }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setGoogleNotice("");

    // 1. Validation checks
    const nameTrimmed = form.fullName.trim();
    if (!nameTrimmed || nameTrimmed.length < 2) {
      setError("Please enter your full student name (min. 2 characters).");
      return;
    }

    const emailTrimmed = form.email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailTrimmed)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please verify both password fields.");
      return;
    }

    if (!form.agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    try {
      setLoading(true);

      // Call backend registration endpoint
      const res = await API.post("/auth/register", {
        name: nameTrimmed,
        email: emailTrimmed,
        password: form.password,
      });

      setSuccess(
        res.data?.message || "Account created successfully! Preparing your dashboard..."
      );

      // If token and user returned, persist session immediately
      if (res.data?.token && res.data?.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      // Smooth redirection to sign in or home
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Account created successfully! You can now sign in with your credentials.",
          },
        });
      }, 1200);
    } catch (err) {
      console.error("Registration Error:", err);
      const errMsg =
        err.response?.data?.message ||
        "Registration could not be completed. Please check your credentials and try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setGoogleNotice(
      "Google Institutional Single Sign-On is currently connecting with university domains. Please complete standard sign up above."
    );
  };

  return (
    <div className="signup-page-wrapper">
      {/* Background Ambient Glow */}
      <div className="signup-bg-glow" aria-hidden="true" />

      {/* =========================================================
          STICKY TOP NAVIGATION HEADER
          ========================================================= */}
      <header className="signup-header">
        <div className="signup-header-inner">
          <div className="signup-header-left">
            {/* Back Button */}
            <button
              type="button"
              className="signup-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Navigate back"
              title="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            {/* Portal Identity */}
            <Link to="/" className="signup-brand" title="JNTU Circle Academic Portal">
              <div className="signup-brand-icon-wrap">
                {/* Mortarboard icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                </svg>
              </div>
              <div className="signup-brand-text">
                <span className="signup-brand-title">JNTU Circle</span>
                <span className="signup-brand-sub">Student Academic Portal</span>
              </div>
            </Link>
          </div>

          {/* Right Header Avatar Icon */}
          <div className="signup-header-avatar" title="Student Identity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN REGISTRATION CONTENT
          ========================================================= */}
      <main className="signup-main">
        <div className="signup-container">
          {/* Welcome Header Section */}
          <div className="signup-hero">
            <div className="signup-hero-badge-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
              <span className="signup-hero-dot" />
            </div>

            <h1 className="signup-hero-title">Create an Account</h1>
            <p className="signup-hero-desc">
              Join JNTU Circle to explore notes, past papers, and curated study guides.
            </p>
          </div>

          {/* Main Registration Form Card */}
          <form className="signup-card" onSubmit={handleSubmit} noValidate>
            {/* Error Banner */}
            {error && (
              <div className="signup-alert signup-alert-error" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="signup-alert signup-alert-success" role="status">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Google Notice Banner */}
            {googleNotice && (
              <div className="signup-alert" style={{ background: "rgba(255, 185, 95, 0.15)", border: "1px solid rgba(255, 185, 95, 0.35)", color: "#ffb95f" }} role="status">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>{googleNotice}</span>
              </div>
            )}

            {/* Full Name Field */}
            <div className="signup-field-group">
              <label className="signup-label" htmlFor="full-name">
                <span className="signup-label-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 7h-5V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9-3h2v3h-2V4zm1 8c1.38 0 2.5 1.12 2.5 2.5S13.38 17 12 17s-2.5-1.12-2.5-2.5S10.62 12 12 12zm5 7H7v-.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5v.5z" />
                  </svg>
                </span>
                <span>Full Name</span>
              </label>
              <div className="signup-input-wrap">
                <input
                  id="full-name"
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Jaswanth Reddy"
                  className="signup-input"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email Address Field */}
            <div className="signup-field-group">
              <label className="signup-label" htmlFor="email-address">
                <span className="signup-label-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </span>
                <span>Email Address</span>
              </label>
              <div className="signup-input-wrap">
                <input
                  id="email-address"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. name@example.com"
                  className="signup-input"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="signup-field-group">
              <div className="signup-label-row">
                <label className="signup-label" htmlFor="password">
                  <span className="signup-label-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </span>
                  <span>Password</span>
                </label>
                <span className="signup-label-subtext">Min. 8 chars</span>
              </div>
              <div className="signup-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="signup-input signup-input-pwd"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="signup-pwd-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="signup-field-group">
              <label className="signup-label" htmlFor="confirm-password">
                <span className="signup-label-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                </span>
                <span>Confirm Password</span>
              </label>
              <div className="signup-input-wrap">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="signup-input signup-input-pwd"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="signup-pwd-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Terms & Privacy Checkbox */}
            <div className="signup-terms-row" onClick={handleToggleTerms}>
              <div
                className={`signup-checkbox-custom ${form.agreeTerms ? "is-checked" : ""}`}
                role="checkbox"
                aria-checked={form.agreeTerms}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    handleToggleTerms();
                  }
                }}
              >
                {form.agreeTerms && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="signup-terms-text">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="signup-terms-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="signup-terms-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
              </span>
            </div>

            {/* Create Account CTA Button */}
            <button
              type="submit"
              className="signup-submit-btn"
              disabled={loading}
              id="submit-signup-btn"
            >
              {loading ? (
                <>
                  <span className="signup-spinner" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="signup-btn-arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Social Sign Up Divider */}
          <div className="signup-divider">
            <div className="signup-divider-line" />
            <span className="signup-divider-text">Or continue with</span>
            <div className="signup-divider-line" />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            className="signup-google-btn"
            onClick={handleGoogleSignup}
          >
            {/* Multi-color Google 'G' icon */}
            <svg className="signup-google-icon" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* Already have an account? Sign In */}
          <div className="signup-footer">
            <span className="signup-footer-text">Already have an account?</span>
            <Link to="/login" className="signup-footer-link">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;
