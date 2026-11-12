import { useState, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api/api";
import TurnstileWidget from "../components/TurnstileWidget";
import "./Login.css";
import "./Register.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const adminPrompt = location.state?.adminPrompt;
  const adminMessage = location.state?.message;

  const [form, setForm] = useState({
    email: location.state?.prefillEmail || "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // CAPTCHA / Turnstile challenge state (only activated on repeated failed login attempts)
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [captchaData, setCaptchaData] = useState({ token: "", svg: "" });
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (requireCaptcha && !turnstileToken && !captchaInput.trim()) {
      setError("Please complete the Cloudflare security verification challenge.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: form.email,
        password: form.password,
      };

      if (requireCaptcha) {
        if (turnstileToken) {
          payload.turnstileToken = turnstileToken;
        } else {
          payload.captchaToken = captchaData.token;
          payload.captchaAnswer = captchaInput.trim();
        }
      }

      // Login request
      const res = await API.post("/auth/login", payload);

      // Get token and user details
      const { token, user } = res.data;

      // Check if token exists
      if (!token) {
        setError("Login failed: Authentication token was not received.");
        return;
      }

      // Save JWT token & user information
      localStorage.removeItem("jntu_student_logged_out");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChanged"));

      // Role based redirection
      if (user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login Error:", err);
      let errMsg = "Invalid email or password. Please verify your credentials and try again.";

      if (!err.response) {
        // Network connection error / server unreachable / CORS blockage
        errMsg = "Cannot connect to server. Please verify your internet connection or check if the server is running.";
      } else if (err.response.status === 429) {
        // Rate limit exceeded
        errMsg = err.response.data?.message || "Too many login attempts. Please wait a few minutes before trying again.";
      } else if (err.response.status === 403 && err.response.data?.requireCaptcha) {
        // Captcha required
        errMsg = "Security verification required. Please solve the CAPTCHA puzzle to continue.";
      } else if (err.response.status === 400 && err.response.data?.message) {
        // Captcha verification failed or malformed request
        errMsg = err.response.data.message;
      } else if (err.response.status >= 500) {
        // Internal server error
        errMsg = "Server error encountered. Please try again later.";
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }

      setError(errMsg);

      // If backend reports repeated failures requiring CAPTCHA
      if (err.response?.data?.requireCaptcha) {
        setRequireCaptcha(true);
        fetchCaptcha();
      } else if (requireCaptcha) {
        fetchCaptcha();
      }
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
      <div className="login-auth-card">
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
          <h1 className="login-main-title">
            {adminPrompt ? "Admin Portal Login" : "Sign In to Your Account"}
          </h1>
          <p className="login-main-sub">
            {adminPrompt
              ? "Verify administrator credentials to access management tools"
              : "Access lecture notes, question papers, syllabus & academic tools"}
          </p>
        </div>

        {/* Admin Access Prompt Banner */}
        {adminPrompt && (
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <strong style={{ display: "block" }}>Admin Authentication Required</strong>
              <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", opacity: 0.9 }}>
                {adminMessage || "Please enter your administrator credentials to access the Dashboard."}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="login-alert login-alert-error" role="alert" aria-live="assertive">
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

        {/* Login Form */}
        <form className="login-form-inner" onSubmit={handleSubmit}>
          {/* Email Address */}
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="login-email">
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
                id="login-email"
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
            <label className="login-field-label" htmlFor="login-password">
              <span>Password</span>
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
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                className="login-text-input login-password-input"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
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

          {/* Security Verification (Cloudflare Turnstile) - Only shown after repeated login failures */}
          {requireCaptcha && (
            <div className="login-field-group signup-captcha-section">
              <div className="signup-label-between">
                <label className="login-field-label">
                  <span>Security Verification</span>
                  <span className="login-required-star">*</span>
                </label>
                <span className="signup-helper-text">Cloudflare Turnstile</span>
              </div>

              <div style={{ background: "transparent", border: "none", padding: "0.25rem 0", display: "flex", justifyContent: "center" }}>
                <TurnstileWidget
                  onVerify={(token) => {
                    setTurnstileToken(token);
                    if (error) setError("");
                  }}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                />
              </div>
            </div>
          )}

          {/* Utility Row: Remember Me & Forgot Password */}
          <div className="login-utility-row">
            <label className="login-remember-label">
              <input
                type="checkbox"
                className="login-remember-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="login-forgot-link">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="login-btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Register Prompt */}
        <p className="login-register-prompt">
          Don't have an account?
          <Link to="/register" className="login-register-cta">
            Create an Account
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
    </div>
  );
}

export default Login;
