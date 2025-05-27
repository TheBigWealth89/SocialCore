import mongoose from "mongoose";
import { IUser } from "../types/user.types";
export const ROLES = {
  user: "user",
  admin: "admin",
  moderator: "moderator",
};
const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: [true, "Name is required"] },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Username is required"],
      unique: [true, "Username already taken"],
      minlength: [3, "Username must be at least 3 characters"],
      validate: {
        validator: (v) => /^[a-zA-Z0-9]+$/.test(v),
        message: "No special characters allowed in username",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    roles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.user],
      required: true,
    },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
    profilePicture: { type: String, default: "" },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);


userSchema.pre('save', function(next) {
  // Example: Maybe you have logic that tries to *derive* isLocked?
  if (this.lockUntil && this.lockUntil > new Date()) {
      this.isLocked = true;
  } else {
      this.isLocked = false; // <-- !! This could be overwriting your 'true' !!
  }
  next();
});
const User = mongoose.model("User", userSchema);
export default User;
