import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { [key: string]: any };
    }
  }
}

import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/tokenUtils";

export const authorization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Track if we've sent a response
  let responseSent = false;

  const sendResponse = (status: number, data: any): void => {
    if (!responseSent) {
      responseSent = true;
      res.status(status).json(data);
    }
  };

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      sendResponse(401, { message: "Authorization header missing" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      sendResponse(401, { message: "Access token missing" });
      return;
    }

    const decoded = (await verifyAccessToken(token)) as { [key: string]: any };

    if (!decoded) {
      sendResponse(401, { message: "Invalid token or blacklisted" });
    }
    req.user = decoded;

    // Only proceed if we haven't sent a response
    if (!responseSent) {
      next();
    }
  } catch (err) {
    if (responseSent) return;

    const message =
      err instanceof jwt.TokenExpiredError
        ? {
            message: "Token expired",
            expiredAt: (err as jwt.TokenExpiredError).expiredAt,
          }
        : {
            message: "Invalid token",
            error: err instanceof Error ? err.message : "Unknown error",
          };

    sendResponse(401, message);
  }
};
