import express from "express";
import postRoutes from "./routes/post_route";
import followRoutes from "./routes/follow_route";
import commentRoutes from "./routes/comment_route";
import authRoutes from "./routes/auth_route";
import connectDB from "./lib/db";

const app = express();
app.use(express.json());
connectDB();

app.use("api/posts/", postRoutes);
app.use("api/follow/", followRoutes);
app.use("api/comment/", commentRoutes);
app.use("/api/auth", authRoutes);
export default app;
