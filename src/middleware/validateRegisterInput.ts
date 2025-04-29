import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { [key: string]: any };
    }
  }
}

import jwt from "jsonwebtoken";
import { verifyAccessToken, verifyRefreshToken } from "../utils/tokenUtils";
export const registerInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { username, email, password } = req.body;

  // Check for empty username first
  if (!username || username.trim() === "") {
    res.status(400).json({
      error: "Please enter a username.",
    });
    return;
  }

  // Then check for special characters
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  if (!usernameRegex.test(username)) {
    res.status(400).json({
      error: "No special characters allowed in username.",
    });
    return;
  }

  // Finally check length
  if (typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({
      error: "Username must be at least 3 characters long.",
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format." });
    return;
  }

  if (
    !password ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 16
  ) {
    res
      .status(400)
      .json({ error: "Password must be between 8 and 16 characters." });
    return;
  }

  next(); // Proceed to the next middleware or controller
};

// Login middleware
export const loginInput = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format." });
    return;
  }
  if (!password) {
    res.status(400).json({
      error: "Password is required",
    });
    return;
  }
  next();
};

export const authMiddleware = async (
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

// export const validateRefreshToken = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<any> => {
//   try {
//       const token = req.cookies.refreshToken;
//       if (!token) {
//           return res.status(401).json({ error: "Refresh token is missing" });
//       }

//       // Verify token signature and expiration
//       const decoded = await verifyRefreshToken(token);
//       if (!decoded) {
//           return res.status(401).json({ error: "Invalid refresh token" });
//       }

//       // Check if token exists in database
//       const tokenData = await RefreshToken.findOne({ token });
//       if (!tokenData) {
//           return res.status(401).json({ error: "Refresh token not found" });
//       }

//       req.user = decoded;
//       next();
//   } catch (error) {
//       console.error("Refresh token validation error:", error);
//       return res.status(500).json({ error: "Internal server error" });
//   }
// };