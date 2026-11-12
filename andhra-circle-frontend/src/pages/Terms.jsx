import React from "react";
import { Link } from "react-router-dom";
import "./Login.css";

function Terms() {
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
            <h1 style={{ fontSize: "2.25rem", fontWeight: "800", color: "#f8fafc", margin: 0, letterSpacing: "-0.025em" }}>Terms of Service</h1>
            <span style={{ color: "#94a3b8", fontSize: "0.875rem", background: "rgba(255, 255, 255, 0.06)", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>
              Version 2.0 · Effective Nov 2026
            </span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginTop: "0.75rem", marginBottom: 0 }}>
            Governing the access and use of the JNTU Circle academic repository, materials, and student services.
          </p>
        </div>

        {/* Content */}
        <div style={{ lineHeight: "1.8", fontSize: "0.95rem" }}>
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>1. Acceptance of Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Student", or "You") and <strong>JNTU Circle</strong> ("Platform", "we", "us", or "our"). By accessing our website, creating an account, or downloading academic materials, you confirm that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>2. Academic Educational Scope & Fair Use</h2>
            <p>
              JNTU Circle is an open academic resource platform designed exclusively for students, researchers, and faculty affiliated with engineering universities across Andhra Pradesh and Telangana (including JNTUK, JNTUH, JNTUA, and autonomous institutions). All syllabuses, question papers, lecture notes, laboratory programs, and grade calculators are hosted strictly for non-commercial, private educational research and study.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>3. User Accounts, Authentication & Security</h2>
            <p>
              To access personalized academic records or submit materials, you must register using an authentic name and email address. You agree to:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Maintain the confidentiality of your authentication credentials.</li>
              <li>Notify us immediately of any unauthorized access or breach of security.</li>
              <li>Acknowledge that accounts are protected with bcrypt cryptographic hashing, session token versioning, and rate-limiting security mechanisms.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>4. Intellectual Property & Academic Fair Dealing</h2>
            <p>
              University syllabuses and public exam question papers remain the respective intellectual property of their administering university boards. Contributed notes and solutions are uploaded under educational fair dealing guidelines. JNTU Circle respects intellectual property rights: if you are a copyright holder and believe any material infringes your rights, please submit a notice to <a href="mailto:jntucircle@gmail.com" style={{ color: "#38bdf8" }}>jntucircle@gmail.com</a> for immediate takedown review.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>5. AI Study Assistant & Algorithmic Guidance</h2>
            <p>
              The JNTU Circle interactive chatbot utilizes state-of-the-art LLM inference to assist students in understanding engineering definitions and formulas. While designed for high academic fidelity, AI-generated explanations are advisory only. Students are advised to verify answers against standard university textbooks and lecturer notes.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>6. Prohibited Conduct</h2>
            <p>Users shall not:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Deploy automated bots, spiders, or scrapers to extract bulk repository files without authorization.</li>
              <li>Circulate malicious executables, abusive commentary, or defamatory content.</li>
              <li>Attempt to circumvent security CAPTCHA challenges, rate limits, or network controls.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>7. Limitation of Liability</h2>
            <p>
              The platform and all materials are provided on an "as is" and "as available" basis without warranties of any kind. JNTU Circle shall not be liable for any direct, indirect, incidental, or consequential damages resulting from examination performance, schedule changes, or platform downtime.
            </p>
          </section>

          <section style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#67e8f9", marginBottom: "0.75rem", fontWeight: "700" }}>8. Contact & Official Inquiries</h2>
            <p>
              For legal notices, DMCA inquiries, or feedback regarding these Terms, contact our administrative support team at{" "}
              <a href="mailto:jntucircle@gmail.com" style={{ color: "#38bdf8", fontWeight: "600" }}>jntucircle@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Terms;
