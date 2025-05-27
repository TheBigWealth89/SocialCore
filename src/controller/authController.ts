import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { UserDTO } from "../types/user.types";
import { hash, compare } from "bcrypt";
import logger from "../utils/logger";
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

      const userResponse: UserDTO = {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
        createAt: user.createAt,
      };

      res.status(201).json({
        user: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  //Login user

  async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    const identifier =
      req.body.identifier || req.body.username || req.body.email;
    const password = req.body.password;

    try {
      const MAX_FAILED_ATTEMPTS = 5;
      const LOCK_DURATION_TIME = 2;

      if (!identifier || !password) {
        //Import custom error from errors folder
        throw new LoginError(
          "Username or Email and Password are required",
          400
        );
      }
      const cleanIdentifier = identifier.toLowerCase().trim();

      const user = await User.findOne({
        $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
      }).select("+password +failedLoginAttempts +lockUntil");
      console.log("User exists", user);
      logger.info(user);
      // Timing attack-safe comparison
      const dummyHash = await hash("dummy", 10);
      if (!user) {
        //This ensures the compare function always runs, preventing timing attacks.
        await compare(password, dummyHash);
        throw new LoginError("Invalid credentials", 401);
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        const minutesLeft = Math.ceil(
          (user.lockUntil.getTime() - new Date().getTime()) / 60000
        );
        throw new LoginError(
          `Account locked due to too many attempts. Try again in ${minutesLeft} minutes`,
          403
        );
      }

      const isMatch = await compare(password, user.password!);
      if (!isMatch) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = new Date(
            Date.now() + LOCK_DURATION_TIME * 60 * 1000
          );
          user.isLocked = true;
          user.failedLoginAttempts = 0;
          await user.save();
          throw new LoginError(
            `Invalid credentials. Account locked for ${LOCK_DURATION_TIME} minutes`
          );
        }
        await user.save(); //Save changes

        throw new LoginError("Invalid credentials", 401);
      }
      //Handle correct password (Login Successful)
      //Reset login attempts and duration
      user.failedLoginAttempts = 0;
      user.lockUntil = null;

      // Generate tokens with proper expiration
      const tokens = generateTokens({ userId: user._id, roles: user.roles });


      await user.save(); // Save everything at once attempts reset + token

      await saveRefreshToken(user._id, tokens.refreshToken);

      // Set HTTP-only cookie
      res.cookie("refreshToken", tokens.refreshToken, config.jwt.cookieOptions);

      const loginResponse: UserDTO = {
        name: user.name,
        _id: user._id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
      };

      res.status(200).json({
        user: loginResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      next(error);
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
        roles: decoded.roles,
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

  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await User.find();
      res.status(200).json({
        users: users,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default new AuthController();
