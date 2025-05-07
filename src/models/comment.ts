import mongoose from "mongoose";
import User from './user'
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      max: 500,
      validate: { validator: (V) => V.trim().length > 0 },
      message: "comment cannot be empty",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    likes: [{ type: Number, default: 0, min: 0 }],
    status: {
      type: String,
      enum: ["active", "deleted", "flagged"],
      default: "active",
    },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// commentSchema.virtual("URL").get(function () {
//   return `comments/${this._id}`;
// });

export default mongoose.model("Comment", commentSchema);
