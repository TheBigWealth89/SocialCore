import { Router } from "express";
import AuthController from "../controller/authController";
import Authentication, { authorization } from "../middleware/authMiddleware"

const authRouter = Router();
//**** signUp route *****/
authRouter.post("/register", Authentication.registerInput, AuthController.signup);
//**** login route *****/
authRouter.post("/login",Authentication.loginInput, AuthController.login);
//**** logout route *****/
authRouter.post("/logout", authorization, AuthController.logout);
//**** token rotation route *****/
authRouter.post("/refresh", AuthController.refresh);
//**** retrieve user data route  *****/
authRouter.get("/me");

export default authRouter;
