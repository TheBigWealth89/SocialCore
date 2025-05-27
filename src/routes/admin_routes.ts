import { Router } from "express";
import { authorization } from "../middleware/authMiddleware";
import { allowedRoles } from "../middleware/checkRole";
import { ROLES } from "../models/user.model";
import authController from "../controller/authController";

const adminRoutes = Router();
adminRoutes.get(
  "/Dashboard",
  authorization,
  allowedRoles([ROLES.admin]),
  authController.getAllUsers
);

export default adminRoutes
