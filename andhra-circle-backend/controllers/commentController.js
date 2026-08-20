const Comment = require("../models/Comment");

// ==========================================
// CREATE COMMENT
// ==========================================

exports.createComment = async (req, res) => {
try {
const {
note,
name,
email,
comment,
} = req.body;


if (!note) {
  return res.status(400).json({
    message: "Note ID is required",
  });
}

if (!name) {
  return res.status(400).json({
    message: "Name is required",
  });
}

if (!email) {
  return res.status(400).json({
    message: "Email is required",
  });
}

if (!comment) {
  return res.status(400).json({
    message: "Comment is required",
  });
}

const newComment = await Comment.create({
  note,
  name,
  email,
  comment,
});

res.status(201).json({
  success: true,
  comment: newComment,
});


} catch (error) {
console.error(
"Create Comment Error:",
error
);


res.status(500).json({
  message: error.message,
});


}
};

// ==========================================
// GET COMMENTS FOR A NOTE
// ==========================================

exports.getComments = async (req, res) => {
try {
const comments = await Comment.find({
note: req.params.noteId,
}).sort({
createdAt: -1,
});


res.status(200).json(comments);


} catch (error) {
console.error(
"Get Comments Error:",
error
);


res.status(500).json({
  message: error.message,
});


}
};

// ==========================================
// LIKE COMMENT
// ==========================================

exports.likeComment = async (req, res) => {
try {
const comment =
await Comment.findById(
req.params.id
);


if (!comment) {
  return res.status(404).json({
    message: "Comment not found",
  });
}

comment.likes += 1;

await comment.save();

res.status(200).json(comment);


} catch (error) {
res.status(500).json({
message: error.message,
});
}
};

// ==========================================
// DISLIKE COMMENT
// ==========================================

exports.dislikeComment = async (req, res) => {
try {
const comment =
await Comment.findById(
req.params.id
);


if (!comment) {
  return res.status(404).json({
    message: "Comment not found",
  });
}

comment.dislikes += 1;

await comment.save();

res.status(200).json(comment);


} catch (error) {
res.status(500).json({
message: error.message,
});
}
};

// ==========================================
// DELETE COMMENT
// ==========================================

exports.deleteComment = async (req, res) => {
try {
const comment =
await Comment.findByIdAndDelete(
req.params.id
);


if (!comment) {
  return res.status(404).json({
    message: "Comment not found",
  });
}

res.status(200).json({
  message: "Comment deleted successfully",
});


} catch (error) {
res.status(500).json({
message: error.message,
});
}
};
