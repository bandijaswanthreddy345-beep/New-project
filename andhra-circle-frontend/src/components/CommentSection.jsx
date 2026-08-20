import { useEffect, useState } from "react";
import API from "../api/api";
import "./CommentSection.css";

function CommentSection({ noteId }) {
  const [comments, setComments] = useState([]);

  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // GET COMMENTS
  // ==========================================

  const fetchComments = async () => {
    if (!noteId) return;

    try {
      const res = await API.get(`/comments/note/${noteId}`);

      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Comments Error:", error);
      setComments([]);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [noteId]);

  // ==========================================
  // POST COMMENT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      await API.post("/comments", {
        note: noteId,
        name: name.trim(),
        email: email.trim(),
        comment: comment.trim(),
      });

      setComment("");

      await fetchComments();
    } catch (error) {
      console.error("Post Comment Error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to post comment"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LIKE
  // ==========================================

  const handleLike = async (id) => {
    try {
      await API.put(`/comments/${id}/like`);
      await fetchComments();
    } catch (error) {
      console.error("Like Error:", error);
    }
  };

  // ==========================================
  // DISLIKE
  // ==========================================

  const handleDislike = async (id) => {
    try {
      await API.put(`/comments/${id}/dislike`);
      await fetchComments();
    } catch (error) {
      console.error("Dislike Error:", error);
    }
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // AVATAR LETTER
  // ==========================================

  const getInitial = (userName) => {
    if (!userName) return "?";

    return userName.trim().charAt(0).toUpperCase();
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <section className="comments-section">

      {/* ======================================
          COMMUNITY HEADER
      ======================================= */}

      <div className="comments-header">

        <div className="comments-heading">

          <div className="comments-icon">
            <span>💬</span>
          </div>

          <div className="comments-heading-content">

            <h2>Comments</h2>

            <p>
              Share your thoughts, questions, or
              feedback about these notes.
            </p>

          </div>

        </div>

        <div className="comments-count">
          {comments.length}{" "}
          {comments.length === 1
            ? "COMMENT"
            : "COMMENTS"}
        </div>

      </div>

      {/* ======================================
          COMMENT FORM
      ======================================= */}

      <form
        className="comment-form"
        onSubmit={handleSubmit}
      >

        <div className="comment-form-title-wrapper">

          <div className="comment-form-title-icon">
            ✎
          </div>

          <div>
            <h3 className="comment-form-title">
              Leave a comment
            </h3>

            <p className="comment-form-subtitle">
              Your feedback can help other students too.
            </p>
          </div>

        </div>

        {/* NAME + EMAIL */}

        <div className="comment-form-row">

          <div className="comment-form-field">

            <label htmlFor="comment-name">
              Name
            </label>

            <input
              id="comment-name"
              type="text"
              className="comment-field"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>

          <div className="comment-form-field">

            <label htmlFor="comment-email">
              Email
            </label>

            <input
              id="comment-email"
              type="email"
              className="comment-field"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>

        </div>

        {/* COMMENT */}

        <div className="comment-form-field comment-message-field">

          <label htmlFor="comment-message">
            Comment
          </label>

          <textarea
            id="comment-message"
            className="comment-textarea"
            placeholder="Write your comment..."
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
            rows={4}
          />

        </div>

        {/* SUBMIT */}

        <div className="comment-submit-row">

          <div className="comment-privacy">
            <span className="privacy-icon">
              i
            </span>

            <span>
              Your email will not be displayed publicly.
            </span>
          </div>

          <button
            type="submit"
            className="comment-submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="comment-spinner"></span>
                Posting...
              </>
            ) : (
              <>
                <span>➤</span>
                Post Comment
              </>
            )}
          </button>

        </div>

      </form>

      {/* ======================================
          COMMENTS LIST
      ======================================= */}

      <div className="comments-list">

        {comments.length === 0 ? (

          <div className="comments-empty">

            <div className="comments-empty-icon">
              💬
            </div>

            <h3>No comments yet</h3>

            <p>
              Be the first student to share your
              thoughts about this note.
            </p>

          </div>

        ) : (

          comments.map((item) => (

            <article
              className="comment-item"
              key={item._id}
            >

              {/* LEFT BORDER */}

              <div className="comment-item-accent"></div>

              {/* COMMENT HEADER */}

              <div className="comment-top">

                <div className="comment-user">

                  <div className="comment-avatar">
                    {getInitial(item.name)}
                  </div>

                  <div className="comment-user-info">

                    <div className="comment-user-name">
                      {item.name}
                    </div>

                    <div className="comment-date">
                      {formatDate(item.createdAt)}
                    </div>

                  </div>

                </div>

              </div>

              {/* COMMENT TEXT */}

              <div className="comment-body">

                <p>
                  {item.comment}
                </p>

              </div>

              {/* ACTIONS */}

              <div className="comment-actions">

                <button
                  type="button"
                  onClick={() =>
                    handleLike(item._id)
                  }
                  className="comment-action-button comment-like-button"
                >
                  <span>👍</span>
                  <span className="comment-action-count">
                    {item.likes || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDislike(item._id)
                  }
                  className="comment-action-button comment-dislike-button"
                >
                  <span>👎</span>
                  <span className="comment-action-count">
                    {item.dislikes || 0}
                  </span>
                </button>

                <button
                  type="button"
                  className="comment-action-button comment-reply-button"
                >
                  <span>↩</span>
                  <span>Reply</span>
                </button>

              </div>

            </article>

          ))

        )}

      </div>

    </section>
  );
}

export default CommentSection;