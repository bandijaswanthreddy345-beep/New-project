import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import "./Login.css";
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

  const [captchaData, setCaptchaData] = useState({ token: "", svg: "" });
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const fetchCaptcha = useCallback(async () => {
    try {
      setCaptchaLoading(true);
      const res = await API.get("/auth/captcha");
      if (res.data?.success) {
        setCaptchaData({
          token: res.data.captchaToken,
          svg: res.data.captchaSvg,
        });
        setCaptchaInput("");
      }
    } catch (err) {
      console.error("Failed to load security CAPTCHA challenge:", err);
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleToggleTerms = (e) => {
    const isChecked = e && typeof e.target?.checked === "boolean" ? e.target.checked : !form.agreeTerms;
    setForm((prev) => ({ ...prev, agreeTerms: isChecked }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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

    const captchaTrimmed = captchaInput.trim();
    if (!captchaTrimmed) {
      setError("Please enter the 6-character security CAPTCHA verification code.");
      return;
    }

    if (!form.agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    try {
      setLoading(true);

      // Call backend registration endpoint with CAPTCHA verification
      const res = await API.post("/auth/register", {
        name: nameTrimmed,
        email: emailTrimmed,
        password: form.password,
        captchaToken: captchaData.token,
        captchaAnswer: captchaTrimmed,
      });

      setSuccess(
        res.data?.message || "Account created successfully! Preparing your sign in..."
      );

      // If token and user returned, persist session immediately
      if (res.data?.token && res.data?.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        window.dispatchEvent(new Event("authChanged"));
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
      // Refresh CAPTCHA on failure so user gets a fresh challenge
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper signup-theme-wrapper">
      {/* Background Ambience Decorations */}
      <div className="login-bg-decorations" aria-hidden="true">
        <div className="login-bg-grid" />
        <div className="login-bg-orb-1" />
        <div className="login-bg-orb-2" />
      </div>

      {/* Top Bar: Return to Home Navigation */}
      <div className="login-top-bar">
        <Link to="/" className="login-back-home-btn" title="Return to Homepage">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="login-auth-card signup-auth-card">
        {/* Brand Header: JNTU Circle Logo & Name */}
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
          <h1 className="login-main-title">Create Your Account</h1>
          <p className="login-main-sub">
            Join JNTU Circle to explore notes, past papers, syllabus & academic tools
          </p>
        </div>

        {/* Success Alert Banner */}
        {success && (
          <div className="login-alert login-alert-admin" role="status">
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

        {/* Error Alert Banner */}
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

        {/* Registration Form */}
        <form className="login-form-inner" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="signup-name">
              <span>Full Name</span>
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="signup-name"
                type="text"
                name="fullName"
                placeholder="Enter full student name"
                className="login-text-input"
                value={form.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="signup-email">
              <span>Email Address</span>
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
                id="signup-email"
                type="email"
                name="email"
                placeholder="Enter your registered email"
                className="login-text-input"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field-group">
            <div className="signup-label-between">
              <label className="login-field-label" htmlFor="signup-password">
                <span>Password</span>
                <span className="login-required-star">*</span>
              </label>
              <span className="signup-helper-text">Min. 8 chars</span>
            </div>
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
                id="signup-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                className="login-text-input login-password-input"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
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

          {/* Confirm Password */}
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="signup-confirm-password">
              <span>Confirm Password</span>
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                className="login-text-input login-password-input"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                className="login-password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "Hide password" : "Show password"}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
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

          {/* Security Verification (CAPTCHA) */}
          <div className="login-field-group signup-captcha-section">
            <div className="signup-label-between">
              <label className="login-field-label" htmlFor="signup-captcha">
                <span>Security Verification</span>
                <span className="login-required-star">*</span>
              </label>
              <span className="signup-helper-text">Case-insensitive</span>
            </div>

            <div className="signup-captcha-box">
              <div className="signup-captcha-visual-row">
                {captchaData.svg ? (
                  <div className="signup-captcha-svg-container">
                    <img
                      src={`data:image/svg+xml;utf8,${encodeURIComponent(captchaData.svg)}`}
                      alt="Security verification challenge"
                      className="signup-captcha-image"
                    />
                  </div>
                ) : (
                  <div className="signup-captcha-placeholder">
                    <span className="login-spinner" />
                    <span>Loading challenge...</span>
                  </div>
                )}

                <button
                  type="button"
                  className="signup-captcha-reload-btn"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading}
                  title="Generate a new security challenge"
                  aria-label="Refresh security challenge"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={captchaLoading ? "signup-spin" : ""}
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>

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
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 10h6" />
                  <path d="M12 10v4" />
                </svg>
                <input
                  id="signup-captcha"
                  type="text"
                  name="captchaInput"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value.toUpperCase());
                    if (error) setError("");
                  }}
                  placeholder="Enter 6-character code"
                  className="login-text-input signup-captcha-text-input"
                  maxLength={6}
                  autoComplete="off"
                  spellCheck="false"
                  required
                />
              </div>
            </div>
          </div>

          {/* Terms & Privacy Agreement */}
          <div className="signup-terms-agreement">
            <label className="login-remember-label" htmlFor="register-agree-terms">
              <input
                id="register-agree-terms"
                type="checkbox"
                name="agreeTerms"
                className="login-remember-checkbox"
                checked={form.agreeTerms}
                onChange={handleToggleTerms}
              />
              <span className="signup-terms-copy">
                I agree to the{" "}
                <button
                  type="button"
                  className="signup-terms-hyperlink signup-terms-btn-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTermsModal(true);
                  }}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="signup-terms-hyperlink signup-terms-btn-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPrivacyModal(true);
                  }}
                >
                  Privacy Policy
                </button>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-submit-btn signup-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <span className="login-btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Existing Account Prompt */}
        <p className="login-register-prompt">
          Already have an account?
          <Link to="/login" className="login-register-cta">
            Sign In
          </Link>
        </p>

        {/* Security Trust Badge */}
        <div className="login-security-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Official JNTU Academic Portal · Secure Access</span>
        </div>
      </div>

      {/* Terms of Service Informational Modal */}
      {showTermsModal && (
        <div className="signup-info-modal-backdrop" onClick={() => setShowTermsModal(false)} role="dialog" aria-modal="true">
          <div className="signup-info-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="signup-info-modal-header">
              <h3>📜 Terms of Service</h3>
              <button
                type="button"
                className="signup-info-modal-close"
                onClick={() => setShowTermsModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="signup-info-modal-body">
              <p><strong>Welcome to JNTU Circle.</strong> By using this academic portal, you agree to:</p>
              <ul>
                <li>Use notes, question papers, and study resources strictly for personal educational purposes.</li>
                <li>Maintain academic honesty and refrain from deploying scrapers or malicious scripts.</li>
                <li>Keep your account password and security details confidential.</li>
                <li>Respect university regulations and portal community guidelines.</li>
              </ul>
            </div>
            <div className="signup-info-modal-footer">
              <button
                type="button"
                className="signup-info-modal-btn"
                onClick={() => {
                  setForm((prev) => ({ ...prev, agreeTerms: true }));
                  setShowTermsModal(false);
                  if (error) setError("");
                }}
              >
                ✓ I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Informational Modal */}
      {showPrivacyModal && (
        <div className="signup-info-modal-backdrop" onClick={() => setShowPrivacyModal(false)} role="dialog" aria-modal="true">
          <div className="signup-info-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="signup-info-modal-header">
              <h3>🔒 Privacy Policy</h3>
              <button
                type="button"
                className="signup-info-modal-close"
                onClick={() => setShowPrivacyModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="signup-info-modal-body">
              <p><strong>Your Privacy at JNTU Circle:</strong></p>
              <ul>
                <li>We only collect your name, email, and academic details to personalize your student record.</li>
                <li>Passwords are cryptographically salted and hashed using bcrypt; plain text is never stored.</li>
                <li>We do not sell, rent, or distribute student records to external advertisers or third parties.</li>
                <li>All sessions and stored academic indicators (SGPA, attendance) remain private to your login.</li>
              </ul>
            </div>
            <div className="signup-info-modal-footer">
              <button
                type="button"
                className="signup-info-modal-btn"
                onClick={() => {
                  setForm((prev) => ({ ...prev, agreeTerms: true }));
                  setShowPrivacyModal(false);
                  if (error) setError("");
                }}
              >
                ✓ Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
