import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";

function Login() {
const navigate = useNavigate();

const [form, setForm] = useState({
email: "",
password: "",
});

const handleChange = (e) => {
setForm({
...form,
[e.target.name]: e.target.value,
});
};

const handleSubmit = async (e) => {
e.preventDefault();

try {
  // Login request
  const res = await API.post("/auth/login", form);

  // Get token and user details
  const { token, user } = res.data;

  // Check if token exists
  if (!token) {
    alert("Login failed: Token not received");
    return;
  }

  // Save JWT token
  localStorage.setItem("token", token);

  // Save user information
  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );

  console.log("Login successful");
  console.log("User:", user);
  console.log("Token saved:", token);

  alert("Login Successful");

  // Only admin can access dashboard
  if (user.role === "admin") {
    navigate("/dashboard");
  } else {
    alert("Access denied. Admin only.");
    navigate("/login");
  }
} catch (err) {
  console.error("Login Error:", err);

  alert(
    err.response?.data?.message ||
      "Login Failed"
  );
}

};

return (
<div className="login-page">
<form className="login-form" onSubmit={handleSubmit} >
<h2>Login</h2>

    {/* Email */}
    <input
      type="email"
      name="email"
      placeholder="Email"
      value={form.email}
      onChange={handleChange}
      required
    />

    {/* Password */}
    <input
      type="password"
      name="password"
      placeholder="Password"
      value={form.password}
      onChange={handleChange}
      required
    />

    {/* Forgot Password */}
    <p>
      <Link to="/forgot-password">
        Forgot Password?
      </Link>
    </p>

    {/* Login Button */}
    <button type="submit">
      Login
    </button>

    {/* Register Link */}
    <p>
      Don't have an account?{" "}
      <Link to="/register">
        Register
      </Link>
    </p>
  </form>
</div>

);
}

export default Login;