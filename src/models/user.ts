import mongoose from "mongoose";
import { Types } from "mongoose";
export interface IUser extends mongoose.Document {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  password: string;
  profilePicture: string;
  isLocked: boolean;
  refreshToken: string;
}
const userSchema = new mongoose.Schema<IUser>({
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
  profilePicture: { type: String, default: "" },
  isLocked: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
})
const User = mongoose.model("User", userSchema);
export default User;
