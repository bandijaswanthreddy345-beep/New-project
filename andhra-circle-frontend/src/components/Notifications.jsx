import { useEffect, useState } from "react";
import API from "../api/api";
import defaultBanner from "../assets/banner.jpg.jpg.jpg";

function Notifications({ search = "" }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/notifications");

      setNotifications(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  const searchText = String(search)
    .trim()
    .toLowerCase();

  const filteredNotifications =
    notifications.filter((notification) => {
      if (!searchText) return true;

      return (
        notification.title
          ?.toLowerCase()
          .includes(searchText) ||
        notification.description
          ?.toLowerCase()
          .includes(searchText)
      );
    });

  const formatDate = (date) => {
    if (!date) {
      return "Date not available";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const handleDownload = async (
    notification
  ) => {
    try {
      await API.put(
        `/notifications/${notification._id}/download`
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                downloads:
                  (item.downloads || 0) + 1,
              }
            : item
        )
      );

      if (!notification.link) {
        alert("No file available.");
        return;
      }

      window.open(
        notification.link,
        "_blank"
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <section className="notification-section">
        <h2>Notifications</h2>

        <div className="papers-loading">
          Loading notifications...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="notification-section">
        <h2>Notifications</h2>

        <div className="error-state">
          <p>{error}</p>

          <button onClick={fetchNotifications}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="notification-section">
      <h2>Notifications</h2>

      {filteredNotifications.length ===
      0 ? (
        <div className="empty-state">
          No notifications found.
        </div>
      ) : (
        <div className="papers-grid">
          {filteredNotifications.map(
            (notification) => (
              <article
                className="resource-card"
                key={notification._id}
              >
                <div className="resource-image">
                  <img
                    src={defaultBanner}
                    alt={notification.title}
                  />

                  <span className="read-time">
                    Notification
                  </span>
                </div>

                <div className="resource-content">
                  <span className="resource-badge">
                    {notification.category ||
                      "GENERAL"}
                  </span>

                  <h3>
                    {notification.title}
                  </h3>

                  <p>
                    {
                      notification.description
                    }
                  </p>

                  <div className="resource-footer">
                    <span>
                      📅{" "}
                      {formatDate(
                        notification.publishedDate
                      )}
                    </span>
                  </div>

                  <div className="resource-stats">
                    <span>
                      👁{" "}
                      {notification.views ||
                        0}
                    </span>

                    <span>
                      ⬇{" "}
                      {notification.downloads ||
                        0}
                    </span>

                    <button
                      className="like-button"
                      onClick={async () => {
                        try {
                          await API.put(
                            `/notifications/${notification._id}/like`
                          );

                          setNotifications(
                            (prev) =>
                              prev.map(
                                (item) =>
                                  item._id ===
                                  notification._id
                                    ? {
                                        ...item,
                                        likes:
                                          (item.likes ||
                                            0) +
                                          1,
                                      }
                                    : item
                              )
                          );
                        } catch (error) {
                          console.error(
                            error
                          );
                        }
                      }}
                    >
                      ❤️{" "}
                      {notification.likes ||
                        0}
                    </button>
                  </div>

                  <div className="resource-buttons">
                    <a
                      href={
                        notification.link ||
                        "#"
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="view-pdf-button"
                      onClick={async () => {
                        try {
                          await API.put(
                            `/notifications/${notification._id}/view`
                          );

                          setNotifications(
                            (prev) =>
                              prev.map(
                                (item) =>
                                  item._id ===
                                  notification._id
                                    ? {
                                        ...item,
                                        views:
                                          (item.views ||
                                            0) +
                                          1,
                                      }
                                    : item
                              )
                          );
                        } catch (error) {
                          console.error(
                            error
                          );
                        }
                      }}
                    >
                      View Details
                    </a>

                    <button
                      className="download-pdf-button"
                      onClick={() =>
                        handleDownload(
                          notification
                        )
                      }
                    >
                      Download
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

export default Notifications;

