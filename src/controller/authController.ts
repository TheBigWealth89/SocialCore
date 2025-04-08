import { Request, Response, NextFunction } from "express";
import User from "../models/user";
import { hash, compare } from "bcrypt";

import {
  generateTokens,
  isTokenBlacklisted,
  addToBlacklist,
} from "../utils/tokenUtils";
import { LoginError } from "../error/customErrors";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "User already exists!" });
      return;
    }

    const saltRound = 10;
    ``;
    const hashedPassword = await hash(password, saltRound);
    console.log(`Hashed password ${hashedPassword}`);

    console.log(`Comparing: ${password} vs ${hashedPassword}`);
    const isMatch = await compare(password, hashedPassword);
    console.log(`Password match: ${isMatch}`); // Should be true

    const user = new User({ email, username, password: hashedPassword });
    await user.save();
    const tokens = generateTokens({ userId: user.id });
    res.status(201).json({
      user: { id: user._id, email: user.email, username: user.username },
      tokens,
    });
  } catch (error) {
    console.error("Register error", error);
    next(error);
  }
};

//login
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new LoginError("Email and Password are required", 400);
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new LoginError("Invalid credentials", 401);
    }
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      throw new LoginError("Invalid credentials", 403);
    }
    await User.updateOne({ email }, { $set: { isLocked: false } });

    if (user.isLocked) {
      throw new LoginError("Account temporarily locked", 401);
    }

    const token = generateTokens({ userId: user._id, role: "user" });
    res
      .status(201)
      .json({ user: { id: user._id, email: user.email, role: "user" }, token });

    // const { refreshToken } = generateTokens({ userId: user._id, role: "user" });
    // await redisClient.setEx(
    //   `refresh:${user._id}`,
    //   7 * 24 * 3600, // 7 days
    //   refreshToken
    // );
  } catch (error) {
    next(error);

    // Handle specific error types
    if (error instanceof LoginError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.statusCode,
      });
    }

    console.error("Login error:", error);
    res.status(500).json({
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Authentication failed",
    });
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get and validate Authorization header
    const authHeader = req.header("Authorization");
    console.log("Authorization Header:", authHeader); // Debug log

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Authorization header missing or malformed" });
      return;
    }

    // 2. Extract and clean token
    const token = authHeader.replace("Bearer ", "").trim();
    console.log("Extracted Token:", token); // Debug log

    if (!token) {
      res.status(401).json({ error: "Token not provided" });
      return;
    }

    // 3. Verify token structure first (quick check)
    if (token.split(".").length !== 3) {
      res.status(401).json({ error: "Invalid token structure" });
      return;
    }

    // let decoded;
    // try {
    //   if (!process.env.ACCESS_TOKEN_SECRET) {
    //     throw new Error("ACCESS_TOKEN_SECRET is not configured");
    //   }

    //   decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
    //     ignoreExpiration: true,
    //   });
    //   console.log("Decoded Token:", decoded); // Debug log
    // } catch (err) {
    //   console.error("Token Verification Error:", err);

    //   if (err instanceof jwt.JsonWebTokenError) {
    //     res.status(401).json({
    //       error: "Invalid token",
    //       details: err.message,
    //     });
    //     return;
    //   }
    //   throw err;
    // }

    // Check if already blacklisted
    if (isTokenBlacklisted(token)) {
      res.status(400).json({ error: "Already logged out" });
      return;
    }

    // Rest of your logout logic...
    addToBlacklist(token);

    // await BlacklistedToken.create({
    //   token,
    //   expiresAt:
    //     typeof decoded !== "string" && decoded.exp
    //       ? new Date(decoded.exp * 1000)
    //       : null,
    // });

    const userId = req.body.userId;
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $unset: { refreshToken: "" },
      });
    }

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Successfully logged out" });
    return;
  } catch (error) {
    console.error("Logout error:", error);
    next(error);
  }
};
// Check Redis client connection
// if (!redisClient.isReady) {
//   console.error("Redis client is not connected");
//   res.status(503).json({ error: "Service temporarily unavailable" });
//   return;
// }

// const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT!);
// if (typeof decoded !== "string" && decoded.exp) {
//   const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
//   await redisClient.setEx(
//     `blacklist:${token}`,
//     expiresIn > 0 ? expiresIn : 3600,
//     "revoked"
//   );
// }
