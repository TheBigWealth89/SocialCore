import { Request, Response } from "express";
import User from "../models/user";
import { hash, compare } from "bcrypt";
import {
  generateTokens,
  isTokenBlacklisted,
  addBlacklist,
} from "../utils/tokenUtils";
import { LoginError } from "../error/customErrors";
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exist!" });
      return;
    }
    const saltRound = 10;
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
  }
};

//login
export const loginUser = async (req: Request, res: Response): Promise<any> => {
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
  } catch (error) {
    // Handle specific error types
    if (error instanceof LoginError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.statusCode,
      });
    }

    // Generic server error (don't expose details in production)
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
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer", "");

    if (!token) {
      res.status(401).json({ error: "Token not provided" });
      return;
    }

    if (token && isTokenBlacklisted(token.trim())) {
      res.status(400).json({ error: "Token already invalidated" });
      return;
    }
    //invalidate the token
    if (token) {
      addBlacklist(token.trim());
    } else {
      res.json({ error: "Token not valid" });
    }

    const userId = req.body.userId; // Assuming userId is passed in the request body
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
    res.status(201).json({ message: "Successfully logged out " });
  } catch (error) {
    console.error("Logout error", error);
    res.status(500).json({ error: "Logout failed" });
  }
};
