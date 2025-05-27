import express from "express";
import postRoutes from "./routes/post_route";
import followRoutes from "./routes/follow_route";
import commentRoutes from "./routes/comment_route";
import authRoutes from "./routes/auth_route";
import adminRoutes from "./routes/admin_routes";
import connectDB from "./lib/db";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import redisServices from "./services/redis.services";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" })); // Increased body size limit
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    credentials: true, // Allow cookies to be sent with requests
  })
);

connectDB();


(async () => {
  await redisServices.connect();
})();

app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

export default app;
