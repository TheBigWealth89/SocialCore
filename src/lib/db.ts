import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in the environment variables");
    }
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to mongoDB", error);
  }
};

export default connectDB;
