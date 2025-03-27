import { Router } from "express";
const authRouter = Router();

authRouter.post("/register");
authRouter.post("/login");
authRouter.post("/logout");
authRouter.post("/refresh-token");
authRouter.get("/me");

export default authRouter;
