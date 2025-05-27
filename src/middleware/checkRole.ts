import { Request, Response, NextFunction } from "express";
import logger  from "../utils/logger";
export const allowedRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction):void => {
    if (!req.user || !req.user.roles) {
        res.status(401).json({
            error: "Authentication required",
        });
        return
    }

    const userRoles = req.user?.roles;
    logger.debug(req.user)
    logger.info(userRoles)
    const hasRequiredRole = (userRoles as string[]).some((role) =>
      allowedRoles.includes(role)
    );
    if (hasRequiredRole) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Insufficient permissions." });
    }
  };
};
