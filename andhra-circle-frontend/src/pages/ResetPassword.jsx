import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Invalid reset link. Token is missing.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      console.log("Reset token:", token);

      const res = await API.post(
        `/auth/reset-password/${token}`,
        {
          password,
        }
      );

      alert(res.data.message);

      navigate("/login");
    } catch (err) {
      console.error("Password reset error:", err);

      alert(
        err.response?.data?.message ||
          "Password Reset Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        <h2>Reset Password</h2>

        <p>Enter your new password.</p>

        <input
          type="password"
          placeholder="Enter New Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          required
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Resetting Password..."
            : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;