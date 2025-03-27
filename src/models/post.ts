import mongoose from "mongoose";
const postSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tags: { type: [String], default: [] },
});

export default mongoose.model("post ", postSchema);
