import mongoose from "mongoose";
const postSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String, default: "" },
  commentCount: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tags: { type: [String], default: [] },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Post ", postSchema);
