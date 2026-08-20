import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const res = await API.post("/auth/forgot-password", {
        email,
      });

      setMessage(res.data.message);

      // Testing only
      console.log("Reset Token:", res.data.resetToken);
      console.log("Reset URL:", res.data.resetUrl);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong"
      );
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        <h2>Forgot Password</h2>

        <p>
          Enter your registered email address to reset
          your password.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">
          Send Reset Link
        </button>

        {message && (
          <p style={{ color: "green" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        <p>
          Remember your password?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;