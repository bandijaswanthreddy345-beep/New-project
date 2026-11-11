const Comment = require("../models/Comment");
const recordAuditLog = require("../services/auditLogger");

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

// SECURITY: only plain strings, with sane lengths (blocks NoSQL
// operator objects and giant payloads)
if (
  typeof note !== "string" ||
  typeof name !== "string" ||
  typeof email !== "string" ||
  typeof comment !== "string"
) {
  return res.status(400).json({
    message: "Invalid comment data",
  });
}

if (name.length > 100 || email.length > 254 || comment.length > 2000) {
  return res.status(400).json({
    message: "Name, email or comment is too long",
  });
}

const newComment = await Comment.create({
  note,
  name: name.trim(),
  email: email.trim(),
  comment: comment.trim(),
});

// The page promises "your email will not be displayed publicly",
// so the email is never sent back.
const publicComment = newComment.toObject();
delete publicComment.email;

res.status(201).json({
  success: true,
  comment: publicComment,
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
// SECURITY: commenters' emails are private; never return them publicly
const comments = await Comment.find({
note: req.params.noteId,
}).select("-email").sort({
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
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    ).select("-email");

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

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
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $inc: { dislikes: 1 } },
      { new: true }
    ).select("-email");

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

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

if (req.user) {
  await recordAuditLog({
    adminId: req.user._id,
    action: "delete",
    resourceType: "Comment",
    resourceId: req.params.id,
    route: req.originalUrl,
    ip: req.ip,
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
