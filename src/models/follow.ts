import mongoose from "mongoose";
import User from "./user"
const followSchema = new mongoose.Schema(
  {
    //who is make the following
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: User,
      index: true,
    },

    //   the person who is being be followed
    following: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: User,
      index: true,
    },
    createdId: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    status: {
      type: String,
      enum: ["active", "pending", "blocked"],
      default: "active",
    },
  },
  {
    timestamps: true, //update createdId automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true }); //prevent duplicate following
const Follow = mongoose.model("Follow", followSchema);
export default Follow;
