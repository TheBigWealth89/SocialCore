import { Router } from "express";
import authController from "../controller/authController";

import {
  registerInput,
  loginInput,
  authMiddleware,
} from "../middleware/validateRegisterInput";

const authRouter = Router();
//**** signUp route *****/
authRouter.post("/register", registerInput, authController.signup);
//**** login route *****/
authRouter.post("/login", loginInput, authController.login);
//**** logout route *****/
authRouter.post("/logout", authMiddleware, authController.logout);
//**** token rotation route *****/
authRouter.post("/refresh", authController.refresh);
//**** retrieve user data route  *****/
authRouter.get("/me");

export default authRouter;
