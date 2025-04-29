import express from "express";
import postRoutes from "./routes/post_route";
import followRoutes from "./routes/follow_route";
import commentRoutes from "./routes/comment_route";
import authRoutes from "./routes/auth_route";
import connectDB from "./lib/db";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import RedisService from "./services/redis.services";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

connectDB();

const redisService = new RedisService();
(async () => {
  await redisService.connect();
})();

app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/auth", authRoutes);


export default app;
