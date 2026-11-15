const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
{
note: {
type: mongoose.Schema.Types.ObjectId,
ref: "Note",
required: true,
},


name: {
  type: String,
  required: true,
  trim: true,
},

email: {
  type: String,
  required: true,
  trim: true,
},

comment: {
  type: String,
  required: true,
  trim: true,
},

likes: {
  type: Number,
  default: 0,
},

dislikes: {
  type: Number,
  default: 0,
},


},
{
timestamps: true,
}
);

commentSchema.plugin(require("./plugins/softDelete"));

// Optimize queries fetching comments by note, excluding soft-deleted, sorted by creation date
commentSchema.index({ note: 1, deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model(
"Comment",
commentSchema
);
