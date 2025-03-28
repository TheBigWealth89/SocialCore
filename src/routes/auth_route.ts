import { Router } from "express";
import { registerUser, loginUser } from "../controller/authController";
const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout");
authRouter.post("/refresh-token");
authRouter.get("/me");

export default authRouter;
