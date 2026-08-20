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

module.exports = mongoose.model(
"Comment",
commentSchema
);
