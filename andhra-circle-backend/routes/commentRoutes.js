const express = require("express");

const router = express.Router();

const {
createComment,
getComments,
likeComment,
dislikeComment,
deleteComment,
} = require("../controllers/commentController");

// ==========================================
// CREATE COMMENT
// ==========================================

router.post("/", createComment);

// ==========================================
// GET COMMENTS FOR NOTE
// ==========================================

router.get(
"/note/:noteId",
getComments
);

// ==========================================
// LIKE COMMENT
// ==========================================

router.put(
"/:id/like",
likeComment
);

// ==========================================
// DISLIKE COMMENT
// ==========================================

router.put(
"/:id/dislike",
dislikeComment
);

// ==========================================
// DELETE COMMENT
// ==========================================

router.delete(
"/:id",
deleteComment
);

module.exports = router;
