import { Router } from "express";
import { registerUser } from "../controller/authController";
const authRouter = Router();

authRouter.post("/register", registerUser);

authRouter.post("/login");
authRouter.post("/logout");
authRouter.post("/refresh-token");
authRouter.get("/me");

export default authRouter;
