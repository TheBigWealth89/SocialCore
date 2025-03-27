import mongoose from "mongoose";
const followSchema = new mongoose.Schema(
  {
    //who is make the following
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    //   the person who is being be followed
    following: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    createdId: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    status: {
      type: String,
      enum: ["active, pendding, blocked"],
      default: "active",
    },
  },
  {
    timestamps: true, //update createdId automativcally
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

followSchema.index({ folloer: 1, following: 1 }, { unique: true }); //prevent dupliacte following
const follow = mongoose.model("follow", followSchema);
export default follow;
