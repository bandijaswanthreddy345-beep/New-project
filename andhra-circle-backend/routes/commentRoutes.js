const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const validateObjectId = require("../middleware/validateObjectId");

const {
  createComment,
  getComments,
  likeComment,
  dislikeComment,
  deleteComment,
} = require("../controllers/commentController");

// ==========================================
// CREATE COMMENT (public, rate limited against spam)
// ==========================================

router.post(
  "/",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: "You are commenting too fast. Please wait a few minutes.",
  }),
  createComment
);

// ==========================================
// GET COMMENTS FOR NOTE
// ==========================================

router.get("/note/:noteId", validateObjectId("noteId"), getComments);

// ==========================================
// LIKE / DISLIKE COMMENT
// ==========================================

router.put("/:id/like", validateObjectId("id"), likeComment);

router.put("/:id/dislike", validateObjectId("id"), dislikeComment);

// ==========================================
// DELETE COMMENT (admin only)
// ==========================================

router.delete("/:id", auth, validateObjectId("id"), deleteComment);

module.exports = router;
