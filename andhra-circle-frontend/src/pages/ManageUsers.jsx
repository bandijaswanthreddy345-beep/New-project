import { useEffect, useState } from "react";
import API from "../api/api";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Get currently logged-in user
  const loggedInUser = JSON.parse(
    localStorage.getItem("user")
  );

  // ==========================================
  // Fetch Users
  // ==========================================
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await API.get("/users");

      setUsers(res.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // Change User Role
  // ==========================================
  const changeRole = async (id, currentRole) => {
    const newRole =
      currentRole === "admin"
        ? "student"
        : "admin";

    const confirmChange = window.confirm(
      `Are you sure you want to change this user's role to ${newRole}?`
    );

    if (!confirmChange) return;

    try {
      await API.put(`/users/${id}/role`, {
        role: newRole,
      });

      alert(
        `User role changed to ${newRole} successfully`
      );

      fetchUsers();
    } catch (err) {
      console.error(
        "Change Role Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to update user role"
      );
    }
  };

  // ==========================================
  // Delete User
  // ==========================================
  const deleteUser = async (id) => {
    // Prevent deleting yourself
    if (
      loggedInUser &&
      loggedInUser._id === id
    ) {
      alert(
        "You cannot delete your own account while logged in."
      );

      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/users/${id}`);

      alert("User Deleted Successfully");

      // Remove immediately from UI
      setUsers((previousUsers) =>
        previousUsers.filter(
          (user) => user._id !== id
        )
      );
    } catch (err) {
      console.error(
        "Delete User Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to delete user"
      );
    }
  };

  // ==========================================
  // Search Users
  // ==========================================
  const filteredUsers = users.filter(
    (user) => {
      const searchText =
        search.toLowerCase();

      return (
        user.name
          ?.toLowerCase()
          .includes(searchText) ||
        user.email
          ?.toLowerCase()
          .includes(searchText) ||
        user.role
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  // ==========================================
  // Render
  // ==========================================
  return (
    <div style={{ padding: "40px" }}>
      <h1>Manage Users</h1>

      <p>
        View, manage roles, and delete registered
        users.
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, email or role..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "12px",
          marginTop: "20px",
          marginBottom: "30px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          fontSize: "16px",
        }}
      />

      {/* Loading */}
      {loading && (
        <p>Loading users...</p>
      )}

      {/* No Users */}
      {!loading &&
        filteredUsers.length === 0 && (
          <p>No Users Found</p>
        )}

      {/* Users */}
      {!loading &&
        filteredUsers.map((user) => (
          <div
            key={user._id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>{user.name}</h3>

            <p>
              <strong>Email:</strong>{" "}
              {user.email}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              {user.role}
            </p>

            {/* Role Button */}
            <button
              onClick={() =>
                changeRole(
                  user._id,
                  user.role
                )
              }
            >
              {user.role === "admin"
                ? "Make Student"
                : "Make Admin"}
            </button>

            {/* Delete Button */}
            <button
              onClick={() =>
                deleteUser(user._id)
              }
              disabled={
                loggedInUser &&
                loggedInUser._id === user._id
              }
              style={{
                marginLeft: "15px",
                background: "red",
                color: "white",
                cursor:
                  loggedInUser &&
                  loggedInUser._id === user._id
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loggedInUser &&
                  loggedInUser._id === user._id
                    ? 0.5
                    : 1,
              }}
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  );
}

export default ManageUsers;