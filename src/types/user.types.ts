import { Types } from "mongoose";
import mongoose from "mongoose";
export interface IUser extends mongoose.Document {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  password: string;
  roles: string[];
  failedLoginAttempts: number;
  lockUntil: Date | null;
  profilePicture: string;
  isLocked: boolean;
  refreshToken: string;
  createAt: Date;
}
//Data Transfer Object
// Response DTO excludes sensitive fields
export type UserDTO = Pick<
  IUser,
  "_id" | "name" | "username" | "email" | "profilePicture"
> & {
  createAt?: Date;
};
