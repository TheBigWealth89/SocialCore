import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controller/authController";

import {
  registerInput,
  loginInput,
  verifyAuthForLogout,
} from "../middleware/validateRegisterInput";
const authRouter = Router();

authRouter.post("/register", registerInput, registerUser);
authRouter.post("/login", loginInput, loginUser);
authRouter.post("/logout", verifyAuthForLogout, logoutUser);
authRouter.post("/refresh-token");
authRouter.get("/me");

export default authRouter;
