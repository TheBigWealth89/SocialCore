import mongoose from "mongoose";
import User from "../models/user";

const contentBlockSchema = new mongoose.Schema({
  type: { type: String, enum: ["text", "image", "video"], required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true },
});
const postSchema = new mongoose.Schema({
  title: { type: String, trim: true, required: true, maxlength: 100 },
  blocks: [contentBlockSchema], // Array of  contents mixed blocks
  userId: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
  image: { type: String, default: "" },
  commentCount: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: User }],
  createdAt: { type: Date, default: Date.now },
});

//Update the createAt field before saving
postSchema.pre("save", function (next) {
  this.createdAt = new Date();
  next();
});

const Post = mongoose.model("Post ", postSchema);
export default Post;
