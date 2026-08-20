import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
const token = localStorage.getItem("token");
const userData = localStorage.getItem("user");

let user = null;

try {
user = userData ? JSON.parse(userData) : null;
} catch (error) {
console.error("Invalid user data:", error);
localStorage.removeItem("user");
}

// User is not logged in
if (!token) {
return <Navigate to="/login" replace />;
}

// User is logged in but is not an admin
if (!user || user.role !== "admin") {
return <Navigate to="/" replace />;
}

// User is an admin
return children;
}

export default AdminRoute;