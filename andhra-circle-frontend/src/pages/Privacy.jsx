import React from "react";
import { Link } from "react-router-dom";
import "./Login.css";

function Privacy() {
  return (
    <div className="login-page-wrapper" style={{ padding: "3rem 1.5rem", minHeight: "100vh" }}>
      <div className="login-bg-decorations" aria-hidden="true">
        <div className="login-bg-grid" />
        <div className="login-bg-orb-1" />
        <div className="login-bg-orb-2" />
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 2, background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "1.25rem", padding: "2.75rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)", color: "#e2e8f0" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "2.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.12)", paddingBottom: "1.5rem" }}>
          <Link to="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", fontWeight: "600" }}>
            ← Back to JNTU Circle
          </Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "2.25rem", fontWeight: "800", color: "#f8fafc", margin: 0, letterSpacing: "-0.025em" }}>Privacy Policy</h1>
            <span style={{ color: "#94a3b8", fontSize: "0.875rem", background: "rgba(255, 255, 255, 0.06)", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>
              Version 2.0 · Effective Nov 2026
            </span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginTop: "0.75rem", marginBottom: 0 }}>
            Our commitment to protecting student personal data, privacy rights, and academic records.
          </p>
        </div>

        {/* Content */}
        <div style={{ lineHeight: "1.8", fontSize: "0.95rem" }}>
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>1. Information We Collect</h2>
            <p>
              We adhere to strict data minimization principles. We only collect the minimal information necessary to deliver educational materials and preserve platform integrity:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li><strong>Account Credentials:</strong> Name, lowercase email address, and cryptographically salted password hashes (bcrypt with 10 rounds). Plaintext passwords are never stored or logged.</li>
              <li><strong>Academic Submissions:</strong> Uploaded notes, lab programs, comments, and resource ratings.</li>
              <li><strong>Security & Network Telemetry:</strong> Anonymized client IP addresses (validated via Cloudflare CIDR range verification), browser user agent signatures, and request latency to prevent denial-of-service and credential stuffing.</li>
              <li><strong>AI Assistant Queries:</strong> User questions directed to our academic chatbot are processed via secure API endpoints (Groq inference) solely to formulate instant study explanations.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>2. Purpose & Legal Basis of Processing</h2>
            <p>Your data is processed strictly for legitimate educational and security purposes:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Delivering branch and semester curriculums tailored to your academic focus.</li>
              <li>Authenticating sessions securely using short-lived signed JSON Web Tokens (JWT).</li>
              <li>Safeguarding student accounts with adaptive CAPTCHA challenges upon repeated failed login attempts.</li>
              <li>Sending requested password-reset instructions via transactional email services.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>3. Data Sharing & Third-Party Infrastructure</h2>
            <p>
              <strong>We do not sell, rent, or monetize your personal information.</strong> Third-party infrastructure sub-processors are contracted under rigorous privacy standards:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li><strong>MongoDB Atlas:</strong> Encrypted enterprise cloud database storage with TLS 1.3 in-transit and AES-256 at-rest protection.</li>
              <li><strong>Cloudflare:</strong> Reverse proxy, Edge CDN caching, DDoS mitigation, and SSL/TLS termination.</li>
              <li><strong>EmailJS:</strong> Transactional email delivery service for password reset requests.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>4. Data Retention, Soft Deletion & Right to Erasure</h2>
            <p>
              User profiles are retained during your active period of university study. Academic resources employ transparent soft deletion (setting a <code>deletedAt</code> timestamp) ensuring immediate exclusion from public search indexes while preserving historical audit logs.
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              Under applicable data protection guidelines, you have the right to request access to, rectification of, or complete erasure of your personal data. To initiate an account deletion request, email <a href="mailto:jntucircle@gmail.com" style={{ color: "#38bdf8" }}>jntucircle@gmail.com</a> from your registered address.
            </p>
          </section>

          <section style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>5. Contact Our Privacy Officer</h2>
            <p>
              For privacy inquiries, data subject access requests, or security disclosures, please contact:{" "}
              <strong>JNTU Circle Administration</strong> at{" "}
              <a href="mailto:jntucircle@gmail.com" style={{ color: "#38bdf8", fontWeight: "600" }}>jntucircle@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
