import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../models/user";
import { hash, compare } from "bcrypt";
import {
  generateTokens,
  addToBlacklist,
  removeRefreshToken,
  verifyRefreshToken,
  saveRefreshToken,
} from "../utils/tokenUtils";
import config from "../config/config";
import RefreshToken from "../models/RefreshToken";
import { LoginError } from "../error/customErrors";
import { sendEmail } from "../utils/resend";
import { MongoServerError } from "mongodb";
/**
 *
 *
 * @class AuthController
 */
class AuthController {
  // Register user
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { name, username, email, password, profilePicture } = req.body;
    try {
      const saltRound = 10;
      const hashedPassword = await hash(password, saltRound);

      const user = new User({
        email,
        name,
        username,
        password: hashedPassword,
        profilePicture,
      });

      await user.save();

      await sendEmail(username, email);

      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
          profilePicture: user.profilePicture,
        },
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(error.errors).reduce<
          Record<string, string>
        >((acc, { path, message }) => {
          acc[path] = message;
          return acc;
        }, {});
        res.status(400).json({ errors });
        return;
      }

      // Handle duplicate key errors (MongoDB error code 11000)
      if (error instanceof MongoServerError && error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        res.status(400).json({
          errors: { [field]: `${field} already exists` },
        });
      }
      // Forward to Express error handler
      next(error);
    }
  }

  //Login user
  async login(req: Request, res: Response): Promise<any> {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        //Import custom error from errors folder
        throw new LoginError("Email and Password are required", 400);
      }

      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        throw new LoginError("Invalid credentials", 401);
      }

      await User.updateOne({ email }, { $set: { isLocked: false } });

      if (user.isLocked) {
        throw new LoginError("Account temporarily locked", 401);
      }

      // Generate tokens with proper expiration
      const tokens = generateTokens({ userId: user._id, role: "user" });

      await saveRefreshToken(user._id, tokens.refreshToken);
      res.cookie("refreshToken", tokens.refreshToken, config.jwt.cookieOptions);

      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          profilePicture: user.profilePicture,
          role: "user",
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
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
  }

  // Logout user
  async logout(req: Request, res: Response): Promise<any> {
    // Track response
    let responseSent = false;

    const sendResponse = (status: number, data: any) => {
      if (!responseSent) {
        responseSent = true;
        return res.status(status).json(data);
      }
      return null;
    };

    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return sendResponse(401, { message: "Token missing" });
      }

      // Perform logout operations
      await addToBlacklist(token);

      // Remove the refresh token
      const { refreshToken } = req.cookies;
      if (refreshToken) {
        await removeRefreshToken(refreshToken);
        res.clearCookie("refreshToken");
      }

      // This will be the ONLY response
      return sendResponse(200, { message: "Successfully logged out" });
    } catch (err) {
      return sendResponse(500, {
        message: "Logout failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  //refresh
  async refresh(req: Request, res: Response): Promise<any> {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const cookieToken = req.cookies.refreshToken;
    const oldToken = headerToken || cookieToken;

    console.log("Using refresh token:", oldToken);

    console.log("Incoming refresh token:", oldToken?.substring(0, 20) + "...");

    if (!oldToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }
    console.log("Header refreshToken:", req.headers["authorization"]);
    console.log("Cookie refreshToken:", req.cookies.refreshToken);

    const tokens = await RefreshToken.find({});
    tokens.forEach((doc) => {
      console.log("Stored token😋:", doc.token);
    });

    try {
      //Verify THE PROVIDED TOKEN ONLY
      const decoded = await verifyRefreshToken(oldToken);
      if (!decoded?.userId) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      //Generate new tokens
      const tokens = generateTokens({
        userId: decoded.userId,
        role: decoded.role || "user",
      });

      //Save new refresh token (invalidates old one)
      await saveRefreshToken(decoded.userId, tokens.refreshToken);

      //Set new cookie
      res.cookie("refreshToken", tokens.refreshToken, config.jwt.cookieOptions);

      return res.status(200).json({
        accessToken: tokens.accessToken,
        // refreshToken: tokens.refreshToken, // For clients that don't use cookies
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
export default new AuthController();
